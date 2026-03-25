import { useEffect, useRef, type RefObject } from 'react'
import { useTabStore } from '../stores/tab-store'

interface SaveableHandle {
  getContent?: () => string | null
  save: () => void | Promise<void>
}

/**
 * Saves editor content when the user switches away from this tab.
 * Uses a Zustand subscription that fires synchronously before React
 * re-renders, so the editor is still mounted and refs are valid.
 */
export function useSaveOnTabSwitch(
  tabId: string,
  editorRef: RefObject<SaveableHandle | null>,
  baseline?: string | null,
): void {
  const baselineRef = useRef(baseline)
  baselineRef.current = baseline ?? null

  useEffect(() => {
    let prevActiveId = useTabStore.getState().activeTabId

    const unsub = useTabStore.subscribe((state) => {
      const newActiveId = state.activeTabId
      if (prevActiveId === tabId && newActiveId !== tabId) {
        const tab = state.tabs.find((t) => t.id === tabId)
        if (tab?.isDirty) {
          const handle = editorRef.current
          if (handle) {
            if (handle.getContent && baselineRef.current != null) {
              const current = handle.getContent()
              if (current != null && current === baselineRef.current) {
                useTabStore.getState().clearDirty(tabId)
                prevActiveId = newActiveId
                return
              }
            }
            handle.save()
          }
        }
      }
      prevActiveId = newActiveId
    })

    return unsub
  }, [tabId, editorRef])
}
