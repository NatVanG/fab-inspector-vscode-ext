# Fab Inspector VS Code Extension

A comprehensive Visual Studio Code extension that provides seamless integration with Microsoft Fabric Inspector CLI, enabling developers to analyze, inspect, and work with Fabric inspection rules directly from their VS Code workspace.

> **⚠️ Platform Support**: This extension currently supports **Windows only**. Support for macOS and Linux is planned for future releases.

## 🚀 Features

### **📋 Fabric Inspection Commands**
- **Fab Inspector: Run** - Interactive inspection with customizable output formats and full control
- **Fab Inspector: Run Current Rules** - Quick execution of the currently open rules file  
- **Fab Inspector: Run Selected Rule** - Execute individual rules for quick testing and validation
- **Real-time Output**: Stream inspection results in real-time through VS Code's output panel
- **Multiple Output Formats**: Generate reports in JSON, HTML, or console formats

### **🔧 JSON Rule Debug Commands**
- **Fab Inspector: Log Wrap** - Wrap selected JSON fragments with log nodes for debugging
- **Fab Inspector: Log Unwrap** - Remove log wrapper nodes from JSON, extracting inner content

### **�️ CLI Management Commands**
- **Fab Inspector: Update CLI** - Manually download and update the Fab Inspector CLI
- **Fab Inspector: Show CLI Info** - Display current CLI version and status information

### **�📁 Workspace Integration**
- **Rules Folder Support**: Organize rules in the `fab-inspector-rules` folder

## 📋 Requirements

### **Platform Requirements**
- **Operating System**: Windows (64-bit)
- **Visual Studio Code**: Version 1.102.0 or higher
- **Internet Connection**: Required for CLI downloads and updates

### **Fabric Inspector CLI**
- **Automatic Download**: CLI is automatically downloaded when first needed
- **Version Management**: Configurable CLI version selection (latest or specific versions)
- **Update Management**: Optional auto-updates with configurable intervals

### **Workspace Setup**
- **fab-inspector-rules folder**: Create this folder in your workspace root for rules files
- **JSON Files**: Rules must be valid JSON files with `.json` extension

## 📖 Usage Guide

### **1. Command Palette Operations**

#### **Fab Inspector: Run** (Interactive)
The main inspection command that provides full control over the inspection process.

**How to use:**
1. Open Command Palette (`Ctrl+Shift+P`)
2. Type and select `Fab Inspector: Run`
3. Follow the interactive prompts:
   - **Select Rules File**: Choose from available `.json` files in your `fab-inspector-rules` folder
   - **Select Output Format**: Choose between `json`, `html`, or `console`
   - **Select Fabric Item**: Pick the target Fabric item to inspect
4. View results in the "Fab Inspector" output channel

**Example workflow:**
```
📁 workspace/
├── 📁 fab-inspector-rules/
│   ├── basic-rules.json
│   ├── advanced-rules.json
│   └── custom-validations.json
├── 📁 fabric-items/
│   ├── 📁 MyReport.Report/
│   │   ├── report.json
│   │   └── definition.pbir
│   ├── 📁 SalesDataset.Dataset/
│   │   ├── model.bim
│   │   └── definition.pbir
│   └── 📁 ETLPipeline.DataPipeline/
│       ├── pipeline.json
│       └── definition.pbir
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
- File must be located within the `fab-inspector-rules` folder
- File must have a `.json` extension
- File must contain valid JSON content

#### **Fab Inspector: Log Wrap** (JSON Wrapping)
Wrap selected JSON fragments with a log node for debugging or enhanced logging.

**How to use:**
1. Select a valid JSON fragment in your editor
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
1. Select a complete rule definition in your JSON editor
2. Right-click the selection
3. Choose `Fab Inspector: Run Selected Rule`
4. The extension will create a temporary rules file and execute just that rule

### **3. Workspace Organization Best Practices**

#### **Recommended Folder Structure**
```
your-workspace/
├── 📁 fab-inspector-rules/           # ✅ Required folder name
│   ├── 📄 basic-validations.json    # ✅ Valid rules file
│   ├── 📄 performance-rules.json    # ✅ Valid rules file  
│   └── 📄 security-checks.json      # ✅ Valid rules file
├── 📁 fabric-items/                 # Your Fabric items to inspect
│   ├── 📁 SalesReport.Report/
│   │   ├── 📄 report.json
│   │   ├── 📄 definition.pbir
│   │   └── 📄 metadata.json
│   ├── 📁 CustomerDataset.Dataset/
│   │   ├── 📄 model.bim
│   │   ├── 📄 definition.pbir
│   │   └── 📄 relationships.json
│   ├── 📁 ETLPipeline.DataPipeline/
│   │   ├── 📄 pipeline.json
│   │   ├── 📄 definition.pbir
│   │   └── 📄 activities.json
│   └── 📁 AnalyticsDB.SQLDatabase/
│       ├── 📄 database.json
│       ├── 📄 definition.pbir
│       └── 📁 tables/
│           ├── 📄 customers.json
│           └── 📄 orders.json
└── 📁 documentation/                 # Optional documentation
    └── 📄 inspection-guide.md
```

#### **Rules File Format**
Your JSON rules files should follow the structure defined by the Fab Inspector (PBI Inspector V2) project. 

**📚 Rule Creation Resources:**
- **Main Repository**: [PBI Inspector V2](https://github.com/NatVanG/PBI-InspectorV2) - Official Fab Inspector CLI repository
- **Documentation Wiki**: [PBI Inspector V2 Wiki](https://github.com/NatVanG/PBI-InspectorV2/wiki) - Comprehensive rule creation guide
- **Rule Examples**: Browse the repository for sample rules and validation logic
- **JSON Logic Reference**: Learn about JSON Logic syntax used in rule definitions

### **4. Advanced Usage Scenarios**

#### **Bulk Rule Testing**
Test multiple rules in sequence:

1. Create individual rule files for different validation categories
2. Use the interactive `Fab Inspector: Run` command to test each category
3. Compare results across different output formats

#### **Rule Development Workflow**
Efficient workflow for developing and testing rules:

1. **Create Rule**: Write your rule in the `fab-inspector-rules` folder
2. **Test Individual Rule**: Select the rule and use `Fab Inspector: Run Selected Rule`
3. **Refine Logic**: Edit and re-test using the right-click execution
4. **Full Integration Test**: Use `Fab Inspector: Run` to test with complete rule set
5. **Validate Output**: Check different output formats (JSON, HTML, console)

#### **JSON Logic Development**
Use the wrap/unwrap features for JSON Logic development:

1. **Develop Logic**: Create complex JSON Logic expressions
2. **Add Logging**: Use `Fab Inspector: Log Wrap` to wrap expressions for debugging
3. **Test Logic**: Execute wrapped logic with `Fab Inspector: Run Selected Rule`
4. **Clean Output**: Use `Fab Inspector: Log Unwrap` to remove debug wrappers

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

### **File Processing**
- **Temporary Files**: Created in secure workspace-specific directory (`.vscode/fab-inspector-temp/`)
- **Automatic Cleanup**: All temporary files are cleaned up after execution
- **Path Validation**: Ensures rules files are in the correct workspace location with security checks
- **JSON Validation**: Validates JSON syntax before processing
- **Security Hardening**: Protection against path traversal and command injection attacks

### **CLI Management**
- **Auto-Download**: CLI is automatically downloaded when first needed
- **Version Control**: Support for specific CLI versions or latest release
- **Update Notifications**: Optional automatic update checks with configurable intervals
- **Secure Downloads**: CLI binaries downloaded with integrity verification
- **Process Management**: Safe process spawning and termination

### **Output Formats**
- **JSON**: Structured output suitable for programmatic processing
- **HTML**: Rich formatted output with styling and interactive elements  
- **Console**: Plain text output optimized for terminal viewing
- **GitHub**: Default format for right-click operations, optimized for GitHub integration
- **ADO**: Default format for right-click operations, optimized for ADO integration

## 🐛 Troubleshooting

### **Common Issues**

#### **"No rules files found"**
- ✅ Ensure `fab-inspector-rules` folder exists in workspace root
- ✅ Verify files have `.json` extension
- ✅ Check that JSON syntax is valid

#### **"Right-click commands not appearing"**
- ✅ Ensure you're working with a `.json` file
- ✅ For selection-based commands, make sure text is selected
- ✅ For rules file execution, ensure file is in `fab-inspector-rules` folder

#### **"Rule execution failed"**
- ✅ Verify rule has valid JSON Logic syntax
- ✅ Check that required properties (`id`, `logic`) are present
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
- **File Organization**: Keep frequently used rules in easily accessible files
- **CLI Updates**: Keep CLI up-to-date or specify 'latest' version in the extension settings for best performance and latest features

## 🔄 Known Issues and Limitations

### **Current Limitations**
- **Platform Support**: Windows only
- **CLI Dependency**: Requires internet connection for initial CLI download
- **JSON Only**: Rules files must be valid JSON (JSONC/comments not supported)

## 📝 Release Notes

### **0.0.2** - Current Release
- ✨ **New Features**:
  - **CLI Management Commands**: Added `Fab Inspector: Update CLI` and `Fab Inspector: Show CLI Info` commands
  - **Automatic CLI Downloads**: CLI is now automatically downloaded when first needed
  - **Configurable CLI Versions**: Support for specific CLI versions or latest release
  - **Auto-Update System**: Optional automatic CLI updates with configurable intervals
  - **Security Hardening**: Enhanced security with path validation and injection prevention
  - **Improved Process Management**: Better CLI process handling and cleanup
  - **Singleton Output Channel**: Prevents multiple output channels from being created

- 🔧 **Technical Improvements**:
  - **Secure Temporary Directories**: Files created in workspace-specific secure locations
  - **CLI Process Shutdown**: Proper cleanup of running CLI processes
  - **Enhanced Error Handling**: Better error messages and troubleshooting information
  - **Unit Test Coverage**: Comprehensive test suite with 85+ test cases
  - **Type Safety**: Improved TypeScript implementation with strict typing

- ⚠️ **Breaking Changes**:
  - **Windows Only**: This release explicitly supports Windows only (macOS/Linux support planned)
  - **CLI Download Required**: Initial internet connection required for CLI download
  - **Configuration Changes**: New settings for CLI management and auto-updates

### **0.0.1** - Initial Release
- ✨ **New Features**:
  - Interactive Fabric inspection with customizable output formats
  - Right-click context menu integration for JSON files
  - JSON wrap/unwrap functionality for debugging
  - Single rule execution for rapid testing
  - Automatic temporary file management with cleanup
  - Real-time output streaming in VS Code output panel

- 🏗️ **Architecture**: 
  - Modular TypeScript architecture with focused components
  - Comprehensive test suite with 42+ test cases
  - Clean separation of concerns across 6 main modules

- 🔧 **Technical**: 
  - PBIRInspectorCLI.exe integration
  - JsonPath library for rule querying
  - Robust error handling and validation

---

**📞 Support & Feedback**

If you encounter issues or have suggestions for improvements, please:
- Check the troubleshooting section above
- Review the examples for usage guidance  
- Report issues through the VS Code extension feedback system or through the extension repository issues log

**🎉 Enjoy inspecting and validating your Fabric items with enhanced productivity!**