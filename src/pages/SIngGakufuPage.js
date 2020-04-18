import React, { useState } from 'react'
import {
  InputDamjiroGakufu,
  NotesScroller,
  PitchOffsetForm,
  TimeOffsetForm,
  useCardStyles,
  useMarginStyles
} from '../App'
import {
  Card,
  CardActions,
  CardContent,
  Collapse,
  Grid,
  IconButton,
  Typography
} from '@material-ui/core'
import {
  Audiotrack,
  ExpandMore,
  MusicVideo,
  Settings
} from '@material-ui/icons'
import clsx from 'clsx'

const SingGakufuPage = () => {
  const classes = useCardStyles()
  const marginClasses = useMarginStyles()
  const [expanded, setExpanded] = useState(false)

  const handleExpandClick = () => {
    setExpanded(!expanded)
  }

  return (
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
          <Grid item xs={5}>
            <Typography
              variant='h6'
              className={marginClasses.mb2}
              color='textSecondary'
            >
              <MusicVideo className={classes.wrapIcon} />
              From Damjiro Gakufu file.
            </Typography>
            <InputDamjiroGakufu />
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
  )
}
export default SingGakufuPage
