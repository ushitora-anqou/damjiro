import React, { useState, useEffect } from 'react'
import Button from '@material-ui/core/Button'
import Dialog from '@material-ui/core/Dialog'
import DialogActions from '@material-ui/core/DialogActions'
import DialogContent from '@material-ui/core/DialogContent'
import DialogContentText from '@material-ui/core/DialogContentText'
import DialogTitle from '@material-ui/core/DialogTitle'

export default function WebGLSupportAlert () {
  const [doesSupport, setDoesSupport] = useState(false)
  const [open, setOpen] = useState(true)

  useEffect(() => {
    try {
      const canvas = document.createElement('canvas')
      const webGLContext =
        canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
      setDoesSupport(!!(window.WebGLRenderingContext && webGLContext))
    } catch (e) {
      setDoesSupport(false)
    }
  }, [])

  const handleClose = () => {
    setOpen(false)
  }

  if (doesSupport) return <div />

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      aria-labelledby='alert-dialog-title'
      aria-describedby='alert-dialog-description'
    >
      <DialogTitle id='alert-dialog-title'>
        WebGL is not enabled in your browser.
      </DialogTitle>
      <DialogContent>
        <DialogContentText id='alert-dialog-description'>
          Damjiro uses WebGL.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color='primary' autoFocus>
          OK
        </Button>
      </DialogActions>
    </Dialog>
  )
}
