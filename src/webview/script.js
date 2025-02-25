const vscode = acquireVsCodeApi();
let chatHistory = [];
let isRecording = false;
// Add these variables at the top with other globals
let recordingTimer = null;
let recordingStartTime = null;
let websocketConnected = false; // Track WebSocket connection status
// Add QMODE to global state
let currentQMode = 'QCode'; // Default mode

// Add this function to update recording time display
function updateRecordingTime() {
    if (!recordingStartTime) { return; }
    
    const elapsed = Math.floor((Date.now() - recordingStartTime) / 1000);
    const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0');
    const seconds = (elapsed % 60).toString().padStart(2, '0');
    document.getElementById('recording-time').textContent = `Recording: ${minutes}:${seconds}`;
}

// Chat functionality
const chatInput = document.getElementById('chat-input');
const chatForm = document.getElementById('chat-form');

chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    sendChat();
});

chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendChat();
    }
});

function sendChat() {
    const text = chatInput.value.trim();
    if (text) {
        showProgress(10); // Start at 10%
        const chatDisplay = document.getElementById('chat-display');
        chatDisplay.innerHTML += `
            <div class="mb-4 p-3 rounded-md shadow-sm transition-colors duration-200
                ${document.body.getAttribute('data-theme') === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}">
                <div class="flex items-center">
                    <i class="fas fa-user mr-2 ${document.body.getAttribute('data-theme') === 'dark' ? 'text-white-400' : 'text-black-500'}"></i>
                    <span class="font-medium ${document.body.getAttribute('data-theme') === 'dark' ? 'text-gray-200' : 'text-gray-700'}">You:</span>
                </div>
                <div class="mt-1 text-sm ${document.body.getAttribute('data-theme') === 'dark' ? 'text-gray-100' : 'text-gray-800'}">
                    ${marked.parse(text)}
                </div>
            </div>`;
        chatDisplay.scrollTop = chatDisplay.scrollHeight;
        const chatStates = getChatStates();
        vscode.postMessage({ 
            type: 'sendChatMessage', 
            text: text, 
            states: chatStates.states 
        });
        console.log({ 
            type: 'sendChatMessage', 
            text: text, 
            states: chatStates.states 
        });
        chatInput.value = '';
    }
}

// Get active models from chat toggles
function getActiveModels() {
    return {
        grok3: document.getElementById('chat-grok3-toggle')?.checked || false,
        openai: document.getElementById('chat-openai-toggle')?.checked || false,
        anthropic: document.getElementById('chat-anthropic-toggle')?.checked || false,
        groq: document.getElementById('chat-groq-toggle')?.checked || false,
        ollama: document.getElementById('chat-ollama-toggle')?.checked || false,
        deepseek: document.getElementById('chat-deepseek-toggle')?.checked || false
    };
}

// Sync toggles between chat and settings
function syncToggles(sourcePrefix, targetPrefix) {
    const models = ['grok3', 'openai', 'anthropic', 'groq', 'ollama', 'deepseek'];
    models.forEach(model => {
        const sourceToggle = document.getElementById(`${sourcePrefix}${model}-toggle`);
        const targetToggle = document.getElementById(`${targetPrefix}${model}-toggle`);
        if (sourceToggle && targetToggle) {
            targetToggle.checked = sourceToggle.checked;
        }
    });
}

// Add event listeners for chat toggles
function setupChatToggleListeners() {
    const models = ['grok3', 'openai', 'anthropic', 'groq', 'ollama', 'deepseek'];
    models.forEach(model => {
        const chatToggle = document.getElementById(`chat-${model}-toggle`);
        if (chatToggle) {
            chatToggle.addEventListener('change', () => {
                syncToggles('chat-', '');
                updateSettings();
            });
        }
    });
}

// Add event listeners for settings toggles
function setupSettingsToggleListeners() {
    const models = ['grok3', 'openai', 'anthropic', 'groq', 'ollama', 'deepseek'];
    models.forEach(model => {
        const settingsToggle = document.getElementById(`${model}-toggle`);
        if (settingsToggle) {
            settingsToggle.addEventListener('change', () => {
                syncToggles('', 'chat-');
                updateSettings();
            });
        }
    });
}

// Get all settings from the form
function getSettings() {
    const models = ['grok3', 'openai', 'anthropic', 'groq', 'ollama', 'deepseek'];
    const aiModels = {};
    models.forEach(model => {
        
        aiModels[model] = {
            active: document.getElementById(`${model}-toggle`)?.checked || false,
            apiKeys: document.getElementById(`${model}-keys`)?.value.split('\n').filter(Boolean) || [],
            models: [document.getElementById(`${model}-model`)?.value || model],
            temperature: parseFloat(document.getElementById(`${model}-temperature`)?.value),
            contextSensitivity: parseInt(document.getElementById(`${model}-sensitivity`)?.value),
            maxTokens: parseInt(document.getElementById(`${model}-max-tokens`)?.value) || 4096
        };
    });

    const functionCallingAIs = {
        grok3: document.getElementById('func-grok3-toggle')?.checked || false,
        openai: document.getElementById('func-openai-toggle')?.checked || false,
        anthropic: document.getElementById('func-anthropic-toggle')?.checked || false,
        groq: document.getElementById('func-groq-toggle')?.checked || false,
        ollama: document.getElementById('func-ollama-toggle')?.checked || false,
        deepseek: document.getElementById('func-deepseek-toggle')?.checked || false
    };

    const thinkingAIs = {
        grok3: document.getElementById('think-grok3-toggle')?.checked || false,
        openai: document.getElementById('think-openai-toggle')?.checked || false,
        anthropic: document.getElementById('think-anthropic-toggle')?.checked || false,
        groq: document.getElementById('think-groq-toggle')?.checked || false,
        ollama: document.getElementById('think-ollama-toggle')?.checked || false,
        deepseek: document.getElementById('think-deepseek-toggle')?.checked || false
    };
    
    return {
        language: document.getElementById('language')?.value || 'en',
        theme: document.getElementById('theme')?.value || 'system',
        websocket: {
            active: document.getElementById('websocket-toggle')?.checked || false,
            port: parseInt(document.getElementById('websocket-port')?.value) || 8080
        },
        aiModels,
        functionCallingAIs,
        thinkingAIs,
        chatStates: {
            attachRelated: document.getElementById('attach-related-toggle')?.checked || false,
            thinking: document.getElementById('thinking-toggle')?.checked || false,
            webAccess: document.getElementById('web-access-toggle')?.checked || false,
            autoApply: document.getElementById('auto-apply-toggle')?.checked || false,
            folderStructure: document.getElementById('folder-structure-toggle')?.checked || false,
            fullRewrite: document.getElementById('full-rewrite-toggle')?.checked || false,
            qmode: currentQMode,
            extra: []
        }
    };
}

// Update settings and send to extension
function updateSettings() {
    const settings = getSettings();
    vscode.postMessage({ type: 'saveSettings', settings });
    applyTheme(settings.theme);
}

// Apply theme to the UI
function applyTheme(theme) {
    const body = document.body;
    const themeIcon = document.getElementById('theme-icon-chat');
    
    body.setAttribute('data-theme', theme);
    body.classList.toggle('dark', theme === 'dark');
    
    if (themeIcon) {
        themeIcon.classList.remove('fa-sun', 'fa-moon', 'fa-adjust');
        themeIcon.classList.add(
            theme === 'light' ? 'fa-sun' :
            theme === 'dark' ? 'fa-moon' : 'fa-adjust'
        );
    }
}

// Load settings into the form
function loadSettings(settings) {
    document.getElementById('language').value = settings.language || 'en';
    document.getElementById('theme').value = settings.theme || 'system';
    document.getElementById('websocket-toggle').checked = settings.websocket?.active || false;
    document.getElementById('websocket-port').value = settings.websocket?.port || 8080;

    const models = ['grok3', 'openai', 'anthropic', 'groq', 'ollama', 'deepseek'];
    models.forEach(model => {
        const config = settings.aiModels?.[model] || {};
        document.getElementById(`${model}-toggle`).checked = config.active || false;
        document.getElementById(`${model}-keys`).value = config.apiKeys?.join('\n') || '';
        document.getElementById(`${model}-model`).value = config.models?.[0] || model;
        document.getElementById(`${model}-temperature`).value = config.temperature || 0;
        document.getElementById(`${model}-temp-value`).textContent = config.temperature || '0';
        document.getElementById(`${model}-sensitivity`).value = config.contextSensitivity || 0;
        document.getElementById(`${model}-sens-value`).textContent = config.contextSensitivity || '0';
        document.getElementById(`${model}-max-tokens`).value = config.maxTokens || 4096;
    });

    models.forEach(model => {
        document.getElementById(`func-${model}-toggle`).checked = settings.functionCallingAIs?.[model] || false;
        document.getElementById(`think-${model}-toggle`).checked = settings.thinkingAIs?.[model] || false;
    });

    const chatStates = settings.chatStates || {};

    currentQMode = chatStates.qmode || 'QCode';
    const qmodeRadio = document.getElementById(`qmode-${currentQMode.toLowerCase()}`);
    if (qmodeRadio) {
        qmodeRadio.checked = true;
        const label = qmodeRadio.nextElementSibling;
        if (label) {
            label.classList.add('bg-teal-600', 'text-white');
        }
    }
    document.getElementById('current-qmode').textContent = currentQMode;

    document.getElementById('attach-related-toggle').checked = chatStates.attachRelated || false;
    document.getElementById('thinking-toggle').checked = chatStates.thinking || false;
    document.getElementById('web-access-toggle').checked = chatStates.webAccess || false;
    document.getElementById('auto-apply-toggle').checked = chatStates.autoApply || false;
    document.getElementById('folder-structure-toggle').checked = chatStates.folderStructure || false;
    document.getElementById('full-rewrite-toggle').checked = chatStates.fullRewrite || false;

    syncToggles('', 'chat-');
    applyTheme(settings.theme); 
}

// Settings form submission
document.getElementById('settings-form').addEventListener('submit', e => {
    e.preventDefault();
    updateSettings();
});

// API key test buttons
['grok3', 'openai', 'anthropic', 'groq', 'ollama', 'deepseek'].forEach(model => {
    const testButton = document.getElementById(`test-${model}`);
    if (testButton) {
        testButton.addEventListener('click', () => {
            const keys = document.getElementById(`${model}-keys`)?.value || '';
            vscode.postMessage({ type: 'testApiKey', model, keys });
        });
    }
});

function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'fixed bottom-4 right-4 bg-red-500 text-white px-4 py-2 rounded';
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);
    setTimeout(() => errorDiv.remove(), 3000);
}

// Tab switching
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active-tab'));
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
            content.style.display = 'none';
        });
        btn.classList.add('active-tab');
        const tabContent = document.getElementById(btn.dataset.tab);
        if (tabContent) {
            tabContent.classList.add('active');
            tabContent.style.display = 'block';
        }
        switch (btn.dataset.tab) {
            case 'history': updateHistoryList(); break;
            case 'settings': vscode.postMessage({ type: 'getSettings' }); break;
            case 'info': loadInfo(); break;
        }
    });
});

function getChatStates() {
    return {
        models: getActiveModels(),
        states: {
            attachRelated: document.getElementById('attach-related-toggle')?.checked || false,
            thinking: document.getElementById('thinking-toggle')?.checked || false,
            webAccess: document.getElementById('web-access-toggle')?.checked || false,
            autoApply: document.getElementById('auto-apply-toggle')?.checked || false,
            folderStructure: document.getElementById('folder-structure-toggle')?.checked || false,
            fullRewrite: document.getElementById('full-rewrite-toggle')?.checked || false,
            qmode: currentQMode,
        }
    };
}

function updateHistoryList() {
    const historyList = document.getElementById('history-list');
    historyList.innerHTML = chatHistory.length ?
        chatHistory.map(item => `
            <div class="p-3 rounded-md border border-zinc-200" style="overflow: auto">
                <div class="flex justify-between items-center">
                    <p class="text-sm"><strong>Prompt:</strong> ${item.prompt}</p>
                    <button class="remove-entry-btn px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-xs" data-id="${item.id}">Remove</button>
                </div>
                <p class="text-sm prose prose-sm max-w-none"><strong>Response:</strong> ${marked.parse(item.response)}</p>
                ${item.rawResponse?.usage ? `
                    <p class="text-xs"><strong>Usage:</strong></p>
                    <pre class="text-xs bg-gray-100 p-2 rounded">${JSON.stringify(item.rawResponse.usage, null, 2)}</pre>
                ` : ''}
                ${item.context ? `
                    <p class="text-xs"><strong>File:</strong> ${item.context.fileName} (${item.context.fileType})</p>
                    ${item.context.selection ? `<p class="text-xs"><strong>Selection:</strong> <pre>${item.context.selection.text}</pre></p>` : ''} <!-- Fixed selection display -->
                ` : ''}
                <p class="text-xs">${new Date(item.timestamp).toLocaleString()}</p>
            </div>
        `).join('') :
        '<p class="text-sm">No chat history yet.</p>';

    // Add event listeners to Remove buttons
    document.querySelectorAll('.remove-entry-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.dataset.id;
            vscode.postMessage({ type: 'removeChatEntry', id });
        });
    });
}

// Initialize UI elements
document.addEventListener('DOMContentLoaded', () => {
    setupChatToggleListeners();
    setupSettingsToggleListeners();
    
    // QMODE selection with label styling
    const qmodeRadios = document.querySelectorAll('.qmode-radio');
    qmodeRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            currentQMode = e.target.value;
            document.getElementById('current-qmode').textContent = currentQMode;
            updateSettings();

            // Update label styles
            document.querySelectorAll('.qmode-label').forEach(label => {
                label.classList.remove('bg-teal-600', 'text-white');
            });
            const activeLabel = e.target.nextElementSibling;
            if (activeLabel) {
                activeLabel.classList.add('bg-teal-600', 'text-white');
            }
        });
    });

    // Set initial active label
    const initialRadio = document.querySelector('.qmode-radio:checked');
    if (initialRadio) {
        const initialLabel = initialRadio.nextElementSibling;
        if (initialLabel) {
            initialLabel.classList.add('bg-teal-600', 'text-white');
        }
    }

    let term = null;
    function initializeTerminal() {
        if (!term) {
            term = new Terminal({
                cursorBlink: true,
                theme: document.body.getAttribute('data-theme') === 'dark' ? {
                    background: '#18181b',
                    foreground: '#f4f4f5'
                } : {
                    background: '#f4f4f5',
                    foreground: '#18181b'
                }
            });
            term.open(document.getElementById('terminal-container'));
            term.write('Welcome to QCode Terminal\r\n');
            term.onData(data => {
                vscode.postMessage({ type: 'terminalInput', data });
            });
        }
    }

    document.querySelector('.tab-btn[data-tab="terminal"]').addEventListener('click', () => {
        initializeTerminal();
    });

    document.getElementById('chat-options-toggle').addEventListener('click', () => {
        const chatOptions = document.getElementById('chat-options');
        chatOptions.classList.toggle('hidden');
    });

    chatInput.addEventListener('input', () => {
        chatInput.style.height = 'auto'; // Reset height
        chatInput.style.height = `${Math.min(chatInput.scrollHeight, 10 * 16)}px`; // Cap at 5 rows (assuming 16px per row)
    });

    document.getElementById('theme-toggle-btn-chat').addEventListener('click', () => {
        
        const currentTheme = document.body.getAttribute('data-theme') || 'system';
        console.log(currentTheme);

        let newTheme;
        if (currentTheme === 'light') {
            newTheme = 'dark';
        } else if (currentTheme === 'dark') {
            // newTheme = 'system';
            newTheme = 'light';
        } else {
            newTheme = 'light';
        }
        console.log(newTheme);
        // Update the theme in settings and UI
        document.getElementById('theme').value = newTheme;
        applyTheme(newTheme);
        updateSettings();
    
        // Update the icon with error handling
        const themeIcon = document.getElementById('theme-icon');
        if (themeIcon) {
            themeIcon.classList.remove('fa-sun', 'fa-moon', 'fa-adjust');
            themeIcon.classList.add(
                newTheme === 'light' ? 'fa-sun' :
                newTheme === 'dark' ? 'fa-moon' : 'fa-adjust'
            );
        }
    });
    
    // Add this after your existing event listeners in the DOMContentLoaded section
    document.getElementById('clear-chat-btn').addEventListener('click', () => {
        const chatDisplay = document.getElementById('chat-display');
        chatDisplay.innerHTML = '';
        // Optionally, you could add a message indicating the chat was cleared
        chatDisplay.innerHTML = '';
    });

    const models = ['grok3', 'openai', 'anthropic', 'groq', 'ollama', 'deepseek'];
    models.forEach(model => {
        document.getElementById(`${model}-temperature`)?.addEventListener('input', e => {
            document.getElementById(`${model}-temp-value`).textContent = e.target.value;
            updateSettings();
        });
        document.getElementById(`${model}-sensitivity`)?.addEventListener('input', e => {
            document.getElementById(`${model}-sens-value`).textContent = e.target.value;
            updateSettings();
        });
        document.getElementById(`${model}-max-tokens`)?.addEventListener('input', updateSettings);
        document.getElementById(`${model}-model`)?.addEventListener('input', updateSettings);
    });

    ['language', 'theme', 'websocket-toggle', 'websocket-port'].forEach(id => {
        document.getElementById(id)?.addEventListener('change', updateSettings);
    });

    ['attach-related-toggle', 'thinking-toggle', 'web-access-toggle', 'auto-apply-toggle', 'folder-structure-toggle', 'full-rewrite-toggle'].forEach(id => {
        document.getElementById(id)?.addEventListener('change', updateSettings);
    });

    models.forEach(model => {
        document.getElementById(`func-${model}-toggle`)?.addEventListener('change', updateSettings);
        document.getElementById(`think-${model}-toggle`)?.addEventListener('change', updateSettings);
    });

    vscode.postMessage({ type: 'getSettings' });
    vscode.postMessage({ type: 'getChatHistory' });

    document.getElementById('toggle-recording').addEventListener('click', () => {
        if (document.getElementById('toggle-recording').disabled) {
            vscode.postMessage('getWebSocketStatus');
            return;
        }
        const micIcon = document.getElementById('mic-icon');
        micIcon.classList.remove('fa-microphone-slash');
        micIcon.classList.add('fa-microphone');

        if (!isRecording) {
            vscode.postMessage({ type: 'startRecording' });
            startRecordingUI();
        } else {
            vscode.postMessage({ type: 'stopRecording' });
            stopRecordingUI();
        }
    });

    // Add event listeners for Clear and Export buttons
    document.getElementById('clear-history').addEventListener('click', () => {
        vscode.postMessage({ type: 'clearChatHistory' });
    });

    document.getElementById('export-history').addEventListener('click', () => {
        vscode.postMessage({ type: 'exportChatHistory' });
    });

    // Toggle TabBar visibility
    const tabBar = document.querySelector('.tab-navigation');
    document.getElementById('tab-menu-btn').addEventListener('click', () => {
        tabBar.classList.toggle('hidden');
    });

    vscode.postMessage('getWebSocketStatus');
    
});

function updateWebSocketStatus(connected) {
    // const statusDiv = document.getElementById('websocket-status');
    const recordingButton = document.getElementById('toggle-recording');
    const micIcon = document.getElementById('mic-icon');
    console.log("ws status came: ");
    console.log(connected);
    websocketConnected = connected;

    if (connected) {
        micIcon.classList.remove('fa-microphone-slash');
        micIcon.classList.add('fa-microphone');
        // statusDiv.classList.remove('bg-red-500');
        // statusDiv.classList.add('bg-green-500');
        // statusDiv.title = 'WebSocket Connected';
        recordingButton.disabled = false;
    } else {
        micIcon.classList.remove('fa-microphone');
        micIcon.classList.add('fa-microphone-slash');
        // statusDiv.classList.remove('bg-green-500');
        // statusDiv.classList.add('bg-red-500');
        // statusDiv.title = 'WebSocket Disconnected';
        recordingButton.disabled = true;
        if (isRecording) {
            stopRecordingUI();
        }
    }
}

function startRecordingUI() {
    isRecording = true;
    const micIcon = document.getElementById('mic-icon');
    const wsStat = document.getElementById('websocket-status');

    wsStat.classList.remove('invisible');
    wsStat.classList.add('visible');
    micIcon.classList.add('text-green-600');
    micIcon.classList.remove('text-grey-600');
}

function stopRecordingUI() {
    isRecording = false;
    const micIcon = document.getElementById('mic-icon');
    const wsStat = document.getElementById('websocket-status');

    wsStat.classList.remove('visible');
    wsStat.classList.add('invisible');
    micIcon.classList.remove('text-green-600');
    micIcon.classList.add('text-grey-600');
}



// Handle messages from the extension
window.addEventListener('message', event => {
    const message = event.data;
    const chatDisplay = document.getElementById('chat-display');
    
    if (message.type === 'chatResponse') {
        
        let renderedContent = '';
        let additionalContent = '';

        // Parse the Markdown content
        console.log("message recieved");
        console.log(message);
        
        // Handle different response types
        switch (message.responseType) {
            case 'markdown':
                renderedContent = marked.parse(message.text);
                break;
            case 'html':
                renderedContent = message.text; // Assume it's raw HTML
                break;
            case 'plain':
                renderedContent = `<pre class="text-sm">${message.text}</pre>`;
                break;
            case 'xterm':
                renderedContent = `<pre class="text-sm xterm-output">${message.text}</pre>`;
                additionalContent = `<p class="text-xs text-gray-500 mt-1">Sent to Terminal</p>`;
                // Send to terminal if active
                if (term) {
                    term.write(message.text + '\r\n');
                }
                break;
            default:
                renderedContent = marked.parse(message.text); // Fallback to Markdown
        }

        // Process progress if included
        if (message.progress !== undefined) {
            showProgress(message.progress);
        }
        if (message.progress === 100 || message.complete) {
            hideProgress();
        }
        
        // Create a temporary DOM element for Markdown/HTML processing
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = renderedContent;

        // Process code blocks for Markdown (if applicable)
        if (message.responseType === 'markdown') {
            const topLevelPreElements = Array.from(tempDiv.querySelectorAll('pre')).filter(pre => !pre.closest('pre'));
            topLevelPreElements.forEach(pre => {
                const codeElement = pre.querySelector('code') || pre.firstChild;
                if (codeElement && codeElement.tagName === 'CODE') {
                    let language = 'Code Block';
                    const classAttr = codeElement.getAttribute('class');
                    if (classAttr) {
                        const matches = classAttr.match(/language-(\w+)/);
                        if (matches) {
                            language = matches[1];
                        }
                    }
                    const details = document.createElement('details');
                    const summary = document.createElement('summary');
                    summary.textContent = language.charAt(0).toUpperCase() + language.slice(1);
                    const newPre = document.createElement('pre');
                    const newCode = document.createElement('code');
                    newCode.innerHTML = codeElement.innerHTML;
                    if (language !== 'Code Block') {
                        newCode.className = `language-${language}`;
                    }
                    newPre.appendChild(newCode);
                    details.appendChild(summary);
                    details.appendChild(newPre);
                    pre.replaceWith(details);
                }
            });
        }

        // Build the chat message HTML
        chatDisplay.innerHTML += `
            <div class="mb-2 p-2 rounded-md shadow-sm transition-colors duration-200
                ${document.body.getAttribute('data-theme') === 'dark' ? 'bg-gray-800' : 'bg-gray-50'}">
                <div class="flex items-center justify-between mb-1">
                    <div class="flex items-center">
                        <i class="fas fa-robot mr-2 ${document.body.getAttribute('data-theme') === 'dark' ? 'text-blue-400' : 'text-blue-500'}"></i>
                        <span class="font-medium ${document.body.getAttribute('data-theme') === 'dark' ? 'text-gray-200' : 'text-gray-700'}">Q:</span>
                    </div>
                    <button class="copy-btn bg-teal-600 text-white px-2 py-1 rounded text-xs hover:bg-teal-700" data-text="${encodeURIComponent(message.text)}">Copy</button>
                </div>
                <div class="prose prose-sm max-w-none ${document.body.getAttribute('data-theme') === 'dark' ? 'text-gray-100 prose-invert' : 'text-gray-800'}">
                    ${tempDiv.innerHTML}
                </div>
                ${additionalContent}
                ${message.context ? `
                    <div class="mt-2 text-xs border-t pt-1 ${document.body.getAttribute('data-theme') === 'dark' ? 'text-gray-400 border-gray-700' : 'text-gray-500 border-gray-200'}">
                        <p><strong>Context:</strong> ${message.context.fileName} (${message.context.fileType})</p>
                        ${message.context.selection ? `
                            <pre class="mt-1 p-1 rounded border text-xs overflow-auto ${document.body.getAttribute('data-theme') === 'dark' ? 'bg-gray-900 text-gray-200 border-gray-700' : 'bg-white text-gray-700 border-gray-200'}">
                                ${message.context.selection}
                            </pre>
                        ` : ''}
                    </div>
                ` : ''}
            </div>`;

        chatDisplay.scrollTop = chatDisplay.scrollHeight;
        chatHistory.push({
            prompt: message.prompt,
            response: message.text,
            responseType: message.responseType,
            timestamp: new Date().toISOString(),
            context: message.context
        });

        // Reattach copy button listeners
        document.querySelectorAll('.copy-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const text = decodeURIComponent(btn.dataset.text);
                navigator.clipboard.writeText(text).then(() => {
                    btn.textContent = 'Copied!';
                    setTimeout(() => btn.textContent = 'Copy', 2000);
                });
            });
        });

    } else if (message.type === 'terminalOutput') {
        if (term) {
            term.write(message.data);
        }
    } else if (message.type === 'setTheme') {
        // Handle theme update from the extension
        applyTheme(message.theme);
    } else if (message.type === 'settings') {
        loadSettings(message.settings);
    } else if (message.type === 'chatError') {
        chatDisplay.innerHTML += `<div class="mb-4 p-3 bg-red-50 rounded-md text-red-700">${message.text}</div>`;
        chatDisplay.scrollTop = chatDisplay.scrollHeight;
    } else if (message.type === 'chatHistory') {
        chatHistory = message.history;
        updateHistoryList();
    } else if (message.type === 'settings') {
        loadSettings(message.settings);
    } else if (message.type === 'apiTestResult') {
        showError(`${message.model} API test: ${message.success ? 'Success' : 'Failed'}`);
    } else if (message.type === 'recordingStarted') {
        startRecordingUI();
    } else if (message.type === 'recordingStopped') {
        stopRecordingUI();
    } else if (message.type === 'transcription') {
        // Switch to chat tab if not already active
        const chatTabBtn = document.querySelector('.tab-btn[data-tab="chat"]');
        const currentActiveTab = document.querySelector('.tab-btn.active-tab');
        if (chatTabBtn && currentActiveTab !== chatTabBtn) {
            chatTabBtn.click(); // Trigger the tab switch
        }
        
        const inputField = document.getElementById('chat-input'); // Adjust ID as needed
        if (inputField) {
            inputField.value = message.transcription;
            inputField.focus(); // Add focus to the text field
        }
    } else if (message.type === 'websocketStatus') {
        console.log("WS UPDATE CAME");
        console.log(message);
        updateWebSocketStatus(message.connected);
    }
});

function loadInfo() {
    vscode.postMessage({ type: 'getInfo' });
}

function showProgress(percent) {
    const progressBar = document.getElementById('progress-bar');
    const progressFill = document.getElementById('progress-fill');
    progressBar.classList.remove('hidden');
    progressFill.style.width = `${percent}%`;
}

function hideProgress() {
    document.getElementById('progress-bar').classList.add('hidden');
}