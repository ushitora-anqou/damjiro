import React, { useRef, useState, useCallback, useEffect } from 'react'
import ml5 from 'ml5'

async function createPitchDetector (audioContext, stream) {
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
    // Nothing to do!
  }

  return [getPitch, stopAudio]
}

class LatencyEstimator {
  audioContext
  estimatedLatency
  baseTime

  start = async () => {
    this.estimatedLatency = null
    this.context = new AudioContext()

    // Prepare mic
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: false
      },
      video: false
    })
    const [getPitch, stopAudio] = await createPitchDetector(
      this.context,
      stream
    )
    //const source = this.context.createMediaStreamSource(stream)
    //const node = this.context.createScriptProcessor()
    //node.onaudioprocess = this.onAudioProcess
    //source.connect(node)

    //const gain = this.context.createGain()
    //gain.gain.setValueAtTime(0, this.context.currentTime)
    //node.connect(gain)
    //gain.connect(this.context.destination)

    // Prepare speaker
    {
      this.baseTime = this.context.currentTime + 2
      for (let i = 0; i < 10; i++) {
        const osc = this.context.createOscillator()
        osc.connect(this.context.destination)
        osc.frequency.value = 440.0
        osc.start(this.baseTime + 1 * i)
        osc.stop(this.baseTime + 1 * i + 0.1)
      }
      console.log(`START AT ${this.baseTime}`)
    }

    let prevInputTime = null
    let prevIndex = -1
    let lats = []
    while (this.context) {
      const [pitch, inputBuffer, inputTime] = await getPitch()
      if (prevInputTime && prevInputTime !== inputTime && pitch === 69) {
        const val = inputTime - inputBuffer.duration - this.baseTime
        const index = Math.floor(val)
        if (prevIndex !== index) {
          const lat = val - index
          lats.push(lat)
          const mean = lats.reduce((a, b) => a + b) / lats.length
          const dev =
            lats.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b) /
            lats.length
          console.log(`Lat #${index}: ${lat} (mean: ${mean}, dev: ${dev})`)
        }
        prevIndex = index
      }
      prevInputTime = inputTime
    }
  }

  working = () => {
    return !!this.context
  }

  stop = () => {
    this.context.close()
    this.context = null
    // FIXME: destruct all
  }

  onAudioProcess = e => {
    const src = e.inputBuffer.getChannelData(0)
    const sum = src.reduce((sum, val) => sum + val * val, 0)
    if (sum > 0.01) {
      console.log(
        `${this.context.currentTime - e.inputBuffer.duration}\t${sum}\t${
          e.inputBuffer.duration
        }`
      )
    }
  }
}

function MicLatencyChecker () {
  const [estimator, setEstimator] = useState(null)

  return (
    <div>
      {!estimator && (
        <button
          type='button'
          onClick={e => {
            const estimator = new LatencyEstimator()
            setEstimator(estimator)
            estimator.start()
          }}
        >
          Start
        </button>
      )}
      {estimator && (
        <button
          type='button'
          onClick={e => {
            estimator.stop()
            setEstimator(null)
          }}
        >
          Stop
        </button>
      )}
    </div>
  )
}

export default MicLatencyChecker
