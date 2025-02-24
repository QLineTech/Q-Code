// src/utils/content.ts

/**
 * Sanitizes content by removing all characters except alphanumeric, whitespace, and specific punctuation.
 * @param content The content to sanitize.
 * @returns Sanitized string.
 */
export function sanitizeContent(content: string): string {
    return content.replace(/[^\w\s\-\.\/\\\(\)\[\]\{\}]/g, '');
}

/**
 * Maps file extensions to Markdown language identifiers for syntax highlighting.
 * @param language File extension or language identifier (e.g., 'ts', 'js').
 * @returns Corresponding Markdown language identifier or the input if unmapped.
 */
export function getMarkdownLanguage(language: string): string {
    const languageMap: { [key: string]: string } = {
        'ts': 'typescript',
        'js': 'javascript',
        'dart': 'dart',
        'py': 'python',
        'md': 'markdown',
        'json': 'json',
        'html': 'html',
        'css': 'css',
        'java': 'java',
        'c': 'c',
        'cpp': 'cpp',
        'cs': 'csharp',
        'go': 'go',
        'rb': 'ruby',
        'php': 'php',
        'swift': 'swift',
        'kt': 'kotlin',
        'rs': 'rust',
        'scala': 'scala',
        'sh': 'bash',
        'bash': 'bash',
        'sql': 'sql',
        'pl': 'perl',
        'r': 'r',
        'lua': 'lua',
        'groovy': 'groovy',
        'hs': 'haskell',
        'erl': 'erlang',
        'clj': 'clojure',
        'fs': 'fsharp',
        'vb': 'vbnet',
        'asm': 'assembly',
        'm': 'matlab',
        'jl': 'julia',
        'pas': 'pascal',
        'd': 'd',
        'elm': 'elm',
        'ex': 'elixir',
        'jsx': 'jsx',
        'tsx': 'tsx',
        'vue': 'vue',
        'sass': 'sass',
        'scss': 'scss',
        'less': 'less',
        'yml': 'yaml',
        'yaml': 'yaml',
        'xml': 'xml',
        'toml': 'toml',
        'ini': 'ini',
        'bat': 'batch',
        'ps1': 'powershell',
        'docker': 'dockerfile',
        'make': 'makefile',
        'nginx': 'nginx',
        'graphql': 'graphql',
        'sol': 'solidity',
        'tf': 'terraform',
    };
    return languageMap[language.toLowerCase()] || language;
}

/**
 * Adds line numbers to code content.
 * @param code The code content to number.
 * @param from Starting line number (defaults to 0).
 * @returns Code with line numbers prefixed to each line.
 */
export function addLineNumbers(code: string, from: number = 0): string {
    // Removed redundant return statement that was bypassing the logic
    return code.split('\n').map((line, i) => `${i + 1 + from} | ${line}`).join('\n');
}