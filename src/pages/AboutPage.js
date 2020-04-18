import {useCardStyles} from "../App";
import React from "react";
import {
  Container,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider
} from "@material-ui/core";
import {connect} from "react-redux";
import {push} from "connected-react-router";
import {Audiotrack, Edit, MusicVideo, NavigateNext} from "@material-ui/icons";
import {makeStyles} from "@material-ui/core/styles";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";

const useListStyles = makeStyles(theme => ({
  nested: {
    paddingLeft: theme.spacing(8)
  },
  root: {
    backgroundColor: theme.palette.background.paper
  }
}))

const _aboutPage = ({push}) => {
  const classes = useCardStyles()
  const listClasses = useListStyles()

  const handleSingGakufu = () => push('/gakufu/sing')
  const handleSingMIDI = () => push('/midi/sing')
  const handleMakeGakufu = () => push('/gakufu/make')

  return(
    <Container>
      <Typography>
        あばうとぺーじ☆彡
      </Typography>
      <List component='nav' className={listClasses.root}>
        <ListItem>
          <ListItemIcon>
            <Audiotrack className={classes.wrapIcon} />
          </ListItemIcon>
          <ListItemText primary='Sing a song'/>
        </ListItem>
        <ListItem button onClick={handleSingGakufu} className={listClasses.nested}>
          <ListItemIcon>
            <MusicVideo className={classes.wrapIcon} />
          </ListItemIcon>
          <ListItemText primary='from damjiro Gakufu'/>
          <NavigateNext />
        </ListItem>
        <ListItem button onClick={handleSingMIDI} className={listClasses.nested}>
          <ListItemIcon>
            <FontAwesomeIcon
              icon={['far', 'file-audio']}
              className={classes.wrapAwesomeIcon}
            />
          </ListItemIcon>
          <ListItemText primary='from MIDI file'/>
          <NavigateNext />
        </ListItem>
        <Divider />
        <ListItem button onClick={handleMakeGakufu}>
          <ListItemIcon>
            <Edit className={classes.wrapIcon} />
          </ListItemIcon>
          <ListItemText primary='Make damjiro Gakufu'/>
          <NavigateNext />
        </ListItem>
      </List>
    </Container>
  )
}
const AboutPage = connect(null, {push})(_aboutPage)
export default AboutPage
