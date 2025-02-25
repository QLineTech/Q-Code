# `ToolUse` Class Documentation
path: `/src/ai/toolUse.ts`

The `ToolUse` class enables tool use (function calling) across multiple AI providers (Anthropic, xAI's Grok, OpenAI, Groq, Ollama) using the `QCodeAIProvider` from `ai.ts`. It manages conversation history, executes tools, and returns AI responses with associated costs.

## Class Overview

- **Constructor**: `ToolUse(context: ExtensionContext)`
  - Initializes the class with a VS Code extension context and predefined tools.
  - **Parameters**:
    - `context`: `ExtensionContext` - The VS Code extension context for accessing settings and state.
  - **Usage**: `const toolUse = new ToolUse(context);`

## Public Methods

### `queryWithTools(prompt: string, provider?: keyof QCodeSettings['aiModels']): Promise<{ result: string; raw: any; cost: { sum: number; inputCost: number; outputCost: number } }>`

- **Description**: Queries the AI with a prompt, handling tool calls iteratively until a final response is received.
- **Parameters**:
  - `prompt`: `string` - The user's input to start the conversation (e.g., "What time is it?").
  - `provider`: `keyof QCodeSettings['aiModels']` (optional, default: `'grok3'`) - The AI provider to use (e.g., `'grok3'`, `'openai'`, `'anthropic'`).
- **Returns**: `Promise<{ result: string; raw: any; cost: { sum: number; inputCost: number; outputCost: number } }>`
  - `result`: `string` - The final text response from the AI.
  - `raw`: `any` - The raw API response for debugging or further processing.
  - `cost`: `{ sum: number; inputCost: number; outputCost: number }` - Cost details in USD:
    - `sum`: Total cost.
    - `inputCost`: Cost of input tokens.
    - `outputCost`: Cost of output tokens.
- **Usage**:
  ```typescript
  const toolUse = new ToolUse(context);
  const response = await toolUse.queryWithTools('Add 5 and 3', 'openai');
  console.log(response.result); // "8"
  ```
- **Expected Types**:
  - `prompt`: Non-empty string.
  - `provider`: One of `'grok3' | 'openai' | 'ollama' | 'groq' | 'anthropic'`.

## Private Methods

### `makeApiCall(provider: keyof QCodeSettings['aiModels']): Promise<{ text: string; raw: any; cost: { sum: number; inputCost: number; outputCost: number } }>`

- **Description**: Makes an API call to the specified provider with the current conversation history.
- **Parameters**:
  - `provider`: `keyof QCodeSettings['aiModels']` - The AI provider (e.g., `'grok3'`).
- **Returns**: A promise resolving to an object with raw response and cost data (text is empty for internal use).
- **Expected Types**:
  - `provider`: Matches keys in `QCodeSettings['aiModels']`.

### `constructPayload(provider: string, model: string, maxTokens: number, temperature: number): any`

- **Description**: Constructs the API payload based on the provider’s requirements and available tools.
- **Parameters**:
  - `provider`: `string` - The AI provider name.
  - `model`: `string` - The model to use (e.g., `'gpt-3.5-turbo'`).
  - `maxTokens`: `number` - Maximum tokens for the response (e.g., `4096`).
  - `temperature`: `number` - Sampling temperature (e.g., `0` for deterministic output).
- **Returns**: `any` - The payload object formatted for the provider’s API.
- **Expected Types**:
  - `provider`: String matching supported providers.
  - `model`: Non-empty string.
  - `maxTokens`: Positive integer.
  - `temperature`: Number between 0 and 1 (typically).

### `getHeaders(provider: string, apiKey: string): Record<string, string>`

- **Description**: Generates HTTP headers for the API request.
- **Parameters**:
  - `provider`: `string` - The AI provider.
  - `apiKey`: `string` - The API key for authentication.
- **Returns**: `Record<string, string>` - Headers object (e.g., `{ 'Authorization': 'Bearer key' }`).
- **Expected Types**:
  - `provider`: String matching supported providers.
  - `apiKey`: Non-empty string.

### `parseResponse(raw: any, provider: string): Message`

- **Description**: Parses the raw API response into a `Message` object.
- **Parameters**:
  - `raw`: `any` - The raw API response.
  - `provider`: `string` - The AI provider.
- **Returns**: `Message` - A structured message with `role`, `content`, and optional fields.
- **Expected Types**:
  - `raw`: Object from API response.
  - `provider`: String matching supported providers.

### `detectToolCall(message: Message, provider: string): { name: string; args: any; id?: string } | null`

- **Description**: Detects if the message contains a tool call and extracts details.
- **Parameters**:
  - `message`: `Message` - The assistant’s response message.
  - `provider`: `string` - The AI provider.
- **Returns**: `{ name: string; args: any; id?: string } | null` - Tool call details or null if none detected.
  - `name`: Tool name (e.g., `'get_current_time'`).
  - `args`: Arguments for the tool (e.g., `{ time_zone: 'America/New_York' }`).
  - `id`: Optional tool call ID (for Anthropic).
- **Expected Types**:
  - `message`: Conforms to `Message` type.
  - `provider`: String matching supported providers.

### `executeTool(toolCall: { name: string; args: any; id?: string }, provider: string): Promise<Message>`

- **Description**: Executes the specified tool and formats the result as a `Message`.
- **Parameters**:
  - `toolCall`: `{ name: string; args: any; id?: string }` - Tool call details.
  - `provider`: `string` - The AI provider.
- **Returns**: `Promise<Message>` - The tool result or error as a message.
- **Expected Types**:
  - `toolCall.name`: Non-empty string matching a defined tool.
  - `toolCall.args`: Object matching tool parameters.
  - `toolCall.id`: Optional string (for Anthropic).
  - `provider`: String matching supported providers.

### `extractText(content: Message['content']): string`

- **Description**: Extracts plain text from a message’s content.
- **Parameters**:
  - `content`: `Message['content']` - String or array of content objects.
- **Returns**: `string` - Concatenated text content.
- **Expected Types**:
  - `content`: String or array of `{ type: string; text?: string; ... }`.

### `getPricing(provider: string, model: string): { inputCostPerMillion: number; outputCostPerMillion: number } | null`

- **Description**: Retrieves pricing information for the provider and model (placeholder).
- **Parameters**:
  - `provider`: `string` - The AI provider.
  - `model`: `string` - The model name.
- **Returns**: `{ inputCostPerMillion: number; outputCostPerMillion: number } | null` - Pricing per million tokens or null if unavailable.
- **Expected Types**:
  - `provider`: String matching supported providers.
  - `model`: Non-empty string.

## Defined Tools

- **`get_current_time`**:
  - **Description**: Returns the current time, optionally in a specified timezone.
  - **Parameters**: `{ time_zone?: string }` - Optional timezone (e.g., `'America/New_York'`).
  - **Returns**: `string` - ISO string or localized time (e.g., `'2025-02-25T12:00:00Z'`).

- **`add_numbers`**:
  - **Description**: Adds two numbers.
  - **Parameters**: `{ a: number; b: number }` - Two numbers to add.
  - **Returns**: `string` - Sum as a string (e.g., `'8'`).

## Usage Example

```typescript
import { ToolUse } from './toolUse';
import { ExtensionContext } from 'vscode';

async function run(context: ExtensionContext) {
    const toolUse = new ToolUse(context);
    const result = await toolUse.queryWithTools('What’s the time in London?', 'grok3');
    console.log(result.result); // e.g., "2025-02-25T12:00:00 GMT"
    console.log(result.cost.sum); // e.g., 0.002 (USD)
}
```

## Notes

- **Type Safety**: Ensure `context` is a valid `ExtensionContext` and `prompt` is non-empty.
- **Provider Support**: Limited to `'grok3'`, `'openai'`, `'ollama'`, `'groq'`, `'anthropic'`.
- **Cost Calculation**: `getPricing` is a placeholder; replace with actual logic from `ai.ts` for accurate costs.
