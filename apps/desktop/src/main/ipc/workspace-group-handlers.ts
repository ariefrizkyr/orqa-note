import { ipcMain, BrowserWindow } from 'electron'
import { basename } from 'path'
import {
  getAllGroups,
  getGroup,
  createGroup,
  removeGroup,
  updateGroup,
  addWorkspaceToGroup,
  removeWorkspaceFromGroup,
  setActiveWorkspaceInGroup,
  addLastOpenedGroup
} from '../services/workspace-group-persistence'
import {
  getWindowGroupId,
  setWindowGroupId,
  clearWindowGroupId,
  createWindow,
  findWindowByGroupId,
  updateWindowTitle
} from '../services/window-manager'
import { rebuildAppMenu } from '../services/app-menu'

export function registerWorkspaceGroupHandlers(): void {
  ipcMain.handle('workspaceGroup:getForWindow', async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (!win) return null
    const groupId = getWindowGroupId(win.id)
    if (!groupId) return null
    return getGroup(groupId)
  })

  ipcMain.handle('workspaceGroup:addWorkspace', async (event, workspacePath: string) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (!win) throw new Error('No window')
    let groupId = getWindowGroupId(win.id)

    // Auto-create a default group if window has none
    if (!groupId) {
      const newGroup = await createGroup(basename(workspacePath), workspacePath)
      setWindowGroupId(win.id, newGroup.id)
      await addLastOpenedGroup(newGroup.id)
      await updateWindowTitle(win.id)
      rebuildAppMenu()
      return newGroup
    }

    const group = await addWorkspaceToGroup(groupId, workspacePath)
    await updateWindowTitle(win.id)
    return group
  })

  ipcMain.handle('workspaceGroup:removeWorkspace', async (event, workspacePath: string) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (!win) throw new Error('No window')
    const groupId = getWindowGroupId(win.id)
    if (!groupId) return { id: '', name: '', workspaces: [], activeWorkspace: null }
    const group = await removeWorkspaceFromGroup(groupId, workspacePath)

    // If group is now empty, delete it and unbind the window
    if (group.workspaces.length === 0) {
      await removeGroup(groupId)
      clearWindowGroupId(win.id)
      rebuildAppMenu()
      return group
    }

    await updateWindowTitle(win.id)
    return group
  })

  ipcMain.handle('workspaceGroup:setActiveWorkspace', async (event, workspacePath: string) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (!win) return
    const groupId = getWindowGroupId(win.id)
    if (!groupId) return
    await setActiveWorkspaceInGroup(groupId, workspacePath)
    await updateWindowTitle(win.id)
  })

  ipcMain.handle('workspaceGroup:rename', async (event, name: string) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (!win) throw new Error('No window')
    const groupId = getWindowGroupId(win.id)
    if (!groupId) throw new Error('No group for window')
    const group = await getGroup(groupId)
    if (!group) throw new Error('Group not found')
    group.name = name
    await updateGroup(group)
    await updateWindowTitle(win.id)
    rebuildAppMenu()
    return group
  })

  ipcMain.handle('workspaceGroup:getAll', async () => {
    return getAllGroups()
  })

  ipcMain.handle(
    'workspaceGroup:create',
    async (event, name: string, firstWorkspacePath: string) => {
      const group = await createGroup(name, firstWorkspacePath)

      // Bind the calling window to this new group
      const win = BrowserWindow.fromWebContents(event.sender)
      if (win) {
        setWindowGroupId(win.id, group.id)
        await addLastOpenedGroup(group.id)
        await updateWindowTitle(win.id)
      }

      rebuildAppMenu()
      return group
    }
  )

  ipcMain.handle('workspaceGroup:open', async (_event, groupId: string) => {
    // Check if already open
    const existingWin = findWindowByGroupId(groupId)
    if (existingWin) {
      existingWin.focus()
      return
    }

    const group = await getGroup(groupId)
    if (!group) return

    const win = createWindow(groupId)
    await addLastOpenedGroup(groupId)

    // Send the active workspace path to the new window once it's ready
    win.webContents.once('did-finish-load', () => {
      if (group.activeWorkspace) {
        win.webContents.send('menu:open-folder', group.activeWorkspace)
      }
    })
  })
}
