"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DefinitionProvider = void 0;
const vscode = require("vscode");
const diag = require("./diag");
class DefinitionProvider {
    provideDefinition(document, position, token) {
        let range = document.getWordRangeAtPosition(position, /[a-zA-Z0-9]+/);
        let word = document.getText(range);
        if (diag.variables[word]) {
            let line = 0;
            while (line < document.lineCount) {
                let text = document.lineAt(line).text;
                if (text.match(word)) {
                    return new vscode.Location(document.uri, new vscode.Range(new vscode.Position(line, 0), new vscode.Position(line, text.length)));
                }
                line = line + 1;
            }
        }
        return undefined;
    }
}
exports.DefinitionProvider = DefinitionProvider;
//# sourceMappingURL=definition.js.map