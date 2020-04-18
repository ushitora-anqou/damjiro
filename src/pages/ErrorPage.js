import React from "react";
import {connect} from "react-redux";
import Grid from "@material-ui/core/Grid";
import { Alert, AlertTitle } from '@material-ui/lab';
import querystring from 'querystring';

const _errorPage = ({search}) => {
  const codeNum2Message = (code) => {
    switch (code) {
      case 404:
        return 'Not Found'
      default:
        return 'Unexpected Error'
    }
  }

  const params = querystring.parse(search.slice(1))
  const statusCodeNum = Number(params.status)

  return(
    <Grid container direction='row' justify='center'>
      <Grid item xs={8}>
        <Alert severity="error">
          <AlertTitle>{statusCodeNum}</AlertTitle>
          {codeNum2Message(statusCodeNum)}
        </Alert>
      </Grid>
    </Grid>
  )
}

const mapStateToProps = state => ({
  search: state.router.location.search
})

const ErrorPage = connect(mapStateToProps)(_errorPage)
export default ErrorPage
