import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from 'react'
import MonacoEditor, { loader, type OnMount } from '@monaco-editor/react'
import * as monaco from 'monaco-editor'
import type { editor } from 'monaco-editor'
import { ORQA_THEME_NAME, orqaThemeData } from './orqa-theme'

// Use local monaco-editor instead of CDN for offline Electron support
loader.config({ monaco })

export interface CodeEditorProps {
  initialContent: string
  filePath: string
  onSave: (content: string) => void
  onChange: () => void
}

export interface CodeEditorHandle {
  save: () => void
  format: () => void
}

let themeRegistered = false

export const CodeEditor = forwardRef<CodeEditorHandle, CodeEditorProps>(
  function CodeEditor({ initialContent, filePath, onSave, onChange }, ref) {
    const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null)
    const onSaveRef = useRef(onSave)
    const onChangeRef = useRef(onChange)
    onSaveRef.current = onSave
    onChangeRef.current = onChange

    const save = useCallback(() => {
      const model = editorRef.current?.getModel()
      if (model) {
        onSaveRef.current(model.getValue())
      }
    }, [])

    const format = useCallback(async () => {
      const action = editorRef.current?.getAction('editor.action.formatDocument')
      if (action) {
        await action.run()
      }
    }, [])

    useImperativeHandle(ref, () => ({ save, format }), [save, format])

    const handleMount: OnMount = useCallback((editor, monaco) => {
      if (!themeRegistered) {
        monaco.editor.defineTheme(ORQA_THEME_NAME, orqaThemeData)
        themeRegistered = true
      }
      monaco.editor.setTheme(ORQA_THEME_NAME)

      editorRef.current = editor

      // Cmd/Ctrl+S to save
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
        const model = editor.getModel()
        if (model) {
          onSaveRef.current(model.getValue())
        }
      })

      editor.onDidChangeModelContent(() => {
        onChangeRef.current()
      })
    }, [])

    // Dispose the Monaco model on unmount to prevent duplicate model warnings
    // when the same file is reopened in a new tab
    useEffect(() => {
      return () => {
        const model = editorRef.current?.getModel()
        model?.dispose()
        editorRef.current = null
      }
    }, [])

    // Monaco uses the path to auto-detect language from extension.
    // Use a simple path (no scheme) to avoid URI authority issues.
    const monacoPath = filePath.startsWith('/') ? filePath : `/${filePath}`

    return (
      <MonacoEditor
        defaultValue={initialContent}
        defaultPath={monacoPath}
        theme={ORQA_THEME_NAME}
        onMount={handleMount}
        options={{
          fontSize: 13,
          fontFamily: "ui-monospace, 'SF Mono', Monaco, 'Cascadia Code', monospace",
          lineHeight: 1.5,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          padding: { top: 16, bottom: 16 },
          renderLineHighlight: 'line',
          smoothScrolling: true,
          cursorSmoothCaretAnimation: 'on',
          bracketPairColorization: { enabled: true },
          automaticLayout: true,
          wordWrap: 'on',
          tabSize: 2,
        }}
      />
    )
  },
)
