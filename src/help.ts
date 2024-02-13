import * as vscode from 'vscode';
import * as docstringjson from './docstring.json';
import * as paramjson from './params.json';

const docstrings: { [func: string]: { [arg: string]: string } } = docstringjson
const params: { [func: string]: { [arg: string]: { [key: string]: string } } } = paramjson

export class SignatureProvider implements vscode.SignatureHelpProvider {
    public provideSignatureHelp(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken) {
        let signature = new vscode.SignatureHelp();
        let lineUntil = document.getText(new vscode.Range(new vscode.Position(position.line, 0), position)).trim()
        let func = lineUntil.split("(")[0].split(".");
        let docstring: string = docstrings[func[0]][func[1]]
        let label = func[0] + "." + func[1] + "("
        let paraminfos = []

        if (docstring) {
            let args: { [key: string]: string } = params[func[0]][func[1]]
            for (let key in args) {
                let value = args[key];
                label = label + key + ", "
                paraminfos.push(new vscode.ParameterInformation(key, value))
            }

            label = label.replace(/(, )$/, "") + ")"
            let info = new vscode.SignatureInformation(label, new vscode.MarkdownString(docstring))
            info.parameters = paraminfos

            let activeParam = lineUntil.match(",")?.length
            info.activeParameter = activeParam ? activeParam : 0

            signature.signatures.push(info)
            return signature;
        }

        return undefined;
    }
}