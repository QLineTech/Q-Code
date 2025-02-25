import * as playwright from 'playwright';
import { Browser, BrowserContext, Page, BrowserType, LaunchOptions, BrowserContextOptions, Route, TimeoutError } from 'playwright';

/**
 * Utility function to launch a browser with specific error handling.
 * @param browserType The type of browser to launch ('chromium', 'firefox', 'webkit').
 * @param options Launch options for the browser.
 * @returns A promise that resolves to the launched browser.
 * @throws Error with specific message if browser launch fails.
 */
async function launchBrowser(browserType: 'chromium' | 'firefox' | 'webkit', options: LaunchOptions = {}): Promise<Browser> {
    try {
        const browserLauncher: BrowserType = playwright[browserType];
        return await browserLauncher.launch(options);
    } catch (error) {
        if (error.message.includes('ECONNREFUSED')) {
            throw new Error(`Browser launch failed: ${browserType} connection refused. Check if browser binaries are installed.`);
        }
        throw new Error(`Failed to launch ${browserType} browser: ${error.message}`);
    }
}

/**
 * Utility function to create a new browser context with specific error handling.
 * @param browser The browser instance.
 * @param options Options for the browser context.
 * @returns A promise that resolves to the new browser context.
 * @throws Error with specific message if context creation fails.
 */
async function createContext(browser: Browser, options: BrowserContextOptions = {}): Promise<BrowserContext> {
    try {
        return await browser.newContext(options);
    } catch (error) {
        throw new Error(`Failed to create browser context: ${error.message}`);
    }
}

/**
 * Utility function to create a new page within a context with specific error handling.
 * @param context The browser context.
 * @returns A promise that resolves to the new page.
 * @throws Error with specific message if page creation fails.
 */
async function createPage(context: BrowserContext): Promise<Page> {
    try {
        return await context.newPage();
    } catch (error) {
        throw new Error(`Failed to create new page: ${error.message}`);
    }
}

// Feature 1: Cross-Browser Support
/**
 * Launches a specified browser type and navigates to a URL, with or without an existing session.
 * @param browserType The type of browser to launch ('chromium', 'firefox', 'webkit').
 * @param url The URL to navigate to.
 * @param launchOptions Optional launch options for the browser.
 * @param contextOptions Optional options for the browser context.
 * @param browserContext Optional existing browser context (session). If not provided, a new one is created.
 * @returns A promise that resolves to the page title.
 * @throws Error with specific message if navigation or setup fails.
 */
export async function launchAndNavigate(
    browserType: 'chromium' | 'firefox' | 'webkit',
    url: string,
    launchOptions: LaunchOptions = {},
    contextOptions: BrowserContextOptions = {},
    browserContext?: BrowserContext
): Promise<string> {
    let browser: Browser | undefined;
    let context: BrowserContext;
    let page: Page;

    try {
        if (browserContext) {
            context = browserContext;
            page = await createPage(context);
        } else {
            browser = await launchBrowser(browserType, launchOptions);
            context = await createContext(browser, contextOptions);
            page = await createPage(context);
        }

        await page.goto(url, { waitUntil: 'load' }).catch((error: TimeoutError | Error) => {
            if (error instanceof TimeoutError) {
                throw new Error(`Navigation timeout for ${url}: ${error.message}`);
            }
            throw new Error(`Navigation failed for ${url}: ${error.message}`);
        });

        const title = await page.title();
        if (!title) throw new Error(`No title found for ${url}`);
        return title;
    } catch (error) {
        throw new Error(`Failed to launch and navigate: ${error.message}`);
    } finally {
        if (!browserContext && browser) {
            try {
                await browser.close();
            } catch (closeError) {
                console.warn(`Failed to close browser: ${closeError.message}`);
            }
        }
    }
}

// Feature 2: Headless and Headful Modes
/**
 * Launches a browser in headless or headful mode and navigates to a URL, with or without an existing session.
 * @param browserType The type of browser to launch ('chromium', 'firefox', 'webkit').
 * @param url The URL to navigate to.
 * @param headless Whether to run in headless mode (default: true).
 * @param launchOptions Additional launch options for the browser.
 * @param contextOptions Optional options for the browser context.
 * @param browserContext Optional existing browser context (session). If not provided, a new one is created.
 * @returns A promise that resolves to the page content.
 * @throws Error with specific message if navigation or setup fails.
 */
export async function launchHeadlessOrHeadful(
    browserType: 'chromium' | 'firefox' | 'webkit',
    url: string,
    headless: boolean = true,
    launchOptions: LaunchOptions = {},
    contextOptions: BrowserContextOptions = {},
    browserContext?: BrowserContext
): Promise<string> {
    let browser: Browser | undefined;
    let context: BrowserContext;
    let page: Page;

    try {
        const options = { ...launchOptions, headless };
        if (browserContext) {
            context = browserContext;
            page = await createPage(context);
        } else {
            browser = await launchBrowser(browserType, options);
            context = await createContext(browser, contextOptions);
            page = await createPage(context);
        }

        await page.goto(url, { waitUntil: 'load' }).catch((error: TimeoutError | Error) => {
            if (error instanceof TimeoutError) {
                throw new Error(`Navigation timeout in ${headless ? 'headless' : 'headful'} mode for ${url}: ${error.message}`);
            }
            throw new Error(`Navigation failed in ${headless ? 'headless' : 'headful'} mode for ${url}: ${error.message}`);
        });

        const content = await page.content();
        if (!content) throw new Error(`No content retrieved from ${url}`);
        return content;
    } catch (error) {
        throw new Error(`Failed to launch in ${headless ? 'headless' : 'headful'} mode: ${error.message}`);
    } finally {
        if (!browserContext && browser) {
            try {
                await browser.close();
            } catch (closeError) {
                console.warn(`Failed to close browser: ${closeError.message}`);
            }
        }
    }
}

// Feature 5: Network Interception
/**
 * Intercepts and modifies network requests, with or without an existing session.
 * @param urlPattern The URL pattern to intercept.
 * @param handler A function to handle the intercepted request.
 * @param browserType The type of browser to launch if no session is provided.
 * @param launchOptions Optional launch options for the browser.
 * @param contextOptions Optional options for the browser context.
 * @param browserContext Optional existing browser context (session). If not provided, a new one is created.
 * @returns A promise that resolves when the interception is set.
 * @throws Error with specific message if interception fails.
 */
export async function interceptNetworkRequests(
    urlPattern: string,
    handler: (route: Route) => void,
    browserType: 'chromium' | 'firefox' | 'webkit',
    launchOptions: LaunchOptions = {},
    contextOptions: BrowserContextOptions = {},
    browserContext?: BrowserContext
): Promise<void> {
    let browser: Browser | undefined;
    let context: BrowserContext;
    let page: Page;

    try {
        if (browserContext) {
            context = browserContext;
            page = await createPage(context);
        } else {
            browser = await launchBrowser(browserType, launchOptions);
            context = await createContext(browser, contextOptions);
            page = await createPage(context);
        }

        await page.route(urlPattern, handler).catch((error) => {
            throw new Error(`Failed to set up network interception for pattern '${urlPattern}': ${error.message}`);
        });
    } catch (error) {
        throw new Error(`Network interception failed: ${error.message}`);
    } finally {
        if (!browserContext && browser) {
            try {
                await browser.close();
            } catch (closeError) {
                console.warn(`Failed to close browser: ${closeError.message}`);
            }
        }
    }
}


export async function emulateDevice(
    deviceName: string,
    url: string,
    browserType: 'chromium' | 'firefox' | 'webkit',
    launchOptions: LaunchOptions = {},
    contextOptions: BrowserContextOptions = {},
    browserContext?: BrowserContext
): Promise<string> {
    let browser: Browser | undefined;
    let context: BrowserContext;
    let page: Page;

    try {
        const device = playwright.devices[deviceName];
        if (!device) throw new Error(`Device '${deviceName}' not found in Playwright device list`);
        
        if (browserContext) {
            context = browserContext;
        } else {
            browser = await launchBrowser(browserType, launchOptions);
            context = await createContext(browser, { ...contextOptions, ...device });
        }
        page = await createPage(context);

        await page.goto(url, { waitUntil: 'load' }).catch((error: TimeoutError | Error) => {
            if (error instanceof TimeoutError) {
                throw new Error(`Navigation timeout for ${url} on ${deviceName}: ${error.message}`);
            }
            throw new Error(`Navigation failed for ${url} on ${deviceName}: ${error.message}`);
        });

        const content = await page.content();
        if (!content) throw new Error(`No content retrieved from ${url} on ${deviceName}`);
        return content;
    } catch (error) {
        throw new Error(`Device emulation failed for ${deviceName}: ${error.message}`);
    } finally {
        if (!browserContext && browser) {
            try {
                await browser.close();
            } catch (closeError) {
                console.warn(`Failed to close browser: ${closeError.message}`);
            }
        }
    }
}

// Feature 3: Modern Web Automation (Shadow DOM)
/**
 * Interacts with shadow DOM elements on a page, with or without an existing session.
 * @param selector The selector for the shadow DOM element.
 * @param browserType The type of browser to launch if no session is provided.
 * @param launchOptions Optional launch options for the browser.
 * @param contextOptions Optional options for the browser context.
 * @param browserContext Optional existing browser context (session). If not provided, a new one is created.
 * @returns A promise that resolves to the text content of the element.
 * @throws Error if element is not found or interaction fails.
 */
export async function interactWithShadowDom(
    selector: string,
    browserType: 'chromium' | 'firefox' | 'webkit',
    launchOptions: LaunchOptions = {},
    contextOptions: BrowserContextOptions = {},
    browserContext?: BrowserContext
): Promise<string> {
    let browser: Browser | undefined;
    let context: BrowserContext;
    let page: Page;

    try {
        if (browserContext) {
            context = browserContext;
            page = await createPage(context);
        } else {
            browser = await launchBrowser(browserType, launchOptions);
            context = await createContext(browser, contextOptions);
            page = await createPage(context);
        }

        const element = await page.locator(selector).textContent();
        if (!element) throw new Error(`Shadow DOM element '${selector}' not found`);
        return element;
    } catch (error) {
        throw new Error(`Failed to interact with shadow DOM: ${error.message}`);
    } finally {
        if (!browserContext && browser) {
            await browser.close();
        }
    }
}

// Feature 4: Page Interaction
/**
 * Simulates user interactions on a page, with or without an existing session.
 * @param actions An array of actions to perform (e.g., [{ type: 'click', selector: 'button' }]).
 * @param browserType The type of browser to launch if no session is provided.
 * @param launchOptions Optional launch options for the browser.
 * @param contextOptions Optional options for the browser context.
 * @param browserContext Optional existing browser context (session). If not provided, a new one is created.
 * @returns A promise that resolves when all actions are completed.
 * @throws Error if any action fails.
 */
export async function simulateUserInteractions(
    actions: Array<{ type: string; selector?: string; value?: string }>,
    browserType: 'chromium' | 'firefox' | 'webkit',
    launchOptions: LaunchOptions = {},
    contextOptions: BrowserContextOptions = {},
    browserContext?: BrowserContext
): Promise<void> {
    let browser: Browser | undefined;
    let context: BrowserContext;
    let page: Page;

    try {
        if (browserContext) {
            context = browserContext;
            page = await createPage(context);
        } else {
            browser = await launchBrowser(browserType, launchOptions);
            context = await createContext(browser, contextOptions);
            page = await createPage(context);
        }

        for (const action of actions) {
            switch (action.type) {
                case 'click':
                    if (!action.selector) throw new Error('Selector required for click action');
                    await page.click(action.selector);
                    break;
                case 'fill':
                    if (!action.selector || !action.value) throw new Error('Selector and value required for fill action');
                    await page.fill(action.selector, action.value);
                    break;
                default:
                    throw new Error(`Unsupported action type: ${action.type}`);
            }
        }
    } catch (error) {
        throw new Error(`User interaction failed: ${error.message}`);
    } finally {
        if (!browserContext && browser) {
            await browser.close();
        }
    }
}

// More features can be added similarly...

// Example Usage
// async function main() {
//     try {
//         // Without session
//         const title = await launchAndNavigate('chromium', 'https://example.com');
//         console.log('Page title:', title);

//         // With session
//         const browser = await launchBrowser('chromium');
//         const context = await createContext(browser);
//         const sessionTitle = await launchAndNavigate('chromium', 'https://example.com', {}, {}, context);
//         console.log('Session page title:', sessionTitle);
//         await browser.close();
//     } catch (error) {
//         console.error(`Error: ${error.message}`);
//     }
// }

// main();