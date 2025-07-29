import * as vscode from 'vscode';

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
