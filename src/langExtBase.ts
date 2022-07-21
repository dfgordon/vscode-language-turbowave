import * as vscode from 'vscode';
import Parser from 'web-tree-sitter';
import * as path from 'path';

export const WalkerOptions = {
	gotoChild: 0,
	gotoSibling: 1,
	gotoParentSibling: 2,
	exit: 3,
	abort: 4
} as const;

export type WalkerChoice = typeof WalkerOptions[keyof typeof WalkerOptions];

export async function TreeSitterInit(): Promise<[Parser,Parser.Language]>
{
	await Parser.init();
	const parser = new Parser();
	const pathToLang = path.join(__dirname,'tree-sitter-turbowave.wasm');
	const tw = await Parser.Language.load(pathToLang);
	parser.setLanguage(tw);
	return [parser,tw];
}

export class LangExtBase
{
	parser : Parser;
	tw : Parser.Language;
	foundNode : Parser.SyntaxNode | null = null;
	searchPos : vscode.Position = new vscode.Position(0,0);
	row = 0;
	col = 0;
	constructor(TSInitResult : [Parser,Parser.Language])
	{
		this.parser = TSInitResult[0];
		this.tw = TSInitResult[1];
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
	verify_document() : {ed:vscode.TextEditor,doc:vscode.TextDocument} | undefined
	{
		const textEditor = vscode.window.activeTextEditor;
		if (!textEditor)
			return undefined;
		const document = textEditor.document;
		if (!document || document.languageId!='turbowave')
			return undefined;
		return {ed:textEditor,doc:document};
	}
	parse(txt: string,append: string) : Parser.Tree
	{
		return this.parser.parse(txt+append);
	}
	walk(syntaxTree: Parser.Tree,visit: (node: Parser.TreeCursor) => WalkerChoice) : WalkerChoice
	{
		const curs = syntaxTree.walk();
		let choice : WalkerChoice = WalkerOptions.gotoChild;
		do
		{
			if (choice==WalkerOptions.gotoChild && curs.gotoFirstChild())
				choice = visit(curs);
			else if (choice==WalkerOptions.gotoParentSibling && curs.gotoParent() && curs.gotoNextSibling())
				choice = visit(curs);
			else if (choice==WalkerOptions.gotoSibling && curs.gotoNextSibling())
				choice = visit(curs);
			else if (curs.gotoNextSibling())
				choice = visit(curs);
			else if (curs.gotoParent())
				choice = WalkerOptions.gotoSibling;
			else
				choice = WalkerOptions.exit;
		} while (choice!=WalkerOptions.exit && choice!=WalkerOptions.abort);
		return choice;
	}
	visit_find(curs: Parser.TreeCursor) : WalkerChoice
	{
		// go as deep as possible to find the smallest element
		const rng = this.curs_to_range(curs);
		if (rng.contains(this.searchPos))
			this.foundNode = curs.currentNode();
		return WalkerOptions.gotoChild;
	}
	GetNodeAtPosition(document: vscode.TextDocument,position: vscode.Position,macros: Map<string,any>) : Parser.SyntaxNode | null
	{
		// this assumes the node does not span multiple lines
		this.row = position.line;
		this.col = 0;
		this.foundNode = null;
		this.searchPos = position;
		const tree = this.parse(document.lineAt(this.row).text,"\n");
		this.walk(tree,this.visit_find.bind(this));
		return this.foundNode;
	}
}