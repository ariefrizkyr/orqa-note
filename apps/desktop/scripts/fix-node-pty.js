// Fix node-pty spawn-helper permissions (pnpm strips execute bit from prebuilt binaries)
const { chmodSync, existsSync, readdirSync } = require('fs')
const { join, dirname } = require('path')

try {
  const nodePtyDir = dirname(require.resolve('node-pty/package.json'))
  const prebuildsDir = join(nodePtyDir, 'prebuilds')

  if (existsSync(prebuildsDir)) {
    for (const platform of readdirSync(prebuildsDir)) {
      const helper = join(prebuildsDir, platform, 'spawn-helper')
      if (existsSync(helper)) {
        chmodSync(helper, 0o755)
      }
    }
  }
} catch {
  // node-pty not installed yet, skip
}
