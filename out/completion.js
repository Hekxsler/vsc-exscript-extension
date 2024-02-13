"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCompletionItems = void 0;
const vscode = require("vscode");
function createCompletionItems(list) {
    let array = [];
    list.forEach(e => {
        array.push(new vscode.CompletionItem(e, vscode.CompletionItemKind.Method));
    });
    return array;
}
exports.createCompletionItems = createCompletionItems;
//# sourceMappingURL=completion.js.map