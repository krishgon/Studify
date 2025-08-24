// Studify Popup Script
// Handles the popup interface and communicates with content scripts

const STUDY_UNTIL_KEY = 'studifyStudyUntil';
const USER_BLOCK_KEY = 'studifyUserBlockedSites';

document.addEventListener('DOMContentLoaded', function() {
    initPopup();
});

function initPopup() {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        const tab = tabs[0];
        checkBrowsingMode(tab).then((state) => {
            if (state && state.remainingMs > 0) {
                renderInactiveWithTimer(state.remainingMs);
                hideBlacklistSection();
            } else {
                checkStudyMode(tab).then((studyState) => {
                    if (studyState && studyState.remainingMs > 0) {
                        renderActiveWithTimer(studyState.remainingMs);
                        showBlacklistSection();
                    } else {
                        const isYouTube = tab.url && tab.url.includes('youtube.com');
                        updateStatus(isYouTube);
                        hideBlacklistSection();
                    }
                }).catch(() => {
                    const isYouTube = tab.url && tab.url.includes('youtube.com');
                    updateStatus(isYouTube);
                    hideBlacklistSection();
                });
            }
        }).catch(() => {
            const isYouTube = tab.url && tab.url.includes('youtube.com');
            updateStatus(isYouTube);
            hideBlacklistSection();
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

function renderInactiveWithTimer(initialRemaining) {
    const statusElement = document.getElementById('status');

    function render(ms) {
        statusElement.className = 'status inactive';
        statusElement.innerHTML = `
            <strong>🔴 Inactive</strong><br>
            Browsing mode: ${formatRemaining(ms)} left
        `;
    }

    let ms = initialRemaining;
    render(ms);

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
        render(ms);
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

function showBlacklistSection() {
    const section = document.getElementById('blacklist-section');
    section.style.display = 'block';
    document.getElementById('add-blacklist').addEventListener('click', addCurrentSiteToBlacklist);
    loadBlockedSites();
}

function hideBlacklistSection() {
    const section = document.getElementById('blacklist-section');
    section.style.display = 'none';
}

function addCurrentSiteToBlacklist() {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        const url = tabs[0].url || '';
        let hostname = '';
        try {
            hostname = new URL(url).hostname;
        } catch (e) {
            return;
        }
        chrome.storage.local.get({ [USER_BLOCK_KEY]: [] }, (data) => {
            const list = data[USER_BLOCK_KEY];
            if (!list.includes(hostname)) {
                list.push(hostname);
                chrome.storage.local.set({ [USER_BLOCK_KEY]: list }, () => {
                    // Reload the current tab after adding to blacklist
                    chrome.tabs.reload(tabs[0].id);
                    // Close the popup
                    window.close();
                });
            } else {
                // If already in blacklist, just reload the page
                chrome.tabs.reload(tabs[0].id);
                window.close();
            }
        });
    });
}

function loadBlockedSites() {
    chrome.storage.local.get({ [USER_BLOCK_KEY]: [] }, (data) => {
        const list = data[USER_BLOCK_KEY];
        const ul = document.getElementById('blocked-list');
        ul.innerHTML = '';
        if (list.length === 0) {
            const li = document.createElement('li');
            li.className = 'empty';
            li.textContent = 'No websites added';
            ul.appendChild(li);
            return;
        }
        list.forEach(site => {
            const li = document.createElement('li');
            const del = document.createElement('button');
            del.className = 'delete-btn';
            
            // Create garbage icon
            const deleteIcon = document.createElement('img');
            deleteIcon.src = chrome.runtime.getURL('icons/delete.png');
            deleteIcon.className = 'delete-icon';
            deleteIcon.alt = 'Delete';
            del.appendChild(deleteIcon);
            
            del.addEventListener('click', () => removeBlockedSite(site));
            const span = document.createElement('span');
            span.textContent = site;
            li.appendChild(del);
            li.appendChild(span);
            ul.appendChild(li);
        });
    });
}

function removeBlockedSite(site) {
    chrome.storage.local.get({ [USER_BLOCK_KEY]: [] }, (data) => {
        const list = data[USER_BLOCK_KEY].filter(s => s !== site);
        chrome.storage.local.set({ [USER_BLOCK_KEY]: list }, loadBlockedSites);
    });
}
