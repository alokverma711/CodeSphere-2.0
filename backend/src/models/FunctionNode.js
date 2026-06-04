/**
 * FunctionNode Model
 * Represents a function/method declaration in source code.
 * ID format: "path/to/file.js#functionName"
 */
class FunctionNode {
  constructor(data = {}) {
    this.id = data.id || `${data.file || ''}#${data.name || ''}`;
    this.name = data.name || '';
    this.file = data.file || '';

    this.type = data.type || 'function'; // 'function' | 'method' | 'arrow'
    this.line = data.line || 0;
    this.startLine = data.startLine || data.line || 0;
    this.endLine = data.endLine || data.line || 0;

    this.parameters = data.parameters || [];
    this.returnType = data.returnType || 'void';
    this.scope = data.scope || 'private'; // 'exported' | 'private'
    this.isAsync = data.isAsync || false;
    this.language = data.language || 'unknown';

    // Relationships (populated by traceabilityEngine.resolveCallGraph)
    this.calls = data.calls || [];     // array of FunctionNode IDs this function calls
    this.calledBy = data.calledBy || []; // array of FunctionNode IDs that call this function

    // Raw body text used for call resolution — NOT serialized to JSON
    this.bodyText = data.bodyText || '';
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      file: this.file,
      type: this.type,
      line: this.line,
      startLine: this.startLine,
      endLine: this.endLine,
      isAsync: this.isAsync,
      parameters: this.parameters,
      scope: this.scope,
      calls: this.calls,
      calledBy: this.calledBy
    };
  }
}

module.exports = FunctionNode;
