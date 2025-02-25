## `autoWeb.ts` Documentation
path: `/src/web/autoWeb.ts`

This module provides a set of utilities for automating web interactions using Playwright in TypeScript. Each function supports both session-based (with an existing `BrowserContext`) and session-less (creating a new browser instance) operations, with robust error handling.

### Functions

#### 1. `launchAndNavigate`
- **Description**: Launches a browser and navigates to a specified URL, returning the page title.
- **Parameters**:
  - `browserType: 'chromium' | 'firefox' | 'webkit'` - The browser type to launch.
  - `url: string` - The URL to navigate to.
  - `launchOptions: LaunchOptions = {}` - Optional browser launch options (e.g., `{ headless: false }`).
  - `contextOptions: BrowserContextOptions = {}` - Optional browser context options (e.g., `{ viewport: { width: 800, height: 600 } }`).
  - `browserContext?: BrowserContext` - Optional existing browser context (session).
- **Returns**: `Promise<string>` - The title of the navigated page.
- **Usage**:
  ```typescript
  // Without session
  const title = await launchAndNavigate('chromium', 'https://example.com');
  console.log(title); // "Example Domain"

  // With session
  const browser = await playwright.chromium.launch();
  const context = await browser.newContext();
  const sessionTitle = await launchAndNavigate('chromium', 'https://example.com', {}, {}, context);
  console.log(sessionTitle); // "Example Domain"
  await browser.close();
  ```

---

#### 2. `launchHeadlessOrHeadful`
- **Description**: Launches a browser in headless or headful mode and navigates to a URL, returning the page content.
- **Parameters**:
  - `browserType: 'chromium' | 'firefox' | 'webkit'` - The browser type to launch.
  - `url: string` - The URL to navigate to.
  - `headless: boolean = true` - Whether to run in headless mode (default: `true`).
  - `launchOptions: LaunchOptions = {}` - Optional browser launch options.
  - `contextOptions: BrowserContextOptions = {}` - Optional browser context options.
  - `browserContext?: BrowserContext` - Optional existing browser context (session).
- **Returns**: `Promise<string>` - The HTML content of the navigated page.
- **Usage**:
  ```typescript
  // Headless mode
  const content = await launchHeadlessOrHeadful('firefox', 'https://example.com', true);
  console.log(content); // "<html>...</html>"

  // Headful mode with session
  const browser = await playwright.chromium.launch({ headless: false });
  const context = await browser.newContext();
  const headfulContent = await launchHeadlessOrHeadful('chromium', 'https://example.com', false, {}, {}, context);
  console.log(headfulContent); // "<html>...</html>"
  await browser.close();
  ```

---

#### 3. `interactWithShadowDom`
- **Description**: Retrieves text content from a shadow DOM element on a page.
- **Parameters**:
  - `selector: string` - The CSS selector for the shadow DOM element (e.g., `'button >> css=span'`).
  - `browserType: 'chromium' | 'firefox' | 'webkit'` - The browser type to launch.
  - `launchOptions: LaunchOptions = {}` - Optional browser launch options.
  - `contextOptions: BrowserContextOptions = {}` - Optional browser context options.
  - `browserContext?: BrowserContext` - Optional existing browser context (session).
- **Returns**: `Promise<string>` - The text content of the shadow DOM element.
- **Usage**:
  ```typescript
  // Without session
  const text = await interactWithShadowDom('my-component >> css=span', 'chromium');
  console.log(text); // "Shadow DOM text"

  // With session
  const browser = await playwright.chromium.launch();
  const context = await browser.newContext();
  const shadowText = await interactWithShadowDom('my-component >> css=span', 'chromium', {}, {}, context);
  console.log(shadowText); // "Shadow DOM text"
  await browser.close();
  ```

---

#### 4. `simulateUserInteractions`
- **Description**: Simulates user interactions (e.g., clicks, typing) on a page.
- **Parameters**:
  - `actions: Array<{ type: string; selector?: string; value?: string }>` - Array of actions to perform (e.g., `[{ type: 'click', selector: 'button' }, { type: 'fill', selector: 'input', value: 'text' }]`).
  - `browserType: 'chromium' | 'firefox' | 'webkit'` - The browser type to launch.
  - `launchOptions: LaunchOptions = {}` - Optional browser launch options.
  - `contextOptions: BrowserContextOptions = {}` - Optional browser context options.
  - `browserContext?: BrowserContext` - Optional existing browser context (session).
- **Returns**: `Promise<void>` - Resolves when all actions are completed.
- **Usage**:
  ```typescript
  // Without session
  await simulateUserInteractions(
    [{ type: 'click', selector: 'button' }, { type: 'fill', selector: 'input', value: 'Hello' }],
    'chromium'
  );

  // With session
  const browser = await playwright.chromium.launch();
  const context = await browser.newContext();
  await simulateUserInteractions(
    [{ type: 'click', selector: 'button' }],
    'chromium',
    {},
    {},
    context
  );
  await browser.close();
  ```

---

#### 5. `interceptNetworkRequests`
- **Description**: Sets up network request interception for a specified URL pattern.
- **Parameters**:
  - `urlPattern: string` - The URL pattern to intercept (e.g., `'**/api/*'`).
  - `handler: (route: Route) => void` - Function to handle intercepted requests (e.g., `route => route.fulfill({ status: 200, body: 'mocked' })`).
  - `browserType: 'chromium' | 'firefox' | 'webkit'` - The browser type to launch.
  - `launchOptions: LaunchOptions = {}` - Optional browser launch options.
  - `contextOptions: BrowserContextOptions = {}` - Optional browser context options.
  - `browserContext?: BrowserContext` - Optional existing browser context (session).
- **Returns**: `Promise<void>` - Resolves when interception is set up.
- **Usage**:
  ```typescript
  // Without session
  await interceptNetworkRequests(
    '**/api/*',
    (route) => route.fulfill({ status: 200, body: 'mocked' }),
    'chromium'
  );

  // With session
  const browser = await playwright.chromium.launch();
  const context = await browser.newContext();
  await interceptNetworkRequests(
    '**/api/*',
    (route) => route.continue(),
    'chromium',
    {},
    {},
    context
  );
  await browser.close();
  ```

---

#### 6. `emulateDevice`
- **Description**: Emulates a device (e.g., mobile) and navigates to a URL, returning the page content.
- **Parameters**:
  - `deviceName: string` - The device name to emulate (e.g., `'iPhone 12'`).
  - `url: string` - The URL to navigate to.
  - `browserType: 'chromium' | 'firefox' | 'webkit'` - The browser type to launch.
  - `launchOptions: LaunchOptions = {}` - Optional browser launch options.
  - `contextOptions: BrowserContextOptions = {}` - Optional browser context options.
  - `browserContext?: BrowserContext` - Optional existing browser context (session).
- **Returns**: `Promise<string>` - The HTML content of the navigated page.
- **Usage**:
  ```typescript
  // Without session
  const content = await emulateDevice('iPhone 12', 'https://example.com', 'chromium');
  console.log(content); // "<html>...</html>"

  // With session
  const browser = await playwright.chromium.launch();
  const context = await browser.newContext();
  const deviceContent = await emulateDevice('iPhone 12', 'https://example.com', 'chromium', {}, {}, context);
  console.log(deviceContent); // "<html>...</html>"
  await browser.close();
  ```

---

### Expected Types

- **`LaunchOptions`**: Object from Playwright, e.g., `{ headless: boolean, args: string[] }`.
- **`BrowserContextOptions`**: Object from Playwright, e.g., `{ viewport: { width: number, height: number }, userAgent: string }`.
- **`BrowserContext`**: Playwright’s `BrowserContext` type, representing a browser session.
- **Action Object**: For `simulateUserInteractions`, an object with:
  - `type: string` - `'click'` or `'fill'`.
  - `selector?: string` - CSS selector (required for both actions).
  - `value?: string` - Text to input (required for `'fill'`).

---

### Notes
- **Error Handling**: All functions throw descriptive `Error` objects if operations fail (e.g., navigation timeouts, missing elements).
- **Session Management**: Provide a `browserContext` to reuse an existing session; otherwise, a new browser instance is created and closed automatically.
- **Dependencies**: Requires `playwright` installed (`npm install playwright`).
