# Fab Inspector VS Code Extension

A comprehensive Visual Studio Code extension that provides seamless integration with Microsoft Fabric Inspector CLI, enabling developers to analyze, inspect, and work with Fabric inspection rules directly from their VS Code workspace.

## 🚀 Features

### **📋 Fabric Inspection**
- **Interactive Inspection**: Run comprehensive inspections with customizable output formats
- **Right-Click Rules Execution**: Execute current rules file directly from the editor context menu
- **Real-time Output**: Stream inspection results in real-time through VS Code's output panel
- **Multiple Output Formats**: Generate reports in JSON, HTML, or console formats

### **🔧 JSON Rule Management**
- **JSON Wrap/Unwrap**: Easily wrap JSON fragments with log nodes or remove them
- **Single Rule Testing**: Execute individual rules for quick testing and validation
- **Smart Rule Finding**: Automatically locate rules by ID anywhere in your JSON documents

### **📁 Workspace Integration**
- **Rules Folder Support**: Organize rules in the `fab-inspector-rules` folder
- **Path Validation**: Automatic validation of rules file locations
- **Temporary File Management**: Safe handling of temporary files with automatic cleanup

## 📋 Requirements

### **Essential Dependencies**
- **Visual Studio Code**: Version 1.74.0 or higher
- **PBIRInspectorCLI.exe**: Included in the extension's `bin/` folder
- **JSON Language Support**: Built-in VS Code JSON language features

### **Workspace Setup**
- **fab-inspector-rules folder**: Create this folder in your workspace root for rules files
- **JSON Files**: Rules must be valid JSON files with `.json` extension

## 📖 Usage Guide

### **1. Command Palette Operations**

#### **Fab Inspect (Interactive)**
The main inspection command that provides full control over the inspection process.

**How to use:**
1. Open Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`)
2. Type and select `Fab Inspect`
3. Follow the interactive prompts:
   - **Select Rules File**: Choose from available `.json` files in your `fab-inspector-rules` folder
   - **Select Output Format**: Choose between `json`, `html`, or `console`
   - **Select Fabric File**: Pick the target file to inspect
4. View results in the "Fab Inspector" output channel

**Example workflow:**
```
📁 workspace/
├── 📁 fab-inspector-rules/
│   ├── basic-rules.json
│   ├── advanced-rules.json
│   └── custom-validations.json
├── 📁 fabric-files/
│   ├── report.pbix
│   └── dataset.pbix
```

### **2. Right-Click Context Menu Operations**

#### **Fab Inspect (Current Rules File)**
Quickly execute the currently open rules file without additional prompts.

**How to use:**
1. Open a JSON rules file from your `fab-inspector-rules` folder
2. Right-click anywhere in the editor
3. Select `Fab Inspect` from the context menu
4. The extension will automatically execute the current rules file with GitHub-compatible output format

**Requirements:**
- File must be located within the `fab-inspector-rules` folder
- File must have a `.json` extension
- File must contain valid JSON content

#### **Fab Log (JSON Wrapping)**
Wrap selected JSON fragments with a log node for debugging or enhanced logging.

**How to use:**
1. Select a valid JSON fragment in your editor
2. Right-click the selection
3. Choose `Fab Log`
4. The selected JSON will be wrapped with a `log` node

**Example:**
```json
// Before (selected):
{
  "id": "rule-001",
  "condition": true
}

// After wrapping:
{
  "log": {
    "id": "rule-001", 
    "condition": true
  }
}
```

#### **Fab Unlog (JSON Unwrapping)**
Remove log wrapper nodes from JSON, extracting the inner content.

**How to use:**
1. Select a JSON object that contains a `log` node
2. Right-click the selection
3. Choose `Fab Unlog`
4. The log wrapper will be removed, leaving only the inner JSON

**Example:**
```json
// Before (selected):
{
  "log": {
    "id": "rule-001",
    "condition": true
  }
}

// After unwrapping:
{
  "id": "rule-001",
  "condition": true
}
```

#### **Fab Run Rule (Single Rule Testing)**
Execute individual rules for quick testing and validation.

**How to use:**
1. Select a complete rule definition in your JSON editor
2. Right-click the selection
3. Choose `Fab Run Rule`
4. The extension will create a temporary rules file and execute just that rule

**Example rule selection:**
```json
{
  "id": "test-rule-001",
  "name": "Sample Validation Rule",
  "description": "Validates data model structure",
  "logic": {
    "and": [
      {"var": "hasValidSchema"},
      {"==": [{"var": "version"}, "1.0"]}
    ]
  }
}
```

### **3. Workspace Organization Best Practices**

#### **Recommended Folder Structure**
```
your-workspace/
├── 📁 fab-inspector-rules/           # ✅ Required folder name
│   ├── 📄 basic-validations.json    # ✅ Valid rules file
│   ├── 📄 performance-rules.json    # ✅ Valid rules file  
│   └── 📄 security-checks.json      # ✅ Valid rules file
├── 📁 fabric-files/                 # Your fabric files to inspect
│   ├── 📄 report1.pbix
│   └── 📄 dataset1.pbix
└── 📁 documentation/                 # Optional documentation
    └── 📄 inspection-guide.md
```

#### **Rules File Format**
Your JSON rules files should follow this structure:

```json
{
  "rules": [
    {
      "id": "unique-rule-id",
      "name": "Human Readable Rule Name",
      "description": "What this rule validates",
      "category": "validation-category", 
      "severity": "error|warning|info",
      "logic": {
        // JSON Logic expression
        "and": [
          {"var": "someProperty"},
          {">": [{"var": "numericValue"}, 0]}
        ]
      }
    }
  ],
  "metadata": {
    "version": "1.0",
    "author": "Your Name",
    "created": "2025-01-15"
  }
}
```

### **4. Advanced Usage Scenarios**

#### **Bulk Rule Testing**
Test multiple rules in sequence:

1. Create individual rule files for different validation categories
2. Use the interactive `Fab Inspect` command to test each category
3. Compare results across different output formats

#### **Rule Development Workflow**
Efficient workflow for developing and testing rules:

1. **Create Rule**: Write your rule in the `fab-inspector-rules` folder
2. **Test Individual Rule**: Select the rule and use `Fab Run Rule`
3. **Refine Logic**: Edit and re-test using the right-click execution
4. **Full Integration Test**: Use `Fab Inspect` to test with complete rule set
5. **Validate Output**: Check different output formats (JSON, HTML, console)

#### **JSON Logic Development**
Use the wrap/unwrap features for JSON Logic development:

1. **Develop Logic**: Create complex JSON Logic expressions
2. **Add Logging**: Use `Fab Log` to wrap expressions for debugging
3. **Test Logic**: Execute wrapped logic with `Fab Run Rule`
4. **Clean Output**: Use `Fab Unlog` to remove debug wrappers

## 🔧 Extension Settings

This extension does not contribute additional VS Code settings. All configuration is handled through:

- **Command Palette interactions**: Interactive prompts guide you through options
- **File organization**: Rules placement in the `fab-inspector-rules` folder
- **Context menu availability**: Commands appear based on file type and selection context

## ⚙️ Technical Details

### **Command Reference**
| Command | Trigger | Context | Description |
|---------|---------|---------|-------------|
| `Fab Inspect` | Command Palette | Any time | Interactive inspection with full options |
| `Fab Inspect` | Right-click | JSON files in rules folder | Quick execution of current rules file |
| `Fab Log` | Right-click | JSON selection | Wrap JSON fragment with log node |
| `Fab Unlog` | Right-click | JSON selection | Remove log wrapper from JSON |
| `Fab Run Rule` | Right-click | JSON rule selection | Execute single rule for testing |

### **File Processing**
- **Temporary Files**: Created in system temp directory with prefix `fab-inspector-temp-rule-`
- **Automatic Cleanup**: All temporary files are cleaned up after execution
- **Path Validation**: Ensures rules files are in the correct workspace location
- **JSON Validation**: Validates JSON syntax before processing

### **Output Formats**
- **JSON**: Structured output suitable for programmatic processing
- **HTML**: Rich formatted output with styling and interactive elements  
- **Console**: Plain text output optimized for terminal viewing
- **GitHub**: Default format for right-click operations, optimized for GitHub integration

## 📚 Examples

### **Example 1: Basic Rule Validation**

**Scenario**: Validate that all reports have required metadata

**rules/metadata-validation.json:**
```json
{
  "rules": [
    {
      "id": "require-title",
      "name": "Report Must Have Title",
      "description": "Ensures all reports include a title property",
      "severity": "error",
      "logic": {
        "and": [
          {"var": "title"},
          {">": [{"strlen": {"var": "title"}}, 0]}
        ]
      }
    },
    {
      "id": "require-author", 
      "name": "Report Must Have Author",
      "description": "Ensures all reports specify an author",
      "severity": "warning",
      "logic": {
        "var": "author"
      }
    }
  ]
}
```

**Usage:**
1. Save the above as `metadata-validation.json` in your `fab-inspector-rules` folder
2. Open Command Palette → `Fab Inspect`
3. Select `metadata-validation.json` → Choose output format → Select target file
4. View validation results

### **Example 2: Single Rule Testing**

**Scenario**: Test a complex validation rule before adding it to your rule set

**Steps:**
1. Create your rule in a JSON file:
```json
{
  "id": "performance-check",
  "name": "Performance Validation",
  "description": "Checks if query execution time is within acceptable limits", 
  "logic": {
    "and": [
      {"var": "executionTime"},
      {"<": [{"var": "executionTime"}, 5000]},
      {">": [{"var": "executionTime"}, 0]}
    ]
  }
}
```

2. Select the entire rule object
3. Right-click → `Fab Run Rule`  
4. Review execution results to validate logic
5. Refine the rule as needed

### **Example 3: JSON Logic Development with Wrapping**

**Scenario**: Develop complex JSON Logic with debugging

**Initial Logic:**
```json
{
  "and": [
    {"var": "isActive"},
    {">": [{"var": "userCount"}, 10]}
  ]
}
```

**Add Debugging (select logic, right-click → Fab Log):**
```json
{
  "log": {
    "and": [
      {"var": "isActive"}, 
      {">": [{"var": "userCount"}, 10]}
    ]
  }
}
```

**Test wrapped logic with Fab Run Rule, then remove wrapper (Fab Unlog) when ready**

### **Example 4: Workspace Setup for Team Development**

**Project Structure:**
```
fabric-validation-project/
├── 📁 fab-inspector-rules/
│   ├── 📄 00-core-validations.json      # Basic structural checks
│   ├── 📄 01-performance-rules.json     # Performance validations  
│   ├── 📄 02-security-checks.json       # Security-related rules
│   ├── 📄 03-business-logic.json        # Domain-specific validations
│   └── 📄 99-experimental-rules.json    # Rules under development
├── 📁 test-data/
│   ├── 📄 sample-report.pbix
│   ├── 📄 test-dataset.pbix
│   └── 📄 validation-cases.pbix
├── 📁 documentation/
│   ├── 📄 rule-development-guide.md
│   └── 📄 validation-standards.md
└── 📄 README.md
```

**Team Workflow:**
1. **Rule Development**: Each team member works on numbered rule files
2. **Individual Testing**: Use `Fab Run Rule` for quick rule validation
3. **Integration Testing**: Use `Fab Inspect` to test complete rule sets
4. **Code Review**: Share rule files through version control
5. **Documentation**: Maintain standards in documentation folder

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
- ✅ Ensure PBIRInspectorCLI.exe is accessible in the extension's bin folder

#### **"Temporary file errors"**
- ✅ Check system temp directory permissions
- ✅ Restart VS Code to clear any locked temporary files
- ✅ Verify sufficient disk space in temp directory

### **Performance Tips**

- **Large Rule Sets**: Split complex rule sets into multiple files for easier management
- **Quick Testing**: Use `Fab Run Rule` for rapid iteration during development
- **Output Format**: Use `console` format for fastest execution, `html` for detailed analysis
- **File Organization**: Keep frequently used rules in easily accessible files

## 🔄 Known Issues and Limitations

### **Current Limitations**
- **CLI Dependency**: Requires PBIRInspectorCLI.exe to be present in the extension's bin folder
- **JSON Only**: Rules files must be valid JSON (JSONC/comments not supported)
- **Windows Paths**: Optimized for Windows file paths (cross-platform compatibility in development)
- **Single File Execution**: Right-click inspection works with one rules file at a time

### **Future Enhancements**
- **Rule Intellisense**: JSON Schema validation and autocomplete for rule files
- **Cross-Platform Support**: Enhanced compatibility for macOS and Linux
- **Rule Templates**: Pre-built rule templates for common validation scenarios
- **Batch Processing**: Execute multiple rules files in sequence

## 📝 Release Notes

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
- Report issues through the VS Code extension feedback system

**🎉 Enjoy inspecting and validating your Fabric items with enhanced productivity!**
