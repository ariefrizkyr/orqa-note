export function getFileIcon(extension?: string): string {
  if (!extension) return '📄'
  switch (extension.toLowerCase()) {
    case 'md': case 'folio': return '📝'
    case 'csv': case 'xlsx': return '📊'
    case 'pdf': return '📕'
    case 'docx': return '📄'
    case 'pptx': return '📽️'
    case 'mmd': return '🔀'
    case 'excalidraw': return '🎨'
    case 'drawio': return '📐'
    case 'orqlnk': return '🔗'
    default: return '📄'
  }
}

export function detectServiceFromUrl(url: string): 'docs' | 'sheets' | 'slides' | 'figma' | 'other' {
  try {
    const parsed = new URL(url)
    const host = parsed.hostname
    const path = parsed.pathname

    if (host === 'docs.google.com' || host === 'www.docs.google.com') {
      if (path.startsWith('/document')) return 'docs'
      if (path.startsWith('/spreadsheets')) return 'sheets'
      if (path.startsWith('/presentation')) return 'slides'
    }

    if (host === 'figma.com' || host === 'www.figma.com') return 'figma'

    return 'other'
  } catch {
    return 'other'
  }
}

export function getServiceColor(service: string): string {
  switch (service) {
    case 'sheets': return '#34A853'
    case 'docs': return '#4285F4'
    case 'slides': return '#FBBC04'
    case 'figma': return '#F24E1E'
    default: return '#888888'
  }
}

export function getServiceLabel(service: string): string {
  switch (service) {
    case 'sheets': return 'Sheets'
    case 'docs': return 'Docs'
    case 'slides': return 'Slides'
    case 'figma': return 'Figma'
    default: return 'Bookmark'
  }
}

export function basename(path: string): string {
  const parts = path.split('/')
  return parts[parts.length - 1] || ''
}

export function dirname(path: string): string {
  const parts = path.split('/')
  parts.pop()
  return parts.join('/') || '/'
}

export function extname(path: string): string {
  const name = basename(path)
  const dotIdx = name.lastIndexOf('.')
  if (dotIdx <= 0) return ''
  return name.slice(dotIdx + 1).toLowerCase()
}

export function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-')
}

export function createBookmarkContent(url: string, label: string, service: string): string {
  return JSON.stringify({ type: 'bookmark', url, label, service }, null, 2)
}
