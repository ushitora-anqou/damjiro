import React from 'react'
import PropTypes from 'prop-types'
import { makeStyles } from '@material-ui/core/styles'
import ListItem from '@material-ui/core/ListItem'
import ListItemText from '@material-ui/core/ListItemText'
import { FixedSizeList } from 'react-window'
import { Typography } from '@material-ui/core'

export default function HistorySelector ({
  width,
  height,
  itemSize,
  history,
  onSelect
}) {
  if (history.length === 0) return <Typography>No history.</Typography>

  return (
    <FixedSizeList
      width={width}
      height={height}
      itemSize={itemSize}
      itemCount={history.length}
    >
      {({ index, style }) => (
        <ListItem
          button
          style={style}
          key={index}
          onClick={() => onSelect(index, history[index])}
        >
          <ListItemText primary={history[index].name} />
        </ListItem>
      )}
    </FixedSizeList>
  )
}
