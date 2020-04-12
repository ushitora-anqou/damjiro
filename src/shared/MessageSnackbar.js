import {Snackbar} from "@material-ui/core";
import SnackbarContentWrapper from "./SnackbarContentWrapper";
import React from "react";
import {connect} from "react-redux";

/**
 * Show snackbar with custom message from Redux.
 * How to use:
 * 1. Connect your component with dispatch. For example:
 * ```
 * const _yourComponent = (dispatch) => {
 *
 * }
 * const YourComponent()(_yourComponent);
 * ```
 * 2. Use dispatch() when you want to show messages with snackbar.
 * `dispatch({type: 'SNACK_LOAD', message: 'some Message', variant: 'error'})`
 *
 * @param openSnack
 *  from redux. no need to config.
 * @param variant default 'info'
 *  from redux, need to config. you can choose one of 'error', 'info', 'success', 'warning'.
 * @param message
 *  from redux, need to config.
 * @param dispatch
 *  from redux.
 * @param customTag
 *  you can customize Snackbar from material UI. add some tag implemented Snackbar.
 * @returns <Snackbar />
 */
const _messageSnackbar = ({
  openSnack,
  variant,
  message,
  dispatch,
  ...customTag
}) => {
  const handleClose = () => dispatch({type: 'SNACK_UNLOAD'})

  return (
    <Snackbar
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'center',
      }}
      open={openSnack}
      onClose={handleClose}
      {...customTag}
    >
      <SnackbarContentWrapper
        onClose={handleClose}
        variant={variant}
        message={message}
      />
    </Snackbar>
  )
}
const MessageSnackbar = connect(
  ({ snack: {openSnack, variant, message} }) => ({
    openSnack, variant, message
  })
)(_messageSnackbar)
export default MessageSnackbar
