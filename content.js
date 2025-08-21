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
    Object.assign(overlay.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      backgroundColor: '#ffffff',
      zIndex: '9999',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      fontFamily: 'Arial, sans-serif',
    });

    const title = document.createElement('h1');
    title.textContent = 'Why are you visiting YouTube?';
    overlay.appendChild(title);

    const buttons = document.createElement('div');
    buttons.style.display = 'flex';
    buttons.style.gap = '20px';
    overlay.appendChild(buttons);

    const studyBtn = document.createElement('button');
    studyBtn.textContent = 'Study';
    const browseBtn = document.createElement('button');
    browseBtn.textContent = 'Browse';

    [studyBtn, browseBtn].forEach((btn) => {
      btn.style.padding = '10px 20px';
      btn.style.fontSize = '16px';
      btn.style.cursor = 'pointer';
    });

    buttons.append(studyBtn, browseBtn);

    function askDuration(mode) {
      title.textContent = `How many minutes will you ${mode}?`;
      buttons.innerHTML = '';

      const input = document.createElement('input');
      input.type = 'number';
      input.min = '1';
      input.style.padding = '8px';
      input.style.fontSize = '16px';

      const startBtn = document.createElement('button');
      startBtn.textContent = 'Continue';
      startBtn.style.padding = '10px 20px';
      startBtn.style.marginLeft = '10px';
      startBtn.style.fontSize = '16px';
      startBtn.style.cursor = 'pointer';

      startBtn.addEventListener('click', () => {
        const minutes = parseInt(input.value, 10);
        if (isNaN(minutes) || minutes <= 0) {
          return;
        }
        if (mode === 'browse') {
          const confirmation = prompt('Type "I am sure I am not procrastinating" to continue:');
          if (confirmation !== 'I am sure I am not procrastinating') {
            return;
          }
          const disabledUntil = Date.now() + minutes * 60 * 1000;
          localStorage.setItem(DISABLED_UNTIL_KEY, String(disabledUntil));
          overlay.remove();
          resolve('browse');
        } else {
          overlay.remove();
          resolve('study');
        }
      });

      buttons.append(input, startBtn);
    }

    studyBtn.addEventListener('click', () => askDuration('study'));
    browseBtn.addEventListener('click', () => askDuration('browse'));

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
  
  // Clear the page content
  document.body.innerHTML = `
    <div style="
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      font-family: Arial, sans-serif;
      text-align: center;
      background-color: #f8f9fa;
    ">
      <h1 style="color: #dc3545; margin-bottom: 20px;"> Access Blocked</h1>
      <p style="font-size: 18px; color: #6c757d; margin-bottom: 30px;">
        This YouTube video is not categorized as educational content.
      </p>
      <p style="font-size: 16px; color: #6c757d;">
        Studify only allows educational videos to help you stay focused on learning.
      </p>
      <button id="studify-go-back-btn" style="
        background-color: #007bff;
        color: white;
        border: none;
        padding: 12px 24px;
        border-radius: 6px;
        font-size: 16px;
        cursor: pointer;
        margin-top: 20px;
      ">
        Go Back
      </button>
    </div>
  `;

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
    <div style="
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      font-family: Arial, sans-serif;
      text-align: center;
      background-color: #f8f9fa;
    ">
      <h1 style="color: #dc3545; margin-bottom: 20px;">Shorts Blocked</h1>
      <p style="font-size: 16px; color: #6c757d;">
        Studify blocks YouTube Shorts to keep you focused.
      </p>
      <button id="studify-go-back-btn" style="
        background-color: #007bff;
        color: white;
        border: none;
        padding: 12px 24px;
        border-radius: 6px;
        font-size: 16px;
        cursor: pointer;
        margin-top: 20px;
      ">
        Go Back
      </button>
    </div>
  `;
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
