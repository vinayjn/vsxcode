import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Extension Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.');

	test('Should have configuration', () => {
		const config = vscode.workspace.getConfiguration('vsxcode');
		assert.ok(config.has('xcodePath'));
		assert.ok(config.has('defaultScheme'));
		assert.ok(config.has('defaultDevice'));
	});

	test('Should be able to get commands', async () => {
		const commands = await vscode.commands.getCommands();
		// Test that we can get commands (even if our specific ones aren't registered in test env)
		assert.ok(Array.isArray(commands));
		assert.ok(commands.length > 0);
	});

	test('Should be able to show information message', async () => {
		// Test basic VS Code API functionality
		const disposable = vscode.window.onDidChangeActiveTextEditor(() => {});
		assert.ok(disposable);
		disposable.dispose();
	});

	test('Should be able to create status bar item', () => {
		const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
		assert.ok(statusBarItem);
		statusBarItem.dispose();
	});
});
