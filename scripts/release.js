#!/usr/bin/env node
import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const args = process.argv.slice(2)
const version = args[0]

// Parse flags
let note = ''
let force = false
for (let i = 1; i < args.length; i++) {
  if (args[i] === '--note') {
    note = args[i + 1] || ''
    i++
  } else if (args[i] === '--force') {
    force = true
  }
}

// ── Validation ─────────────────────────────────────────
if (!version) {
  console.error('Usage: node scripts/release.js <version> --note "message" [--force]')
  process.exit(1)
}

if (!/^\d+\.\d+\.\d+$/.test(version)) {
  console.error(`Invalid version: ${version}. Must match x.y.z`)
  process.exit(1)
}

if (!note && !force) {
  console.error('Missing --note. Use --force to bypass.')
  process.exit(1)
}

// Check git repo
try {
  execSync('git rev-parse --git-dir', { stdio: 'pipe' })
} catch {
  console.error('Not inside a git repository.')
  process.exit(1)
}

// Check dirty tree
let dirty = false
try {
  execSync('git diff --quiet', { stdio: 'pipe' })
} catch {
  dirty = true
}

if (dirty && !force) {
  console.error('Working tree is dirty. Commit changes or use --force.')
  process.exit(1)
}

let stashed = false
if (dirty && force) {
  execSync('git stash push --include-untracked -m "release-auto-stash"', { stdio: 'inherit' })
  stashed = true
}

function safe(fn) {
  try { fn() } catch (e) { console.error(e.message) }
}

// ── Version bumps ──────────────────────────────────────

// package.json
safe(() => {
  const pkgPath = path.join(process.cwd(), 'package.json')
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'))
  pkg.version = version
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n')
})

// manifest.json
safe(() => {
  const mPath = path.join(process.cwd(), 'public', 'manifest.webmanifest')
  if (!fs.existsSync(mPath)) return
  const m = JSON.parse(fs.readFileSync(mPath, 'utf8'))
  m.version = version
  fs.writeFileSync(mPath, JSON.stringify(m, null, 2) + '\n')
})

// README.md version badge
safe(() => {
  const rPath = path.join(process.cwd(), 'README.md')
  if (!fs.existsSync(rPath)) return
  let readme = fs.readFileSync(rPath, 'utf8')
  readme = readme.replace(/version-[\d.]+-blue\.svg/g, `version-${version}-blue.svg`)
  fs.writeFileSync(rPath, readme)
})

// release-info.json
const releaseInfo = {
  version,
  note: note || 'No note provided',
  date: new Date().toISOString(),
}
fs.writeFileSync(
  path.join(process.cwd(), 'public', 'release-info.json'),
  JSON.stringify(releaseInfo, null, 2) + '\n'
)

// ── Build ────────────────────────────────────────────────
try {
  execSync('bun run build', { stdio: 'inherit' })
} catch {
  console.error('[FAIL] Build failed.')
  if (stashed) {
    execSync('git stash pop', { stdio: 'inherit' })
  }
  process.exit(1)
}

// ── Commit & tag ───────────────────────────────────────
try {
  execSync('git add -A', { stdio: 'inherit' })
  const commitMsg = `release: v${version} - ${note || 'No note provided'}`
  execSync(`git commit -m "${commitMsg}"`, { stdio: 'inherit' })
  execSync(`git tag v${version}`, { stdio: 'inherit' })
} catch (e) {
  console.error('[FAIL] Git commit/tag failed:', e.message)
  if (stashed) {
    execSync('git stash pop', { stdio: 'inherit' })
  }
  process.exit(1)
}

if (stashed) {
  execSync('git stash pop', { stdio: 'inherit' })
}

console.log(`\n[OK] Release v${version} created and tagged.`)
console.log('Next step: push the tag to your remote.')
console.log(`  git push origin v${version}\n`)
