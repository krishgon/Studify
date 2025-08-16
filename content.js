// Studify Content Script
// This script runs on YouTube pages to filter content based on video category

console.log('Studify: Content script loaded');

// Function to check if video is educational
function isEducationalVideo() {
  // This is a placeholder - we'll implement the actual logic later
  // to read video category from YouTube's page source
  console.log('Studify: Checking video category...');
  
  // For now, return true to allow all videos
  // Later we'll implement the actual category detection
  return true;
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
  
  // Wait a bit for YouTube to fully load
  setTimeout(() => {
    if (!isEducationalVideo()) {
      blockPage();
    } else {
      console.log('Studify: Educational content detected - allowing access');
    }
  }, 2000);
}

// Run the main function when the page is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', main);
} else {
  main();
}
