import * as core from '@actions/core'
import * as installer from './installer'
import * as path from 'path'

async function run(): Promise<void> {
  try {
    const version = core.getInput('version', {required: true})
    await installer.getTerraform(version)
    const matchersPath = path.join(__dirname, '..', '.github')
    // eslint-disable-next-line no-console
    console.log(`##[add-matcher]${path.join(matchersPath, 'terraform.json')}`)
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
