import { GitDiffChange } from "./types";

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

export function addLineNumbers(code: string, from:number = 0): string {
    return code.split('\n').map((line, i) => `${i + 1 + from} | ${line}`).join('\n');
}


function applyGitDiff(original: string, diff: string): string {
    const lines = original.split('\n');
    const diffLines = diff.split('\n');
    let currentOriginalLine = 0;
    let currentNewLine = 0;
    let inHunk = false;
    let oldStart, oldCount, newStart, newCount;

    for (const diffLine of diffLines) {
        if (diffLine.startsWith('@@')) {
            const match = diffLine.match(/@@ -(\d+),(\d+) \+(\d+),(\d+) @@/);
            if (match) {
                oldStart = parseInt(match[1]) - 1; // 0-based index
                oldCount = parseInt(match[2]);
                newStart = parseInt(match[3]) - 1; // 0-based index
                newCount = parseInt(match[4]);
                currentOriginalLine = oldStart;
                currentNewLine = newStart;
                inHunk = true;
            }
        } else if (inHunk) {
            if (diffLine.startsWith('+')) {
                lines.splice(currentNewLine, 0, diffLine.substr(1));
                currentNewLine++;
            } else if (diffLine.startsWith('-')) {
                if (currentOriginalLine < lines.length) {
                    lines.splice(currentOriginalLine, 1);
                }
                currentOriginalLine++;
            } else if (diffLine.startsWith(' ')) {
                currentOriginalLine++;
                currentNewLine++;
            }
        }
    }

    return lines.join('\n');
}

export function parseGitDiffResponse(response: string): GitDiffChange[] {
    let cleanedResponse = response.trim();
    cleanedResponse = cleanedResponse.replace(/```(?:json|diff)?\s*\n?/g, '').replace(/```\s*$/, '');

    const jsonStart = cleanedResponse.indexOf('[');
    const jsonEnd = cleanedResponse.lastIndexOf(']') + 1;
    if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        cleanedResponse = cleanedResponse.slice(jsonStart, jsonEnd);
    } else {
        throw new Error('No valid JSON array found in the response');
    }

    let parsed: unknown;
    try {
        parsed = JSON.parse(cleanedResponse);
    } catch (error) {
        throw new Error(`Failed to parse AI response as JSON: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    if (!Array.isArray(parsed)) {
        throw new Error('AI response must be a JSON array');
    }

    return parsed.map((change: unknown, index: number) => {
        if (typeof change !== 'object' || change === null) {
            throw new Error(`Item at index ${index} must be a JSON object`);
        }

        const obj = change as Record<string, unknown>;

        const file = typeof obj.file === 'string' ? obj.file : '';
        if (!file) {
            throw new Error(`"file" at index ${index} must be a non-empty string`);
        }

        const diff = typeof obj.diff === 'string' ? obj.diff : '';
        if (!diff) {
            throw new Error(`"diff" at index ${index} must be a non-empty string`);
        }

        if (!diff.includes('@@')) {
            throw new Error(`"diff" at index ${index} must contain a valid git diff hunk header (e.g., "@@ -1,3 +1,4 @@")`);
        }

        return { file, diff } as GitDiffChange;
    });
}