import { create } from 'zustand'
import type { FileNode } from '../../shared/types'

interface WorkspaceStore {
  workspacePath: string | null
  rootNodes: FileNode[]
  expandedPaths: Set<string>

  setWorkspacePath: (path: string | null) => void
  setRootNodes: (nodes: FileNode[]) => void
  toggleExpanded: (path: string) => void
  setExpanded: (path: string, expanded: boolean) => void
  collapseAll: () => void
  updateNodeChildren: (parentPath: string, children: FileNode[]) => void
  addNode: (parentPath: string, node: FileNode) => void
  removeNode: (path: string) => void
  reset: () => void
}

function updateChildrenRecursive(
  nodes: FileNode[],
  parentPath: string,
  children: FileNode[]
): FileNode[] {
  return nodes.map((node) => {
    if (node.path === parentPath) {
      return { ...node, children }
    }
    if (node.children) {
      return { ...node, children: updateChildrenRecursive(node.children, parentPath, children) }
    }
    return node
  })
}

function removeNodeRecursive(nodes: FileNode[], path: string): FileNode[] {
  return nodes
    .filter((node) => node.path !== path)
    .map((node) => {
      if (node.children) {
        return { ...node, children: removeNodeRecursive(node.children, path) }
      }
      return node
    })
}

export const useWorkspaceStore = create<WorkspaceStore>((set) => ({
  workspacePath: null,
  rootNodes: [],
  expandedPaths: new Set(),

  setWorkspacePath: (path) => set({ workspacePath: path }),

  setRootNodes: (nodes) => set({ rootNodes: nodes }),

  toggleExpanded: (path) =>
    set((state) => {
      const next = new Set(state.expandedPaths)
      if (next.has(path)) {
        next.delete(path)
      } else {
        next.add(path)
      }
      return { expandedPaths: next }
    }),

  collapseAll: () => set({ expandedPaths: new Set() }),

  setExpanded: (path, expanded) =>
    set((state) => {
      const next = new Set(state.expandedPaths)
      if (expanded) next.add(path)
      else next.delete(path)
      return { expandedPaths: next }
    }),

  updateNodeChildren: (parentPath, children) =>
    set((state) => ({
      rootNodes: updateChildrenRecursive(state.rootNodes, parentPath, children)
    })),

  addNode: (parentPath, node) =>
    set((state) => {
      if (!parentPath || parentPath === state.workspacePath) {
        const nodes = [...state.rootNodes, node].sort((a, b) => {
          if (a.type !== b.type) return a.type === 'directory' ? -1 : 1
          return a.name.localeCompare(b.name)
        })
        return { rootNodes: nodes }
      }
      return state
    }),

  removeNode: (path) =>
    set((state) => ({
      rootNodes: removeNodeRecursive(state.rootNodes, path)
    })),

  reset: () => set({ workspacePath: null, rootNodes: [], expandedPaths: new Set() })
}))
