// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { cleanupExistingTempFiles, deactivateCleanup } from './utils/fileUtils';
import { registerInspectCommand } from './commands/inspectCommand';
import { registerInspectWithCurrentRulesFileCommand } from './commands/inspectWithCurrentRulesFileCommand';
import { registerWrapWithLogCommand, registerUnwrapLogCommand, registerCreateNewRulesFileCommand } from './commands/jsonCommands';
import { registerRunRuleCommand } from './commands/runRuleCommand';
import { registerCliCommands } from './commands/cliCommands';
import { getOutputChannel, disposeOutputChannel, resetOutputChannelManager } from './utils/outputChannel';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    // Reset the output channel manager to ensure we start fresh
    resetOutputChannelManager();

    // Get the singleton output channel
    const outputChannel = getOutputChannel();
    
    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "fab-inspector" is now active!');
    outputChannel.appendLine('Congratulations, your extension "fab-inspector" is now active!');

    // Clean up any existing temporary files from previous sessions
    cleanupExistingTempFiles(outputChannel);

    // Register all commands
    const runFabInspectorCommand = registerInspectCommand(context);
    const inspectWithCurrentRulesFileCommand = registerInspectWithCurrentRulesFileCommand(context);
    const wrapWithLogCommand = registerWrapWithLogCommand();
    const unwrapLogCommand = registerUnwrapLogCommand();
    const createNewRulesFileCommand = registerCreateNewRulesFileCommand();
    const runRuleCommand = registerRunRuleCommand(context, outputChannel);
    const cliCommands = registerCliCommands(context);

    context.subscriptions.push(
        runFabInspectorCommand, 
        inspectWithCurrentRulesFileCommand, 
        wrapWithLogCommand, 
        unwrapLogCommand, 
        createNewRulesFileCommand,
        runRuleCommand,
        ...cliCommands
    );
}

// This method is called when your extension is deactivated
export function deactivate() {
    deactivateCleanup();
    disposeOutputChannel();
}
