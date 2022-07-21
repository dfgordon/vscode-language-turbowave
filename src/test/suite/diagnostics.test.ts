import * as vscode from 'vscode';
import * as assert from 'assert';

describe('Diagnostics', async function() {
	it('syntax error', async function() {
		const doc = await vscode.workspace.openTextDocument({content:'timestep = 1 [second]',language:'turbowave'});
		const ed = await vscode.window.showTextDocument(doc);
		if (!ed)
			assert.fail('no active text editor');
		const collections = vscode.languages.getDiagnostics();
		for (const collection of collections)
		{
			if (collection[0]!=doc.uri)
				continue;
			const diagList = collection[1];
			assert.match(diagList[0].message,/ERROR/);
		}
		while (vscode.window.activeTextEditor)
			await vscode.commands.executeCommand("workbench.action.closeActiveEditor", vscode.window.activeTextEditor.document.uri);
	});
});