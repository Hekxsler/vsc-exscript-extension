"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = exports.stringfunctions = exports.sysfunctions = exports.listfunctions = exports.ipv4functions = exports.filefunctions = exports.cryptfunctions = exports.connfunctions = void 0;
const vscode = require("vscode");
const diag = require("./diag");
const compl = require("./completion");
const help = require("./help");
const hov = require("./hover");
const def = require("./definition");
exports.connfunctions = ["authenticate", "authenticate_user", "authorize", "auto_authorize", "autoinit", "close", "exec_", "execline", "guess_os", "send", "sendline", "wait_for", "set_prompt", "set_error", "set_timeout"];
exports.cryptfunctions = ["otp"];
exports.filefunctions = ["chmod", "clear", "exists", "mkdir", "read", "rm", "write"];
exports.ipv4functions = ["in_network", "mask", "mask2pfxlen", "pfxlen2mask", "network", "broadcast", "pfxmask", "remote_ip"];
exports.listfunctions = ["new", "length", "get", "unique"];
exports.sysfunctions = ["env", "execute", "message", "wait"];
exports.stringfunctions = ["replace", "split", "tolower", "toupper"];
function activate(ctx) {
    const collection = vscode.languages.createDiagnosticCollection('go');
    //diagnose
    if (vscode.window.activeTextEditor) {
        diag.updateDiagnostics(vscode.window.activeTextEditor.document, collection);
    }
    let listener = vscode.workspace.onDidChangeTextDocument(editor => {
        if (editor) {
            diag.updateDiagnostics(editor.document, collection);
        }
    });
    ctx.subscriptions.push(listener);
    //helpProvider
    let signature = vscode.languages.registerSignatureHelpProvider('exscript', new help.SignatureProvider, '(', ',');
    ctx.subscriptions.push(signature);
    //completion
    let completion = vscode.languages.registerCompletionItemProvider('exscript', {
        provideCompletionItems(document, position) {
            const linePrefix = document.lineAt(position).text.slice(0, position.character);
            if (linePrefix.endsWith('connection.')) {
                return compl.createCompletionItems(exports.connfunctions);
            }
            if (linePrefix.endsWith('crypt.')) {
                return compl.createCompletionItems(exports.cryptfunctions);
            }
            if (linePrefix.endsWith('file.')) {
                return compl.createCompletionItems(exports.filefunctions);
            }
            if (linePrefix.endsWith('ipv4.')) {
                return compl.createCompletionItems(exports.ipv4functions);
            }
            if (linePrefix.endsWith('list.')) {
                return compl.createCompletionItems(exports.listfunctions);
            }
            if (linePrefix.endsWith('sys.')) {
                return compl.createCompletionItems(exports.sysfunctions);
            }
            if (linePrefix.endsWith('string.')) {
                return compl.createCompletionItems(exports.stringfunctions);
            }
            return undefined;
        }
    }, '.' // triggered whenever a '.' is being typed
    );
    ctx.subscriptions.push(completion);
    //hover
    let hover = vscode.languages.registerHoverProvider('exscript', new hov.HoverProvider);
    ctx.subscriptions.push(hover);
    //definitions
    let definitions = vscode.languages.registerDefinitionProvider('exscript', new def.DefinitionProvider);
    ctx.subscriptions.push(definitions);
}
exports.activate = activate;
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map