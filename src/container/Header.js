import React from 'react'
import { Container, Grid, Typography, ButtonBase } from '@material-ui/core'
import { connect } from 'react-redux'
import { push } from 'connected-react-router'

const _header = ({ push }) => {
  const handleTop = () => push('/')

  return (
    <Container>
      <Grid container direction='row' justify='center'>
        <Grid item>
          <ButtonBase onClick={handleTop}>
            <Typography variant='h3'>Damjiro</Typography>
          </ButtonBase>
        </Grid>
      </Grid>
    </Container>
  )
}
const Header = connect(null, { push })(_header)
export default Header
