const BINARY_EXTENSIONS = new Set([
  // Images
  'png', 'jpg', 'jpeg', 'gif', 'bmp', 'ico', 'webp', 'avif', 'tiff', 'tif', 'svg',
  // Audio
  'mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a', 'wma',
  // Video
  'mp4', 'avi', 'mkv', 'mov', 'wmv', 'flv', 'webm', 'm4v',
  // Documents (binary formats)
  'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'odt', 'ods', 'odp',
  // Archives
  'zip', 'tar', 'gz', 'bz2', 'xz', '7z', 'rar', 'dmg', 'iso',
  // Executables / compiled
  'exe', 'dll', 'so', 'dylib', 'class', 'o', 'pyc', 'wasm',
  // Fonts
  'ttf', 'otf', 'woff', 'woff2', 'eot',
  // Other binary
  'sqlite', 'db', 'bin', 'dat',
])

export function isBinaryExtension(ext?: string): boolean {
  if (!ext) return false
  return BINARY_EXTENSIONS.has(ext.toLowerCase())
}
