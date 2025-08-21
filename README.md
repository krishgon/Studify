# 📚 Studify - Chrome Extension

A Chrome extension that blocks uneducational YouTube videos by reading video categories from the page source code.

## 🎯 Purpose

Studify helps students stay focused on learning by automatically filtering YouTube content. It only allows videos categorized as "Education" and blocks all other content.

## 🚀 Features

- **Automatic Category Detection**: Parses YouTube's `ytInitialPlayerResponse` data in the page source to identify the video's category
- **Smart Filtering**: Only allows educational content
- **User-Friendly Blocking**: Clean, informative blocking page with navigation options
- **Real-Time Status**: Popup interface showing extension status
- **Intent Check**: Full‑screen prompt when opening YouTube asks whether you're studying or browsing and for how long. Browsing requires typing *"I am sure I am not procrastinating"* and temporarily disables filtering.

## 📁 File Structure

```
studify/
├── manifest.json      # Extension configuration
├── content.js         # Main content script (runs on YouTube pages)
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
- **Blocking Page**: Modify the `blockPage()` function in `content.js`
- **Styling**: Update CSS in `popup.html` and `content.js`

## 🔮 Future Enhancements

- [ ] Add whitelist/blacklist functionality
- [ ] Create settings page for user preferences
- [ ] Add statistics and usage tracking
- [ ] Support for other educational platforms

## ⚠️ Limitations

- Detection relies on YouTube's current page structure; layout changes may break category parsing.
- Videos without accessible category metadata (such as some live streams or restricted videos) may bypass the filter.

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
