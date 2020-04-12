import {Snackbar} from "@material-ui/core";
import SnackbarContentWrapper from "./SnackbarContentWrapper";
import React from "react";
import {connect} from "react-redux";

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
