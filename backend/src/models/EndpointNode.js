/**
 * EndpointNode Model
 * Represents an API endpoint declaration.
 * ID format: "METHOD:/path" (e.g. "POST:/api/auth/login")
 */
class EndpointNode {
  constructor(data = {}) {
    this.method = data.method || 'GET';
    this.path = data.path || '';
    this.id = data.id || `${this.method}:${this.path}`;

    this.handlerFile = data.handlerFile || '';
    this.handlerLine = data.handlerLine || 0;
    this.handlerFunction = data.handlerFunction || ''; // name of the function that handles this route
    this.handlerFunctionId = data.handlerFunctionId || ''; // full ID: file#funcName (resolved after parsing)

    this.framework = data.framework || null; // 'express' | 'fastapi' | 'flask' | 'spring'

    this.middleware = data.middleware || [];

    // Populated by traceabilityEngine.resolveEndpointCallChains
    this.callChain = data.callChain || []; // ordered list of function IDs from handler → leaf

    // Populated by traceabilityEngine.buildSequences
    this.sequence = data.sequence || null; // { steps[], branches[] }
  }

  toJSON() {
    return {
      id: this.id,
      method: this.method,
      path: this.path,
      handlerFile: this.handlerFile,
      handlerLine: this.handlerLine,
      handlerFunction: this.handlerFunction,
      handlerFunctionId: this.handlerFunctionId,
      framework: this.framework,
      callChain: this.callChain,
      middleware: this.middleware
    };
  }
}

module.exports = EndpointNode;
