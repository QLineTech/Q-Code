const vscode = acquireVsCodeApi();
let chatHistory = [];
let isRecording = false;

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
        const activeModels = getActiveModels();
        vscode.postMessage({ type: 'sendChatMessage', text, activeModels });
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
            console.log(`Synced ${sourcePrefix}${model}-toggle (${sourceToggle.checked}) to ${targetPrefix}${model}-toggle`);
        } else {
            console.warn(`Could not sync ${model}: ${sourcePrefix}${model}-toggle=${!!sourceToggle}, ${targetPrefix}${model}-toggle=${!!targetToggle}`);
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
                syncToggles('chat-', ''); // Sync chat to settings
                updateSettings(); // Save the updated settings
                console.log(`Chat toggle ${model} changed to ${chatToggle.checked}`);
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
                syncToggles('', 'chat-'); // Sync settings to chat
                updateSettings(); // Save the updated settings
                console.log(`Settings toggle ${model} changed to ${settingsToggle.checked}`);
            });
        }
    });
}

// Update settings when toggles or other inputs change
function updateSettings() {
    const settings = {
        websocket: document.getElementById('websocket-toggle')?.checked || false,
        aiModels: getActiveModels(),
        grok3Keys: document.getElementById('grok3-keys')?.value || '',
        openaiKeys: document.getElementById('openai-keys')?.value || '',
        anthropicKeys: document.getElementById('anthropic-keys')?.value || '',
        groqKeys: document.getElementById('groq-keys')?.value || '',
        ollamaKeys: document.getElementById('ollama-keys')?.value || '',
        deepseekKeys: document.getElementById('deepseek-keys')?.value || '',
        temperature: document.getElementById('temperature')?.value || '0.7',
        volumeSensitivity: document.getElementById('volume-sensitivity')?.value || '50',
        language: document.getElementById('language')?.value || 'en',
        theme: document.getElementById('theme')?.value || 'system'
    };
    vscode.postMessage({ type: 'saveSettings', settings });
    console.log('Settings updated and saved:', settings);
}
// Settings form submission
document.getElementById('settings-form').addEventListener('submit', e => {
    e.preventDefault();
    updateSettings();
    syncToggles('', 'chat-'); // Ensure chat toggles reflect settings after save
    console.log('Settings form submitted');
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

let currentState = { isLoading: false, theme: 'system', chatHistory: [], settings: null };

function updateState(newState) {
    currentState = { ...currentState, ...newState };
    renderUI();
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
            case 'settings': loadSettings(); break;
            case 'info': loadInfo(); break;
        }
    });
});

function updateHistoryList() {
    const historyList = document.getElementById('history-list');
    historyList.innerHTML = chatHistory.length ?
        chatHistory.map(item => `
            <div class="p-3 bg-zinc-50 rounded-md border border-zinc-200">
                <p class="text-sm text-zinc-600"><strong>Prompt:</strong> ${item.prompt}</p>
                <p class="text-sm text-zinc-600 prose prose-sm max-w-none"><strong>Response:</strong> ${marked.parse(item.response)}</p>
                ${item.context ? `
                    <p class="text-xs text-zinc-500"><strong>File:</strong> ${item.context.fileName} (${item.context.fileType})</p>
                    ${item.context.selection ? `<p class="text-xs text-zinc-500"><strong>Selection:</strong> <pre>${item.context.selection}</pre></p>` : ''}
                ` : ''}
                <p class="text-xs text-zinc-500">${new Date(item.timestamp).toLocaleString()}</p>
            </div>
        `).join('') :
        '<p class="text-sm text-zinc-500">No chat history yet.</p>';
}

const accountContent = document.getElementById('account-content');
accountContent.innerHTML = `
    <div id="login-form" class="space-y-4">
        <div>
            <label class="block text-sm font-medium text-zinc-600">Email</label>
            <input type="email" id="email" class="mt-1 w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 glass-input">
        </div>
        <div>
            <label class="block text-sm font-medium text-zinc-600">Password</label>
            <input type="password" id="password" class="mt-1 w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 glass-input">
        </div>
        <button id="login-btn" class="w-full bg-teal-600 text-white py-2 rounded-md hover:bg-teal-700 transition-colors">Login</button>
        <p class="text-sm text-zinc-600">No account? <button id="show-register" class="text-teal-600 hover:underline">Register</button></p>
    </div>
`;
document.getElementById('show-register').addEventListener('click', () => {
    accountContent.innerHTML = `
        <div id="register-form" class="space-y-4">
            <div>
                <label class="block text-sm font-medium text-zinc-600">Email</label>
                <input type="email" id="reg-email" class="mt-1 w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 glass-input">
            </div>
            <div>
                <label class="block text-sm font-medium text-zinc-600">Password</label>
                <input type="password" id="reg-password" class="mt-1 w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 glass-input">
            </div>
            <button id="register-btn" class="w-full bg-teal-600 text-white py-2 rounded-md hover:bg-teal-700 transition-colors">Register</button>
            <p class="text-sm text-zinc-600">Have an account? <button id="show-login" class="text-teal-600 hover:underline">Login</button></p>
        </div>
    `;
    document.getElementById('show-login').addEventListener('click', () => location.reload());
});

const micIcon = document.getElementById('mic-icon');
const micStatus = document.getElementById('mic-status');
const toggleBtn = document.getElementById('toggle-recording');
toggleBtn.addEventListener('click', () => {
    isRecording = !isRecording;
    if (isRecording) {
        micIcon.classList.add('animate-pulse');
        micStatus.textContent = 'Listening...';
        toggleBtn.textContent = 'Stop';
        vscode.postMessage({ type: 'startRecording' });
    } else {
        micIcon.classList.remove('animate-pulse');
        micStatus.textContent = 'Click to start listening...';
        toggleBtn.textContent = 'Start';
        vscode.postMessage({ type: 'stopRecording' });
    }
});

function loadSettings() {
    console.log('Requesting settings from VSCode');
    vscode.postMessage({ type: 'getSettings' });
}

document.getElementById('temperature')?.addEventListener('input', e => {
    document.getElementById('temp-value').textContent = e.target.value;
});
document.getElementById('volume-sensitivity')?.addEventListener('input', e => {
    document.getElementById('vol-value').textContent = e.target.value;
});

function loadInfo() {
    vscode.postMessage({ type: 'getInfo' });
}

// Initialize toggle listeners and load settings when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded');
    setupChatToggleListeners();
    setupSettingsToggleListeners();
    
    // Add change listeners to other settings inputs
    ['websocket-toggle', 'temperature', 'volume-sensitivity', 'language', 'theme'].forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('change', () => {
                updateSettings();
                console.log(`${id} changed, settings updated`);
            });
        }
    });

    loadSettings(); // Request settings immediately on load
});

document.querySelectorAll('#actions-list button[data-tab]').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelector(`.tab-btn[data-tab="${btn.dataset.tab}"]`).click();
    });
});
document.getElementById('contact-btn')?.addEventListener('click', () => {
    document.getElementById('contact-dialog').classList.remove('hidden');
});
document.getElementById('partner-btn')?.addEventListener('click', () => {
    document.getElementById('partner-dialog').classList.remove('hidden');
});
document.getElementById('donate-btn')?.addEventListener('click', () => {
    document.getElementById('donate-dialog').classList.remove('hidden');
});
document.getElementById('close-contact')?.addEventListener('click', () => {
    document.getElementById('contact-dialog').classList.add('hidden');
});
document.getElementById('close-partner')?.addEventListener('click', () => {
    document.getElementById('partner-dialog').classList.add('hidden');
});
document.getElementById('close-donate')?.addEventListener('click', () => {
    document.getElementById('donate-dialog').classList.add('hidden');
});
document.getElementById('contact-form')?.addEventListener('submit', e => {
    e.preventDefault();
    vscode.postMessage({ type: 'contact', data: {
        name: e.target[0].value,
        email: e.target[1].value,
        message: e.target[2].value
    } });
    document.getElementById('contact-dialog').classList.add('hidden');
});

window.addEventListener('message', event => {
    const message = event.data;
    const chatDisplay = document.getElementById('chat-display');

    if (message.type === 'chatResponse') {
        chatDisplay.innerHTML += `
            <div class="mb-4 p-3 rounded-md shadow-sm transition-colors duration-200
                ${document.body.getAttribute('data-theme') === 'dark' ? 'bg-gray-800' : 'bg-gray-50'}">
                <div class="flex items-center mb-2">
                    <i class="fas fa-robot mr-2 ${document.body.getAttribute('data-theme') === 'dark' ? 'text-blue-400' : 'text-blue-500'}"></i>
                    <span class="font-medium ${document.body.getAttribute('data-theme') === 'dark' ? 'text-gray-200' : 'text-gray-700'}">Grok3:</span>
                </div>
                <div class="prose prose-sm max-w-none ${document.body.getAttribute('data-theme') === 'dark' ? 'text-gray-100 prose-invert' : 'text-gray-800'}">
                    ${marked.parse(message.text)}
                </div>
                ${message.context ? `
                    <div class="mt-3 text-xs border-t pt-2 ${document.body.getAttribute('data-theme') === 'dark' ? 'text-gray-400 border-gray-700' : 'text-gray-500 border-gray-200'}">
                        <p><strong>Context:</strong> ${message.context.fileName} (${message.context.fileType})</p>
                        ${message.context.selection ? `
                            <pre class="mt-1 p-2 rounded border text-xs overflow-auto ${document.body.getAttribute('data-theme') === 'dark' ? 'bg-gray-900 text-gray-200 border-gray-700' : 'bg-white text-gray-700 border-gray-200'}">
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
            timestamp: new Date().toISOString(),
            context: message.context
        });
    } else if (message.type === 'chatError') {
        chatDisplay.innerHTML += `<div class="mb-4 p-3 bg-red-50 rounded-md text-red-700">${message.text}</div>`;
        chatDisplay.scrollTop = chatDisplay.scrollHeight;
    } else if (message.type === 'chatHistory') {
        chatHistory = message.history;
        updateHistoryList();
    } else if (message.type === 'setTheme') {
        document.body.setAttribute('data-theme', message.theme);
    } else if (message.type === 'settings') {
        console.log('Received settings:', message.settings);
        
        // Update settings toggles
        const settingsToggles = {
            'grok3-toggle': message.settings.aiModels?.grok3 || false,
            'openai-toggle': message.settings.aiModels?.openai || false,
            'anthropic-toggle': message.settings.aiModels?.anthropic || false,
            'groq-toggle': message.settings.aiModels?.groq || false,
            'ollama-toggle': message.settings.aiModels?.ollama || false,
            'deepseek-toggle': message.settings.aiModels?.deepseek || false
        };
        
        Object.entries(settingsToggles).forEach(([id, value]) => {
            const toggle = document.getElementById(id);
            if (toggle) {
                toggle.checked = value;
                console.log(`Set ${id} to ${value}`);
            }
        });
        
        document.getElementById('websocket-toggle').checked = message.settings.websocket || false;
        
        // Sync to chat toggles
        syncToggles('', 'chat-');
        
        document.getElementById('grok3-keys').value = message.settings.grok3Keys || '';
        document.getElementById('openai-keys').value = message.settings.openaiKeys || '';
        document.getElementById('anthropic-keys').value = message.settings.anthropicKeys || '';
        document.getElementById('groq-keys').value = message.settings.grokKeys || '';
        document.getElementById('ollama-keys').value = message.settings.ollamaKeys || '';
        document.getElementById('deepseek-keys').value = message.settings.deepseekKeys || '';
        document.getElementById('temperature').value = message.settings.temperature || '0.7';
        document.getElementById('volume-sensitivity').value = message.settings.volumeSensitivity || '50';
        document.getElementById('temp-value').textContent = message.settings.temperature || '0.7';
        document.getElementById('vol-value').textContent = message.settings.volumeSensitivity || '50';
        document.getElementById('language').value = message.settings.language || 'en';
        document.getElementById('theme').value = message.settings.theme || 'system';
    } else if (message.type === 'info') {
        document.getElementById('tokens').textContent = message.info.tokens || 'N/A';
        document.getElementById('requests').textContent = message.info.requests || '0';
        document.getElementById('lines').textContent = message.info.lines || '0';
        const languagesDiv = document.getElementById('languages');
        languagesDiv.innerHTML = message.info.languages?.map(lang => `
            <span class="inline-flex items-center px-2 py-1 bg-teal-50 text-teal-700 text-xs font-medium rounded-full">
                <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 14v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V6h2c1.1 0 2-.9 2-2v1.64c2.39 1.39 4 3.96 4 6.86 0 1.94-.78 3.7-2.1 4.89z"/></svg>
                ${lang}
            </span>
        `).join('') || 'None';
    } else if (message.type === 'apiTestResult') {
        showError(`${message.model} API test: ${message.success ? 'Success' : 'Failed'}`);
    }
});

vscode.postMessage({ type: 'getChatHistory' });

function renderUI() {
    // Placeholder for UI rendering logic if needed
}