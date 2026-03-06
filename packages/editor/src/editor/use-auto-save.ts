import { useEffect, useRef } from 'react'

interface UseAutoSaveOptions {
  isDirty: boolean
  onSave: () => Promise<void> | void
  debounceMs?: number
}

export function useAutoSave({ isDirty, onSave, debounceMs = 2000 }: UseAutoSaveOptions) {
  const isDirtyRef = useRef(isDirty)
  const onSaveRef = useRef(onSave)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  isDirtyRef.current = isDirty
  onSaveRef.current = onSave

  // Debounced save: reset timer every time isDirty changes to true
  useEffect(() => {
    if (!isDirty) {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
      return
    }

    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }

    timerRef.current = setTimeout(() => {
      if (isDirtyRef.current) {
        onSaveRef.current()
      }
      timerRef.current = null
    }, debounceMs)

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }
  }, [isDirty, debounceMs])

  // Save on visibility change (tab hidden) and window blur
  useEffect(() => {
    const saveIfDirty = () => {
      if (isDirtyRef.current) {
        onSaveRef.current()
      }
    }

    const handleVisibilityChange = () => {
      if (document.hidden) {
        saveIfDirty()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('blur', saveIfDirty)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('blur', saveIfDirty)
    }
  }, [])
}
