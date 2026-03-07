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
  handleSave: (text: string) => Promise<void>
  handleChange: () => void
  clearSaveError: () => void
}

export function useFileEditor({ filePath, tabId }: UseFileEditorOptions): UseFileEditorResult {
  const [content, setContent] = useState<string | null>(null)
  const [error, setError] = useState(false)
  const [saveError, setSaveError] = useState(false)
  const { markDirty, clearDirty } = useTabStore()
  const isDirty = useTabStore((s) => s.tabs.find((t) => t.id === tabId)?.isDirty ?? false)
  const contentVersion = useTabStore((s) => s.tabs.find((t) => t.id === tabId)?.contentVersion ?? 0)

  useEffect(() => {
    setContent(null)
    setError(false)
    setSaveError(false)
    window.electronAPI.fs.readFile(filePath)
      .then(setContent)
      .catch(() => setError(true))
  }, [filePath, contentVersion])

  const handleSave = useCallback(async (text: string) => {
    try {
      markSelfWritten(filePath)
      await window.electronAPI.fs.writeFile(filePath, text)
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

  return { content, error, saveError, isDirty, handleSave, handleChange, clearSaveError }
}
