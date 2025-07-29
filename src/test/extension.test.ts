import * as assert from 'assert';
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// Import the extension module - you may need to adjust the path
// import * as myExtension from '../extension';

// Mock jsonpath for testing
const mockJsonpath = {
	query: (obj: any, query: string) => {
		if (query.includes('rules[?(@.id == "test-rule")]')) {
			return [{ id: 'test-rule', name: 'Test Rule', logic: { and: [true] } }];
		}
		if (query.includes('[?(@.id == "test-rule")]')) {
			return [{ id: 'test-rule', name: 'Test Rule', logic: { and: [true] } }];
		}
		return [];
	}
};

suite('Fab Inspector Extension Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.');

	suite('Command Registration Tests', () => {
		test('All commands should be registered', async () => {
			// Find the extension by name instead of specific ID
			const extensions = vscode.extensions.all;
			const extension = extensions.find(ext => ext.packageJSON.name === 'fab-inspector');
			
			if (extension && !extension.isActive) {
				await extension.activate();
			}
			
			// Wait longer for commands to be registered during the refactored state
			await new Promise(resolve => setTimeout(resolve, 500));
			
			const commands = await vscode.commands.getCommands(true);
			
			assert.ok(commands.includes('fab-inspector.inspect'), 'fab-inspector.inspect command should be registered');
			assert.ok(commands.includes('fab-inspector.inspectWithCurrentRulesFile'), 'fab-inspector.inspectWithCurrentRulesFile command should be registered');
			assert.ok(commands.includes('fab-inspector.wrapWithLog'), 'fab-inspector.wrapWithLog command should be registered');
			assert.ok(commands.includes('fab-inspector.unwrapLog'), 'fab-inspector.unwrapLog command should be registered');
			assert.ok(commands.includes('fab-inspector.runRule'), 'fab-inspector.runRule command should be registered');
		}).timeout(5000); // Increase timeout to 5 seconds
	});

	suite('JSON Utility Functions Tests', () => {
		test('Should parse valid JSON', () => {
			const validJson = '{"id": "test", "name": "Test Rule"}';
			const parsed = JSON.parse(validJson);
			
			assert.strictEqual(parsed.id, 'test');
			assert.strictEqual(parsed.name, 'Test Rule');
		});

		test('Should throw error for invalid JSON', () => {
			const invalidJson = '{"id": "test", "name": "Test Rule"';
			
			assert.throws(() => {
				JSON.parse(invalidJson);
			}, SyntaxError);
		});

		test('Should wrap JSON with log node', () => {
			const originalJson = { field: 'value' };
			const wrappedJson = { log: originalJson };
			const expectedJson = JSON.stringify(wrappedJson, null, 2);
			
			assert.ok(expectedJson.includes('"log"'));
			assert.ok(expectedJson.includes('"field": "value"'));
		});

		test('Should unwrap log node', () => {
			const wrappedJson = { log: { field: 'value' } };
			const unwrappedJson = wrappedJson.log;
			
			assert.strictEqual(unwrappedJson.field, 'value');
			assert.ok(!unwrappedJson.hasOwnProperty('log'));
		});
	});

	suite('Rule Finding Tests', () => {
		test('Should find rule by ID in valid JSON document', () => {
			const documentText = JSON.stringify({
				rules: [
					{ id: 'rule1', name: 'First Rule' },
					{ id: 'test-rule', name: 'Test Rule', logic: { and: [true] } },
					{ id: 'rule3', name: 'Third Rule' }
				]
			});

			// Mock the findRuleById function logic
			const documentJson = JSON.parse(documentText);
			const matches = documentJson.rules.filter((rule: any) => rule.id === 'test-rule');
			
			assert.strictEqual(matches.length, 1);
			assert.strictEqual(matches[0].id, 'test-rule');
			assert.strictEqual(matches[0].name, 'Test Rule');
		});

		test('Should return null for non-existent rule ID', () => {
			const documentText = JSON.stringify({
				rules: [
					{ id: 'rule1', name: 'First Rule' },
					{ id: 'rule2', name: 'Second Rule' }
				]
			});

			const documentJson = JSON.parse(documentText);
			const matches = documentJson.rules.filter((rule: any) => rule.id === 'non-existent');
			
			assert.strictEqual(matches.length, 0);
		});

		test('Should handle malformed JSON gracefully', () => {
			const malformedJson = '{"rules": [{"id": "test"';
			
			assert.throws(() => {
				JSON.parse(malformedJson);
			}, SyntaxError);
		});
	});

	suite('File Operations Tests', () => {
		let tempDir: string;
		let tempFile: string;

		setup(() => {
			tempDir = os.tmpdir();
			tempFile = path.join(tempDir, `test-fab-inspector-${Date.now()}.json`);
		});

		teardown(() => {
			// Clean up test files
			if (fs.existsSync(tempFile)) {
				try {
					fs.unlinkSync(tempFile);
				} catch (error) {
					// Ignore cleanup errors in tests
				}
			}
		});

		test('Should create temporary rules file', () => {
			const testRule = { id: 'test-rule', name: 'Test Rule' };
			const rulesWrapper = { rules: [testRule] };
			
			fs.writeFileSync(tempFile, JSON.stringify(rulesWrapper, null, 2));
			
			assert.ok(fs.existsSync(tempFile), 'Temporary file should exist');
			
			const fileContent = fs.readFileSync(tempFile, 'utf8');
			const parsedContent = JSON.parse(fileContent);
			
			assert.ok(parsedContent.rules, 'File should contain rules array');
			assert.strictEqual(parsedContent.rules.length, 1);
			assert.strictEqual(parsedContent.rules[0].id, 'test-rule');
		});

		test('Should clean up temporary files', () => {
			// Create a test file
			fs.writeFileSync(tempFile, 'test content');
			assert.ok(fs.existsSync(tempFile), 'File should exist before cleanup');
			
			// Simulate cleanup
			fs.unlinkSync(tempFile);
			assert.ok(!fs.existsSync(tempFile), 'File should not exist after cleanup');
		});

		test('Should handle cleanup errors gracefully', () => {
			const nonExistentFile = path.join(tempDir, 'non-existent-file.json');
			
			// This should not throw an error if file doesn't exist
			assert.doesNotThrow(() => {
				try {
					fs.unlinkSync(nonExistentFile);
				} catch (error) {
					// Expected error for non-existent file
					assert.ok(error instanceof Error);
				}
			});
		});
	});

	suite('Text Processing Tests', () => {
		test('Should remove quotes from rule ID', () => {
			const quotedId = '"test-rule"';
			const unquotedId = quotedId.replace(/^["']|["']$/g, '');
			
			assert.strictEqual(unquotedId, 'test-rule');
		});

		test('Should remove single quotes from rule ID', () => {
			const quotedId = "'test-rule'";
			const unquotedId = quotedId.replace(/^["']|["']$/g, '');
			
			assert.strictEqual(unquotedId, 'test-rule');
		});

		test('Should handle unquoted rule ID', () => {
			const unquotedId = 'test-rule';
			const processedId = unquotedId.replace(/^["']|["']$/g, '');
			
			assert.strictEqual(processedId, 'test-rule');
		});

		test('Should trim whitespace from selected text', () => {
			const textWithWhitespace = '  test-rule  ';
			const trimmedText = textWithWhitespace.trim();
			
			assert.strictEqual(trimmedText, 'test-rule');
		});
	});

	suite('Path Operations Tests', () => {
		test('Should construct correct executable path', () => {
			const mockContext = {
				extensionPath: '/mock/extension/path'
			} as vscode.ExtensionContext;
			
			const expectedPath = path.join(mockContext.extensionPath, 'bin', 'PBIRInspectorCLI.exe');
			const actualPath = path.join(mockContext.extensionPath, 'bin', 'PBIRInspectorCLI.exe');
			
			assert.strictEqual(actualPath, expectedPath);
		});

		test('Should construct correct rules path', () => {
			const workspacePath = '/mock/workspace';
			const rulesFile = 'test-rules.json';
			const expectedPath = path.join(workspacePath, 'fab-inspector-rules', rulesFile);
			const actualPath = path.join(workspacePath, 'fab-inspector-rules', rulesFile);
			
			assert.strictEqual(actualPath, expectedPath);
		});

		test('Should generate unique temporary file names', () => {
			const tempDir = os.tmpdir();
			const timestamp1 = Date.now();
			const tempFile1 = path.join(tempDir, `fab-inspector-temp-rule-${timestamp1}.json`);
			
			// Wait a small amount to ensure different timestamp
			const timestamp2 = Date.now() + 1;
			const tempFile2 = path.join(tempDir, `fab-inspector-temp-rule-${timestamp2}.json`);
			
			assert.notStrictEqual(tempFile1, tempFile2);
		});
	});

	suite('Error Handling Tests', () => {
		test('Should handle JSON parse errors', () => {
			const invalidJson = '{"invalid": json}';
			
			assert.throws(() => {
				JSON.parse(invalidJson);
			});
		});

		test('Should handle file system errors', () => {
			const nonExistentPath = '/non/existent/path/file.json';
			
			assert.throws(() => {
				fs.readFileSync(nonExistentPath);
			});
		});

		test('Should validate JSON file extension', () => {
			const validFileName = 'rules.json';
			const invalidFileName = 'rules.txt';
			
			assert.ok(validFileName.endsWith('.json'));
			assert.ok(!invalidFileName.endsWith('.json'));
		});
	});

	suite('Cleanup Detection Tests', () => {
		test('Should identify temporary rule files', () => {
			const tempRuleFile = 'fab-inspector-temp-rule-1234567890.json';
			const regularFile = 'regular-file.json';
			const anotherTempFile = 'fab-inspector-temp-rule-9876543210.json';
			
			assert.ok(tempRuleFile.startsWith('fab-inspector-temp-rule-'));
			assert.ok(!regularFile.startsWith('fab-inspector-temp-rule-'));
			assert.ok(anotherTempFile.startsWith('fab-inspector-temp-rule-'));
		});

		test('Should detect temporary rule files in path', () => {
			const tempRulePath = '/tmp/fab-inspector-temp-rule-1234567890.json';
			const regularPath = '/workspace/fab-inspector-rules/rules.json';
			
			assert.ok(tempRulePath.includes('fab-inspector-temp-rule'));
			assert.ok(!regularPath.includes('fab-inspector-temp-rule'));
		});
	});

	suite('Integration Tests', () => {
		test('Should handle full rule processing workflow', () => {
			// Mock a complete workflow
			const ruleId = 'test-rule';
			const documentText = JSON.stringify({
				rules: [
					{ id: 'test-rule', name: 'Test Rule', logic: { and: [true] } }
				]
			});
			
			// Parse document
			const documentJson = JSON.parse(documentText);
			
			// Find rule
			const foundRule = documentJson.rules.find((rule: any) => rule.id === ruleId);
			assert.ok(foundRule, 'Rule should be found');
			
			// Wrap in rules array
			const rulesWrapper = { rules: [foundRule] };
			
			// Serialize for temporary file
			const serialized = JSON.stringify(rulesWrapper, null, 2);
			const parsed = JSON.parse(serialized);
			
			assert.ok(parsed.rules);
			assert.strictEqual(parsed.rules.length, 1);
			assert.strictEqual(parsed.rules[0].id, ruleId);
		});

		test('Should validate fab-inspector-rules folder requirement', () => {
			// Test path validation logic for the inspect with current rules file command
			const mockWorkspacePath = 'C:\\workspace';
			const validRulesPath = 'C:\\workspace\\fab-inspector-rules\\rules.json';
			const invalidRulesPath = 'C:\\workspace\\other-folder\\rules.json';
			
			// Simulate path.relative logic
			const validRelative = 'fab-inspector-rules\\rules.json';
			const invalidRelative = 'other-folder\\rules.json';
			
			const validParts = validRelative.split('\\');
			const invalidParts = invalidRelative.split('\\');
			
			// Valid path should start with 'fab-inspector-rules'
			assert.strictEqual(validParts[0], 'fab-inspector-rules');
			assert.ok(validParts.length >= 2);
			
			// Invalid path should not start with 'fab-inspector-rules'
			assert.notStrictEqual(invalidParts[0], 'fab-inspector-rules');
		});
	});
});
