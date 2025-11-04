# 📚 Studify - Chrome Extension

A Chrome extension for mindful YouTube usage: hides distracting UI (like Shorts and feeds), prompts your intent (Study/Browse), and blocks selected sites during study sessions.

## 🎯 Purpose

Studify helps students stay focused on learning by reducing distractions on YouTube and across the web during study sessions.

## 🚀 Features

- **Shorts Blocking**: Blocks YouTube Shorts pages and hides Shorts UI across the site
- **Distraction Hiding**: Hides home feed and watch sidebar to reduce recommendations
- **Study Mode Site Blocking**: Blocks popular and custom websites during active study sessions
- **Real-Time Status**: Popup interface showing extension status
- **Intent Check**: Full‑screen prompt when opening YouTube asks whether you're studying or browsing and for how long (using preset durations). Browsing temporarily disables the prompt; study sessions persist for the chosen time even across reloads.

## 📁 File Structure

```
studify/
├── manifest.json      # Extension configuration
├── content.js         # Main content script (Shorts blocking, hide feeds/sidebar, intent prompt)
├── popup.html         # Extension popup interface
├── popup.js           # Popup logic and status updates
├── icons/             # Extension icons (16x16, 48x48, 128x128)
└── README.md          # This file
```

## 🔧 Installation (Development)

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd studify
   ```

2. **Load in Chrome**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select the `studify` folder

3. **Test the extension**
   - Navigate to any YouTube video
   - The extension will automatically analyze the content
   - Click the extension icon to see status

## 🎨 Customization

- **Icons**: Replace placeholder icons in the `icons/` folder
- **Styling**: Update CSS in `popup.html` and `content.js`

## 🔮 Future Enhancements

- [ ] Create settings page for user preferences
- [ ] Add statistics and usage tracking
- [ ] Support for other educational platforms

## ⚠️ Limitations

- YouTube layout changes can affect UI selectors used to hide feeds/sidebars.

## 📝 Development Notes

- **Manifest V3**: Uses the latest Chrome extension manifest format
- **Content Scripts**: Runs on YouTube pages to analyze content
- **Permissions**: Minimal permissions required for functionality
- **Cross-Origin**: Designed to work specifically with YouTube

## 🤝 Contributing

This is a basic structure for the first commit. Future development will include:

1. **Improved Category Detection**: Increasing accuracy and resilience to YouTube layout changes
2. **Enhanced Blocking**: More sophisticated content filtering
3. **User Settings**: Customizable blocking rules
4. **Testing**: Comprehensive testing suite

## 📄 License

This project is proprietary software. Distributed only via the Chrome Web Store.  
Unauthorized copying, modification, or redistribution is prohibited.  

## 👨‍💻 Author

Krish Agrawal

---

**Note**: This extension is currently in development. Category detection depends on YouTube's page structure and may need updates if that structure changes.
