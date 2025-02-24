// src/types/file.ts

export interface CodeChange {
    file: string;
    relativePath: string | null;
    line: number | null;
    position: number | null;
    finish_line: number | null;
    finish_position: number | null;
    action: 'add' | 'replace' | 'remove' | 'create' | 'remove_file';
    reason: string;
    newCode: string;
}

export interface GitDiffChange {
    file: string;
    diff: string;
}