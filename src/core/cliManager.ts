import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import * as https from 'https';
import AdmZip from 'adm-zip';

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
     * Gets the CLI download URL based on the configured version
     */
    private getCliUrl(): string {
        const config = vscode.workspace.getConfiguration('fabInspector');
        const version = config.get<string>('cliVersion', 'latest');
        
        if (version === 'latest') {
            return 'https://github.com/NatVanG/PBI-InspectorV2/releases/latest/download/win-x64-CLI.zip';
        } else {
            return `https://github.com/NatVanG/PBI-InspectorV2/releases/download/${version}/win-x64-CLI.zip`;
        }
    }

    /**
     * Ensures the CLI is available, downloading it if necessary
     */
    public async ensureCliAvailable(): Promise<string> {
        // Check if we're on Windows
        if (os.platform() !== 'win32') {
            throw new Error('Fab Inspector CLI is currently only supported on Windows');
        }

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
                        console.log('CLI cache expired, will download fresh version');
                        return false;
                    }
                }
            }

            return true;
        } catch (error) {
            console.error('Error checking CLI validity:', error);
            return false;
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

            while (retryCount < this.maxRetries) {
                try {
                    progress.report({
                        increment: 0,
                        message: `Downloading CLI... ${retryCount > 0 ? `(attempt ${retryCount + 1}/${this.maxRetries})` : ''}`
                    });

                    // Ensure bin directory exists
                    if (!fs.existsSync(this.cliDirectory)) {
                        fs.mkdirSync(this.cliDirectory, { recursive: true });
                    }

                    // Clean up any existing CLI files
                    await this.cleanupOldCliFiles();

                    progress.report({ increment: 10, message: "Downloading..." });

                    const zipPath = path.join(this.cliDirectory, 'cli-temp.zip');
                    await this.downloadFile(this.getCliUrl(), zipPath);

                    progress.report({ increment: 50, message: "Extracting..." });

                    // Extract ZIP
                    const zip = new AdmZip(zipPath);
                    const entries = zip.getEntries();
                    
                    // Extract files from win-x64/CLI/ to bin root
                    for (const entry of entries) {
                        if (entry.entryName.startsWith('win-x64/CLI/') && !entry.entryName.includes('Files/')) {
                            // Extract root CLI files (not in Files folder)
                            if (!entry.isDirectory) {
                                const fileName = path.basename(entry.entryName);
                                const outputPath = path.join(this.cliDirectory, fileName);
                                fs.writeFileSync(outputPath, entry.getData());
                            }
                        }
                        // Extract Files folder and preserve its internal structure
                        else if (entry.entryName.startsWith('win-x64/CLI/Files/')) {
                            // Remove 'win-x64/CLI/' prefix to get 'Files/...' structure
                            const relativePath = entry.entryName.replace('win-x64/CLI/', '');
                            const outputPath = path.join(this.cliDirectory, relativePath);
                            
                            if (entry.isDirectory) {
                                fs.mkdirSync(outputPath, { recursive: true });
                            } else {
                                // Ensure parent directory exists
                                fs.mkdirSync(path.dirname(outputPath), { recursive: true });
                                fs.writeFileSync(outputPath, entry.getData());
                            }
                        }
                    }

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
                    console.error(`CLI download attempt ${retryCount} failed:`, error);

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
            console.warn('Error cleaning up old CLI files:', error);
        }
    }

    /**
     * Forces a CLI update by invalidating the cache
     */
    public async forceUpdate(): Promise<string> {
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
}
