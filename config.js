// Configuration management
export let config = {
    artists: {},  // Backward compatibility structure
    wallets: {}   // New wallet address mapping
};

// Also expose config on window for non-modular scripts like wallet.js
if (typeof window !== 'undefined') {
  window.config = config;
}

/**
 * Convert the new wallet-based config format to the legacy format
 * for backward compatibility
 * @param {Object} rawConfig - The raw config data from JSON
 * @returns {Object} - Config with both wallet and artist structures
 */
function processConfig(rawConfig) {
    const processedConfig = {
        artists: {}, // Legacy structure
        wallets: {}  // New structure with wallet addresses as keys
    };
    
    // Preserve defaults
    if (rawConfig.defaults) {
        processedConfig.defaults = rawConfig.defaults;
    }
    
    // Process each entry in the config
    Object.entries(rawConfig).forEach(([key, value]) => {
        // Skip the defaults entry
        if (key === 'defaults') return;
        
        // Check if this is a wallet address (starts with 0x)
        if (key.startsWith('0x')) {
            // This is a wallet-keyed entry
            processedConfig.wallets[key] = value;
            
            // Also add to the artists structure for backward compatibility
            if (value.artistId) {
                processedConfig.artists[value.artistId] = {
                    // Map the new structure to the old structure
                    name: value.artistName,
                    displayName: value.displayName,
                    tokenName: value.tokenName,
                    artworkTitle: value.artworkTitle,
                    artworkYear: value.artworkYear,
                    tokenPrice: value.tokenPrice,
                    videoSrc: value.videoSrc,
                    // Convert variables back to theme for backward compatibility
                    theme: {
                        primaryColor: value.variables['--primary-color'],
                        accentColor: value.variables['--accent-color'],
                        gradientStart: value.variables['--gradient-start'],
                        gradientMiddle: value.variables['--gradient-middle'],
                        gradientEnd: value.variables['--gradient-end'],
                        fontFamily: value.variables['--artist-font']
                    },
                    // Copy orbitalTokens directly
                    orbitalTokens: value.orbitalTokens
                };
            }
        } else if (typeof value === 'object' && key !== 'artists' && key !== 'wallets') {
            // This might be an artist entry in the old format
            processedConfig.artists[key] = value;
        }
    });
    
    // If we have old format with 'artists' key at the top level
    if (rawConfig.artists && typeof rawConfig.artists === 'object') {
        // For each artist in the old format
        Object.entries(rawConfig.artists).forEach(([artistId, artistData]) => {
            // Only add if not already added from wallet entries
            if (!processedConfig.artists[artistId]) {
                processedConfig.artists[artistId] = artistData;
            }
        });
    }
    
    return processedConfig;
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
        
        // Parse the raw config from JSON
        const rawConfig = await response.json();
        
        // Process the config to ensure both old and new formats are available
        config = processConfig(rawConfig);
        
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
        
        // Create a fallback config with both wallet addresses and artist IDs
        config = {
            artists: {
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
                        { "name": "IJA TEA", "angle": 144, "artistId": "jaitea" },
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
                    "tokenPrice": 0.0004,
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
                        { "name": "SHEEGOHS", "angle": 144, "artistId": "gosheesh" },
                        { "name": "NYTO SAREGL", "angle": 216 },
                        { "name": "LUMLITANIDE\\nSTRIPIS", "angle": 288 }
                    ]
                }
            },
            wallets: {
                "0xabc123def456789abcdef0123456789abcdef01": {
                    "artistId": "gosheesh",
                    "artistName": "GOSHEESH",
                    "displayName": "SHEEGOHS",
                    "tokenName": "SHEEGOHS",
                    "artworkTitle": "NLi10 #1",
                    "artworkYear": "2025",
                    "tokenPrice": 0.0005,
                    "videoSrc": "assets/gosheesh-video.mp4",
                    "variables": {
                        "--primary-color": "#0a1a3b", 
                        "--accent-color": "#4073ff",
                        "--gradient-start": "#d4af37",
                        "--gradient-middle": "#f9f295",
                        "--gradient-end": "#d4af37",
                        "--artist-font": "'Bungee', cursive"
                    },
                    "orbitalTokens": [
                        { "name": "LONIARI", "angle": 0 },
                        { "name": "ANBRI SPPIR", "angle": 72 },
                        { "name": "IJA TEA", "angle": 144, "artistId": "jaitea" },
                        { "name": "NYTO SAREGL", "angle": 216 },
                        { "name": "LUMLITANIDE\\nSTRIPIS", "angle": 288 }
                    ]
                },
                "0xdef456abc789012def3456789abcdef01234567": {
                    "artistId": "jaitea",
                    "artistName": "JAI TEA",
                    "displayName": "IJA TEA",
                    "tokenName": "IJA TEA",
                    "artworkTitle": "Earth #2",
                    "artworkYear": "2025",
                    "tokenPrice": 0.0004,
                    "videoSrc": "assets/jaitea-video.mp4",
                    "variables": {
                        "--primary-color": "#0a3b1a",
                        "--accent-color": "#4edfb1",
                        "--gradient-start": "#4edfb1",
                        "--gradient-middle": "#13e7e7",
                        "--gradient-end": "#4edfb1",
                        "--artist-font": "'Times New Roman', serif"
                    },
                    "orbitalTokens": [
                        { "name": "LONIARI", "angle": 0 },
                        { "name": "ANBRI SPPIR", "angle": 72 },
                        { "name": "SHEEGOHS", "angle": 144, "artistId": "gosheesh" },
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

// Get artist data by wallet address
export function getArtistByWallet(walletAddress) {
    if (!walletAddress) return null;
    
    // Normalize address to lowercase
    const normalizedAddress = walletAddress.toLowerCase();
    
    // Look up artist in wallets collection
    return config.wallets[normalizedAddress] || null;
}

// Get wallet address by artist ID
export function getWalletByArtistId(artistId) {
    if (!artistId) return null;
    
    // Look through wallets for matching artistId
    for (const [address, data] of Object.entries(config.wallets)) {
        if (data.artistId === artistId) {
            return address;
        }
    }
    
    return null;
}