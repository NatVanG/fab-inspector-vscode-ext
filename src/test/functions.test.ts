import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// Mock jsonpath since it's required by extension
const mockJsonpath = {
    query: (obj: any, query: string) => {
        if (query.includes('rules[?(@.id == "test-rule")]')) {
            return obj.rules ? obj.rules.filter((r: any) => r.id === 'test-rule') : [];
        }
        if (query.includes('[?(@.id == "test-rule")]')) {
            const findInObject = (obj: any, id: string): any[] => {
                const results: any[] = [];
                if (typeof obj === 'object' && obj !== null) {
                    if (obj.id === id) {
                        results.push(obj);
                    }
                    for (const key in obj) {
                        if (obj.hasOwnProperty(key)) {
                            results.push(...findInObject(obj[key], id));
                        }
                    }
                }
                return results;
            };
            return findInObject(obj, 'test-rule');
        }
        return [];
    }
};

// Mock function to simulate findRuleById functionality
function mockFindRuleById(documentText: string, ruleId: string): any | null {
    try {
        const documentJson = JSON.parse(documentText);
        
        // First try to find in rules array
        if (documentJson.rules && Array.isArray(documentJson.rules)) {
            const found = documentJson.rules.find((rule: any) => rule.id === ruleId);
            if (found) {
                return found;
            }
        }
        
        // Then try global search
        const findInObject = (obj: any): any | null => {
            if (typeof obj === 'object' && obj !== null) {
                if (obj.id === ruleId) {
                    return obj;
                }
                
                for (const key in obj) {
                    if (obj.hasOwnProperty(key)) {
                        const found = findInObject(obj[key]);
                        if (found) {
                            return found;
                        }
                    }
                }
            }
            return null;
        };
        
        return findInObject(documentJson);
    } catch (error) {
        return null;
    }
}

// Mock function to simulate cleanupExistingTempFiles functionality
function mockCleanupExistingTempFiles(): { found: number; cleaned: number; errors: string[] } {
    const results = { found: 0, cleaned: 0, errors: [] as string[] };
    
    try {
        const tempDir = os.tmpdir();
        const files = fs.readdirSync(tempDir);
        const fabTempFiles = files.filter(file => file.startsWith('fab-inspector-temp-rule-'));
        
        results.found = fabTempFiles.length;
        
        for (const file of fabTempFiles) {
            try {
                const filePath = path.join(tempDir, file);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                    results.cleaned++;
                }
            } catch (error) {
                results.errors.push(`Failed to clean ${file}: ${error}`);
            }
        }
    } catch (error) {
        results.errors.push(`Error during cleanup: ${error}`);
    }
    
    return results;
}

suite('Extension Functions Test Suite', () => {
    
    suite('Rule Finding Function Tests', () => {
        test('Should find rule by ID in rules array', () => {
            const documentText = JSON.stringify({
                rules: [
                    { id: 'rule1', name: 'First Rule' },
                    { id: 'test-rule', name: 'Test Rule', logic: { and: [true] } },
                    { id: 'rule3', name: 'Third Rule' }
                ]
            });

            const result = mockFindRuleById(documentText, 'test-rule');
            
            assert.ok(result, 'Should find the rule');
            assert.strictEqual(result.id, 'test-rule');
            assert.strictEqual(result.name, 'Test Rule');
            assert.ok(result.logic, 'Should include rule logic');
        });

        test('Should find rule by ID anywhere in document', () => {
            const documentText = JSON.stringify({
                metadata: {
                    version: '1.0',
                    customRule: { id: 'test-rule', name: 'Custom Rule' }
                },
                rules: [
                    { id: 'rule1', name: 'First Rule' }
                ]
            });

            const result = mockFindRuleById(documentText, 'test-rule');
            
            assert.ok(result, 'Should find the rule in nested structure');
            assert.strictEqual(result.id, 'test-rule');
            assert.strictEqual(result.name, 'Custom Rule');
        });

        test('Should return null for non-existent rule', () => {
            const documentText = JSON.stringify({
                rules: [
                    { id: 'rule1', name: 'First Rule' },
                    { id: 'rule2', name: 'Second Rule' }
                ]
            });

            const result = mockFindRuleById(documentText, 'non-existent-rule');
            
            assert.strictEqual(result, null, 'Should return null for non-existent rule');
        });

        test('Should return null for invalid JSON', () => {
            const invalidJson = '{"rules": [{"id": "test"';
            
            const result = mockFindRuleById(invalidJson, 'test');
            
            assert.strictEqual(result, null, 'Should return null for invalid JSON');
        });

        test('Should handle empty document', () => {
            const emptyDocument = '{}';
            
            const result = mockFindRuleById(emptyDocument, 'test-rule');
            
            assert.strictEqual(result, null, 'Should return null for empty document');
        });
    });

    suite('Temporary File Management Tests', () => {
        let testTempFiles: string[] = [];

        setup(() => {
            // Create some test temp files
            const tempDir = os.tmpdir();
            for (let i = 0; i < 3; i++) {
                const tempFile = path.join(tempDir, `fab-inspector-temp-rule-test-${Date.now()}-${i}.json`);
                fs.writeFileSync(tempFile, JSON.stringify({ test: true }));
                testTempFiles.push(tempFile);
            }
        });

        teardown(() => {
            // Clean up any remaining test files
            for (const file of testTempFiles) {
                try {
                    if (fs.existsSync(file)) {
                        fs.unlinkSync(file);
                    }
                } catch (error) {
                    // Ignore cleanup errors
                }
            }
            testTempFiles = [];
        });

        test('Should identify and clean temp files', () => {
            const results = mockCleanupExistingTempFiles();
            
            assert.ok(results.found >= testTempFiles.length, 'Should find test temp files');
            assert.ok(results.cleaned >= testTempFiles.length, 'Should clean test temp files');
        });

        test('Should create valid temporary file path', () => {
            const tempDir = os.tmpdir();
            const timestamp = Date.now();
            const tempFile = path.join(tempDir, `fab-inspector-temp-rule-${timestamp}.json`);
            
            assert.ok(tempFile.includes('fab-inspector-temp-rule-'), 'Should contain temp rule prefix');
            assert.ok(tempFile.endsWith('.json'), 'Should have .json extension');
            assert.ok(path.isAbsolute(tempFile), 'Should be absolute path');
        });

        test('Should write and read rule wrapper correctly', () => {
            const tempDir = os.tmpdir();
            const tempFile = path.join(tempDir, `fab-inspector-temp-rule-test-${Date.now()}.json`);
            
            const testRule = {
                id: 'test-rule',
                name: 'Test Rule',
                logic: { and: [true] }
            };
            
            const rulesWrapper = { rules: [testRule] };
            
            // Write file
            fs.writeFileSync(tempFile, JSON.stringify(rulesWrapper, null, 2));
            
            // Verify file exists and content is correct
            assert.ok(fs.existsSync(tempFile), 'Temp file should exist');
            
            const fileContent = fs.readFileSync(tempFile, 'utf8');
            const parsedContent = JSON.parse(fileContent);
            
            assert.ok(parsedContent.rules, 'Should have rules array');
            assert.strictEqual(parsedContent.rules.length, 1, 'Should have one rule');
            assert.strictEqual(parsedContent.rules[0].id, 'test-rule', 'Should have correct rule ID');
            
            // Clean up
            fs.unlinkSync(tempFile);
            testTempFiles.push(tempFile); // Add to cleanup list just in case
        });
    });

    suite('Text Processing Helper Tests', () => {
        test('Should remove quotes from rule ID', () => {
            const testCases = [
                { input: '"test-rule"', expected: 'test-rule' },
                { input: "'test-rule'", expected: 'test-rule' },
                { input: 'test-rule', expected: 'test-rule' },
                { input: '"quoted-string"', expected: 'quoted-string' },
                { input: "'single-quoted'", expected: 'single-quoted' }
            ];
            
            for (const testCase of testCases) {
                const result = testCase.input.replace(/^["']|["']$/g, '');
                assert.strictEqual(result, testCase.expected, `Should correctly process: ${testCase.input}`);
            }
        });

        test('Should trim whitespace from selected text', () => {
            const testCases = [
                { input: '  test-rule  ', expected: 'test-rule' },
                { input: '\n\ttest-rule\n\t', expected: 'test-rule' },
                { input: 'test-rule', expected: 'test-rule' },
                { input: '   ', expected: '' }
            ];
            
            for (const testCase of testCases) {
                const result = testCase.input.trim();
                assert.strictEqual(result, testCase.expected, `Should correctly trim: "${testCase.input}"`);
            }
        });
    });

    suite('JSON Manipulation Tests', () => {
        test('Should wrap JSON with log node correctly', () => {
            const originalJson = { field: 'value', number: 42 };
            const wrappedJson = { log: originalJson };
            
            assert.ok(wrappedJson.log, 'Should have log property');
            assert.strictEqual(wrappedJson.log.field, 'value', 'Should preserve original field');
            assert.strictEqual(wrappedJson.log.number, 42, 'Should preserve original number');
        });

        test('Should unwrap log node correctly', () => {
            const wrappedJson = { 
                log: { 
                    field: 'value', 
                    number: 42,
                    nested: { prop: 'test' }
                } 
            };
            
            const unwrappedJson = wrappedJson.log;
            
            assert.strictEqual(unwrappedJson.field, 'value', 'Should extract field');
            assert.strictEqual(unwrappedJson.number, 42, 'Should extract number');
            assert.ok(unwrappedJson.nested, 'Should extract nested object');
            assert.strictEqual(unwrappedJson.nested.prop, 'test', 'Should extract nested property');
        });

        test('Should format JSON with proper indentation', () => {
            const testObject = {
                id: 'test-rule',
                name: 'Test Rule',
                logic: { and: [true, false] }
            };
            
            const formatted = JSON.stringify(testObject, null, 2);
            const lines = formatted.split('\n');
            
            assert.ok(lines.length > 1, 'Should be multi-line');
            assert.ok(lines.some(line => line.includes('  ')), 'Should contain indentation');
            
            // Should be parseable back to original object
            const parsed = JSON.parse(formatted);
            assert.deepStrictEqual(parsed, testObject, 'Should parse back to original');
        });
    });

    suite('File Path Validation Tests', () => {
        test('Should validate JSON file extensions', () => {
            const testCases = [
                { filename: 'rules.json', isValid: true },
                { filename: 'test-rules.json', isValid: true },
                { filename: 'rules.txt', isValid: false },
                { filename: 'rules.xml', isValid: false },
                { filename: 'rules', isValid: false },
                { filename: '.json', isValid: true }
            ];
            
            for (const testCase of testCases) {
                const isValid = testCase.filename.endsWith('.json');
                assert.strictEqual(isValid, testCase.isValid, 
                    `${testCase.filename} should ${testCase.isValid ? 'be valid' : 'be invalid'}`);
            }
        });

        test('Should construct correct file paths', () => {
            const workspacePath = '/mock/workspace';
            const rulesFile = 'test-rules.json';
            const expectedPath = path.join(workspacePath, 'fab-inspector-rules', rulesFile);
            
            // Test path construction
            const constructedPath = path.join(workspacePath, 'fab-inspector-rules', rulesFile);
            assert.strictEqual(constructedPath, expectedPath, 'Should construct correct path');
            
            // Test path parsing
            const parsedDir = path.dirname(constructedPath);
            const parsedFile = path.basename(constructedPath);
            
            assert.ok(parsedDir.endsWith('fab-inspector-rules'), 'Should have correct directory');
            assert.strictEqual(parsedFile, rulesFile, 'Should have correct filename');
        });
    });

    suite('Error Simulation Tests', () => {
        test('Should handle file system errors gracefully', () => {
            const nonExistentPath = path.join('/non-existent-directory', 'file.json');
            
            // Test read error
            assert.throws(() => {
                fs.readFileSync(nonExistentPath);
            }, Error, 'Should throw error for non-existent file');
            
            // Test write error (to non-existent directory)
            assert.throws(() => {
                fs.writeFileSync(nonExistentPath, 'test content');
            }, Error, 'Should throw error when writing to non-existent directory');
        });

        test('Should handle JSON parsing errors', () => {
            const invalidJsonStrings = [
                '{"invalid": json}',
                '{"missing": "quote}',
                '{invalid: "json"}',
                '{"trailing": "comma",}',
                ''
            ];
            
            for (const invalidJson of invalidJsonStrings) {
                assert.throws(() => {
                    JSON.parse(invalidJson);
                }, Error, `Should throw error for invalid JSON: ${invalidJson}`);
            }
        });
    });
});
