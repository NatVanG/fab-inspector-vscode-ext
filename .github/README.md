# GitHub Actions Workflows

This repository contains GitHub Actions workflows for building and releasing the Fab Inspector VS Code extension.

## Workflows

### Build Workflow (`build.yml`)

**Triggers:**
- Push to `master` or `main` branches
- Pull requests to `master` or `main` branches  
- Manual trigger via workflow dispatch

**What it does:**
1. Sets up Node.js environment
2. Installs npm dependencies
3. Downloads and extracts the latest PBI Inspector CLI files from the [PBI-InspectorV2 releases](https://github.com/NatVanG/PBI-InspectorV2/releases/latest)
4. Runs linting and TypeScript compilation
5. Runs tests (on Linux with xvfb)
6. Packages the extension as a VSIX file
7. Uploads the VSIX as a build artifact

**Build Matrix:**
- **Ubuntu**: Runs for all triggers, includes testing
- **Windows**: Runs only on push to master branch (for Windows-specific validation)

### Release Workflow (`release.yml`)

**Triggers:**
- When a GitHub release is published
- Manual trigger with version input

**What it does:**
1. Similar build steps as the build workflow
2. Optionally updates the package version
3. Creates a production-ready VSIX package
4. Attaches the VSIX to the GitHub release (if triggered by release)
5. Uploads the VSIX as a long-term artifact

## CLI Dependencies

The extension depends on CLI files from the [PBI-InspectorV2](https://github.com/NatVanG/PBI-InspectorV2) project. The workflows automatically download and extract the latest `win-x64-CLI.zip` release into the `bin/` directory during the build process.

## Artifacts

Build artifacts (VSIX files) are retained for:
- **Build workflow**: 30 days
- **Release workflow**: 90 days

## Manual Triggers

Both workflows can be triggered manually:
- **Build**: Go to Actions → Build Extension → Run workflow
- **Release**: Go to Actions → Release Extension → Run workflow (optionally specify a version)

## Local Development

To build locally with the latest CLI files:

```bash
# Install dependencies
npm install

# Download CLI files (manual step - or they're already in bin/)
# The GitHub Action does this automatically

# Build
npm run compile

# Package (requires vsce)
npm install -g @vscode/vsce
vsce package
```
