import * as vscode from 'vscode';
import * as diag from './diag';


export class DefinitionProvider implements vscode.DefinitionProvider {
    public provideDefinition(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): vscode.ProviderResult<vscode.Definition | vscode.LocationLink[]> {
        let range = document.getWordRangeAtPosition(position, /[a-zA-Z0-9]+/)
        let word = document.getText(range)

        if (diag.variables[word]) {
            let line = 0
            while (line < document.lineCount) {
                let text = document.lineAt(line).text
                if (text.match(word)) {
                    return new vscode.Location(
                        document.uri, new vscode.Range(new vscode.Position(line, 0), new vscode.Position(line, text.length))
                    );
                }
                line = line + 1
            }
        }

        return undefined;
    }
}