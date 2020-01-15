# setup-terraform

<p align="left">
  <a href="https://github.com/volcano-coffee-company/setup-terraform"><img alt="GitHub Actions status" src="https://github.com/volcano-coffee-company/setup-terraform/workflows/build-test/badge.svg"></a>
</p>

This action sets up a [Terraform](https://terraform.io) environment for use in actions by:

- optionally downloading and caching a version of Terraform by version and adding to `PATH`

# Usage

See [action.yml](action.yml)

Basic:
```yaml
steps:
- uses: actions/checkout@v2
- uses: volcano-coffee-company/setup-terraform@v1
  with:
    version: '~0.12'
- run: terraform version
```

# License

The scripts and documentation in this project are released under the [MIT License](LICENSE)
