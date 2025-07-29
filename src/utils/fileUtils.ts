import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as vscode from 'vscode';
import { CliManager } from '../core/cliManager';

/**
 * Get the path to the bundled executable (legacy - will be replaced by CLI manager)
 */
export function getFabInspectorExecutablePath(context: vscode.ExtensionContext): string {
    return path.join(context.extensionPath, 'bin', 'PBIRInspectorCLI.exe');
}

/**
 * Get or create CLI manager instance
 */
let cliManagerInstance: CliManager | undefined;
export function getCliManager(context: vscode.ExtensionContext): CliManager {
    if (!cliManagerInstance) {
        cliManagerInstance = new CliManager(context.extensionPath);
    }
    return cliManagerInstance;
}

/**
 * Ensure CLI is available and return its path
 */
export async function ensureCliAvailable(context: vscode.ExtensionContext): Promise<string> {
    const cliManager = getCliManager(context);
    return await cliManager.ensureCliAvailable();
}

/**
 * Check if the bundled executable and its dependencies exist (legacy - kept for compatibility)
 */
export function checkBundledExecutable(executablePath: string): Promise<boolean> {
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

/**
 * Function to clean up any existing temporary files
 */
export function cleanupExistingTempFiles(outputChannel: vscode.OutputChannel) {
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

/**
 * Clean up temporary files on extension deactivation
 */
export function deactivateCleanup() {
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
