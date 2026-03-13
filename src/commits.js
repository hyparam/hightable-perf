import 'dotenv/config'
import { promises as fs } from 'fs'
import { appDir, streamCommand } from './utils.js'
import { mkdtemp } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

// See .env.example for how to set up a GitHub token to avoid API rate limits
const token = process.env.GITHUB_TOKEN
if (!token) {
  throw new Error('GitHub token not found in environment variables. Please set GITHUB_TOKEN in your .env file.')
}
const headers = {headers: {Authorization: `Bearer ${token}`}}

async function run() {
  // Fetch the hightable commits from GitHub API
  const commitsData = await fetch('https://api.github.com/repos/hyparam/hightable/commits?per_page=100', headers)
    .then(res => res.json())
  
  // Extract the commit SHAs and reverse() for the newest first
  const commits = commitsData.map(commit => ({
    sha: commit.sha.slice(0, 7),
    date: commit.commit.author.date
  }))
    // .sort((a, b) => b.date - a.date)
  // .slice(0, 10) // Only test the 10 most recent commits for now

  // Remove perf.jsonl
  await fs.unlink('perf.jsonl').catch(() => {})

  try {
    // Create a temporary directory to checkout the commit
    const checkoutDir = await mkdtemp(join(tmpdir(), 'hightable-'));

    // Checkout the specified commit
    await streamCommand('git', ['clone', 'https://github.com/hyparam/hightable.git', '.'], { cwd: checkoutDir })

    for (const { sha, date } of commits) {
      console.log(`\nRunning tests for hightable@${sha} (${date})`)

      console.log(`\n  checkout, build and install hightable@${sha}`)
      // Remove previous builds and node_modules to ensure a clean state
      await streamCommand('git', ['clean', '-fd'], { cwd: checkoutDir })

      // Checkout the specified commit
      await streamCommand('git', ['checkout', sha], { cwd: checkoutDir })

      // Install dependencies for the checked out commit
      await streamCommand('npm', ['install'], { cwd: checkoutDir })

      // Build and pack the hightable package
      await streamCommand('npm', ['run', 'build'], { cwd: checkoutDir })
      await streamCommand('npm', ['pack'], { cwd: checkoutDir })

      // find the path to the generated .tgz file (it will be named something like hightable-0.26.0.tgz)
      const files = await fs.readdir(checkoutDir)
      const packageFile = files.find(file => file.endsWith('.tgz'))
      if (!packageFile) {
        throw new Error(`No .tgz package found after packing hightable at commit ${sha}`)
      }
      // rename as package-[date]-[version]-[commit].tgz for easier debugging
      const version = packageFile.match(/hightable-(\d+\.\d+\.\d+)\.tgz/)[1]
      const newPackageFile = `package-${date.replace(/[:]/g, '_')}-${version}-${sha}.tgz`
      await fs.rename(join(checkoutDir, packageFile), join(checkoutDir, newPackageFile))
      const packagePath = join(checkoutDir, newPackageFile)

      // Install the built package in the app directory
      await streamCommand('npm', ['install', packagePath], { cwd: appDir })
      
      // Install all the packages
      await streamCommand('npm', ['install'], { cwd: appDir })

      console.log(`\n  run tests`)
      try {
        // Run your test script
        await streamCommand('node', ['src/index.js'], { printOutput: true })
      } catch (err) {
        console.error(`Error running test for hightable@${sha} (${date}):`, err)
      }
    }
  } catch (err) {
    console.error('Error during setup/testing:', err)
  }
}

run().catch(err => {
  console.error('Fatal error during installation/testing:', err)
  process.exit(1)
})
