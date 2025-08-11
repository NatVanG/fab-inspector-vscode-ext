[![Build Extension](https://github.com/NatVanG/fab-inspector-vscode-ext/actions/workflows/build.yml/badge.svg)](https://github.com/NatVanG/fab-inspector-vscode-ext/actions/workflows/build.yml)
[![Release Extension](https://github.com/NatVanG/fab-inspector-vscode-ext/actions/workflows/release.yml/badge.svg)](https://github.com/NatVanG/fab-inspector-vscode-ext/actions/workflows/release.yml)

# Fab Inspector for VS Code (Preview)

A Visual Studio Code extension that provides a seamless integration with the [Fab Inspector](https://github.com/NatVanG/PBI-InspectorV2) CLI executable, enabling developers to analyze and inspect Microsoft Fabric CI/CD items with Fab Inspector rules directly from their VS Code workspace.

> **✏️ NOTE** This is a community project that is not supported by Microsoft.

The repository for this extension can be found at https://github.com/NatVanG/fab-inspector-vscode-ext.

The repository for Fab Inspector (also known as PBI Inspector V2 - full name change pending) can be found at https://github.com/NatVanG/PBI-InspectorV2.

> **⚠️ Platform Support**: This extension currently supports **Windows only** and requires the .NET 8+ runtime.

## 🚀 Features

### **📋 Commands**
- **Fab Inspector: Run** - Rules file execution with customizable output formats (Console or HTML)
- **Fab Inspector: Run Current Rules** - Quick execution of the currently open rules file  
- **Fab Inspector: Run Selected Rule** - Execute individual rules for quick testing and validation
- **Fab Inspector: Create New Rules File** - Creates a new rules file with a templated rule to get you started

### **🔧 JSON Rule Debug Commands**
- **Fab Inspector: Log Un\Wrap** - Un\Wrap a selected Fab Inspector rule operation with log nodes for debug output to console

### **🔧 CLI Management Commands**
- **Fab Inspector: Update CLI** - Manually download and update the Fab Inspector CLI
- **Fab Inspector: Show CLI Info** - Display current CLI version and status information

### **📁 Workspace Integration**
- **Rules Folder Support**: Organize rules in the `fab-inspector-rules` folder at the root of your VS Code folder

## **⬇️ Extension Installation**
While in Preview the extension is not available in the VS Marketplace. To install, download the VSIX file from the released assets at https://github.com/NatVanG/fab-inspector-vscode-ext/releases
and import it into VS Code.

## 📋 Requirements

### **Platform Requirements**
- **Operating System**: Windows (64-bit)
- **.NET Runtime**: .NET 8.0 or later must be installed
- **Visual Studio Code**: Version 1.102.0 or higher
- **Internet Connection**: Required for Fab Inspector CLI downloads. 

### **Installing .NET 8**
The extension requires .NET 8 runtime to execute the Fab Inspector CLI.

1. **Dependency check**: The extension will try and check if there is a local .NET 8+ runtime installed and if not it will provide a link to download it. This dependency check can be disabled in the extension's settings if you know that the runtime is installed but the extension is unable to detect it.
2. **Download .NET 8 runtime**: Visit https://dotnet.microsoft.com/en-us/download/dotnet/thank-you/runtime-8.0.18-windows-x64-installer
3. **Install**: Run the installer and follow the setup instructions

### **Fab Inspector CLI**
- **Automatic Download**: The Fab Inspector CLI is automatically downloaded when first needed from the "CLI" releases published to https://github.com/NatVanG/PBI-InspectorV2/releases.
- **Version Management**: Settings allow for configurable CLI version selection (latest or specific versions)
- **Update Management**: Settings allow for optional auto-updates of the CLI (enabled by default) with configurable cache expiry intervals

> **💡 Note**: Enabling auto-update is recommended to get the latest Fab Inspector CLI fixes and performance improvements.

### **Workspace Setup**
- **fab-inspector-rules folder**: Create this folder in your workspace root for rules files. The folder name can be configured in the extension's settings, by default it's set to `fab-inspector-rules`.
- **JSON Files**: Rules must be valid Fab Inspector Rules JSON files (with `.json` extension) stored at the root of the `fab-inspector-rules` folder.

#### **Rules File Format**
Your JSON rules files should follow the structure defined by the Fab Inspector (PBI Inspector V2) project, see resources below.

**📚 Rule Creation Resources:**
- **Main Repository**: [PBI Inspector V2](https://github.com/NatVanG/PBI-InspectorV2) - Official Fab Inspector CLI repository
- **Documentation Wiki**: [PBI Inspector V2 Wiki](https://github.com/NatVanG/PBI-InspectorV2/wiki) - Rule creation guide.

**Example workspace folder:**

Here is an example VS Code workspace folder. Note that, by default, a `fab-inspector-rules` folder must be present at the root of the workspace. In turm, the Fab Inspector rules file(s) must present at the root of the `fab-inspector-rules` folder. The default `fab-inspector-rules` folder can be renamed via the extension's settings.

```
📁 workspace/
├── 📁 fab-inspector-rules/
│   ├── report-rules.json
│   ├── advanced-rules.json
│   └── custom-validations.json
├── 📁 fabric-items/
│   ├── 📁 MyReport.Report/
│   │   ├── ...
│   │   └── .platform
│   ├── 📁 SalesDataset.SemanticModel/
│   │   ├── ...
│   │   └── .platform
│   └── 📁 ETLPipeline.DataPipeline/
│   │   ├── ...
│   │   └── .platform
```

**Sample repository:**

Here is an example repository with sample Microsoft Fabric CI/CD items and rules to get you started with the Fab Inspector VS Code extension: https://github.com/NatVanG/fab-inspector-cicd-example.

## 📖 Extension Usage Guide

### **1. Command Palette Operations**

#### **Fab Inspector: Run** (Interactive)
The main inspection command that provides the ability to define output formats.

**How to use:**
1. Open Command Palette (`Ctrl+Shift+P`)
2. Type and select `Fab Inspector: Run`
3. Follow the interactive prompts:
   - **Select Rules File**: Choose from available `.json` files in your `fab-inspector-rules` folder
   - **Select Output Format**: Choose between `console` or `html`. The `console` format logs test results to the "Fab Inspector" extension output channel in VS Code. The `html` option opens a browser page with locally generated HTML test results.

#### **Fab Inspector: Update CLI**
Manually download or update the Fab Inspector CLI to the latest version or the version specified in the extension's settings.

**How to use:**
1. Open Command Palette (`Ctrl+Shift+P`)
2. Type and select `Fab Inspector: Update CLI`
3. The extension will download and install the latest Fab Inspector CLI version or the version specified in the extension's settings.

#### **Fab Inspector: Show CLI Info**
Display information about the current CLI installation and version.

**How to use:**
1. Open Command Palette (`Ctrl+Shift+P`)
2. Type and select `Fab Inspector: Show CLI Info`
3. View CLI version, status, and configuration details

### **2. Right-Click Context Menu Operations**

#### **Fab Inspector: Run Current Rules**
Quickly execute the currently open rules file without additional prompts.

**How to use:**
1. Open a JSON rules file from your `fab-inspector-rules` folder
2. Right-click anywhere in the editor
3. Select `Fab Inspector: Run Current Rules` from the context menu
4. The extension will automatically execute the current rules file with GitHub-compatible output format

**Requirements:**
- Rules file must be located at the root of the `fab-inspector-rules` folder (itself at the root of the workspace)
- File must have a `.json` extension
- File must contain valid Fab Inspector Rules JSON definition

#### **Fab Inspector: Run Selected Rule** (Single Rule Testing)
Execute individual rules for quick testing or rule debugging.

**How to use:**
1. Select either a complete rule definition in your JSON editor or select the rule ID.
2. Right-click the selection
3. Choose `Fab Inspector: Run Selected Rule`
4. The extension will create a temporary rules file and execute just that rule

#### **Fab Inspector: Log Wrap** (JSON Wrapping)
Wrap selected JSON fragments with a log node for debugging or enhanced logging.

**How to use:**
1. Select a valid Fab Inspector rule's operator JSON in your editor
2. Right-click the selection
3. Choose `Fab Inspector: Log Wrap`
4. The selected JSON will be wrapped with a `log` node

**Example:**
```json
// Before (selected):
{
  "var": "visual.VisualType"
}

// After wrapping:
{
  "log": {
    "var": "visual.VisualType"
  }
}
```

#### **Fab Inspector: Log Unwrap** (JSON Unwrapping)
Remove log wrapper from JSON operator.

**How to use:**
1. Select a JSON object that contains a `log` node
2. Right-click the selection
3. Choose `Fab Inspector: Log Unwrap`
4. The log wrapper will be removed, leaving only the inner JSON

**Example:**
```json
// Before (selected):
{
  "log": {
    "var": "visual.VisualType"
  }
}

// After unwrapping:
{
  "var": "visual.VisualType"
}
```

## 🔧 Extension Settings

This extension exposes the following settings to VS Code:

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `fabInspector.autoUpdateCli` | boolean | `true` | Automatically check for and download CLI updates |
| `fabInspector.cliUpdateInterval` | number | `24` | Hours between CLI update checks (when auto-update is enabled) |
| `fabInspector.cliVersion` | string | `"latest"` | Version of the Fab Inspector CLI to download. Use 'latest' for the most recent release, or specify a version tag like 'v2.4.5' |

### **Command Reference**

| Command | ID | Trigger | Context | Description |
|---------|-----|---------|---------|-------------|
| `Fab Inspector: Run` | `fab-inspector.inspect` | Command Palette | Any time | Interactive inspection with full options |
| `Fab Inspector: Run Current Rules` | `fab-inspector.inspectWithCurrentRulesFile` | Right-click | JSON files in rules folder | Quick execution of current rules file |
| `Fab Inspector: Run Selected Rule` | `fab-inspector.runRule` | Right-click | JSON rule selection | Execute single rule for testing |
| `Fab Inspector: Log Wrap` | `fab-inspector.wrapWithLog` | Right-click | JSON selection | Wrap JSON fragment with log node |
| `Fab Inspector: Log Unwrap` | `fab-inspector.unwrapLog` | Right-click | JSON selection | Remove log wrapper from JSON |
| `Fab Inspector: Update CLI` | `fab-inspector.updateCli` | Command Palette | Any time | Manually update CLI to latest version |
| `Fab Inspector: Show CLI Info` | `fab-inspector.cliInfo` | Command Palette | Any time | Display CLI version and status |

## 🐛 Troubleshooting

### **Common Issues**

#### **".NET 8+ runtime not installed"** ####
- ✅ Download and install the [.NET 8 runtime](https://dotnet.microsoft.com/en-us/download/dotnet/thank-you/runtime-8.0.18-windows-x64-installer). Once installed it a reboot might be needed or ignore subsequent .NET checks error messages as the extension should now be running without issues.

#### **"No rules files found"**
- ✅ Ensure `fab-inspector-rules` folder exists in workspace root
- ✅ Verify files have `.json` extension
- ✅ Check that JSON syntax is valid

#### **"Right-click commands not appearing"**
- ✅ Ensure you're working with a `.json` file
- ✅ For selection-based commands, make sure a valid JSON fragment or rule ID is selected
- ✅ For rules file execution, ensure file is in the `fab-inspector-rules` folder

#### **"Rule execution failed"**
- ✅ Verify rule has valid JSON Logic syntax
- ✅ Ensure CLI is properly downloaded and accessible

#### **"CLI download failed"**
- ✅ Check internet connection
- ✅ Verify Windows firewall/antivirus isn't blocking downloads
- ✅ Try manually updating CLI using `Fab Inspector: Update CLI` command
- ✅ Check VS Code output panel for detailed error messages

#### **"Temporary file errors"**
- ✅ Check workspace permissions for `.vscode` folder creation
- ✅ Restart VS Code to clear any locked temporary files
- ✅ Verify sufficient disk space in workspace directory

### **Performance Tips**

- **Large Rule Sets**: Split complex rule sets into multiple files for easier management
- **Quick Testing**: Use `Fab Inspector: Run Selected Rule` for rapid iteration during development
- **Output Format**: Use `console` format for fastest execution, `html` for visual output
- **CLI Updates**: Keep CLI up-to-date or specify 'latest' version in the extension settings for best performance and latest features

## 🔄 Known Issues and Limitations

### **Current Limitations**
- **Platform Support**: Windows 64-bit only.
- **CLI Dependency**: Requires internet connection for initial CLI download and the .NET 8 runtime or above.
- **JSON Rules Only**: Rules files must be valid JSON (JSONC/comments not supported)
---

## **Feedback**

If you encounter issues or have suggestions for improvements, please:
- Check the troubleshooting section above
- Review the examples for usage guidance  
- Report issues or suggest improvments via the extension repository issues page at https://github.com/NatVanG/fab-inspector-vscode-ext/issues.

**🎉 Enjoy inspecting and validating your Microsoft Fabric items with enhanced productivity!**
