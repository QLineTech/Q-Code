// src/types/project.ts

export interface FrameworkConfig {
    name: string;
    fileExtensions: string[];
    ignorePatterns: string[];
    detectIndicators: string[];
}

export interface ProjectType {
    type: string; // e.g., "flutter", "react", "custom-framework"
    confidence: number; // 0-1 scale
    indicators: string[];
}