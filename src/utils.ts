export function sanitizeContent(content: string): string {
    return content.replace(/[^\w\s\-\.\/\\\(\)\[\]\{\}]/g, '');
}

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
        'cpp': 'cpp',           // Also supports 'c++'
        'cs': 'csharp',         // C#
        'go': 'go',
        'rb': 'ruby',
        'php': 'php',
        'swift': 'swift',
        'kt': 'kotlin',         // Kotlin
        'rs': 'rust',
        'scala': 'scala',
        'sh': 'bash',           // Shell scripts
        'bash': 'bash',
        'sql': 'sql',
        'pl': 'perl',           // Perl
        'r': 'r',
        'lua': 'lua',
        'groovy': 'groovy',
        'hs': 'haskell',        // Haskell
        'erl': 'erlang',        // Erlang
        'clj': 'clojure',       // Clojure
        'fs': 'fsharp',         // F#
        'vb': 'vbnet',          // Visual Basic .NET
        'asm': 'assembly',      // Assembly
        'm': 'matlab',          // MATLAB
        'jl': 'julia',          // Julia
        'pas': 'pascal',        // Pascal
        'd': 'd',               // D language
        'elm': 'elm',           // Elm
        'ex': 'elixir',         // Elixir
        'jsx': 'jsx',           // React JSX
        'tsx': 'tsx',           // TypeScript JSX
        'vue': 'vue',           // Vue.js
        'sass': 'sass',         // Sass
        'scss': 'scss',         // SCSS
        'less': 'less',         // Less
        'yml': 'yaml',          // YAML
        'yaml': 'yaml',
        'xml': 'xml',           // XML
        'toml': 'toml',         // TOML
        'ini': 'ini',           // INI files
        'bat': 'batch',         // Windows Batch
        'ps1': 'powershell',    // PowerShell
        'docker': 'dockerfile', // Dockerfile
        'make': 'makefile',     // Makefile
        'nginx': 'nginx',       // Nginx config
        'graphql': 'graphql',   // GraphQL
        'sol': 'solidity',      // Solidity (Ethereum)
        'tf': 'terraform',      // Terraform (HCL)
    };
    return languageMap[language.toLowerCase()] || language;
}

export function addLineNumbers(code: string): string {
    return code.split('\n').map((line, i) => `${i + 1} | ${line}`).join('\n');
}