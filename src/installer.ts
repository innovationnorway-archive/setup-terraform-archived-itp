// Load tempDirectory before it gets wiped by tool-cache
let tempDirectory = process.env['RUNNER_TEMPDIRECTORY'] || '';
import * as core from '@actions/core';
import * as tc from '@actions/tool-cache';
import * as os from 'os';
import * as path from 'path';
import * as util from 'util';
import * as semver from 'semver';
import * as restm from 'typed-rest-client/RestClient';
import {Release, Version} from './interfaces';

// os.arch and os.platform does not always match the download url
const osPlat: string = os.platform() == 'win32' ? 'windows' : os.platform();
const osArch: string = os.arch() == 'x64' ? 'amd64' : '386';

if (!tempDirectory) {
  let baseLocation;
  if (process.platform === 'win32') {
    // On windows use the USERPROFILE env variable
    baseLocation = process.env['USERPROFILE'] || 'C:\\';
  } else {
    if (process.platform === 'darwin') {
      baseLocation = '/Users';
    } else {
      baseLocation = '/home';
    }
  }
  tempDirectory = path.join(baseLocation, 'actions', 'temp');
}

export async function getTerraform(versionSpec: string) {
  // check cache
  let toolPath: string;
  toolPath = tc.find('terraform', versionSpec);

  // If not found in cache
  if (!toolPath) {
    // query releases.hashicorp.com for a matching version
    const version = await queryLatestMatch(versionSpec);
    if (!version) {
      throw new Error(
        `Unable to find Terraform version '${versionSpec}' for platform ${osPlat} and architecture ${osArch}.`
      );
    }

    // download, extract, cache
    toolPath = await acquireTerraform(version);
    core.debug('Terraform tool is cached under ' + toolPath);
  }

  //
  // prepend the tools path. instructs the agent to prepend for future tasks
  //
  core.addPath(toolPath);
}

async function acquireTerraform(version: string): Promise<string> {
  //
  // Download - a tool installer intimately knows how to get the tool (and construct urls)
  //
  let downloadUrl: string = getDownloadUrl(version);
  let downloadPath: string | null = null;
  try {
    downloadPath = await tc.downloadTool(downloadUrl);
  } catch (error) {
    core.debug(error);

    throw `Failed to download version ${version}: ${error}`;
  }

  //
  // Extract
  //
  let extPath: string = tempDirectory;
  if (!extPath) {
    throw new Error('Temp directory not set');
  }

  extPath = await tc.extractZip(downloadPath);

  //
  // Install into the local tool cache
  //
  return await tc.cacheDir(extPath, 'terraform', version);
}

async function queryLatestMatch(versionSpec: string): Promise<string> {
  let versions: string[] = [];
  let rest: restm.RestClient = new restm.RestClient('setup-terraform');
  let release: Release | null = (
    await rest.get<Release>(
      'https://releases.hashicorp.com/terraform/index.json'
    )
  ).result;

  if (release && release.versions) {
    Object.values(release.versions).forEach((version: Version) => {
      // ensure this version supports your os and platform
      const build = version.builds.find(
        build => osPlat == build.os && osArch == build.arch
      );
      if (build) {
        versions.push(build.version);
      }
    });
  }

  // get the latest version that matches the version spec
  let version: string = evaluateVersions(versions, versionSpec);
  return version;
}

function getDownloadUrl(version: string): string {
  return util.format(
    `https://releases.hashicorp.com/terraform/%s/terraform_%s_%s_%s.zip`,
    version,
    version,
    osPlat,
    osArch
  );
}

//
// Lifted directly from @actions/tool-cache, assuming
// this will be exported in a future version.
//
function evaluateVersions(versions: string[], versionSpec: string): string {
  let version = '';
  core.debug(`evaluating ${versions.length} versions`);
  versions = versions.sort((a, b) => {
    if (semver.gt(a, b)) {
      return 1;
    }
    return -1;
  });
  for (let i = versions.length - 1; i >= 0; i--) {
    const potential: string = versions[i];
    const satisfied: boolean = semver.satisfies(potential, versionSpec);
    if (satisfied) {
      version = potential;
      break;
    }
  }

  if (version) {
    core.debug(`matched: ${version}`);
  } else {
    core.debug('match not found');
  }

  return version;
}
