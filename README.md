# 📚 Studify - Chrome Extension

A Chrome extension that blocks uneducational YouTube videos by reading video categories from the page source code.

## 🎯 Purpose

Studify helps students stay focused on learning by automatically filtering YouTube content. It only allows videos categorized as "Education" and blocks all other content.

## 🚀 Features

- **Automatic Detection**: Reads video categories from YouTube's page source
- **Smart Filtering**: Only allows educational content
- **User-Friendly Blocking**: Clean, informative blocking page with navigation options
- **Real-Time Status**: Popup interface showing extension status

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

- [ ] Implement actual video category detection from YouTube source
- [ ] Add whitelist/blacklist functionality
- [ ] Create settings page for user preferences
- [ ] Add statistics and usage tracking
- [ ] Support for other educational platforms

## 📝 Development Notes

- **Manifest V3**: Uses the latest Chrome extension manifest format
- **Content Scripts**: Runs on YouTube pages to analyze content
- **Permissions**: Minimal permissions required for functionality
- **Cross-Origin**: Designed to work specifically with YouTube

## 🤝 Contributing

This is a basic structure for the first commit. Future development will include:

1. **Category Detection Logic**: Reading actual video categories from YouTube
2. **Enhanced Blocking**: More sophisticated content filtering
3. **User Settings**: Customizable blocking rules
4. **Testing**: Comprehensive testing suite

## 📄 License

[Add your license here]

## 👨‍💻 Author

[Your Name] - Created for educational purposes

---

**Note**: This extension is currently in development. The category detection logic is a placeholder and will be implemented in future commits.
