/**
 * Import Detector
 * Extracts import/require statements from source code.
 * Returns rich import objects: { name, path, isExternal, line }
 */

class ImportDetector {
  static detectImports(fileContent, language) {
    if (language === 'javascript' || language === 'typescript') {
      return this.detectJavaScriptImports(fileContent);
    } else if (language === 'python') {
      return this.detectPythonImports(fileContent);
    } else if (language === 'java') {
      return this.detectJavaImports(fileContent);
    }
    return [];
  }

  static detectJavaScriptImports(content) {
    const imports = [];
    const seen = new Set();
    const lines = content.split('\n');

    lines.forEach((rawLine, idx) => {
      const line = rawLine.trim();
      const lineNum = idx + 1;

      // ES6: import X from '...'  /  import { X, Y } from '...'  /  import '...'
      const es6Match = line.match(/^import\s+(?:(.+?)\s+from\s+)?['"`]([^'"`]+)['"`]/);
      if (es6Match) {
        const specifier = es6Match[1] || '';
        const importPath = es6Match[2];
        const key = importPath;
        if (!seen.has(key)) {
          seen.add(key);
          imports.push({
            name: this._extractImportName(specifier, importPath),
            path: importPath,
            isExternal: !importPath.startsWith('.'),
            line: lineNum,
            raw: line
          });
        }
        return;
      }

      // CommonJS: const X = require('...')  /  const { X } = require('...')
      const reqMatch = line.match(/(?:const|let|var)\s+(\{[^}]+\}|\w+)\s*=\s*require\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/);
      if (reqMatch) {
        const importPath = reqMatch[2];
        const key = importPath;
        if (!seen.has(key)) {
          seen.add(key);
          imports.push({
            name: this._extractImportName(reqMatch[1], importPath),
            path: importPath,
            isExternal: !importPath.startsWith('.'),
            line: lineNum,
            raw: line
          });
        }
        return;
      }

      // Bare require: require('...')
      const bareReq = line.match(/require\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/);
      if (bareReq) {
        const importPath = bareReq[1];
        if (!seen.has(importPath)) {
          seen.add(importPath);
          imports.push({
            name: importPath.split('/').pop(),
            path: importPath,
            isExternal: !importPath.startsWith('.'),
            line: lineNum,
            raw: line
          });
        }
      }
    });

    return imports;
  }

  static detectPythonImports(content) {
    const imports = [];
    const seen = new Set();
    const lines = content.split('\n');

    lines.forEach((rawLine, idx) => {
      const line = rawLine.trim();
      const lineNum = idx + 1;

      // from x import y
      const fromMatch = line.match(/^from\s+(\S+)\s+import\s+(.+)/);
      if (fromMatch) {
        const importPath = fromMatch[1];
        if (!seen.has(importPath)) {
          seen.add(importPath);
          imports.push({
            name: fromMatch[2].split(',')[0].trim(),
            path: importPath,
            isExternal: !importPath.startsWith('.'),
            line: lineNum,
            raw: line
          });
        }
        return;
      }

      // import x
      const importMatch = line.match(/^import\s+(\S+)/);
      if (importMatch) {
        const importPath = importMatch[1];
        if (!seen.has(importPath)) {
          seen.add(importPath);
          imports.push({
            name: importPath,
            path: importPath,
            isExternal: !importPath.startsWith('.'),
            line: lineNum,
            raw: line
          });
        }
      }
    });

    return imports;
  }

  static detectJavaImports(content) {
    const imports = [];
    const seen = new Set();
    const lines = content.split('\n');

    lines.forEach((rawLine, idx) => {
      const line = rawLine.trim();
      const lineNum = idx + 1;

      const importMatch = line.match(/^import\s+(static\s+)?([^;]+);/);
      if (importMatch) {
        const fullPath = importMatch[2].trim();
        if (!seen.has(fullPath)) {
          seen.add(fullPath);
          const parts = fullPath.split('.');
          imports.push({
            name: parts[parts.length - 1],
            path: fullPath,
            isExternal: !fullPath.startsWith('com.') && !fullPath.includes(fullPath.split('.')[0]),
            line: lineNum,
            raw: line
          });
        }
      }
    });

    return imports;
  }

  static _extractImportName(specifier, importPath) {
    if (!specifier) return importPath.split('/').pop().replace(/\.[^.]+$/, '');
    const cleaned = specifier.replace(/\{|\}/g, '').trim();
    // Return first named import
    return cleaned.split(',')[0].trim().split(' as ')[0].trim() || importPath.split('/').pop();
  }

  static detectFileRole(filename, fileContent) {
    const name = filename.toLowerCase();
    const base = name.split('/').pop(); // just the filename

    // ── TypeScript/NestJS naming convention: file.role.ts ──
    if (base.match(/\.controller\.(t|j)sx?$/)) return 'controller';
    if (base.match(/\.service\.(t|j)sx?$/)) return 'service';
    if (base.match(/\.repository\.(t|j)sx?$/) || base.match(/\.repo\.(t|j)sx?$/)) return 'repository';
    if (base.match(/\.model\.(t|j)sx?$/) || base.match(/\.schema\.(t|j)sx?$/) || base.match(/\.entity\.(t|j)sx?$/)) return 'model';
    if (base.match(/\.middleware\.(t|j)sx?$/) || base.match(/\.guard\.(t|j)sx?$/) || base.match(/\.interceptor\.(t|j)sx?$/)) return 'middleware';
    if (base.match(/\.module\.(t|j)sx?$/)) return 'config';
    if (base.match(/\.mapper\.(t|j)sx?$/)) return 'utility';
    if (base.match(/\.dto\.(t|j)sx?$/) || base.match(/\.interface\.(t|j)sx?$/) || base.match(/\.types?\.(t|j)sx?$/)) return 'model';
    if (base.match(/\.spec\.(t|j)sx?$/) || base.match(/\.test\.(t|j)sx?$/)) return 'utility';

    // ── Filename keyword patterns ──
    if (name.includes('/route') || name.includes('/controller') || name.includes('router.js') || name.includes('router.ts')) return 'controller';
    if (name.includes('/service') || name.includes('service.js') || name.includes('service.ts')) return 'service';
    if (name.includes('/repository') || name.includes('/repo/') || name.includes('repository.js')) return 'repository';
    if (name.includes('/model') || name.includes('/schema') || name.includes('/entity')) return 'model';
    if (name.includes('/middleware') || name.includes('/guard')) return 'middleware';
    if (name.includes('/util') || name.includes('/helper') || name.includes('/lib')) return 'utility';
    if (name.includes('/config') || name.includes('config.js') || name.includes('config.ts')) return 'config';
    if (name.includes('server.js') || name.includes('server.ts') || name.includes('app.js') || name.includes('app.ts') || name.endsWith('/index.js') || name.endsWith('/index.ts') || name.includes('main.js') || name.includes('main.ts')) return 'server';
    if (name.endsWith('.jsx') || name.endsWith('.tsx') || name.includes('/component')) return 'component';
    if (name.includes('/page') || name.includes('/view')) return 'page';

    // ── Content-based detection ──
    if (fileContent.includes('@RestController') || fileContent.includes('@Controller')) return 'controller';
    if (fileContent.includes('@Service') || fileContent.includes('@Injectable')) return 'service';
    if (fileContent.includes('@Repository') || fileContent.includes('@InjectRepository')) return 'repository';
    if (fileContent.includes('mongoose.Schema') || fileContent.includes('DataTypes') || fileContent.includes('@Entity') || fileContent.includes('@Column')) return 'model';
    if (fileContent.includes('router.get(') || fileContent.includes('app.get(') || fileContent.includes('router.post(') || fileContent.includes('app.post(')) return 'controller';
    if (fileContent.includes('@fastapi.route') || fileContent.includes('@app.get(') || fileContent.includes('@router.get(')) return 'controller';

    return 'utility';
  }
}

module.exports = ImportDetector;
