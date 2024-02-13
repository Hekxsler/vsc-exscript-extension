import * as vscode from 'vscode';

export function createCompletionItems(list: Array<string>): Array<vscode.CompletionItem> {
    let array: vscode.CompletionItem[] = [];
    list.forEach(e => {
        array.push(new vscode.CompletionItem(e, vscode.CompletionItemKind.Method));
    })
    return array;
}