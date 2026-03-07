import { useEffect, useRef, useCallback } from 'react'
import { createUniver as createUniverFn, LocaleType, mergeLocales } from '@univerjs/presets'
import { UniverSheetsCorePreset } from '@univerjs/preset-sheets-core'
import UniverPresetSheetsCoreEnUS from '@univerjs/preset-sheets-core/locales/en-US'
import type { IWorkbookData } from '@univerjs/core'

type FUniver = ReturnType<typeof createUniverFn>['univerAPI']

import '@univerjs/preset-sheets-core/lib/index.css'
import './styles.css'

export interface UseSpreadsheetOptions {
  container: HTMLDivElement | null
  workbookData: IWorkbookData | null
  onChange?: () => void
}

export interface UseSpreadsheetResult {
  getWorkbookData: () => IWorkbookData | null
}

export function useSpreadsheet({
  container,
  workbookData,
  onChange,
}: UseSpreadsheetOptions): UseSpreadsheetResult {
  const univerAPIRef = useRef<FUniver | null>(null)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  useEffect(() => {
    if (!container || !workbookData) return

    const { univerAPI } = createUniverFn({
      locale: LocaleType.EN_US,
      locales: {
        [LocaleType.EN_US]: mergeLocales(UniverPresetSheetsCoreEnUS),
      },
      presets: [
        UniverSheetsCorePreset({
          container,
        }),
      ],
    })

    univerAPIRef.current = univerAPI
    univerAPI.createWorkbook(workbookData)

    const disposable = univerAPI.onCommandExecuted(() => {
      onChangeRef.current?.()
    })

    return () => {
      disposable.dispose()
      univerAPI.dispose()
      univerAPIRef.current = null
    }
  }, [container, workbookData])

  const getWorkbookData = useCallback((): IWorkbookData | null => {
    const api = univerAPIRef.current
    if (!api) return null
    const fWorkbook = api.getActiveWorkbook()
    if (!fWorkbook) return null
    return fWorkbook.save()
  }, [])

  return { getWorkbookData }
}
