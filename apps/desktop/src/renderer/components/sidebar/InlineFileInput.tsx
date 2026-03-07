import { useEffect, useRef } from 'react'

interface InlineFileInputProps {
  depth: number
  type: 'file' | 'folder'
  defaultValue?: string
  onSubmit: (name: string) => void
  onCancel: () => void
}

export function InlineFileInput({ depth, type, defaultValue, onSubmit, onCancel }: InlineFileInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const handledRef = useRef(false)

  useEffect(() => {
    const input = inputRef.current
    if (!input) return
    input.focus()
    if (defaultValue) {
      input.value = defaultValue
      // Select filename part before the extension
      const dotIndex = defaultValue.lastIndexOf('.')
      if (dotIndex > 0) {
        input.setSelectionRange(0, dotIndex)
      } else {
        input.select()
      }
    }
  }, [])

  const submit = (value: string | undefined) => {
    if (handledRef.current) return
    handledRef.current = true
    if (value) {
      onSubmit(value)
    } else {
      onCancel()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      submit(inputRef.current?.value.trim())
    } else if (e.key === 'Escape') {
      submit(undefined)
    }
  }

  const handleBlur = () => {
    submit(inputRef.current?.value.trim())
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
