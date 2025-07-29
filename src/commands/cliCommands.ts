import * as vscode from 'vscode';
import { getCliManager } from '../utils/fileUtils';

/**
 * Register CLI management commands
 */
export function registerCliCommands(context: vscode.ExtensionContext): vscode.Disposable[] {
    const disposables: vscode.Disposable[] = [];

    // Update CLI command
    const updateCliCommand = vscode.commands.registerCommand('fab-inspector.updateCli', async () => {
        try {
            const cliManager = getCliManager(context);
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: "Updating Fab Inspector CLI...",
                cancellable: false
            }, async () => {
                await cliManager.forceUpdate();
            });
            
            vscode.window.showInformationMessage('Fab Inspector CLI updated successfully!');
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to update CLI: ${error}`);
        }
    });

    // Show CLI info command
    const cliInfoCommand = vscode.commands.registerCommand('fab-inspector.cliInfo', async () => {
        try {
            const cliManager = getCliManager(context);
            const info = cliManager.getCliInfo();
            
            const config = vscode.workspace.getConfiguration('fabInspector');
            const autoUpdate = config.get<boolean>('autoUpdateCli', true);
            const updateInterval = config.get<number>('cliUpdateInterval', 24);

            let message = `**Fab Inspector CLI Information**\n\n`;
            message += `**Status:** ${info.exists ? '✅ Available' : '❌ Not Available'}\n`;
            message += `**Path:** ${info.path}\n`;
            
            if (info.exists && info.lastModified) {
                message += `**Last Modified:** ${info.lastModified.toLocaleString()}\n`;
                const hoursOld = Math.round((Date.now() - info.lastModified.getTime()) / (1000 * 60 * 60));
                message += `**Age:** ${hoursOld} hours old\n`;
            }
            
            message += `\n**Settings:**\n`;
            message += `**Auto Update:** ${autoUpdate ? 'Enabled' : 'Disabled'}\n`;
            message += `**Update Interval:** ${updateInterval} hours\n`;
            
            message += `\n**Actions:**\n`;
            message += `• Use "Fab Inspector: Update CLI" to force update\n`;
            message += `• Configure settings via VS Code Settings (search "Fab Inspector")`;

            const panel = vscode.window.createWebviewPanel(
                'fabInspectorCliInfo',
                'Fab Inspector CLI Info',
                vscode.ViewColumn.One,
                {}
            );

            panel.webview.html = getCliInfoHtml(message);
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to get CLI info: ${error}`);
        }
    });

    disposables.push(updateCliCommand, cliInfoCommand);
    return disposables;
}

/**
 * Generate HTML for CLI info panel
 */
function getCliInfoHtml(content: string): string {
    const htmlContent = content
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n/g, '<br>');

    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Fab Inspector CLI Info</title>
        <style>
            body {
                font-family: var(--vscode-font-family);
                font-size: var(--vscode-font-size);
                color: var(--vscode-foreground);
                background-color: var(--vscode-editor-background);
                padding: 20px;
                line-height: 1.6;
            }
            .content {
                max-width: 800px;
                margin: 0 auto;
            }
            .status-ok {
                color: var(--vscode-testing-iconPassed);
            }
            .status-error {
                color: var(--vscode-testing-iconFailed);
            }
        </style>
    </head>
    <body>
        <div class="content">
            ${htmlContent}
        </div>
    </body>
    </html>
    `;
}
