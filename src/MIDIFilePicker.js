import React from 'react'

function MIDIFilePicker ({ onLoad }) {
  return (
    <input
      type='file'
      accept='audio/midi, audio/x-midi, audio/mid'
      onChange={e => {
        // Read the file
        try {
          const file = e.target.files[0]
          if (!['audio/midi', 'audio/x-midi', 'audio/mid'].includes(file.type))
            throw new Error('invalid mime type')
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
