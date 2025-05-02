# ZEYODA

**Open-source, artist-owned, decentralized aggregator for NFTs and digital content**

## 🚀 Vision

ZEYODA is not a platform - it's an open-source template that artists can fork, customize, and deploy as their own. Each artist runs their own independent storefront while remaining connected to the larger ecosystem.

### What makes ZEYODA different?

- **Decentralized**: No central authority controlling the platform
- **Artist-Owned**: You control your own storefront, pricing, and experience
- **Customizable**: Fork the repo, modify the config, and make it your own
- **Connected**: Your instance can link to other artist instances in the ecosystem

## 🛠️ Getting Started

### Option 1: Fork This Repository

1. Fork this repository on GitHub
2. Clone your fork to your local machine
3. Modify the configuration (see below)
4. Deploy to your preferred hosting service

### Option 2: Download and Configure

1. Download this repository
2. Configure your artist settings in `artists/config.json`
3. Add your media assets to the `assets` folder
4. Deploy to your hosting service (Vercel, Netlify, GitHub Pages, etc.)

## ⚙️ Configuration

ZEYODA uses a configuration-driven approach. You only need to modify the `artists/config.json` file to customize your storefront.

### Artist Configuration Example

```json
{
  "artists": {
    "yourartistid": {
      "name": "YOUR ARTIST NAME",
      "displayName": "YOUR DISPLAY NAME",
      "tokenName": "YOUR TOKEN NAME",
      "artworkTitle": "Your Artwork Title",
      "artworkYear": "2025",
      "tokenPrice": 0.0005,
      "videoSrc": "assets/your-video.mp4",
      "theme": {
        "primaryColor": "#0a1a3b", 
        "accentColor": "#4073ff",
        "gradientStart": "#d4af37",
        "gradientMiddle": "#f9f295",
        "gradientEnd": "#d4af37",
        "fontFamily": "Bungee, cursive"
      },
      "orbitalTokens": [
        { "name": "OTHER ARTIST", "angle": 0 },
        { "name": "ANOTHER ARTIST", "angle": 72 },
        { "name": "THIRD ARTIST", "angle": 144 },
        { "name": "FOURTH ARTIST", "angle": 216 },
        { "name": "FIFTH ARTIST", "angle": 288 }
      ]
    }
  }
}
```

### Key Configuration Elements

- **artistid**: Your unique artist identifier (lowercase, no spaces)
- **name**: Your displayed artist name (can use capitalization)
- **tokenName**: What your tokens/stocks are called
- **tokenPrice**: The price per token in USD
- **videoSrc**: Path to your featured video
- **theme**: Colors and styling for your storefront
- **orbitalTokens**: Other artists in the ecosystem to display in your orbit

## 🎨 Customizing Your Instance

Beyond the configuration file, you can customize your ZEYODA instance by:

1. **Adding Custom Assets**: Place your videos, images, and audio in the `assets` folder
2. **Custom CSS**: Modify `style.css` to further customize your storefront
3. **Enhanced Functionality**: Extend `script.js` to add your own features

## 🔗 Connecting with Other Artists

The "orbital tokens" in your configuration represent other artists in the ZEYODA ecosystem. When users click these tokens, they can navigate to other artist storefronts.

To connect with other artists:
1. Include their artist ID in your orbital tokens
2. Have them include your artist ID in their configuration
3. Agree on the URLs to use for cross-linking

## 🌐 Deployment

You can deploy your ZEYODA instance to:

- **Vercel**: Connect your GitHub repo for automatic deployments
- **Netlify**: Similar to Vercel, with drag-and-drop deployment
- **GitHub Pages**: Free hosting directly from your GitHub repository
- **IPFS**: For a fully decentralized deployment
- **Your Own Domain**: Point your domain to any of the above services

## 📜 License

This project is released under the MIT License. Feel free to use it for your own artist storefront.

## 🙏 Credits

ZEYODA was created to empower artists by providing an alternative to centralized platforms.

Special thanks to the original artists who believed in this vision:

- GOSHEESH
- JAI TEA
- And all future contributors to the ecosystem

---

Remember, ZEYODA is not a platform; it's a movement toward artist ownership and decentralization. Make it your own! 