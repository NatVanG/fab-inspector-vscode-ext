// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { exec } from 'child_process';
import * as path from 'path';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "fab-inspector" is now active!');

    // Register the command to run Fab Inspector Docker
    const runFabInspectorCommand = vscode.commands.registerCommand('fab-inspector.inspect', async () => {
        // Prompt user for rules file, output directory, and formats
        const rulesFile = await vscode.window.showInputBox({
            placeHolder: 'Enter the path to the rules file (e.g., rules.json)',
                prompt: 'Rules File Path',
                validateInput: (value) => {
                    if (!value) {
                        return 'Rules file path cannot be empty.';
                    }
                    if (!value.endsWith('.json')) {
                        return 'Rules file must be a JSON file.';
                    }
                    return null; // No error
                }
            });

            const formats = await vscode.window.showInputBox({
                placeHolder: 'Enter the output formats (e.g., json,html)',
                prompt: 'Output Formats',
                validateInput: (value) => {
                    if (!value) {
                        return 'Output formats cannot be empty.';
                    }
                    return null; // No error
                }
            });

            // Run the Docker command with the provided inputs
            if (rulesFile && formats) {
                runFabInspectorDocker(rulesFile, formats);
            } else {
                vscode.window.showErrorMessage('All inputs (rules file and formats) are required.');
            }
        });
        context.subscriptions.push(runFabInspectorCommand);
    };

function runFabInspectorDocker(rulesFile: string, formats: string) {
    // Get the first workspace folder (or prompt user if multiple)
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
        vscode.window.showErrorMessage('No workspace folder is open.');
        return;
    }

    // Construct paths based on the workspace folder
    const fabricItemPath = workspaceFolder.uri.fsPath; // Root folder
    const rulesPath = path.join(workspaceFolder.uri.fsPath, "rules", rulesFile);

    const dockerPull = 'docker pull ghcr.io/natvang/fab-inspector:latest';

    exec(dockerPull, (error, stdout, stderr) => {
        if (error) {
            vscode.window.showErrorMessage(`Docker pull failed: ${stderr || error.message}`);
            return;
        }
        vscode.window.showInformationMessage('Docker image pulled successfully. Running Fab Inspector...');
    });

    // Build the Docker command
    const rulesDir = path.dirname(rulesPath);
    const rulesFileName = path.basename(rulesPath);

    // Convert Windows paths to Docker-compatible format
    function toDockerPath(p: string) {
        return p.replace(/\\/g, '/').replace(/^([A-Za-z]):/, (match, drive) => `/${drive.toLowerCase()}`);
    }

    const dockerFabricItemPath = toDockerPath(fabricItemPath);
    const dockerRulesDir = toDockerPath(rulesDir);

    const dockerCmd = [
        'docker run --rm',
        `-v "${dockerFabricItemPath}:/data/fabricitem"`,
        `-v "${dockerRulesDir}:/data/rules"`,
        'ghcr.io/natvang/fab-inspector:latest',
        '-fabricitem', '/data/fabricitem',
        '-rules', `/data/rules/${rulesFileName}`,
        '-formats', formats
    ].join(' ');



    exec(dockerCmd, (error, stdout, stderr) => {
        if (error) {
            vscode.window.showErrorMessage(`Docker run failed: ${stderr || error.message}`);
            return;
        }
        vscode.window.showInformationMessage('Fab Inspector Docker run complete.');
        const channel = vscode.window.createOutputChannel('Fab Inspector');
        channel.append(stdout);
        channel.show();
    });
}

// This method is called when your extension is deactivated
export function deactivate() { }
