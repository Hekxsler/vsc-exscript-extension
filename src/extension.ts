import * as vscode from 'vscode';
import * as diag from './diag';
import * as compl from './completion';
import * as help from './help';
import * as hov from './hover';
import * as def from './definition';

export const connfunctions = ["authenticate", "authenticate_user", "authorize", "auto_authorize", "autoinit", "close", "exec_", "execline", "guess_os", "send", "sendline", "wait_for", "set_prompt", "set_error", "set_timeout"]
export const cryptfunctions = ["otp"]
export const filefunctions = ["chmod", "clear", "exists", "mkdir", "read", "rm", "write"]
export const ipv4functions = ["in_network", "mask", "mask2pfxlen", "pfxlen2mask", "network", "broadcast", "pfxmask", "remote_ip"]
export const listfunctions = ["new", "length", "get", "unique"]
export const sysfunctions = ["env", "execute", "message", "wait"]
export const stringfunctions = ["replace", "split", "tolower", "toupper"]

export function activate(ctx: vscode.ExtensionContext) {
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
    ctx.subscriptions.push(listener)

    //helpProvider
    let signature = vscode.languages.registerSignatureHelpProvider(
        'exscript', new help.SignatureProvider, '(', ','
    )
    ctx.subscriptions.push(signature)

    //completion
    let completion = vscode.languages.registerCompletionItemProvider(
        'exscript', {
        provideCompletionItems(document: vscode.TextDocument, position: vscode.Position) {
            const linePrefix = document.lineAt(position).text.slice(0, position.character);
            if (linePrefix.endsWith('connection.')) {
                return compl.createCompletionItems(connfunctions);
            }
            if (linePrefix.endsWith('crypt.')) {
                return compl.createCompletionItems(cryptfunctions);
            }
            if (linePrefix.endsWith('file.')) {
                return compl.createCompletionItems(filefunctions);
            }
            if (linePrefix.endsWith('ipv4.')) {
                return compl.createCompletionItems(ipv4functions);
            }
            if (linePrefix.endsWith('list.')) {
                return compl.createCompletionItems(listfunctions);
            }
            if (linePrefix.endsWith('sys.')) {
                return compl.createCompletionItems(sysfunctions);
            }
            if (linePrefix.endsWith('string.')) {
                return compl.createCompletionItems(stringfunctions);
            }
            return undefined;
        }
    },
        '.' // triggered whenever a '.' is being typed
    );
    ctx.subscriptions.push(completion)

    //hover
    let hover = vscode.languages.registerHoverProvider(
        'exscript', new hov.HoverProvider
    )
    ctx.subscriptions.push(hover)

    //definitions
    let definitions = vscode.languages.registerDefinitionProvider(
        'exscript', new def.DefinitionProvider
    )
    ctx.subscriptions.push(definitions)

}

export function deactivate() { }
