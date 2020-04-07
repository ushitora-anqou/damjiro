import React, { useRef, useState, useCallback, useEffect } from 'react'
import { combineReducers, createStore } from 'redux'
import { Provider, connect } from 'react-redux'
import styled from 'styled-components'
import YouTube from 'react-youtube'
import { persistStore, persistReducer } from 'redux-persist'
import storage from 'redux-persist/lib/storage'
import { PersistGate } from 'redux-persist/integration/react'
import ml5 from 'ml5'
import MIDIFile from 'midifile'
import MIDIEvents from 'midievents'

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

function midi2notes (buffer, targetTrack, targetChannel) {
  const midi = new MIDIFile(buffer)
  if (midi.header.getFormat() === 2)
    throw new Error('Unsupported format of MIDI')
  if (midi.header.getTracksCount() === 0) throw new Error('Not enough tracks')
  if (midi.header.getTimeDivision() !== MIDIFile.Header.TICKS_PER_BEAT)
    throw new Error('Unsupported time division')

  const metrical = midi.header.getTicksPerBeat()

  let tempo = null
  const notes_begin = []
  const notes_end = []
  const events = midi.getTrackEvents(targetTrack)
  let elapsed_time = 0
  for (let ev of events) {
    elapsed_time += ev.delta

    switch (ev.subtype) {
      case MIDIEvents.EVENT_META_SET_TEMPO:
        tempo = ev.tempo
        break

      case MIDIEvents.EVENT_MIDI_NOTE_ON:
        if (ev.channel !== targetChannel) break
        notes_begin.push([elapsed_time, ev.param1])
        break

      case MIDIEvents.EVENT_MIDI_NOTE_OFF:
        if (ev.channel !== targetChannel) break
        if (
          notes_begin.length === 0 ||
          notes_begin[notes_begin.length - 1][1] !== ev.param1
        )
          throw new Error('Invalid note off')
        notes_end.push([elapsed_time, ev.param1])
        break

      default:
        break
    }
  }
  if (!tempo) throw new Error('Tempo Not found')
  if (notes_begin.length !== notes_end.length)
    throw new Error('Invalid # of note offs')

  const notes = []
  for (let i = 0; i < notes_begin.length; i++) {
    const b = notes_begin[i]
    const e = notes_end[i]
    notes.push({
      tpos: (b[0] * tempo) / metrical,
      duration: ((e[0] - b[0]) * tempo) / metrical,
      pitch: b[1]
    })
  }

  return notes
}

function makeNotesSensible (notes, introTime, pitchOffset) {
  if (notes.length === 0) return notes

  const epoch = notes[0].tpos
  return notes.map(n => ({
    tpos: n.tpos - epoch + introTime,
    duration: n.duration,
    pitch: n.pitch + pitchOffset
  }))
}

function gakufu2json (gNotes, youtubeVideoId, timeOffset) {
  const gakufu = {
    notes: gNotes.map(n => [
      Math.round(n.tpos),
      Math.round(n.duration),
      Math.round(n.pitch)
    ]),
    youtubeVideoId,
    timeOffset
  }
  return JSON.stringify(gakufu)
}

async function createPitchDetector () {
  const audioContext = new AudioContext()
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: true,
    video: false
  })

  const pitchHandler = await new Promise(resolve => {
    const pitchHandler = ml5.pitchDetection(
      './model',
      audioContext,
      stream,
      () => {
        resolve(pitchHandler)
      }
    )
  })

  const getPitch = () =>
    new Promise((resolve, reject) =>
      pitchHandler.getPitch((err, freq) => {
        if (err) reject(err)
        if (!freq) resolve(null)
        const m = Math.round(12 * (Math.log(freq / 440) / Math.log(2))) + 69
        resolve(m)
      })
    )
  const stopAudio = () => {
    stream.getTracks().forEach(track => track.stop())
    audioContext.close()
  }

  return [getPitch, stopAudio]
}

const NotesSVG = styled.svg`
  width: 80vw;
  height: 80vh;
`
function NotesDisplay ({ curtpos, gNotes, uNotes, seconds }) {
  // curtpos, tpos, duration in us
  // pitch in SMF

  const SIZE_PER_SEC = 100
  const cw = SIZE_PER_SEC * seconds
  const ch = 500
  const tpos2x = tpos => (tpos * SIZE_PER_SEC) / 1000000
  const r = {
    from: round(tpos2x(curtpos), cw),
    to: round(tpos2x(curtpos), cw) + cw
  }
  const tpos2x_view = tpos => tpos2x(tpos) - r.from

  const notes2bars = (notes, color) =>
    notes
      .filter(
        note =>
          r.from < tpos2x(note.tpos + note.duration) && tpos2x(note.tpos) < r.to
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
            y={500 - note.pitch * 5}
            width={tpos2x(note.duration)}
            height={5}
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
        notes2bars(uNotes.filter(n => n.correct), '#FFA500')}
        {// user's wrong note bars
        notes2bars(uNotes.filter(n => !n.correct), 'red')}
      </NotesSVG>
    </>
  )
}

function InputDamjiroGakufu ({ dispatch }) {
  const [gakufuText, setGakufuText] = useState('')
  const [errorMsg, setErrorMsg] = useState(null)

  return (
    <div>
      <textarea
        value={gakufuText}
        onChange={e => {
          setGakufuText(e.target.value)
          try {
            const json = JSON.parse(e.target.value)
            const notes = json.notes.map(n => ({
              tpos: n[0],
              duration: n[1],
              pitch: n[2]
            }))
            const videoId = json.youtubeVideoId
            const timeOffset = json.timeOffset
            if (!isString(videoId) || !isNumber(timeOffset))
              throw new Error('Invalid JSON')
            dispatch({ type: 'SET_GAKUFU', gakufu: { notes, videoId } })
            dispatch({ type: 'SET_USER_TIME_OFFSET', value: timeOffset })
            setErrorMsg(null)
          } catch (e) {
            dispatch({ type: 'RESET_GAKUFU' })
            setErrorMsg(e.message)
          }
          dispatch({ type: 'RESET_USER_NOTES' })
        }}
      />
      {errorMsg}
    </div>
  )
}
InputDamjiroGakufu = connect()(InputDamjiroGakufu)

function TimeOffsetForm ({ timeOffset, dispatch }) {
  return (
    <div>
      <input
        type='number'
        value={Math.floor(timeOffset / 1000)}
        onChange={e =>
          dispatch({
            type: 'SET_USER_TIME_OFFSET',
            value: Number(e.target.value) * 1000
          })
        }
        required
      />
      ms
    </div>
  )
}
TimeOffsetForm = connect(({ user: { timeOffset } }) => ({ timeOffset }))(
  TimeOffsetForm
)

function PitchOffsetForm ({ pitchOffset, dispatch }) {
  return (
    <div>
      <input
        type='number'
        value={Math.floor(pitchOffset)}
        onChange={e =>
          dispatch({
            type: 'SET_USER_PITCH_OFFSET',
            value: Number(e.target.value)
          })
        }
        required
      />
      note#
    </div>
  )
}
PitchOffsetForm = connect(({ user: { pitchOffset } }) => ({ pitchOffset }))(
  PitchOffsetForm
)

function NotesScroller ({
  dispatch,
  gakufu,
  user: { notes: uNotes, timeOffset, pitchOffset }
}) {
  const playing = useRef(false)
  const curTimeOffset = useRef(timeOffset)
  const curPitchOffset = useRef(pitchOffset)
  const [curtpos, setCurtpos] = useState(0)
  const video = useRef(null)
  const onPlay = useCallback(async () => {
    if (playing.current) return
    playing.current = true

    // Set timer to scroll notes
    const timerAdjust = setInterval(
      () => setCurtpos(video.current.getCurrentTime() * 1000 * 1000),
      25
    )

    // Create pitch detector
    const [getPitch, stopAudio] = await createPitchDetector()

    // Clear user's previous notes
    dispatch({ type: 'RESET_USER_NOTES' })

    // Loop to get pitches from mic
    const getBiasedVideoTime = () =>
      sec2us(video.current.getCurrentTime()) - curTimeOffset.current
    let prev = getBiasedVideoTime()
    while (playing.current) {
      const pitch = await getPitch()
      const now = getBiasedVideoTime()
      if (pitch) {
        //const biasedPitch = pitch + curPitchOffset.current
        const duration = now - prev
        const lb =
          gakufu.notes[lower_bound(gakufu.notes, n => n.tpos < prev) - 1]
        const lb_biasedPitch = lb ? lb.pitch + curPitchOffset.current : 0
        let gap = (pitch - lb_biasedPitch) - Math.floor((pitch - lb_biasedPitch) / 12) * 12
        if (gap > 6) gap -= 12
        const note = {
          tpos: prev,
          duration,
          pitch: lb ? lb_biasedPitch + gap : pitch,
          correct:
            lb && prev < lb.tpos + lb.duration && gap==0
        }
        dispatch({ type: 'APPEND_USER_NOTE', note })
      }
      prev = now
    }
    stopAudio()

    // Stop timer
    clearInterval(timerAdjust)
  }, [gakufu.notes, dispatch])

  curTimeOffset.current = timeOffset
  curPitchOffset.current = pitchOffset

  if (!gakufu.notes) return <div />

  return (
    <>
      <YouTube
        videoId={gakufu.videoId}
        onReady={e => (video.current = e.target)}
        onPlay={onPlay}
        onPause={() => (playing.current = false)}
        onEnd={() => (playing.current = false)}
      />

      {gakufu.notes && (
        <NotesDisplay
          curtpos={curtpos}
          gNotes={gakufu.notes}
          uNotes={uNotes}
          seconds={30}
        />
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
  const geta = 0
  const scale = 1.2
  const score = (percPitchCorrect * 100 + geta) * scale

  return <div>Score: {Math.round(score * 100) / 100}</div>
}
ScoreDisplay = connect(
  ({ gakufu: { notes: gNotes }, user: { notes: uNotes } }) => ({
    gNotes,
    uNotes
  })
)(ScoreDisplay)

function MIDIEditor () {
  const [fileBody, setFileBody] = useState(null)
  const [trackNo, setTrackNo] = useState(0)
  const [channelNo, setChannelNo] = useState(0)
  const [introTime, setIntroTime] = useState(0)
  const [pitchOffset, setPitchOffset] = useState(0)
  const [youtubeVideoId, setYoutubeVideoId] = useState(null)
  const [video, setVideo] = useState(null)
  const errorMsg = useRef(null)

  let gNotesOriginal = []
  let gNotes = []
  if (fileBody) {
    try {
      gNotesOriginal = midi2notes(fileBody, trackNo, channelNo)
      gNotes = makeNotesSensible(
        gNotesOriginal,
        introTime * 1000000,
        pitchOffset
      )
      errorMsg.current = null
    } catch (e) {
      errorMsg.current = e.message
    }
  }

  useEffect(() => {
    if (gNotesOriginal.length === 0) return
    const estimatedIntroTime = gNotesOriginal[0].tpos / 1000000
    setIntroTime(estimatedIntroTime)
  }, [fileBody, trackNo, channelNo])

  useEffect(() => {
    if (!video) return
    video.seekTo(introTime, true)
  }, [video, introTime])

  return (
    <div>
      <div>
        <input
          type='file'
          accept='audio/midi, audio/x-midi'
          onChange={e => {
            // Reset
            setFileBody(null)
            setTrackNo(0)
            setChannelNo(0)
            setIntroTime(0)
            setPitchOffset(0)
            setYoutubeVideoId(null)
            setVideo(null)
            errorMsg.current = null

            // Read the file
            try {
              const file = e.target.files[0]
              if (file.type !== 'audio/midi' && file.type !== 'audio/x-midi')
                throw 'invalid mime type'
              const reader = new FileReader()
              reader.onload = e => setFileBody(e.target.result)
              reader.readAsArrayBuffer(file)
            } catch (e) {
              console.log(e)
            }
          }}
        />
      </div>
      <div>
        <label>
          Track No.:
          <input
            type='number'
            onChange={e => setTrackNo(Number(e.target.value))}
            value={trackNo}
          />
        </label>
        <label>
          Channel No.:
          <input
            type='number'
            onChange={e => setChannelNo(Number(e.target.value))}
            value={channelNo}
          />
        </label>
      </div>
      <div>
        <label>
          YouTube video id:
          <input
            type='text'
            onChange={e => setYoutubeVideoId(e.target.value)}
            value={youtubeVideoId || ''}
          />
        </label>
      </div>
      <div>
        <label>
          intro time (sec):
          <input
            type='number'
            step='any'
            onChange={e => setIntroTime(Number(e.target.value))}
            value={introTime}
          />
        </label>
        <label>
          pitch offset (SMF note #):
          <input
            type='number'
            onChange={e => setPitchOffset(Number(e.target.value))}
            value={pitchOffset}
          />
        </label>
      </div>
      <div>
        <textarea
          value={
            fileBody && youtubeVideoId
              ? gakufu2json(gNotes, youtubeVideoId, 300 * 1000)
              : ''
          }
          readOnly
        />
      </div>
      <p>{errorMsg.current}</p>
      {fileBody && youtubeVideoId ? (
        <YouTube
          videoId={youtubeVideoId}
          onReady={e => {
            const video = e.target
            setVideo(video)
            video.playVideo()
            video.pauseVideo()
          }}
        />
      ) : (
        <div />
      )}
      <NotesDisplay curtpos={0} gNotes={gNotes} uNotes={[]} seconds={60} />
    </div>
  )
}

function gakufuReducer (state = { notes: null, videoId: null }, action) {
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

const rootReducer = combineReducers({
  gakufu: gakufuReducer,
  user: persistReducer(
    {
      key: 'user',
      storage,
      whitelist: ['pitchOffset']
    },
    userReducer
  )
})
const persistedReducer = persistReducer(
  {
    key: 'root',
    storage,
    whitelist: ['user']
  },
  rootReducer
)
const store = createStore(persistedReducer)
const persistor = persistStore(store)

function App () {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <InputDamjiroGakufu />
        <TimeOffsetForm />
        <PitchOffsetForm />
        <ScoreDisplay />
        <NotesScroller />
        <hr />
        <MIDIEditor />
      </PersistGate>
    </Provider>
  )
}

export default App
