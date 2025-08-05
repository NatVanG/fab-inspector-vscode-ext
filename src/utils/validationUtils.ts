import * as path from 'path';
import * as fs from 'fs';
import * as vscode from 'vscode';

export class ValidationUtils {
    /**
     * Validates and sanitizes file paths to prevent directory traversal
     */
    static validateFilePath(filePath: string, workspaceRoot?: string): string {
        // Normalize the path to prevent traversal attacks
        const normalizedPath = path.normalize(filePath);
        
        // Check for directory traversal attempts
        if (normalizedPath.includes('..')) {
            throw new Error('Directory traversal detected in file path');
        }
        
        // If workspace root is provided, ensure path is within workspace
        if (workspaceRoot) {
            const resolvedPath = path.resolve(workspaceRoot, normalizedPath);
            const resolvedWorkspace = path.resolve(workspaceRoot);
            
            if (!resolvedPath.startsWith(resolvedWorkspace)) {
                throw new Error('File path must be within workspace boundaries');
            }
        }
        
        return normalizedPath;
    }
    
    /**
     * Validates that a file extension is in the allowed list
     */
    static validateFileExtension(filePath: string, allowedExtensions: string[]): boolean {
        const ext = path.extname(filePath).toLowerCase();
        return allowedExtensions.includes(ext);
    }
    
    /**
     * Sanitizes command arguments to prevent injection
     */
    static sanitizeCommandArg(arg: string): string {
        if (!arg) {
            return '';
        }
        
        // Remove dangerous characters that could be used for command injection
        return arg.replace(/[;&|`$(){}[\]<>\/]/g, '');
    }
    
    /**
     * Validates CLI version format to prevent URL manipulation
     */
    static validateCliVersion(version: string): string {
        // Only allow 'latest' or semantic version format (v1.2.3)
        const versionRegex = /^(latest|v\d+\.\d+\.\d+)$/;
        
        if (!versionRegex.test(version)) {
            console.warn(`Invalid CLI version format: ${version}, falling back to 'latest'`);
            return 'latest';
        }
        
        return version;
    }
    
    /**
     * Creates a secure temporary directory within workspace
     */
    static createSecureTempDir(): string {
        const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        if (!workspaceRoot) {
            throw new Error('No workspace available for creating temporary directory');
        }
        
        const tempDir = path.join(workspaceRoot, '.vscode', 'fab-inspector-temp');
        
        // Ensure the directory exists
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }
        
        return tempDir;
    }
    
    /**
     * Validates that a rules file name is safe
     */
    static validateRulesFileName(fileName: string): string {
        // Check for path traversal attempts before stripping path
        if (fileName.includes('..')) {
            throw new Error('Path traversal detected in rules file name');
        }
        
        // Remove any path components - only allow filename
        // Use a regex to extract the base filename, handling both Windows and POSIX separators
        const baseNameMatch = fileName.match(/([^\\/]+)$/);
        const baseName = baseNameMatch ? baseNameMatch[1] : fileName;
        
        // Only allow alphanumeric, hyphens, underscores, and periods
        if (!/^[a-zA-Z0-9\-_.]+\.json$/.test(baseName)) {
            throw new Error('Invalid rules file name format. Only alphanumeric characters, hyphens, underscores, and periods are allowed.');
        }
        
        return baseName;
    }

    /**
     * Validates and sanitizes folder names to ensure they are safe for local file system
     */
    static validateFolderName(folderName: string): string {
        if (!folderName || typeof folderName !== 'string') {
            throw new Error('Folder name must be a non-empty string');
        }

        // Trim whitespace
        const trimmed = folderName.trim();
        
        if (trimmed.length === 0) {
            throw new Error('Folder name cannot be empty or only whitespace');
        }

        // Check for path traversal attempts
        if (trimmed.includes('..') || trimmed.includes('/') || trimmed.includes('\\')) {
            throw new Error('Folder name cannot contain path separators or traversal sequences');
        }

        // Check for reserved Windows names (case-insensitive)
        const reservedNames = ['CON', 'PRN', 'AUX', 'NUL', 'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9', 'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9'];
        if (reservedNames.includes(trimmed.toUpperCase())) {
            throw new Error(`Folder name '${trimmed}' is a reserved system name`);
        }

        // Check for invalid characters (Windows and Unix combined)
        const invalidChars = /[<>:"|?*\x00-\x1f]/;
        if (invalidChars.test(trimmed)) {
            throw new Error('Folder name contains invalid characters. Only alphanumeric characters, hyphens, underscores, and spaces are allowed.');
        }

        // Check length (Windows has 255 char limit for file names)
        if (trimmed.length > 100) {
            throw new Error('Folder name is too long. Maximum 100 characters allowed.');
        }

        // Only allow safe characters: alphanumeric, hyphens, underscores, spaces
        if (!/^[a-zA-Z0-9\-_ ]+$/.test(trimmed)) {
            throw new Error('Folder name can only contain letters, numbers, hyphens, underscores, and spaces');
        }

        return trimmed;
    }

    /**
     * Gets the configured rules folder name with validation
     */
    static getConfiguredRulesFolderName(): string {
        const config = vscode.workspace.getConfiguration('fabInspector');
        const configuredName = config.get<string>('rulesFolderName', 'fab-inspector-rules');
        
        try {
            return this.validateFolderName(configuredName);
        } catch (error) {
            console.warn(`Invalid rules folder name configuration: ${error}. Using default 'fab-inspector-rules'`);
            vscode.window.showWarningMessage(`Invalid rules folder name in settings: ${error}. Using default 'fab-inspector-rules'`);
            return 'fab-inspector-rules';
        }
    }
}
