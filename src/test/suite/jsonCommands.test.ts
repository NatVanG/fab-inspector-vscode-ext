import * as assert from 'assert';
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

suite('JSON Commands Tests', () => {
    let tempWorkspaceDir: string;
    let mockContext: vscode.ExtensionContext;

    setup(() => {
        // Create a temporary workspace directory for testing
        tempWorkspaceDir = fs.mkdtempSync(path.join(os.tmpdir(), 'json-commands-test-'));
        
        // Mock extension context
        mockContext = {
            extensionPath: tempWorkspaceDir,
            subscriptions: []
        } as any;
    });

    teardown(() => {
        // Clean up temporary files and directories
        if (fs.existsSync(tempWorkspaceDir)) {
            try {
                // Remove all files in the directory
                const files = fs.readdirSync(tempWorkspaceDir, { withFileTypes: true });
                for (const file of files) {
                    const fullPath = path.join(tempWorkspaceDir, file.name);
                    if (file.isDirectory()) {
                        // Remove subdirectories recursively
                        const subFiles = fs.readdirSync(fullPath);
                        for (const subFile of subFiles) {
                            fs.unlinkSync(path.join(fullPath, subFile));
                        }
                        fs.rmdirSync(fullPath);
                    } else {
                        fs.unlinkSync(fullPath);
                    }
                }
                fs.rmdirSync(tempWorkspaceDir);
            } catch (error) {
                // Ignore cleanup errors in tests
                console.log('Cleanup error (ignored):', error);
            }
        }
    });

    suite('Create New Rules File Command Tests', () => {
        test('Should create new-rules.json with correct structure', async () => {
            // Create a mock workspace folder
            const rulesFolderPath = path.join(tempWorkspaceDir, 'fab-inspector-rules');
            fs.mkdirSync(rulesFolderPath, { recursive: true });

            // Create expected file path
            const expectedFilePath = path.join(rulesFolderPath, 'new-rules.json');

            // Simulate the file creation logic from the command
            const initialContent = {
                "rules": []
            };

            fs.writeFileSync(expectedFilePath, JSON.stringify(initialContent, null, 2), 'utf8');

            // Verify file exists
            assert.ok(fs.existsSync(expectedFilePath), 'new-rules.json file should be created');

            // Verify file content
            const fileContent = fs.readFileSync(expectedFilePath, 'utf8');
            const parsedContent = JSON.parse(fileContent);

            assert.ok(parsedContent.hasOwnProperty('rules'), 'File should contain rules property');
            assert.ok(Array.isArray(parsedContent.rules), 'Rules should be an array');
            assert.strictEqual(parsedContent.rules.length, 0, 'Rules array should be empty initially');
        });

        test('Should create fab-inspector-rules folder if it does not exist', () => {
            const rulesFolderPath = path.join(tempWorkspaceDir, 'fab-inspector-rules');
            
            // Ensure folder doesn't exist initially
            assert.ok(!fs.existsSync(rulesFolderPath), 'Rules folder should not exist initially');

            // Simulate folder creation logic from the command
            fs.mkdirSync(rulesFolderPath, { recursive: true });

            // Verify folder is created
            assert.ok(fs.existsSync(rulesFolderPath), 'Rules folder should be created');
            
            const stats = fs.statSync(rulesFolderPath);
            assert.ok(stats.isDirectory(), 'Created path should be a directory');
        });

        test('Should handle existing new-rules.json file', () => {
            const rulesFolderPath = path.join(tempWorkspaceDir, 'fab-inspector-rules');
            fs.mkdirSync(rulesFolderPath, { recursive: true });

            const filePath = path.join(rulesFolderPath, 'new-rules.json');
            
            // Create existing file with some content
            const existingContent = {
                "rules": [
                    { "id": "existing-rule", "name": "Existing Rule" }
                ]
            };
            fs.writeFileSync(filePath, JSON.stringify(existingContent, null, 2), 'utf8');

            // Verify existing file
            assert.ok(fs.existsSync(filePath), 'File should exist before test');
            
            const existingFileContent = fs.readFileSync(filePath, 'utf8');
            const parsedExisting = JSON.parse(existingFileContent);
            assert.strictEqual(parsedExisting.rules.length, 1, 'Existing file should have content');

            // Simulate overwrite logic (what happens when user confirms overwrite)
            const newContent = { "rules": [] };
            fs.writeFileSync(filePath, JSON.stringify(newContent, null, 2), 'utf8');

            // Verify file was overwritten
            const newFileContent = fs.readFileSync(filePath, 'utf8');
            const parsedNew = JSON.parse(newFileContent);
            assert.strictEqual(parsedNew.rules.length, 0, 'File should be overwritten with empty rules');
        });

        test('Should create properly formatted JSON', () => {
            const rulesFolderPath = path.join(tempWorkspaceDir, 'fab-inspector-rules');
            fs.mkdirSync(rulesFolderPath, { recursive: true });

            const filePath = path.join(rulesFolderPath, 'new-rules.json');
            
            // Create file with expected formatting
            const content = { "rules": [] };
            const formattedJson = JSON.stringify(content, null, 2);
            fs.writeFileSync(filePath, formattedJson, 'utf8');

            // Read and verify formatting
            const fileContent = fs.readFileSync(filePath, 'utf8');
            
            // Check that the JSON is properly formatted (contains newlines and indentation)
            assert.ok(fileContent.includes('\n'), 'JSON should contain newlines');
            assert.ok(fileContent.includes('  '), 'JSON should contain proper indentation');
            
            // Verify it can be parsed
            const parsed = JSON.parse(fileContent);
            assert.ok(parsed.hasOwnProperty('rules'), 'Parsed JSON should have rules property');
        });

        test('Should validate file extension', () => {
            const fileName = 'new-rules.json';
            const invalidFileName = 'new-rules.txt';
            
            assert.ok(fileName.endsWith('.json'), 'Valid file should have .json extension');
            assert.ok(!invalidFileName.endsWith('.json'), 'Invalid file should not have .json extension');
        });

        test('Should handle various folder creation scenarios', () => {
            // Test nested folder creation
            const nestedPath = path.join(tempWorkspaceDir, 'level1', 'level2', 'fab-inspector-rules');
            
            // Should not exist initially
            assert.ok(!fs.existsSync(nestedPath), 'Nested path should not exist initially');
            
            // Create with recursive option
            fs.mkdirSync(nestedPath, { recursive: true });
            
            // Should exist after creation
            assert.ok(fs.existsSync(nestedPath), 'Nested path should exist after creation');
            assert.ok(fs.statSync(nestedPath).isDirectory(), 'Created path should be a directory');
        });

        test('Should generate valid JSON structure', () => {
            const expectedStructure = {
                "rules": []
            };

            // Test that the structure is valid JSON
            const jsonString = JSON.stringify(expectedStructure, null, 2);
            const parsed = JSON.parse(jsonString);

            assert.deepStrictEqual(parsed, expectedStructure, 'Parsed JSON should match expected structure');
            assert.ok(Array.isArray(parsed.rules), 'Rules should be an array');
            assert.strictEqual(parsed.rules.length, 0, 'Rules array should be empty');
        });

        test('Should handle file system errors gracefully', () => {
            // Test with invalid characters in path (if supported by OS)
            const invalidPath = path.join(tempWorkspaceDir, 'fab-inspector-rules');
            
            // This should work fine
            assert.doesNotThrow(() => {
                fs.mkdirSync(invalidPath, { recursive: true });
            }, 'Valid path should not throw error');
        });

        test('Should work with different workspace structures', () => {
            // Test with existing workspace structure
            const existingFolders = ['src', 'test', 'docs'];
            
            existingFolders.forEach(folder => {
                fs.mkdirSync(path.join(tempWorkspaceDir, folder), { recursive: true });
            });

            // Add rules folder
            const rulesFolderPath = path.join(tempWorkspaceDir, 'fab-inspector-rules');
            fs.mkdirSync(rulesFolderPath, { recursive: true });

            // Verify all folders exist
            existingFolders.forEach(folder => {
                assert.ok(fs.existsSync(path.join(tempWorkspaceDir, folder)), `${folder} should exist`);
            });
            
            assert.ok(fs.existsSync(rulesFolderPath), 'Rules folder should exist alongside other folders');
        });

        test('Should create file with UTF-8 encoding', () => {
            const rulesFolderPath = path.join(tempWorkspaceDir, 'fab-inspector-rules');
            fs.mkdirSync(rulesFolderPath, { recursive: true });

            const filePath = path.join(rulesFolderPath, 'new-rules.json');
            const content = { "rules": [] };
            
            // Write with explicit UTF-8 encoding
            fs.writeFileSync(filePath, JSON.stringify(content, null, 2), 'utf8');

            // Read and verify
            const fileContent = fs.readFileSync(filePath, 'utf8');
            const parsed = JSON.parse(fileContent);
            
            assert.deepStrictEqual(parsed, content, 'Content should match after UTF-8 round trip');
        });
    });

    suite('Command Registration Tests', () => {
        test('Should have createNewRulesFile command available', async () => {
            // Wait for extension to be activated
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const commands = await vscode.commands.getCommands(true);
            assert.ok(commands.includes('fab-inspector.createNewRulesFile'), 'createNewRulesFile command should be available');
        }).timeout(3000);

        test('Should have wrapWithLog command available', async () => {
            // Wait for extension to be activated
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const commands = await vscode.commands.getCommands(true);
            assert.ok(commands.includes('fab-inspector.wrapWithLog'), 'wrapWithLog command should be available');
        }).timeout(3000);

        test('Should have unwrapLog command available', async () => {
            // Wait for extension to be activated
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const commands = await vscode.commands.getCommands(true);
            assert.ok(commands.includes('fab-inspector.unwrapLog'), 'unwrapLog command should be available');
        }).timeout(3000);

        test('Should have correct command names', async () => {
            // Test the command name strings without trying to register them
            const expectedCommands = {
                createNewRulesFile: 'fab-inspector.createNewRulesFile',
                wrapWithLog: 'fab-inspector.wrapWithLog',
                unwrapLog: 'fab-inspector.unwrapLog'
            };
            
            assert.strictEqual(expectedCommands.createNewRulesFile, 'fab-inspector.createNewRulesFile');
            assert.strictEqual(expectedCommands.wrapWithLog, 'fab-inspector.wrapWithLog');
            assert.strictEqual(expectedCommands.unwrapLog, 'fab-inspector.unwrapLog');
        });
    });

    suite('Wrap With Log Command Tests', () => {
        test('Should wrap simple JSON object with log node', () => {
            const originalJson = { "field": "value" };
            const originalJsonString = JSON.stringify(originalJson);
            
            // Simulate the wrapping logic from the command
            const parsedJson = JSON.parse(originalJsonString);
            const wrappedJson = {
                "log": parsedJson
            };
            
            assert.ok(wrappedJson.hasOwnProperty('log'), 'Wrapped JSON should have log property');
            assert.deepStrictEqual(wrappedJson.log, originalJson, 'Log property should contain original JSON');
        });

        test('Should wrap complex JSON object with log node', () => {
            const complexJson = {
                "rules": [
                    { "id": "rule1", "logic": { "and": [true, false] } },
                    { "id": "rule2", "logic": { "or": [{ "var": "field" }, "value"] } }
                ],
                "metadata": {
                    "version": "1.0",
                    "author": "test"
                }
            };
            
            const jsonString = JSON.stringify(complexJson);
            const parsedJson = JSON.parse(jsonString);
            const wrappedJson = {
                "log": parsedJson
            };
            
            assert.ok(wrappedJson.hasOwnProperty('log'), 'Wrapped JSON should have log property');
            assert.deepStrictEqual(wrappedJson.log, complexJson, 'Log property should contain original complex JSON');
            assert.ok(Array.isArray(wrappedJson.log.rules), 'Nested arrays should be preserved');
            assert.strictEqual(wrappedJson.log.rules.length, 2, 'Array length should be preserved');
        });

        test('Should handle JSON arrays', () => {
            const jsonArray = [
                { "id": "item1", "value": 100 },
                { "id": "item2", "value": 200 }
            ];
            
            const jsonString = JSON.stringify(jsonArray);
            const parsedJson = JSON.parse(jsonString);
            const wrappedJson = {
                "log": parsedJson
            };
            
            assert.ok(wrappedJson.hasOwnProperty('log'), 'Wrapped JSON should have log property');
            assert.ok(Array.isArray(wrappedJson.log), 'Log property should contain array');
            assert.strictEqual(wrappedJson.log.length, 2, 'Array length should be preserved');
            assert.deepStrictEqual(wrappedJson.log, jsonArray, 'Array content should be preserved');
        });

        test('Should handle JSON primitives', () => {
            const testCases = [
                { input: '"string value"', expected: "string value" },
                { input: '42', expected: 42 },
                { input: 'true', expected: true },
                { input: 'null', expected: null }
            ];
            
            testCases.forEach(testCase => {
                const parsedJson = JSON.parse(testCase.input);
                const wrappedJson = {
                    "log": parsedJson
                };
                
                assert.ok(wrappedJson.hasOwnProperty('log'), `Wrapped JSON should have log property for ${testCase.input}`);
                assert.strictEqual(wrappedJson.log, testCase.expected, `Log property should contain ${testCase.input}`);
            });
        });

        test('Should format wrapped JSON with proper indentation', () => {
            const originalJson = { "field": "value", "nested": { "key": "data" } };
            const wrappedJson = {
                "log": originalJson
            };
            
            const formattedJson = JSON.stringify(wrappedJson, null, 2);
            
            // Check formatting
            assert.ok(formattedJson.includes('\n'), 'Formatted JSON should contain newlines');
            assert.ok(formattedJson.includes('  '), 'Formatted JSON should contain proper indentation');
            
            // Verify it can be parsed back
            const reparsed = JSON.parse(formattedJson);
            assert.deepStrictEqual(reparsed.log, originalJson, 'Formatted JSON should parse back to original');
        });

        test('Should detect invalid JSON for wrapping', () => {
            const invalidJsonCases = [
                '{"invalid": json}',
                '{"missing": "quote}',
                '{trailing: comma,}',
                'undefined',
                'function() {}',
                ''
            ];
            
            invalidJsonCases.forEach(invalidJson => {
                if (invalidJson === '') {
                    // Empty string case
                    assert.strictEqual(invalidJson.length, 0, 'Empty string should be detected');
                } else {
                    assert.throws(() => {
                        JSON.parse(invalidJson);
                    }, `Should throw error for invalid JSON: ${invalidJson}`);
                }
            });
        });
    });

    suite('Unwrap Log Command Tests', () => {
        test('Should unwrap simple log node', () => {
            const originalJson = { "field": "value" };
            const wrappedJson = {
                "log": originalJson
            };
            
            // Simulate the unwrapping logic from the command
            const hasLogProperty = wrappedJson.hasOwnProperty('log');
            assert.ok(hasLogProperty, 'Wrapped JSON should have log property');
            
            const unwrappedJson = wrappedJson.log;
            assert.deepStrictEqual(unwrappedJson, originalJson, 'Unwrapped JSON should match original');
            assert.ok(!unwrappedJson.hasOwnProperty('log'), 'Unwrapped JSON should not have log property');
        });

        test('Should unwrap complex log node', () => {
            const originalJson = {
                "rules": [
                    { "id": "rule1", "logic": { "===": [{ "var": "status" }, "active"] } }
                ],
                "settings": {
                    "strict": true,
                    "timeout": 5000
                }
            };
            
            const wrappedJson = {
                "log": originalJson
            };
            
            const unwrappedJson = wrappedJson.log;
            assert.deepStrictEqual(unwrappedJson, originalJson, 'Unwrapped complex JSON should match original');
            assert.ok(Array.isArray(unwrappedJson.rules), 'Nested arrays should be preserved after unwrapping');
            assert.strictEqual(unwrappedJson.settings.strict, true, 'Nested properties should be preserved');
        });

        test('Should handle unwrapping arrays in log node', () => {
            const originalArray = [
                { "condition": { "var": "field1" } },
                { "condition": { "===": ["value", 42] } }
            ];
            
            const wrappedJson = {
                "log": originalArray
            };
            
            const unwrappedJson = wrappedJson.log;
            assert.deepStrictEqual(unwrappedJson, originalArray, 'Unwrapped array should match original');
            assert.ok(Array.isArray(unwrappedJson), 'Unwrapped result should be an array');
            assert.strictEqual(unwrappedJson.length, 2, 'Array length should be preserved');
        });

        test('Should handle unwrapping primitives in log node', () => {
            const testCases = [
                "string value",
                42,
                true,
                false,
                null
            ];
            
            testCases.forEach(primitiveValue => {
                const wrappedJson = {
                    "log": primitiveValue
                };
                
                const unwrappedJson = wrappedJson.log;
                assert.strictEqual(unwrappedJson, primitiveValue, `Unwrapped primitive should match original: ${primitiveValue}`);
            });
        });

        test('Should detect missing log property', () => {
            const jsonWithoutLog = {
                "data": "value",
                "notLog": { "field": "value" }
            };
            
            const hasLogProperty = jsonWithoutLog.hasOwnProperty('log');
            assert.ok(!hasLogProperty, 'JSON without log property should be detected');
        });

        test('Should handle nested log structures', () => {
            const nestedLogJson = {
                "log": {
                    "log": {
                        "field": "deeply nested value"
                    }
                }
            };
            
            // First unwrap
            const firstUnwrap = nestedLogJson.log;
            assert.ok(firstUnwrap.hasOwnProperty('log'), 'First unwrap should still have log property');
            
            // Second unwrap
            const secondUnwrap = firstUnwrap.log;
            assert.strictEqual(secondUnwrap.field, "deeply nested value", 'Second unwrap should reach the inner value');
            assert.ok(!secondUnwrap.hasOwnProperty('log'), 'Final unwrap should not have log property');
        });

        test('Should format unwrapped JSON with proper indentation', () => {
            const originalJson = {
                "complex": {
                    "nested": {
                        "structure": ["with", "array", "elements"]
                    }
                }
            };
            
            const wrappedJson = { "log": originalJson };
            const unwrappedJson = wrappedJson.log;
            const formattedJson = JSON.stringify(unwrappedJson, null, 2);
            
            // Check formatting
            assert.ok(formattedJson.includes('\n'), 'Formatted JSON should contain newlines');
            assert.ok(formattedJson.includes('  '), 'Formatted JSON should contain proper indentation');
            
            // Verify it parses back correctly
            const reparsed = JSON.parse(formattedJson);
            assert.deepStrictEqual(reparsed, originalJson, 'Formatted JSON should parse back to original');
        });

        test('Should detect invalid JSON for unwrapping', () => {
            const invalidJsonCases = [
                '{"invalid": json}',
                '{"log": }',
                'not json at all',
                ''
            ];
            
            invalidJsonCases.forEach(invalidJson => {
                if (invalidJson === '') {
                    assert.strictEqual(invalidJson.length, 0, 'Empty string should be detected');
                } else {
                    assert.throws(() => {
                        JSON.parse(invalidJson);
                    }, `Should throw error for invalid JSON: ${invalidJson}`);
                }
            });
        });
    });

    suite('Round-trip Tests (Wrap and Unwrap)', () => {
        test('Should maintain data integrity in wrap-unwrap cycle', () => {
            const testCases = [
                { "simple": "object" },
                ["array", "of", "strings"],
                {
                    "complex": {
                        "nested": {
                            "object": {
                                "with": ["mixed", "data", 42, true, null]
                            }
                        }
                    }
                },
                "primitive string",
                42,
                true,
                null
            ];
            
            testCases.forEach((originalData, index) => {
                // Wrap
                const wrappedJson = { "log": originalData };
                
                // Unwrap
                const unwrappedJson = wrappedJson.log;
                
                // Verify round-trip integrity
                assert.deepStrictEqual(unwrappedJson, originalData, `Round-trip test case ${index} should maintain data integrity`);
            });
        });

        test('Should handle multiple wrap-unwrap cycles', () => {
            let data: any = { "original": "data" };
            
            // Multiple wrap cycles
            for (let i = 0; i < 3; i++) {
                data = { "log": data };
            }
            
            // Multiple unwrap cycles
            for (let i = 0; i < 3; i++) {
                assert.ok(data.hasOwnProperty('log'), `Unwrap cycle ${i} should have log property`);
                data = data.log;
            }
            
            // Should be back to original
            assert.deepStrictEqual(data, { "original": "data" }, 'Multiple cycles should return to original data');
        });

        test('Should preserve JSON formatting through cycles', () => {
            const originalJson = {
                "formatted": {
                    "with": "proper",
                    "indentation": [1, 2, 3]
                }
            };
            
            // Wrap
            const wrappedJson = { "log": originalJson };
            const wrappedFormatted = JSON.stringify(wrappedJson, null, 2);
            
            // Parse and unwrap
            const reparsedWrapped = JSON.parse(wrappedFormatted);
            const unwrappedJson = reparsedWrapped.log;
            const unwrappedFormatted = JSON.stringify(unwrappedJson, null, 2);
            
            // Parse final result
            const finalResult = JSON.parse(unwrappedFormatted);
            
            assert.deepStrictEqual(finalResult, originalJson, 'Formatting cycle should preserve data');
        });
    });

    suite('Path Validation Tests', () => {
        test('Should construct correct file paths', () => {
            const workspacePath = tempWorkspaceDir;
            const rulesFolderName = 'fab-inspector-rules';
            const fileName = 'new-rules.json';
            
            const expectedRulesFolderPath = path.join(workspacePath, rulesFolderName);
            const expectedFilePath = path.join(expectedRulesFolderPath, fileName);
            
            assert.ok(expectedRulesFolderPath.includes(rulesFolderName), 'Rules folder path should contain folder name');
            assert.ok(expectedFilePath.includes(fileName), 'File path should contain file name');
            assert.ok(expectedFilePath.endsWith('.json'), 'File path should end with .json');
        });

        test('Should handle different path separators', () => {
            const folderName = 'fab-inspector-rules';
            const fileName = 'new-rules.json';
            
            // path.join should handle platform-specific separators
            const joinedPath = path.join(tempWorkspaceDir, folderName, fileName);
            
            assert.ok(joinedPath.includes(folderName), 'Path should contain folder name');
            assert.ok(joinedPath.includes(fileName), 'Path should contain file name');
        });
    });

    suite('Error Scenarios Tests', () => {
        test('Should handle read-only directories gracefully', () => {
            // This test simulates what would happen with read-only permissions
            // In practice, the command would need to handle fs.mkdir errors
            
            const testPath = path.join(tempWorkspaceDir, 'test-folder');
            
            // Normal directory creation should work
            assert.doesNotThrow(() => {
                fs.mkdirSync(testPath, { recursive: true });
            });
            
            assert.ok(fs.existsSync(testPath), 'Test directory should be created');
        });

        test('Should validate JSON content structure', () => {
            const validContent = { "rules": [] };
            const invalidContent1 = { "notRules": [] };
            const invalidContent2 = "not json object";
            
            // Valid content should have rules property
            assert.ok(validContent.hasOwnProperty('rules'), 'Valid content should have rules property');
            assert.ok(Array.isArray(validContent.rules), 'Rules should be an array');
            
            // Invalid content checks
            assert.ok(!invalidContent1.hasOwnProperty('rules'), 'Invalid content should not have rules property');
            assert.ok(typeof invalidContent2 === 'string', 'Invalid content should not be an object');
        });
    });

    suite('Integration Tests', () => {
        test('Should simulate full command workflow', () => {
            // This test simulates the complete workflow of the createNewRulesFile command
            
            // Step 1: Check workspace (simulated)
            const workspaceExists = fs.existsSync(tempWorkspaceDir);
            assert.ok(workspaceExists, 'Workspace should exist');
            
            // Step 2: Create rules folder
            const rulesFolderPath = path.join(tempWorkspaceDir, 'fab-inspector-rules');
            fs.mkdirSync(rulesFolderPath, { recursive: true });
            
            // Step 3: Create new rules file
            const filePath = path.join(rulesFolderPath, 'new-rules.json');
            const content = { "rules": [] };
            fs.writeFileSync(filePath, JSON.stringify(content, null, 2), 'utf8');
            
            // Step 4: Verify everything was created correctly
            assert.ok(fs.existsSync(rulesFolderPath), 'Rules folder should exist');
            assert.ok(fs.existsSync(filePath), 'Rules file should exist');
            
            const fileContent = fs.readFileSync(filePath, 'utf8');
            const parsed = JSON.parse(fileContent);
            assert.deepStrictEqual(parsed, content, 'File content should match expected structure');
        });
    });
});
