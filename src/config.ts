import * as fs from 'fs'
import * as semver from 'semver'
import * as glob from '@actions/glob'
import * as tfconfig from '@innovationnorway/terraform-config'

export async function getRequiredVersion(path: string): Promise<string[]> {
  const versions: string[] = []
  const globber = await glob.create(path)

  for await (const file of globber.globGenerator()) {
    const src = fs.readFileSync(file)
    const config = tfconfig.parse(file, src.toString())
    if (config && Array.isArray(config.required_version)) {
      for (const version of config.required_version) {
        if (semver.valid(version) || semver.validRange(version)) {
          versions.push(version)
        }
      }
    }
  }

  return versions
}
