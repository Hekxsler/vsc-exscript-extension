"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SignatureProvider = void 0;
const vscode = require("vscode");
const docstringjson = require("./docstring.json");
const paramjson = require("./params.json");
const docstrings = docstringjson;
const params = paramjson;
class SignatureProvider {
    provideSignatureHelp(document, position, token) {
        let signature = new vscode.SignatureHelp();
        let lineUntil = document.getText(new vscode.Range(new vscode.Position(position.line, 0), position)).trim();
        let func = lineUntil.split("(")[0].split(".");
        let docstring = docstrings[func[0]][func[1]];
        let label = func[0] + "." + func[1] + "(";
        let paraminfos = [];
        if (docstring) {
            let args = params[func[0]][func[1]];
            for (let key in args) {
                let value = args[key];
                label = label + key + ", ";
                paraminfos.push(new vscode.ParameterInformation(key, value));
            }
            label = label.replace(/(, )$/, "") + ")";
            let info = new vscode.SignatureInformation(label, new vscode.MarkdownString(docstring));
            info.parameters = paraminfos;
            let activeParam = lineUntil.match(",")?.length;
            info.activeParameter = activeParam ? activeParam : 0;
            signature.signatures.push(info);
            return signature;
        }
        return undefined;
    }
}
exports.SignatureProvider = SignatureProvider;
//# sourceMappingURL=help.js.map