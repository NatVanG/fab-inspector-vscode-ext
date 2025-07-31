import * as vscode from 'vscode';
import * as path from 'path';
import { runFabInspector } from '../core/fabInspector';
import { SecurityUtils } from '../utils/securityUtils';

/**
 * Register and return the main Fab Inspector command
 */
export function registerInspectCommand(context: vscode.ExtensionContext): vscode.Disposable {
    return vscode.commands.registerCommand('fab-inspector.inspect', async () => {
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
                try {
                    SecurityUtils.validateRulesFileName(value);
                    return null;
                } catch (error) {
                    return error instanceof Error ? error.message : 'Invalid file name format';
                }
            }
        });

        let formats = await vscode.window.showInputBox({
            placeHolder: 'Enter the output format: Console (default), JSON, HTML, GitHub, ADO.',
            prompt: 'Output Formats',
            validateInput: (value) => {
            const allowedFormats = ['JSON', 'HTML', 'Console', 'GitHub', 'ADO'];
            if (!value || value.trim() === '') {
                return null; // Allow empty, will default to Console
            }
            const input = value.trim().toLowerCase();
            if (!allowedFormats.map(f => f.toLowerCase()).includes(input)) {
                return `Format must be one of: ${allowedFormats.join(', ')}`;
            }
            return null;
            }
        });
        if (!formats || formats.trim() === '') {
            formats = 'Console';
        }

        // Run Fab Inspector with the provided inputs
        if (rulesFile && formats) {
            const rulesPath = path.join(workspaceFolder.uri.fsPath, "fab-inspector-rules", rulesFile);
            await runFabInspector(context, fabricItem, rulesPath, formats);
        } else {
            vscode.window.showErrorMessage('All inputs (rules file and formats) are required.');
        }
    });
}
