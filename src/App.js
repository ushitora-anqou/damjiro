import React, { useRef, useState, useCallback } from 'react'
import { combineReducers, createStore } from 'redux'
import { Provider, connect } from 'react-redux'
import styled from 'styled-components'
import YouTube from 'react-youtube'
import { persistStore, persistReducer } from 'redux-persist'
import storage from 'redux-persist/lib/storage'
import { PersistGate } from 'redux-persist/integration/react'
import ml5 from 'ml5'

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
function NotesDisplay ({ curtpos, gakufu, user }) {
  // curtpos, tpos, duration in us
  // 100 units per second
  // pitch in SMF

  if (!gakufu.notes) return <div />

  const SIZE_PER_SEC = 100
  const cw = SIZE_PER_SEC * 30
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
        notes2bars(gakufu.notes, 'gray')}
        {// user's correct note bars
        notes2bars(user.notes.filter(n => n.correct), '#FFA500')}
        {// user's wrong note bars
        notes2bars(user.notes.filter(n => !n.correct), 'red')}
      </NotesSVG>
    </>
  )
}
NotesDisplay = connect(({ user }) => ({
  user: { notes: user.notes }
}))(NotesDisplay)

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

function NotesScroller ({ dispatch, gakufu, timeOffset, pitchOffset }) {
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
        const biasedPitch = pitch + curPitchOffset.current
        const duration = now - prev
        const lb =
          gakufu.notes[lower_bound(gakufu.notes, n => n.tpos < prev) - 1]
        const note = {
          tpos: prev,
          duration,
          pitch: biasedPitch,
          correct:
            lb && prev < lb.tpos + lb.duration && lb.pitch === biasedPitch
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

      <NotesDisplay curtpos={curtpos} gakufu={gakufu} />
    </>
  )
}
NotesScroller = connect(({ gakufu, user: { timeOffset, pitchOffset } }) => ({
  gakufu,
  timeOffset,
  pitchOffset
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
      </PersistGate>
    </Provider>
  )
}

export default App
