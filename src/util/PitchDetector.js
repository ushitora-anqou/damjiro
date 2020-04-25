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

export { createPitchDetector }
