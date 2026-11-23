// Fails when UI text is hard-coded outside locales/.
// Flags code lines (not comments) in app/, components/, hooks/ and lib/ that
// contain Cyrillic, or branch on a specific interface language.
// Run: pnpm check:i18n
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const ROOTS = ['app', 'components', 'hooks', 'lib']
// Language data that is content, not UI text
const ALLOWED_FILES = new Set(['lib/languages.ts'])

const CYRILLIC = /[А-Яа-яЁё]/
const LANG_BRANCH = /(lang|interfaceLang|interface_language|interfaceLanguage)\s*===\s*['"](ru|en|es)['"]/

function* files(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) yield* files(path)
    else if (/\.(ts|tsx)$/.test(name)) yield path
  }
}

const problems = []
for (const root of ROOTS) {
  for (const file of files(root)) {
    if (ALLOWED_FILES.has(file)) continue
    readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
      const code = line.replace(/\/\/.*$/, '').replace(/\/\*.*?\*\//g, '').replace(/\{\/\*.*?\*\/\}/g, '')
      const trimmed = code.trim()
      if (!trimmed || trimmed.startsWith('*')) return
      if (CYRILLIC.test(code) || LANG_BRANCH.test(code)) {
        problems.push(`${file}:${i + 1}: ${line.trim()}`)
      }
    })
  }
}

if (problems.length) {
  console.error('Hard-coded UI text found — move it to locales/*.ts:\n' + problems.join('\n'))
  process.exit(1)
}
console.log('check:i18n OK')
