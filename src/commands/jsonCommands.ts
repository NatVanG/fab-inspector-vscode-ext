import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { ValidationUtils } from '../utils/validationUtils';

/**
 * Register and return the wrap with log command
 */
export function registerWrapWithLogCommand(): vscode.Disposable {
    return vscode.commands.registerCommand('fab-inspector.wrapWithLog', async () => {
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
}

/**
 * Register and return the unwrap log command
 */
export function registerUnwrapLogCommand(): vscode.Disposable {
    return vscode.commands.registerCommand('fab-inspector.unwrapLog', async () => {
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
}

/**
 * Register and return the create new rules file command
 */
export function registerCreateNewRulesFileCommand(): vscode.Disposable {
    return vscode.commands.registerCommand('fab-inspector.createNewRulesFile', async () => {
        // Get the current workspace folder
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            vscode.window.showErrorMessage('No workspace folder is open. Please open a workspace to create a rules file.');
            return;
        }

        // Get the configured rules folder name
        const rulesFolderName = ValidationUtils.getConfiguredRulesFolderName();
        const rulesFolderPath = path.join(workspaceFolder.uri.fsPath, rulesFolderName);

        // Check if the rules folder exists, create it if it doesn't
        if (!fs.existsSync(rulesFolderPath)) {
            try {
                fs.mkdirSync(rulesFolderPath, { recursive: true });
                vscode.window.showInformationMessage(`Created "${rulesFolderName}" folder in workspace.`);
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to create "${rulesFolderName}" folder: ${error}`);
                return;
            }
        }

        // Create the new rules file path
        const newRulesFilePath = path.join(rulesFolderPath, 'new-rules.json');

        // Check if the file already exists
        if (fs.existsSync(newRulesFilePath)) {
            const overwrite = await vscode.window.showWarningMessage(
                'File "new-rules.json" already exists. Do you want to overwrite it?',
                'Yes', 'No'
            );
            if (overwrite !== 'Yes') {
                return;
            }
        }

        // Create the initial JSON content
        const initialContent = {
            "rules": [{
                "id": "RULE_TEMPLATE",
                "name": "Rule Template",
                "description": "Rule template",
                "disabled": true,
                "logType": "warning",
                "test": [
                    {"==": [1,1]},
                    true
                ]
            }]
        };

        try {
            // Write the file with proper formatting
            const formattedJson = JSON.stringify(initialContent, null, 2);
            fs.writeFileSync(newRulesFilePath, formattedJson, 'utf8');

            // Open the new file in the editor
            const document = await vscode.workspace.openTextDocument(newRulesFilePath);
            await vscode.window.showTextDocument(document);

            vscode.window.showInformationMessage(`Created new rules file: ${path.basename(newRulesFilePath)}`);
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to create rules file: ${error}`);
        }
    });
}
