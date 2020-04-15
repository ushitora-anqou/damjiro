import React from 'react'
import { connect } from 'react-redux'
import MIDILoader from './util/MIDILoader'
import TextField from '@material-ui/core/TextField'

function MIDIFilePicker ({ onLoad, dispatch }) {
  return (
    <TextField
      type='file'
      label='Select a midi file.'
      accept='audio/midi, audio/x-midi, audio/mid'
      onChange={e => {
        // Read the file
        const file = e.target.files[0]
        MIDILoader(file, onLoad, dispatch)
      }}
      InputLabelProps={{
        shrink: true
      }}
      variant={'outlined'}
    />
  )
}
MIDIFilePicker = connect()(MIDIFilePicker)
export default MIDIFilePicker
