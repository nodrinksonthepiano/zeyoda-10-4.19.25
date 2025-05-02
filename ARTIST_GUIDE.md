# ZEYODA Artist Guide

Welcome to ZEYODA! This guide will help you set up your own artist page by customizing the open-source ZEYODA template. 

## 🚀 Getting Started

### Step 1: Fork or Download the Repository

- **Option A**: Fork the repo on GitHub (recommended for developers)
- **Option B**: Download the code and extract it to your computer

### Step 2: Set Up Your Configuration

1. Navigate to the `artists` folder
2. Make a copy of `template-config.json` and rename it to `config.json`
3. Edit `config.json` to include your information

### Step 3: Configure Your Artist Profile

Update the following fields in your config.json:

```json
"yourartistid": {  // Change this to your preferred ID (lowercase, no spaces)
  "name": "YOUR ARTIST NAME",  // Your display name (can be capitalized)
  "displayName": "YOUR DISPLAY NAME",  // How your name appears in content
  "tokenName": "YOUR TOKEN NAME",  // What your tokens are called
  "artworkTitle": "Your Artwork Title",  // Title of your featured work
  "artworkYear": "2025",  // Year of the work
  "tokenPrice": 0.0005,  // Price per token in USD
  "videoSrc": "assets/your-video.mp4",  // Path to your video
  "theme": {
    "primaryColor": "#0a1a3b",  // Background color
    "accentColor": "#4073ff",  // Highlight color
    "gradientStart": "#d4af37",  // Start of text gradient
    "gradientMiddle": "#f9f295",  // Middle of text gradient
    "gradientEnd": "#d4af37",  // End of text gradient
    "fontFamily": "Bungee, cursive"  // Font for your name
  }
}
```

### Step 4: Add Your Media

1. Place your video file in the `assets` folder
2. Make sure the filename matches what you specified in `videoSrc`
3. The video should be in MP4 format for best compatibility

### Step 5: Customize Your Orbital Tokens

The orbital tokens are connections to other artists in the ZEYODA ecosystem. Update them with artists you want to reference:

```json
"orbitalTokens": [
  { "name": "OTHER ARTIST", "angle": 0 },
  { "name": "ANOTHER ARTIST", "angle": 72 },
  { "name": "THIRD ARTIST", "angle": 144 },
  { "name": "FOURTH ARTIST", "angle": 216 },
  { "name": "FIFTH ARTIST", "angle": 288 }
]
```

The `angle` parameter determines where on the orbit the token appears (0-360 degrees).

### Step 6: Test Your Configuration

1. Open `index.html` in a web browser
2. Verify that your name, video, and theme appear correctly
3. Make sure your orbital tokens display properly

### Step 7: Deploy Your ZEYODA Instance

Choose a hosting platform:

- **Vercel**: Connect to your GitHub repo for automatic deployment
- **Netlify**: Similar to Vercel with drag-and-drop support
- **GitHub Pages**: Free hosting directly from your repository
- **IPFS**: For a fully decentralized deployment

## 🎨 Advanced Customization

### Custom CSS

If you want to further customize your storefront's appearance, you can modify `style.css`. Look for these sections to make targeted changes:

1. The `.yourartistid-theme` class (add this with your ID)
2. The `.artist-name` class for name styling

### Custom JavaScript

For advanced functionality, you can extend `script.js`. Key areas to consider:

1. The `transitionToArtist()` function for handling navigation
2. The `setupOrbitalTokens()` function for token behavior

## 🔗 Connecting With Other Artists

To connect with other ZEYODA artists:

1. Include their artist ID in your orbital tokens
2. Ask them to include your artist ID in their tokens
3. Coordinate URLs to ensure proper navigation

## 📞 Need Help?

If you need assistance with your ZEYODA setup, check out:

- The main README.md file for general documentation
- GitHub issues for common problems and solutions
- Join the ZEYODA Discord for community support

---

Remember, ZEYODA is yours to customize and own. There is no central platform - you are in complete control of your artist presence! 