import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { findRuleById } from '../utils/jsonUtils';
import { runFabInspector } from '../core/fabInspector';

/**
 * Register and return the run rule command
 */
export function registerRunRuleCommand(context: vscode.ExtensionContext, outputChannel: vscode.OutputChannel): vscode.Disposable {
    return vscode.commands.registerCommand('fab-inspector.runRule', async () => {
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
}
