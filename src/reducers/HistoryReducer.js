// Returns a new array including [entry, ...mem]. If # of entries in mem exceeds threshold,
// remove old entries.
function lstm (mem, entry) {
  const threshold = 10
  const ary = [entry].concat(mem)
  if (ary.length <= threshold) return ary
  return ary.slice(0, threshold)
}

export default function historyReducer (
  state = {
    gakufu: [],
    midi: []
  },
  action
) {
  switch (action.type) {
    case 'REMEMBER_GAKUFU':
      return {
        ...state,
        gakufu: lstm(state.gakufu, {
          name: action.name,
          data: action.gakufu
        })
      }

    case 'REMEMBER_MIDI':
      return {
        ...state,
        midi: lstm(state.midi, {
          name: action.name,
          data: action.midi
        })
      }

    default:
      return state
  }
}
