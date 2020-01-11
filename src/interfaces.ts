//
// Terraform releases interface
// see https://releases.hashicorp.com/terraform/index.json
//
export interface Build {
  name: string;
  version: string;
  os: string;
  arch: string;
  filename: string;
  url: string;
}

export interface Version {
  name: string;
  version: string;
  shasums: string;
  shasums_signature: string;
  builds: Build[];
}

export interface Versions {
  [version: string]: Version;
}

export interface Release {
  name: string;
  versions: Versions;
}
