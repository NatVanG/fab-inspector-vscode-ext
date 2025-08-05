import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { ValidationUtils } from '../../utils/validationUtils';

suite('ValidationUtils Tests', () => {
    let tempWorkspaceDir: string;

    setup(() => {
        // Create a temporary workspace directory for testing
        tempWorkspaceDir = fs.mkdtempSync(path.join(os.tmpdir(), 'security-test-'));
    });

    teardown(() => {
        // Clean up temporary workspace directory
        if (fs.existsSync(tempWorkspaceDir)) {
            fs.rmSync(tempWorkspaceDir, { recursive: true, force: true });
        }
    });

    suite('validateFilePath', () => {
        test('should validate normal file path', () => {
            const result = ValidationUtils.validateFilePath('test.json');
            assert.strictEqual(result, 'test.json');
        });

        test('should normalize file path', () => {
            const result = ValidationUtils.validateFilePath('./folder/test.json');
            assert.strictEqual(result, path.normalize('./folder/test.json'));
        });

        test('should reject directory traversal with ..', () => {
            assert.throws(() => {
                ValidationUtils.validateFilePath('../../../etc/passwd');
            }, /Directory traversal detected/);
        });

        test('should reject directory traversal in subfolder', () => {
            assert.throws(() => {
                ValidationUtils.validateFilePath('folder/../../../etc/passwd');
            }, /Directory traversal detected/);
        });

        test('should validate path within workspace boundaries', () => {
            const testFile = path.join(tempWorkspaceDir, 'test.json');
            const result = ValidationUtils.validateFilePath('test.json', tempWorkspaceDir);
            assert.strictEqual(result, 'test.json');
        });

        test('should reject path outside workspace boundaries', () => {
            assert.throws(() => {
                ValidationUtils.validateFilePath('/etc/passwd', tempWorkspaceDir);
            }, /File path must be within workspace boundaries/);
        });

        test('should handle relative paths within workspace', () => {
            const result = ValidationUtils.validateFilePath('subfolder/test.json', tempWorkspaceDir);
            assert.strictEqual(result, path.normalize('subfolder/test.json'));
        });

        test('should reject absolute paths when workspace is provided', () => {
            assert.throws(() => {
                ValidationUtils.validateFilePath(path.join(os.tmpdir(), 'outside.json'), tempWorkspaceDir);
            }, /File path must be within workspace boundaries/);
        });
    });

    suite('validateFileExtension', () => {
        test('should validate allowed extension', () => {
            const result = ValidationUtils.validateFileExtension('test.json', ['.json']);
            assert.strictEqual(result, true);
        });

        test('should validate multiple allowed extensions', () => {
            const result1 = ValidationUtils.validateFileExtension('test.json', ['.json', '.txt']);
            const result2 = ValidationUtils.validateFileExtension('test.txt', ['.json', '.txt']);
            assert.strictEqual(result1, true);
            assert.strictEqual(result2, true);
        });

        test('should reject disallowed extension', () => {
            const result = ValidationUtils.validateFileExtension('test.exe', ['.json']);
            assert.strictEqual(result, false);
        });

        test('should be case insensitive', () => {
            const result1 = ValidationUtils.validateFileExtension('test.JSON', ['.json']);
            const result2 = ValidationUtils.validateFileExtension('test.Json', ['.json']);
            assert.strictEqual(result1, true);
            assert.strictEqual(result2, true);
        });

        test('should handle files without extension', () => {
            const result = ValidationUtils.validateFileExtension('test', ['.json']);
            assert.strictEqual(result, false);
        });

        test('should handle empty allowed extensions array', () => {
            const result = ValidationUtils.validateFileExtension('test.json', []);
            assert.strictEqual(result, false);
        });
    });

    suite('sanitizeCommandArg', () => {
        test('should keep safe characters', () => {
            const input = 'test-file_name.json';
            const result = ValidationUtils.sanitizeCommandArg(input);
            assert.strictEqual(result, 'test-file_name.json');
        });

        test('should keep paths with slashes and colons', () => {
            const input = 'C:\\Users\\test\\file.json';
            const result = ValidationUtils.sanitizeCommandArg(input);
            assert.strictEqual(result, 'C:\\Users\\test\\file.json');
        });

        test('should remove potentially dangerous characters', () => {
            const input = 'test;rm -rf /&echo dangerous';
            const result = ValidationUtils.sanitizeCommandArg(input);
            assert.strictEqual(result, 'testrm -rf echo dangerous');
        });

        test('should remove pipe characters', () => {
            const input = 'test | cat /etc/passwd';
            const result = ValidationUtils.sanitizeCommandArg(input);
            assert.strictEqual(result, 'test  cat etcpasswd');
        });

        test('should remove backticks and dollar signs', () => {
            const input = 'test`whoami`$USER';
            const result = ValidationUtils.sanitizeCommandArg(input);
            assert.strictEqual(result, 'testwhoamiUSER');
        });

        test('should remove brackets and braces', () => {
            const input = 'test[0]$(command){var}';
            const result = ValidationUtils.sanitizeCommandArg(input);
            assert.strictEqual(result, 'test0commandvar');
        });

        test('should handle empty string', () => {
            const result = ValidationUtils.sanitizeCommandArg('');
            assert.strictEqual(result, '');
        });

        test('should keep spaces', () => {
            const input = 'file name with spaces';
            const result = ValidationUtils.sanitizeCommandArg(input);
            assert.strictEqual(result, 'file name with spaces');
        });
    });

    suite('validateCliVersion', () => {
        test('should accept "latest"', () => {
            const result = ValidationUtils.validateCliVersion('latest');
            assert.strictEqual(result, 'latest');
        });

        test('should accept semantic version format', () => {
            const result1 = ValidationUtils.validateCliVersion('v1.2.3');
            const result2 = ValidationUtils.validateCliVersion('v10.20.30');
            assert.strictEqual(result1, 'v1.2.3');
            assert.strictEqual(result2, 'v10.20.30');
        });

        test('should reject invalid version formats', () => {
            const result1 = ValidationUtils.validateCliVersion('1.2.3'); // missing 'v'
            const result2 = ValidationUtils.validateCliVersion('v1.2'); // incomplete
            const result3 = ValidationUtils.validateCliVersion('v1.2.3.4'); // too many parts
            const result4 = ValidationUtils.validateCliVersion('malicious-version');
            
            assert.strictEqual(result1, 'latest');
            assert.strictEqual(result2, 'latest');
            assert.strictEqual(result3, 'latest');
            assert.strictEqual(result4, 'latest');
        });

        test('should reject version with special characters', () => {
            const result1 = ValidationUtils.validateCliVersion('v1.2.3; rm -rf /');
            const result2 = ValidationUtils.validateCliVersion('v1.2.3`whoami`');
            
            assert.strictEqual(result1, 'latest');
            assert.strictEqual(result2, 'latest');
        });

        test('should handle empty string', () => {
            const result = ValidationUtils.validateCliVersion('');
            assert.strictEqual(result, 'latest');
        });
    });

    suite('validateRulesFileName', () => {
        test('should validate normal JSON file name', () => {
            const result = ValidationUtils.validateRulesFileName('rules.json');
            assert.strictEqual(result, 'rules.json');
        });

        test('should validate file name with hyphens and underscores', () => {
            const result1 = ValidationUtils.validateRulesFileName('my-rules_file.json');
            const result2 = ValidationUtils.validateRulesFileName('test_rules-v1.json');
            
            assert.strictEqual(result1, 'my-rules_file.json');
            assert.strictEqual(result2, 'test_rules-v1.json');
        });

        test('should strip path components', () => {
            const result = ValidationUtils.validateRulesFileName('folder/subfolder/rules.json');
            assert.strictEqual(result, 'rules.json');
        });

        test('should reject non-JSON extensions', () => {
            assert.throws(() => {
                ValidationUtils.validateRulesFileName('rules.txt');
            }, /Invalid rules file name format/);
        });

        test('should reject file names with special characters', () => {
            assert.throws(() => {
                ValidationUtils.validateRulesFileName('rules;rm -rf.json');
            }, /Invalid rules file name format/);
        });

        test('should reject file names with spaces', () => {
            assert.throws(() => {
                ValidationUtils.validateRulesFileName('my rules.json');
            }, /Invalid rules file name format/);
        });

        test('should reject file names with path traversal', () => {
            assert.throws(() => {
                ValidationUtils.validateRulesFileName('../../../etc/passwd.json');
            }, /Path traversal detected/);
        });

        test('should reject empty file name', () => {
            assert.throws(() => {
                ValidationUtils.validateRulesFileName('');
            }, /Invalid rules file name format/);
        });

        test('should reject file name without extension', () => {
            assert.throws(() => {
                ValidationUtils.validateRulesFileName('rules');
            }, /Invalid rules file name format/);
        });

        test('should handle Windows path separators', () => {
            const result = ValidationUtils.validateRulesFileName('folder\\subfolder\\rules.json');
            assert.strictEqual(result, 'rules.json');
        });
    });

    suite('Edge Cases and Security Tests', () => {
        test('should handle null and undefined inputs safely', () => {
            assert.throws(() => {
                ValidationUtils.validateFilePath(null as any);
            });
            
            assert.throws(() => {
                ValidationUtils.validateFilePath(undefined as any);
            });
        });

        test('should handle very long file paths', () => {
            const longPath = 'a'.repeat(1000) + '.json';
            const result = ValidationUtils.validateFilePath(longPath);
            assert.strictEqual(result, longPath);
        });

        test('should handle Unicode characters in file names', () => {
            // Should be rejected by validateRulesFileName due to strict pattern
            assert.throws(() => {
                ValidationUtils.validateRulesFileName('règles.json');
            }, /Invalid rules file name format/);
        });

        test('should handle mixed case extensions', () => {
            const result = ValidationUtils.validateFileExtension('test.JSON', ['.json']);
            assert.strictEqual(result, true);
        });

        test('should prevent command injection through file names', () => {
            assert.throws(() => {
                ValidationUtils.validateRulesFileName('test$(rm -rf /).json');
            }, /Invalid rules file name format/);
        });

        test('should prevent URL manipulation in version', () => {
            const maliciousVersion = 'v1.2.3/../../malicious';
            const result = ValidationUtils.validateCliVersion(maliciousVersion);
            assert.strictEqual(result, 'latest');
        });
    });
});
