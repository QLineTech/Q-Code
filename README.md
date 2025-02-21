# QCode - QLineTech Coding Assistant

**QCode** is a VS Code extension developed by QLineTech to enhance your coding experience with voice commands and AI-powered assistance using xAI's Grok 3 model. It enables code analysis, file modification, and custom command execution, seamlessly integrated into your development workflow.

## Features

- **Voice Commands**: Control the extension via voice input using a WebSocket server.
- **Code Analysis**: Analyze code with Grok 3 and get improvement suggestions.
- **File Modification**: Automatically modify files with AI-generated content (e.g., adding comments).
- **Custom Commands**: Run predefined actions like "Hello World" directly in the editor.
- **Configurable API Keys**: Securely integrate with xAI's Grok 3 API.

## Prerequisites

- **VS Code**: Version 1.97.0 or higher.
- **xAI API Key**: Required for Grok 3 integration (sign up at [xAI](https://x.ai)).
- **WebSocket Server**: A local server at `ws://localhost:9001` for voice commands (see [Voice Server Setup](#voice-server-setup)).
- **Node.js**: For building and running the extension locally.

## Installation

### From VSIX File
1. Download the latest `QLineTech.qcode-<version>.vsix` file from the [Releases](https://github.com/QLineTech/Q-Code/releases) page.
2. Install it in VS Code:
   ```bash
   code --install-extension QLineTech.qcode-<version>.vsix
   ```
3. Reload VS Code.

### From Source
1. Clone this repository:
   ```bash
   git clone https://github.com/QLineTech/Q-Code.git
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
4. Open the project in VS Code and press `F5` to launch in a development window.

## Usage

### Commands
QCode offers commands via the Command Palette (`Ctrl+Shift+P`):
- **QCode: Hello World**: Displays a "Hello World" message.
- **QCode: Analyze with Grok3**: Analyzes the active editor’s code and suggests improvements.
- **QCode: Modify File with Grok3**: Modifies the first TypeScript/JavaScript file in your workspace (e.g., adds a comment).

### Voice Commands
1. Start the voice server (see [Voice Server Setup](#voice-server-setup)).
2. Use these keybindings or commands:
   - `Ctrl+Shift+R`: Start recording (when not recording).
   - `Ctrl+Shift+S`: Stop recording (when recording).
3. Supported voice commands:
   - **"hello"**: Triggers the "Hello World" message.
   - **"analyze"**: Analyzes the current editor content with Grok 3.
   - **"modify"**: Modifies a file in the workspace using Grok 3.

### Configuration
Configure QCode in VS Code settings (`Ctrl+,`):
- **`qcode.apiKey`**: Your xAI API key for Grok 3 (required).
  - Example: `"qcode.apiKey": "your-api-key-here"`
- **`qcode.apiKey2`**: A secondary API key (optional).

To set these:
1. Open Settings (`File > Preferences > Settings`).
2. Search for `qcode`.
3. Enter your API key(s).

## Voice Server Setup
QCode uses a WebSocket server at `ws://localhost:9001` for voice commands. Set up a compatible server:
- **Technology**: Node.js with the `ws` library.
- **Functionality**: Handle `start_recording`, `stop_recording`, and `cancel_recording` actions, process audio, and return JSON with `{ command, grok3Response, error, status }`.
- **Example**: See [example-voice-server](https://github.com/QLineTech/Q-Code-example-voice-server) (update with your repo if available).

## Development

### Building
```bash
npm run package
```
Creates a production-ready `QLineTech.qcode-<version>.vsix` file.

### Testing
1. Press `F5` in VS Code to launch a development instance.
2. Test commands and voice functionality with the server running.

### Dependencies
- `axios`: For Grok 3 API calls.
- `ws`: For WebSocket communication.

## Troubleshooting

- **"API key not set" Error**: Ensure `qcode.apiKey` is set in settings.
- **WebSocket Connection Failed**: Verify the server is running at `ws://localhost:9001`.
- **Command Not Executed**: Check the Developer Tools console (`Help > Toggle Developer Tools`).
- **File Modification Fails**: Ensure `.ts` or `.js` files exist in your workspace.

## Contributing
Contributions are welcome!
1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/your-feature`).
3. Submit a pull request.

## License
QCode is free for non-commercial research use. Commercial use requires a paid license from QLineTech. See [LICENSE.md](LICENSE.md) for details.

## Contact
For support or commercial licensing, email [support@q-e.io](mailto:support@q-e.io) or [sales@q-e.io](mailto:sales@q-e.io).
```