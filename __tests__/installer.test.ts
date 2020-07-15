import io = require('@actions/io')
import fs = require('fs')
import os = require('os')
import path = require('path')

const toolDir = path.join(__dirname, 'runner', 'tools')
const tempDir = path.join(__dirname, 'runner', 'temp')
const fixturesDir = path.join(__dirname, '__fixtures__')

process.env['RUNNER_TOOL_CACHE'] = toolDir
process.env['RUNNER_TEMP'] = tempDir
import * as installer from '../src/installer'
import * as tfconfig from '../src/config'

const IS_WINDOWS = process.platform === 'win32'

describe('installer tests', () => {
  beforeAll(async () => {
    await io.rmRF(toolDir)
    await io.rmRF(tempDir)
  }, 100000)

  afterAll(async () => {
    try {
      await io.rmRF(toolDir)
      await io.rmRF(tempDir)
    } catch {
      console.log('Failed to remove test directories')
    }
  }, 100000)

  it('Acquires version of Terraform if no matching version is installed', async () => {
    await installer.getTerraform('0.12.16')
    const terraformDir = path.join(toolDir, 'terraform', '0.12.16', os.arch())

    expect(fs.existsSync(`${terraformDir}.complete`)).toBe(true)
    if (IS_WINDOWS) {
      expect(fs.existsSync(path.join(terraformDir, 'terraform.exe'))).toBe(true)
    } else {
      expect(fs.existsSync(path.join(terraformDir, 'terraform'))).toBe(true)
    }
  }, 100000)

  it('Throws if no location contains correct terraform version', async () => {
    let thrown = false
    try {
      await installer.getTerraform('99.0.0')
    } catch {
      thrown = true
    }
    expect(thrown).toBe(true)
  })

  it('Uses required Terraform version', async () => {
    const moduleDir = path.join(fixturesDir, '**/*.tf')
    const versions = await tfconfig.getRequiredVersion(moduleDir)
    const version = await installer.queryLatestMatch(versions.join(' '))
    const terraformDir = path.join(toolDir, 'terraform', '0.12.26', os.arch())
    await io.mkdirP(terraformDir)

    await installer.getTerraform(version)

    expect(fs.existsSync(`${terraformDir}.complete`)).toBe(true)
    if (IS_WINDOWS) {
      expect(fs.existsSync(path.join(terraformDir, 'terraform.exe'))).toBe(true)
    } else {
      expect(fs.existsSync(path.join(terraformDir, 'terraform'))).toBe(true)
    }
  }, 100000)

  it('Uses version of terraform installed in cache', async () => {
    const terraformDir: string = path.join(
      toolDir,
      'terraform',
      '98.0.0',
      os.arch()
    )
    await io.mkdirP(terraformDir)
    fs.writeFileSync(`${terraformDir}.complete`, 'hello')
    // This will throw if it doesn't find it in the cache (because no such version exists)
    await installer.getTerraform('98.0.0')
    return
  })

  it('Doesnt use version of terraform that was only partially installed in cache', async () => {
    const terraformDir: string = path.join(
      toolDir,
      'terraform',
      '97.0.0',
      os.arch()
    )
    await io.mkdirP(terraformDir)
    let thrown = false
    try {
      // This will throw if it doesn't find it in the cache (because no such version exists)
      await installer.getTerraform('97.0.0')
    } catch {
      thrown = true
    }
    expect(thrown).toBe(true)
    return
  })

  it('Resolves semantic versions installed in cache', async () => {
    const terraformDir: string = path.join(
      toolDir,
      'terraform',
      '96.0.0',
      os.arch()
    )
    await io.mkdirP(terraformDir)
    fs.writeFileSync(`${terraformDir}.complete`, 'hello')
    // These will throw if it doesn't find it in the cache (because no such version exists)
    await installer.getTerraform('96.0.0')
    await installer.getTerraform('96')
    await installer.getTerraform('96.0')
  })
})
