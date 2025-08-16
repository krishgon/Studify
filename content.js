// Studify Content Script
// This script runs on YouTube pages to filter content based on video category

console.log('Studify: Content script loaded');

// Keep references to observers and listeners to avoid duplicates
let navigateListener = null;
let currentVideoId = null;
let isAnalyzing = false;

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

// Promise that resolves once the genre meta tag is available
function waitForGenreMeta() {
  return new Promise((resolve) => {
    const existing = document.querySelector("meta[itemprop='genre']");
    if (existing) {
      return resolve();
    }

    const observer = new MutationObserver((mutations, obs) => {
      const meta = document.querySelector("meta[itemprop='genre']");
      if (meta) {
        obs.disconnect();
        resolve();
      }
    });

    observer.observe(document.head, { childList: true, subtree: true });
  });
}

// Retrieve the current video's category using multiple fallbacks
function getVideoCategory() {
  const genreMeta = document.querySelector('meta[itemprop="genre"]');
  if (genreMeta) {
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

// Function to check if video is educational
async function isEducationalVideo() {
  console.log('Studify: Checking video category...');
  await waitForGenreMeta();
  const category = getVideoCategory();
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
      <button onclick="goBack()" style="
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

// Main function to run when page loads
function main() {
  console.log('Studify: Starting content analysis...');

  // Only run content filtering on YouTube watch pages
  if (isYouTubeWatchPage()) {
    const videoId = getCurrentVideoId();
    
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
  } else {
    console.log('Studify: Not a watch page - allowing access to YouTube');
  }
}

// Run the main function when the page is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', main);
} else {
  main();
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

// Set up navigation monitoring after initial page load
setTimeout(() => {
  setupSmartNavigationMonitoring();
}, 3000);
