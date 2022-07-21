import * as vscode from 'vscode';
import * as Parser from 'web-tree-sitter';
import * as lxbase from './langExtBase';

// Apparently no standard provider, so make one up
export class TSDiagnosticProvider extends lxbase.LangExtBase
{
	diag = new Array<vscode.Diagnostic>();
	is_error_inside(node: Parser.SyntaxNode): boolean
	{
		let child = node.firstChild;
		if (child)
		{
			do
			{
				if (child.hasError())
					return true;
				child = child.nextNamedSibling;
			} while (child);
		}
		return false;
	}
	visit_node(curs: Parser.TreeCursor): lxbase.WalkerChoice
	{
		const rng = this.curs_to_range(curs);
		if (curs.currentNode().hasError())
		{
			if (!this.is_error_inside(curs.currentNode()))
				this.diag.push(new vscode.Diagnostic(rng,curs.currentNode().toString(),vscode.DiagnosticSeverity.Error));
		}
		return lxbase.WalkerOptions.gotoChild;
	}
	update(document : vscode.TextDocument, collection: vscode.DiagnosticCollection): void
	{
		if (document && document.languageId=='turbowave')
		{
			this.diag = new Array<vscode.Diagnostic>();
			const syntaxTree = this.parser.parse(document.getText()+"\n");
			this.walk(syntaxTree,this.visit_node.bind(this));
			collection.set(document.uri, this.diag);
		}
	}
}