import {IconButton, makeStyles, Snackbar, SnackbarContent} from "@material-ui/core";
import React from "react";
import {connect} from "react-redux";
import {CheckCircle, Close, Error, Info, Warning} from "@material-ui/icons";
import {amber, green} from "@material-ui/core/colors";
import clsx from "clsx";

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

export const variantIcon = {
  success: CheckCircle,
  warning: Warning,
  error: Error,
  info: Info,
};

const useStyles = makeStyles((theme) => ({
  success: {
    backgroundColor: green[600],
  },
  error: {
    backgroundColor: theme.palette.error.dark,
  },
  info: {
    backgroundColor: theme.palette.primary.main,
  },
  warning: {
    backgroundColor: amber[700],
  },
  icon: {
    fontSize: 20,
  },
  iconVariant: {
    opacity: 0.9,
    marginRight: theme.spacing(1),
  },
  message: {
    display: 'flex',
    alignItems: 'center',
  },
}));

const _messageSnackbar = ({
  openSnack,
  variant,
  message,
  dispatch,
  ...customTag
}) => {
  const handleClose = () => dispatch({type: 'SNACK_UNLOAD'})
  const classes = useStyles();
  variant = Object.keys(variantIcon).includes(variant) ? variant : 'info'
  const Icon = variantIcon[variant];

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
      <SnackbarContent
        className={clsx(classes[variant])}
        aria-describedby="snackbar"
        message={
          <span id="snackbar" className={classes.message}>
            <Icon className={clsx(classes.icon, classes.iconVariant)} />
            {message}
          </span>
        }
        action={[
          <IconButton key="close" aria-label="close" color="inherit" onClick={handleClose}>
            <Close className={classes.icon} />
          </IconButton>
        ]}
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
