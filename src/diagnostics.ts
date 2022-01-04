import * as vscode from 'vscode';
import * as Parser from 'web-tree-sitter';

// Apparently no standard provider, so make one up
export class TSDiagnosticProvider
{
	parser : Parser;

	constructor(parser: Parser)
	{
		this.parser = parser;
	}
	curs_to_range(curs: Parser.TreeCursor): vscode.Range
	{
		const start_pos = new vscode.Position(curs.startPosition.row,curs.startPosition.column);
		const end_pos = new vscode.Position(curs.endPosition.row,curs.endPosition.column);
		return new vscode.Range(start_pos,end_pos);
	}
	node_to_range(node: Parser.SyntaxNode): vscode.Range
	{
		const start_pos = new vscode.Position(node.startPosition.row,node.startPosition.column);
		const end_pos = new vscode.Position(node.endPosition.row,node.endPosition.column);
		return new vscode.Range(start_pos,end_pos);
	}
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
	process_node(diag: Array<vscode.Diagnostic>,curs: Parser.TreeCursor): boolean
	{
		const rng = this.curs_to_range(curs);
		if (curs.currentNode().hasError())
		{
			if (!this.is_error_inside(curs.currentNode()))
				diag.push(new vscode.Diagnostic(rng,curs.currentNode().toString(),vscode.DiagnosticSeverity.Error));
		}
		return true;
	}
	update(document : vscode.TextDocument, collection: vscode.DiagnosticCollection): void
	{
		if (document && document.languageId=='turbowave')
		{
			const diag = Array<vscode.Diagnostic>();
			const syntaxTree = this.parser.parse(document.getText()+"\n");
			const cursor = syntaxTree.walk();
			let recurse = true;
			let finished = false;
			do
			{
				if (recurse && cursor.gotoFirstChild())
					recurse = this.process_node(diag,cursor);
				else
				{
					if (cursor.gotoNextSibling())
						recurse = this.process_node(diag,cursor);
					else if (cursor.gotoParent())
						recurse = false;
					else
						finished = true;
				}
			} while (!finished);
			collection.set(document.uri, diag);
		}
		else
		{
			collection.clear();
		}
	}
}