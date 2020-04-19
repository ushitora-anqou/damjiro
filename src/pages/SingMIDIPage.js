import React, { useState } from 'react'
import {
  useCardStyles,
  useMarginStyles,
  midi2notes,
  muteMIDIChannel,
  NotesScroller,
  PitchOffsetForm,
  TimeOffsetForm
} from '../App'
import {
  Card,
  CardActions,
  CardContent,
  Checkbox,
  Collapse,
  FormControlLabel,
  Grid,
  IconButton,
  Typography,
  Container
} from '@material-ui/core'
import { Audiotrack, ExpandMore, Settings } from '@material-ui/icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import MIDIFilePicker from '../MIDIFilePicker'
import clsx from 'clsx'
import { connect } from 'react-redux'

const _singMIDIPage = ({ dispatch }) => {
  const classes = useCardStyles()
  const marginClasses = useMarginStyles()
  const [expanded, setExpanded] = useState(false)
  const [checkedMute, setCheckedMute] = useState(false)

  const handleExpandClick = () => {
    setExpanded(!expanded)
  }

  console.log(checkedMute)

  return (
    <Container>
      <Card className={marginClasses.m3}>
        <CardContent>
          <Typography variant='h5'>
            <Audiotrack className={classes.wrapIcon} />
            Sing a song
          </Typography>
          <Grid
            className={marginClasses.mt2}
            container
            direction='row'
            justify='space-around'
          >
            <Grid
              item
              xs={5}
              container
              direction='column'
              justify='space-between'
            >
              <Typography
                variant='h6'
                color='textSecondary'
                className={marginClasses.mb2}
              >
                <FontAwesomeIcon
                  icon={['far', 'file-audio']}
                  className={classes.wrapIcon}
                />
                From midi file.
              </Typography>
              <MIDIFilePicker
                onLoad={buf => {
                  dispatch({
                    type: 'SET_GAKUFU',
                    gakufu: {
                      notes: midi2notes(buf, 0, 0),
                      midiBuf: checkedMute ? muteMIDIChannel(buf, 0, 0) : buf,
                      videoId: null
                    }
                  })
                }}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={checkedMute}
                    onChange={e => setCheckedMute(e.target.checked)}
                    name='checkedMute'
                  />
                }
                label='Mute melody'
              />
            </Grid>
          </Grid>
        </CardContent>
        <CardContent>
          <NotesScroller />
        </CardContent>
        <CardActions disableSpacing>
          <Typography color='textSecondary' className={marginClasses.ml1}>
            <Settings className={classes.wrapIcon} />
            Adjustment
          </Typography>
          <IconButton
            className={clsx(classes.expand, {
              [classes.expandOpen]: expanded
            })}
            onClick={handleExpandClick}
            aria-expanded={expanded}
            aria-label='show more'
          >
            <ExpandMore />
          </IconButton>
        </CardActions>
        <Collapse in={expanded} timeout='auto' unmountOnExit>
          <Grid
            container
            spacing={5}
            direction='row'
            className={marginClasses.collapse}
          >
            <Grid item xs={3}>
              <TimeOffsetForm />
            </Grid>
            <Grid item xs={3}>
              <PitchOffsetForm />
            </Grid>
          </Grid>
        </Collapse>
      </Card>
    </Container>
  )
}
const SingMIDIPage = connect()(_singMIDIPage)
export default SingMIDIPage
