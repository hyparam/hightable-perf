import { spawn } from 'child_process'

export const appDir = 'app'
export const port = '3000'
export const baseURL = 'http://localhost:' + port

export function streamCommand(command, args = [], { printOutput = false, cwd = undefined} = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      stdio: printOutput ?
        ['ignore', 'pipe', 'pipe'] :
        'ignore'
    })

    // If there's an error spawning the process, reject immediately
    child.on('error', (error) => {
      reject(error)
    })

    // When the command completes, check the exit code
    child.on('close', (code) => {
      if (code === 0) {
        resolve()
      } else {
        reject(new Error(`Command "${command} ${args.join(' ')}" failed with exit code ${code}`))
      }
    })
  })
}

export function median(values) {
  const middle = Math.floor(values.length / 2)
  const sortedValues = [...values].sort((a, b) => a - b);
  return values.length % 2 !== 0 ? sortedValues[middle] : (sortedValues[middle - 1] + sortedValues[middle]) / 2;
};

export function getDateVersionAndCommit(dependency) {
  if (dependency.startsWith('file:')) {
    const match = dependency.match(/file:.*package-(.*)-(\d+\.\d+\.\d+)-([a-f0-9]+)\.tgz/)
    if (!match) {
      throw new Error(`Invalid file dependency format: ${dependency}`)
    }
    return { date: match[1].replace(/_/g, ':'), version: match[2], commit: match[3] }
  } else {
    return { version: dependency }
  }
}
