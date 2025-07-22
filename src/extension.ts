// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { exec, spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

// Global constants
const DOCKER_IMAGE_NAME = 'ghcr.io/natvang/fab-inspector:latest';

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
            placeHolder: 'Enter the name of the rules file within your fab-inspector-rules folder (e.g., rules.json)',
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
                placeHolder: 'Enter the output formats (e.g., json,html,console)',
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
    const rulesPath = path.join(workspaceFolder.uri.fsPath, "fab-inspector-rules", rulesFile);
    const rulesDir = path.join(workspaceFolder.uri.fsPath, "fab-inspector-rules");

    // Check if the fab-inspector-rules folder exists
    if (!fs.existsSync(rulesDir)) {
        vscode.window.showErrorMessage('The "fab-inspector-rules" folder was not found in the workspace. Please create this folder and add your rules files.');
        return;
    }

    // Check if the specific rules file exists
    if (!fs.existsSync(rulesPath)) {
        vscode.window.showErrorMessage(`The rules file "${rulesFile}" was not found in the "fab-inspector-rules" folder.`);
        return;
    }

    // Check if the image needs to be pulled
    checkAndPullDockerImage(() => {
        runDockerCommand();
    });

    function checkAndPullDockerImage(callback: () => void) {
        // First, check if the image exists locally
        exec(`docker images -q ${DOCKER_IMAGE_NAME}`, (error, stdout, stderr) => {
            if (error || !stdout.trim()) {
                // Image doesn't exist locally, pull it
                vscode.window.showInformationMessage('Fab Inspector Docker image not found locally. Pulling...');
                pullImage(callback);
            } else {
                // Image exists locally, check if we need to update it
                vscode.window.showInformationMessage('Checking for Fab Inspector image updates...');

                // Use docker pull with --platform to check for updates more efficiently
                exec(`docker pull ${DOCKER_IMAGE_NAME}`, (pullError, pullStdout, pullStderr) => {
                    if (pullError) {
                        vscode.window.showWarningMessage('Could not check for Fab Inspector image updates. Using local image.');
                        callback();
                    } else {
                        // Check the pull output to see if image was updated
                        if (pullStdout.includes('Image is up to date')) {
                            vscode.window.showInformationMessage('Fab Inspector Docker image is already up to date.');
                        } else if (pullStdout.includes('Downloaded newer image') || pullStdout.includes('Status: Downloaded newer image')) {
                            vscode.window.showInformationMessage('Fab Inspector Docker image updated successfully.');
                        } else {
                            vscode.window.showInformationMessage('Using local Fab Inspector Docker image.');
                        }
                        callback();
                    }
                });
            }
        });
    }

    function pullImage(callback: () => void) {
        exec(`docker pull ${DOCKER_IMAGE_NAME}`, (error, stdout, stderr) => {
            if (error) {
                vscode.window.showErrorMessage(`Fab Inspector Docker pull failed: ${stderr || error.message}`);
                return;
            }
            vscode.window.showInformationMessage('Fab Inspector Docker image pulled successfully.');
            callback();
        });
    }

    function runDockerCommand() {
        // Build the Docker command
    const rulesDir = path.dirname(rulesPath);
    const rulesFileName = path.basename(rulesPath);

    const dockerCmd = [
        'docker run --rm',
        `-v "${fabricItemPath}:/data/fabricitem:ro"`,
        `-v "${rulesDir}:/data/rules:ro"`,
        DOCKER_IMAGE_NAME,
        '-fabricitem', '/data/fabricitem',
        '-rules', `/data/rules/${rulesFileName}`,
        '-formats', formats
    ].join(' ');

    // Inform user that Fab Inspector is starting
    vscode.window.showInformationMessage(`Running Fab Inspector with rules file "${rulesFileName}"... This may take a few minutes.`);

    // Create output channel for real-time streaming
    const channel = vscode.window.createOutputChannel('Fab Inspector');
    channel.clear();
    channel.show();
    channel.appendLine('Starting Fab Inspector...');
    channel.appendLine(`Command: ${dockerCmd}`);
    channel.appendLine('');

    // Use spawn for real-time output streaming
    const dockerProcess = spawn('docker', [
        'run', '--rm',
        '-v', `${fabricItemPath}:/data/fabricitem`,
        '-v', `${rulesDir}:/data/rules`,
        DOCKER_IMAGE_NAME,
        '-fabricitem', '/data/fabricitem',
        '-rules', `/data/rules/${rulesFileName}`,
        '-formats', formats
    ], {
        shell: true // Use shell for Windows compatibility
    });

    // Stream stdout in real-time
    dockerProcess.stdout.on('data', (data) => {
        channel.append(data.toString());
    });

    // Stream stderr in real-time
    dockerProcess.stderr.on('data', (data) => {
        channel.append(data.toString());
    });

    // Handle process completion
    dockerProcess.on('close', (code) => {
        if (code === 0) {
            channel.appendLine('\nFab Inspector completed successfully.');
            vscode.window.showInformationMessage('Fab Inspector completed successfully!');
        } else {
            channel.appendLine(`\nFab Inspector failed with exit code: ${code}`);
            vscode.window.showErrorMessage(`Fab Inspector failed with exit code: ${code}`);
        }
    });

    // Handle process errors
    dockerProcess.on('error', (error) => {
        channel.appendLine(`\nError running Fab Inspector: ${error.message}`);
        vscode.window.showErrorMessage(`Docker run failed: ${error.message}`);
    });
    }
}

// This method is called when your extension is deactivated
export function deactivate() { }
