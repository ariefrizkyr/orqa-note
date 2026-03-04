/// <reference types="vite/client" />

import type { ElectronAPI } from '../shared/types'

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }

  namespace JSX {
    interface IntrinsicElements {
      webview: React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          src?: string
          partition?: string
          allowpopups?: string
          webpreferences?: string
        },
        HTMLElement
      >
    }
  }
}
