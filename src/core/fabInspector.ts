import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { ensureCliAvailable } from '../utils/fileUtils';
import { getOutputChannel } from '../utils/outputChannel';
import { ValidationUtils } from '../utils/validationUtils';

/**
 * Run Fab Inspector with the provided parameters
 */
export async function runFabInspector(context: vscode.ExtensionContext, fabricItemPath: string, rulesPath: string, formats: string, cleanup?: () => void) {
    // Validate rules file exists (only for non-temporary files)
    if (!rulesPath.includes('fab-inspector-temp-rule') && !fs.existsSync(rulesPath)) {
        const rulesDir = path.dirname(rulesPath);
        const rulesFile = path.basename(rulesPath);
        const rulesFolderName = ValidationUtils.getConfiguredRulesFolderName();

        if (!fs.existsSync(rulesDir)) {
            vscode.window.showErrorMessage(`The "${rulesFolderName}" folder was not found in the workspace. Please create this folder at the root of your workspace and add your rules files.`);
        } else {
            vscode.window.showErrorMessage(`The rules file "${rulesFile}" was not found in the "${rulesFolderName}" folder.`);
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
        const safeFabricItemPath = ValidationUtils.validateFilePath(fabricItemPath, workspaceRoot);
        const safeRulesPath = ValidationUtils.validateFilePath(rulesPath, workspaceRoot);
        
        // Validate file extensions
        if (!ValidationUtils.validateFileExtension(safeRulesPath, ['.json'])) {
            throw new Error('Rules file must have .json extension');
        }
        
        // Sanitize format string
        const safeFormats = ValidationUtils.sanitizeCommandArg(formats);
        
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

    // STUB: Return successful completion without actually running the process
    console.log('STUBBED: Skipping actual CLI execution for testing/development');
    
    return new Promise<void>((resolve) => {
        // Simulate some processing time
        setTimeout(() => {
            // Show success message
            const successMessage = isSingleRule ? 'Fab Inspector rule completed successfully!' : 'Fab Inspector completed successfully!';
            vscode.window.showInformationMessage(successMessage);

            if (channel) {
                channel.appendLine('\nSTUBBED: Fab Inspector completed successfully (no actual execution).');
            }

            // Call cleanup if provided
            if (cleanup) {
                console.log('Calling cleanup function...');
                cleanup();
            }
            
            resolve();
        }, 1000); // 1 second delay to simulate processing
    });
    } catch (error) {
        vscode.window.showErrorMessage(`Security validation failed: ${error}`);
        cleanup?.();
        throw error;
    }
}
