import { useCallback, useEffect, useState } from 'react'
import { useTabStore } from '../stores/tab-store'
import { markSelfWritten } from './use-fs-events'

interface UseFileEditorOptions {
  filePath: string
  tabId: string
}

interface UseFileEditorResult {
  content: string | null
  error: boolean
  saveError: boolean
  isDirty: boolean
  baseline: string | null
  setBaseline: (content: string) => void
  handleSave: (text: string) => Promise<void>
  handleChange: () => void
  clearSaveError: () => void
}

export function useFileEditor({ filePath, tabId }: UseFileEditorOptions): UseFileEditorResult {
  const [content, setContent] = useState<string | null>(null)
  const [error, setError] = useState(false)
  const [saveError, setSaveError] = useState(false)
  const [baseline, setBaseline] = useState<string | null>(null)
  const { markDirty, clearDirty } = useTabStore()
  const isDirty = useTabStore((s) => s.tabs.find((t) => t.id === tabId)?.isDirty ?? false)
  const contentVersion = useTabStore((s) => s.tabs.find((t) => t.id === tabId)?.contentVersion ?? 0)

  useEffect(() => {
    let cancelled = false
    setContent(null)
    setError(false)
    setSaveError(false)
    setBaseline(null)
    window.electronAPI.fs.readFile(filePath)
      .then((data) => { if (!cancelled) setContent(data) })
      .catch(() => { if (!cancelled) setError(true) })
    return () => { cancelled = true }
  }, [filePath, contentVersion])

  const handleSave = useCallback(async (text: string) => {
    try {
      markSelfWritten(filePath)
      await window.electronAPI.fs.writeFile(filePath, text)
      setBaseline(text)
      clearDirty(tabId)
      setSaveError(false)
    } catch {
      setSaveError(true)
    }
  }, [filePath, tabId, clearDirty])

  const handleChange = useCallback(() => {
    markDirty(tabId)
  }, [tabId, markDirty])

  const clearSaveError = useCallback(() => setSaveError(false), [])

  return { content, error, saveError, isDirty, baseline, setBaseline, handleSave, handleChange, clearSaveError }
}
