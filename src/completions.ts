import * as vscode from 'vscode';
//import * as Parser from 'web-tree-sitter';

export class TSCompletionProvider implements vscode.CompletionItemProvider
{
	add_simple(ans: Array<vscode.CompletionItem>,simple_tok: string[])
	{
		simple_tok.forEach(s =>
		{
			ans.push(new vscode.CompletionItem(s));
		});
	}
	provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken, context: vscode.CompletionContext)
	{
		const ans = new Array<vscode.CompletionItem>();

		this.add_simple(ans,['new','generate','for','get',
		'true','false',
		'#include','#define','#ifdef','#ifndef','#else','#endif',
		'[deg]','[rad]','[mrad]','[urad]',
		'[um]','[mm]','[cm]','[m]',
		'[fs]','[ps]','[ns]','[us]','[s]',
		'[/m3]','[/cm3]','[kg/m3]','[g/cm3]','[J/m3]','[J/cm3]',
		'[eV]','[K]','[Pa]','[dynes/cm2]','[bar]','[ergs/g]','[J/kg]',
		'[cm2]','[m2]','[cm2/s]','[m2/s]',
		'[V]','[webers/m]','[G*cm]','[V/m]','[V/cm]','[T]','[G]']);

		ans.push(new vscode.CompletionItem('new <obj> <name>'));
		ans[ans.length-1].insertText = new vscode.SnippetString('new ${1:obj} ${2:name}\n{\n\t${0:block}\n}');

		ans.push(new vscode.CompletionItem('new <obj> <name> for <prev name>'));
		ans[ans.length-1].insertText = new vscode.SnippetString('new ${1:obj} ${2:name} for ${3:prev name}\n{\n\t${0:block}\n}');

		ans.push(new vscode.CompletionItem('generate <obj> <prev name>'));
		ans[ans.length-1].insertText = new vscode.SnippetString('generate ${1:obj} ${2:prev name}\n{\n\t${0:block}\n}');

		ans.push(new vscode.CompletionItem('new reaction = { formula } rate = C1 C2 C3 (T1:T2)'));
		ans[ans.length-1].insertText = new vscode.SnippetString('new reaction = { ${1:formula} } rate = ${2:C1} ${3:C2} ${4:C3} ${5:catalyst}(${6:T1}:${0:T2})');

		ans.push(new vscode.CompletionItem('new collision = <species1> <-> <species2> cross section = <sig>'));
		ans[ans.length-1].insertText = new vscode.SnippetString('new collision = ${1:species1} <-> ${2:species2} cross section = ${0:sig}');

		ans.push(new vscode.CompletionItem('new collision = <species1> <-> <species2> coulomb'));
		ans[ans.length-1].insertText = new vscode.SnippetString('new collision = ${1:species1} <-> ${0:species2} coulomb');

		return ans;
	}
}
