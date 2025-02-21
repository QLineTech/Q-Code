# QCode - QLineTech Coding Assistant

**QCode** is a VS Code extension developed by QLineTech to enhance your coding experience with voice commands and AI-powered assistance using xAI's Grok 3 model. It allows you to analyze code, modify files, and execute custom commands—all integrated seamlessly into your development workflow.

## Features

- **Voice Commands**: Control the extension with voice input via a WebSocket server.
- **Code Analysis**: Analyze your code with Grok 3 and receive suggestions for improvement.
- **File Modification**: Automatically modify files with AI-generated content (e.g., adding comments).
- **Custom Commands**: Execute predefined actions like "Hello World" directly from the editor.
- **Configurable API Keys**: Securely integrate with xAI's Grok 3 API.

## Prerequisites

- **VS Code**: Version 1.97.0 or higher.
- **xAI API Key**: Required for Grok 3 integration (sign up at [xAI](https://x.ai)).
- **WebSocket Server**: A local server running at `ws://localhost:9001` for voice command support (see [Voice Server Setup](#voice-server-setup)).
- **Node.js**: For building and running the extension locally.

## Installation

### From VSIX File
1. Download the latest `qcode-<version>.vsix` file from the [Releases](https://github.com/your-repo/qcode/releases) page.
2. Install it in VS Code:
   ```bash
   code --install-extension qcode-<version>.vsix
   ```
3. Reload VS Code.

### From Source
1. Clone this repository:
   ```bash
   git clone https://github.com/your-repo/qcode.git
   cd qcode
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Compile the extension:
   ```bash
   npm run compile
   ```
4. Open the project in VS Code and press `F5` to launch the extension in a development window.

## Usage

### Commands
QCode provides several commands accessible via the Command Palette (`Ctrl+Shift+P`):
- **QCode: Hello World**: Displays a "Hello World" message.
- **QCode: Analyze with Grok3**: Analyzes the active editor's code and provides suggestions.
- **QCode: Modify File with Grok3**: Modifies the first TypeScript/JavaScript file in your workspace (e.g., adds a comment).

### Voice Commands
1. Start the voice server (see [Voice Server Setup](#voice-server-setup)).
2. Use the following keybindings or commands:
   - `Ctrl+Shift+R`: Start recording voice input (when not recording).
   - `Ctrl+Shift+S`: Stop recording (when recording).
3. Supported voice commands:
   - **"hello"**: Triggers the "Hello World" message.
   - **"analyze"**: Analyzes the current editor content with Grok 3.
   - **"modify"**: Modifies a file in the workspace using Grok 3.

### Configuration
Configure QCode via VS Code settings (`Ctrl+,`):
- **`qcode.apiKey`**: Your xAI API key for Grok 3 (required).
  - Example: `"qcode.apiKey": "your-api-key-here"`
- **`qcode.apiKey2`**: A secondary API key (optional).

To set these:
1. Open Settings (`File > Preferences > Settings`).
2. Search for `qcode`.
3. Enter your API key(s).

## Voice Server Setup
QCode uses a WebSocket server at `ws://localhost:9001` for voice commands. You’ll need to set up a compatible server separately. A basic example:
- **Technology**: Use Node.js with the `ws` library.
- **Functionality**: Accept `start_recording`, `stop_recording`, and `cancel_recording` actions, process audio, and return commands like `hello`, `analyze`, or `modify`.
- **Response Format**: Return JSON with `{ command, grok3Response, error, status }`.

See [example-voice-server](https://github.com/your-repo/example-voice-server) for a sample implementation (replace with your actual repo link if available).

## Development

### Building
```bash
npm run package
```
This creates a production-ready `qcode-<version>.vsix` file.

### Testing
1. Run `F5` in VS Code to launch a development instance.
2. Test commands and voice functionality with the server running.

### Dependencies
- `axios`: For API calls to Grok 3.
- `ws`: For WebSocket communication.

## Troubleshooting

- **"API key not set" Error**: Ensure `qcode.apiKey` is configured in settings.
- **WebSocket Connection Failed**: Verify the voice server is running at `ws://localhost:9001`.
- **Command Not Executed**: Check the VS Code Developer Tools console (`Help > Toggle Developer Tools`) for errors.
- **File Modification Fails**: Ensure your workspace contains `.ts` or `.js` files.

## Contributing
Contributions are welcome! Please:
1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/your-feature`).
3. Submit a pull request.

## License
See the MIT License for details.

## Contact
For support, reach out to QLineTech at [support@qlinetech.com](mailto:support@qlinetech.com).

---

### Notes
- Replace placeholders like `https://github.com/QLineTech/QCode` with your actual repository URL if you host it online.
- If you have a specific voice server implementation, link it in the "Voice Server Setup" section or provide more details.
- Adjust the version numbers and branding (e.g., QLineTech) to match your preferences.
