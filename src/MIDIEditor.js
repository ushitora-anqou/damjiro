import React, { useEffect, useRef, useState } from 'react'
import MIDILoader from './util/MIDILoader'
import YouTube from 'react-youtube'
import { connect } from 'react-redux'
import { midi2notes, NotesDisplay } from './App'

//material-ui
import { GetApp, Movie, NavigateBefore, NavigateNext } from '@material-ui/icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import StepConnector from '@material-ui/core/StepConnector'
import { makeStyles } from '@material-ui/core/styles'
import withStyles from '@material-ui/core/styles/withStyles'
import Button from '@material-ui/core/Button'
import Typography from '@material-ui/core/Typography'
import Step from '@material-ui/core/Step'
import Stepper from '@material-ui/core/Stepper'
import StepLabel from '@material-ui/core/StepLabel'
import clsx from 'clsx'
import Divider from '@material-ui/core/Divider'
import CardContent from '@material-ui/core/CardContent'
import CardActions from '@material-ui/core/CardActions'
import Grid from '@material-ui/core/Grid'
import { Hidden, TextField } from '@material-ui/core'

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

const ColorlibConnector = withStyles({
  alternativeLabel: {
    top: 22
  },
  active: {
    '& $line': {
      backgroundImage: 'linear-gradient( 136deg, #000046 0%, #1CB5E0 80%)'
    }
  },
  completed: {
    '& $line': {
      backgroundImage: 'linear-gradient( 136deg, #000046 0%, #1CB5E0 80%)'
    }
  },
  line: {
    height: 3,
    border: 0,
    backgroundColor: '#eaeaf0',
    borderRadius: 1
  }
})(StepConnector)

const useColorlibStepIconStyles = makeStyles({
  root: {
    backgroundColor: '#cccccc',
    zIndex: 1,
    color: '#ffffff',
    width: 50,
    height: 50,
    display: 'flex',
    borderRadius: '50%',
    justifyContent: 'center',
    alignItems: 'center'
  },
  active: {
    backgroundImage: 'linear-gradient( 136deg, #1CB5E0 20%, #000046 100%)',
    boxShadow: '0 4px 10px 0 rgba(0,0,0,.25)'
  },
  completed: {
    backgroundImage: 'linear-gradient( 136deg, #1CB5E0 20%, #000046 100%)'
  },
  font: {
    fontSize: '24px'
  }
})

function ColoredStepIcon (props) {
  const classes = useColorlibStepIconStyles()
  const { active, completed } = props

  const icons = {
    1: <FontAwesomeIcon icon={['far', 'file-audio']} fontSize={500} />,
    2: <Movie />,
    3: <GetApp />
  }

  return (
    <div
      className={clsx(
        classes.root,
        {
          [classes.active]: active,
          [classes.completed]: completed
        },
        classes.font
      )}
    >
      {icons[String(props.icon)]}
    </div>
  )
}

const useStyles = makeStyles(theme => ({
  root: {
    width: '100%'
  },
  button: {
    marginRight: theme.spacing(1)
  },
  videoFrame: {
    width: '640px',
    height: '360px'
  }
}))

function MIDIEditor ({ dispatch }) {
  const classes = useStyles()
  const [activeStep, setActiveStep] = React.useState(0)
  const steps = ['Select midi file', 'Input youtube Id', 'Check output Gakufu']

  const handleNext = () => {
    setActiveStep(prevActiveStep => prevActiveStep + 1)
  }

  const handleBack = () => {
    setActiveStep(prevActiveStep => prevActiveStep - 1)
  }

  const handleReset = () => {
    setActiveStep(0)
  }

  const [fileBody, setFileBody] = useState('')
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

  const getStepContent = step => {
    switch (step) {
      case 0:
        return (
          <Grid
            container
            direction='column'
            justify='center'
            alignItems='center'
            spacing={2}
          >
            <Grid item container direction='row' justify='center' spacing={2}>
              <Grid item>
                <TextField
                  fullWidth
                  type='file'
                  accept='audio/midi, audio/x-midi, audio/mid'
                  InputLabelProps={{
                    shrink: true
                  }}
                  variant={'outlined'}
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
                    const file = e.target.files[0]
                    MIDILoader(file, setFileBody, dispatch)
                  }}
                  label='Select a midi file.'
                />
              </Grid>
              <Divider orientation='vertical' flexItem />
              <Grid item>
                <TextField
                  label='Track No.'
                  type='number'
                  onChange={e => setTrackNo(Number(e.target.value))}
                  value={trackNo}
                  InputLabelProps={{
                    shrink: true
                  }}
                  variant={'outlined'}
                />
              </Grid>
              <Grid item>
                <TextField
                  label='Channel No.'
                  type='number'
                  onChange={e => setChannelNo(Number(e.target.value))}
                  value={channelNo}
                  InputLabelProps={{
                    shrink: true
                  }}
                  variant={'outlined'}
                />
              </Grid>
              <Grid item>
                <TextField
                  label='pitch offset (SMF note #)'
                  type='number'
                  onChange={e => setPitchOffset(Number(e.target.value))}
                  value={pitchOffset}
                  InputLabelProps={{
                    shrink: true
                  }}
                  variant={'outlined'}
                />
              </Grid>
            </Grid>
            <Grid item>
              <NotesDisplay
                curtpos={0}
                gNotes={gNotes}
                uNotes={[]}
                seconds={60}
              />
            </Grid>
          </Grid>
        )
      case 1:
        return (
          <Grid
            container
            direction='row'
            wrap='wrap'
            justify='space-around'
            spacing={2}
          >
            <Grid
              item
              style={{ maxWidth: '300px' }}
              xl={3}
              lg={12}
              container
              direction='column'
              spacing={2}
            >
              <Grid item>
                <TextField
                  fullWidth
                  label='YouTube video id'
                  type='text'
                  onChange={e => setYoutubeVideoId(e.target.value)}
                  value={youtubeVideoId || ''}
                  InputLabelProps={{
                    shrink: true
                  }}
                  variant={'outlined'}
                />
              </Grid>
              <Grid item>
                <TextField
                  fullWidth
                  label='intro time (sec)'
                  type='number'
                  step='any'
                  onChange={e => setIntroTime(Number(e.target.value))}
                  value={introTime}
                  InputLabelProps={{
                    shrink: true
                  }}
                  variant={'outlined'}
                />
              </Grid>
            </Grid>
            <Hidden mdDown>
              <Divider orientation='vertical' flexItem />
            </Hidden>
            <Grid item style={{ maxWidth: '640px' }} xl={9} lg={12}>
              {youtubeVideoId ? (
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
                <div className={classes.videoFrame} />
              )}
            </Grid>
          </Grid>
        )
      case 2:
        return (
          <Grid item container direction='row' justify='center' spacing={3}>
            <Grid item xs={10}>
              <TextField
                fullWidth
                multiline
                rows={8}
                label='Output Gakufu'
                value={
                  fileBody && youtubeVideoId
                    ? gakufu2json(gNotes, youtubeVideoId, 300 * 1000)
                    : ''
                }
                readOnly
                InputLabelProps={{
                  shrink: true
                }}
                variant={'outlined'}
              />
            </Grid>
            <Grid item>
              <Typography>{errorMsg.current}</Typography>
            </Grid>
          </Grid>
        )
      default:
        dispatch({
          type: 'SNACK_LOAD',
          message: 'Unknown step Error',
          variant: 'error'
        })
        return
    }
  }

  const isDisableNextButton = step => {
    switch (step) {
      case 0:
        return !fileBody
      case 1:
        return !youtubeVideoId
      case 2:
        return false
      default:
        return true
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
    <div className={classes.root}>
      <Stepper
        alternativeLabel
        activeStep={activeStep}
        connector={<ColorlibConnector />}
      >
        {steps.map(label => (
          <Step key={label}>
            <StepLabel StepIconComponent={ColoredStepIcon}>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>
      <div>
        {activeStep === steps.length ? (
          <>
            <CardContent>
              <Typography className={classes.instructions}>
                Let's sing with your Gakufu!
              </Typography>
            </CardContent>
            <CardActions>
              <Button onClick={handleReset} className={classes.button}>
                Reset
              </Button>
            </CardActions>
          </>
        ) : (
          <div>
            <CardContent>{getStepContent(activeStep)}</CardContent>
            <CardActions>
              <Grid container direction='row' justify='space-around'>
                <Grid item>
                  <Button
                    disabled={activeStep === 0}
                    onClick={handleBack}
                    className={classes.button}
                  >
                    <NavigateBefore />
                    Back
                  </Button>
                </Grid>
                <Grid item>
                  <Button
                    variant='contained'
                    color='primary'
                    onClick={handleNext}
                    className={classes.button}
                    disabled={isDisableNextButton(activeStep)}
                  >
                    {activeStep === steps.length - 1 ? 'Finish' : 'Next'}
                    <NavigateNext />
                  </Button>
                </Grid>
              </Grid>
            </CardActions>
          </div>
        )}
      </div>
    </div>
  )
}
MIDIEditor = connect()(MIDIEditor)
export default MIDIEditor
