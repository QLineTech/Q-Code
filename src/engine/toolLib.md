## Tool Library Documentation
path: `/src/engine/toolLib.ts`

Below is the documentation for the example tools registered in `toolLib.ts`, generated using the `generateDocumentation` method.

```
### Git Status (`git_status`)
**Description**: Retrieve the status of the current Git repository.
**Categories**: git_operations
**Keywords**: git, status, repository
**Parameters**:
- None
**Usage**: Run this tool to check the status of your Git repository.
**Return Type**: string | Promise<string>

### Read File (`read_file`)
**Description**: Read the contents of a specified file.
**Categories**: file_operations
**Keywords**: file, read, contents
**Parameters**:
- `path` (string, required): The file path
**Usage**: Provide the file path to read its contents.
**Return Type**: string | Promise<string>

### Browse URL (`browse_url`)
**Description**: Open a URL in the default browser.
**Categories**: browse_operations
**Keywords**: browse, url, web
**Parameters**:
- `url` (string, required): The URL to open
**Usage**: Provide a URL to open it in your browser.
**Return Type**: string | Promise<string>

### Send Email (`send_email`)
**Description**: Send an email to a recipient.
**Categories**: mail_operations
**Keywords**: email, send, mail
**Parameters**:
- `to` (string, required): Recipient email address
- `subject` (string, required): Email subject
- `body` (string, required): Email body
**Usage**: Provide recipient, subject, and body to send an email.
**Return Type**: string | Promise<string>

### Shutdown Computer (`shutdown`)
**Description**: Shut down the computer.
**Categories**: computer_use
**Keywords**: computer, shutdown, power
**Parameters**:
- None
**Usage**: Run this tool to shut down your computer.
**Return Type**: string | Promise<string>

### Flutter Build (`flutter_build`)
**Description**: Build a Flutter project.
**Categories**: flutter_coding
**Keywords**: flutter, build, mobile
**Parameters**:
- `projectPath` (string, required): Path to Flutter project
- `target` (string, optional): Build target (e.g., apk)
**Usage**: Provide the project path and optionally a target to build.
**Return Type**: string | Promise<string>

### Evaluate JavaScript (`js_evaluate`)
**Description**: Evaluate a JavaScript expression.
**Categories**: js_coding
**Keywords**: javascript, evaluate, code
**Parameters**:
- `expression` (string, required): JS expression to evaluate
**Usage**: Provide a JavaScript expression to evaluate.
**Return Type**: string | Promise<string>
```

---

## Why This is the Best Implementation

- **Flexibility**: Supports tools for any domain (Git, files, browsing, email, coding, etc.) with extensible metadata.
- **Compatibility**: Designed to integrate perfectly with `toolUse.ts` via the `getToolsForUse` method.
- **Usability**: Rich metadata (title, usage, keywords, categories) makes tools easy to understand and search.
- **Scalability**: New tools can be added dynamically without modifying the class structure.
- **Documentation**: Auto-generated, up-to-date documentation ensures developers always know how to use the tools.
