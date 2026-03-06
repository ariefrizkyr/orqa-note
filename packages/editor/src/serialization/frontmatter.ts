const FRONTMATTER_RE = /^---\n([\s\S]*?)\n---\n?/

export function extractFrontmatter(raw: string): { frontmatter: string | null; body: string } {
  const match = raw.match(FRONTMATTER_RE)
  if (!match) return { frontmatter: null, body: raw }
  return {
    frontmatter: match[0].trimEnd(),
    body: raw.slice(match[0].length),
  }
}

export function prependFrontmatter(frontmatter: string | null, body: string): string {
  if (!frontmatter) return body
  return frontmatter + '\n\n' + body
}
