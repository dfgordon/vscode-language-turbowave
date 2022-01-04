import * as vscode from 'vscode';
import * as Parser from 'web-tree-sitter';

const tokenTypes = [
	'comment', 'string', 'keyword', 'number', 'regexp', 'operator', 'namespace',
	'type', 'struct', 'class', 'interface', 'enum', 'typeParameter', 'function',
	'method', 'decorator', 'macro', 'variable', 'parameter', 'property', 'label'
];
const tokenModifiers = [
	'declaration', 'documentation', 'readonly', 'static', 'abstract', 'deprecated',
	'modification', 'async'
];

export const legend = new vscode.SemanticTokensLegend(tokenTypes,tokenModifiers);

export class TSSemanticTokensProvider implements vscode.DocumentSemanticTokensProvider
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
	process_node(builder: vscode.SemanticTokensBuilder,curs: Parser.TreeCursor): boolean
	{
		const rng = this.curs_to_range(curs);
		if (curs.nodeType=="comment")
		{
			builder.push(rng,"comment",[]);
			return false;
		}
		if (["#include","#define","#ifdef","#ifndef","#else","#endif"].indexOf(curs.nodeText)>-1)
		{
			builder.push(rng,"keyword",["declaration"]);
			return false;
		}
		if (["new","associative_new","generate","get"].indexOf(curs.nodeType)>-1)
		{
			const lead_tok = curs.currentNode().firstChild;
			if (lead_tok)
			{
				builder.push(this.node_to_range(lead_tok),"keyword",[]);
				let next_tok = lead_tok.nextSibling;
				while (next_tok)
				{
					if (next_tok.type=="for")
						builder.push(this.node_to_range(next_tok),"keyword",[]);
					next_tok = next_tok.nextSibling;
				}
			}
			return true;
		}
		if (curs.nodeType=="dimension")
		{
			builder.push(rng,"type",[]);
			return false;
		}
		if (curs.nodeType=="string_literal")
		{
			builder.push(rng,"string",[]);
			return false;
		}
		if (curs.nodeType=="boolean")
		{
			builder.push(rng,"variable",["readonly"]);
			return false;
		}
		if (["define_key","define_ref"].indexOf(curs.nodeType)>-1)
		{
			builder.push(rng,"variable",[]);
			return false;
		}
		if (curs.nodeType=="decimal")
		{
			builder.push(rng,"number",[]);
			return false;
		}
		return true;
	}
	provideDocumentSemanticTokens(document:vscode.TextDocument): vscode.ProviderResult<vscode.SemanticTokens>
	{
		const tokensBuilder = new vscode.SemanticTokensBuilder(legend);
		const tree = this.parser.parse(document.getText()+"\n");
		const cursor = tree.walk();
		let recurse = true;
		let finished = false;
		do
		{
			if (recurse && cursor.gotoFirstChild())
				recurse = this.process_node(tokensBuilder,cursor);
			else
			{
				if (cursor.gotoNextSibling())
					recurse = this.process_node(tokensBuilder,cursor);
				else if (cursor.gotoParent())
					recurse = false;
				else
					finished = true;
			}
		} while (!finished);

		return tokensBuilder.build();
	}
}