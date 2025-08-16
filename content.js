// Studify Content Script
// This script runs on YouTube pages to filter content based on video category

console.log('Studify: Content script loaded');

// Keep references to observers and listeners to avoid duplicates
let navigationObserver = null;
let navigateListener = null;

// Function to check if video is educational
function isEducationalVideo() {
  console.log('Studify: Checking video category...');

  let category = null;

  const genreMeta = document.querySelector('meta[itemprop="genre"]');
  if (genreMeta) {
    category = genreMeta.getAttribute('content');
  } else if (
    window.ytInitialPlayerResponse &&
    window.ytInitialPlayerResponse.microformat &&
    window.ytInitialPlayerResponse.microformat.playerMicroformatRenderer &&
    window.ytInitialPlayerResponse.microformat.playerMicroformatRenderer.category
  ) {
    category =
      window.ytInitialPlayerResponse.microformat.playerMicroformatRenderer
        .category;
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
      <h1 style="color: #dc3545; margin-bottom: 20px;">🚫 Access Blocked</h1>
      <p style="font-size: 18px; color: #6c757d; margin-bottom: 30px;">
        This YouTube video is not categorized as educational content.
      </p>
      <p style="font-size: 16px; color: #6c757d;">
        Studify only allows educational videos to help you stay focused on learning.
      </p>
      <button onclick="window.history.back()" style="
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

// Main function to run when page loads
function main() {
  console.log('Studify: Starting content analysis...');

  // Disconnect any existing observers or listeners to prevent duplicates
  if (navigationObserver) {
    navigationObserver.disconnect();
    navigationObserver = null;
  }
  if (navigateListener) {
    window.removeEventListener('yt-navigate-finish', navigateListener);
    navigateListener = null;
  }

  // Wait a bit for YouTube to fully load
  setTimeout(() => {
    if (!isEducationalVideo()) {
      blockPage();
    } else {
      console.log('Studify: Educational content detected - allowing access');
    }

    // Set up observers and navigation listeners after evaluating the page
    setupNavigationMonitoring();
  }, 2000);
}

// Run the main function when the page is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', main);
} else {
  main();
}

// Attach MutationObserver and navigation listener to detect video changes
function setupNavigationMonitoring() {
  // Disconnect existing observer if any
  if (navigationObserver) {
    navigationObserver.disconnect();
  }

  navigationObserver = new MutationObserver(() => {
    console.log('Studify: Navigation detected via MutationObserver');
    main();
  });

  const titleEl = document.querySelector('title');
  const flexyEl = document.querySelector('ytd-watch-flexy');

  if (titleEl) {
    navigationObserver.observe(titleEl, { childList: true, subtree: true });
  }
  if (flexyEl) {
    navigationObserver.observe(flexyEl, { childList: true, subtree: true });
  }

  // Set up YouTube's custom navigation event
  if (navigateListener) {
    window.removeEventListener('yt-navigate-finish', navigateListener);
  }
  navigateListener = () => {
    console.log('Studify: Navigation detected via yt-navigate-finish');
    main();
  };
  window.addEventListener('yt-navigate-finish', navigateListener);
}
