// Studify Popup Script
// Handles the popup interface and communicates with content scripts

document.addEventListener('DOMContentLoaded', function() {
    console.log('Studify: Popup loaded');
    
    // Check if we're on a YouTube page
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        const currentTab = tabs[0];
        const isYouTube = currentTab.url && currentTab.url.includes('youtube.com');
        
        updateStatus(isYouTube);
    });
});

// Function to update the status display
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

// Function to get current tab info (for future use)
function getCurrentTab() {
    return new Promise((resolve) => {
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            resolve(tabs[0]);
        });
    });
}
