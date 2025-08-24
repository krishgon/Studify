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

const USER_BLOCK_KEY = 'studifyUserBlockedSites';
const STUDY_UNTIL_KEY = 'studifyStudyUntil';

function shouldBlock(hostname, customSites) {
  const allSites = DEFAULT_BLOCKED_SITES.concat(customSites || []);
  return allSites.some(site => hostname === site || hostname.endsWith('.' + site));
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
  chrome.storage.local.get([STUDY_UNTIL_KEY, USER_BLOCK_KEY], data => {
    const studyUntil = parseInt(data[STUDY_UNTIL_KEY] || '0', 10);
    if (Date.now() < studyUntil) {
      const hostname = window.location.hostname;
      const customSites = data[USER_BLOCK_KEY] || [];
      if (shouldBlock(hostname, customSites)) {
        showBlockOverlay();
      }
    }
  });
}

checkBlock();
