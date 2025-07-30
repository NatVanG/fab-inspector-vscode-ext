import * as vscode from 'vscode';

class OutputChannelManager {
    private static instance: OutputChannelManager;
    private outputChannel: vscode.OutputChannel | undefined;

    private constructor() {}

    public static getInstance(): OutputChannelManager {
        if (!OutputChannelManager.instance) {
            console.log('[OutputChannelManager] Creating new singleton instance');
            OutputChannelManager.instance = new OutputChannelManager();
        } else {
            console.log('[OutputChannelManager] Reusing existing singleton instance');
        }
        return OutputChannelManager.instance;
    }

    public getOutputChannel(): vscode.OutputChannel {
        if (!this.outputChannel) {
            console.log('[OutputChannelManager] Creating new output channel');
            this.outputChannel = vscode.window.createOutputChannel('Fab Inspector');
        } else {
            console.log('[OutputChannelManager] Reusing existing output channel');
        }
        return this.outputChannel;
    }

    public dispose(): void {
        if (this.outputChannel) {
            console.log('[OutputChannelManager] Disposing output channel');
            this.outputChannel.dispose();
            this.outputChannel = undefined;
        } else {
            console.log('[OutputChannelManager] No output channel to dispose');
        }
    }

    public static reset(): void {
        console.log('[OutputChannelManager] Resetting singleton instance');
        if ((OutputChannelManager as any).instance) {
            ((OutputChannelManager as any).instance as OutputChannelManager).dispose();
            (OutputChannelManager as any).instance = undefined;
        }
    }
}

export const getOutputChannel = (): vscode.OutputChannel => {
    return OutputChannelManager.getInstance().getOutputChannel();
};

export const disposeOutputChannel = (): void => {
    OutputChannelManager.getInstance().dispose();
};

export const resetOutputChannelManager = (): void => {
    OutputChannelManager.reset();
};
