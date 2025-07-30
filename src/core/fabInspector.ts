import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { spawn } from 'child_process';
import { ensureCliAvailable } from '../utils/fileUtils';
import { getOutputChannel } from '../utils/outputChannel';
import { SecurityUtils } from '../utils/securityUtils';

/**
 * Run Fab Inspector with the provided parameters
 */
export async function runFabInspector(context: vscode.ExtensionContext, fabricItemPath: string, rulesPath: string, formats: string, cleanup?: () => void) {
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

    try {
        // Ensure CLI is available (download if necessary)
        const executablePath = await ensureCliAvailable(context);

        if (!fs.existsSync(executablePath)) {
            vscode.window.showErrorMessage('Fab Inspector CLI could not be downloaded or is not available. Please check your internet connection and try again.');
            cleanup?.();
            return;
        }

        await runNativeCommand(executablePath, fabricItemPath, rulesPath, formats, cleanup, false);
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to run Fab Inspector: ${error}`);
        cleanup?.();
        return;
    }
}

/**
 * Execute the native Fab Inspector command
 */
export async function runNativeCommand(executablePath: string, fabricItemPath: string, rulesPath: string, formats: string, cleanup?: () => void, isSingleRule: boolean = false) {
    try {
        // Security validation: Validate and sanitize all inputs
        const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        
        // Validate file paths
        const safeFabricItemPath = SecurityUtils.validateFilePath(fabricItemPath, workspaceRoot);
        const safeRulesPath = SecurityUtils.validateFilePath(rulesPath, workspaceRoot);
        
        // Validate file extensions
        if (!SecurityUtils.validateFileExtension(safeRulesPath, ['.json'])) {
            throw new Error('Rules file must have .json extension');
        }
        
        // Sanitize format string
        const safeFormats = SecurityUtils.sanitizeCommandArg(formats);
        
        const rulesFileName = path.basename(safeRulesPath);

        // Use singleton output channel for full inspection mode
        let channel: vscode.OutputChannel | undefined;
        if (!isSingleRule) {
            vscode.window.showInformationMessage(`Running Fab Inspector with rules file "${rulesFileName}"...`);
            channel = getOutputChannel();
            channel.clear();
            channel.show();
            channel.appendLine('Starting Fab Inspector...');
            channel.appendLine(`Executable: ${executablePath}`);
            channel.appendLine(`Fabric Item Path: ${safeFabricItemPath}`);
            channel.appendLine(`Rules File: ${safeRulesPath}`);
            channel.appendLine(`Formats: ${safeFormats}`);
            channel.appendLine('');
        }

        // Build command arguments with validated inputs
        const args = [
            '-fabricitem', safeFabricItemPath,
            '-rules', safeRulesPath,
            '-formats', safeFormats
        ];

        console.log(`Running command: ${executablePath} ${args.join(' ')}`);
        if (isSingleRule) {
            console.log(`Temp rules file exists: ${fs.existsSync(safeRulesPath)}`);
            console.log(`Temp rules file content: ${fs.readFileSync(safeRulesPath, 'utf8')}`);
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
                const failMessage = isSingleRule ? `Fab Inspector rule failed: ${errorMessage}` : `One or more Fab Inspector test(s) failed.`;
                vscode.window.showErrorMessage(failMessage);

                if (channel) {
                    channel.appendLine(`One or more Fab Inspector test(s) failed.`);
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
    } catch (error) {
        vscode.window.showErrorMessage(`Security validation failed: ${error}`);
        cleanup?.();
        throw error;
    }
}
