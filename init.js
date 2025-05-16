/**
 * ZEYODA Wallet-Based Dynamic Theming System
 * This module handles theme initialization based on the connected wallet address
 */

// Import orbit setup
import { setupOrbit } from './orbit.js';

// Import purchase setup
import { setupPurchaseFlow } from './purchase.js';

// Import auth UI setup
import { setupAuthUI } from './auth-ui.js';

// Make sure Magic SDK is available before initializing auth
document.addEventListener('DOMContentLoaded', () => {
  // Check if Magic SDK is available
  if (typeof Magic === 'undefined') {
    console.error('Magic SDK not loaded! Authentication will not work.');
    
    // Create a banner to notify users
    const banner = document.createElement('div');
    banner.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; background-color: #ff4444; color: white; padding: 8px; text-align: center; z-index: 9999';
    banner.textContent = 'Authentication service unavailable. Some features may not work properly.';
    document.body.appendChild(banner);
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      banner.style.opacity = '0';
      banner.style.transition = 'opacity 0.5s';
      setTimeout(() => banner.remove(), 500);
    }, 5000);
  }
});

// Regular expression to match wallet addresses (Ethereum-style)
const WALLET_ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;

/**
 * Get the wallet address from the wallet module
 * @returns {Promise<string>} The wallet address or null if not available
 */
async function getWalletAddress() {
  try {
    // Check if wallet module is available
    if (window.wallet && typeof window.wallet.getAddress === 'function') {
      return await window.wallet.getAddress();
    }
    
    // Fallback: check localStorage for user wallet address
    const storedAddress = localStorage.getItem('userWalletAddress');
    if (storedAddress && WALLET_ADDRESS_REGEX.test(storedAddress)) {
      return storedAddress;
    }
    
    console.warn('No wallet address found');
    return null;
  } catch (error) {
    console.error('Error getting wallet address:', error);
    return null;
  }
}

/**
 * Fetch artist configuration from JSON file
 * @returns {Promise<Object>} The artist configuration
 */
async function fetchArtistConfig() {
  try {
    const response = await fetch('./artists/config.json', {
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
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching artist config:', error);
    throw error;
  }
}

/**
 * Apply CSS variables to the document root
 * @param {Object} variables - CSS variables to apply
 */
function applyCSSVariables(variables) {
  const root = document.documentElement;
  
  for (const [name, value] of Object.entries(variables)) {
    root.style.setProperty(name, value);
    
    // If this is a color that might be used with transparency, also create RGB values
    if (name.includes('color') && value.startsWith('#')) {
      const rgbValue = hexToRgb(value);
      if (rgbValue) {
        // Create RGB version for rgba() usage (e.g. --primary-color-rgb)
        const rgbName = `${name}-rgb`;
        root.style.setProperty(rgbName, rgbValue);
      }
    }
  }
  
  console.log('Applied CSS variables:', Object.keys(variables).join(', '));
}

/**
 * Convert hex color to RGB format for rgba() usage
 * @param {string} hex - Hex color code (e.g. "#ff0000")
 * @returns {string} RGB values as "r, g, b" (e.g. "255, 0, 0")
 */
function hexToRgb(hex) {
  // Remove # if present
  hex = hex.replace('#', '');
  
  // Handle both 3-digit and 6-digit hex
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }
  
  if (hex.length !== 6) {
    console.warn('Invalid hex color:', hex);
    return null;
  }
  
  // Parse the hex values
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  if (isNaN(r) || isNaN(g) || isNaN(b)) {
    console.warn('Invalid hex color components:', hex);
    return null;
  }
  
  return `${r}, ${g}, ${b}`;
}

/**
 * Update UI elements with artist information
 * @param {Object} artistData - Artist data from config
 */
function updateArtistElements(artistData) {
  // Update artist name elements
  const artistNameElements = document.querySelectorAll('.artist-name');
  artistNameElements.forEach(element => {
    element.textContent = artistData.artistName;
  });
  
  // Update additional artist elements if needed
  const tokenNameElements = document.querySelectorAll('.artist-token-name');
  tokenNameElements.forEach(element => {
    element.textContent = artistData.artistName;
  });
  
  // Additional artist-specific elements can be updated here
  
  console.log(`Updated UI elements for artist: ${artistData.artistName}`);
}

/**
 * Apply theme based on wallet address
 * @param {string} walletAddress - The wallet address to look up in config
 * @returns {boolean} Whether the theme was successfully applied
 */
function applyWalletTheme(walletAddress) {
  if (!walletAddress) return false;
  
  // Normalize address to lowercase
  const normalizedAddress = walletAddress.toLowerCase();
  
  // Try to get artist data from global config
  const artistData = window.config && 
                    window.config.wallets && 
                    window.config.wallets[normalizedAddress];
  
  if (!artistData || !artistData.variables) {
    console.warn(`No theme data found for wallet: ${normalizedAddress}`);
    return false;
  }
  
  // Apply CSS variables
  applyCSSVariables(artistData.variables);
  
  // Update UI elements
  updateArtistElements(artistData);
  
  // Initialize orbital tokens
  setupOrbit(artistData);

  // Set up purchase functionality
  setupPurchase(artistData);
  
  console.log(`Applied theme for wallet: ${normalizedAddress}`);
  return true;
}

/**
 * Initialize the theme based on wallet
 */
async function initializeWalletTheme() {
  try {
    // Get wallet address
    const walletAddress = await getWalletAddress();
    
    if (!walletAddress) {
      console.warn('No wallet address available, using default theme');
      
      // Try to use default artist if available
      if (window.config && window.config.defaults && window.config.defaults.defaultArtistId) {
        const defaultArtistId = window.config.defaults.defaultArtistId;
        const walletForDefaultArtist = getWalletByArtistId(defaultArtistId);
        
        if (walletForDefaultArtist) {
          return applyWalletTheme(walletForDefaultArtist);
        }
      }
      
      // Use first artist as fallback if no default specified
      if (window.config && window.config.wallets) {
        const firstWalletAddress = Object.keys(window.config.wallets)[0];
        if (firstWalletAddress) {
          return applyWalletTheme(firstWalletAddress);
        }
      }
      
      // If all fallbacks fail, initialize orbit with default data
      setupOrbit(null);
      
      // Also initialize purchase with default data
      setupPurchase(null);
      
      return false;
    }
    
    // Apply theme based on wallet
    return applyWalletTheme(walletAddress);
  } catch (error) {
    console.error('Error initializing wallet theme:', error);
    
    // Even on error, make sure orbit and purchase are initialized
    setupOrbit(null);
    setupPurchase(null);
    
    return false;
  }
}

/**
 * Get wallet address by artist ID from config
 * @param {string} artistId - Artist ID to look up
 * @returns {string|null} Wallet address or null if not found
 */
function getWalletByArtistId(artistId) {
  if (!artistId) return null;
  
  // Check if we have the config loaded
  if (!window.config || !window.config.wallets) {
    console.warn('Config not loaded, cannot get wallet by artist ID');
    return null;
  }
  
  // Search through wallet entries
  for (const [address, data] of Object.entries(window.config.wallets)) {
    if (data.artistId === artistId) {
      return address;
    }
  }
  
  console.warn(`No wallet found for artist ID: ${artistId}`);
  return null;
}

/**
 * Set up purchase functionality for the current artist
 * @param {Object} artistData - Artist data from config
 */
function setupPurchase(artistData) {
  // Get current artist from localStorage or fallback to default
  const currentArtist = localStorage.getItem('currentArtist') || 
                        (artistData ? artistData.artistId : '') || 
                        (window.config?.defaults?.defaultArtistId || '');
  
  // Get token amount from localStorage or use default
  const currentTokenAmount = parseInt(localStorage.getItem('currentTokenAmount')) || 100;
  
  // Get content unlocked status from localStorage
  const contentUnlocked = JSON.parse(localStorage.getItem('contentUnlocked') || '{}');
  
  // Initialize purchase flow
  console.log(`Setting up purchase flow for artist: ${currentArtist}`);
  
  // Call the setupPurchaseFlow function with the current state
  setupPurchaseFlow({
    currentArtist,
    currentTokenAmount,
    contentUnlocked
  });
}

// Initialize theme when the DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
  console.log('Initializing wallet-based theming system');
  await initializeWalletTheme();
});

// Expose functions to the global window object for non-module scripts
if (typeof window !== 'undefined') {
  window.getWalletAddress = getWalletAddress;
  window.applyWalletTheme = applyWalletTheme;
  window.initializeWalletTheme = initializeWalletTheme;
  window.getWalletByArtistId = getWalletByArtistId;
  window.setupOrbit = setupOrbit; // Expose setupOrbit directly
  
  console.log('Wallet-based theming API exposed to window');
}

// Export functions for use in other modules
export {
  getWalletAddress,
  initializeWalletTheme,
  applyCSSVariables,
  updateArtistElements,
  applyWalletTheme,
  getWalletByArtistId,
  setupOrbit
}; 