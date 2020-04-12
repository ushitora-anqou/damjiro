const MIDILoader = (file, onLoad, dispatch) => {
  try {
    if (!['audio/midi', 'audio/x-midi', 'audio/mid'].includes(file.type)) {
      dispatch({type: 'SNACK_LOAD', message: 'Invalid mime type', variant: 'error'})
    } else {
      const reader = new FileReader()
      reader.onload = e => onLoad(e.target.result)
      reader.readAsArrayBuffer(file)
    }
  } catch (e) {
    dispatch({type: 'SNACK_LOAD', message: e.toString(), variant: 'error'})
  }
}
export default MIDILoader
