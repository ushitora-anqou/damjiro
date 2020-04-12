export default function snackbarReducer (
  state = {
    loadSnack: false,
    message: '',
    variant: ''
  },
  action
) {
  switch (action.type) {
    case 'SNACK_LOAD':
      console.log('loaded', action)
      return {
        ...state,
        openSnack: true,
        message: action.message,
        variant: action.variant
      }

    case 'SNACK_UNLOAD':
      console.log('unloaded', action)
      return {
        ...state,
        openSnack: false,
      }

    default:
      return state
  }
}
