import * as core from '@actions/core'
import * as installer from './installer'
import * as tfconfig from './config'

async function run(): Promise<void> {
  try {
    let version = core.getInput('version')
    if (core.getInput('use-required-version') === 'true') {
      const requiredVersions = await tfconfig.getRequiredVersion('**/*.tf')
      if (requiredVersions.length < 0) {
        version = requiredVersions.join(' ')
      }
    }
    await installer.getTerraform(version)
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
