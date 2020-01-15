import * as core from '@actions/core'
import * as installer from './installer'

async function run(): Promise<void> {
  try {
    const version = core.getInput('version', {required: true})
    await installer.getTerraform(version)
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
