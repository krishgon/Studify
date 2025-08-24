const DEFAULT_BLOCKLIST = [
  'facebook.com',
  'instagram.com',
  'twitter.com',
  'x.com',
  'reddit.com',
  'tiktok.com',
  'netflix.com'
];

function getCustomBlocklist() {
  return new Promise((resolve) => {
    try {
      chrome.storage.local.get({ studifyBlocklist: [] }, (data) => {
        const list = Array.isArray(data.studifyBlocklist) ? data.studifyBlocklist : [];
        resolve(list);
      });
    } catch (e) {
      resolve([]);
    }
  });
}

async function reloadBlockedTabs(excludeId) {
  const customList = await getCustomBlocklist();
  const allHosts = Array.from(new Set([...DEFAULT_BLOCKLIST, ...customList]));
  chrome.tabs.query({}, (tabs) => {
    for (const tab of tabs) {
      if (!tab.id || tab.id === excludeId) continue;
      const url = tab.url || '';
      if (url.includes('youtube.com')) {
        chrome.tabs.reload(tab.id);
        continue;
      }
      for (const host of allHosts) {
        if (url.includes(host)) {
          chrome.tabs.reload(tab.id);
          break;
        }
      }
    }
  });
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request && request.action === 'reloadBlocked') {
    const excludeId = sender.tab ? sender.tab.id : undefined;
    reloadBlockedTabs(excludeId);
    sendResponse({ status: 'reloaded' });
  }
});
