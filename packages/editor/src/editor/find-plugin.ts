import { $prose } from '@milkdown/utils'
import { search } from 'prosemirror-search'
import { keymap } from '@milkdown/kit/prose/keymap'

// Callback to toggle the find bar UI — set by the React layer
let findBarToggle: ((mode: 'find' | 'replace') => void) | undefined
let findBarClose: (() => void) | undefined
let findBarVisible = false

export function setFindBarCallbacks(
  toggle: (mode: 'find' | 'replace') => void,
  close: () => void,
) {
  findBarToggle = toggle
  findBarClose = close
}

export function syncFindBarVisible(visible: boolean) {
  findBarVisible = visible
}

// The prosemirror-search plugin handles decorations out of the box.
// CSS classes used:
//   .ProseMirror-search-match        — inactive matches
//   .ProseMirror-active-search-match  — current active match
export const searchPlugin = $prose(() => search())

export const searchKeymapPlugin = $prose(() =>
  keymap({
    'Mod-f': () => {
      findBarToggle?.('find')
      return true
    },
    'Mod-h': () => {
      findBarToggle?.('replace')
      return true
    },
    Escape: () => {
      if (findBarVisible && findBarClose) {
        findBarClose()
        return true
      }
      return false
    },
  }),
)
