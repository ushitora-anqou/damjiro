import React, { useRef, useState, useCallback, useEffect } from 'react'
import {applyMiddleware, combineReducers, compose, createStore} from 'redux'
import { Provider, connect } from 'react-redux'
import styled from 'styled-components'
import YouTube from 'react-youtube'
import { persistStore, persistReducer } from 'redux-persist'
import storage from 'redux-persist/lib/storage'
import { PersistGate } from 'redux-persist/integration/react'
import ml5 from 'ml5'
import MIDIFile from 'midifile'
import MIDIEvents from 'midievents'
import MIDIPlayer from './MIDIPlayer'
import snackbarReducer from './reducers/SnackbarReducer'
import MessageSnackbar from './shared/MessageSnackbar'
import { ConnectedRouter, connectRouter, routerMiddleware } from "connected-react-router";
import {createBrowserHistory} from "history";
import AboutPage from "./pages/AboutPage";
import MakeGakufuPage from "./pages/MakeGakufuPage";
import {Redirect, Route, Switch} from "react-router";
import ErrorPage from "./pages/ErrorPage";
import SingGakufuPage from "./pages/SingGakufuPage";
import SingMIDIPage from "./pages/SingMIDIPage";

// material ui
import {
  Container,
  Input,
  TextField,
  InputLabel,
  InputAdornment,
  FormControl,
  Typography,
  makeStyles,
  CssBaseline,
  Grid,
} from '@material-ui/core'

// font-awesome
import { library } from '@fortawesome/fontawesome-svg-core'
import { faFileAudio } from '@fortawesome/free-regular-svg-icons'
library.add(faFileAudio)

// Thanks to: https://stackoverflow.com/questions/4059147/check-if-a-variable-is-a-string-in-javascript
function isString (s) {
  return typeof s === 'string' || s instanceof String
}

function isNumber (n) {
  return !isNaN(n)
}

function sec2us (n) {
  return n * 1000000
}

function isClose (a, b) {
  return Math.abs(a - b) < 0.0001
}

function round (num, base) {
  return Math.floor(num / base) * base
}

function range (start, stop, step) {
  return Array.from(
    { length: (stop - start) / step + 1 },
    (_, i) => start + i * step
  )
}

// c.f. C++'s std::lower_bound
// Thanks to: https://cpprefjp.github.io/reference/algorithm/lower_bound.html
function lower_bound (ary, cmp) {
  const impl = (begin, end) => {
    for (let len = end - begin; len !== 0; ) {
      const half = Math.floor(len / 2)
      const mid = begin + half
      if (cmp(ary[mid])) {
        len -= half + 1
        begin = mid + 1
      } else {
        len = half
      }
    }
    return begin
  }
  return impl(0, ary.length)
}

export function midi2notes (buffer, targetTrack, targetChannel) {
  const midi = new MIDIFile(buffer)
  if (midi.header.getFormat() === 2)
    throw new Error('Unsupported format of MIDI')
  if (midi.header.getTracksCount() === 0) throw new Error('Not enough tracks')
  if (midi.header.getTimeDivision() !== MIDIFile.Header.TICKS_PER_BEAT)
    throw new Error('Unsupported time division')

  const notes_begin = []
  const notes_end = []
  const events = midi.getMidiEvents()
  for (let ev of events) {
    if (ev.channel !== targetChannel) continue

    switch (ev.subtype) {
      case MIDIEvents.EVENT_MIDI_NOTE_ON:
        if (notes_begin.length !== notes_end.length) break
        notes_begin.push([ev.playTime * 1000, ev.param1])
        break

      case MIDIEvents.EVENT_MIDI_NOTE_OFF:
        if (
          notes_begin.length - notes_end.length !== 1 ||
          notes_begin[notes_begin.length - 1][1] !== ev.param1
        )
          break
        notes_end.push([ev.playTime * 1000, ev.param1])
        break

      default:
        break
    }
  }
  if (notes_begin.length !== notes_end.length)
    throw new Error('Invalid # of note offs')

  const notes = []
  for (let i = 0; i < notes_begin.length; i++) {
    const b = notes_begin[i]
    const e = notes_end[i]
    notes.push({
      tpos: b[0],
      duration: e[0] - b[0],
      pitch: b[1]
    })
  }

  return notes
}

export function muteMIDIChannel (midiBuf, targetTrack, targetChannel) {
  const midi = new MIDIFile(midiBuf)
  if (midi.header.getTracksCount() <= targetTrack)
    throw new Error('Invalid track number')
  const events = midi.getTrackEvents(targetTrack)
  for (let ev of events) {
    if (ev.channel !== targetChannel) continue
    switch (ev.subtype) {
      case MIDIEvents.EVENT_MIDI_NOTE_ON:
        ev.param2 = 0 // Mute it
        break
      default:
        break
    }
  }
  midi.setTrackEvents(targetTrack, events)
  return midi.getContent()
}

async function createPitchDetector (audioContext) {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: true,
    video: false
  })

  const pitchHandler = await new Promise(resolve => {
    const pitchHandler = ml5.pitchDetection(
      process.env.PUBLIC_URL + '/model',
      audioContext,
      stream,
      () => {
        resolve(pitchHandler)
      }
    )
  })

  const getPitch = async () => {
    const [freq, inputBuffer, currentTime] = await pitchHandler.getPitch()
    if (!freq) return [null, inputBuffer, currentTime]
    const m = Math.round(12 * (Math.log(freq / 440) / Math.log(2))) + 69
    return [m, inputBuffer, currentTime]
  }
  const stopAudio = () => {
    stream.getTracks().forEach(track => track.stop())
  }

  return [getPitch, stopAudio]
}

const NotesSVG = styled.svg`
  width: 80vw;
  height: 40vh;
`
export function NotesDisplay ({ curtpos, gNotes, uNotes, seconds }) {
  // curtpos, tpos, duration in us
  // pitch in SMF

  const SIZE_PER_SEC = 100
  const NOTE_HEIGHT = 5
  const [NOTE_NUM_MIN, NOTE_NUM_MAX] = gNotes.reduce(
    (minmax, n) => [
      Math.min(minmax[0], n.pitch - 12),
      Math.max(minmax[1], n.pitch + 12)
    ],
    [Number.MAX_VALUE, Number.MIN_VALUE]
  )
  const cw = SIZE_PER_SEC * seconds
  const ch = (NOTE_NUM_MAX - NOTE_NUM_MIN + 1) * NOTE_HEIGHT
  const tpos2x = tpos => (tpos * SIZE_PER_SEC) / 1000000
  const r = {
    from: round(tpos2x(curtpos), cw),
    to: round(tpos2x(curtpos), cw) + cw
  }
  const tpos2x_view = tpos => tpos2x(tpos) - r.from
  const pitch2y = pitch => ch - (pitch - NOTE_NUM_MIN) * NOTE_HEIGHT

  const notes2bars = (notes, color) =>
    notes
      .filter(
        note =>
          r.from < tpos2x(note.tpos + note.duration) &&
          tpos2x(note.tpos) < r.to &&
          NOTE_NUM_MIN <= note.pitch &&
          note.pitch <= NOTE_NUM_MAX
      )
      .reduce((acc, note) => {
        // Concat close notes at same pitch
        if (acc.length === 0) return [note]
        const last = acc[acc.length - 1]
        if (
          last.pitch !== note.pitch ||
          !isClose(last.tpos + last.duration, note.tpos)
        )
          return acc.concat(note)
        acc[acc.length - 1] = {
          tpos: last.tpos,
          duration: note.tpos + note.duration - last.tpos,
          pitch: last.pitch
        }
        return acc
      }, [])
      .map(note => (
        <React.Fragment key={note.tpos}>
          <rect
            x={tpos2x_view(note.tpos)}
            y={pitch2y(note.pitch)}
            width={tpos2x(note.duration)}
            height={NOTE_HEIGHT}
            rx={1}
            ry={1}
            fill={color}
            fillOpacity={0.7}
          />
        </React.Fragment>
      ))

  return (
    <>
      <p>{curtpos}</p>
      <NotesSVG viewBox={'0,0,' + cw + ',' + ch} preserveAspectRatio='none'>
        {
          // horizontal lines
        }
        <line x1={0} x2={cw} y1={0} y2={0} strokeWidth={5} stroke='gray' />
        <line x1={0} x2={cw} y1={ch} y2={ch} strokeWidth={5} stroke='gray' />
        {// vertical lines
        range(0, cw, SIZE_PER_SEC).map(x => (
          <line
            key={x}
            x1={x}
            x2={x}
            y1={0}
            y2={ch}
            strokeWidth={1}
            stroke='gray'
            fillOpacity={0.7}
          />
        ))}
        <line
          x1={tpos2x_view(curtpos)}
          x2={tpos2x_view(curtpos)}
          y1={0}
          y2={ch}
          strokeWidth={1}
          stroke='red'
        />
        {// note bars
        notes2bars(gNotes, 'gray')}
        {// user's correct note bars
        notes2bars(
          uNotes.filter(n => n.correct),
          '#FFA500'
        )}
        {// user's wrong note bars
        notes2bars(
          uNotes.filter(n => !n.correct),
          'red'
        )}
      </NotesSVG>
    </>
  )
}

export function InputDamjiroGakufu ({ dispatch }) {
  const [gakufuText, setGakufuText] = useState('')
  const [errorMsg, setErrorMsg] = useState(null)

  return (
    <FormControl fullWidth>
      <TextField
        value={gakufuText}
        label='Enter Damjiro Gakuhu.'
        helperText={errorMsg}
        error={errorMsg}
        multiline={true}
        rows={3}
        InputLabelProps={{
          shrink: true
        }}
        variant={'outlined'}
        onChange={e => {
          dispatch({ type: 'RESET_USER_NOTES' })
          setGakufuText(e.target.value)

          if (e.target.value === '') {
            setErrorMsg(null)
            return
          }

          try {
            const json = JSON.parse(e.target.value)
            const notes = json.notes.map(n => ({
              tpos: n[0],
              duration: n[1],
              pitch: n[2]
            }))
            const videoId = json.youtubeVideoId
            const timeOffset = json.timeOffset
            if (!isString(videoId) || !isNumber(timeOffset)) {
              dispatch({
                type: 'SNACK_LOAD',
                message: 'invalid JSON',
                variant: 'error'
              })
            } else {
              dispatch({ type: 'SET_GAKUFU', gakufu: { notes, videoId } })
              dispatch({ type: 'SET_USER_TIME_OFFSET', value: timeOffset })
              setErrorMsg(null)
            }
          } catch (e) {
            dispatch({ type: 'RESET_GAKUFU' })
            setErrorMsg(e.message)
            dispatch({
              type: 'SNACK_LOAD',
              message: e.message,
              variant: 'error'
            })
          }
        }}
      />
    </FormControl>
  )
}
InputDamjiroGakufu = connect()(InputDamjiroGakufu)

export function TimeOffsetForm ({ timeOffset, dispatch }) {
  return (
    <FormControl fullWidth>
      <InputLabel>Offset</InputLabel>
      <Input
        type='number'
        value={Math.floor(timeOffset / 1000)}
        onChange={e =>
          dispatch({
            type: 'SET_USER_TIME_OFFSET',
            value: Number(e.target.value) * 1000
          })
        }
        required
        endAdornment={<InputAdornment position='end'>ms</InputAdornment>}
      />
    </FormControl>
  )
}
TimeOffsetForm = connect(({ user: { timeOffset } }) => ({ timeOffset }))(
  TimeOffsetForm
)

export function PitchOffsetForm ({ pitchOffset, dispatch }) {
  return (
    <FormControl fullWidth>
      <InputLabel>Pitch Offset</InputLabel>
      <Input
        type='number'
        value={Math.floor(pitchOffset)}
        onChange={e =>
          dispatch({
            type: 'SET_USER_PITCH_OFFSET',
            value: Number(e.target.value)
          })
        }
        required
        endAdornment={<InputAdornment position='end'>note#</InputAdornment>}
      />
    </FormControl>
  )
}
PitchOffsetForm = connect(({ user: { pitchOffset } }) => ({ pitchOffset }))(
  PitchOffsetForm
)

export function NotesScroller ({
  dispatch,
  gakufu,
  user: { notes: uNotes, timeOffset, pitchOffset }
}) {
  const marginClasses = useMarginStyles()
  const [audioContext, setAudioContext] = useState(null)
  const playing = useRef(false)
  const curTimeOffset = useRef(timeOffset)
  const curPitchOffset = useRef(pitchOffset)
  const [curtpos, setCurtpos] = useState(0)
  const video = useRef(null)
  useEffect(() => {
    setAudioContext(new AudioContext())
  }, [])
  const onPlay = useCallback(async () => {
    if (playing.current) return
    playing.current = true

    if (!audioContext) return
    audioContext.resume()

    // Set timer to scroll notes
    const timerAdjust = setInterval(
      () => setCurtpos(video.current.getCurrentTime() * 1000 * 1000),
      25
    )

    // Create pitch detector
    const [getPitch, stopAudio] = await createPitchDetector(audioContext)

    // Clear user's previous notes
    dispatch({ type: 'RESET_USER_NOTES' })

    // Loop to get pitches from mic
    const getBiasedVideoTime = () =>
      sec2us(video.current.getCurrentTime()) - curTimeOffset.current
    let prev = null
    while (playing.current) {
      let [pitch, inputBuffer, inputTime] = await getPitch()
      if (pitch && prev != inputTime && pitch >= 36 && pitch <= 88) {
        const videoCurrentTime = getBiasedVideoTime()
        const micCurrentTime = sec2us(audioContext.currentTime)
        const duration = sec2us(inputBuffer.duration)
        const tpos =
          videoCurrentTime - (micCurrentTime - sec2us(inputTime) + duration)
        let biasedPitch = pitch
        let correct = false

        const lbIdx = lower_bound(gakufu.notes, n => n.tpos < tpos) - 1
        const lb = lbIdx >= 0 ? gakufu.notes[lbIdx] : gakufu.notes[0]
        if (lb) {
          biasedPitch = lb.pitch + curPitchOffset.current
          let gap =
            pitch - biasedPitch - Math.floor((pitch - biasedPitch) / 12) * 12
          if (gap > 6) gap -= 12
          biasedPitch += gap
          if (lb.tpos < tpos && tpos < lb.tpos + lb.duration && gap === 0)
            correct = true
        }

        const note = {
          tpos,
          duration,
          pitch: biasedPitch,
          correct
        }
        dispatch({ type: 'APPEND_USER_NOTE', note })
      }
      inputBuffer = null
      prev = inputTime
    }
    stopAudio()

    // Stop timer
    clearInterval(timerAdjust)
  }, [gakufu.notes, dispatch, audioContext])

  curTimeOffset.current = timeOffset
  curPitchOffset.current = pitchOffset

  return (
    <>
      {gakufu.videoId && (
        <YouTube
          videoId={gakufu.videoId}
          onReady={e => (video.current = e.target)}
          onPlay={onPlay}
          onPause={() => (playing.current = false)}
          onEnd={() => (playing.current = false)}
        />
      )}

      {gakufu.notes && (
        <Grid container direction='row' wrap='wrap' alignItems='flex-end'>
          <Grid item className={marginClasses.mr2}>
            <NotesDisplay
              curtpos={curtpos}
              gNotes={gakufu.notes}
              uNotes={uNotes}
              seconds={30}
            />
          </Grid>
          <Grid
            item
            className={marginClasses.mr2 + " " + marginClasses.mt1}
            style={{ maxWidth: '140px' }}
            container
            direction='column'
            spacing={2}
          >
            <Grid item>
              {gakufu.midiBuf && (
                <MIDIPlayer
                  buffer={gakufu.midiBuf}
                  onReady={e => (video.current = e.target)}
                  onPlay={onPlay}
                  onEnd={() => (playing.current = false)}
                />
              )}
            </Grid>
            <Grid item>
              <ScoreDisplay />
            </Grid>
          </Grid>
        </Grid>
      )}
    </>
  )
}
NotesScroller = connect(({ gakufu, user }) => ({
  gakufu,
  user
}))(NotesScroller)

function ScoreDisplay ({ gNotes, uNotes }) {
  if (!gNotes || !uNotes) return <div />

  const percPitchCorrect =
    uNotes.reduce((acc, uNote) => {
      const gNote = gNotes[lower_bound(gNotes, n => n.tpos < uNote.tpos) - 1]
      if (!gNote || gNote.tpos + gNote.duration < uNote.tpos) return acc
      const loss = Math.abs(uNote.pitch - gNote.pitch)
      const secretNonLinearFunc = x => x / (1 + Math.abs(x))
      return acc + uNote.duration * (1 - secretNonLinearFunc(loss))
    }, 0) / gNotes.reduce((sum, gNote) => sum + gNote.duration, 0)
  const percPitchAccuracy =
    uNotes.reduce((acc, uNote) => {
      const gNote = gNotes[lower_bound(gNotes, n => n.tpos < uNote.tpos) - 1]
      if (!gNote || gNote.tpos + gNote.duration < uNote.tpos) return acc
      const loss = Math.abs(uNote.pitch - gNote.pitch)
      return uNote.pitch === gNote.pitch ? acc + uNote.duration : acc
    }, 0) / uNotes.reduce((sum, uNote) => sum + uNote.duration, 0)
  const geta = 0
  const scale = 1.2
  const score = (percPitchCorrect * 100 + geta) * scale

  const accuracy = percPitchAccuracy * 100

  return (
    <div>
      <Typography variant='h6'>
        Score: {Math.round(score * 100) / 100} Accuracy:{' '}
        {Math.round(accuracy * 100) / 100}
      </Typography>
    </div>
  )
}
ScoreDisplay = connect(
  ({ gakufu: { notes: gNotes }, user: { notes: uNotes } }) => ({
    gNotes,
    uNotes
  })
)(ScoreDisplay)

function gakufuReducer (
  state = { notes: null, videoId: null, midiBuf: null },
  action
) {
  switch (action.type) {
    case 'SET_GAKUFU':
      return action.gakufu

    case 'RESET_GAKUFU':
      return { notes: null, videoId: null }

    default:
      return state
  }
}

function userReducer (
  state = {
    notes: [],
    timeOffset: 300000,
    pitchOffset: 0
  },
  action
) {
  switch (action.type) {
    case 'SET_USER_TIME_OFFSET':
      return {
        ...state,
        timeOffset: action.value
      }

    case 'SET_USER_PITCH_OFFSET':
      return {
        ...state,
        pitchOffset: action.value
      }

    case 'RESET_USER_NOTES':
      return {
        ...state,
        notes: []
      }

    case 'APPEND_USER_NOTE':
      return {
        ...state,
        notes: state.notes.concat(action.note)
      }

    default:
      return state
  }
}

const history = createBrowserHistory({
  basename: '/damjiro/'
})

const rootReducer = combineReducers({
  gakufu: gakufuReducer,
  user: persistReducer(
    {
      key: 'user',
      storage,
      whitelist: ['pitchOffset']
    },
    userReducer
  ),
  snack: snackbarReducer,
  router: connectRouter(history)
})

const persistedReducer = persistReducer(
  {
    key: 'root',
    storage,
    whitelist: ['user']
  },
  rootReducer
)

const store = createStore(
  persistedReducer,
  compose(
    applyMiddleware(routerMiddleware(history))
  )
)
const persistor = persistStore(store)

export const useCardStyles = makeStyles(theme => ({
  expand: {
    transform: 'rotate(0deg)',
    marginLeft: 'auto',
    transition: theme.transitions.create('transform', {
      duration: theme.transitions.duration.shortest
    })
  },
  expandOpen: {
    transform: 'rotate(180deg)'
  },
  wrapIcon: {
    verticalAlign: 'middle',
    display: 'inline-flex',
    marginRight: theme.spacing(1)
  },
  wrapAwesomeIcon: {
    verticalAlign: 'middle',
    display: 'inline-flex',
    marginRight: theme.spacing(1),
    fontSize: '24px'
  }
}))

export const useMarginStyles = makeStyles(theme => ({
  mt1: {
    marginTop: theme.spacing(1)
  },
  mt2: {
    marginTop: theme.spacing(2)
  },
  mt3: {
    marginTop: theme.spacing(3)
  },
  mb1: {
    marginBottom: theme.spacing(1)
  },
  mb2: {
    marginBottom: theme.spacing(2)
  },
  m1: {
    margin: theme.spacing(1)
  },
  m3: {
    margin: theme.spacing(3)
  },
  ml1: {
    marginLeft: theme.spacing(1)
  },
  collapse: {
    marginLeft: theme.spacing(3),
    marginRight: theme.spacing(3),
    marginBottom: theme.spacing(3)
  },
  mr2: {
    marginRight: theme.spacing(2)
  },
  mauto: {
    margin: 'auto'
  }
}))

function App () {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <CssBaseline />
        <Container maxWidth={false}>
          <Typography variant='h4'>
            Damjiro
          </Typography>
        </Container>
        <ConnectedRouter history={history}>
          <Switch>
            <Route exact path='/' component={AboutPage}/>
            <Route exact path='/gakufu/make' component={MakeGakufuPage} />
            <Route exact path='/gakufu/sing' component={SingGakufuPage} />
            <Route exact path='/midi/sing' component={SingMIDIPage} />
            <Route exact path='/error' component={ErrorPage} />
            <Route render={() => <Redirect to='/error?status=404' />} />
          </Switch>
        </ConnectedRouter>
        <MessageSnackbar />
      </PersistGate>
    </Provider>
  )
}

export default App
