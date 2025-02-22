const vscode = acquireVsCodeApi();
let chatHistory = [];
let isRecording = false;
// Add these variables at the top with other globals
let recordingTimer = null;
let recordingStartTime = null;


// Add this function to update recording time display
function updateRecordingTime() {
    if (!recordingStartTime) return;
    
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
            temperature: parseFloat(document.getElementById(`${model}-temperature`)?.value) || 0.7,
            contextSensitivity: parseInt(document.getElementById(`${model}-sensitivity`)?.value) || 50,
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
    body.setAttribute('data-theme', theme);
    if (theme === 'system') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        body.classList.toggle('dark', prefersDark);
    } else {
        body.classList.toggle('dark', theme === 'dark');
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
        document.getElementById(`${model}-temperature`).value = config.temperature || 0.7;
        document.getElementById(`${model}-temp-value`).textContent = config.temperature || '0.7';
        document.getElementById(`${model}-sensitivity`).value = config.contextSensitivity || 50;
        document.getElementById(`${model}-sens-value`).textContent = config.contextSensitivity || '50';
        document.getElementById(`${model}-max-tokens`).value = config.maxTokens || 4096;
    });

    models.forEach(model => {
        document.getElementById(`func-${model}-toggle`).checked = settings.functionCallingAIs?.[model] || false;
        document.getElementById(`think-${model}-toggle`).checked = settings.thinkingAIs?.[model] || false;
    });

    const chatStates = settings.chatStates || {};
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
            fullRewrite: document.getElementById('full-rewrite-toggle')?.checked || false
        }
    };
}

function updateHistoryList() {
    const historyList = document.getElementById('history-list');
    historyList.innerHTML = chatHistory.length ?
        chatHistory.map(item => `
            <div class="p-3 rounded-md border border-zinc-200" style="overflow: auto">
                <p class="text-sm"><strong>Prompt:</strong> ${item.prompt}</p>
                <p class="text-sm prose prose-sm max-w-none"><strong>Response:</strong> ${marked.parse(item.response)}</p>
                ${item.context ? `
                    <p class="text-xs"><strong>File:</strong> ${item.context.fileName} (${item.context.fileType})</p>
                    ${item.context.selection ? `<p class="text-xs"><strong>Selection:</strong> <pre>${item.context.selection}</pre></p>` : ''}
                ` : ''}
                <p class="text-xs">${new Date(item.timestamp).toLocaleString()}</p>
            </div>
        `).join('') :
        '<p class="text-sm">No chat history yet.</p>';
}

// Initialize UI elements
document.addEventListener('DOMContentLoaded', () => {
    setupChatToggleListeners();
    setupSettingsToggleListeners();

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

    // Recording controls
    const startButton = document.getElementById('start-recording');
    const stopButton = document.getElementById('stop-recording');
    const micIcon = document.getElementById('mic-icon');
    const recordingIndicator = document.getElementById('recording-indicator');
    const micStatus = document.getElementById('mic-status');
    const recordingTime = document.getElementById('recording-time');

    startButton.addEventListener('click', () => {
        if (!startButton.disabled) {
            vscode.postMessage({ type: 'startRecording' });
            startRecordingUI();
        }
    });

    stopButton.addEventListener('click', () => {
        if (!stopButton.disabled) {
            vscode.postMessage({ type: 'stopRecording' });
            stopRecordingUI();
        }
    });

    function startRecordingUI() {
        isRecording = true;
        recordingStartTime = Date.now();
        startButton.disabled = true;
        stopButton.disabled = false;
        micIcon.classList.add('text-red-600');
        micIcon.classList.remove('text-teal-600');
        recordingIndicator.classList.remove('hidden');
        micStatus.textContent = 'Listening...';
        recordingTime.classList.remove('hidden');
        recordingTimer = setInterval(updateRecordingTime, 1000);
    }

    function stopRecordingUI() {
        isRecording = false;
        recordingStartTime = null;
        startButton.disabled = false;
        stopButton.disabled = true;
        micIcon.classList.remove('text-red-600');
        micIcon.classList.add('text-teal-600');
        recordingIndicator.classList.add('hidden');
        micStatus.textContent = 'Click to start listening...';
        recordingTime.classList.add('hidden');
        clearInterval(recordingTimer);
    }

});

// Handle messages from the extension
window.addEventListener('message', event => {
    const message = event.data;
    const chatDisplay = document.getElementById('chat-display');
    console.log("ws Message reciever");
    console.log(message);
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
    } else if (message.type === 'settings') {
        loadSettings(message.settings);
    } else if (message.type === 'apiTestResult') {
        showError(`${message.model} API test: ${message.success ? 'Success' : 'Failed'}`);
    } else if (message.type === 'recordingStarted') {
        startRecordingUI();
    } else if (message.type === 'recordingStopped') {
        stopRecordingUI();
    } else if (message.type === 'transcription') {
        // Switch to chat tab
        const chatTabBtn = document.querySelector('.tab-btn[data-tab="chat"]');
        if (chatTabBtn) {
            chatTabBtn.click(); // Trigger tab switch
            
            // Set transcription as chat input and send
            const transcription = message.transcription;
            chatInput.value = transcription;
            sendChat();
            
            // Optional: Show notification
            showNotification(`Transcription received: "${transcription}"`);
        }
    }
});

function loadInfo() {
    vscode.postMessage({ type: 'getInfo' });
}