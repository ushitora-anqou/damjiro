import React, { useRef, useState, useCallback, useEffect } from 'react'

function MIDIFilePicker ({ onLoad }) {
  return (
    <input
      type='file'
      accept='audio/midi, audio/x-midi'
      onChange={e => {
        // Read the file
        try {
          const file = e.target.files[0]
          if (file.type !== 'audio/midi' && file.type !== 'audio/x-midi')
            throw 'invalid mime type'
          const reader = new FileReader()
          reader.onload = e => onLoad(e.target.result)
          reader.readAsArrayBuffer(file)
        } catch (e) {
          console.log(e)
        }
      }}
    />
  )
}

export default MIDIFilePicker
