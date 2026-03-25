import type { MutableRefObject } from 'react'
import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { Editor, rootCtx, defaultValueCtx, editorViewCtx, serializerCtx } from '@milkdown/kit/core'
import {
  commonmark,
  hardbreakFilterNodes,
  headingKeymap,
  bulletListKeymap,
  orderedListKeymap,
  blockquoteKeymap,
  codeBlockKeymap,
} from '@milkdown/kit/preset/commonmark'
import { gfm } from '@milkdown/kit/preset/gfm'
import { history } from '@milkdown/kit/plugin/history'
import { listener, listenerCtx } from '@milkdown/kit/plugin/listener'
import { Milkdown, MilkdownProvider, useEditor, useInstance } from '@milkdown/react'
import { nord } from '@milkdown/theme-nord'
import { slashFactory, SlashProvider } from '@milkdown/plugin-slash'
import { diagram, diagramSchema, mermaidConfigCtx } from '@milkdown/plugin-diagram'
import { $view, $prose } from '@milkdown/utils'
import { Plugin, PluginKey } from '@milkdown/kit/prose/state'
import { createRoot } from 'react-dom/client'
import mermaid from 'mermaid'
import '@milkdown/theme-nord/style.css'
import './milkdown-overrides.css'
import { extractFrontmatter, prependFrontmatter } from '../serialization/frontmatter'
import { SlashMenu } from './SlashMenu'
import { FindBar } from './FindBar'
import { searchPlugin, searchKeymapPlugin, setFindBarCallbacks, syncFindBarVisible } from './find-plugin'

export interface OrqaEditorProps {
  initialContent: string
  onSave: (markdown: string) => void
  onChange?: () => void
  onReady?: (serializedContent: string) => void
  onLinkClick?: (href: string) => void
}

export interface OrqaEditorHandle {
  save: () => void
  getContent: () => string | null
  openFind: () => void
}

// --- Slash plugin ---
const slash = slashFactory('orqa-slash')

// --- Diagram node view: renders mermaid SVG with split-pane editor ---
const diagramView = $view(diagramSchema.node, () => (node, view, getPos) => {
  const dom = document.createElement('div')
  dom.className = 'milkdown-diagram'
  dom.contentEditable = 'false'

  let currentCode = node.attrs.value as string
  const identity = node.attrs.identity as string
  let isEditing = false
  let debounceTimer: ReturnType<typeof setTimeout> | null = null

  const renderSvgInto = async (code: string, container: HTMLElement) => {
    if (!code?.trim()) {
      container.innerHTML = '<div class="milkdown-diagram-empty">Empty diagram — click to edit</div>'
      return
    }
    try {
      mermaid.initialize({ startOnLoad: false, theme: 'dark' })
      const id = `mermaid-${identity}-${Date.now()}`
      const { svg } = await mermaid.render(id, code)
      container.innerHTML = `<div class="milkdown-diagram-svg">${svg}</div>`
    } catch {
      container.innerHTML = '<div class="milkdown-diagram-error">Invalid Mermaid syntax</div>'
    }
  }

  const renderViewMode = () => {
    isEditing = false
    dom.innerHTML = ''

    // SVG container
    const svgContainer = document.createElement('div')
    svgContainer.className = 'milkdown-diagram-view'
    dom.appendChild(svgContainer)
    renderSvgInto(currentCode, svgContainer)

    // Edit button (visible on hover via CSS)
    const editBtn = document.createElement('button')
    editBtn.className = 'milkdown-diagram-edit-btn'
    editBtn.textContent = 'Edit'
    editBtn.addEventListener('click', (e) => {
      e.stopPropagation()
      startEditing()
    })
    dom.appendChild(editBtn)
  }

  const commitCode = (newCode: string) => {
    if (typeof getPos === 'function') {
      const pos = getPos()
      if (pos != null) {
        const tr = view.state.tr.setNodeMarkup(pos, undefined, {
          ...node.attrs,
          value: newCode,
        })
        view.dispatch(tr)
      }
    }
    currentCode = newCode
  }

  const startEditing = () => {
    isEditing = true
    dom.innerHTML = ''
    dom.classList.add('milkdown-diagram--editing')

    const splitPane = document.createElement('div')
    splitPane.className = 'milkdown-diagram-split'

    // Left: code editor
    const editorPane = document.createElement('div')
    editorPane.className = 'milkdown-diagram-split-left'
    const textarea = document.createElement('textarea')
    textarea.className = 'milkdown-diagram-editor'
    textarea.value = currentCode
    textarea.rows = Math.max(6, currentCode.split('\n').length + 2)
    textarea.spellcheck = false
    editorPane.appendChild(textarea)

    // Right: live preview
    const previewPane = document.createElement('div')
    previewPane.className = 'milkdown-diagram-split-right'
    renderSvgInto(currentCode, previewPane)

    splitPane.appendChild(editorPane)
    splitPane.appendChild(previewPane)
    dom.appendChild(splitPane)

    // Live preview with 300ms debounce
    textarea.addEventListener('input', () => {
      if (debounceTimer) clearTimeout(debounceTimer)
      debounceTimer = setTimeout(() => {
        renderSvgInto(textarea.value, previewPane)
      }, 300)
    })

    // Escape exits edit mode
    textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        commitCode(textarea.value)
        dom.classList.remove('milkdown-diagram--editing')
        renderViewMode()
      }
    })

    // Blur exits (but not if clicking within the diagram container)
    textarea.addEventListener('blur', (e) => {
      const related = e.relatedTarget as HTMLElement | null
      if (dom.contains(related)) return
      commitCode(textarea.value)
      dom.classList.remove('milkdown-diagram--editing')
      renderViewMode()
    })

    textarea.focus()
  }

  // Click on view mode → start editing
  dom.addEventListener('click', (e) => {
    if (!isEditing && !(e.target as HTMLElement).closest('.milkdown-diagram-edit-btn')) {
      startEditing()
    }
  })

  renderViewMode()

  return {
    dom,
    stopEvent: (event: Event) => {
      return dom.contains(event.target as HTMLElement)
    },
    update: (updatedNode) => {
      if (updatedNode.type.name !== 'diagram') return false
      const newCode = updatedNode.attrs.value as string
      if (newCode !== currentCode && !isEditing) {
        currentCode = newCode
        renderViewMode()
      }
      return true
    },
    ignoreMutation: () => true,
    destroy: () => {
      if (debounceTimer) clearTimeout(debounceTimer)
    },
  }
})

// --- Shift+Enter in table cells: always insert hardbreak (no paragraph conversion) ---
const tableHardbreakPlugin = $prose(() => new Plugin({
  key: new PluginKey('orqa-table-hardbreak'),
  props: {
    handleKeyDown(view, event) {
      if (event.key === 'Enter' && event.shiftKey && !event.ctrlKey && !event.metaKey) {
        const { state, dispatch } = view
        const { $from } = state.selection
        for (let d = $from.depth; d > 0; d--) {
          const nodeName = $from.node(d).type.name
          if (nodeName === 'table_cell' || nodeName === 'table_header') {
            const tr = state.tr
              .replaceSelectionWith(state.schema.nodes.hardbreak.create())
              .scrollIntoView()
            dispatch(tr)
            return true
          }
        }
      }
      return false
    },
  },
}))

// --- Open links in external browser on Cmd/Ctrl+Click ---
// Uses a mutable ref so the callback can be updated without recreating the plugin
let linkClickCallback: ((href: string) => void) | undefined

const linkClickPlugin = $prose(() => new Plugin({
  key: new PluginKey('orqa-link-click'),
  props: {
    handleClick(view, pos, event) {
      if (!event.metaKey && !event.ctrlKey) return false
      const $pos = view.state.doc.resolve(pos)
      const marks = $pos.marks()
      const linkMark = marks.find((m) => m.type.name === 'link')
      if (!linkMark) return false
      const href = linkMark.attrs.href as string
      if (href) {
        if (linkClickCallback) {
          linkClickCallback(href)
        } else {
          window.open(href, '_blank')
        }
      }
      return true
    },
  },
}))

function MilkdownEditor({
  defaultValue,
  onChangeRef,
  onLinkClickRef,
  findBarVisible,
  findBarMode,
  onFindBarClose,
}: {
  defaultValue: string
  onChangeRef: MutableRefObject<(() => void) | undefined>
  onLinkClickRef: MutableRefObject<((href: string) => void) | undefined>
  findBarVisible: boolean
  findBarMode: 'find' | 'replace'
  onFindBarClose: () => void
}) {
  // Keep the module-level callback in sync with the ref
  linkClickCallback = onLinkClickRef.current
  useEditor((root) => {
    // State for slash menu — shared between the provider and React component
    let currentFilter = ''
    let menuVisible = false
    let reactRoot: ReturnType<typeof createRoot> | null = null

    return Editor.make()
      .config(nord)
      .config((ctx) => {
        ctx.set(rootCtx, root)
        ctx.set(defaultValueCtx, defaultValue)
        // Allow hardbreaks (Shift+Enter) inside table cells
        ctx.set(hardbreakFilterNodes.key, ['code_block'])
        // Mermaid config
        ctx.set(mermaidConfigCtx.key, { startOnLoad: false, theme: 'dark' })
        // Google Docs-style keyboard shortcuts
        ctx.set(headingKeymap.ctx.key, {
          TurnIntoH1: { shortcuts: ['Mod-Alt-1', 'Mod-Shift-1'] },
          TurnIntoH2: { shortcuts: ['Mod-Alt-2', 'Mod-Shift-2'] },
          TurnIntoH3: { shortcuts: ['Mod-Alt-3', 'Mod-Shift-3'] },
          TurnIntoH4: { shortcuts: ['Mod-Alt-4', 'Mod-Shift-4'] },
          TurnIntoH5: { shortcuts: ['Mod-Alt-5', 'Mod-Shift-5'] },
          TurnIntoH6: { shortcuts: ['Mod-Alt-6', 'Mod-Shift-6'] },
          DowngradeHeading: { shortcuts: ['Delete', 'Backspace'] },
        })
        ctx.set(bulletListKeymap.ctx.key, {
          WrapInBulletList: { shortcuts: ['Mod-Alt-8', 'Mod-Shift-8'] },
        })
        ctx.set(orderedListKeymap.ctx.key, {
          WrapInOrderedList: { shortcuts: ['Mod-Alt-7', 'Mod-Shift-7'] },
        })
        ctx.set(blockquoteKeymap.ctx.key, {
          WrapInBlockquote: { shortcuts: ['Mod-Shift-b', 'Mod-Shift-9'] },
        })
        ctx.set(codeBlockKeymap.ctx.key, {
          CreateCodeBlock: { shortcuts: ['Mod-Alt-c', 'Mod-Shift-c'] },
        })
        // Listener
        ctx.get(listenerCtx).markdownUpdated((_ctx, markdown, prevMarkdown) => {
          if (markdown !== prevMarkdown) {
            onChangeRef.current?.()
          }
        })
        // Slash menu
        ctx.set(slash.key, {
          view: () => {
            const content = document.createElement('div')
            content.className = 'slash-menu-container'

            const provider = new SlashProvider({
              content,
              trigger: '/',
              shouldShow: (view) => {
                const { state } = view
                const { selection } = state
                if (!selection.empty) return false
                const { $from } = selection
                const node = $from.node()
                if (node.type.name !== 'paragraph') return false
                // Only trigger slash menu when "/" is the first character in the paragraph
                const textBeforeCursor = node.textContent.slice(0, $from.parentOffset)
                if (!textBeforeCursor.startsWith('/')) return false
                // Don't trigger if there's a space after the slash
                const afterSlash = textBeforeCursor.slice(1)
                if (afterSlash.includes(' ')) return false
                currentFilter = afterSlash
                return true
              },
            })

            const renderMenu = () => {
              if (!reactRoot) {
                reactRoot = createRoot(content)
              }
              reactRoot.render(
                <SlashMenu
                  ctx={ctx}
                  onSelect={() => provider.hide()}
                  filter={currentFilter}
                  visible={menuVisible}
                />
              )
            }

            provider.onShow = () => {
              menuVisible = true
              renderMenu()
            }

            provider.onHide = () => {
              menuVisible = false
              currentFilter = ''
              renderMenu()
            }

            return {
              update: (updatedView, prevState) => {
                provider.update(updatedView, prevState)
                // Re-render React component with updated filter while visible
                if (menuVisible && reactRoot) {
                  renderMenu()
                }
              },
              destroy: () => {
                provider.destroy()
                reactRoot?.unmount()
                content.remove()
              },
            }
          },
        })
      })
      .use(commonmark)
      .use(gfm)
      .use(history)
      .use(listener)
      .use(slash)
      .use(diagram)
      .use(diagramView)
      .use(tableHardbreakPlugin)
      .use(linkClickPlugin)
      .use(searchPlugin)
      .use(searchKeymapPlugin)
  }, [defaultValue])

  return (
    <>
      <div className="orqa-find-bar-anchor">
        <FindBar visible={findBarVisible} initialMode={findBarMode} onClose={onFindBarClose} />
      </div>
      <Milkdown />
    </>
  )
}

function EditorWithHandle({
  defaultValue,
  frontmatter,
  onSaveRef,
  onChangeRef,
  onReadyRef,
  onLinkClickRef,
  handleRef,
}: {
  defaultValue: string
  frontmatter: string | null
  onSaveRef: MutableRefObject<(markdown: string) => void>
  onChangeRef: MutableRefObject<(() => void) | undefined>
  onReadyRef: MutableRefObject<((content: string) => void) | undefined>
  onLinkClickRef: MutableRefObject<((href: string) => void) | undefined>
  handleRef: MutableRefObject<OrqaEditorHandle | null>
}) {
  const [loading, getInstance] = useInstance()
  const [findBarVisible, setFindBarVisible] = useState(false)
  const [findBarMode, setFindBarMode] = useState<'find' | 'replace'>('find')

  const openFindBar = useCallback((mode: 'find' | 'replace') => {
    setFindBarMode(mode)
    setFindBarVisible(true)
  }, [])

  const closeFindBar = useCallback(() => {
    setFindBarVisible(false)
  }, [])

  // Register callbacks so ProseMirror keymap can toggle the find bar
  useEffect(() => {
    setFindBarCallbacks(openFindBar, closeFindBar)
    return () => setFindBarCallbacks(() => {}, () => {})
  }, [openFindBar, closeFindBar])

  // Keep find bar visibility in sync for Escape key handling
  useEffect(() => {
    syncFindBarVisible(findBarVisible)
  }, [findBarVisible])

  // Fire onReady with serialized content when editor finishes initializing
  useEffect(() => {
    if (loading) return
    const editor = getInstance()
    if (!editor) return
    const ctx = editor.ctx
    const view = ctx.get(editorViewCtx)
    const serializer = ctx.get(serializerCtx)
    const markdown = serializer(view.state.doc)
    const full = prependFrontmatter(frontmatter, markdown)
    onReadyRef.current?.(full)
  }, [loading, getInstance, frontmatter, onReadyRef])

  const getContent = useCallback((): string | null => {
    if (loading) return null
    const editor = getInstance()
    if (!editor) return null
    const ctx = editor.ctx
    const view = ctx.get(editorViewCtx)
    const serializer = ctx.get(serializerCtx)
    const markdown = serializer(view.state.doc)
    return prependFrontmatter(frontmatter, markdown)
  }, [loading, getInstance, frontmatter])

  const save = useCallback(() => {
    const full = getContent()
    if (full != null) {
      onSaveRef.current(full)
    }
  }, [getContent, onSaveRef])

  const openFind = useCallback(() => {
    openFindBar('find')
  }, [openFindBar])

  // Expose save, getContent, and openFind to parent via mutable ref
  if (handleRef.current?.save !== save || handleRef.current?.getContent !== getContent || handleRef.current?.openFind !== openFind) {
    handleRef.current = { save, getContent, openFind }
  }

  return (
    <MilkdownEditor
      defaultValue={defaultValue}
      onChangeRef={onChangeRef}
      onLinkClickRef={onLinkClickRef}
      findBarVisible={findBarVisible}
      findBarMode={findBarMode}
      onFindBarClose={closeFindBar}
    />
  )
}

export const OrqaEditor = forwardRef<OrqaEditorHandle, OrqaEditorProps>(
  function OrqaEditor({ initialContent, onSave, onChange, onReady, onLinkClick }, ref) {
    const onSaveRef = useRef(onSave)
    const onChangeRef = useRef(onChange)
    const onReadyRef = useRef(onReady)
    const onLinkClickRef = useRef(onLinkClick)
    onSaveRef.current = onSave
    onChangeRef.current = onChange
    onReadyRef.current = onReady
    onLinkClickRef.current = onLinkClick

    const { frontmatter, body } = useMemo(
      () => extractFrontmatter(initialContent),
      [initialContent],
    )

    const handleRef = useRef<OrqaEditorHandle | null>(null)

    useImperativeHandle(ref, () => ({
      save: () => handleRef.current?.save(),
      getContent: () => handleRef.current?.getContent() ?? null,
      openFind: () => handleRef.current?.openFind(),
    }), [])

    return (
      <MilkdownProvider>
        <EditorWithHandle
          defaultValue={body}
          frontmatter={frontmatter}
          onSaveRef={onSaveRef}
          onChangeRef={onChangeRef}
          onReadyRef={onReadyRef}
          onLinkClickRef={onLinkClickRef}
          handleRef={handleRef}
        />
      </MilkdownProvider>
    )
  },
)
