import * as path from 'path';
import * as fs from 'fs';
import * as vscode from 'vscode';

export class SecurityUtils {
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
        const baseName = path.basename(fileName);
        
        // Only allow alphanumeric, hyphens, underscores, and periods
        if (!/^[a-zA-Z0-9\-_.]+\.json$/.test(baseName)) {
            throw new Error('Invalid rules file name format. Only alphanumeric characters, hyphens, underscores, and periods are allowed.');
        }
        
        return baseName;
    }
}
