import React, { useState } from 'react'
import { connect } from 'react-redux'
import { createPitchDetector } from './util/PitchDetector'

import Button from '@material-ui/core/Button'
import CircularProgress from '@material-ui/core/CircularProgress'
import Dialog from '@material-ui/core/Dialog'
import DialogActions from '@material-ui/core/DialogActions'
import DialogContent from '@material-ui/core/DialogContent'
import Typography from '@material-ui/core/Typography'
import DialogTitle from '@material-ui/core/DialogTitle'

async function estimateLatency () {
  const context = new AudioContext()
  const NTESTS = 10

  // Prepare mic
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: false
    },
    video: false
  })
  const [getPitch] = await createPitchDetector(context, stream)

  // Prepare speaker
  const baseTime = context.currentTime + 2
  for (let i = 0; i < NTESTS; i++) {
    const osc = context.createOscillator()
    osc.connect(context.destination)
    osc.frequency.value = 440.0
    osc.start(baseTime + 1 * i)
    osc.stop(baseTime + 1 * i + 0.1)
  }

  // Take samples
  let prevInputTime = null
  let prevIndex = -1
  let lats = []
  while (context.currentTime < baseTime + NTESTS + 1) {
    const [pitch, inputBuffer, inputTime] = await getPitch()
    if (pitch === 69 && (!prevInputTime || prevInputTime !== inputTime)) {
      const val = inputTime - inputBuffer.duration - baseTime
      const index = Math.floor(val)
      if (prevIndex !== index) {
        const lat = val - index
        lats.push(lat)
        if (index === NTESTS) break
      }
      prevIndex = index
      prevInputTime = inputTime
    }
  }

  // Clean up
  stream.getTracks().forEach(track => track.stop())
  context.close()

  // Estimate latency
  if (lats.length === 0) throw new Error('No audio detected')

  const mean = lats.reduce((a, b) => a + b) / lats.length
  const std = Math.sqrt(
    lats.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / lats.length
  )

  return [mean, std]
}

function MicLatencyEstimationDialog ({ dispatch, open, onDone, onCancel }) {
  const [estimating, setEstimating] = useState(false)

  const handleStart = async () => {
    setEstimating(true)
    try {
      const [mean, std] = await estimateLatency()
      if (std < 1) {
        onDone(mean)
      } else {
        dispatch({
          type: 'SNACK_LOAD',
          message: "Couldn't estimate",
          variant: 'error'
        })
      }
    } catch (e) {
      dispatch({
        type: 'SNACK_LOAD',
        message: e.message,
        variant: 'error'
      })
    }
    setEstimating(false)
  }

  const handleCancel = () => {
    onCancel()
  }

  return (
    <Dialog aria-labelledby='mic-latency-dialog-title' open={open}>
      <DialogTitle id='mic-latency-dialog-title'>
        Estimate mic's latency
      </DialogTitle>
      <DialogContent dividers>
        <Typography gutterBottom>
          Put your mic in front of your speaker/headphone.
        </Typography>
        <Typography gutterBottom>
          Maximize the volume of your speaker. Also make sure your mic is
          working.
        </Typography>
        <Typography gutterBottom>Let's start estimation!</Typography>
      </DialogContent>
      <DialogActions>
        {estimating ? (
          <CircularProgress />
        ) : (
          <>
            <Button onClick={handleCancel} color='primary'>
              Cancel
            </Button>
            <Button autoFocus onClick={handleStart} color='primary'>
              Start
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  )
}

export default connect()(MicLatencyEstimationDialog)
