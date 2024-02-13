"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HoverProvider = void 0;
const vscode = require("vscode");
const docstringjson = require("./docstring.json");
const paramjson = require("./params.json");
const docstrings = docstringjson;
const params = paramjson;
class HoverProvider {
    provideHover(document, position, token) {
        let range = document.getWordRangeAtPosition(position, /[a-zA-Z0-9_]+/);
        let line = document.lineAt(position.line).text.trim();
        let word = document.getText(range);
        let stdlib = line.split(".")[0];
        let docstring = docstrings[stdlib][word];
        let construct = "";
        if (docstring) {
            let parameters = [];
            let args = params[stdlib][word];
            for (let key in args) {
                let value = args[key];
                parameters.push(key);
                docstring = docstring + `\n\n\n\`` + key + `\` - ` + value;
            }
            construct = "(method) " + stdlib + "." + word + "(" + parameters.join(", ") + ")";
        }
        if (construct) {
            let hover = new vscode.Hover([{ language: 'js', value: construct }, new vscode.MarkdownString(docstring)]);
            return hover;
        }
        return undefined;
    }
}
exports.HoverProvider = HoverProvider;
//# sourceMappingURL=hover.js.map