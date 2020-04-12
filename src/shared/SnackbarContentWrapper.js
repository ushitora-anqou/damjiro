import {IconButton, makeStyles, SnackbarContent} from "@material-ui/core";
import {amber, green} from "@material-ui/core/colors";
import {CheckCircle, Close, Warning, Error, Info} from "@material-ui/icons";
import clsx from "clsx";
import React from "react";

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

const SnackbarContentWrapper = ({
  message,
  onClose,
  variant,
}) => {
  const classes = useStyles();
  variant = Object.keys(variantIcon).includes(variant) ? variant : 'info'
  const Icon = variantIcon[variant];

  return (
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
        <IconButton key="close" aria-label="close" color="inherit" onClick={onClose}>
          <Close className={classes.icon} />
        </IconButton>,
      ]}
    />
  );
};
export default SnackbarContentWrapper
