import * as vscode from 'vscode';
import * as path from 'path';
import { runFabInspector } from '../core/fabInspector';
import { SecurityUtils } from '../utils/securityUtils';

/**
 * Register and return the inspect with current rules file command
 */
export function registerInspectWithCurrentRulesFileCommand(context: vscode.ExtensionContext): vscode.Disposable {
    return vscode.commands.registerCommand('fab-inspector.inspectWithCurrentRulesFile', async (uri?: vscode.Uri) => {
        // Get the file URI - either from context menu or active editor
        let fileUri = uri;
        if (!fileUri) {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showErrorMessage('No file is currently open.');
                return;
            }
            fileUri = editor.document.uri;
        }

        // Validate that it's a JSON file
        if (!fileUri.fsPath.toLowerCase().endsWith('.json')) {
            vscode.window.showErrorMessage('The selected file must be a JSON rules file.');
            return;
        }

        // Get the workspace folder from the file's location
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(fileUri);
        if (!workspaceFolder) {
            vscode.window.showErrorMessage('The file must be within a workspace folder.');
            return;
        }

        // Validate that the file is within the configured rules folder
        const rulesFolderName = SecurityUtils.getConfiguredRulesFolderName();
        const relativePath = path.relative(workspaceFolder.uri.fsPath, fileUri.fsPath);
        const pathParts = relativePath.split(path.sep);
        
        if (pathParts.length < 2 || pathParts[0] !== rulesFolderName) {
            vscode.window.showErrorMessage(`The rules file must be located within the "${rulesFolderName}" folder in your workspace.`);
            return;
        }

        const fabricItemPath = workspaceFolder.uri.fsPath;
        const rulesPath = fileUri.fsPath;
        const formats = 'Console';

        try {
            // Show info message about what's happening
            const fileName = path.basename(rulesPath);
            vscode.window.showInformationMessage(`Running Fab Inspector on "${fileName}"...`);

            // Run Fab Inspector with the current file
            await runFabInspector(context, fabricItemPath, rulesPath, formats);
        } catch (error) {
            vscode.window.showErrorMessage(`Error running Fab Inspector: ${error}`);
        }
    });
}
