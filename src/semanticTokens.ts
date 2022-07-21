import * as vscode from 'vscode';
import * as Parser from 'web-tree-sitter';
import * as lxbase from './langExtBase';

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

export class TSSemanticTokensProvider extends lxbase.LangExtBase implements vscode.DocumentSemanticTokensProvider
{
	builder = new vscode.SemanticTokensBuilder(legend);
	visit_node(curs: Parser.TreeCursor): lxbase.WalkerChoice
	{
		const rng = this.curs_to_range(curs);
		if (curs.nodeType=="comment")
		{
			if (rng.isSingleLine)
				this.builder.push(rng,"comment");
			else
				for (let l=rng.start.line;l<=rng.end.line;l++) {
					let start = new vscode.Position(l,0);
					let end = new vscode.Position(l,1000);
					if (l==rng.start.line)
						start = rng.start;
					if (l==rng.end.line)
						end = rng.end;
					this.builder.push(new vscode.Range(start,end),"comment");
				}
			return lxbase.WalkerOptions.gotoSibling;
		}
		if (["#include","#define","#ifdef","#ifndef","#else","#endif"].includes(curs.nodeText))
		{
			this.builder.push(rng,"keyword",["declaration"]);
			return lxbase.WalkerOptions.gotoSibling;
		}
		if (["new","associative_new","generate","get","reaction","collision"].includes(curs.nodeType))
		{
			const lead_tok = curs.currentNode().firstChild;
			if (lead_tok)
			{
				this.builder.push(this.node_to_range(lead_tok),"keyword");
				let next_tok = lead_tok.nextSibling;
				while (next_tok)
				{
					if (next_tok.type=="for")
						this.builder.push(this.node_to_range(next_tok),"keyword");
					next_tok = next_tok.nextSibling;
				}
			}
			return lxbase.WalkerOptions.gotoChild;
		}
		if (curs.nodeType=="dimension")
		{
			this.builder.push(rng,"type");
			return lxbase.WalkerOptions.gotoSibling;
		}
		if (curs.nodeType=="string_literal")
		{
			this.builder.push(rng,"string");
			return lxbase.WalkerOptions.gotoSibling;
		}
		if (curs.nodeType=="boolean")
		{
			this.builder.push(rng,"variable",["readonly"]);
			return lxbase.WalkerOptions.gotoSibling;
		}
		if (["define_key","define_ref"].includes(curs.nodeType))
		{
			this.builder.push(rng,"variable");
			return lxbase.WalkerOptions.gotoSibling;
		}
		if (curs.nodeType=="decimal")
		{
			this.builder.push(rng,"number");
			return lxbase.WalkerOptions.gotoSibling;
		}
		return lxbase.WalkerOptions.gotoChild;
	}
	provideDocumentSemanticTokens(document:vscode.TextDocument): vscode.ProviderResult<vscode.SemanticTokens>
	{
		this.builder = new vscode.SemanticTokensBuilder(legend);
		const tree = this.parser.parse(document.getText()+"\n");
		this.walk(tree,this.visit_node.bind(this));
		return this.builder.build();
	}
}