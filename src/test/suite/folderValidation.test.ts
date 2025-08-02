import * as assert from 'assert';
import { SecurityUtils } from '../../utils/securityUtils';

suite('Folder Name Validation Tests', () => {
    
    test('Valid folder names should pass validation', () => {
        assert.strictEqual(SecurityUtils.validateFolderName('fab-inspector-rules'), 'fab-inspector-rules');
        assert.strictEqual(SecurityUtils.validateFolderName('my-rules'), 'my-rules');
        assert.strictEqual(SecurityUtils.validateFolderName('project_rules'), 'project_rules');
        assert.strictEqual(SecurityUtils.validateFolderName('Rules 2024'), 'Rules 2024');
        assert.strictEqual(SecurityUtils.validateFolderName('abc123'), 'abc123');
    });

    test('Invalid folder names should throw errors', () => {
        // Empty or whitespace
        assert.throws(() => SecurityUtils.validateFolderName(''), /empty/);
        assert.throws(() => SecurityUtils.validateFolderName('   '), /empty/);
        
        // Path traversal
        assert.throws(() => SecurityUtils.validateFolderName('..'), /path separators/);
        assert.throws(() => SecurityUtils.validateFolderName('../rules'), /path separators/);
        assert.throws(() => SecurityUtils.validateFolderName('rules/subfolder'), /path separators/);
        assert.throws(() => SecurityUtils.validateFolderName('rules\\subfolder'), /path separators/);
        
        // Reserved names
        assert.throws(() => SecurityUtils.validateFolderName('CON'), /reserved system name/);
        assert.throws(() => SecurityUtils.validateFolderName('PRN'), /reserved system name/);
        assert.throws(() => SecurityUtils.validateFolderName('con'), /reserved system name/);
        
        // Invalid characters
        assert.throws(() => SecurityUtils.validateFolderName('rules<>'), /invalid characters/);
        assert.throws(() => SecurityUtils.validateFolderName('rules|test'), /invalid characters/);
        assert.throws(() => SecurityUtils.validateFolderName('rules?'), /invalid characters/);
        assert.throws(() => SecurityUtils.validateFolderName('rules*'), /invalid characters/);
        
        // Too long
        const longName = 'a'.repeat(101);
        assert.throws(() => SecurityUtils.validateFolderName(longName), /too long/);
        
        // Special characters not allowed
        assert.throws(() => SecurityUtils.validateFolderName('rules@home'), /only contain letters/);
        assert.throws(() => SecurityUtils.validateFolderName('rules#1'), /only contain letters/);
    });

    test('Folder name trimming should work', () => {
        assert.strictEqual(SecurityUtils.validateFolderName('  my-rules  '), 'my-rules');
        assert.strictEqual(SecurityUtils.validateFolderName('\trules\n'), 'rules');
    });
});
