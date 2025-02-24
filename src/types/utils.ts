// src/types/utils.ts

export interface RateLimits {
    requestsPerMinute: number;      // Requests allowed per minute
    inputTokensPerMinute: number;   // Input tokens allowed per minute
    outputTokensPerMinute: number;  // Output tokens allowed per minute
    requestsPerHour?: number;       // Optional: Requests allowed per hour
    tokensPerHour?: number;         // Optional: Total tokens (input + output) per hour
    requestsPerDay?: number;        // Optional: Requests allowed per day
    inputTokensPerDay?: number;     // Optional: Input tokens allowed per day
    outputTokensPerDay?: number;    // Optional: Output tokens allowed per day
    totalRequests?: number;         // Optional: Total requests allowed (no time boundary)
    totalInputTokens?: number;      // Optional: Total input tokens allowed (no time boundary)
    totalOutputTokens?: number;     // Optional: Total output tokens allowed (no time boundary)
    provider?: string;              // Optional: Specific AI provider this applies to
}

export interface Pricing {
    inputCostPerMillionTokens: number;  // Cost per million input tokens (e.g., in USD)
    outputCostPerMillionTokens: number; // Cost per million output tokens (e.g., in USD)
    fixedCost?: number;                 // Optional: Flat fee per request (e.g., in USD)
    currency?: string;                  // Optional: Currency code (e.g., "USD", "EUR")
    provider?: string;                  // Optional: Specific AI provider this applies to
    tier?: string;                      // Optional: Pricing tier (e.g., "free", "standard", "pro")
}

export interface Cost {
    totalCost: number;           // Total cost incurred (e.g., in USD)
    inputCost: number;           // Cost for input tokens (e.g., in USD)
    outputCost: number;          // Cost for output tokens (e.g., in USD)
    inputTokens?: number;        // Optional: Number of input tokens used
    outputTokens?: number;       // Optional: Number of output tokens used
    currency?: string;           // Optional: Currency code (e.g., "USD", "EUR")
    provider?: string;           // Optional: Specific AI provider this applies to
    periodStart?: string;        // Optional: ISO timestamp for cost period start (e.g., "2025-02-24T00:00:00Z")
    periodEnd?: string;          // Optional: ISO timestamp for cost period end
}

export interface TranscriptionData {
    status: 'success' | 'pending' | 'error';  // Status of the transcription process
    transcription: string;                    // Transcribed text from voice input
    confidence?: number;                      // Optional: Confidence score (0-1)
    timestamp?: string;                       // Optional: ISO timestamp of transcription (e.g., "2025-02-24T12:00:00Z")
    errorMessage?: string;                    // Optional: Error details if status is "error"
    language?: string;                        // Optional: Language code of the transcription (e.g., "en", "fr")
}

export interface ServerMessage {
    status: string;                        // Status of the message (e.g., "connected", "transcription", "error")
    message: string;                       // Human-readable message or description
    transcription?: TranscriptionData;     // Optional: Transcription data for voice inputs
    data?: any;                            // Optional: Any additional data
    error?: string;                        // Optional: Specific error message if applicable
    timestamp?: string;                    // Optional: ISO timestamp of the message (e.g., "2025-02-24T12:00:00Z")
    source?: string;                       // Optional: Origin of the message (e.g., "server", "client")
}