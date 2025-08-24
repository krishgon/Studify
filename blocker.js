// Studify Blocker Script
// Blocks access to specified websites while study mode is active

const DEFAULT_BLOCKED_SITES = [
  'twitter.com',
  'x.com',
  'instagram.com',
  'reddit.com',
  'tiktok.com',
  'twitch.tv',
  'facebook.com'
];



function shouldBlock(hostname, customSites) {
  const allSites = DEFAULT_BLOCKED_SITES.concat(customSites || []);
  return allSites.some(site => {
    // Exact match
    if (hostname === site) return true;
    // Subdomain match (e.g., www.youtube.com matches youtube.com)
    if (hostname.endsWith('.' + site)) return true;
    // Domain match (e.g., youtube.com matches www.youtube.com)
    if (site.endsWith('.' + hostname)) return true;
    return false;
  });
}

function showBlockOverlay() {
  const render = () => {
    document.body.innerHTML = '';
    const overlay = document.createElement('div');
    overlay.id = 'studify-block-overlay';
    Object.assign(overlay.style, {
      position: 'fixed',
      inset: '0',
      background: '#000',
      color: '#fff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '24px',
      zIndex: '9999999',
      fontFamily: 'Segoe UI, Roboto, sans-serif',
      textAlign: 'center'
    });
    overlay.textContent = "You can't access this website while on study mode";
    document.body.appendChild(overlay);
  };
  if (document.body) {
    render();
  } else {
    document.addEventListener('DOMContentLoaded', render);
  }
}

function checkBlock() {
  chrome.storage.local.get(['studifyStudyUntil', 'studifyUserBlockedSites'], data => {
    const studyUntil = parseInt(data['studifyStudyUntil'] || '0', 10);
    if (Date.now() < studyUntil) {
      const hostname = window.location.hostname;
      const customSites = data['studifyUserBlockedSites'] || [];
      if (shouldBlock(hostname, customSites)) {
        showBlockOverlay();
      }
    }
  });
}

checkBlock();

// Reload blocked sites when study mode starts
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes['studifyStudyUntil']) {
    const newUntil = parseInt(changes['studifyStudyUntil'].newValue || '0', 10);
    if (Date.now() < newUntil) {
      chrome.storage.local.get(['studifyUserBlockedSites'], data => {
        const hostname = window.location.hostname;
        const customSites = data['studifyUserBlockedSites'] || [];
        if (shouldBlock(hostname, customSites)) {
          location.reload();
        }
      });
    }
  }
});
