// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { spawn } from 'child_process';
const jsonpath = require('jsonpath');

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

// Function to find a rule by its ID in the document text
function findRuleById(documentText: string, ruleId: string): any | null {
    try {
        // Parse the document as JSON
        const documentJson = JSON.parse(documentText);
        
        // Use JsonPath to find rules with the matching ID
        // This will search for any object with an "id" property matching ruleId
        const matches = jsonpath.query(documentJson, `$..rules[?(@.id == "${ruleId}")]`);
        
        if (matches.length > 0) {
            return matches[0]; // Return the first match
        }
        
        // If no match found in rules array, try searching anywhere in the document
        const globalMatches = jsonpath.query(documentJson, `$..[?(@.id == "${ruleId}")]`);
        
        if (globalMatches.length > 0) {
            return globalMatches[0]; // Return the first match
        }
        
        return null;
        
    } catch (error) {
        console.log('Document is not valid JSON, cannot search for rule by ID');
        return null;
    }
}

// Function to clean up any existing temporary files
function cleanupExistingTempFiles(outputChannel: vscode.OutputChannel) {
    try {
        const tempDir = os.tmpdir();
        const files = fs.readdirSync(tempDir);
        const fabTempFiles = files.filter(file => file.startsWith('fab-inspector-temp-rule-'));
        
        if (fabTempFiles.length > 0) {
            outputChannel.appendLine(`Found ${fabTempFiles.length} existing temp files to clean up`);
            let cleanedCount = 0;
            
            for (const file of fabTempFiles) {
                try {
                    const filePath = path.join(tempDir, file);
                    fs.unlinkSync(filePath);
                    cleanedCount++;
                } catch (error) {
                    outputChannel.appendLine(`Failed to clean up existing temp file ${file}: ${error}`);
                }
            }
            
            outputChannel.appendLine(`Cleaned up ${cleanedCount} existing temp files`);
        } else {
            outputChannel.appendLine('No existing temp files found to clean up');
        }
    } catch (error) {
        outputChannel.appendLine(`Error during temp file cleanup: ${error}`);
    }
}

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    // Create an output channel for debugging
    const outputChannel = vscode.window.createOutputChannel('Fab Inspector Debug');
    
    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "fab-inspector" is now active!');
    outputChannel.appendLine('Congratulations, your extension "fab-inspector" is now active!');

    // Clean up any existing temporary files from previous sessions
    cleanupExistingTempFiles(outputChannel);

    // Register the command to run Fab Inspector
    const runFabInspectorCommand = vscode.commands.registerCommand('fab-inspector.inspect', async () => {
        // Get the first workspace folder
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            vscode.window.showErrorMessage('No workspace folder is open.');
            return;
        }
        const fabricItem = workspaceFolder.uri.fsPath;

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
            placeHolder: 'Enter the output formats (e.g., json,html,console,ADO,GitHub)',
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
            const rulesPath = path.join(workspaceFolder.uri.fsPath, "fab-inspector-rules", rulesFile);
            await runFabInspector(context, fabricItem, rulesPath, formats);
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

    // Register the command to run a single rule
    const runRuleCommand = vscode.commands.registerCommand('fab-inspector.runRule', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor found.');
            return;
        }

        const selection = editor.selection;
        if (selection.isEmpty) {
            vscode.window.showErrorMessage('Please select a rule ID or rule JSON to run.');
            return;
        }

        const selectedText = editor.document.getText(selection).trim();
        let parsedRule;

        // Try to parse as JSON first (complete rule selection)
        try {
            parsedRule = JSON.parse(selectedText);
            console.log('Selected text parsed as complete rule JSON');
        } catch (error) {
            // If not valid JSON, treat as rule ID and search for the rule
            console.log('Selected text not valid JSON, treating as rule ID:', selectedText);
            outputChannel.appendLine(`Selected text not valid JSON, treating as rule ID: ${selectedText}`);
            
            // Remove quotes if the selected text is a quoted string
            const ruleId = selectedText.replace(/^["']|["']$/g, '');
            
            try {
                parsedRule = findRuleById(editor.document.getText(), ruleId);
                if (!parsedRule) {
                    vscode.window.showErrorMessage(`No rule found with ID: "${ruleId}". Please ensure the rule exists in the current document.`);
                    return;
                }
                console.log('Found rule by ID:', ruleId);
                outputChannel.appendLine(`Found rule by ID: ${ruleId}`);
            } catch (findError) {
                vscode.window.showErrorMessage(`Error finding rule: ${findError}`);
                return;
            }
        }

        // Get the workspace folder
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            vscode.window.showErrorMessage('No workspace folder is open.');
            return;
        }

        const formats = 'GitHub'; // Default to GitHub output for clean output

        if (!formats) {
            return;
        }

        let tempRulesFile: string = '';

        try {
            // Create temporary rules file
            const tempDir = os.tmpdir();
            tempRulesFile = path.join(tempDir, `fab-inspector-temp-rule-${Date.now()}.json`);

            // Wrap the rule in a rules array
            const rulesWrapper = {
                "rules": [parsedRule]
            };

            // Write temporary rules file
            fs.writeFileSync(tempRulesFile, JSON.stringify(rulesWrapper, null, 2));

            // Verify the file was created
            if (!fs.existsSync(tempRulesFile)) {
                throw new Error('Failed to create temporary rules file');
            }

            console.log(`Created temporary rules file: ${tempRulesFile}`);
            outputChannel.appendLine(`Created temporary rules file: ${tempRulesFile}`);

            // Run Fab Inspector with the temporary rules file and cleanup callback
            await runFabInspector(context, workspaceFolder.uri.fsPath, tempRulesFile, formats, () => {
                // Cleanup function to be called after the process completes
                outputChannel.appendLine(`Cleanup callback called for: ${tempRulesFile}`);
                if (tempRulesFile && fs.existsSync(tempRulesFile)) {
                    try {
                        fs.unlinkSync(tempRulesFile);
                        console.log(`Cleaned up temporary file: ${tempRulesFile}`);
                        outputChannel.appendLine(`Successfully cleaned up temporary file: ${tempRulesFile}`);
                    } catch (cleanupError) {
                        console.warn(`Failed to cleanup temporary file: ${cleanupError}`);
                        outputChannel.appendLine(`Failed to cleanup temporary file: ${cleanupError}`);
                    }
                } else {
                    outputChannel.appendLine(`Temporary file already deleted or doesn't exist: ${tempRulesFile}`);
                }
            });

        } catch (error) {
            vscode.window.showErrorMessage(`Error running rule: ${error}`);
            outputChannel.appendLine(`Error running rule: ${error}`);
            // Clean up on error
            if (tempRulesFile && fs.existsSync(tempRulesFile)) {
                try {
                    fs.unlinkSync(tempRulesFile);
                    console.log(`Cleaned up temporary file after error: ${tempRulesFile}`);
                    outputChannel.appendLine(`Cleaned up temporary file after error: ${tempRulesFile}`);
                } catch (cleanupError) {
                    console.warn(`Failed to cleanup temporary file after error: ${cleanupError}`);
                    outputChannel.appendLine(`Failed to cleanup temporary file after error: ${cleanupError}`);
                }
            }
        }
    });

    context.subscriptions.push(runFabInspectorCommand, wrapWithLogCommand, unwrapLogCommand, runRuleCommand);
}

async function runFabInspector(context: vscode.ExtensionContext, fabricItemPath: string, rulesPath: string, formats: string, cleanup?: () => void) {
    // Validate rules file exists (only for non-temporary files)
    if (!rulesPath.includes('fab-inspector-temp-rule') && !fs.existsSync(rulesPath)) {
        const rulesDir = path.dirname(rulesPath);
        const rulesFile = path.basename(rulesPath);

        if (!fs.existsSync(rulesDir)) {
            vscode.window.showErrorMessage('The "fab-inspector-rules" folder was not found in the workspace. Please create this folder and add your rules files.');
        } else {
            vscode.window.showErrorMessage(`The rules file "${rulesFile}" was not found in the "fab-inspector-rules" folder.`);
        }
        cleanup?.();
        return;
    }

    // Check if bundled executable is available
    const executablePath = getFabInspectorExecutablePath(context);
    const hasBundledExecutable = await checkBundledExecutable(executablePath);

    if (!hasBundledExecutable) {
        vscode.window.showErrorMessage('Fab Inspector executable not found. Please ensure the extension is properly installed with the bundled executable.');
        cleanup?.();
        return;
    }
    
    await runNativeCommand(executablePath, fabricItemPath, rulesPath, formats, cleanup, false);
}

async function runNativeCommand(executablePath: string, fabricItemPath: string, rulesPath: string, formats: string, cleanup?: () => void, isSingleRule: boolean = false) {
    const rulesFileName = path.basename(rulesPath);

    // Create output channel for full inspection mode
    let channel: vscode.OutputChannel | undefined;
    if (!isSingleRule) {
        vscode.window.showInformationMessage(`Running Fab Inspector with rules file "${rulesFileName}"...`);
        channel = vscode.window.createOutputChannel('Fab Inspector');
        channel.clear();
        channel.show();
        channel.appendLine('Starting Fab Inspector...');
        channel.appendLine(`Executable: ${executablePath}`);
        channel.appendLine(`Fabric Item Path: ${fabricItemPath}`);
        channel.appendLine(`Rules File: ${rulesPath}`);
        channel.appendLine(`Formats: ${formats}`);
        channel.appendLine('');
    }

    // Build command arguments
    const args = [
        '-fabricitem', fabricItemPath,
        '-rules', rulesPath,
        '-formats', formats
    ];

    console.log(`Running command: ${executablePath} ${args.join(' ')}`);
    if (isSingleRule) {
        console.log(`Temp rules file exists: ${fs.existsSync(rulesPath)}`);
        console.log(`Temp rules file content: ${fs.readFileSync(rulesPath, 'utf8')}`);
    }

    // Set working directory to the bin folder so the executable can find its Files folder
    const binDirectory = path.dirname(executablePath);

    return new Promise<void>((resolve, reject) => {
        let isResolved = false;
        
        // Add a timeout to prevent hanging indefinitely
        const timeout = setTimeout(() => {
            if (!isResolved) {
                isResolved = true;
                console.log('Process timed out, calling cleanup...');
                if (cleanup) {
                    cleanup();
                }
                reject(new Error('Process timed out after 5 minutes'));
            }
        }, 5 * 60 * 1000); // 5 minute timeout

        const cleanupAndResolve = (error?: Error) => {
            if (isResolved) {
                return;
            }
            isResolved = true;
            
            clearTimeout(timeout);
            console.log('Cleaning up and resolving...');
            
            // Call cleanup
            if (cleanup) {
                console.log('Calling cleanup function...');
                cleanup();
            } else {
                console.log('No cleanup function provided');
            }
            
            if (error) {
                reject(error);
            } else {
                resolve();
            }
        };

        // Use spawn for real-time output streaming
        const process = spawn(executablePath, args, {
            cwd: binDirectory // Set working directory
        });

        let stdout = '';
        let stderr = '';

        // Stream stdout in real-time
        process.stdout.on('data', (data) => {
            const output = data.toString();
            stdout += output;
            if (channel) {
                channel.append(output);
            }
        });

        // Stream stderr in real-time
        process.stderr.on('data', (data) => {
            const output = data.toString();
            stderr += output;
            if (channel) {
                channel.append(output);
            }
        });

        // Handle process completion
        process.on('close', (code) => {
            console.log(`Process closed with code: ${code}`);
            
            if (code === 0) {
                // Success
                const successMessage = isSingleRule ? 'Fab Inspector rule completed successfully!' : 'Fab Inspector completed successfully!';
                vscode.window.showInformationMessage(successMessage);

                if (channel) {
                    channel.appendLine('\nFab Inspector completed successfully.');
                }

                // Show output in a new document for single rule with console output
                if (isSingleRule && stdout && formats.includes('console')) {
                    vscode.workspace.openTextDocument({
                        content: stdout,
                        language: 'plaintext'
                    }).then(doc => {
                        vscode.window.showTextDocument(doc);
                    });
                }
                
                cleanupAndResolve();
            } else {
                // Error
                const errorMessage = stderr || `Process exited with code ${code}`;
                const failMessage = isSingleRule ? `Fab Inspector rule failed: ${errorMessage}` : `Fab Inspector failed with exit code: ${code}`;
                vscode.window.showErrorMessage(failMessage);

                if (channel) {
                    channel.appendLine(`\nFab Inspector failed with exit code: ${code}`);
                }

                console.error('Fab Inspector stderr:', stderr);
                console.error('Fab Inspector stdout:', stdout);
                
                cleanupAndResolve(new Error(errorMessage));
            }
        });

        // Handle process exit (different from close)
        process.on('exit', (code) => {
            console.log(`Process exited with code: ${code}`);
            if (!isResolved) {
                cleanupAndResolve();
            }
        });

        // Handle process errors
        process.on('error', (error) => {
            const errorMsg = `Fab Inspector execution failed: ${error.message}. Please ensure the executable has proper permissions and dependencies are installed.`;
            vscode.window.showErrorMessage(errorMsg);

            if (channel) {
                channel.appendLine(`\nError running Fab Inspector: ${error.message}`);
            }

            console.error('Process error:', error);
            cleanupAndResolve(error);
        });
    });
}

// This method is called when your extension is deactivated
export function deactivate() {
    // Clean up any remaining temporary files when extension is deactivated
    try {
        const tempDir = os.tmpdir();
        const files = fs.readdirSync(tempDir);
        const fabTempFiles = files.filter(file => file.startsWith('fab-inspector-temp-rule-'));
        
        for (const file of fabTempFiles) {
            try {
                const filePath = path.join(tempDir, file);
                fs.unlinkSync(filePath);
                console.log(`Cleaned up temp file on deactivation: ${file}`);
            } catch (error) {
                console.warn(`Failed to clean up temp file on deactivation ${file}: ${error}`);
            }
        }
    } catch (error) {
        console.warn(`Error during deactivation cleanup: ${error}`);
    }
}
