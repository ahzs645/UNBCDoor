// Build the vendored @firstform/json-url submodule (ahzs645/json-url), the same way the Webforms
// app consumes it.
//
// The json-url repo gitignores its dist/, and src/sign/signShare.js imports the built
// dist/web-share.js straight from the submodule (an npm `file:` dependency trips an npm arborist
// crash on json-url's dev tooling), so a fresh checkout has nothing to import until it is built. This runs in prepare/predev/prebuild/pretest so dist/ is fresh before Vite or the tests
// resolve the import. It is a no-op when the submodule is already built and unchanged, so the
// everyday dev loop pays nothing.
import { existsSync, readdirSync, statSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const scriptsDir = dirname(fileURLToPath(import.meta.url))
const pkgDir = join(scriptsDir, '..', 'vendor', 'json-url')

if (!existsSync(join(pkgDir, 'package.json'))) {
  console.warn(
    '[vendor:json-url] vendor/json-url is not checked out — run ' +
      '`git submodule update --init --recursive`. Skipping build.'
  )
  process.exit(0)
}

// Newest mtime across a tree, so we only rebuild when src/ is newer than dist/.
const newestMtime = (dir) => {
  let newest = 0
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    const mtime = entry.isDirectory() ? newestMtime(full) : statSync(full).mtimeMs
    if (mtime > newest) newest = mtime
  }
  return newest
}

const distEntry = join(pkgDir, 'dist', 'web-share.js')
const upToDate = existsSync(distEntry) && statSync(distEntry).mtimeMs >= newestMtime(join(pkgDir, 'src'))

if (upToDate) {
  console.log('[vendor:json-url] dist is up to date — skipping build.')
  process.exit(0)
}

const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm'
const run = (args) => execFileSync(npm, args, { cwd: pkgDir, stdio: 'inherit' })

// The built files import their runtime dependencies (buffer, lz-string, …) from the submodule's
// own node_modules, so this install is needed at runtime too, not just to build.
// --ignore-scripts skips json-url's husky `prepare` hook, which is meaningless (and can fail)
// inside a submodule checkout. The build tools are plain devDependencies.
if (!existsSync(join(pkgDir, 'node_modules', '.bin', 'vite'))) {
  console.log('[vendor:json-url] installing build dependencies…')
  run(['ci', '--ignore-scripts', '--no-audit', '--no-fund'])
}
console.log('[vendor:json-url] building…')
run(['run', 'build'])
