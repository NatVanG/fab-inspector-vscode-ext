# Fab Inspector VS Code Extension

A Visual Studio Code extension that integrates Microsoft Fabric Inspector for analyzing and inspecting Fabric items directly from your workspace.

## Features

- **One-Click Fabric Inspection**: Run Fab Inspector on your workspace with a single command
- **Custom Rules Support**: Use your own inspection rules stored in the `fab-inspector-rules` folder
- **Multiple Output Formats**: Generate reports in various formats (JSON, HTML or console output)
- **Real-time Output**: Stream inspection results in real-time through VS Code's output panel
- **Docker Integration**: Automatically manages Docker images for consistent execution
- **Smart Image Management**: Only pulls Docker images when updates are available

## Requirements

- **Docker Desktop**: Must be installed and running
- **fab-inspector-rules folder**: Create this folder in your workspace root and add your rules files

## Usage

1. Open a workspace containing Fabric items you want to inspect
2. Create a `fab-inspector-rules` folder in your workspace root
3. Add your inspection rules files to this folder
4. Open Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P`)
5. Run `Fab Inspect`
6. Select your rules file and output format
7. View results in the "Fab Inspector" output channel

## Extension Settings

This extension contributes the following settings:

* TBD

## Known Issues

- Docker operations may be slower on Windows.
- Requires Docker Desktop to be running before executing inspections.

## Release Notes

### 1.0.0

Initial release with core functionality:
- Docker-based Fab Inspector execution
- Real-time output streaming
- Custom rules support
- Multiple output formats

---

**Enjoy inspecting your Fabric items!**
