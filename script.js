// Configuration and state management
import { config, loadConfigAndInit } from './config.js';
import { initDownloadFlow } from './download.js';
import { setupPurchaseFlow } from './purchase.js';
import { initMagic, checkUserSession, resetAuthState, updateUIForAuthState,
         isUserAuthenticated, handleEmailLogin, logout } from './auth.js';
import { setupAuthUI } from './auth-ui.js';
import { simulateSwap } from './liquidity.js';

// Global state variables
let currentArtist = localStorage.getItem('currentArtist') || "gosheesh";
let isLoggedIn = false;
let paymentSelected = false;
let orbitAnimationRunning = false;
let currentTokenAmount = 100;
let isAuthenticated = false;
let contentUnlocked = {};
let safewordUsed = localStorage.getItem('safewordUsed') === 'true';

// Add orbital animation state variables
let orbitAnimationId = null;
let orbitAngleOffset = parseFloat(localStorage.getItem('orbitAngleOffset') || '0');
let lastOrbitTimestamp = 0;

// Purchase module reference
let purchaseModule = null;

// Initialize Magic SDK is now imported from auth.js

// Add a function to recover authentication from localStorage
function recoverFromLocalStorage() {
    // Use the function from auth.js instead of duplicating code
    return checkUserSession();
}

// Fetch configuration and initialize the page
document.addEventListener('DOMContentLoaded', async () => {
    // Initialize Magic SDK will be called from init.js
    
    // Initialize Auth UI from imported module
    setupAuthUI();
    
    // Load configuration using the imported function
    loadConfigAndInit(initializeApp);
});

// Initialize the application after config is loaded
function initializeApp() {
    console.log("Initializing application");
    
    // Check authentication status
    isAuthenticated = isUserAuthenticated();
    isLoggedIn = isAuthenticated;
    
    // Check safeword status
    safewordUsed = localStorage.getItem('safewordUsed') === 'true';
    
    // Get current artist
    currentArtist = localStorage.getItem('currentArtist') || 'gosheesh';
    
    console.log("Initial state:", { 
        isAuthenticated, 
        isLoggedIn, 
        safewordUsed, 
        currentArtist 
    });
    
    // Ensure we have artist data before proceeding
    const artistData = getCurrentArtistData();
    if (!artistData) {
        console.error('Could not get artist data during initialization');
        return;
    }
    
    console.log('Initializing with artist data:', artistData);
    
    // Initialize purchase module
    purchaseModule = setupPurchaseFlow({
        currentArtist,
        currentTokenAmount,
        contentUnlocked
    });
    
    // Set initial theme based on stored artist
    applyArtistTheme(currentArtist);
    
    // Create cosmic particles
    createCosmicParticles();
    
    // Set up orbital tokens
    setupOrbitalTokens(currentArtist);
    
    // Set up token drag controls for mobile/desktop interaction
    setupTokenDragControls();
    
    // Start the orbital animation
    animateOrbit();
    
    // Set up video error handling
    setupVideoErrorHandling();
    
    // Set up token slider
    setupTokenSlider();
    
    // Update artist token price
    updateArtistTokenPrice();
    
    // Set up video controls
    setupVideoControls();
    
    // Set up chat input listeners
    setupChatInput();
    
    // Initialize download flow using the new module
    initDownloadFlow({
        currentArtist,
        isAuthenticated,
        safewordUsed,
        contentUnlocked,
        currentTokenAmount
    });
    
    // Set up explore button (important for switching between artists)
    updateExploreButton();
    
    // Check localStorage for previous unlocks and balances
    const storedUnlocks = localStorage.getItem('artistUnlocked');
    if (storedUnlocks) {
        try {
            contentUnlocked = JSON.parse(storedUnlocks);
            const toggle = document.getElementById('contentUnlockToggle');
            if (toggle) {
                toggle.checked = contentUnlocked[currentArtist] || true; // Default to true if not specified
            }
        } catch (e) {
            console.error("Error parsing stored unlocks:", e);
            contentUnlocked = {};
        }
    }
    
    const storedBalance = localStorage.getItem('artistocksBalance');
    if (storedBalance) {
        currentTokenAmount = parseInt(storedBalance);
        purchaseModule.updateFromTokenAmount(currentTokenAmount);
        console.log(`Loaded stored balance: ${currentTokenAmount} tokens`);
    } else {
        currentTokenAmount = config.defaults.initialTokenAmount;
        console.log(`Using default token amount: ${currentTokenAmount}`);
    }
    
    // Save the current token amount to ensure consistent values across artists
    localStorage.setItem('currentTokenAmount', currentTokenAmount);

    // Ensure the token preview section is always visible on initial load
    // regardless of authentication state (so the download button is visible)
    const tokenSection = document.getElementById('tokenPreviewSection');
    if (tokenSection) {
        tokenSection.style.display = 'block';
        tokenSection.style.opacity = '1';
        tokenSection.style.transform = 'translateY(0)';
    }

    // Display advanced options if safeword is already used
    if (safewordUsed && isAuthenticated) {
        const advancedOptions = document.getElementById('advancedPurchaseOptions');
        if (advancedOptions) {
            advancedOptions.style.display = 'block';
            advancedOptions.classList.add('show');
            advancedOptions.style.opacity = '1';
            advancedOptions.style.maxHeight = '300px';
            
            // Refresh token lists after showing advanced options
            refreshTokenLists();
        }
    }

    // Update UI based on authentication state
    updateUIForAuthState();
    
    // Initialize wallet if available
    if (window.wallet && typeof window.wallet.init === 'function') {
        window.wallet.init();
    }
    
    // Always hide purchase and success sections on initial load
    const purchaseSection = document.getElementById('purchaseSection');
    const successSection = document.getElementById('successSection');
    
    if (successSection) {
        successSection.style.display = 'none';
    }
    
    if (purchaseSection) {
        purchaseSection.style.display = 'none';
    }
    
    // Update artist name and related elements
    updateArtistElements();
    
    // Listen for window resize to reposition orbital tokens
    window.addEventListener('resize', function() {
        positionOrbitalTokens();
    });
    
    console.log("Application initialized successfully");
    
    // Debug purchase flow
    debugPurchaseFlow();
}

// Helper function to get current artist data from config
function getCurrentArtistData() {
    return config.artists[currentArtist];
}

// Apply theme based on artist configuration
function applyArtistTheme(artistId) {
    // First try to find if this artist has a wallet mapping
    let walletAddress = null;
    let walletBasedThemeApplied = false;
    
    // Use new dynamic theming if available
    if (typeof window.getWalletByArtistId === 'function') {
        walletAddress = window.getWalletByArtistId(artistId);
    } else if (config && config.wallets) {
        // Manual search for wallet by artist ID
        for (const [address, data] of Object.entries(config.wallets)) {
            if (data.artistId === artistId) {
                walletAddress = address;
                break;
            }
        }
    }
    
    // If we found a wallet address, attempt to apply wallet-based theme
    if (walletAddress && typeof window.applyWalletTheme === 'function') {
        try {
            walletBasedThemeApplied = window.applyWalletTheme(walletAddress);
            if (walletBasedThemeApplied) {
                console.log(`Applied wallet-based theme for ${artistId} (${walletAddress})`);
                // We still add the artist-theme class for backward compatibility
                // with any legacy CSS that might depend on it
                document.body.className = document.body.className
                    .split(' ')
                    .filter(cls => !cls.endsWith('-theme'))
                    .join(' ');
                document.body.classList.add(`${artistId}-theme`);
                return; // Successful wallet-based theme application
            }
        } catch (error) {
            console.error("Error applying wallet theme:", error);
            // Continue to fallback method
        }
    }
    
    // Fallback to traditional theme application
    console.log(`Using legacy theme approach for ${artistId}`);
    
    // Set the body class for backward compatibility
    document.body.className = `${artistId}-theme`;
    
    // Apply CSS custom properties from config
    if (config && config.artists && config.artists[artistId]) {
        const theme = config.artists[artistId].theme;
        const root = document.documentElement;
        
        // Set CSS custom properties
        root.style.setProperty('--primary-color', theme.primaryColor);
        root.style.setProperty('--accent-color', theme.accentColor);
        root.style.setProperty('--gradient-start', theme.gradientStart);
        root.style.setProperty('--gradient-middle', theme.gradientMiddle);
        root.style.setProperty('--gradient-end', theme.gradientEnd);
        root.style.setProperty('--artist-font', theme.fontFamily);
        
        // Convert hex to RGB for rgba() usage
        const hexToRgb = (hex) => {
            // Remove # if present
            hex = hex.replace('#', '');
            
            // Parse the hex values
            const r = parseInt(hex.substring(0, 2), 16);
            const g = parseInt(hex.substring(2, 4), 16);
            const b = parseInt(hex.substring(4, 6), 16);
            
            return `${r}, ${g}, ${b}`;
        };
        
        // Set RGB versions of colors for rgba usage
        root.style.setProperty('--accent-color-rgb', hexToRgb(theme.accentColor));
    }
}

// Update artist elements
function updateArtistElements() {
    const artistData = getCurrentArtistData();
    if (!artistData) {
        console.error("Could not update artist elements: No artist data available");
        return;
    }
    
    document.getElementById('artistName').textContent = artistData.name;
    document.getElementById('artistTokenName').textContent = artistData.tokenName;
    document.getElementById('artistNameAccess').textContent = artistData.tokenName;
    document.getElementById('artistVideoName').textContent = artistData.name;
    document.getElementById('artworkTitle').textContent = artistData.artworkTitle;
    
    // Update video source
    const videoSource = document.getElementById('videoSource');
    videoSource.src = artistData.videoSrc;
}

// Initialize token lists
function refreshTokenLists() {
    const artistData = getCurrentArtistData();
    if (!artistData) {
        console.error('Could not get artist data for token list refresh');
        return;
    }

    const fromTokenSelect = document.getElementById('fromToken');
    const toTokenSelect = document.getElementById('toToken');
    
    if (!fromTokenSelect || !toTokenSelect) {
        console.error('Token select elements not found');
        return;
    }
    
    console.log('Refreshing token lists with artist data:', artistData);
    
    // Get all available tokens when safeword is used
    let tokenOptions = `<option value="CASH">CASH</option>`;
    
    if (safewordUsed) {
        // Get user assets from localStorage
        const userAssets = localStorage.getItem('userAssets') ? 
            JSON.parse(localStorage.getItem('userAssets')) : {};
            
        // Add all available artist tokens
        Object.values(config.artists).forEach(artist => {
            if (artist.tokenName) {
                // Always add the current artist's token
                if (artist.tokenName === artistData.tokenName) {
                    tokenOptions += `<option value="${artist.tokenName}">${artist.tokenName}</option>`;
                } else {
                    // For other artists, check if user owns tokens
                    const artistId = Object.values(config.wallets)
                        .find(w => w.tokenName === artist.tokenName)?.artistId;
                    const hasTokens = artistId && userAssets[artistId]?.tokens > 0;
                    
                    if (hasTokens) {
                        tokenOptions += `<option value="${artist.tokenName}">${artist.tokenName}</option>`;
                    }
                }
            }
        });
    } else {
        // When safeword is not used, only add the current artist's token
        if (artistData.tokenName) {
            tokenOptions += `<option value="${artistData.tokenName}">${artistData.tokenName}</option>`;
        }
    }

    // Set options for both selects
    fromTokenSelect.innerHTML = tokenOptions;
    toTokenSelect.innerHTML = tokenOptions;
    
    // Always default to CASH -> current artist's token
    fromTokenSelect.value = 'CASH';
    
    // Make sure we have the current artist's token name before setting it
    if (artistData.tokenName) {
        console.log(`Setting 'to' token to current artist's token: ${artistData.tokenName}`);
        toTokenSelect.value = artistData.tokenName;
    } else {
        console.error('No token name found for current artist:', artistData);
    }
    
    // Initialize with $1 worth of tokens
    const oneUsdInTokens = Math.floor(1 / artistData.tokenPrice);
    
    // Update the token amount input to show $1
    const tokenAmountInput = document.getElementById('tokenAmountInput');
    if (tokenAmountInput) {
        tokenAmountInput.value = '1.00';
    }
    
    // Update the total input to show token amount
    const tokenTotalInput = document.getElementById('tokenTotalInput');
    if (tokenTotalInput) {
        tokenTotalInput.value = oneUsdInTokens.toString();
    }
    
    // Update slider
    const slider = document.getElementById('tokenSlider');
    if (slider) {
        slider.value = oneUsdInTokens;
    }
    
    currentTokenAmount = oneUsdInTokens;
    localStorage.setItem('currentTokenAmount', oneUsdInTokens.toString());
    
    // Update preview after setting values
    previewSwap();
}

// Preview swap based on current selections
function previewSwap() {
    const fromTokenSelect = document.getElementById('fromToken');
    const toTokenSelect = document.getElementById('toToken');
    const tokenSlider = document.getElementById('tokenSlider');
    const buyButton = document.getElementById('buyButton');
    const contentUnlockToggle = document.getElementById('contentUnlockToggle');

    if (!fromTokenSelect || !toTokenSelect || !tokenSlider || !buyButton) return;

    const from = fromTokenSelect.value;
    const to = toTokenSelect.value;
    const tokenAmount = parseInt(tokenSlider.value);
    const artistData = getCurrentArtistData();
    
    if (!artistData) return;
    
    // Calculate cash amount based on artist-specific token price
    const cashAmount = tokenAmount * artistData.tokenPrice;
    
    // Update button text based on swap type
    if (from === 'CASH') {
        const totalCost = contentUnlockToggle.checked ? cashAmount + 1 : cashAmount;
        if (contentUnlockToggle.checked) {
            buyButton.textContent = `GET DOWNLOAD + ${tokenAmount.toLocaleString()} ${to} ($${totalCost.toFixed(2)})`;
        } else {
            buyButton.textContent = `BUY ${tokenAmount.toLocaleString()} ${to} ($${cashAmount.toFixed(2)})`;
        }
    } else if (to === 'CASH') {
        if (contentUnlockToggle.checked) {
            buyButton.textContent = `SWAP ${tokenAmount.toLocaleString()} ${from} FOR $${cashAmount.toFixed(2)} + DOWNLOAD`;
        } else {
            buyButton.textContent = `SWAP ${tokenAmount.toLocaleString()} ${from} FOR $${cashAmount.toFixed(2)}`;
        }
    } else {
        // Token to token swap
        const { toAmount } = simulateSwap(from, to, tokenAmount);
        if (contentUnlockToggle.checked) {
            buyButton.textContent = `SWAP ${tokenAmount.toLocaleString()} ${from} FOR ${toAmount.toLocaleString()} ${to} + DOWNLOAD`;
        } else {
            buyButton.textContent = `SWAP ${tokenAmount.toLocaleString()} ${from} FOR ${toAmount.toLocaleString()} ${to}`;
        }
    }
}

// Helper function to update all fields based on current selections and values
function updateAllFields() {
    const fromTokenSelect = document.getElementById('fromToken');
    const toTokenSelect = document.getElementById('toToken');
    const tokenAmountInput = document.getElementById('tokenAmountInput');
    const tokenTotalInput = document.getElementById('tokenTotalInput');
    const slider = document.getElementById('tokenSlider');
    
    if (!fromTokenSelect || !toTokenSelect || !tokenAmountInput || !tokenTotalInput || !slider) return;
    
    const from = fromTokenSelect.value;
    const to = toTokenSelect.value;
    const artistData = getCurrentArtistData();
    if (!artistData) return;
    
    // Get current values
    const sliderValue = parseInt(slider.value);
    const fromAmount = parseFloat(tokenAmountInput.value.replace(/,/g, '')) || 0;
    const toAmount = parseFloat(tokenTotalInput.value.replace(/,/g, '')) || 0;
    
    if (from === 'CASH' && to !== 'CASH') {
        // Converting from cash to tokens
        const tokenAmount = Math.floor(fromAmount / artistData.tokenPrice);
        tokenTotalInput.value = tokenAmount.toString();
        slider.value = tokenAmount;
        currentTokenAmount = tokenAmount;
    } else if (from !== 'CASH' && to === 'CASH') {
        // Converting from tokens to cash
        const cashAmount = (fromAmount * artistData.tokenPrice).toFixed(2);
        tokenTotalInput.value = cashAmount;
        slider.value = fromAmount;
        currentTokenAmount = fromAmount;
    } else if (from !== 'CASH' && to !== 'CASH') {
        // Token to token conversion
        const { toAmount } = simulateSwap(from, to, fromAmount);
        tokenTotalInput.value = toAmount.toString();
        slider.value = fromAmount;
        currentTokenAmount = fromAmount;
    }
    
    // Store current token amount
    localStorage.setItem('currentTokenAmount', currentTokenAmount.toString());
    
    // Update preview
    previewSwap();
}

// Update setupTokenSlider function to use the new updateAllFields
function setupTokenSlider() {
    const slider = document.getElementById('tokenSlider');
    const fromTokenSelect = document.getElementById('fromToken');
    const toTokenSelect = document.getElementById('toToken');
    const tokenAmountInput = document.getElementById('tokenAmountInput');
    const tokenTotalInput = document.getElementById('tokenTotalInput');
    
    if (!slider) return;
    
    const artistData = getCurrentArtistData();
    if (!artistData) return;
    
    // Set initial slider range
    updateSliderRange();
    
    // Initialize token lists
    refreshTokenLists();
    
    // Start with $1 cash
    const initialCash = 1.00;
    const initialTokens = Math.floor(initialCash / artistData.tokenPrice);
    
    // Set initial values
    slider.value = initialTokens;
    currentTokenAmount = initialTokens;
    
    if (tokenAmountInput && tokenTotalInput) {
        // Set initial input values
        tokenAmountInput.value = initialCash.toFixed(2);
        tokenTotalInput.value = initialTokens.toString();
        
        // Store current token amount
        localStorage.setItem('currentTokenAmount', initialTokens.toString());
        
        // Update when slider changes
        slider.addEventListener('input', () => {
            const tokenAmount = parseInt(slider.value);
            if (fromTokenSelect.value === 'CASH') {
                tokenAmountInput.value = (tokenAmount * artistData.tokenPrice).toFixed(2);
            } else {
                tokenAmountInput.value = tokenAmount.toString();
            }
            updateAllFields();
        });
        
        // Update when first input changes
        tokenAmountInput.addEventListener('input', () => {
            let amount = parseFloat(tokenAmountInput.value.replace(/,/g, ''));
            if (isNaN(amount) || !isFinite(amount)) amount = 0;
            
            if (fromTokenSelect.value === 'CASH') {
                const tokenAmount = Math.floor(amount / artistData.tokenPrice);
                slider.value = tokenAmount;
            } else {
                slider.value = amount;
            }
            updateAllFields();
        });
        
        // Update when second input changes
        tokenTotalInput.addEventListener('input', () => {
            let amount = parseFloat(tokenTotalInput.value.replace(/,/g, ''));
            if (isNaN(amount) || !isFinite(amount)) amount = 0;
            
            if (toTokenSelect.value === 'CASH') {
                const tokenAmount = Math.floor(amount / artistData.tokenPrice);
                slider.value = tokenAmount;
            } else {
                slider.value = amount;
            }
            updateAllFields();
        });
    }
    
    // Update when token type changes
    fromTokenSelect.addEventListener('change', () => {
        const from = fromTokenSelect.value;
        const to = toTokenSelect.value;
        const currentAmount = parseFloat(tokenAmountInput.value.replace(/,/g, ''));
        
        if (from === 'CASH') {
            // Converting to cash input
            const tokenAmount = parseInt(tokenTotalInput.value);
            tokenAmountInput.value = (tokenAmount * artistData.tokenPrice).toFixed(2);
        } else {
            // Converting to token input
            const cashAmount = parseFloat(tokenAmountInput.value);
            tokenAmountInput.value = Math.floor(cashAmount / artistData.tokenPrice).toString();
        }
        
        updateSliderRange();
        updateAllFields();
    });
    
    toTokenSelect.addEventListener('change', () => {
        updateAllFields();
    });
    
    // Initial update
    updateAllFields();
}

// Helper function to update slider range based on selected token
function updateSliderRange() {
    const slider = document.getElementById('tokenSlider');
    const fromTokenSelect = document.getElementById('fromToken');
    if (!slider || !fromTokenSelect) return;

    const fromToken = fromTokenSelect.value;
    const artistData = getCurrentArtistData();
    if (!artistData) return;
    
    const tokenPrice = artistData.tokenPrice; // Use artist-specific price
    
    if (fromToken === 'CASH') {
        // For CASH, calculate token range based on $1 to $10,000
        // At artist-specific price per token:
        // $1 = tokens (1/tokenPrice)
        // $10,000 = tokens (10000/tokenPrice)
        const minTokens = Math.ceil(1 / tokenPrice);
        const maxTokens = Math.floor(10000 / tokenPrice);
        
        slider.min = minTokens;
        slider.max = maxTokens;
        slider.step = 1;
        
        // Reset to $1 worth of tokens
        const oneUsdInTokens = Math.floor(1 / tokenPrice);
        slider.value = oneUsdInTokens;
        currentTokenAmount = oneUsdInTokens;
        
        // Update inputs if they exist
        const tokenAmountInput = document.getElementById('tokenAmountInput');
        const tokenTotalInput = document.getElementById('tokenTotalInput');
        if (tokenAmountInput && tokenTotalInput) {
            tokenAmountInput.value = oneUsdInTokens.toString();
            tokenTotalInput.value = (1).toFixed(2); // Cash input shows $1.00
        }
    } else {
        // For tokens, use token amounts directly
        const userAssets = localStorage.getItem('userAssets') ? 
            JSON.parse(localStorage.getItem('userAssets')) : {};
        
        // Get available balance for the selected token
        const tokenBalance = userAssets[currentArtist]?.tokens || 0;
        
        slider.min = 1;
        slider.max = Math.max(tokenBalance, Math.floor(10000 / tokenPrice));
        slider.step = 1;
    }
    
    // Ensure current value is within new range
    slider.value = Math.min(Math.max(slider.min, currentTokenAmount), slider.max);
    currentTokenAmount = parseInt(slider.value);
    previewSwap();
}

// Update handleBuyClick to handle token swaps
function handleBuyClick() {
    if (!isAuthenticated) {
        console.log("Not authenticated, showing login and applying gentle shake animation");
        const loginSection = document.getElementById('loginSection');
        if (loginSection) {
            loginSection.style.display = 'flex';
            loginSection.style.opacity = '1';
            loginSection.style.animation = ''; // Clear any previous animation
            void loginSection.offsetWidth; // Force reflow to restart animation
            loginSection.style.animation = 'shake 1.2s ease-in-out';
            loginSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // Remove animation after it completes to prevent it from re-triggering on style changes
            setTimeout(() => { loginSection.style.animation = ''; }, 1200);
        }
        // Optionally, also shake the buy button as in purchase.js
        const buyButton = document.getElementById('buyButton');
        if (buyButton) {
            buyButton.style.animation = '';
            void buyButton.offsetWidth;
            buyButton.style.animation = 'shake 1.2s ease-in-out';
            setTimeout(() => { buyButton.style.animation = ''; }, 1200);
        }
        return;
    }
    if (!safewordUsed) return shakeSafeword();
    
    const fromTokenSelect = document.getElementById('fromToken');
    const toTokenSelect = document.getElementById('toToken');
    const tokenAmountInput = document.getElementById('tokenAmountInput');
    const contentUnlockToggle = document.getElementById('contentUnlockToggle');
    
    if (!fromTokenSelect || !toTokenSelect || !tokenAmountInput) return;
    
    const from = fromTokenSelect.value;
    const to = toTokenSelect.value;
    
    // Get exact token amount from input
    let amount;
    try {
        // First try to get the raw value without commas
        amount = parseInt(tokenAmountInput.value.replace(/,/g, ''));
        
        // If that fails, try the slider
        if (isNaN(amount) || !isFinite(amount)) {
            const slider = document.getElementById('tokenSlider');
            if (slider) {
                amount = parseInt(slider.value);
            }
        }
        
        // If both fail, try currentTokenAmount
        if (isNaN(amount) || !isFinite(amount)) {
            amount = currentTokenAmount;
        }
        
        // Final validation
        if (isNaN(amount) || !isFinite(amount) || amount <= 0) {
            throw new Error('Invalid amount');
        }
    } catch (error) {
        console.error('Invalid token amount:', tokenAmountInput.value);
        showError('Please enter a valid amount');
        return;
    }
    
    // Log the exact amount being used
    console.log(`Processing transaction with exact amount: ${amount}`);
    
    // Get swap simulation
    const { toAmount } = simulateSwap(from, to, amount);
    
    // Get user assets
    const userAssets = window.wallet ? window.wallet.loadAssets() : {};
    
    // Handle different swap types
    if (from === 'CASH') {
        // CASH to TOKEN swap
        const totalCost = contentUnlockToggle.checked ? amount + 1 : amount;
        
        // Process payment and add tokens
        processPayment(totalCost).then(() => {
            // Find the target artist ID for the token
            const toArtist = Object.values(config.wallets)
                .find(w => w.tokenName === to)?.artistId;
            
            if (toArtist && window.wallet) {
                // Add tokens using the wallet's onPurchaseComplete function
                // CRITICAL: Pass the exact amount of tokens, not the cash amount
                window.wallet.onPurchaseComplete(
                    toArtist,
                    true,
                    toAmount, // Use toAmount for token purchases
                    contentUnlockToggle.checked
                );
            }
        });
    } else {
        // TOKEN to CASH or TOKEN to TOKEN swap
        // Find source artist ID
        const fromArtist = Object.values(config.wallets)
            .find(w => w.tokenName === from)?.artistId;
        
        if (!fromArtist) {
            showError('Could not find source artist for swap');
            return;
        }
        
        // Check if user has enough tokens
        const fromBalance = userAssets[fromArtist]?.tokens || 0;
        if (fromBalance < amount) {
            showError('Insufficient balance for swap');
            return;
        }
        
        if (window.wallet) {
            // Deduct source tokens first
            window.wallet.onPurchaseComplete(fromArtist, true, -amount, false);
            
            if (to === 'CASH') {
                // Add CASH balance
                processCashout(toAmount);
            } else {
                // Add destination tokens
                const toArtist = Object.values(config.wallets)
                    .find(w => w.tokenName === to)?.artistId;
                if (toArtist) {
                    window.wallet.onPurchaseComplete(
                        toArtist,
                        true,
                        toAmount,
                        contentUnlockToggle.checked
                    );
                }
            }
        }
    }
    
    // Show success section with the exact amount
    showSuccessSection(true, toAmount);
    
    // Refresh token lists to update available options
    refreshTokenLists();
}

// Update the token price display
function updateArtistTokenPrice() {
    const tokenPriceSpan = document.getElementById('tokenUnitPrice');
    if (tokenPriceSpan) {
        tokenPriceSpan.textContent = '0.0005'; // Hard-code the price to ensure consistency
    }
}

// Handle video errors and show fallback
function setupVideoErrorHandling() {
    const video = document.getElementById('artistVideo');
    const fallback = document.getElementById('videoFallback');
    
    // Check if the video file exists
    video.addEventListener('error', () => {
        showVideoFallback(true);
    });
    
    // Check if video can play
    video.addEventListener('canplay', () => {
        showVideoFallback(false);
    });
    
    // Try to load the video
    video.load();
    
    // If video doesn't start playing within 2 seconds, we'll assume it's not available
    setTimeout(() => {
        if (video.readyState < 3) { // HAVE_FUTURE_DATA = 3
            // Video is not ready to play yet, try to fetch it directly
            fetch(video.querySelector('source').src, { method: 'HEAD' })
                .then(response => {
                    if (!response.ok) {
                        showVideoFallback(true);
                    }
                })
                .catch(() => {
                    showVideoFallback(true);
                });
        }
    }, 2000);
}

// Show or hide video fallback
function showVideoFallback(show) {
    const fallback = document.getElementById('videoFallback');
    if (show) {
        fallback.style.display = 'flex';
    } else {
        fallback.style.display = 'none';
    }
}

// Create cosmic background particles
function createCosmicParticles() {
    const particlesContainer = document.getElementById('particles');
    const numberOfParticles = 30;
    
    for (let i = 0; i < numberOfParticles; i++) {
        const particle = document.createElement('div');
        particle.classList.add('particle');
        
        // Randomize particle size
        const size = Math.random() * 8 + 2;
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        
        // Randomize particle position
        const posX = Math.random() * 100;
        const posY = Math.random() * 100;
        particle.style.left = `${posX}%`;
        particle.style.top = `${posY}%`;
        
        // Randomize animation delay
        const delay = Math.random() * 15;
        particle.style.animationDelay = `${delay}s`;
        
        particlesContainer.appendChild(particle);
    }
}

// Set up orbital tokens
function setupOrbitalTokens(artist) {
    const orbitalContainer = document.getElementById('orbitalTokens');
    if (!orbitalContainer) return;
    
    // Clear existing tokens
    orbitalContainer.innerHTML = '';
    
    // Get artist-specific orbital tokens
    const artistData = config.artists[artist];
    if (!artistData || !artistData.orbitalTokens) return;
    
    const tokens = artistData.orbitalTokens;
    
    // Create tokens
    tokens.forEach(token => {
        const tokenElement = document.createElement('div');
        tokenElement.className = 'token';
        tokenElement.textContent = token.name;
        tokenElement.setAttribute('data-angle', token.angle);
        // Add data-artist-id if available
        if (token.artistId) {
            tokenElement.setAttribute('data-artist-id', token.artistId);
        }
        // Enhanced token clicking logic with hardcoded fallbacks
        tokenElement.addEventListener('click', function() {
            console.log(`Token clicked: ${token.name}`);
            const tokenName = this.textContent;
            // Hardcoded navigation for known tokens to ensure it works
            if (currentArtist === 'gosheesh' && tokenName === 'IJA TEA') {
                console.log('Navigating to JAI TEA');
                transitionToArtist('jaitea');
                return;
            } else if (currentArtist === 'jaitea' && tokenName === 'SHEEGOHS') {
                console.log('Navigating to GOSHEESH');
                transitionToArtist('gosheesh');
                return;
            }
            // Fallback to general search for other tokens
            for (const artistId in config.artists) {
                if (artistId === currentArtist) continue;
                const artist = config.artists[artistId];
                if (tokenName === artist.name || tokenName === artist.displayName) {
                    console.log(`Navigating to artist: ${artistId}`);
                    transitionToArtist(artistId);
                    break;
                }
            }
            // Wallet sync: open wallet and highlight artist if artistId is present
            const artistId = this.getAttribute('data-artist-id');
            if (artistId) {
                if (typeof toggleWallet === 'function') toggleWallet(true, artistId);
            }
        });
        orbitalContainer.appendChild(tokenElement);
    });
    // Position the tokens initially
    setTimeout(positionOrbitalTokens, 100); // Small delay to ensure elements are rendered
}

// Animate orbital tokens
function animateOrbit() {
    // If animation is already running, cancel it first
    if (orbitAnimationId) {
        cancelAnimationFrame(orbitAnimationId);
        orbitAnimationId = null;
    }
    
    orbitAnimationRunning = true;
    
    let lastTimestamp = 0;
    const orbitSpeed = 0.004; // Adjusted speed of rotation
    
    function animate(timestamp) {
        // First animation frame doesn't have elapsed time
        if (lastTimestamp === 0) {
            lastTimestamp = timestamp;
            orbitAnimationId = requestAnimationFrame(animate);
            return;
        }
        
        // Calculate time elapsed since last frame
        const elapsed = timestamp - lastTimestamp;
        lastTimestamp = timestamp;
        
        // Update the global angle offset (stored for persistence)
        orbitAngleOffset += elapsed * orbitSpeed;
        if (orbitAngleOffset >= 360) orbitAngleOffset -= 360;
        
        // Store the angle offset to localStorage for persistence across artist changes
        localStorage.setItem('orbitAngleOffset', orbitAngleOffset.toString());
        
        // Position tokens based on updated angles
        positionOrbitalTokens();
        
        orbitAnimationId = requestAnimationFrame(animate);
    }
    
    // Start the animation
    orbitAnimationId = requestAnimationFrame(animate);
}

// Position orbital tokens
function positionOrbitalTokens() {
    const tokens = document.querySelectorAll('.token');
    const container = document.querySelector('.video-container');
    const video = document.getElementById('artistVideo');
    
    if (!container || !video || tokens.length === 0) return;
    
    // Get dimensions for positioning
    const videoWidth = video.offsetWidth;
    const videoHeight = video.offsetHeight;
    
    // Calculate container center
    const containerRect = container.getBoundingClientRect();
    const centerX = containerRect.width / 2;
    const centerY = containerRect.height / 2;
    
    // Calculate radius - use video width for consistent circular orbit
    const orbitRadius = videoWidth * 0.75;
    
    tokens.forEach(token => {
        // Get base angle from the token
        const baseAngle = parseFloat(token.getAttribute('data-angle') || 0);
        
        // Apply the global offset to get the current position
        const currentAngle = (baseAngle + orbitAngleOffset) % 360;
        
        // Convert to radians
        const angleRad = currentAngle * (Math.PI / 180);
        
        // Calculate position
        const x = Math.cos(angleRad) * orbitRadius;
        const y = Math.sin(angleRad) * orbitRadius;
        
        // Position from center of container
        token.style.transform = `translate(-50%, -50%)`;
        token.style.left = `${centerX + x}px`;
        token.style.top = `${centerY + y}px`;
        
        // Adjust z-index based on y position
        if (y < 0) {
            // Token is in the top half of the orbit (in front)
            token.style.zIndex = "4";
        } else {
            // Token is in the bottom half (behind)
            token.style.zIndex = "1";
        }
    });
}

// Handle login method selection
function handleLogin(method) {
    console.log(`Login selected: ${method}`);
    
    // For now, social logins are disabled (show a more descriptive message)
    alert(`${method} login is currently unavailable. Please use email login instead. Social logins will be available in the upcoming Next.js version.`);
    return;
    
    // The code below will not execute until social logins are enabled
    // Simulate wallet creation
    if (method === 'email') {
        const emailInput = document.getElementById('emailInput');
        if (!emailInput.value || !emailInput.value.includes('@')) {
            emailInput.focus();
            return;
        }
    }
    
    // Flash the selected login button
    flashLoginButton(method);
    
    // Complete login process
    completeLogin(method);
}

// Complete login
function completeLogin(method) {
    console.log(`Completing login via ${method}`);
    
    // Set authentication state
    isAuthenticated = true;
    isLoggedIn = true;
    localStorage.setItem('isAuthenticated', 'true');

    // Remove existing wallet display if it exists
    const walletDisplay = document.getElementById('walletDisplay');
    if (walletDisplay) {
        walletDisplay.remove();
    }
    
    // Use centralized function to update UI based on authentication state
    updateUIForAuthState();
    
    // Make sure login section is hidden
    const loginSection = document.getElementById('loginSection');
    if (loginSection) {
        loginSection.style.display = 'none';
        loginSection.style.opacity = '0';
    }
    
    // Make sure token section is visible with animation
    const tokenSection = document.getElementById('tokenPreviewSection');
    if (tokenSection) {
        tokenSection.style.display = 'block';
        // Animation delay
        setTimeout(() => {
            tokenSection.style.opacity = '1';
            tokenSection.style.transform = 'translateY(0)';
        }, 100);
    }
    
    // Ensure the buy button has its event handler
    const buyButton = document.getElementById('buyButton');
    if (buyButton) {
        // Remove existing event listeners by cloning and replacing
        const newBuyButton = buyButton.cloneNode(true);
        buyButton.parentNode.replaceChild(newBuyButton, buyButton);
        newBuyButton.addEventListener('click', () => purchaseModule.handleBuyClick());
    }
    
    // Update buy button text
    purchaseModule.updateBuyButton();
    
    // Update explore button
    updateExploreButton();
    
    // Show success toast message
    showLoginSuccessMessage();
    
    // Initialize wallet if available
    if (window.wallet && typeof window.wallet.init === 'function') {
        window.wallet.init();
    }
    
    // Auto-focus on chat input after login completes
    setTimeout(() => {
        const chatInput = document.getElementById('chatInput');
        if (chatInput) {
            chatInput.focus();
            // Update placeholder to be more subtle
            chatInput.placeholder = "Type something";
        }
    }, 800);
    
    // Log the login method for analytics (in a real app)
    console.log(`User logged in via ${method}`);
    
    // Need to update the buy button after login
    if (purchaseModule) {
        purchaseModule.updateBuyButton();
    }
}

// Show login success message
function showLoginSuccessMessage() {
    // Create toast container if it doesn't exist
    let toastContainer = document.getElementById('toastContainer');
    
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toastContainer';
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);
    }
    
    // Create toast message
    const toast = document.createElement('div');
    toast.className = 'toast-message success';
    
    // Add content to toast
    toast.innerHTML = `
        <div class="toast-icon">✓</div>
        <div class="toast-content">
            <div class="toast-title">Login Successful</div>
            <div class="toast-subtitle">Welcome back${userEmail ? ', ' + userEmail.split('@')[0] : ''}!</div>
        </div>
    `;
    
    // Add toast to container
    toastContainer.appendChild(toast);
    
    // Show toast with animation
    setTimeout(() => {
        toast.classList.add('show');
    }, 100);
    
    // Remove toast after 5 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 5000);
}

// Flash login button
function flashLoginButton(method) {
    const button = document.querySelector(`.login-btn.${method}`);
    if (!button) return;
    
    button.style.transform = 'scale(1.05)';
    button.style.boxShadow = '0 0 20px rgba(255, 255, 255, 0.5)';
    
    setTimeout(() => {
        button.style.transform = '';
        button.style.boxShadow = '';
    }, 300);
}

// Transition to another artist
function transitionToArtist(artistId) {
    console.log(`Transitioning to artist: ${artistId}`);
    
    // Update the global currentArtist variable
    currentArtist = artistId.toLowerCase();
    
    // Store current artist in localStorage
    localStorage.setItem('currentArtist', currentArtist);
    
    // Make sure the artist exists in config
    if (!config.artists[currentArtist]) {
        console.error(`Artist ${currentArtist} not found in configuration`);
        return;
    }
    
    const artistData = getCurrentArtistData();
    
    // Important: Get authentication and safeword status FIRST
    isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
    isLoggedIn = isAuthenticated;
    safewordUsed = localStorage.getItem('safewordUsed') === 'true';
    
    // Update UI elements with the new artist name
    updateArtistElements();
    
    // Change theme
    applyArtistTheme(currentArtist);
    
    // Update video source
    const video = document.getElementById('artistVideo');
    const source = document.getElementById('videoSource');
    if (video && source) {
        const isMuted = video.muted;
        video.style.opacity = '0';
        source.src = artistData.videoSrc;
        video.load();
        video.oncanplay = () => {
            video.style.opacity = '1';
            showVideoFallback(false);
            video.muted = isMuted;
            if (!video.muted) {
                video.play().catch(err => {
                    console.error('Error playing video:', err);
                    video.muted = true;
                    video.play().catch(err2 => console.error('Video still cannot play:', err2));
                });
            }
        };
    }
    
    // Update token price display
    updateArtistTokenPrice();
    
    // Reset to $1 worth of tokens for the new artist
    const oneUsdInTokens = Math.floor(1 / artistData.tokenPrice);
    currentTokenAmount = oneUsdInTokens;
    
    // Update the slider and inputs
    const slider = document.getElementById('tokenSlider');
    const tokenAmountInput = document.getElementById('tokenAmountInput');
    const tokenTotalInput = document.getElementById('tokenTotalInput');
    
    if (slider) {
        slider.value = oneUsdInTokens;
    }
    
    // Update all fields with the new token amount
    updateAllFields();
    
    // Store the current token amount
    localStorage.setItem('currentTokenAmount', oneUsdInTokens.toString());
    
    // Set up the token slider with the new values
    setupTokenSlider();
    
    // Update orbital tokens for the new artist
    setupOrbitalTokens(currentArtist);
    
    // Update explore button
    updateExploreButton();
    
    // Update token lists if safeword is used
    if (safewordUsed) {
        refreshTokenLists();
    }
    
    // Ensure the token preview section is visible
    const tokenSection = document.getElementById('tokenPreviewSection');
    if (tokenSection) {
        tokenSection.style.display = 'block';
        tokenSection.style.opacity = '1';
        tokenSection.style.transform = 'translateY(0)';
    }
    
    // Update preview to show correct values
    previewSwap();
    
    console.log(`Transition to ${currentArtist} complete`);
}

// Set up video controls
function setupVideoControls() {
    const video = document.getElementById('artistVideo');
    const muteToggle = document.getElementById('muteToggle');
    const fullscreenToggle = document.getElementById('fullscreenToggle');
    
    if (!video || !muteToggle || !fullscreenToggle) return;
    
    // Set initial muted state based on video element
    const mutedIcon = document.querySelector('.muted-icon');
    const unmutedIcon = document.querySelector('.unmuted-icon');
    
    if (mutedIcon && unmutedIcon) {
        if (video.muted) {
            mutedIcon.style.display = '';
            unmutedIcon.style.display = 'none';
            muteToggle.setAttribute('aria-label', 'Unmute');
        } else {
            mutedIcon.style.display = 'none';
            unmutedIcon.style.display = '';
            muteToggle.setAttribute('aria-label', 'Mute');
        }
    }
    
    // Mute toggle functionality
    muteToggle.addEventListener('click', () => {
        video.muted = !video.muted;
        
        // Try to play the video if it's unmuted and paused
        if (!video.muted && video.paused) {
            video.play().catch(err => console.error('Error playing video:', err));
        }
        
        // Update UI
        if (video.muted) {
            mutedIcon.style.display = '';
            unmutedIcon.style.display = 'none';
            muteToggle.setAttribute('aria-label', 'Unmute');
        } else {
            mutedIcon.style.display = 'none';
            unmutedIcon.style.display = '';
            muteToggle.setAttribute('aria-label', 'Mute');
        }
    });
    
    // Fullscreen toggle functionality
    fullscreenToggle.addEventListener('click', () => {
        // Check if the video is already in fullscreen
        if (!document.fullscreenElement) {
            // Enter fullscreen
            if (video.requestFullscreen) {
                video.requestFullscreen();
            } else if (video.webkitRequestFullscreen) { /* Safari */
                video.webkitRequestFullscreen();
            } else if (video.msRequestFullscreen) { /* IE11 */
                video.msRequestFullscreen();
            }
            fullscreenToggle.setAttribute('aria-label', 'Exit Fullscreen');
        } else {
            // Exit fullscreen
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) { /* Safari */
                document.webkitExitFullscreen();
            } else if (document.msExitFullscreen) { /* IE11 */
                document.msExitFullscreen();
            }
            fullscreenToggle.setAttribute('aria-label', 'Fullscreen');
        }
    });
    
    // Update fullscreen button when fullscreen state changes
    document.addEventListener('fullscreenchange', updateFullscreenButtonState);
    document.addEventListener('webkitfullscreenchange', updateFullscreenButtonState);
    document.addEventListener('mozfullscreenchange', updateFullscreenButtonState);
    document.addEventListener('MSFullscreenChange', updateFullscreenButtonState);
    
    function updateFullscreenButtonState() {
        if (document.fullscreenElement) {
            fullscreenToggle.querySelector('.fullscreen-icon').textContent = '⤓';
        } else {
            fullscreenToggle.querySelector('.fullscreen-icon').textContent = '⛶';
        }
    }

    // Set up buy button click
    const buyButton = document.getElementById('buyButton');
    if (buyButton) {
        buyButton.addEventListener('click', () => {
            purchaseModule.handleBuyClick();
        });
    }
}

// Show success message after logout
function showLogoutSuccessToast() {
    // Create toast container if it doesn't exist
    let toastContainer = document.getElementById('toastContainer');
    
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toastContainer';
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);
    }
    
    // Create toast message
    const toast = document.createElement('div');
    toast.className = 'toast-message info';
    
    // Add content to toast
    toast.innerHTML = `
        <div class="toast-icon">ℹ</div>
        <div class="toast-content">
            <div class="toast-title">Data Reset</div>
            <div class="toast-subtitle">All local data has been cleared.</div>
        </div>
    `;
    
    // Add toast to container
    toastContainer.appendChild(toast);
    
    // Show toast with animation
    setTimeout(() => {
        toast.classList.add('show');
    }, 100);
    
    // Remove toast after 5 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 5000);
}

// Set up chat input functionality
function setupChatInput() {
    const chatInput = document.getElementById('chatInput');
    if (!chatInput) return;
    
    // Remove any existing event listeners to prevent duplicates
    const newChatInput = chatInput.cloneNode(true);
    chatInput.parentNode.replaceChild(newChatInput, chatInput);
    
    // Update the reference to the new element
    const updatedChatInput = document.getElementById('chatInput');
    
    updatedChatInput.addEventListener('input', function() {
        const inputText = this.value.toLowerCase();
        const advancedOptions = document.getElementById('advancedPurchaseOptions');
        
        // Check for variations of "artistock"
        const keywordMatches = [
            'artistock', 'artist stock', 'art stock', 'artisstok', 
            'art istok', 'artstock', 'art ist ock', 'artis tok'
        ];
        
        const foundMatch = keywordMatches.some(keyword => inputText.includes(keyword));
        
        // Only trigger the animation if this is the first time finding the keyword
        if (foundMatch && !safewordUsed && advancedOptions) {
            console.log("Safeword detected! Unlocking advanced options");
            safewordUsed = true;
            
            // Store safeword status in localStorage (globally, not per artist)
            localStorage.setItem('safewordUsed', 'true');
            
            // Show advanced options with animation
            advancedOptions.style.display = 'block';
            advancedOptions.style.opacity = '0';
            advancedOptions.style.maxHeight = '0';
            
            // Force reflow for animation
            void advancedOptions.offsetWidth;
            
            // Add class for animation
            advancedOptions.classList.add('show');
            advancedOptions.style.opacity = '1';
            advancedOptions.style.maxHeight = '300px';
            
            // Flash highlight on the unlocked slider
            advancedOptions.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
            setTimeout(() => {
                advancedOptions.style.backgroundColor = '';
            }, 1000);
            
            // Set up initial token selections for current artist
            const fromTokenSelect = document.getElementById('fromToken');
            const toTokenSelect = document.getElementById('toToken');
            const artistData = getCurrentArtistData();
            
            if (fromTokenSelect && toTokenSelect && artistData) {
                // Always default to CASH -> current artist's token
                fromTokenSelect.value = 'CASH';
                toTokenSelect.value = artistData.tokenName;
                
                // Initialize with $1 worth of tokens
                const oneUsdInTokens = Math.floor(1 / artistData.tokenPrice);
                
                // Update the token amount input to show $1
                const tokenAmountInput = document.getElementById('tokenAmountInput');
                if (tokenAmountInput) {
                    tokenAmountInput.value = '1.00';
                }
                
                // Update the total input to show token amount
                const tokenTotalInput = document.getElementById('tokenTotalInput');
                if (tokenTotalInput) {
                    tokenTotalInput.value = oneUsdInTokens.toString();
                }
                
                // Update slider
                const slider = document.getElementById('tokenSlider');
                if (slider) {
                    slider.value = oneUsdInTokens;
                }
                
                currentTokenAmount = oneUsdInTokens;
                localStorage.setItem('currentTokenAmount', oneUsdInTokens.toString());
            }
            
            // Update preview after setting values
            previewSwap();
            
            // Update placeholder text
            this.placeholder = "Type something";
        }
    });
    
    // Store safeword status in a property we can check elsewhere
    window.safewordActivated = function() {
        return safewordUsed;
    };
}

// Set up explore button for switching between artists
function updateExploreButton() {
    const exploreBtn = document.querySelector('.explore-btn');
    if (!exploreBtn) return;
    
    // For now, hard-code navigation between the two artists
    // This ensures the navigation works even if other config features have issues
    if (currentArtist === 'gosheesh') {
        exploreBtn.textContent = 'Explore JAI TEA';
        exploreBtn.onclick = () => transitionToArtist('jaitea');
    } else {
        exploreBtn.textContent = 'Explore GOSHEESH';
        exploreBtn.onclick = () => transitionToArtist('gosheesh');
    }
}

// Debug function to check purchase flow elements
function debugPurchaseFlow() {
    console.log("=== DEBUG PURCHASE FLOW ===");
    console.log("Current artist:", currentArtist);
    console.log("Authentication state:", isAuthenticated);
    
    // Check key elements
    const elements = {
        purchaseSection: document.getElementById('purchaseSection'),
        tokenSection: document.getElementById('tokenPreviewSection'),
        loginSection: document.getElementById('loginSection'),
        successSection: document.getElementById('successSection'),
        buyButton: document.getElementById('buyButton'),
        paymentSection: document.querySelector('.payment-section'),
        paymentButtons: document.querySelectorAll('.payment-btn'),
        purchaseHeadline: document.getElementById('purchaseHeadline')
    };
    
    // Log element existence and display status
    for (const [name, element] of Object.entries(elements)) {
        if (element) {
            if (element.length !== undefined && element.length === 0) {
                console.log(`${name}: Found but empty collection (length 0)`);
            } else {
                const style = window.getComputedStyle(element);
                console.log(`${name}: Found, display=${style.display}, visibility=${style.visibility}, opacity=${style.opacity}`);
            }
        } else {
            console.log(`${name}: NOT FOUND in DOM`);
        }
    }
    
    // Check content-section which contains our elements
    const contentSection = document.querySelector('.content-section');
    if (contentSection) {
        console.log("Content section found, children:", contentSection.children.length);
        // List direct children for debugging
        Array.from(contentSection.children).forEach((child, index) => {
            console.log(`Child ${index}: ${child.className}, display=${window.getComputedStyle(child).display}`);
        });
    } else {
        console.error("Content section not found!");
    }
    
    console.log("=== END DEBUG ===");
}

// Add direct event listeners after DOM is fully loaded
window.addEventListener('load', function() {
    console.log("Window loaded - applying direct event listeners");
    
    // Direct event listener for mute toggle button
    const muteToggle = document.getElementById('muteToggle');
    const video = document.getElementById('artistVideo');
    if (muteToggle && video) {
        console.log("Adding direct click listener to mute toggle button");
        muteToggle.addEventListener('click', function(e) {
            console.log("Mute toggle clicked directly");
            // Toggle muted state and update UI
            video.muted = !video.muted;
            
            // Play video if unmuting
            if (!video.muted && video.paused) {
                video.play().catch(err => console.error('Error playing video:', err));
            }
            
            // Update UI
            const mutedIcon = document.querySelector('.muted-icon');
            const unmutedIcon = document.querySelector('.unmuted-icon');
            if (mutedIcon && unmutedIcon) {
                if (video.muted) {
                    mutedIcon.style.display = '';
                    unmutedIcon.style.display = 'none';
                    muteToggle.setAttribute('aria-label', 'Unmute');
                } else {
                    mutedIcon.style.display = 'none';
                    unmutedIcon.style.display = '';
                    muteToggle.setAttribute('aria-label', 'Mute');
                }
            }
        });
    }
    
    // Direct event listener for buy button
    const buyButton = document.getElementById('buyButton');
    if (buyButton) {
        console.log("Adding direct click listener to buy button");
        buyButton.addEventListener('click', function(e) {
            console.log("Buy button clicked directly");
            purchaseModule.handleBuyClick();
        });
    }
    
    // Direct event listeners for payment buttons
    document.querySelectorAll('.payment-btn').forEach(button => {
        const method = button.classList[1]; // Get payment method from class
        if (method) {
            console.log(`Adding direct click listener to ${method} payment button`);
            button.addEventListener('click', function(e) {
                console.log(`${method} payment clicked directly`);
                purchaseModule.handlePayment(method);
            });
        }
    });
});

// Add touch and drag functionality to the orbital tokens
function setupTokenDragControls() {
    const orbitalContainer = document.getElementById('orbitalTokens');
    if (!orbitalContainer) return;
    
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let lastX = 0;
    let lastY = 0;
    let dragThreshold = 5; // Minimum movement to consider as a drag
    let dragTimeout = null;
    
    // When animation is active, pause it during dragging
    function pauseAnimation() {
        if (orbitAnimationId) {
            cancelAnimationFrame(orbitAnimationId);
            orbitAnimationId = null;
        }
        orbitAnimationRunning = false;
    }
    
    function resumeAnimation() {
        if (!orbitAnimationRunning) {
            orbitAnimationRunning = true;
            animateOrbit();
        }
    }
    
    // Touch start handler
    orbitalContainer.addEventListener('touchstart', function(e) {
        if (e.touches.length === 1) {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            lastX = startX;
            lastY = startY;
            
            // Clear any existing resume timeout
            if (dragTimeout) {
                clearTimeout(dragTimeout);
                dragTimeout = null;
            }
            
            // Don't prevent default scrolling here - we'll check for drag first
        }
    }, { passive: true }); // Use passive: true for better scroll performance
    
    // Touch move handler
    orbitalContainer.addEventListener('touchmove', function(e) {
        if (e.touches.length === 1) {
            const currentX = e.touches[0].clientX;
            const currentY = e.touches[0].clientY;
            
            // Calculate movement delta
            const diffX = currentX - startX;
            const diffY = currentY - startY;
            
            // If we're already dragging or if the movement is significant and horizontal
            // (to avoid interfering with vertical scrolling)
            const isHorizontalDrag = Math.abs(diffX) > Math.abs(diffY) * 1.5;
            
            if (!isDragging && (Math.abs(diffX) > dragThreshold || Math.abs(diffY) > dragThreshold)) {
                // Only consider it a drag if movement is more horizontal than vertical,
                // otherwise allow normal scrolling
                if (isHorizontalDrag) {
                    isDragging = true;
                    pauseAnimation();
                    e.preventDefault(); // Prevent scrolling when horizontal drag is detected
                }
            }
            
            // If we're dragging, adjust the orbit angle
            if (isDragging) {
                // Get center of container to determine rotation direction
                const containerRect = orbitalContainer.getBoundingClientRect();
                const centerX = containerRect.left + containerRect.width / 2;
                const centerY = containerRect.top + containerRect.height / 2;
                
                // Calculate vector from center to last position
                const lastVectorX = lastX - centerX;
                const lastVectorY = lastY - centerY;
                
                // Calculate vector from center to current position
                const currentVectorX = currentX - centerX;
                const currentVectorY = currentY - centerY;
                
                // Calculate angle change (in degrees)
                const angle1 = Math.atan2(lastVectorY, lastVectorX);
                const angle2 = Math.atan2(currentVectorY, currentVectorX);
                let angleDiff = (angle2 - angle1) * (180 / Math.PI);
                
                // Update orbit angle
                orbitAngleOffset += angleDiff;
                if (orbitAngleOffset >= 360) orbitAngleOffset -= 360;
                if (orbitAngleOffset < 0) orbitAngleOffset += 360;
                
                // Update token positions
                positionOrbitalTokens();
                
                // Store current position for next move
                lastX = currentX;
                lastY = currentY;
                
                // Prevent default only when actively dragging
                e.preventDefault();
            }
        }
    }, { passive: false });
    
    // Touch end handler
    orbitalContainer.addEventListener('touchend', function(e) {
        if (isDragging) {
            // Resume animation after a short delay
            dragTimeout = setTimeout(resumeAnimation, 500);
            isDragging = false;
            
            // Store the current angle offset to localStorage
            localStorage.setItem('orbitAngleOffset', orbitAngleOffset.toString());
        }
    }, { passive: true });
    
    // For desktop: mouse controls
    let isMouseDown = false;
    
    orbitalContainer.addEventListener('mousedown', function(e) {
        startX = e.clientX;
        startY = e.clientY;
        lastX = startX;
        lastY = startY;
        isMouseDown = true;
        
        if (dragTimeout) {
            clearTimeout(dragTimeout);
            dragTimeout = null;
        }
        
        // Don't set isDragging immediately - wait to see if it's a click or drag
    });
    
    document.addEventListener('mousemove', function(e) {
        if (isMouseDown) {
            const currentX = e.clientX;
            const currentY = e.clientY;
            
            // Check if movement is beyond threshold
            const diffX = currentX - startX;
            const diffY = currentY - startY;
            
            if (!isDragging && (Math.abs(diffX) > dragThreshold || Math.abs(diffY) > dragThreshold)) {
                isDragging = true;
                pauseAnimation();
            }
            
            if (isDragging) {
                // Get center of container
                const containerRect = orbitalContainer.getBoundingClientRect();
                const centerX = containerRect.left + containerRect.width / 2;
                const centerY = containerRect.top + containerRect.height / 2;
                
                // Calculate vectors and angles
                const lastVectorX = lastX - centerX;
                const lastVectorY = lastY - centerY;
                const currentVectorX = currentX - centerX;
                const currentVectorY = currentY - centerY;
                
                const angle1 = Math.atan2(lastVectorY, lastVectorX);
                const angle2 = Math.atan2(currentVectorY, currentVectorX);
                let angleDiff = (angle2 - angle1) * (180 / Math.PI);
                
                // Update orbit angle
                orbitAngleOffset += angleDiff;
                if (orbitAngleOffset >= 360) orbitAngleOffset -= 360;
                if (orbitAngleOffset < 0) orbitAngleOffset += 360;
                
                // Update token positions
                positionOrbitalTokens();
                
                // Store current position for next move
                lastX = currentX;
                lastY = currentY;
            }
        }
    });
    
    document.addEventListener('mouseup', function(e) {
        if (isDragging) {
            dragTimeout = setTimeout(resumeAnimation, 500);
            localStorage.setItem('orbitAngleOffset', orbitAngleOffset.toString());
        }
        isMouseDown = false;
        isDragging = false;
    });
    
    // Make sure to cancel dragging if mouse leaves window
    document.addEventListener('mouseleave', function(e) {
        if (isDragging) {
            dragTimeout = setTimeout(resumeAnimation, 500);
            localStorage.setItem('orbitAngleOffset', orbitAngleOffset.toString());
        }
        isMouseDown = false;
        isDragging = false;
    });
}

// Expose functions for testing or direct use
if (typeof window !== 'undefined') {
    window.transitionToArtist = transitionToArtist;
    window.getCurrentArtistData = getCurrentArtistData;
    window.debugPurchaseFlow = debugPurchaseFlow;
}

// Get DOM elements
const tokenSlider = document.getElementById('tokenSlider');
const fromTokenSelect = document.getElementById('fromToken');
const toTokenSelect = document.getElementById('toToken');
const buyButton = document.getElementById('buyButton');
const contentUnlockToggle = document.getElementById('contentUnlockToggle');

// Update UI when safeword is used
function onSafewordUsed() {
    safewordUsed = true;
    localStorage.setItem('safewordUsed', 'true');
    refreshTokenLists();
    previewSwap();
}

// Update UI when artist changes
function onArtistChange(newArtist) {
    currentArtist = newArtist;
    refreshTokenLists();
    previewSwap();
    updateExploreButton();
} 