// Studify Popup Script
// Handles the popup interface and communicates with content scripts

const STUDY_UNTIL_KEY = 'studifyStudyUntil';

document.addEventListener('DOMContentLoaded', function() {
    initPopup();
});

function initPopup() {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        const tab = tabs[0];
        checkBrowsingMode(tab).then((state) => {
            if (state && state.remainingMs > 0) {
                renderInactiveWithTimer(state.remainingMs, tab.id);
            } else {
                checkStudyMode(tab).then((studyState) => {
                    if (studyState && studyState.remainingMs > 0) {
                        renderActiveWithTimer(studyState.remainingMs);
                    } else {
                        const isYouTube = tab.url && tab.url.includes('youtube.com');
                        updateStatus(isYouTube);
                    }
                }).catch(() => {
                    const isYouTube = tab.url && tab.url.includes('youtube.com');
                    updateStatus(isYouTube);
                });
            }
        }).catch(() => {
            const isYouTube = tab.url && tab.url.includes('youtube.com');
            updateStatus(isYouTube);
        });
    });
}

// Detect if browsing mode is active. Prefer chrome.storage, fallback to page localStorage.
function checkBrowsingMode(tab) {
    return new Promise((resolve) => {
        try {
            chrome.storage.local.get(['studifyDisabledUntil'], (data) => {
                const until = parseInt(data.studifyDisabledUntil || '0', 10);
                const remaining = until - Date.now();
                if (remaining > 0) {
                    resolve({ remainingMs: remaining });
                } else if (tab && tab.id && tab.url && tab.url.includes('youtube.com')) {
                    // Fallback: read from the active YouTube tab's localStorage
                    chrome.scripting.executeScript(
                        {
                            target: { tabId: tab.id },
                            func: () => localStorage.getItem('studifyDisabledUntil')
                        },
                        (results) => {
                            if (!results || !results[0] || chrome.runtime.lastError) {
                                resolve(null);
                                return;
                            }
                            const value = results[0].result;
                            const until2 = parseInt(value || '0', 10);
                            const rem2 = until2 - Date.now();
                            if (rem2 > 0) {
                                try {
                                    chrome.storage.local.set({ studifyDisabledUntil: String(until2) });
                                } catch (e) {}
                                resolve({ remainingMs: rem2 });
                            } else {
                                resolve(null);
                            }
                        }
                    );
                } else {
                    resolve(null);
                }
            });
        } catch (e) {
            resolve(null);
        }
    });
}

// Detect if study mode is active. Prefer chrome.storage, fallback to page localStorage.
function checkStudyMode(tab) {
    return new Promise((resolve) => {
        try {
            chrome.storage.local.get([STUDY_UNTIL_KEY], (data) => {
                const until = parseInt(data[STUDY_UNTIL_KEY] || '0', 10);
                const remaining = until - Date.now();
                if (remaining > 0) {
                    resolve({ remainingMs: remaining });
                } else if (tab && tab.id && tab.url && tab.url.includes('youtube.com')) {
                    chrome.scripting.executeScript(
                        {
                            target: { tabId: tab.id },
                            func: () => localStorage.getItem('studifyStudyUntil')
                        },
                        (results) => {
                            if (!results || !results[0] || chrome.runtime.lastError) {
                                resolve(null);
                                return;
                            }
                            const value = results[0].result;
                            const until2 = parseInt(value || '0', 10);
                            const rem2 = until2 - Date.now();
                            if (rem2 > 0) {
                                try {
                                    chrome.storage.local.set({ [STUDY_UNTIL_KEY]: String(until2) });
                                } catch (e) {}
                                resolve({ remainingMs: rem2 });
                            } else {
                                resolve(null);
                            }
                        }
                    );
                } else {
                    resolve(null);
                }
            });
        } catch (e) {
            resolve(null);
        }
    });
}

// Function to update the status display (used when not in browsing mode)
function updateStatus(isYouTube) {
    const statusElement = document.getElementById('status');
    if (isYouTube) {
        statusElement.className = 'status active';
        statusElement.innerHTML = `
            <strong>🟢 Active</strong><br>
            Filtering YouTube content...
        `;
    } else {
        statusElement.className = 'status inactive';
        statusElement.innerHTML = `
            <strong>🔴 Inactive</strong><br>
            Not on YouTube
        `;
    }
}

function renderInactiveWithTimer(initialRemaining, tabId) {
    const statusElement = document.getElementById('status');
    statusElement.className = 'status inactive';
    statusElement.innerHTML = `
        <strong>🔴 Inactive</strong><br>
        Browsing mode: <span id="studify-remaining"></span><br>
        <button id="studify-switch-btn" class="mode-btn">Switch to Study Mode</button>
    `;

    const remainingEl = document.getElementById('studify-remaining');
    const switchBtn = document.getElementById('studify-switch-btn');

    switchBtn.addEventListener('click', () => {
        chrome.tabs.sendMessage(tabId, { action: 'switchToStudy' });
        window.close();
    });

    let ms = initialRemaining;
    function update() {
        remainingEl.textContent = formatRemaining(ms);
    }
    update();

    const interval = setInterval(() => {
        ms = Math.max(0, ms - 1000);
        if (ms <= 0) {
            clearInterval(interval);
            try { chrome.storage.local.remove('studifyDisabledUntil'); } catch (e) {}
            chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
                const isYouTube = tabs[0].url && tabs[0].url.includes('youtube.com');
                updateStatus(isYouTube);
            });
            return;
        }
        update();
    }, 1000);
}

function renderActiveWithTimer(initialRemaining) {
    const statusElement = document.getElementById('status');

    function render(ms) {
        statusElement.className = 'status active';
        statusElement.innerHTML = `
            <strong>🟢 Active</strong><br>
            Study mode: ${formatRemaining(ms)} left
        `;
    }

    let ms = initialRemaining;
    render(ms);

    const interval = setInterval(() => {
        ms = Math.max(0, ms - 1000);
        if (ms <= 0) {
            clearInterval(interval);
            try { chrome.storage.local.remove(STUDY_UNTIL_KEY); } catch (e) {}
            chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
                const isYouTube = tabs[0].url && tabs[0].url.includes('youtube.com');
                updateStatus(isYouTube);
            });
            return;
        }
        render(ms);
    }, 1000);
}

function formatRemaining(ms) {
    let total = Math.ceil(ms / 1000);
    const h = Math.floor(total / 3600);
    total = total % 3600;
    const m = Math.floor(total / 60);
    const s = total % 60;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
}
