import Papa from 'papaparse'
import type { IWorkbookData, ICellData, IStyleData } from '@univerjs/core'
import { LocaleType, CellValueType, BooleanNumber } from '@univerjs/core'
import LuckyExcel from '@zwight/luckyexcel'
import ExcelJS from '@zwight/exceljs'

const DEFAULT_SHEET_ID = 'sheet-001'
const DEFAULT_WORKBOOK_ID = 'workbook-001'

// ─── CSV ───────────────────────────────────────────────────────

export function csvToWorkbookData(csvText: string): IWorkbookData {
  const parsed = Papa.parse<string[]>(csvText, {
    header: false,
    skipEmptyLines: true,
  })

  const rows = parsed.data
  if (rows.length === 0) {
    return createEmptyWorkbook()
  }

  const columnCount = Math.max(...rows.map((r) => r.length))
  const cellData: Record<number, Record<number, ICellData>> = {}

  for (let r = 0; r < rows.length; r++) {
    cellData[r] = {}
    for (let c = 0; c < rows[r].length; c++) {
      const raw = rows[r][c]
      if (raw === '') continue

      const num = Number(raw)
      if (!isNaN(num) && raw.trim() !== '') {
        cellData[r][c] = { v: num, t: CellValueType.NUMBER }
      } else {
        cellData[r][c] = { v: raw, t: CellValueType.STRING }
      }
    }
  }

  // Bold the header row
  if (cellData[0]) {
    for (const colKey of Object.keys(cellData[0])) {
      const c = Number(colKey)
      cellData[0][c] = {
        ...cellData[0][c],
        s: { bl: BooleanNumber.TRUE } as IStyleData,
      }
    }
  }

  return {
    id: DEFAULT_WORKBOOK_ID,
    name: 'CSV Import',
    appVersion: '0.16.1',
    locale: LocaleType.EN_US,
    styles: {},
    sheetOrder: [DEFAULT_SHEET_ID],
    sheets: {
      [DEFAULT_SHEET_ID]: {
        id: DEFAULT_SHEET_ID,
        name: 'Sheet1',
        rowCount: Math.max(rows.length + 100, 200),
        columnCount: Math.max(columnCount + 26, 52),
        defaultRowHeight: 24,
        defaultColumnWidth: 100,
        cellData,
      },
    },
  }
}

export function workbookDataToCsv(workbookData: IWorkbookData): string {
  const sheetId = workbookData.sheetOrder?.[0]
  if (!sheetId) return ''

  const sheet = workbookData.sheets[sheetId]
  if (!sheet?.cellData) return ''

  const cellData = sheet.cellData as Record<number, Record<number, ICellData>>
  const rowIndices = Object.keys(cellData).map(Number).sort((a, b) => a - b)
  if (rowIndices.length === 0) return ''

  const maxRow = rowIndices[rowIndices.length - 1]
  let maxCol = 0
  for (const ri of rowIndices) {
    const cols = Object.keys(cellData[ri]).map(Number)
    if (cols.length > 0) {
      maxCol = Math.max(maxCol, Math.max(...cols))
    }
  }

  const rows: (string | number)[][] = []
  for (let r = 0; r <= maxRow; r++) {
    const row: (string | number)[] = []
    for (let c = 0; c <= maxCol; c++) {
      const cell = cellData[r]?.[c]
      const v = cell?.v
      row.push(v != null ? String(v) : '')
    }
    rows.push(row)
  }

  return Papa.unparse(rows)
}

// ─── XLSX Import ───────────────────────────────────────────────

export function xlsxToWorkbookData(buffer: Uint8Array): Promise<IWorkbookData> {
  return new Promise((resolve, reject) => {
    const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer
    const file = new File([arrayBuffer], 'spreadsheet.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })

    LuckyExcel.transformExcelToUniver(
      file,
      (workbookData: IWorkbookData) => {
        if (workbookData) {
          resolve(workbookData)
        } else {
          resolve(createEmptyWorkbook())
        }
      },
      (err: Error) => {
        reject(err)
      }
    )
  })
}

// ─── XLSX Export ────────────────────────────────────────────────

export function workbookDataToXlsx(workbookData: IWorkbookData): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    LuckyExcel.transformUniverToExcel({
      snapshot: workbookData,
      getBuffer: true,
      success: (buffer: unknown) => {
        if (buffer) {
          resolve(new Uint8Array(buffer as ArrayBuffer))
        } else {
          reject(new Error('Failed to export XLSX: no buffer returned'))
        }
      },
      error: (err: Error) => {
        reject(err)
      },
    })
  })
}

// ─── Empty Workbook ────────────────────────────────────────────

function createEmptyWorkbook(): IWorkbookData {
  return {
    id: DEFAULT_WORKBOOK_ID,
    name: 'New Spreadsheet',
    appVersion: '0.16.1',
    locale: LocaleType.EN_US,
    styles: {},
    sheetOrder: [DEFAULT_SHEET_ID],
    sheets: {
      [DEFAULT_SHEET_ID]: {
        id: DEFAULT_SHEET_ID,
        name: 'Sheet1',
        rowCount: 200,
        columnCount: 52,
        defaultRowHeight: 24,
        defaultColumnWidth: 73,
        cellData: {},
      },
    },
  }
}

export async function createEmptyXlsxBytes(): Promise<Uint8Array> {
  const workbook = new ExcelJS.Workbook()
  workbook.addWorksheet('Sheet1')
  const buffer = await workbook.xlsx.writeBuffer()
  return new Uint8Array(buffer)
}
