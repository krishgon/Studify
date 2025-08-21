// Studify Content Script
// This script runs on YouTube pages to filter content based on video category

console.log('Studify: Content script loaded');

// Keep references to observers and listeners to avoid duplicates
let navigateListener = null;
let currentVideoId = null;
let isAnalyzing = false;

const DISABLED_UNTIL_KEY = 'studifyDisabledUntil';

// Prompt the user for their intent and duration before allowing YouTube access
function showPurposeOverlay() {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.id = 'studify-purpose-overlay';
    overlay.innerHTML = `
      <div class="studify-modal">
        <h1 class="studify-title">What brings you to YouTube?</h1>
        <div class="studify-choice">
          <button class="studify-btn" data-mode="study">Study</button>
          <button class="studify-btn" data-mode="browse">Browse</button>
        </div>
      </div>
    `;

    const style = document.createElement('style');
    style.textContent = `
      #studify-purpose-overlay {
        position: fixed;
        inset: 0;
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(0, 0, 0, 0.6);
        backdrop-filter: blur(6px);
        font-family: 'Segoe UI', Roboto, sans-serif;
      }
      #studify-purpose-overlay .studify-modal {
        background: #ffffff;
        border-radius: 12px;
        padding: 40px 30px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        text-align: center;
        max-width: 400px;
        width: 90%;
      }
      #studify-purpose-overlay h1 {
        margin: 0 0 20px;
        font-size: 24px;
        color: #111827;
      }
      .studify-choice {
        display: flex;
        gap: 16px;
        justify-content: center;
      }
      .studify-btn {
        flex: 1;
        padding: 12px 0;
        font-size: 16px;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        color: #ffffff;
        transition: background 0.2s;
      }
      .studify-btn[data-mode="study"] { background: #22c55e; }
      .studify-btn[data-mode="study"]:hover { background: #16a34a; }
      .studify-btn[data-mode="browse"] { background: #3b82f6; }
      .studify-btn[data-mode="browse"]:hover { background: #2563eb; }
      .studify-inputs {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .studify-inputs input {
        padding: 10px;
        font-size: 16px;
        border: 1px solid #cbd5e1;
        border-radius: 6px;
      }
      .studify-start-btn {
        padding: 12px;
        background: #6366f1;
        color: #ffffff;
        border: none;
        border-radius: 8px;
        font-size: 16px;
        cursor: pointer;
        transition: background 0.2s;
      }
      .studify-start-btn:hover { background: #4f46e5; }
    `;
    overlay.appendChild(style);

    function askDuration(mode) {
      const modal = overlay.querySelector('.studify-modal');
      modal.innerHTML = `
        <h1 class="studify-title">How many minutes will you ${mode}?</h1>
        <div class="studify-inputs">
          <input id="studify-minutes" type="number" min="1" placeholder="Minutes">
          ${mode === 'browse'
            ? '<input id="studify-confirm" type="text" placeholder="Type: I am sure I am not procrastinating">'
            : ''}
          <button class="studify-start-btn">Start</button>
        </div>
      `;
      modal.querySelector('.studify-start-btn').addEventListener('click', () => {
        const minutes = parseInt(document.getElementById('studify-minutes').value, 10);
        if (isNaN(minutes) || minutes <= 0) return;
        if (mode === 'browse') {
          const confirmation = document.getElementById('studify-confirm').value;
          if (confirmation !== 'I am sure I am not procrastinating') return;
          const disabledUntil = Date.now() + minutes * 60 * 1000;
          localStorage.setItem(DISABLED_UNTIL_KEY, String(disabledUntil));
          overlay.remove();
          resolve('browse');
        } else {
          overlay.remove();
          resolve('study');
        }
      });
    }

    overlay.querySelectorAll('.studify-btn').forEach((btn) => {
      btn.addEventListener('click', () => askDuration(btn.dataset.mode));
    });

    (document.body || document.documentElement).appendChild(overlay);
  });
}

// Function to check if we're on a YouTube watch page
function isYouTubeWatchPage() {
  const currentUrl = window.location.href;
  const isWatchPage = currentUrl.includes('/watch?v=');
  console.log('Studify: Current URL:', currentUrl);
  console.log('Studify: Is watch page:', isWatchPage);
  return isWatchPage;
}

// Function to get current video ID from URL
function getCurrentVideoId() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('v');
}


// Retrieve the current video's category using multiple fallbacks
function getVideoCategory() {
  const genreMeta = document.querySelector('meta[itemprop="genre"]');
  if (genreMeta) {
    console.log("from the meta tag");
    return genreMeta.getAttribute('content');
  }

  // Try the globally exposed player response first
  let playerResponse = window.ytInitialPlayerResponse;

  // Some navigations don't update ytInitialPlayerResponse, so try ytplayer config
  if (!playerResponse &&
      window.ytplayer &&
      window.ytplayer.config &&
      window.ytplayer.config.args &&
      window.ytplayer.config.args.raw_player_response) {
    try {
      playerResponse = JSON.parse(
        window.ytplayer.config.args.raw_player_response
      );
    } catch (e) {
      console.error('Studify: Failed to parse raw_player_response', e);
    }
  }

  if (playerResponse) {
    if (
      playerResponse.microformat &&
      playerResponse.microformat.playerMicroformatRenderer &&
      playerResponse.microformat.playerMicroformatRenderer.category
    ) {
      return playerResponse.microformat.playerMicroformatRenderer.category;
    }
    if (playerResponse.videoDetails && playerResponse.videoDetails.category) {
      return playerResponse.videoDetails.category;
    }
  }

  return null;
}

async function fetchCategoryFromOriginalHTML() {
  try {
    const res = await fetch(window.location.href, { cache: 'no-store', credentials: 'same-origin' });
    const html = await res.text();

    // Look for: <meta itemprop="genre" content="...">
    const metaMatch = html.match(/<meta[^>]*itemprop=(['"])genre\1[^>]*>/i);
    if (metaMatch) {
      const tag = metaMatch[0];
      const contentMatch = tag.match(/content=(['"])(.*?)\1/i);
      if (contentMatch) {
        console.log('Studify: Category from original HTML meta tag');
        return contentMatch[2];
      }
    }

    // Fallback: try JSON-LD if present
    const ldMatch = html.match(/<script[^>]*type=(['"])application\/ld\+json\1[^>]*>([\s\S]*?)<\/script>/i);
    if (ldMatch) {
      try {
        const json = JSON.parse(ldMatch[2]);
        if (json && json.genre) return json.genre;
        if (Array.isArray(json) && json[0] && json[0].genre) return json[0].genre;
      } catch (e) {}
    }
  } catch (e) {
    console.error('Studify: Failed to fetch original HTML', e);
  }
  return null;
}

async function isEducationalVideo() {
  console.log('Studify: Checking video category...');
  let category = getVideoCategory();
  if (!category) {
    category = await fetchCategoryFromOriginalHTML();
  }
  console.log('Studify: Detected category:', category);
  return category === 'Education';
}

// Function to block the page if video is not educational
function blockPage() {
  console.log('Studify: Blocking non-educational content');

  document.body.innerHTML = `
    <div id="studify-block-page">
      <div class="studify-modal">
        <h1>Access Blocked</h1>
        <p>This YouTube video is not categorized as educational content.</p>
        <p>Studify only allows educational videos to help you stay focused on learning.</p>
        <button id="studify-go-back-btn">Go Back</button>
      </div>
    </div>
  `;

  const style = document.createElement('style');
  style.textContent = `
    #studify-block-page {
      position: fixed;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #0f172a;
      color: #e2e8f0;
      font-family: 'Segoe UI', Roboto, sans-serif;
    }
    #studify-block-page .studify-modal {
      background: #1e293b;
      padding: 40px 30px;
      border-radius: 12px;
      text-align: center;
      max-width: 480px;
      width: 90%;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
    }
    #studify-block-page h1 {
      margin-bottom: 16px;
      color: #f87171;
    }
    #studify-block-page p {
      margin-bottom: 20px;
      color: #cbd5e1;
      line-height: 1.4;
    }
    #studify-go-back-btn {
      padding: 12px 24px;
      border: none;
      border-radius: 8px;
      background: #3b82f6;
      color: #ffffff;
      font-size: 16px;
      cursor: pointer;
      transition: background 0.2s;
    }
    #studify-go-back-btn:hover { background: #2563eb; }
  `;
  document.head.appendChild(style);

  const btn = document.getElementById('studify-go-back-btn');
  if (btn) {
    btn.addEventListener('click', goBack, { once: true });
  }
}

// Simple goBack function that works better with YouTube
function goBack() {
  // Try to find YouTube's back button first
  const backButton = document.querySelector('button[aria-label="Back"], .ytp-back-button, [data-tooltip*="back"]');
  
  if (backButton) {
    backButton.click();
  } else {
    // Fallback to browser navigation with reload
    window.history.back();
    setTimeout(() => window.location.reload(), 100);
  }
}

const HOME_FEED_STYLE_ID = 'studify-hide-home-feed';

function isYouTubeHomePage() {
  return window.location.pathname === '/';
}

function hideHomeFeed() {
  let style = document.getElementById(HOME_FEED_STYLE_ID);
  if (!style) {
    style = document.createElement('style');
    style.id = HOME_FEED_STYLE_ID;
    style.textContent = `
      ytd-rich-grid-renderer,
      ytd-browse[page-subtype="home"] #contents,
      ytd-browse[page-subtype="home"] ytd-rich-grid-row {
        display: none !important;
      }
    `;
    document.head.appendChild(style);
  }
}

function showHomeFeed() {
  const style = document.getElementById(HOME_FEED_STYLE_ID);
  if (style) style.remove();
}

const WATCH_SIDEBAR_STYLE_ID = 'studify-hide-watch-sidebar';

function hideWatchSidebar() {
  let style = document.getElementById(WATCH_SIDEBAR_STYLE_ID);
  if (!style) {
    style = document.createElement('style');
    style.id = WATCH_SIDEBAR_STYLE_ID;
    style.textContent = `
      #related {
        display: none !important;
      }
    `;
    document.head.appendChild(style);
  }
}

function showWatchSidebar() {
  const style = document.getElementById(WATCH_SIDEBAR_STYLE_ID);
  if (style) style.remove();
}

const SHORTS_STYLE_ID = 'studify-hide-shorts';

function enableShortsHider() {
  let style = document.getElementById(SHORTS_STYLE_ID);
  if (!style) {
    style = document.createElement('style');
    style.id = SHORTS_STYLE_ID;
    style.textContent = `
      /* Hide Shorts UI across the site */
      ytd-reel-shelf-renderer,
      ytd-rich-shelf-renderer[is-shorts],
      ytd-reel-video-renderer,
      ytd-reel-item-renderer,
      a.yt-simple-endpoint[href^="/shorts"],
      ytd-mini-guide-entry-renderer[aria-label="Shorts"],
      ytd-guide-entry-renderer a[href^="/shorts"] {
        display: none !important;
      }
    `;
    document.head.appendChild(style);
  }
}

function isYouTubeShortsPage() {
  return window.location.pathname.startsWith('/shorts');
}

function blockShortsPage() {
  document.body.innerHTML = `
    <div id="studify-block-page">
      <div class="studify-modal">
        <h1>Shorts Blocked</h1>
        <p>Studify blocks YouTube Shorts to keep you focused.</p>
        <button id="studify-go-back-btn">Go Back</button>
      </div>
    </div>
  `;
  const style = document.createElement('style');
  style.textContent = `
    #studify-block-page {
      position: fixed;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #0f172a;
      color: #e2e8f0;
      font-family: 'Segoe UI', Roboto, sans-serif;
    }
    #studify-block-page .studify-modal {
      background: #1e293b;
      padding: 40px 30px;
      border-radius: 12px;
      text-align: center;
      max-width: 480px;
      width: 90%;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
    }
    #studify-block-page h1 {
      margin-bottom: 16px;
      color: #f87171;
    }
    #studify-block-page p {
      margin-bottom: 20px;
      color: #cbd5e1;
      line-height: 1.4;
    }
    #studify-go-back-btn {
      padding: 12px 24px;
      border: none;
      border-radius: 8px;
      background: #3b82f6;
      color: #ffffff;
      font-size: 16px;
      cursor: pointer;
      transition: background 0.2s;
    }
    #studify-go-back-btn:hover { background: #2563eb; }
  `;
  document.head.appendChild(style);
  const btn = document.getElementById('studify-go-back-btn');
  if (btn) {
    btn.addEventListener('click', goBack, { once: true });
  }
}

// Main function to run when page loads
function main() {
  console.log('Studify: Starting content analysis...');

  // Always hide Shorts UI elements site-wide
  enableShortsHider();

  // Block Shorts pages entirely
  if (isYouTubeShortsPage()) {
    blockShortsPage();
    return;
  }

  // Only run content filtering on YouTube watch pages
  if (isYouTubeWatchPage()) {
    const videoId = getCurrentVideoId();
    hideWatchSidebar();
    
    // Only analyze if this is a new video and we're not already analyzing
    if (videoId && videoId !== currentVideoId && !isAnalyzing) {
      currentVideoId = videoId;
      isAnalyzing = true;
      console.log('Studify: New video detected - analyzing content...');
      
      // Wait a bit for YouTube to fully load
      setTimeout(async () => {
        if (!(await isEducationalVideo())) {
          blockPage();
        } else {
          console.log('Studify: Educational content detected - allowing access');
        }
        isAnalyzing = false;
      }, 2000);
    } else if (videoId === currentVideoId) {
      console.log('Studify: Same video, skipping analysis');
    } else if (!videoId) {
      console.log('Studify: No video ID found');
    }
  } else if (isYouTubeHomePage()) {
    hideHomeFeed();
    showWatchSidebar();
    console.log('Studify: Home page detected - hiding feed');
  } else {
    showHomeFeed();
    showWatchSidebar();
    console.log('Studify: Not a watch page - allowing access to YouTube');
  }
}

// Smart navigation monitoring - only triggers on actual video changes
function setupSmartNavigationMonitoring() {
  // Remove existing listener to prevent duplicates
  if (navigateListener) {
    window.removeEventListener('yt-navigate-finish', navigateListener);
  }

  // Only listen to YouTube's official navigation event
  navigateListener = () => {
    console.log('Studify: YouTube navigation detected');

    // Small delay to ensure page is fully loaded
    setTimeout(() => {
      // Reset analysis flag for new video
      isAnalyzing = false;
      main();
    }, 1000);
  };

  window.addEventListener('yt-navigate-finish', navigateListener);
}

async function init() {
  const disabledUntil = parseInt(localStorage.getItem(DISABLED_UNTIL_KEY) || '0', 10);
  if (Date.now() < disabledUntil) {
    const remaining = disabledUntil - Date.now();
    console.log('Studify: Extension paused for browsing mode');
    setTimeout(() => {
      localStorage.removeItem(DISABLED_UNTIL_KEY);
      window.location.reload();
    }, remaining);
    return;
  }

  const choice = await showPurposeOverlay();
  if (choice === 'browse') {
    const disabledUntilNew = parseInt(localStorage.getItem(DISABLED_UNTIL_KEY) || '0', 10);
    const remaining = disabledUntilNew - Date.now();
    if (remaining > 0) {
      setTimeout(() => {
        localStorage.removeItem(DISABLED_UNTIL_KEY);
        window.location.reload();
      }, remaining);
    }
    return;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', main);
  } else {
    main();
  }

  setTimeout(() => {
    setupSmartNavigationMonitoring();
  }, 3000);
}

init();
