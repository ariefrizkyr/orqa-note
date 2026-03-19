import { app } from 'electron'
import { readFile, writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import type { GlobalUIState } from '../../shared/types'

const DEFAULT_STATE: GlobalUIState = {
  sidebarWidth: 260
}

function getFilePath(): string {
  return join(app.getPath('userData'), 'global-ui.json')
}

export async function getGlobalUIState(): Promise<GlobalUIState> {
  try {
    const data = await readFile(getFilePath(), 'utf-8')
    return { ...DEFAULT_STATE, ...JSON.parse(data) }
  } catch {
    return DEFAULT_STATE
  }
}

export async function saveGlobalUIState(state: GlobalUIState): Promise<void> {
  await mkdir(app.getPath('userData'), { recursive: true })
  await writeFile(getFilePath(), JSON.stringify(state, null, 2), 'utf-8')
}
