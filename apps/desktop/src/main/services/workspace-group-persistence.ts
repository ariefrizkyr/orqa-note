import { app } from 'electron'
import { readFile, writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import type { WorkspaceGroup, WorkspaceGroupsFile } from '../../shared/types'

function getFilePath(): string {
  return join(app.getPath('userData'), 'workspace-groups.json')
}

function generateId(): string {
  return Math.random().toString(36).slice(2, 10)
}

async function readGroupsFile(): Promise<WorkspaceGroupsFile> {
  try {
    const data = await readFile(getFilePath(), 'utf-8')
    return JSON.parse(data)
  } catch {
    return { groups: [], lastOpenedGroupIds: [] }
  }
}

async function writeGroupsFile(file: WorkspaceGroupsFile): Promise<void> {
  await mkdir(app.getPath('userData'), { recursive: true })
  await writeFile(getFilePath(), JSON.stringify(file, null, 2), 'utf-8')
}

export async function getAllGroups(): Promise<WorkspaceGroup[]> {
  const file = await readGroupsFile()
  const nonEmpty = file.groups.filter((g) => g.workspaces.length > 0)

  // Clean up stale empty groups if any were found
  if (nonEmpty.length < file.groups.length) {
    const emptyIds = new Set(
      file.groups.filter((g) => g.workspaces.length === 0).map((g) => g.id)
    )
    file.groups = nonEmpty
    file.lastOpenedGroupIds = file.lastOpenedGroupIds.filter((id) => !emptyIds.has(id))
    await writeGroupsFile(file)
  }

  return nonEmpty
}

export async function getGroup(groupId: string): Promise<WorkspaceGroup | null> {
  const file = await readGroupsFile()
  return file.groups.find((g) => g.id === groupId) ?? null
}

export async function createGroup(
  name: string,
  firstWorkspacePath: string
): Promise<WorkspaceGroup> {
  const file = await readGroupsFile()
  const group: WorkspaceGroup = {
    id: generateId(),
    name,
    workspaces: [firstWorkspacePath],
    activeWorkspace: firstWorkspacePath
  }
  file.groups.push(group)
  await writeGroupsFile(file)
  return group
}

export async function updateGroup(group: WorkspaceGroup): Promise<void> {
  const file = await readGroupsFile()
  const idx = file.groups.findIndex((g) => g.id === group.id)
  if (idx >= 0) {
    file.groups[idx] = group
    await writeGroupsFile(file)
  }
}

export async function removeGroup(groupId: string): Promise<void> {
  const file = await readGroupsFile()
  file.groups = file.groups.filter((g) => g.id !== groupId)
  file.lastOpenedGroupIds = file.lastOpenedGroupIds.filter((id) => id !== groupId)
  await writeGroupsFile(file)
}

export async function addWorkspaceToGroup(
  groupId: string,
  workspacePath: string
): Promise<WorkspaceGroup> {
  const file = await readGroupsFile()
  const group = file.groups.find((g) => g.id === groupId)
  if (!group) throw new Error(`Group ${groupId} not found`)

  if (!group.workspaces.includes(workspacePath)) {
    group.workspaces.push(workspacePath)
  }
  group.activeWorkspace = workspacePath
  await writeGroupsFile(file)
  return group
}

export async function removeWorkspaceFromGroup(
  groupId: string,
  workspacePath: string
): Promise<WorkspaceGroup> {
  const file = await readGroupsFile()
  const group = file.groups.find((g) => g.id === groupId)
  if (!group) throw new Error(`Group ${groupId} not found`)

  group.workspaces = group.workspaces.filter((w) => w !== workspacePath)

  if (group.activeWorkspace === workspacePath) {
    group.activeWorkspace = group.workspaces[0] ?? null
  }
  await writeGroupsFile(file)
  return group
}

export async function setActiveWorkspaceInGroup(
  groupId: string,
  workspacePath: string
): Promise<void> {
  const file = await readGroupsFile()
  const group = file.groups.find((g) => g.id === groupId)
  if (!group) return

  group.activeWorkspace = workspacePath
  await writeGroupsFile(file)
}

export async function getLastOpenedGroupIds(): Promise<string[]> {
  const file = await readGroupsFile()
  // Filter out stale IDs
  const validIds = file.groups.map((g) => g.id)
  return file.lastOpenedGroupIds.filter((id) => validIds.includes(id))
}

export async function addLastOpenedGroup(groupId: string): Promise<void> {
  const file = await readGroupsFile()
  file.lastOpenedGroupIds = file.lastOpenedGroupIds.filter((id) => id !== groupId)
  file.lastOpenedGroupIds.push(groupId)
  await writeGroupsFile(file)
}

export async function removeLastOpenedGroup(groupId: string): Promise<void> {
  const file = await readGroupsFile()
  file.lastOpenedGroupIds = file.lastOpenedGroupIds.filter((id) => id !== groupId)
  await writeGroupsFile(file)
}
