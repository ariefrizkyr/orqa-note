import { useRef, useCallback, useImperativeHandle, forwardRef, useState, useEffect } from 'react'
import type { IWorkbookData } from '@univerjs/core'
import { useSpreadsheet } from './useSpreadsheet'
import { csvToWorkbookData, workbookDataToCsv, xlsxToWorkbookData, workbookDataToXlsx } from './serialization'

export interface SpreadsheetEditorProps {
  data: Uint8Array | string
  fileType: 'xlsx' | 'csv'
  onChange?: () => void
  onSave?: (data: Uint8Array | string) => Promise<void>
}

export interface SpreadsheetEditorHandle {
  save: () => Promise<void>
}

export const SpreadsheetEditor = forwardRef<SpreadsheetEditorHandle, SpreadsheetEditorProps>(
  function SpreadsheetEditor({ data, fileType, onChange, onSave }, ref) {
    const [container, setContainer] = useState<HTMLDivElement | null>(null)
    const [workbookData, setWorkbookData] = useState<IWorkbookData | null>(null)
    const [parseError, setParseError] = useState(false)

    const containerCallbackRef = useCallback((node: HTMLDivElement | null) => {
      setContainer(node)
    }, [])

    // Parse input data into workbook data
    useEffect(() => {
      setParseError(false)
      setWorkbookData(null)
      if (fileType === 'csv') {
        try {
          setWorkbookData(csvToWorkbookData(data as string))
        } catch {
          setParseError(true)
        }
      } else {
        xlsxToWorkbookData(data as Uint8Array)
          .then(setWorkbookData)
          .catch(() => setParseError(true))
      }
    }, [data, fileType])

    const { getWorkbookData } = useSpreadsheet({
      container,
      workbookData,
      onChange,
    })

    const save = useCallback(async () => {
      const currentData = getWorkbookData()
      if (!currentData || !onSave) return

      if (fileType === 'csv') {
        const csvString = workbookDataToCsv(currentData)
        await onSave(csvString)
      } else {
        const xlsxBytes = await workbookDataToXlsx(currentData)
        await onSave(xlsxBytes)
      }
    }, [getWorkbookData, fileType, onSave])

    useImperativeHandle(ref, () => ({ save }), [save])

    if (parseError) {
      return (
        <div className="flex h-full items-center justify-center text-neutral-500">
          <p className="text-sm">Failed to parse spreadsheet file</p>
        </div>
      )
    }

    return (
      <div
        ref={containerCallbackRef}
        className="univer-spreadsheet-container"
        style={{ width: '100%', height: '100%', position: 'relative' }}
      >
        {!workbookData && (
          <div className="absolute inset-0 flex items-center justify-center text-neutral-500">
            <p className="text-sm">Loading spreadsheet...</p>
          </div>
        )}
      </div>
    )
  }
)
