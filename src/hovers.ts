import { IncomingHttpStatusHeader } from 'http2';
import * as vscode from 'vscode';
import * as Parser from 'web-tree-sitter';

function exampleString(examples: string[]) : vscode.MarkdownString
{
	const result = new vscode.MarkdownString();
	examples.forEach(s => result.appendCodeblock(s,'applesoft'));
	return result;
}

export class TSHoverProvider implements vscode.HoverProvider
{
	parser : Parser;
	hmap: Map<string,Array<vscode.MarkdownString>>;

	constructor(parser: Parser)
	{
		this.parser = parser;
		this.hmap = new Map<string,Array<vscode.MarkdownString>>();

		this.hmap.set("dimension",[
			new vscode.MarkdownString('dimensional number'),
			new vscode.MarkdownString('`<number> <dimension spec>`'),
			exampleString([
				'45 [deg]'])
		]);

		this.hmap.set("new",[
			new vscode.MarkdownString('create an object'),
			new vscode.MarkdownString('`new <object key> [<name>] { [directives] }`'),
			exampleString([
				'new grid { cell size = ( 0.1 , 0.1 , 0.1 ) }'])
		]);

		this.hmap.set("associative_new",[
			new vscode.MarkdownString('create an object for a previously defined object'),
			new vscode.MarkdownString('`new <object key> [<name>] for <prev name> { [directives] }`'),
			exampleString([
				'new hermite gauss \'HG00\' for \'solver\' { r0 = ( 10[um] , 10[um] ) }'])
		]);

		this.hmap.set("generate",[
			new vscode.MarkdownString('Create an object for a previously defined object.  Usually sets up a profile that is used by some other object to load matter or energy.'),
			new vscode.MarkdownString('`generate <object key> [<prev name>] { [directives] }`'),
			exampleString([
				'generate uniform \'electrons\' { density = 1e16 [/cm3] }'])
		]);

	}
	curs_to_range(curs: Parser.TreeCursor): vscode.Range
	{
		const start_pos = new vscode.Position(curs.startPosition.row,curs.startPosition.column);
		const end_pos = new vscode.Position(curs.endPosition.row,curs.endPosition.column);
		return new vscode.Range(start_pos,end_pos);
	}	
	get_hover(hover:Array<vscode.MarkdownString>,curs:Parser.TreeCursor,position:vscode.Position) : boolean
	{
		const rng = this.curs_to_range(curs);
		if (rng.contains(position))
		{
			const temp = this.hmap.get(curs.nodeType);
			if (temp)
				temp.forEach(s => hover.push(s));
			return true;
		}
		return false;
	}
	provideHover(document:vscode.TextDocument,position: vscode.Position,token: vscode.CancellationToken): vscode.ProviderResult<vscode.Hover>
	{
		const hover = new Array<vscode.MarkdownString>();
		const tree = this.parser.parse(document.getText()+"\n");
		const cursor = tree.walk();
		let recurse = true;
		let finished = false;
		do
		{
			if (recurse && cursor.gotoFirstChild())
				recurse = this.get_hover(hover,cursor,position);
			else
			{
				if (cursor.gotoNextSibling())
					recurse = this.get_hover(hover,cursor,position);
				else if (cursor.gotoParent())
					recurse = false;
				else
					finished = true;
			}
			if (hover.length>0)
				finished = true;
		} while (!finished);
		if (hover.length>0)
			return new vscode.Hover(hover,this.curs_to_range(cursor));
		else
			return undefined;
	}
}