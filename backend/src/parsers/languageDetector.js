/**
 * Language Detector
 * Detects programming language based on file extension
 */

const LANGUAGE_MAP = {
  '.js': 'javascript',
  '.jsx': 'javascript',
  '.ts': 'typescript',
  '.tsx': 'typescript',
  '.py': 'python',
  '.java': 'java',
  '.go': 'go',
  '.cs': 'csharp',
  '.php': 'php',
  '.rb': 'ruby',
  '.cpp': 'cpp',
  '.c': 'c',
  '.rs': 'rust',
  '.swift': 'swift',
  '.kt': 'kotlin'
};

class LanguageDetector {
  static detectLanguage(filename) {
    const ext = filename.substring(filename.lastIndexOf('.')).toLowerCase();
    return LANGUAGE_MAP[ext] || 'unknown';
  }

  static isCodeFile(filename) {
    const language = this.detectLanguage(filename);
    return language !== 'unknown';
  }

  static getSupportedLanguages() {
    return Object.values(LANGUAGE_MAP);
  }
}

module.exports = LanguageDetector;
