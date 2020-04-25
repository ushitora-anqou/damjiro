import React from 'react'
import { Container, Grid, Typography, Link } from '@material-ui/core'
import { connect } from 'react-redux'
import { push } from 'connected-react-router'

const _footer = ({ push }) => {
  return (
    <Container>
      <Grid container direction='row' justify='center'>
        <Grid item>
          <Typography color='textSecondary'>
            Damjiro is under MIT License. You can contribute on GitHub at{' '}
            <Link
              href='https://github.com/ushitora-anqou/damjiro'
              target='_blank'
              rel='noreferrer'
            >
              ushitora-anqou/damjiro
            </Link>
            .
          </Typography>
        </Grid>
      </Grid>
    </Container>
  )
}
const Footer = connect(null, { push })(_footer)
export default Footer
