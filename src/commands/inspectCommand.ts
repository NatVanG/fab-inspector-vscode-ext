import * as vscode from 'vscode';
import * as path from 'path';
import { runFabInspector } from '../core/fabInspector';

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
                if (!value.endsWith('.json')) {
                    return 'Rules file must be a JSON file.';
                }
                return null;
            }
        });

        let formats = await vscode.window.showInputBox({
            placeHolder: 'Enter the output format (e.g. JSON, HTML, Console, GitHub, ADO).',
            prompt: 'Output Formats'
        });

        // Check if formats include JSON, HTML, or Console; if not, default to Console
        const allowedFormats = ['JSON', 'HTML', 'Console', 'GitHub', 'ADO'];
        if (!formats || !allowedFormats.some(fmt => (formats ?? '').toUpperCase().includes(fmt))) {
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
