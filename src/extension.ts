import * as vscode from 'vscode';
import { TSHoverProvider } from './hovers';
import { TSDiagnosticProvider } from './diagnostics';
import { TSSemanticTokensProvider, legend } from './semanticTokens';
import { TSCompletionProvider } from './completions';
import * as lxbase from './langExtBase';

/// This function runs when the extension loads.
/// It creates the parser object and sets up the providers.
export function activate(context: vscode.ExtensionContext)
{
	lxbase.TreeSitterInit().then( TSInitResult =>
	{
		const selector = { language: 'turbowave' };
		const collection = vscode.languages.createDiagnosticCollection('turbowave-file');
		const diagnostics = new TSDiagnosticProvider(TSInitResult);
		const tokens = new TSSemanticTokensProvider(TSInitResult);
		const hovers = new TSHoverProvider(TSInitResult);
		const completions = new TSCompletionProvider();
		if (vscode.window.activeTextEditor)
		{
			diagnostics.update(vscode.window.activeTextEditor.document, collection);
		}
		vscode.languages.registerDocumentSemanticTokensProvider(selector,tokens,legend);
		vscode.languages.registerHoverProvider(selector,hovers);
		vscode.languages.registerCompletionItemProvider(selector,completions);

		context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(editor =>
		{
			if (editor)
			{
				diagnostics.update(editor.document, collection);
			}
		}));
		context.subscriptions.push(vscode.workspace.onDidChangeTextDocument(editor =>
		{
			if (editor)
			{
				diagnostics.update(editor.document, collection);
			}
		}));
	});
}
