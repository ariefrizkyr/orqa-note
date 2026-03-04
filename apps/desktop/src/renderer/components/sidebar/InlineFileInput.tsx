import { useEffect, useRef } from 'react'

interface InlineFileInputProps {
  depth: number
  type: 'file' | 'folder'
  onSubmit: (name: string) => void
  onCancel: () => void
}

export function InlineFileInput({ depth, type, onSubmit, onCancel }: InlineFileInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      const value = inputRef.current?.value.trim()
      if (value) {
        onSubmit(value)
      } else {
        onCancel()
      }
    } else if (e.key === 'Escape') {
      onCancel()
    }
  }

  const handleBlur = () => {
    const value = inputRef.current?.value.trim()
    if (value) {
      onSubmit(value)
    } else {
      onCancel()
    }
  }

  return (
    <div
      className="flex items-center gap-1 px-2 py-1 text-sm"
      style={{ paddingLeft: `${depth * 16 + 8}px` }}
    >
      <span className="w-4 text-center text-xs">{type === 'folder' ? '📁' : '📄'}</span>
      <input
        ref={inputRef}
        type="text"
        className="flex-1 rounded border border-neutral-600 bg-neutral-800 px-1.5 py-0.5 text-sm text-neutral-300 outline-none focus:border-blue-500"
        placeholder={type === 'folder' ? 'folder name' : 'filename'}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
      />
    </div>
  )
}
