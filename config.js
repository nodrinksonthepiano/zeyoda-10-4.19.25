// Configuration management
export let config = {};

// Also expose config on window for non-modular scripts like wallet.js
if (typeof window !== 'undefined') {
  window.config = config;
}

// Load configuration and initialize the app
export async function loadConfigAndInit(callback) {
    try {
        // Add cache control and credentials to ensure we get the latest file
        const response = await fetch('artists/config.json', {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Cache-Control': 'no-cache'
            },
            cache: 'no-store'
        });
        
        if (!response.ok) {
            throw new Error(`Failed to load config (${response.status}): ${response.statusText}`);
        }
        
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            throw new Error(`Invalid content type: ${contentType}`);
        }
        
        config = await response.json();
        
        // Update window.config to match
        if (typeof window !== 'undefined') {
            window.config = config;
        }
        
        // Validate config data
        if (!config || !config.artists || Object.keys(config.artists).length === 0) {
            throw new Error('Invalid configuration: missing artists data');
        }
        
        console.log('Configuration loaded successfully:', config);
        
        // Call the callback function (initializeApp)
        callback();
        
    } catch (error) {
        console.error('Error loading configuration:', error);
        
        // Provide fallback config if fetch fails
        console.log('Using fallback configuration');
        config = {
            "artists": {
                "gosheesh": {
                    "name": "GOSHEESH",
                    "displayName": "SHEEGOHS",
                    "tokenName": "SHEEGOHS",
                    "artworkTitle": "NLi10 #1",
                    "artworkYear": "2025",
                    "tokenPrice": 0.0005,
                    "videoSrc": "assets/gosheesh-video.mp4",
                    "theme": {
                        "primaryColor": "#0a1a3b", 
                        "accentColor": "#4073ff",
                        "gradientStart": "#d4af37",
                        "gradientMiddle": "#f9f295",
                        "gradientEnd": "#d4af37",
                        "fontFamily": "Bungee, cursive"
                    },
                    "orbitalTokens": [
                        { "name": "LONIARI", "angle": 0 },
                        { "name": "ANBRI SPPIR", "angle": 72 },
                        { "name": "IJA TEA", "angle": 144 },
                        { "name": "NYTO SAREGL", "angle": 216 },
                        { "name": "LUMLITANIDE\\nSTRIPIS", "angle": 288 }
                    ]
                },
                "jaitea": {
                    "name": "JAI TEA",
                    "displayName": "IJA TEA",
                    "tokenName": "IJA TEA",
                    "artworkTitle": "Earth #2",
                    "artworkYear": "2025",
                    "tokenPrice": 0.0005,
                    "videoSrc": "assets/jaitea-video.mp4",
                    "theme": {
                        "primaryColor": "#0a3b1a",
                        "accentColor": "#4edfb1",
                        "gradientStart": "#4edfb1",
                        "gradientMiddle": "#13e7e7",
                        "gradientEnd": "#4edfb1",
                        "fontFamily": "Times New Roman, serif"
                    },
                    "orbitalTokens": [
                        { "name": "LONIARI", "angle": 0 },
                        { "name": "ANBRI SPPIR", "angle": 72 },
                        { "name": "SHEEGOHS", "angle": 144 },
                        { "name": "NYTO SAREGL", "angle": 216 },
                        { "name": "LUMLITANIDE\\nSTRIPIS", "angle": 288 }
                    ]
                }
            },
            "defaults": {
                "minimumPurchase": 1,
                "initialTokenAmount": 100,
                "maxTokens": 20000000,
                "downloadPrice": 1
            }
        };
        
        // Update window.config to match
        if (typeof window !== 'undefined') {
            window.config = config;
        }
        
        // Call the callback function with fallback configuration
        callback();
    }
}