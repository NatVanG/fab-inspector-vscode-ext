import * as assert from 'assert';
import { ValidationUtils } from '../../utils/validationUtils';

suite('Folder Name Validation Tests', () => {
    
    test('Valid folder names should pass validation', () => {
        assert.strictEqual(ValidationUtils.validateFolderName('fab-inspector-rules'), 'fab-inspector-rules');
        assert.strictEqual(ValidationUtils.validateFolderName('my-rules'), 'my-rules');
        assert.strictEqual(ValidationUtils.validateFolderName('project_rules'), 'project_rules');
        assert.strictEqual(ValidationUtils.validateFolderName('Rules 2024'), 'Rules 2024');
        assert.strictEqual(ValidationUtils.validateFolderName('abc123'), 'abc123');
    });

    test('Invalid folder names should throw errors', () => {
        // Empty or whitespace
        assert.throws(() => ValidationUtils.validateFolderName(''), /empty/);
        assert.throws(() => ValidationUtils.validateFolderName('   '), /empty/);
        
        // Path traversal
        assert.throws(() => ValidationUtils.validateFolderName('..'), /path separators/);
        assert.throws(() => ValidationUtils.validateFolderName('../rules'), /path separators/);
        assert.throws(() => ValidationUtils.validateFolderName('rules/subfolder'), /path separators/);
        assert.throws(() => ValidationUtils.validateFolderName('rules\\subfolder'), /path separators/);

        // Invalid characters
        assert.throws(() => ValidationUtils.validateFolderName('rules<>'), /invalid characters/);
        assert.throws(() => ValidationUtils.validateFolderName('rules|test'), /invalid characters/);
        assert.throws(() => ValidationUtils.validateFolderName('rules?'), /invalid characters/);
        assert.throws(() => ValidationUtils.validateFolderName('rules*'), /invalid characters/);
        
        // Too long
        const longName = 'a'.repeat(101);
        assert.throws(() => ValidationUtils.validateFolderName(longName), /too long/);
        
        // Special characters not allowed
        assert.throws(() => ValidationUtils.validateFolderName('rules@home'), /only contain letters/);
        assert.throws(() => ValidationUtils.validateFolderName('rules#1'), /only contain letters/);
    });

    test('Folder name trimming should work', () => {
        assert.strictEqual(ValidationUtils.validateFolderName('  my-rules  '), 'my-rules');
        assert.strictEqual(ValidationUtils.validateFolderName('\trules\n'), 'rules');
    });
});
