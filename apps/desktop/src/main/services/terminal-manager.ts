import * as pty from 'node-pty'
import { BrowserWindow } from 'electron'
import { homedir } from 'os'
import { existsSync } from 'fs'

interface TerminalSession {
  pty: pty.IPty
  windowId: number
}

const sessions = new Map<string, TerminalSession>()
let nextId = 1

function getDefaultShell(): string {
  // Try SHELL env, then common macOS/Linux paths
  const candidates = [
    process.env.SHELL,
    '/bin/zsh',
    '/bin/bash',
    '/bin/sh'
  ]
  for (const shell of candidates) {
    if (shell && existsSync(shell)) return shell
  }
  return '/bin/sh'
}

function getSanitizedEnv(): Record<string, string> {
  const env: Record<string, string> = {}
  for (const [key, value] of Object.entries(process.env)) {
    if (typeof value === 'string') {
      env[key] = value
    }
  }
  return env
}

export function createTerminalSession(windowId: number, cwd?: string): string {
  const id = `term-${nextId++}`
  const shell = getDefaultShell()
  const resolvedCwd = cwd && existsSync(cwd) ? cwd : homedir()

  const ptyProcess = pty.spawn(shell, [], {
    name: 'xterm-256color',
    cols: 80,
    rows: 24,
    cwd: resolvedCwd,
    env: getSanitizedEnv()
  })

  const session: TerminalSession = { pty: ptyProcess, windowId }
  sessions.set(id, session)

  // Stream data to the renderer
  ptyProcess.onData((data) => {
    const win = BrowserWindow.fromId(windowId)
    if (win && !win.isDestroyed()) {
      win.webContents.send('terminal:data', id, data)
    }
  })

  // Notify on exit
  ptyProcess.onExit(({ exitCode }) => {
    const win = BrowserWindow.fromId(windowId)
    if (win && !win.isDestroyed()) {
      win.webContents.send('terminal:exit', id, exitCode)
    }
    sessions.delete(id)
  })

  return id
}

export function writeToSession(sessionId: string, data: string): void {
  const session = sessions.get(sessionId)
  if (session) {
    session.pty.write(data)
  }
}

export function resizeSession(sessionId: string, cols: number, rows: number): void {
  const session = sessions.get(sessionId)
  if (session) {
    session.pty.resize(cols, rows)
  }
}

export function killSession(sessionId: string): void {
  const session = sessions.get(sessionId)
  if (session) {
    session.pty.kill()
    sessions.delete(sessionId)
  }
}

export function killSessionsForWindow(windowId: number): void {
  for (const [id, session] of sessions.entries()) {
    if (session.windowId === windowId) {
      session.pty.kill()
      sessions.delete(id)
    }
  }
}

export function getShellName(): string {
  const shell = getDefaultShell()
  const parts = shell.split('/')
  return parts[parts.length - 1]
}
