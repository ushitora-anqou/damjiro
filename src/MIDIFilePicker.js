import React from 'react'
import {connect} from "react-redux";
import MIDILoader from "./util/MIDILoader";

function MIDIFilePicker ({ onLoad, dispatch }) {
  return (
    <input
      type='file'
      accept='audio/midi, audio/x-midi, audio/mid'
      onChange={e => {
        // Read the file
        const file = e.target.files[0]
        MIDILoader(file, onLoad, dispatch)
      }}
    />
  )
}
MIDIFilePicker = connect()(MIDIFilePicker)
export default MIDIFilePicker
