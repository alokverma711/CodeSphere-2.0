/**
 * Function Parser - Accurate static analysis of function declarations
 * Handles JS/TS, Python, Java.
 * Also extracts inline route handler bodies (for traceability of anonymous callbacks).
 */

const FunctionNode = require('../models/FunctionNode');

class FunctionParser {
  static async parseFunctions(fileContent, language, filename) {
    if (language === 'javascript' || language === 'typescript') {
      return this.parseJavaScript(fileContent, filename);
    } else if (language === 'python') {
      return this.parsePython(fileContent, filename);
    } else if (language === 'java') {
      return this.parseJava(fileContent, filename);
    }
    return [];
  }

  // ─────────────────────────────────────────────────────────────────────────
  // JavaScript / TypeScript
  // ─────────────────────────────────────────────────────────────────────────
  static parseJavaScript(content, filename) {
    const functions = [];
    const lines = content.split('\n');
    const seen = new Set();

    const add = (name, lineNum, endLine, type, params, isAsync, isExported, body) => {
      const key = `${name}@${lineNum}`;
      if (seen.has(key)) return;
      seen.add(key);
      functions.push(new FunctionNode({
        name, file: filename, line: lineNum,
        startLine: lineNum, endLine,
        type, parameters: params,
        isAsync: !!isAsync,
        scope: isExported ? 'exported' : 'private',
        bodyText: body || ''
      }));
    };

    // 1. Named function declarations: [export] [default] [async] function name(params) { }
    const funcDeclRe = /(export\s+(?:default\s+)?)?(async\s+)?function\s*\*?\s+(\w+)\s*\(([^)]*)\)/g;
    let m;
    while ((m = funcDeclRe.exec(content)) !== null) {
      const ln = this._lineAt(content, m.index);
      const end = this._findBlockEnd(lines, ln - 1);
      add(m[3], ln, end, 'function', this._params(m[4]), m[2], !!m[1],
          lines.slice(ln - 1, end).join('\n'));
    }

    // 2. Arrow / const functions: [export] const name = [async] ([params]) => { }
    const arrowRe = /(export\s+)?(?:const|let|var)\s+(\w+)\s*=\s*(async\s*)?\(([^)]*)\)\s*=>/g;
    while ((m = arrowRe.exec(content)) !== null) {
      const ln = this._lineAt(content, m.index);
      const end = this._findBlockEnd(lines, ln - 1);
      add(m[2], ln, end, 'arrow', this._params(m[4]), m[3], !!m[1],
          lines.slice(ln - 1, end).join('\n'));
    }

    // 3. Arrow without parens: const name = async x => { }
    const arrowNoParenRe = /(export\s+)?(?:const|let|var)\s+(\w+)\s*=\s*(async\s+)?(\w+)\s*=>/g;
    while ((m = arrowNoParenRe.exec(content)) !== null) {
      if (['if', 'for', 'while', 'switch', 'return', 'new'].includes(m[4])) continue;
      const ln = this._lineAt(content, m.index);
      const end = this._findBlockEnd(lines, ln - 1);
      add(m[2], ln, end, 'arrow', [m[4]], m[3], !!m[1],
          lines.slice(ln - 1, end).join('\n'));
    }

    // 4. Class / object methods: [async] name(params) { }
    const methodRe = /^[ \t]*(static\s+)?(async\s+)?(?!if|for|while|switch|function|class|return|const|let|var|throw|try|catch|new\b)([a-zA-Z_$][\w$]*)\s*\(([^)]*)\)\s*\{/gm;
    while ((m = methodRe.exec(content)) !== null) {
      const name = m[3];
      if (['constructor', 'get', 'set', 'super', 'describe', 'it', 'test', 'expect', 'beforeEach', 'afterEach'].includes(name)) continue;
      const ln = this._lineAt(content, m.index);
      const end = this._findBlockEnd(lines, ln - 1);
      add(name, ln, end, 'method', this._params(m[4]), m[2], false,
          lines.slice(ln - 1, end).join('\n'));
    }

    // 5. module.exports.name = function(){}  or  module.exports = { name: function(){} }
    const exportsRe = /module\.exports(?:\.(\w+))?\s*=\s*(?:(async)\s+)?function\s*(\w*)\s*\(([^)]*)\)/g;
    while ((m = exportsRe.exec(content)) !== null) {
      const name = m[1] || m[3] || 'exports_fn';
      const ln = this._lineAt(content, m.index);
      const end = this._findBlockEnd(lines, ln - 1);
      add(name, ln, end, 'function', this._params(m[4]), !!m[2], true,
          lines.slice(ln - 1, end).join('\n'));
    }

    // 6. Inline route handlers — critical for traceability!
    //    Captures the body of: app.get('/path', async (req, res) => { ... })
    //    Named as: __route_handler_LINE to link with EndpointParser
    const routeRe = /(?:app|router)\.(get|post|put|delete|patch|head|options|use)\s*\(\s*['"`]([^'"`]+)['"`]\s*,\s*(?:(?!(?:app|router)\.)[\s\S])*?(?:(async\s*)?\(([^)]*)\)\s*=>|(?:async\s+)?function\s*\(([^)]*)\))\s*\{/g;
    while ((m = routeRe.exec(content)) !== null) {
      const ln = this._lineAt(content, m.index);
      const end = this._findBlockEnd(lines, ln - 1);
      const routeName = `__route_${m[1]}_${ln}`;
      const isAsync = !!(m[3] || m[0].includes('async'));
      const paramsRaw = m[4] || m[5] || '';
      add(routeName, ln, end, 'route_handler', this._params(paramsRaw), isAsync, false,
          lines.slice(ln - 1, end).join('\n'));
    }

    return functions;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Python
  // ─────────────────────────────────────────────────────────────────────────
  static parsePython(content, filename) {
    const functions = [];
    const lines = content.split('\n');
    const seen = new Set();

    const funcRe = /^([ \t]*)(async\s+)?def\s+(\w+)\s*\(([^)]*)\)\s*(?:->[^:]+)?:/gm;
    let m;
    while ((m = funcRe.exec(content)) !== null) {
      const name = m[3];
      const key = `${name}@${m.index}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const indent = m[1].length;
      const ln = this._lineAt(content, m.index);
      const end = this._findPythonEnd(lines, ln - 1, indent);
      const isExported = indent === 0 && !name.startsWith('_');
      functions.push(new FunctionNode({
        name, file: filename, line: ln, startLine: ln, endLine: end,
        type: 'function', parameters: this._params(m[4]),
        isAsync: !!m[2], scope: isExported ? 'exported' : 'private',
        bodyText: lines.slice(ln - 1, end).join('\n')
      }));
    }
    return functions;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Java
  // ─────────────────────────────────────────────────────────────────────────
  static parseJava(content, filename) {
    const functions = [];
    const lines = content.split('\n');
    const seen = new Set();

    const methodRe = /(?:(?:public|private|protected|static|final|abstract|synchronized|native|\s)+)\s+([\w<>\[\],\s]+?)\s+(\w+)\s*\(([^)]*)\)\s*(?:throws\s+[\w,\s]+)?\s*\{/g;
    let m;
    while ((m = methodRe.exec(content)) !== null) {
      const name = m[2];
      if (['if', 'for', 'while', 'switch', 'catch', 'try', 'else'].includes(name)) continue;
      const key = `${name}@${m.index}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const ln = this._lineAt(content, m.index);
      const end = this._findBlockEnd(lines, ln - 1);
      functions.push(new FunctionNode({
        name, file: filename, line: ln, startLine: ln, endLine: end,
        type: 'method', parameters: this._params(m[3]),
        returnType: m[1].trim(),
        scope: m[0].includes('public') ? 'exported' : 'private',
        bodyText: lines.slice(ln - 1, end).join('\n')
      }));
    }
    return functions;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────────────────────────────────
  static _lineAt(content, idx) {
    return content.substring(0, idx).split('\n').length;
  }

  static _params(raw) {
    if (!raw || !raw.trim()) return [];
    return raw.split(',')
      .map(p => {
        // Strip type annotations: name: Type, Type name, etc.
        p = p.trim()
          .replace(/:\s*[\w<>\[\]|&?]+/g, '') // TS type annotations
          .replace(/=.+$/, '')                  // default values
          .split(/\s+/).pop().trim();
        return p;
      })
      .filter(p => p && !/^(\.\.\.)?$/.test(p) && !/^\d/.test(p));
  }

  static _findBlockEnd(lines, startLine) {
    let braces = 0, found = false;
    for (let i = startLine; i < lines.length; i++) {
      // Skip strings and comments roughly
      const line = lines[i].replace(/"[^"]*"|'[^']*'|`[^`]*`/g, '""')
                            .replace(/\/\/.*$/, '');
      for (const ch of line) {
        if (ch === '{') { found = true; braces++; }
        else if (ch === '}') { braces--; if (found && braces === 0) return i + 1; }
      }
    }
    return Math.min(startLine + 100, lines.length);
  }

  static _findPythonEnd(lines, startLine, baseIndent) {
    for (let i = startLine + 1; i < lines.length; i++) {
      const line = lines[i];
      if (line.trim() === '' || line.trim().startsWith('#')) continue;
      if (line.match(/^[ \t]*/)[0].length <= baseIndent) return i;
    }
    return lines.length;
  }
}

module.exports = FunctionParser;
