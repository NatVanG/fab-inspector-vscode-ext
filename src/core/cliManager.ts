import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import * as https from 'https';
import * as cp from 'child_process';
import { getOutputChannel } from '../utils/outputChannel';
import { ValidationUtils } from '../utils/validationUtils';

export class CliManager {
    private readonly extensionPath: string;
    private readonly cliDirectory: string;
    private readonly cliExecutable: string;
    private readonly maxRetries: number = 3;
    private readonly cacheValidityHours: number = 24;

    constructor(extensionPath: string) {
        this.extensionPath = extensionPath;
        this.cliDirectory = path.join(extensionPath, 'bin');
        this.cliExecutable = path.join(this.cliDirectory, 'PBIRInspectorCLI.exe');
    }

    /**
     * Logs a message to both console and output channel
     */
    private log(message: string): void {
        console.log(message);
        getOutputChannel().appendLine(message);
    }

    /**
     * Logs a warning to both console and output channel
     */
    private logWarn(message: string): void {
        console.warn(message);
        getOutputChannel().appendLine(`WARNING: ${message}`);
    }

    /**
     * Logs an error to both console and output channel
     */
    private logError(message: string): void {
        console.error(message);
        getOutputChannel().appendLine(`ERROR: ${message}`);
    }

    /**
     * Gets the CLI download URL based on the configured version
     */
    private getCliUrl(): string {
        return 'https://github.com/NatVanG/PBI-InspectorV2/releases/latest/download/win-x64-CLI.zip';
    }

    /**
     * Ensures .NET runtime is available using the .NET Install Tool extension
     */
    private async ensureDotNetRuntime(): Promise<string> {
        try {
            // Check if user has disabled .NET dependency checking
            const config = vscode.workspace.getConfiguration('fabInspector');
            const skipDotNetCheck = config.get<boolean>('skipDotNetCheck', false);

            if (skipDotNetCheck) {
                this.log('Skipping .NET runtime check (disabled by user configuration)');
                return 'dotnet'; // Assume dotnet command is available
            }

            // First, check if .NET 8+ is already installed locally
            this.log('Checking for existing .NET runtime...');

            const existingDotNet = await this.checkExistingDotNet();
            if (existingDotNet) {
                this.log(`Found existing .NET 8+ runtime: ${existingDotNet}`);
                return existingDotNet;
            }
            
            // Show fallback warning with manual options
            const selection = await vscode.window.showInformationMessage(
                'Please install the .NET 8+ runtime.',
                'Download .NET 8',
                'Skip .NET checks in settings',
                'Continue Anyway'
            );

            if (selection === 'Download .NET 8') {
                vscode.env.openExternal(vscode.Uri.parse('https://dotnet.microsoft.com/en-us/download/dotnet/thank-you/runtime-8.0.18-windows-x64-installer'));
            } else if (selection === 'Skip .NET checks in settings') {
                vscode.commands.executeCommand('workbench.action.openSettings', 'fabInspector');
            }

            if (selection !== 'Continue Anyway') {
                throw new Error('Cannot proceed without .NET 8.0 runtime');
            }

            // Return default dotnet command if user chose to continue anyway
            return '';

        } catch (error) {
            this.logError(`Failed to ensure .NET runtime: ${error}`);

            // Return default dotnet command if user chose to continue anyway
            return '';
        }
    }

    /**
     * Checks if .NET 8+ is already installed on the system
     */
    private async checkExistingDotNet(): Promise<string | null> {
        const errorMessage = '.NET 8+ runtime is not available or failed to start.';
        return new Promise((resolve) => {
            let dotnetProcess: cp.ChildProcess | null = null;
            try {
                dotnetProcess = cp.spawn('dotnet', ['--list-runtimes'], {
                    windowsHide: true
                });
            } catch (error) {
                this.logWarn(errorMessage);
                resolve(null);
                return;
            }

            if (!dotnetProcess || !dotnetProcess.stdout) {
                this.logWarn(errorMessage);
                resolve(null);
                return;
            }

            let output = '';
            dotnetProcess.stdout.on('data', (data) => {
                output += data.toString();
            });

            dotnetProcess.on('close', (code) => {
                if (code === 0) {
                    // Look for a line like: Microsoft.NETCore.App 8.0.0 [C:\...]
                    const lines = output.split(/\r?\n/);
                    const found = lines.find(line => {
                        const match = line.match(/^Microsoft\.NETCore\.App\s+(\d+)\.(\d+)\.(\d+)/);
                        if (match) {
                            const majorVersion = parseInt(match[1]);
                            return majorVersion >= 8;
                        }
                        return false;
                    });
                    if (found) {
                        resolve('dotnet');
                    } else {
                        this.log(errorMessage);
                        resolve(null);
                    }
                } else {
                    this.logWarn(errorMessage);
                    resolve(null);
                }
            });

            dotnetProcess.on('error', (err) => {
                this.logWarn(errorMessage);
                resolve(null);
            });
        });
    }



    /**
     * Ensures the CLI is available, downloading it if necessary
     */
    public async ensureCliAvailable(): Promise<string> {
        // Check if we're on Windows
        if (os.platform() !== 'win32') {
            throw new Error('Fab Inspector CLI is currently only supported on Windows');
        }

        // Ensure .NET 8 runtime is available using the .NET Install Tool extension
        await this.ensureDotNetRuntime();

        // Check if CLI already exists and is valid
        if (await this.isCliValid()) {
            return this.cliExecutable;
        }

        // Download CLI with progress
        await this.downloadCli();
        return this.cliExecutable;
    }

    /**
     * Checks if the CLI is valid and recent
     */
    private async isCliValid(): Promise<boolean> {
        try {
            // Check if executable exists
            if (!fs.existsSync(this.cliExecutable)) {
                return false;
            }

            // Check if Files folder exists (required dependency)
            const filesFolder = path.join(this.cliDirectory, 'Files');
            if (!fs.existsSync(filesFolder)) {
                return false;
            }

            // Check if CLI is recent (within cache validity period)
            const config = vscode.workspace.getConfiguration('fabInspector');
            const autoUpdate = config.get<boolean>('autoUpdateCli', true);

            if (autoUpdate) {
                const timestampFile = path.join(this.cliDirectory, '.download-timestamp');
                if (fs.existsSync(timestampFile)) {
                    const downloadTime = parseInt(fs.readFileSync(timestampFile, 'utf8'));
                    // Cache validity in ms (default: 24 hours, configurable via 'fabInspector.cliUpdateInterval')
                    const configCacheValidityHours = config.get<number>('cliUpdateInterval', this.cacheValidityHours);
                    const cacheValidityMs = configCacheValidityHours * 60 * 60 * 1000;
                    const cacheExpired = Date.now() - downloadTime > cacheValidityMs;

                    if (cacheExpired) {
                        this.log('CLI cache expired, will download fresh version');
                        return false;
                    }
                }
            }

            return true;
        } catch (error) {
            this.logError(`Error checking CLI validity: ${error}`);
            return false;
        }
    }

    /**
     * Forces shutdown of any running CLI processes
     */
    private async forceShutdownCli(): Promise<void> {
        try {
            const processName = 'PBIRInspectorCLI.exe';

            // Use tasklist to check if the process is running
            const checkProcess = cp.spawn('tasklist', ['/FI', `IMAGENAME eq ${processName}`, '/FO', 'CSV'], {
                windowsHide: true
            });

            let output = '';
            checkProcess.stdout.on('data', (data) => {
                output += data.toString();
            });

            await new Promise<void>((resolve, reject) => {
                checkProcess.on('close', (code) => {
                    if (code === 0) {
                        // Check if process is found in output
                        if (output.includes(processName)) {
                            this.log(`Found running ${processName} process, attempting to terminate...`);

                            // Force kill the process
                            const killProcess = cp.spawn('taskkill', ['/F', '/IM', processName], {
                                windowsHide: true
                            });

                            killProcess.on('close', (killCode) => {
                                if (killCode === 0) {
                                    this.log(`Successfully terminated ${processName}`);
                                } else {
                                    this.logWarn(`Failed to terminate ${processName}, exit code: ${killCode}`);
                                }
                                // Wait a moment for the process to fully terminate
                                setTimeout(resolve, 1000);
                            });

                            killProcess.on('error', (error) => {
                                this.logWarn(`Error terminating ${processName}: ${error}`);
                                resolve(); // Continue anyway
                            });
                        } else {
                            this.log(`No running ${processName} process found`);
                            resolve();
                        }
                    } else {
                        this.logWarn(`Failed to check for running ${processName} process, exit code: ${code}`);
                        resolve(); // Continue anyway
                    }
                });

                checkProcess.on('error', (error) => {
                    this.logWarn(`Error checking for running ${processName} process: ${error}`);
                    resolve(); // Continue anyway
                });
            });
        } catch (error) {
            this.logWarn(`Error in forceShutdownCli: ${error}`);
            // Don't throw - we want the download to continue even if shutdown fails
        }
    }

    /**
     * Downloads and extracts the CLI
     */
    private async downloadCli(): Promise<void> {
        return vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Fab Inspector",
            cancellable: false
        }, async (progress) => {
            let retryCount = 0;

            const userConsentKey = 'cliUserConsent';
            const config = vscode.workspace.getConfiguration('fabInspector');
            let userConsent = config.get<boolean>(userConsentKey, false);

            if (!userConsent) {
                const consent = await vscode.window.showInformationMessage(
                    'The Fab Inspector extension needs to download and run the Fab Inspector CLI executable. Do you allow this?',
                    { modal: true },
                    'Yes', 'No'
                );
                if (consent !== 'Yes') {
                    throw new Error('User did not consent to download and run the Fab Inspector CLI executable.');
                }
                await config.update(userConsentKey, true, vscode.ConfigurationTarget.Global);
            }

            while (retryCount < this.maxRetries) {
                try {
                    progress.report({
                        increment: 0,
                        message: `Downloading CLI... ${retryCount > 0 ? `(attempt ${retryCount + 1}/${this.maxRetries})` : ''}`
                    });

                    // Force shutdown any running CLI processes first
                    progress.report({ increment: 5, message: "Shutting down running processes..." });
                    await this.forceShutdownCli();

                    // Ensure bin directory exists
                    if (!fs.existsSync(this.cliDirectory)) {
                        fs.mkdirSync(this.cliDirectory, { recursive: true });
                    }

                    // Clean up any existing CLI files
                    await this.cleanupOldCliFiles();

                    const cliUrl = this.getCliUrl();

                    progress.report({ increment: 10, message: `Downloading...` });

                    this.log(`Downloading CLI from ${cliUrl}`);

                    const zipPath = path.join(this.cliDirectory, 'cli-temp.zip');
                    await this.downloadFile(cliUrl, zipPath);

                    progress.report({ increment: 50, message: "Extracting..." });

                    // Extract ZIP using require with error handling
                    await this.extractZip(zipPath, this.cliDirectory);

                    progress.report({ increment: 30, message: "Validating..." });

                    // Verify extraction was successful
                    if (!fs.existsSync(this.cliExecutable)) {
                        throw new Error('CLI executable not found after extraction');
                    }

                    // Clean up ZIP file
                    fs.unlinkSync(zipPath);

                    // After successful extraction, create timestamp file
                    const timestampFile = path.join(this.cliDirectory, '.download-timestamp');
                    fs.writeFileSync(timestampFile, Date.now().toString());

                    progress.report({ increment: 10, message: "Complete!" });

                    vscode.window.showInformationMessage('Fab Inspector CLI downloaded successfully!');
                    return;

                } catch (error) {
                    retryCount++;
                    this.logError(`CLI download attempt ${retryCount} failed: ${error}`);

                    if (retryCount >= this.maxRetries) {
                        const errorMessage = `Failed to download CLI after ${this.maxRetries} attempts: ${error}`;
                        vscode.window.showErrorMessage(errorMessage, 'Retry', 'Open Settings').then(selection => {
                            if (selection === 'Retry') {
                                this.downloadCli();
                            } else if (selection === 'Open Settings') {
                                vscode.commands.executeCommand('workbench.action.openSettings', 'fabInspector');
                            }
                        });
                        throw new Error(errorMessage);
                    }

                    // Wait before retry
                    await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
                }
            }
        });
    }

    /**
     * Downloads a file from a URL
     */
    private downloadFile(url: string, destinationPath: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const file = fs.createWriteStream(destinationPath);

            const request = https.get(url, (response) => {
                // Handle redirects
                if (response.statusCode === 302 || response.statusCode === 301) {
                    const redirectUrl = response.headers.location;
                    if (redirectUrl) {
                        file.close();
                        fs.unlinkSync(destinationPath);
                        return this.downloadFile(redirectUrl, destinationPath)
                            .then(resolve)
                            .catch(reject);
                    }
                }

                if (response.statusCode !== 200) {
                    file.close();
                    fs.unlinkSync(destinationPath);
                    reject(new Error(`Download failed with status ${response.statusCode}: ${response.statusMessage}`));
                    return;
                }

                response.pipe(file);

                file.on('finish', () => {
                    file.close();
                    resolve();
                });

                file.on('error', (err) => {
                    file.close();
                    fs.unlink(destinationPath, () => { }); // Clean up on error
                    reject(err);
                });
            });

            request.on('error', (err) => {
                file.close();
                fs.unlink(destinationPath, () => { }); // Clean up on error
                reject(err);
            });

            // Set timeout
            request.setTimeout(30000, () => {
                request.destroy();
                file.close();
                fs.unlink(destinationPath, () => { });
                reject(new Error('Download timeout'));
            });
        });
    }

    /**
     * Cleans up old CLI files
     */
    private async cleanupOldCliFiles(): Promise<void> {
        try {
            // Clean up CLI files in bin root
            const filesToClean = [
                path.join(this.cliDirectory, 'PBIRInspectorCLI.exe'),
                path.join(this.cliDirectory, 'libSkiaSharp.dll'),
                path.join(this.cliDirectory, 'LICENSE'),
                path.join(this.cliDirectory, 'cli-temp.zip')
            ];

            for (const file of filesToClean) {
                if (fs.existsSync(file)) {
                    fs.unlinkSync(file);
                }
            }

            // Clean up Files directory
            const filesDir = path.join(this.cliDirectory, 'Files');
            if (fs.existsSync(filesDir)) {
                fs.rmSync(filesDir, { recursive: true, force: true });
            }
        } catch (error) {
            this.logWarn(`Error cleaning up old CLI files: ${error}`);
        }
    }

    /**
     * Forces a CLI update by invalidating the cache
     */
    public async forceUpdate(): Promise<string> {
        await this.forceShutdownCli();
        await this.cleanupOldCliFiles();
        return this.downloadCli().then(() => this.cliExecutable);
    }

    /**
     * Gets CLI information
     */
    public getCliInfo(): { exists: boolean; path: string; lastModified?: Date; version: string; downloadUrl: string } {
        const exists = fs.existsSync(this.cliExecutable);
        const config = vscode.workspace.getConfiguration('fabInspector');
        const version = config.get<string>('cliVersion', 'latest');

        const info: { exists: boolean; path: string; lastModified?: Date; version: string; downloadUrl: string } = {
            exists,
            path: this.cliExecutable,
            version: version,
            downloadUrl: this.getCliUrl()
        };

        if (exists) {
            const stats = fs.statSync(this.cliExecutable);
            info.lastModified = stats.mtime;
        }

        return info;
    }

    // Extract ZIP using PowerShell
    private async extractZip(zipPath: string, extractPath: string): Promise<void> {
        return new Promise((resolve, reject) => {
            // Create a temporary extraction directory
            const tempExtractPath = path.join(extractPath, 'temp-extract');
            
            // PowerShell command to extract ZIP
            const powershellCommand = `powershell -Command "Expand-Archive -Path '${zipPath}' -DestinationPath '${tempExtractPath}' -Force"`;
            
            cp.exec(powershellCommand, { windowsHide: true }, async (error, stdout, stderr) => {
                if (error) {
                    this.logError(`PowerShell extraction failed: ${error.message}`);
                    reject(new Error(`ZIP extraction failed: ${error.message}`));
                    return;
                }

                try {
                    // Move files from win-x64/CLI/ to bin root, preserving structure
                    const sourcePath = path.join(tempExtractPath, 'win-x64', 'CLI');
                    
                    if (!fs.existsSync(sourcePath)) {
                        throw new Error('Expected win-x64/CLI folder not found in extracted content');
                    }

                    // Read all items in the CLI folder
                    const items = fs.readdirSync(sourcePath, { withFileTypes: true });
                    
                    for (const item of items) {
                        const sourceItemPath = path.join(sourcePath, item.name);
                        const destItemPath = path.join(extractPath, item.name);
                        
                        if (item.isDirectory()) {
                            // Copy directory recursively (like Files folder)
                            await this.copyDirectory(sourceItemPath, destItemPath);
                        } else {
                            // Copy file directly to bin root
                            fs.copyFileSync(sourceItemPath, destItemPath);
                        }
                    }

                    // Clean up temporary extraction directory
                    fs.rmSync(tempExtractPath, { recursive: true, force: true });
                    
                    resolve();
                } catch (moveError) {
                    this.logError(`File movement failed: ${moveError}`);
                    // Clean up temporary directory on error
                    try {
                        fs.rmSync(tempExtractPath, { recursive: true, force: true });
                    } catch (cleanupError) {
                        this.logWarn(`Failed to clean up temporary directory: ${cleanupError}`);
                    }
                    reject(new Error(`File extraction and movement failed: ${moveError}`));
                }
            });
        });
    }

    /**
     * Recursively copy a directory
     */
    private async copyDirectory(source: string, destination: string): Promise<void> {
        // Create destination directory
        fs.mkdirSync(destination, { recursive: true });
        
        const items = fs.readdirSync(source, { withFileTypes: true });
        
        for (const item of items) {
            const sourceItemPath = path.join(source, item.name);
            const destItemPath = path.join(destination, item.name);
            
            if (item.isDirectory()) {
                await this.copyDirectory(sourceItemPath, destItemPath);
            } else {
                fs.copyFileSync(sourceItemPath, destItemPath);
            }
        }
    }
}
