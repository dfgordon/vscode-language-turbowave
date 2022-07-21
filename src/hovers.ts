import * as vscode from 'vscode';
import * as Parser from 'web-tree-sitter';
import * as lxbase from './langExtBase';

function exampleString(examples: string[]) : vscode.MarkdownString
{
	const result = new vscode.MarkdownString();
	examples.forEach(s => result.appendCodeblock(s,'applesoft'));
	return result;
}

export class TSHoverProvider extends lxbase.LangExtBase implements vscode.HoverProvider
{
	hover : vscode.Hover | undefined;
	hmap: Map<string,Array<vscode.MarkdownString>>;
	position = new vscode.Position(0,0);

	constructor(TSInitResult: [Parser,Parser.Language])
	{
		super(TSInitResult);
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
	visit_node(curs:Parser.TreeCursor) : lxbase.WalkerChoice
	{
		const rng = this.curs_to_range(curs);
		if (rng.contains(this.position))
		{
			const notes = new Array<vscode.MarkdownString>();
			const temp = this.hmap.get(curs.nodeType);
			if (temp)
				temp.forEach(s => notes.push(s));
			if (notes.length>0) {
				this.hover = new vscode.Hover(notes,rng);
				return lxbase.WalkerOptions.exit;
			}
		}
		return lxbase.WalkerOptions.gotoChild;
	}
	provideHover(document:vscode.TextDocument,position: vscode.Position,token: vscode.CancellationToken): vscode.ProviderResult<vscode.Hover>
	{
		this.position = position;
		this.hover = undefined;
		const tree = this.parser.parse(document.getText()+"\n");
		this.walk(tree,this.visit_node.bind(this));
		return this.hover;
	}
}