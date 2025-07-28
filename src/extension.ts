// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

// Get the path to the bundled executable
function getFabInspectorExecutablePath(context: vscode.ExtensionContext): string {
    return path.join(context.extensionPath, 'bin', 'PBIRInspectorCLI.exe');
}

// Check if the bundled executable and its dependencies exist
function checkBundledExecutable(executablePath: string): Promise<boolean> {
    return new Promise((resolve) => {
        // Check if executable exists
        fs.access(executablePath, fs.constants.F_OK | fs.constants.X_OK, (err) => {
            if (err) {
                resolve(false);
                return;
            }

            // Check if Files folder exists
            const filesFolder = path.join(path.dirname(executablePath), 'Files');
            fs.access(filesFolder, fs.constants.F_OK, (filesErr) => {
                if (filesErr) {
                    console.warn('Files folder not found, executable may not work correctly');
                }
                resolve(true); // Still resolve true if executable exists, even if Files folder is missing
            });
        });
    });
}

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "fab-inspector" is now active!');

    // Register the command to run Fab Inspector
    const runFabInspectorCommand = vscode.commands.registerCommand('fab-inspector.inspect', async () => {
        // Prompt user for rules file and formats
        const rulesFile = await vscode.window.showInputBox({
            placeHolder: 'Enter the name of the rules file within your fab-inspector-rules folder (e.g., rules.json)',
            prompt: 'Rules File Path',
            validateInput: (value) => {
                if (!value) {
                    return 'Rules file path cannot be empty.';
                }
                if (!value.endsWith('.json')) {
                    return 'Rules file must be a JSON file.';
                }
                return null;
            }
        });

        const formats = await vscode.window.showInputBox({
            placeHolder: 'Enter the output formats (e.g., json,html,console)',
            prompt: 'Output Formats',
            validateInput: (value) => {
                if (!value) {
                    return 'Output formats cannot be empty.';
                }
                return null;
            }
        });

        // Run Fab Inspector with the provided inputs
        if (rulesFile && formats) {
            await runFabInspector(context, rulesFile, formats);
        } else {
            vscode.window.showErrorMessage('All inputs (rules file and formats) are required.');
        }
    });

    // Register the command to wrap JSON with log node
    const wrapWithLogCommand = vscode.commands.registerCommand('fab-inspector.wrapWithLog', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor found.');
            return;
        }

        const selection = editor.selection;
        if (selection.isEmpty) {
            vscode.window.showErrorMessage('Please select a JSON fragment to wrap with log.');
            return;
        }

        const selectedText = editor.document.getText(selection);
        
        // Validate that the selected text is valid JSON
        try {
            JSON.parse(selectedText);
        } catch (error) {
            vscode.window.showErrorMessage('Selected text is not valid JSON.');
            return;
        }

        // Parse and re-stringify to ensure proper formatting
        const parsedJson = JSON.parse(selectedText);
        const wrappedJson = {
            "log": parsedJson
        };

        // Format the wrapped JSON with proper indentation
        const formattedJson = JSON.stringify(wrappedJson, null, 2);

        // Replace the selected text with the wrapped version
        await editor.edit(editBuilder => {
            editBuilder.replace(selection, formattedJson);
        });

        // Format the entire document for nice indentation
        await vscode.commands.executeCommand('editor.action.formatDocument');

        vscode.window.showInformationMessage('JSON fragment wrapped with log node and document formatted.');
    });

    // Register the command to unwrap log node
    const unwrapLogCommand = vscode.commands.registerCommand('fab-inspector.unwrapLog', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor found.');
            return;
        }

        const selection = editor.selection;
        if (selection.isEmpty) {
            vscode.window.showErrorMessage('Please select a JSON fragment to unwrap log node.');
            return;
        }

        const selectedText = editor.document.getText(selection);
        
        // Validate that the selected text is valid JSON
        let parsedJson;
        try {
            parsedJson = JSON.parse(selectedText);
        } catch (error) {
            vscode.window.showErrorMessage('Selected text is not valid JSON.');
            return;
        }

        // Check if the JSON has a "log" property
        if (!parsedJson.hasOwnProperty('log')) {
            vscode.window.showErrorMessage('Selected JSON does not contain a "log" node to unwrap.');
            return;
        }

        // Extract the inner JSON from the log node
        const innerJson = parsedJson.log;

        // Format the unwrapped JSON with proper indentation
        const formattedJson = JSON.stringify(innerJson, null, 2);

        // Replace the selected text with the unwrapped version
        await editor.edit(editBuilder => {
            editBuilder.replace(selection, formattedJson);
        });

        // Format the entire document for nice indentation
        await vscode.commands.executeCommand('editor.action.formatDocument');

        vscode.window.showInformationMessage('Log node unwrapped and document formatted.');
    });

    context.subscriptions.push(runFabInspectorCommand, wrapWithLogCommand, unwrapLogCommand);
}

async function runFabInspector(context: vscode.ExtensionContext, rulesFile: string, formats: string) {
    // Get the first workspace folder
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
        vscode.window.showErrorMessage('No workspace folder is open.');
        return;
    }

    // Construct paths based on the workspace folder
    const fabricItemPath = workspaceFolder.uri.fsPath;
    const rulesPath = path.join(workspaceFolder.uri.fsPath, "fab-inspector-rules", rulesFile);
    const rulesDir = path.join(workspaceFolder.uri.fsPath, "fab-inspector-rules");

    // Validate paths
    if (!fs.existsSync(rulesDir)) {
        vscode.window.showErrorMessage('The "fab-inspector-rules" folder was not found in the workspace. Please create this folder and add your rules files.');
        return;
    }

    if (!fs.existsSync(rulesPath)) {
        vscode.window.showErrorMessage(`The rules file "${rulesFile}" was not found in the "fab-inspector-rules" folder.`);
        return;
    }

    // Check if bundled executable is available
    const executablePath = getFabInspectorExecutablePath(context);
    const hasBundledExecutable = await checkBundledExecutable(executablePath);

    if (hasBundledExecutable) {
        runNativeCommand(executablePath, fabricItemPath, rulesPath, formats);
    } else {
        vscode.window.showErrorMessage('Fab Inspector executable not found. Please ensure the extension is properly installed with the bundled executable.');
        return;
    }
}

function runNativeCommand(executablePath: string, fabricItemPath: string, rulesPath: string, formats: string) {
    const rulesFileName = path.basename(rulesPath);
    
    // Inform user that Fab Inspector is starting
    vscode.window.showInformationMessage(`Running Fab Inspector with rules file "${rulesFileName}"...`);

    // Create output channel for real-time streaming
    const channel = vscode.window.createOutputChannel('Fab Inspector');
    channel.clear();
    channel.show();
    channel.appendLine('Starting Fab Inspector...');
    channel.appendLine(`Executable: ${executablePath}`);
    channel.appendLine(`Fabric Item Path: ${fabricItemPath}`);
    channel.appendLine(`Rules File: ${rulesPath}`);
    channel.appendLine(`Formats: ${formats}`);
    channel.appendLine('');

    // Build command arguments
    const args = [
        '-fabricitem', fabricItemPath,
        '-rules', rulesPath,
        '-formats', formats
    ];

    // Set working directory to the bin folder so the executable can find its Files folder
    const binDirectory = path.dirname(executablePath);

    // Use spawn for real-time output streaming
    const process = spawn(executablePath, args, {
        cwd: binDirectory // Set working directory
    });

    // Stream stdout in real-time
    process.stdout.on('data', (data) => {
        channel.append(data.toString());
    });

    // Stream stderr in real-time
    process.stderr.on('data', (data) => {
        channel.append(data.toString());
    });

    // Handle process completion
    process.on('close', (code) => {
        if (code === 0) {
            channel.appendLine('\nFab Inspector completed successfully.');
            vscode.window.showInformationMessage('Fab Inspector completed successfully!');
        } else {
            channel.appendLine(`\nFab Inspector failed with exit code: ${code}`);
            vscode.window.showErrorMessage(`Fab Inspector failed with exit code: ${code}`);
        }
    });

    // Handle process errors
    process.on('error', (error) => {
        channel.appendLine(`\nError running Fab Inspector: ${error.message}`);
        vscode.window.showErrorMessage(`Fab Inspector execution failed: ${error.message}. Please ensure the executable has proper permissions and dependencies are installed.`);
    });
}

// This method is called when your extension is deactivated
export function deactivate() { }
