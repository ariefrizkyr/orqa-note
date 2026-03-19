import { app } from 'electron'
import { readFile, writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { createHash } from 'crypto'
import type { WorkspaceState } from '../../shared/types'

function getWorkspaceHash(workspacePath: string): string {
  return createHash('md5').update(workspacePath).digest('hex').slice(0, 12)
}

function getWorkspaceDir(workspacePath: string): string {
  const hash = getWorkspaceHash(workspacePath)
  return join(app.getPath('userData'), 'workspaces', hash)
}

export function getSessionPartition(workspacePath: string): string {
  const hash = getWorkspaceHash(workspacePath)
  return `persist:orqa-${hash}`
}

export async function getRecentWorkspaces(): Promise<string[]> {
  const filePath = join(app.getPath('userData'), 'recent-workspaces.json')
  try {
    const data = await readFile(filePath, 'utf-8')
    return JSON.parse(data)
  } catch {
    return []
  }
}

export async function setRecentWorkspaces(paths: string[]): Promise<void> {
  const filePath = join(app.getPath('userData'), 'recent-workspaces.json')
  await mkdir(join(app.getPath('userData')), { recursive: true })
  await writeFile(filePath, JSON.stringify(paths, null, 2), 'utf-8')
}

export async function addRecentWorkspace(path: string): Promise<void> {
  const recent = await getRecentWorkspaces()
  const filtered = recent.filter((p) => p !== path)
  filtered.unshift(path)
  await setRecentWorkspaces(filtered.slice(0, 10))
}

export async function getTabState(workspacePath: string): Promise<WorkspaceState | null> {
  const dir = getWorkspaceDir(workspacePath)
  // Try workspace-state.json first, fall back to tabs.json for backward compatibility
  const primaryPath = join(dir, 'workspace-state.json')
  const fallbackPath = join(dir, 'tabs.json')
  try {
    const data = await readFile(primaryPath, 'utf-8')
    return JSON.parse(data)
  } catch {
    try {
      const data = await readFile(fallbackPath, 'utf-8')
      return JSON.parse(data)
    } catch {
      return null
    }
  }
}

export async function saveTabState(
  workspacePath: string,
  state: WorkspaceState
): Promise<void> {
  const dir = getWorkspaceDir(workspacePath)
  await mkdir(dir, { recursive: true })
  const filePath = join(dir, 'workspace-state.json')
  await writeFile(filePath, JSON.stringify(state, null, 2), 'utf-8')
}
