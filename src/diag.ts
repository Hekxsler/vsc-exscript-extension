import * as vscode from 'vscode'
import * as main from './extension'

export var variables: { [name: string]: string } = {
    "__hostname__": "builtin",
    "__response__": "builtin"
}
const functions: { [key: string]: string[] } = {
    "connection": main.connfunctions,
    "crypt": main.cryptfunctions,
    "file": main.filefunctions,
    "ipv4": main.ipv4functions,
    "list": main.listfunctions,
    "sys": main.sysfunctions,
    "string": main.stringfunctions
}
const keywords = /(append|else|end|extract|fail|if|loop|try)/
let missingEnds: number = 0

function createDiagError(message: string, range: vscode.Range): { range: vscode.Range, message: string, severity: vscode.DiagnosticSeverity } {
    return {
        message: message,
        range: range,
        severity: vscode.DiagnosticSeverity.Error,
    }
}

function argAmountDiagError(should: number, has: number, range: vscode.Range) {
    if (should > has) return createDiagError('Too many arguments. Expected ' + should + ' but got ' + has, range)
    return createDiagError('Missing argument(s). Expected ' + should + ' but got ' + has, range)
}


function getRange(y: number, line: string, string: string): vscode.Range {
    if (!string) string = line
    let index = line.indexOf(string)
    return new vscode.Range(new vscode.Position(y, index), new vscode.Position(y, index + string.length))
}


function testRegex(regex: string): boolean {
    try {
        new RegExp(regex)
        return true
    } catch {
        return false
    }
}

function testArgList(list: string, content_type: any, lineNo: number, line: string) {
    let errors = []
    if (!Array.isArray(list)) {
        errors.push(createDiagError('Value must be a list.', getRange(lineNo, line, list)))
    } else if (content_type && list.length > 0) {
        list.forEach((e) => {
            if (typeof e != content_type) {
                errors.push(createDiagError('List must only contain ' + content_type + 's.', getRange(lineNo, line, list)))
                return
            }
        })
    }
    return errors
}

function testArgInt(number: string, lineNo: number, line: string) {
    let errors = []
    if (!Number.isInteger(number)) {
        errors.push(createDiagError('Value must be a number.', getRange(lineNo, line, number)))
    }
    return errors
}


function testArgStr(str: string, lineNo: number, line: string) {
    let errors = []
    let regex = /".+(?<![^\\]\\)"/
    if (!regex.test(str)) {
        errors.push(createDiagError('Value must be a string.', getRange(lineNo, line, str)))
    }
    return errors
}


function testArgRegex(regex: string, lineNo: number, line: string) {
    let errors = []
    if (!testRegex(regex)) {
        errors.push(createDiagError('Invalid regular expression.', getRange(lineNo, line, regex)))
    }
    return errors
}


function diagConnectionLib(func: string, args: string[], lineNo: number, line: string) {
    let errors: vscode.Diagnostic[] = []
    let minargs = 0
    let maxargs = 0

    switch (func) {
        case "authenticate_user":
            maxargs = 2
            if (args.length > 0) {
                errors.concat(testArgStr(args[0], lineNo, line))
            }
            if (args.length == 2) {
                errors.concat(testArgStr(args[1], lineNo, line))
            }
            break
        case "authorize":
        case "auto_authorize":
            maxargs = 1
            if (args.length > 0) {
                errors.concat(testArgStr(args[0], lineNo, line))
            }
            break
        case "exec_":
        case "execline":
        case "send":
        case "sendline":
            errors.concat(testArgStr(args[0], lineNo, line))
            minargs = 1
            maxargs = 1
            break
        case "wait_for":
            minargs = 1
        case "set_prompt":
        case "set_error":
            maxargs = 1
            if (args.length > 0) {
                errors.concat(testArgRegex(args[0], lineNo, line))
            }
            break
        case "set_timeout":
            minargs = 1
            maxargs = 1
            if (args.length > 0) {
                errors.concat(testArgInt(args[0], lineNo, line))
            }
    }

    errors.push(argAmountDiagError(minargs, args.length, getRange(lineNo, line, args[maxargs - 1])))
    errors.push(argAmountDiagError(maxargs, args.length, getRange(lineNo, line, func)))
    return errors
}


function diagCryptLib(func: string, args: string[], lineNo: number, line: string) {
    let errors: vscode.Diagnostic[] = []
    let minargs = 0
    let maxargs = 0

    switch (func) {
        case "otp":
            minargs = 3
            maxargs = 3
            errors.concat(testArgStr(args[0], lineNo, line))
            errors.concat(testArgStr(args[1], lineNo, line))
            errors.concat(testArgInt(args[2], lineNo, line))
    }

    errors.push(argAmountDiagError(minargs, args.length, getRange(lineNo, line, args[maxargs - 1])))
    errors.push(argAmountDiagError(maxargs, args.length, getRange(lineNo, line, func)))
    return errors
}


function diagFileLib(func: string, args: string[], lineNo: number, line: string) {
    let errors: vscode.Diagnostic[] = []
    let minargs = 0
    let maxargs = 0

    switch (func) {
        case "chmod":
            minargs = 2
            maxargs = 2
            errors.concat(testArgStr(args[0], lineNo, line))
            errors.concat(testArgInt(args[1], lineNo, line))
            break
        case "clear":
        case "exists":
        case "read":
        case "rm":
            minargs = 1
            maxargs = 1
            errors.concat(testArgStr(args[0], lineNo, line))
            break
        case "mkdir":
            minargs = 1
            maxargs = 2
            errors.concat(testArgStr(args[0], lineNo, line))
            errors.concat(testArgInt(args[1], lineNo, line))
            break
        case "write":
            minargs = 2
            maxargs = 3
            errors.concat(testArgStr(args[0], lineNo, line))
            errors.concat(testArgStr(args[1], lineNo, line))
            if (args.length == 2) {
                errors.concat(testArgInt(args[2], lineNo, line))
            }
    }

    errors.push(argAmountDiagError(minargs, args.length, getRange(lineNo, line, args[maxargs - 1])))
    errors.push(argAmountDiagError(maxargs, args.length, getRange(lineNo, line, func)))
    return errors
}



function diagIpv4Lib(func: string, args: string[], lineNo: number, line: string) {
    let errors: vscode.Diagnostic[] = []
    let minargs = 0
    let maxargs = 0

    switch (func) {
        case "pfxmask":
            minargs = 2
            maxargs = 2
            errors.concat(testArgStr(args[0], lineNo, line))
            errors.concat(testArgInt(args[1], lineNo, line))
            break
        case "mask2pfxlen":
        case "remote_ip":
        case "network":
        case "broadcast":
            minargs = 1
            maxargs = 1
            errors.concat(testArgStr(args[0], lineNo, line))
            break
        case "pfxlen2mask":
            minargs = 1
            maxargs = 1
            errors.concat(testArgInt(args[0], lineNo, line))
            break
        case "in_network":
            minargs = 2
            maxargs = 3
            errors.concat(testArgStr(args[0], lineNo, line))
            errors.concat(testArgStr(args[1], lineNo, line))
            if (args.length == 3) {
                errors.concat(testArgInt(args[2], lineNo, line))
            }
            break
        case "mask":
            minargs = 2
            maxargs = 2
            errors.concat(testArgStr(args[0], lineNo, line))
            errors.concat(testArgStr(args[1], lineNo, line))
    }

    errors.push(argAmountDiagError(minargs, args.length, getRange(lineNo, line, args[maxargs - 1])))
    errors.push(argAmountDiagError(maxargs, args.length, getRange(lineNo, line, func)))
    return errors
}


function diagListLib(func: string, args: string[], lineNo: number, line: string) {
    let errors: vscode.Diagnostic[] = []
    let minargs = 0
    let maxargs = 0

    switch (func) {
        case "length":
            minargs = 1
            maxargs = 1
            errors.concat(testArgList(args[0], false, lineNo, line))
            break
        case "get":
            minargs = 2
            maxargs = 2
            errors.concat(testArgList(args[0], String, lineNo, line))
            errors.concat(testArgList(args[1], String, lineNo, line))
            break
        case "unique":
            minargs = 1
            maxargs = 1
            errors.concat(testArgList(args[0], String, lineNo, line))
            break
    }

    errors.push(argAmountDiagError(minargs, args.length, getRange(lineNo, line, args[maxargs - 1])))
    errors.push(argAmountDiagError(maxargs, args.length, getRange(lineNo, line, func)))
    return errors
}


function diagSysLib(func: string, args: string[], lineNo: number, line: string) {
    let errors: vscode.Diagnostic[] = []
    let minargs = 0
    let maxargs = 0

    switch (func) {
        case "env":
        case "execute":
        case "message":
            minargs = 1
            maxargs = 1
            errors.concat(testArgStr(args[0], lineNo, line))
            break
        case "wait":
            minargs = 1
            maxargs = 1
            errors.concat(testArgInt(args[0], lineNo, line))
            break
    }

    errors.push(argAmountDiagError(minargs, args.length, getRange(lineNo, line, args[maxargs - 1])))
    errors.push(argAmountDiagError(maxargs, args.length, getRange(lineNo, line, func)))
    return errors
}


function diagStringLib(func: string, args: string[], lineNo: number, line: string) {
    let errors: vscode.Diagnostic[] = []
    let minargs = 0
    let maxargs = 0

    switch (func) {
        case "split":
            minargs++
            maxargs++
            errors.concat(testArgStr(args[2], lineNo, line))
        case "split":
            minargs++
            maxargs++
            errors.concat(testArgStr(args[1], lineNo, line))
        case "tolower":
        case "toupper":
            minargs++
            maxargs++
            errors.concat(testArgStr(args[0], lineNo, line))
    }

    errors.push(argAmountDiagError(minargs, args.length, getRange(lineNo, line, args[maxargs - 1])))
    errors.push(argAmountDiagError(maxargs, args.length, getRange(lineNo, line, func)))
    return errors
}


function diagCodeLine(trimmed: string, lineNo: number, line: string) {
    let errors: vscode.Diagnostic[] = []
    const stdlibs = /^(connection|crypt|file|ipv4|list|sys|string)/
    const builtin = /^__(hostname|response)__/
    const regexRe = new RegExp(/\/.+(?<![^\\]\\)\//)
    const exp1Re = /".+(?<![^\\]\\)"|(?:\w+ ?[\+\-\*\/] ?)*\w+/
    const exp2Re = new RegExp(exp1Re.source + '|' + regexRe.source)

    //register created variables
    let varRe: RegExp = new RegExp(/(\w+) ?= ?/ + '|' + exp2Re.source)
    let match = trimmed.match(varRe)
    if (match && match.length == 3) {
        if (builtin.test(match[1])) {
            errors.push(createDiagError('Invalid variable name. "' + match[1] + '" is not allowed.', getRange(lineNo, line, match[1])))
        } else {
            variables[match[1]] = match[2]
        }
        return errors
    }

    //control keywords
    if (keywords.test(trimmed)) {
        let args = trimmed.split(" ")
        let range1 = getRange(lineNo, line, args[1])
        let rangeT = getRange(lineNo, line, trimmed)
        switch (args[0]) {
            case "append":
                let appendRe = /^append \S+ to \S+$/
                if (!appendRe.test(trimmed)) {
                    errors.push(createDiagError('Invalid syntax. Syntax: append <var0> to <var1>', rangeT))
                } else if (!variables[args[1]]) {
                    errors.push(createDiagError('Variable not declared.', range1))
                } else if (!variables[args[3]]) {
                    errors.push(createDiagError('Variable not declared.', getRange(lineNo, line, args[3])))
                }
                break
            case "else":
                if (args.length != 1) {
                    if (args[1] == "if") {
                        args.shift()
                        errors.concat(diagCodeLine(args.join(" "), lineNo, line))
                    } else {
                        errors.push(createDiagError('Invalid syntax. Expected "if" or }.', range1))
                    }
                }
                break
            case "end":
                if (args.length != 1) {
                    errors.push(createDiagError('Invalid syntax. Expected }.', range1))
                }
                break
            case "extract":
                let extractRe = /^extract \/(?<regex>.+)(?<![^\\]\\)\/ (into|as) (?<vars>\w+(, \w+)*)( from (?<from>\w+))?$/
                let match = trimmed.match(extractRe)
                if (match && match.groups) {
                    let regex = match.groups['regex']
                    let rangeR = getRange(lineNo, line, regex)
                    let vars = match.groups['vars'].split(/, ?/)
                    if (!testRegex(regex)) {
                        errors.push(createDiagError('Invalid regular expression.', rangeR))
                    } else {
                        let num_groups = (new RegExp(regex.toString() + '|')).exec('');
                        if (num_groups && (vars.length != num_groups.length - 2 || num_groups.length - 2 == 0)) {
                            errors.push(createDiagError('Invalid extraction. Got ' + num_groups + ' groups but ' + vars.length + ' variable(s).', rangeR))
                        }
                        vars.forEach(varname => {
                            varname.replace(",", "").trim()
                            if (!variables[varname]) {
                                errors.push(createDiagError('Variable not declared.', getRange(lineNo, line, varname)))
                            }
                        });
                        if (!variables[match.groups['from']]) {
                            errors.push(createDiagError('Variable not declared.', getRange(lineNo, line, match.groups['from'])))
                        }
                    }
                } else {
                    errors.push(createDiagError('Invalid syntax. Syntax: extract <regex> into <var>', rangeT))
                }
                break
            case "fail":
                args.shift()
                errors.concat(testArgStr(args.join(" "), lineNo, line))
                break
            case "if":
                let opRe = /(?<op>(?:not )?in|is(?: not)?|[gl]te?|matches)/
                let ifRe = new RegExp(/^if /+'((?:not )?'+exp1Re.source+' '+opRe.source+' '+exp2Re.source+'( (?:and|or) )?)+')
        }
        return errors
    }

    //stdlib functions
    if (stdlibs.test(trimmed)) {
        let statement = trimmed.split(".")
        let func = statement[1].split("(")
        let args: string[] = []
        if (func.length > 1) {
            args = func[1].slice(0, -1).split(/, ?/)
        }
        if (!functions[statement[0]].includes(func[0])) {
            errors.push(createDiagError('Invalid function. "' + statement[0] + '" has no function "' + func[0] + '"', getRange(lineNo, line, func[0])))
        }
        switch (statement[0]) {
            case "connection":
                errors.concat(diagConnectionLib(func[0], args, lineNo, line))
                break
            case "crypt":
                errors.concat(diagCryptLib(func[0], args, lineNo, line))
                break
            case "file":
                errors.concat(diagFileLib(func[0], args, lineNo, line))
                break
            case "ipv4":
                errors.concat(diagIpv4Lib(func[0], args, lineNo, line))
                break
            case "list":
                errors.concat(diagListLib(func[0], args, lineNo, line))
                break
            case "sys":
                errors.concat(diagSysLib(func[0], args, lineNo, line))
                break
            case "string":
                errors.concat(diagStringLib(func[0], args, lineNo, line))
        }
    }

    return errors
}


export function updateDiagnostics(document: vscode.TextDocument, collection: vscode.DiagnosticCollection): void {
    let errors: vscode.Diagnostic[] = []
    let openBlock: boolean = false

    collection.clear()
    for (let lineNo = 0; lineNo < document.lineCount - 1; lineNo++) {
        const line = document.lineAt(lineNo).text

        let trimmed = line.trimStart()
        if (line.length == trimmed.length) {
            continue
        }

        //check open code blocks
        if (!openBlock && trimmed.match(/{$/)) {
            openBlock = true
            continue
        }
        if (openBlock) {
            errors.concat(diagCodeLine(trimmed, lineNo, line))
            continue
        }

        //check used variables
        let varRe: RegExp = /(?<= )\$(\w+)/g
        let vars = [...trimmed.matchAll(varRe)]
        if (vars) {
            vars.forEach(match => {
                let variable = match[1]
                if (!variables[variable]) {
                    errors.push(createDiagError('Variable ' + variable + ' is not defined.', getRange(lineNo, line, variable)))
                }
            });
        }

        //inline created variables
        let varblock: RegExp = /{ ?(\w+) ?= ?(\S+) ?}/

        //check for inline code
        if (!openBlock && (trimmed.match(/{(append|else|end|extract|fail|if|loop|try)/) && trimmed.match(/}$/)) || trimmed.match(varblock)) {
            trimmed = trimmed.slice(trimmed.indexOf("{")).slice(0, -1)
            errors.concat(diagCodeLine(trimmed, lineNo, line))
            continue
        }

        if (trimmed.match(/}$/)) openBlock = false
    }

    collection.set(document.uri, errors)
}