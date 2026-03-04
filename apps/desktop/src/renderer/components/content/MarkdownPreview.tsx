import { useEffect, useState, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'

interface MarkdownPreviewProps {
  filePath: string
  scrollPosition?: number
  onScroll?: (position: number) => void
}

export function MarkdownPreview({ filePath, scrollPosition, onScroll }: MarkdownPreviewProps) {
  const [content, setContent] = useState('')
  const [error, setError] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let cancelled = false
    window.electronAPI.fs
      .readFile(filePath)
      .then((text) => {
        if (!cancelled) setContent(text)
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Failed to read file')
      })
    return () => {
      cancelled = true
    }
  }, [filePath])

  // Restore scroll position
  useEffect(() => {
    if (scrollPosition && containerRef.current) {
      containerRef.current.scrollTop = scrollPosition
    }
  }, [scrollPosition, content])

  if (error) {
    return (
      <div className="flex h-full items-center justify-center text-red-400">
        <p>{error}</p>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="h-full overflow-y-auto px-12 py-8"
      onScroll={() => {
        if (containerRef.current && onScroll) {
          onScroll(containerRef.current.scrollTop)
        }
      }}
    >
      <article className="prose prose-invert max-w-3xl mx-auto prose-headings:text-white prose-p:text-neutral-300 prose-a:text-blue-400 prose-code:text-green-400 prose-pre:bg-neutral-800 prose-pre:border prose-pre:border-neutral-700">
        <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>{content}</ReactMarkdown>
      </article>
    </div>
  )
}
