import { promises as fs } from 'fs'
import { appDir, streamCommand } from './utils.js'

async function run() {
  // Fetch the hightable versions from npm
  const versionsData = await fetch('https://registry.npmjs.org/hightable')
    .then(res => res.json())

  const versions = Object.keys(versionsData.versions).reverse().map(version => {
    const [major, minor, patch] = version.split('.')
    return {
      version,
      major: parseInt(major),
      minor: parseInt(minor),
      patch: parseInt(patch)
    }
  }).filter(({ minor }) => minor >= 20) // Only test versions with minor >= 20 for now.

  // Remove perf.jsonl
  await fs.unlink('perf.jsonl').catch(() => {})

  for (const { version } of versions) {
    console.log(`\nRunning tests for hightable@${version}`)

    // Install the specified version (streams stdout/stderr)
    await streamCommand('npm', ['install', '-E', `hightable@${version}`], { cwd: appDir })

    // Run your test script (streams stdout/stderr)
    try {
      await streamCommand('node', ['src/index.js'], { printOutput: true })
    } catch (err) {
      console.error(`Error running test for hightable@${version}:`, err)
    }
  }
}

run().catch(err => {
  console.error('Fatal error during installation/testing:', err)
  process.exit(1)
})
