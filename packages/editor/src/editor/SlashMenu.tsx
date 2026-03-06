import { useCallback, useEffect, useRef, useState } from 'react'
import type { Ctx } from '@milkdown/kit/ctx'
import { commandsCtx, editorViewCtx } from '@milkdown/kit/core'
import {
  createCodeBlockCommand,
  wrapInHeadingCommand,
  wrapInBulletListCommand,
  wrapInOrderedListCommand,
  wrapInBlockquoteCommand,
  insertHrCommand,
} from '@milkdown/kit/preset/commonmark'
import { insertTableCommand } from '@milkdown/kit/preset/gfm'
import { insertDiagramCommand } from '@milkdown/plugin-diagram'

interface SlashItem {
  label: string
  keyword: string
  run: (ctx: Ctx) => void
}

const items: SlashItem[] = [
  {
    label: 'Heading 1',
    keyword: 'h1 heading1',
    run: (ctx) => ctx.get(commandsCtx).call(wrapInHeadingCommand.key, 1),
  },
  {
    label: 'Heading 2',
    keyword: 'h2 heading2',
    run: (ctx) => ctx.get(commandsCtx).call(wrapInHeadingCommand.key, 2),
  },
  {
    label: 'Heading 3',
    keyword: 'h3 heading3',
    run: (ctx) => ctx.get(commandsCtx).call(wrapInHeadingCommand.key, 3),
  },
  {
    label: 'Bullet List',
    keyword: 'bullet unordered ul',
    run: (ctx) => ctx.get(commandsCtx).call(wrapInBulletListCommand.key),
  },
  {
    label: 'Ordered List',
    keyword: 'numbered ordered ol',
    run: (ctx) => ctx.get(commandsCtx).call(wrapInOrderedListCommand.key),
  },
  {
    label: 'Code Block',
    keyword: 'code fence',
    run: (ctx) => ctx.get(commandsCtx).call(createCodeBlockCommand.key),
  },
  {
    label: 'Table',
    keyword: 'table grid',
    run: (ctx) => ctx.get(commandsCtx).call(insertTableCommand.key),
  },
  {
    label: 'Blockquote',
    keyword: 'quote blockquote',
    run: (ctx) => ctx.get(commandsCtx).call(wrapInBlockquoteCommand.key),
  },
  {
    label: 'Horizontal Rule',
    keyword: 'hr divider line separator',
    run: (ctx) => ctx.get(commandsCtx).call(insertHrCommand.key),
  },
  {
    label: 'Mermaid Diagram',
    keyword: 'mermaid diagram flowchart',
    run: (ctx) => ctx.get(commandsCtx).call(insertDiagramCommand.key),
  },
]

function removeTrigger(ctx: Ctx, length: number) {
  const view = ctx.get(editorViewCtx)
  const { state } = view
  const { from } = state.selection
  view.dispatch(state.tr.delete(from - length, from))
}

export function SlashMenu({
  ctx,
  onSelect,
  filter,
  visible,
}: {
  ctx: Ctx
  onSelect: () => void
  filter: string
  visible: boolean
}) {
  const [selected, setSelected] = useState(0)
  const listRef = useRef<HTMLDivElement>(null)

  const query = filter.toLowerCase()
  const filtered = query
    ? items.filter(
        (i) =>
          i.label.toLowerCase().includes(query) ||
          i.keyword.includes(query),
      )
    : items

  // Reset selection when filter changes
  useEffect(() => {
    setSelected(0)
  }, [filter])

  const execute = useCallback(
    (item: SlashItem) => {
      // +1 for the "/" trigger character
      removeTrigger(ctx, filter.length + 1)
      item.run(ctx)
      onSelect()
    },
    [ctx, onSelect, filter],
  )

  // Keyboard navigation — only when menu is visible
  useEffect(() => {
    if (!visible) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelected((s) => (s + 1) % filtered.length)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelected((s) => (s - 1 + filtered.length) % filtered.length)
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (filtered[selected]) {
          execute(filtered[selected])
        }
      } else if (e.key === 'Escape') {
        e.preventDefault()
        onSelect()
      }
    }

    window.addEventListener('keydown', handleKeyDown, true)
    return () => window.removeEventListener('keydown', handleKeyDown, true)
  }, [visible, filtered, selected, execute, onSelect])

  // Scroll selected into view
  useEffect(() => {
    const el = listRef.current?.children[selected] as HTMLElement | undefined
    el?.scrollIntoView({ block: 'nearest' })
  }, [selected])

  if (filtered.length === 0) {
    return (
      <div className="slash-menu-list">
        <div className="slash-menu-empty">No results</div>
      </div>
    )
  }

  return (
    <div className="slash-menu-list" ref={listRef}>
      {filtered.map((item, i) => (
        <button
          key={item.label}
          className={`slash-menu-item${i === selected ? ' slash-menu-item-active' : ''}`}
          onMouseDown={(e) => {
            e.preventDefault()
            execute(item)
          }}
          onMouseEnter={() => setSelected(i)}
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}
