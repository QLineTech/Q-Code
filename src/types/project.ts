// src/types/project.ts

export interface FrameworkConfig {
    name: string;                    // e.g., "flutter", "react"
    fileExtensions: string[];        // e.g., ["dart"], ["jsx", "tsx"]
    ignorePatterns: string[];        // e.g., ["build", "*.log"]
    detectIndicators: string[];      // e.g., ["pubspec.yaml"], ["package.json"]
    commands?: string[];             // Optional: Supported command names (e.g., "runFlutterPubGet")
    templatePath?: string;           // Optional: Path to framework-specific prompt templates
}

export interface ProjectType {
    type: string;                    // e.g., "flutter", "react"
    confidence: number;              // 0-1 scale
    indicators: string[];            // Files/patterns detected (e.g., "pubspec.yaml")
    rootPath?: string;               // Optional: Project root directory
    detectedAt?: string;             // Optional: ISO timestamp of detection (e.g., "2025-02-24T12:00:00Z")
}