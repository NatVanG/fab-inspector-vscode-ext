# Fab Inspector VS Code Extension

A Visual Studio Code extension that provides seamless integration with the [Fab Inspector](https://github.com/NatVanG/PBI-InspectorV2) CLI, enabling developers to analyze, inspect, and work with Fab Inspector rules directly from their VS Code workspace.

The GitHub repository for this extension can be found at https://github.com/NatVanG/fab-inspector-vscode-ext.

> **⚠️ Platform Support**: This extension currently supports **Windows only** and requires the .NET 8+ runtime.

## 🚀 Features

### **📋 Fabric Inspection Commands**
- **Fab Inspector: Run** - Interactive inspection with customizable output formats and full control
- **Fab Inspector: Run Current Rules** - Quick execution of the currently open rules file  
- **Fab Inspector: Run Selected Rule** - Execute individual rules for quick testing and validation
- **Multiple Output Formats**: Generate reports in HTML to the VS Code output console

### **🔧 JSON Rule Debug Commands**
- **Fab Inspector: Log Un\Wrap** - Un\Wrap a selected Fab Inspector rule operation with log nodes for debug output to console

### **🔧 CLI Management Commands**
- **Fab Inspector: Update CLI** - Manually download and update the Fab Inspector CLI
- **Fab Inspector: Show CLI Info** - Display current CLI version and status information

### **📁 Workspace Integration**
- **Rules Folder Support**: Organize rules in the `fab-inspector-rules` folder at the root of your VS Code folder

## 📋 Requirements

### **Platform Requirements**
- **Operating System**: Windows (64-bit)
- **.NET Runtime**: .NET 8.0 or later must be installed
- **Visual Studio Code**: Version 1.102.0 or higher
- **Internet Connection**: Required for Fab Inspector CLI downloads. 

### **Installing .NET 8**
The extension requires .NET 8 runtime to execute the Fab Inspector CLI. You have several options:

#### **Option 1: Automatic Installation**

The extension will try and check if there is a local .NET 8+ runtime installed and if not it will try to install it. This behaviour can be disabled in the extension's settings.

> **💡 Note**: The extension automatically installs the Microsoft .NET Install Tool extension as a dependency to help with .NET runtime management.

#### **Option 2: Manual Installation**
1. **Download .NET 8**: Visit [https://dotnet.microsoft.com/download/dotnet/8.0](https://dotnet.microsoft.com/download/dotnet/8.0)
2. **Choose Runtime**: Download the ".NET Runtime" (not SDK unless you're developing .NET applications)
3. **Install**: Run the installer and follow the setup instructions
4. **Verify Installation**: Open Command Prompt and run `dotnet --version` to confirm installation

### **Fabric Inspector CLI**
- **Automatic Download**: The Fab Inspector CLI is automatically downloaded when first needed from the "CLI" releases published to https://github.com/NatVanG/PBI-InspectorV2/releases.
- **Version Management**: Configurable CLI version selection (latest or specific versions)
- **Update Management**: Optional auto-updates (enabled by default) with configurable cache expiry intervals

> **💡 Note**: Enabling auto-update is recommended to get the latest Fab Inspector CLI fixes and performance improvements.

### **Workspace Setup**
- **fab-inspector-rules folder**: Create this folder in your workspace root for rules files. The default folder name can be configured in the extension's settings.
- **JSON Files**: Rules must be valid Fab Inspector Rules JSON files with `.json` extension

## 📖 Usage Guide

### **1. Command Palette Operations**

#### **Fab Inspector: Run** (Interactive)
The main inspection command that provides full control over the inspection process.

**How to use:**
1. Open Command Palette (`Ctrl+Shift+P`)
2. Type and select `Fab Inspector: Run`
3. Follow the interactive prompts:
   - **Select Rules File**: Choose from available `.json` files in your `fab-inspector-rules` folder
   - **Select Output Format**: Choose between `console` or `html`
4. View results in the "Fab Inspector" output channel

**Example workspace folder:**
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

#### **Fab Inspector: Update CLI**
Manually download and update the Fab Inspector CLI to the latest version.

**How to use:**
1. Open Command Palette (`Ctrl+Shift+P`)
2. Type and select `Fab Inspector: Update CLI`
3. The extension will download and install the latest CLI version
4. View progress and results in the "Fab Inspector" output channel

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
- File must be located at the root of the `fab-inspector-rules` folder
- File must have a `.json` extension
- File must contain valid Fab Inspector Rules JSON definition

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
Remove log wrapper nodes from JSON, extracting the inner content.

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

#### **Fab Inspector: Run Selected Rule** (Single Rule Testing)
Execute individual rules for quick testing and validation.

**How to use:**
1. Select a complete rule definition in your JSON editor or select the rule ID.
2. Right-click the selection
3. Choose `Fab Inspector: Run Selected Rule`
4. The extension will create a temporary rules file and execute just that rule

#### **Rules File Format**
Your JSON rules files should follow the structure defined by the Fab Inspector (PBI Inspector V2) project. 

**📚 Rule Creation Resources:**
- **Main Repository**: [PBI Inspector V2](https://github.com/NatVanG/PBI-InspectorV2) - Official Fab Inspector CLI repository
- **Documentation Wiki**: [PBI Inspector V2 Wiki](https://github.com/NatVanG/PBI-InspectorV2/wiki) - Comprehensive rule creation guide
- **Rule Examples**: Browse the repository for sample rules and validation logic
- **JSON Logic Reference**: Learn about JSON Logic syntax used in rule definitions
## 🔧 Extension Settings

This extension contributes the following settings to VS Code:

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `fabInspector.autoUpdateCli` | boolean | `true` | Automatically check for and download CLI updates |
| `fabInspector.cliUpdateInterval` | number | `24` | Hours between CLI update checks (when auto-update is enabled) |
| `fabInspector.cliVersion` | string | `"latest"` | Version of the Fab Inspector CLI to download. Use 'latest' for the most recent release, or specify a version tag like 'v2.4.3' |

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

#### **"No rules files found"**
- ✅ Ensure `fab-inspector-rules` folder exists in workspace root
- ✅ Verify files have `.json` extension
- ✅ Check that JSON syntax is valid

#### **"Right-click commands not appearing"**
- ✅ Ensure you're working with a `.json` file
- ✅ For selection-based commands, make sure a valid JSON fragment or rule ID is selected
- ✅ For rules file execution, ensure file is in `fab-inspector-rules` folder

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
- **Platform Support**: Windows only
- **CLI Dependency**: Requires internet connection for initial CLI download
- **JSON Rules Only**: Rules files must be valid JSON (JSONC/comments not supported)
---

## ** Feedback**

If you encounter issues or have suggestions for improvements, please:
- Check the troubleshooting section above
- Review the examples for usage guidance  
- Report issues or suggest improvments via the extension repository issues page at https://github.com/NatVanG/fab-inspector-vscode-ext/issues.

**🎉 Enjoy inspecting and validating your Microsoft Fabric items with enhanced productivity!**