// Configuration and state management
import { config, loadConfigAndInit } from './config.js';
import { initDownloadFlow } from './download.js';

let currentArtist = localStorage.getItem('currentArtist') || "gosheesh";
let isLoggedIn = false;
let paymentSelected = false;
let orbitAnimationRunning = false;
let currentTokenAmount = 100;
let isAuthenticated = false; // Will be properly set during initialization
let contentUnlocked = {};
let safewordUsed = localStorage.getItem('safewordUsed') === 'true';
// Add orbital animation state variables
let orbitAnimationId = null;
let orbitAngleOffset = parseFloat(localStorage.getItem('orbitAngleOffset') || '0');
let lastOrbitTimestamp = 0;

// Magic SDK instance
let magic = null;
let userWalletAddress = null;
let userEmail = null;

// Initialize Magic SDK
function initMagic() {
    try {
        // First check if Magic is already initialized
        if (magic) {
            console.log('Magic SDK already initialized');
            // Still check the session to ensure login state is consistent
            checkUserSession();
            return;
        }
        
        // Initialize Magic instance with minimal configuration
        // Use only the required network parameter for Sepolia testnet
        magic = new Magic('pk_live_0A9CA1AC494AF3E6', {
            network: 'ethereum-sepolia'
        });
        
        console.log('Magic SDK initialized');
        
        // Check if user is already logged in
        setTimeout(() => {
            // Add a small delay to ensure Magic SDK is fully initialized
            checkUserSession();
        }, 100);
    } catch (error) {
        console.error('Error initializing Magic SDK:', error);
        console.log('Attempting to recover using localStorage authentication data');
        
        // Try to recover from localStorage even if Magic initialization fails
        recoverFromLocalStorage();
    }
}

// Add a function to recover authentication from localStorage
function recoverFromLocalStorage() {
    userWalletAddress = localStorage.getItem('userWalletAddress');
    userEmail = localStorage.getItem('userEmail');
    
    if (userWalletAddress && userEmail) {
        console.log(`Recovered stored credentials: ${userEmail}`);
        
        // We'll consider the user logged in based on localStorage
        isAuthenticated = true;
        isLoggedIn = true;
        localStorage.setItem('isAuthenticated', 'true');
        
        // Update UI based on authenticated state
        updateUIForAuthState();
        return true;
    } else {
        console.log('No stored credentials found');
        resetAuthState();
        return false;
    }
}

// Check if the user already has an active session
async function checkUserSession() {
    try {
        console.log('Checking Magic user session...');
        
        // Make sure Magic SDK is initialized
        if (!magic) {
            console.error('Magic SDK not initialized when checking session');
            resetAuthState();
            return false;
        }
        
        // First check if the user has an active session with Magic
        let isLoggedInWithMagic = false;
        try {
            isLoggedInWithMagic = await magic.user.isLoggedIn();
            console.log('Magic.user.isLoggedIn() result:', isLoggedInWithMagic);
        } catch (sessionError) {
            console.error('Error checking Magic login status:', sessionError);
            // Continue with fallback rather than exiting
        }
        
        if (isLoggedInWithMagic) {
            console.log('Active Magic session found');
            
            // Get user metadata (including wallet address and email)
            try {
                const userMetadata = await magic.user.getMetadata();
                console.log('User metadata:', userMetadata);
                
                userWalletAddress = userMetadata.publicAddress;
                userEmail = userMetadata.email;
                
                // Save user data to localStorage
                localStorage.setItem('userWalletAddress', userWalletAddress);
                localStorage.setItem('userEmail', userEmail);
                
                // Set authentication state
                isAuthenticated = true;
                isLoggedIn = true;
                localStorage.setItem('isAuthenticated', 'true');
                
                console.log(`Retrieved user data: ${userEmail} (${userWalletAddress})`);
                
                // Update UI based on authenticated state
                updateUIForAuthState();
                return true;
            } catch (metadataError) {
                console.error('Error getting user metadata:', metadataError);
                // Continue with fallback rather than exiting
            }
        }
        
        // Try to recover from localStorage as a fallback
        userWalletAddress = localStorage.getItem('userWalletAddress');
        userEmail = localStorage.getItem('userEmail');
        
        if (userWalletAddress && userEmail) {
            console.log(`No active Magic session, but found stored credentials: ${userEmail}`);
            
            // We'll consider the user logged in based on localStorage
            isAuthenticated = true;
            isLoggedIn = true;
            localStorage.setItem('isAuthenticated', 'true');
            
            // Update UI based on authenticated state
            updateUIForAuthState();
            return true;
        } else {
            console.log('No active Magic session or stored credentials');
            resetAuthState();
            return false;
        }
    } catch (error) {
        console.error('Error checking Magic session:', error);
        resetAuthState();
        return false;
    }
}

// Reset authentication state
function resetAuthState() {
    console.log('Resetting authentication state');
    isAuthenticated = false;
    isLoggedIn = false;
    userWalletAddress = null;
    userEmail = null;
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userWalletAddress');
    localStorage.removeItem('userEmail');
    
    // Update UI for non-authenticated state
    updateUIForAuthState();
}

// Fetch configuration and initialize the page
document.addEventListener('DOMContentLoaded', async () => {
    // Initialize Magic SDK
    initMagic();
    
    // Set up email login button
    const emailLoginBtn = document.getElementById('emailLoginBtn');
    if (emailLoginBtn) {
        emailLoginBtn.addEventListener('click', handleEmailLogin);
    }
    
    // Load configuration using the imported function
    loadConfigAndInit(initializeApp);
});

// Initialize the application after config is loaded
function initializeApp() {
    console.log("Initializing application");
    
    // Check authentication status
    isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
    isLoggedIn = isAuthenticated;
    
    // Check safeword status
    safewordUsed = localStorage.getItem('safewordUsed') === 'true';
    
    console.log("Initial state:", { isAuthenticated, isLoggedIn, safewordUsed, currentArtist });
    
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
    
    // Set up logout button
    setupLogoutButton();
    
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
        updateFromTokenAmount(currentTokenAmount);
    } else {
        currentTokenAmount = config.defaults.initialTokenAmount;
    }

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

// Update all UI elements with current artist data
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

// Set up token slider functionality
function setupTokenSlider() {
    const slider = document.getElementById('tokenSlider');
    const tokenAmountInput = document.getElementById('tokenAmountInput');
    const tokenTotalInput = document.getElementById('tokenTotalInput');
    
    if (!slider) return;
    
    const artistData = getCurrentArtistData();
    
    // Calculate price and limits
    const price = artistData.tokenPrice;
    const maxDollarAmount = 10000;
    const minDollarAmount = 0; // Changed from 1 to 0 to allow $0 purchases
    
    // Calculate token limits based on dollar amounts
    const maxTokens = Math.floor(maxDollarAmount / price);
    const minTokens = Math.ceil(minDollarAmount / price);
    
    // Set min and max attributes dynamically based on price
    slider.min = minTokens;
    slider.max = maxTokens;
    
    // Set initial value to 200,000 tokens (equivalent to $100)
    const initialTokens = 200000;
    slider.value = initialTokens;
    
    // Update values on load
    updateFromTokenAmount(initialTokens);
    
    // Update when slider changes
    slider.addEventListener('input', () => {
        updateFromTokenAmount(slider.value);
        // Update the buy button display
        updateTotalPrice();
    });
    
    // Update when token amount input changes
    tokenAmountInput.addEventListener('input', () => {
        let value = parseInt(tokenAmountInput.value.replace(/,/g, ''));
        
        // If the input is not a valid number, reset to default
        if (isNaN(value) || value < 0) {
            value = config.defaults.initialTokenAmount;
        }
        
        // Apply boundaries
        value = Math.max(minTokens, Math.min(maxTokens, value));
        
        // Update the slider and values
        slider.value = value;
        updateFromTokenAmount(value);
        // Update the buy button display
        updateTotalPrice();
    });
    
    // Update when total amount input changes
    tokenTotalInput.addEventListener('input', () => {
        let value = parseFloat(tokenTotalInput.value.replace(/,/g, ''));
        
        // If the input is not a valid number, reset to default
        if (isNaN(value) || value < 0) {
            value = config.defaults.initialTokenAmount * price;
        }
        
        // Apply boundaries
        const minTotal = minTokens * price;
        const maxTotal = maxTokens * price;
        value = Math.max(minTotal, Math.min(maxTotal, value));
        
        // Convert to tokens
        const tokens = Math.round(value / price);
        
        // Update slider and values
        slider.value = tokens;
        updateFromTokenAmount(tokens);
        // Update the buy button display
        updateTotalPrice();
    });
}

// Update from token amount 
function updateFromTokenAmount(tokens) {
    const artistData = getCurrentArtistData();
    if (!artistData) {
        console.error("Could not get artist data in updateFromTokenAmount");
        return;
    }
    
    const price = artistData.tokenPrice;
    
    // Update current token amount for purchase
    currentTokenAmount = parseInt(tokens);
    
    // Calculate total price for artistocks only
    const artistocksPrice = (currentTokenAmount * price);
    
    // Format token amount with commas
    const formattedTokens = new Intl.NumberFormat().format(currentTokenAmount);
    
    // Update DOM elements
    const tokenAmountInput = document.getElementById('tokenAmountInput');
    const tokenTotalInput = document.getElementById('tokenTotalInput');
    const purchaseAmount = document.getElementById('purchaseAmount');
    const purchasedAmount = document.getElementById('purchasedAmount');
    
    if (tokenAmountInput) {
        tokenAmountInput.value = formattedTokens;
    }
    
    if (tokenTotalInput) {
        // Just show the artistocks price, without adding the $1 download
        tokenTotalInput.value = artistocksPrice.toFixed(2);
        
        console.log(`Artistocks price calculation: ${artistocksPrice.toFixed(4)} (${currentTokenAmount} tokens at $${price.toFixed(4)} each)`);
    }
    
    if (purchaseAmount) {
        purchaseAmount.textContent = formattedTokens;
    }
    
    if (purchasedAmount) {
        purchasedAmount.textContent = formattedTokens;
    }
    
    // Update the buy button to reflect the new total
    updateBuyButton();
    
    console.log(`Token amount updated: ${formattedTokens} tokens at $${price.toFixed(4)} = $${artistocksPrice.toFixed(4)}`);
}

// Update the token price display
function updateArtistTokenPrice() {
    const tokenPriceSpan = document.getElementById('tokenUnitPrice');
    const artistData = getCurrentArtistData();
    if (tokenPriceSpan && artistData) {
        tokenPriceSpan.textContent = artistData.tokenPrice.toFixed(4);
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

// Set up orbital tokens for the given artist
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

// Animate the orbital tokens
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

// Position orbital tokens based on their current angles
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

// Handle email login form
async function handleEmailLogin() {
    const email = document.getElementById('emailInput').value;
    const emailInput = document.getElementById('emailInput');
    const emailLoginBtn = document.getElementById('emailLoginBtn');
    const loginFeedback = document.getElementById('loginFeedback');
    
    // Reset any previous error states
    emailInput.classList.remove('error');
    if (loginFeedback) {
        loginFeedback.style.display = 'none';
        loginFeedback.classList.remove('error');
    }
    
    // Check if Magic SDK is initialized
    if (!magic) {
        console.log('Magic SDK not initialized, trying to initialize now');
        
        // Try to initialize it now
        initMagic();
        
        // Small delay to let initialization complete
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Check again
        if (!magic) {
            console.error('Failed to initialize Magic SDK');
            if (loginFeedback) {
                loginFeedback.textContent = 'Unable to connect to authentication service. Using localStorage fallback.';
                loginFeedback.classList.add('error');
                loginFeedback.style.display = 'block';
            }
            
            // Try localStorage fallback anyway
            const success = recoverFromLocalStorage();
            if (success) {
                completeLogin('localStorage');
                return;
            }
            
            return;
        }
    }
    
    // Very basic email validation
    if (email && email.includes('@') && email.includes('.')) {
        try {
            console.log(`Attempting login with email: ${email}`);
            
            // Show loading state on the button
            if (emailLoginBtn) {
                emailLoginBtn.innerHTML = '<span class="loading-spinner"></span>Sending...';
                emailLoginBtn.disabled = true;
                emailLoginBtn.classList.add('loading');
            }
            
            // Show processing message
            if (loginFeedback) {
                loginFeedback.textContent = 'Processing login... Check your email for the verification link';
                loginFeedback.style.display = 'block';
            }
            
            // First store the email to ensure we have it even if Magic fails
            localStorage.setItem('userEmail', email);
            
            // Try Magic login
            try {
                // Call Magic Link login
                await magic.auth.loginWithEmailOTP({ email });
                
                // If we get here, login was successful
                console.log('Magic login successful');
                
                try {
                    // Get user metadata
                    const userMetadata = await magic.user.getMetadata();
                    userWalletAddress = userMetadata.publicAddress;
                    userEmail = userMetadata.email;
                    
                    // Save to localStorage
                    localStorage.setItem('userWalletAddress', userWalletAddress);
                    localStorage.setItem('userEmail', userEmail);
                    localStorage.setItem('isAuthenticated', 'true');
                    
                    console.log(`Login complete - wallet: ${userWalletAddress}`);
                } catch (metadataError) {
                    console.error('Error getting user metadata:', metadataError);
                    
                    // Generate a fallback wallet address if needed
                    if (!userWalletAddress) {
                        userWalletAddress = '0x' + [...Array(40)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');
                        localStorage.setItem('userWalletAddress', userWalletAddress);
                        localStorage.setItem('isAuthenticated', 'true');
                        console.log(`Created fallback wallet: ${userWalletAddress}`);
                    }
                }
                
                // Complete login flow
                completeLogin('email');
            } catch (error) {
                console.error('Magic SDK login error:', error);
                
                // Show error message but try localStorage fallback
                if (loginFeedback) {
                    loginFeedback.textContent = 'Magic login unavailable. Using local authentication instead.';
                    loginFeedback.style.display = 'block';
                }
                
                // Use fallback login method with just localStorage
                userWalletAddress = '0x' + [...Array(40)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');
                localStorage.setItem('userWalletAddress', userWalletAddress);
                localStorage.setItem('isAuthenticated', 'true');
                console.log(`Created fallback wallet: ${userWalletAddress}`);
                
                // Complete login without Magic
                completeLogin('localStorage');
            }
            
            // Reset button state
            if (emailLoginBtn) {
                emailLoginBtn.innerHTML = 'Continue with Email';
                emailLoginBtn.disabled = false;
                emailLoginBtn.classList.remove('loading');
            }
        } catch (error) {
            console.error('Error during login process:', error);
            
            // Reset button state
            if (emailLoginBtn) {
                emailLoginBtn.innerHTML = 'Continue with Email';
                emailLoginBtn.disabled = false;
                emailLoginBtn.classList.remove('loading');
            }
            
            // Try localStorage fallback anyway
            userWalletAddress = '0x' + [...Array(40)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');
            localStorage.setItem('userWalletAddress', userWalletAddress);
            localStorage.setItem('isAuthenticated', 'true');
            
            // Complete login without Magic
            completeLogin('localStorage');
        }
    } else {
        // Invalid email
        emailInput.classList.add('error');
        emailInput.style.animation = 'shake 0.5s';
        
        // Show error message
        if (loginFeedback) {
            loginFeedback.textContent = 'Please enter a valid email address.';
            loginFeedback.classList.add('error');
            loginFeedback.style.display = 'block';
        }
        
        // Reset animation
        setTimeout(() => {
            emailInput.style.animation = '';
            emailInput.focus();
        }, 500);
    }
}

// Handle social login selection
function handleLogin(method) {
    console.log(`Login selected: ${method}`);
    
    // For now, social logins are disabled (show a message instead)
    alert(`${method} login will be available in the upcoming Next.js version.`);
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

// Complete login process and show purchase section
function completeLogin(method) {
    console.log(`Completing login via ${method}`);
    
    // Set authentication state
    isAuthenticated = true;
    isLoggedIn = true;
    localStorage.setItem('isAuthenticated', 'true');

    // Get safeword status from localStorage
    safewordUsed = localStorage.getItem('safewordUsed') === 'true';
    
    // Add wallet address to the header if it exists
    if (userWalletAddress) {
        // Either update existing wallet display or create a new one
        let walletDisplay = document.getElementById('walletDisplay');
        
        if (!walletDisplay) {
            walletDisplay = document.createElement('div');
            walletDisplay.id = 'walletDisplay';
            walletDisplay.className = 'wallet-display';
            
            // Insert wallet display after artist name
            const artistName = document.getElementById('artistName');
            if (artistName && artistName.parentNode) {
                artistName.parentNode.insertBefore(walletDisplay, artistName.nextSibling);
            }
        }
        
        // Show abbreviated wallet address
        const shortAddress = userWalletAddress.substring(0, 6) + '...' + userWalletAddress.substring(userWalletAddress.length - 4);
        walletDisplay.textContent = shortAddress;
        
        // Add tooltip with full address and email
        walletDisplay.title = `${userEmail}\n${userWalletAddress}`;
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
        newBuyButton.addEventListener('click', handleBuyClick);
    }
    
    // Update buy button text
    updateBuyButton();
    
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
}

// Show success message after login
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

// Add a brief highlight animation to selected login button
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

// Handle payment selection
function handlePayment(method) {
    console.log(`Payment selected: ${method} for artist: ${currentArtist}`);
    paymentSelected = true;
    
    // Ensure user stays authenticated
    isAuthenticated = true;
    localStorage.setItem('isAuthenticated', 'true');
    
    // Get safeword status and check if this includes artistocks
    safewordUsed = localStorage.getItem('safewordUsed') === 'true';
    
    // Determine the transaction type based on artistock amount
    const artistData = getCurrentArtistData();
    if (!artistData) {
        console.error("Could not get artist data in handlePayment");
        return;
    }
    
    let artistocksTotal = 0;
    let includesArtistocks = false;
    const contentUnlockToggle = document.getElementById('contentUnlockToggle');
    const includesDownload = contentUnlockToggle && contentUnlockToggle.checked;
    
    // Calculate artistocks total if applicable
    if (safewordUsed && currentTokenAmount > 0) {
        artistocksTotal = currentTokenAmount * artistData.tokenPrice;
        includesArtistocks = true;
    }
    
    // Calculate total price
    const totalPrice = (artistocksTotal + (includesDownload ? 1 : 0)).toFixed(2);
    
    // Log the purchase details
    console.log(`Processing payment: $${totalPrice} (Artistocks: ${includesArtistocks ? '$' + artistocksTotal.toFixed(2) : 'No'}, Download: ${includesDownload ? '$1.00' : 'No'})`);
    
    // Don't allow payment if nothing is selected
    if (artistocksTotal === 0 && !includesDownload) {
        console.error("Nothing selected for purchase");
        
        // Apply shake animation instead of showing an alert
        const paymentSection = document.querySelector('.payment-section');
        const purchaseSection = document.getElementById('purchaseSection');
        
        // Create a shake animation function if it doesn't exist
        if (typeof applyShakeAnimation !== 'function') {
            window.applyShakeAnimation = function(element) {
                if (!element) return;
                element.style.animation = '';
                void element.offsetWidth;
                element.style.animation = 'shake 0.5s';
                setTimeout(() => {
                    element.style.animation = '';
                }, 500);
            };
        }
        
        // Apply the animation
        if (typeof applyShakeAnimation === 'function') {
            applyShakeAnimation(paymentSection);
            applyShakeAnimation(purchaseSection);
        } else {
            // Fallback if function not available
            if (paymentSection) {
                paymentSection.style.animation = 'shake 0.5s';
                setTimeout(() => { paymentSection.style.animation = ''; }, 500);
            }
            if (purchaseSection) {
                purchaseSection.style.animation = 'shake 0.5s';
                setTimeout(() => { purchaseSection.style.animation = ''; }, 500);
            }
        }
        
        // Add visual error message
        const errorMessage = document.createElement('div');
        errorMessage.className = 'purchase-error-message';
        errorMessage.textContent = 'Please select either artistocks or enable the download';
        errorMessage.style.color = '#ff6b6b';
        errorMessage.style.textAlign = 'center';
        errorMessage.style.marginTop = '10px';
        errorMessage.style.marginBottom = '10px';
        errorMessage.style.fontWeight = 'bold';
        
        // Add to purchase section
        if (purchaseSection && !purchaseSection.querySelector('.purchase-error-message')) {
            purchaseSection.prepend(errorMessage);
            
            // Remove after 3 seconds
            setTimeout(() => {
                if (errorMessage.parentNode) {
                    errorMessage.remove();
                }
            }, 3000);
        }
        
        return;
    }
    
    // Flash the selected payment button
    flashPaymentButton(method);
    
    // Complete the payment process after a short delay
    // This ensures the UI has time to update
    setTimeout(() => {
        if (includesArtistocks) {
            console.log("Completing payment process for artistocks + download...");
        } else {
            console.log("Completing payment process for download only...");
        }
        
        // Direct approach to showing success
        showSuccessSection(includesArtistocks);
        
        // Wait a moment for the success section to complete its work
        // before updating the wallet, to ensure contentUnlocked is saved
        setTimeout(() => {
            // Update wallet with the purchase, including whether download was purchased
            if (window.wallet) {
                window.wallet.onPurchaseComplete(currentArtist, includesArtistocks, currentTokenAmount, includesDownload);
            }
        }, 200);
    }, 800);
}

// Show success section directly
function showSuccessSection(includesArtistocks = false) {
    console.log(`Showing success section for ${includesArtistocks ? 'artistocks+download' : 'download only'}`);
    
    // Ensure success section exists
    let successSection = document.getElementById('successSection');
    
    // Get artist data
    const artistData = getCurrentArtistData();
    if (!artistData) {
        console.error("Could not get artist data in showSuccessSection");
        return;
    }
    
    // Create or update the success section
    if (!successSection) {
        console.log("Creating new success section");
        const contentSection = document.querySelector('.content-section');
        if (!contentSection) {
            console.error("Content section not found!");
            return;
        }
        
        successSection = document.createElement('div');
        successSection.className = 'success-section';
        successSection.id = 'successSection';
        
        // Create success content
        const checkmark = document.createElement('div');
        checkmark.className = 'success-check';
        checkmark.textContent = '✓';
        successSection.appendChild(checkmark);
        
        // Create title based on purchase type
        const title = document.createElement('h3');
        if (includesArtistocks) {
            title.innerHTML = `You now own <span id="purchasedAmount">${new Intl.NumberFormat().format(currentTokenAmount)}</span> <span id="artistStockName">${artistData.name}</span> Artistocks!`;
        } else {
            title.textContent = "You've unlocked this download!";
        }
        successSection.appendChild(title);
        
        // Generate IPFS hash for download
        const ipfsHash = generateIPFSHash();
        
        // Create message based on purchase type
        const message = document.createElement('p');
        if (includesArtistocks) {
            message.innerHTML = `Your purchase is complete and you are now officially in the orbit.<br><br>🎵 <a href="#" onclick="alert('Downloading content...')" class="download-link">Download your content (IPFS: ${ipfsHash})</a>`;
        } else {
            message.innerHTML = `Your purchase gives you permanent access to this content.<br><br>🎵 <a href="#" onclick="alert('Downloading content...')" class="download-link">Download your content (IPFS: ${ipfsHash})</a>`;
        }
        successSection.appendChild(message);
        
        // Add explore button
        const exploreBtn = document.createElement('button');
        exploreBtn.className = 'explore-btn';
        exploreBtn.textContent = currentArtist === 'gosheesh' ? 'Explore JAI TEA' : 'Explore GOSHEESH';
        exploreBtn.addEventListener('click', () => {
            currentArtist === 'gosheesh' ? transitionToArtist('jaitea') : transitionToArtist('gosheesh');
        });
        successSection.appendChild(exploreBtn);
        
        // Add to DOM
        contentSection.appendChild(successSection);
    } else {
        console.log("Updating existing success section");
        
        // Clear existing content
        successSection.innerHTML = '';
        
        // Recreate all elements based on purchase type
        const checkmark = document.createElement('div');
        checkmark.className = 'success-check';
        checkmark.textContent = '✓';
        successSection.appendChild(checkmark);
        
        // Create title based on purchase type
        const title = document.createElement('h3');
        if (includesArtistocks) {
            title.innerHTML = `You now own <span id="purchasedAmount">${new Intl.NumberFormat().format(currentTokenAmount)}</span> <span id="artistStockName">${artistData.name}</span> Artistocks!`;
        } else {
            title.textContent = "You've unlocked this download!";
        }
        successSection.appendChild(title);
        
        // Generate IPFS hash for download
        const ipfsHash = generateIPFSHash();
        
        // Create message based on purchase type
        const message = document.createElement('p');
        if (includesArtistocks) {
            message.innerHTML = `Your purchase is complete and you are now officially in the orbit.<br><br>🎵 <a href="#" onclick="alert('Downloading content...')" class="download-link">Download your content (IPFS: ${ipfsHash})</a>`;
        } else {
            message.innerHTML = `Your purchase gives you permanent access to this content.<br><br>🎵 <a href="#" onclick="alert('Downloading content...')" class="download-link">Download your content (IPFS: ${ipfsHash})</a>`;
        }
        successSection.appendChild(message);
        
        // Add explore button
        const exploreBtn = document.createElement('button');
        exploreBtn.className = 'explore-btn';
        exploreBtn.textContent = currentArtist === 'gosheesh' ? 'Explore JAI TEA' : 'Explore GOSHEESH';
        exploreBtn.addEventListener('click', () => {
            currentArtist === 'gosheesh' ? transitionToArtist('jaitea') : transitionToArtist('gosheesh');
        });
        successSection.appendChild(exploreBtn);
    }
    
    // Mark this artist's content as unlocked
    contentUnlocked[currentArtist] = true;
    localStorage.setItem('artistUnlocked', JSON.stringify(contentUnlocked));
    localStorage.setItem(`${currentArtist}_unlocked`, 'true');
    
    // Hide all sections except success
    document.querySelectorAll('.content-section > div').forEach(section => {
        section.style.display = 'none';
    });
    
    // Show success section
    if (successSection) {
        successSection.style.display = 'block';
        successSection.style.opacity = '1';
        
        // Scroll to success section
        successSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    
    console.log(`Purchase complete for ${includesArtistocks ? 'artistocks+download' : 'download only'}, artist: ${currentArtist}`);
}

// Generate a simulated IPFS hash
function generateIPFSHash() {
    const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    let hash = 'Qm';
    for (let i = 0; i < 44; i++) {
        hash += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return hash;
}

// Expose generateIPFSHash function to window for use in wallet.js
if (typeof window !== 'undefined') {
    window.generateIPFSHash = generateIPFSHash;
}

// Function to transition to a different artist
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
    // to ensure they're preserved during transition
    isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
    isLoggedIn = isAuthenticated;
    safewordUsed = localStorage.getItem('safewordUsed') === 'true';
    
    console.log(`Artist transition - Auth state: ${isAuthenticated}, Safeword: ${safewordUsed}`);
    
    // Update UI elements with the new artist name
    updateArtistElements();
    
    // Change theme
    applyArtistTheme(currentArtist);
    
    // Update video source
    const video = document.getElementById('artistVideo');
    const source = document.getElementById('videoSource');
    if (!video || !source) return;
    
    const isMuted = video.muted; // Store the current mute state
    
    // Hide video temporarily during transition
    video.style.opacity = '0';
    
    // Update source
    source.src = artistData.videoSrc;
    video.load();
    
    // When video is ready, show it
    video.oncanplay = () => {
        video.style.opacity = '1';
        showVideoFallback(false);
        video.muted = isMuted; // Restore the mute state
        
        // If unmuted, make sure audio is playing
        if (!video.muted) {
            video.play().catch(err => {
                console.error('Error playing video:', err);
                // If autoplay with sound fails, mute and try again
                video.muted = true;
                video.play().catch(err2 => console.error('Video still cannot play:', err2));
            });
        }
        
        // Update mute button icons to match the video state
        const mutedIcon = document.querySelector('.muted-icon');
        const unmutedIcon = document.querySelector('.unmuted-icon');
        const muteToggle = document.getElementById('muteToggle');
        
        if (mutedIcon && unmutedIcon && muteToggle) {
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
    };
    
    // Start playing
    video.play().catch(() => {
        // Video might not play, handle error
        showVideoFallback(true);
    });
    
    // Update token price and reset token slider
    updateArtistTokenPrice();
    
    // Clear chat input
    const chatInput = document.getElementById('chatInput');
    if (chatInput) {
        chatInput.value = '';
        // For better UX, update placeholder
        chatInput.placeholder = "Type something";
    }

    // Reset UI: Hide all sections initially
    document.querySelectorAll('.content-section > div').forEach(section => {
        section.style.display = 'none';
    });
    
    // Always ensure the token preview section is visible for all artists
    const tokenSection = document.getElementById('tokenPreviewSection');
    if (tokenSection) {
        tokenSection.style.display = 'block';
        tokenSection.style.opacity = '1';
        tokenSection.style.transform = 'translateY(0)';
    }
    
    // Ensure purchase section exists
    ensurePurchaseSectionExists();
    
    // Set up login section properly based on authentication
    const loginSection = document.getElementById('loginSection');
    if (loginSection) {
        if (isAuthenticated) {
            loginSection.style.display = 'none';
            loginSection.style.opacity = '0';
        } else {
            loginSection.style.display = 'flex';
            loginSection.style.opacity = '1';
        }
    }
    
    // Set up content unlock toggle properly
    const contentUnlockToggle = document.getElementById('contentUnlockToggle');
    if (contentUnlockToggle) {
        // Default to true for download availability
        contentUnlockToggle.checked = true;
    }
    
    // Set up advanced purchase options based on safeword
    const advancedOptions = document.getElementById('advancedPurchaseOptions');
    if (advancedOptions) {
        if (safewordUsed && isAuthenticated) {
            advancedOptions.style.display = 'block';
            advancedOptions.classList.add('show');
            advancedOptions.style.opacity = '1';
            advancedOptions.style.maxHeight = '300px';
        } else {
            advancedOptions.style.display = 'none';
            advancedOptions.classList.remove('show');
            advancedOptions.style.opacity = '0';
            advancedOptions.style.maxHeight = '0';
        }
    }
    
    // Update orbital tokens
    setupOrbitalTokens(currentArtist);
    
    // Update the explore button
    updateExploreButton();
    
    // Re-initialize token drag controls for new tokens
    setupTokenDragControls();
    
    // Reset animation flag to ensure animation restarts with new tokens
    // Keep angle offset but restart the animation
    if (orbitAnimationId) {
        cancelAnimationFrame(orbitAnimationId);
        orbitAnimationId = null;
    }
    orbitAnimationRunning = false;
    animateOrbit();
    
    // Position tokens correctly after transition
    setTimeout(positionOrbitalTokens, 200);
    
    // First calculate the current total price
    updateFromTokenAmount(currentTokenAmount);
    
    // Then update the total price - this ensures the total is correctly calculated
    updateTotalPrice();
    
    // Set up buy button with the correct event handler and text
    const buyButton = document.getElementById('buyButton');
    if (buyButton) {
        // Direct approach: Remove all existing listeners
        const newBuyButton = buyButton.cloneNode(true);
        buyButton.parentNode.replaceChild(newBuyButton, buyButton);
        
        // Add click listener directly
        newBuyButton.addEventListener('click', handleBuyClick);
        console.log("Re-attached click handler to buy button");
    }
    
    // Do a final check after everything is set up
    setTimeout(() => {
        // Re-check buy button
        const buyButton = document.getElementById('buyButton');
        if (buyButton) {
            // Make sure we can track clicks
            buyButton.addEventListener('click', function() {
                console.log('Buy button clicked (backup handler)');
                handleBuyClick();
            });
        }
        
        // Debug the setup
        debugPurchaseFlow();
    }, 500);
    
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
}

// Handle buy button click
function handleBuyClick() {
    console.log("Buy button clicked - Current artist:", currentArtist);
    
    // Always check authentication from localStorage
    isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
    isLoggedIn = isAuthenticated;
    safewordUsed = localStorage.getItem('safewordUsed') === 'true';
    
    console.log("Authentication state:", isAuthenticated); 
    
    // Get purchase options selection state
    const contentUnlockToggle = document.getElementById('contentUnlockToggle');
    const includesDownload = contentUnlockToggle && contentUnlockToggle.checked;
    let artistocksTotal = 0;
    
    // Calculate artistocks amount if safeword is used
    if (safewordUsed) {
        const artistData = getCurrentArtistData();
        if (artistData && currentTokenAmount > 0) {
            artistocksTotal = currentTokenAmount * artistData.tokenPrice;
        }
    }
    
    // Check if either download or artistocks is selected
    const hasValidSelection = includesDownload || (safewordUsed && artistocksTotal > 0);
    
    // Check authentication first
    if (!isAuthenticated) {
        console.log("Not authenticated, showing login and applying shake animation");
        
        // Make sure login section is visible first
        const loginSection = document.getElementById('loginSection');
        if (loginSection) {
            loginSection.style.display = 'flex';
            loginSection.style.opacity = '1';
            
            // Apply shake animation to the login section
            loginSection.style.animation = '';
            void loginSection.offsetWidth; // Force reflow
            loginSection.style.animation = 'shake 0.5s';
            
            // Scroll to login section
            loginSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
            // Reset animation after it completes
            setTimeout(() => {
                loginSection.style.animation = '';
            }, 500);
        }
        
        // Also shake the buy button to indicate action needed
        const buyButton = document.getElementById('buyButton');
        if (buyButton) {
            buyButton.style.animation = '';
            void buyButton.offsetWidth; // Force reflow
            buyButton.style.animation = 'shake 0.5s';
            
            // Reset animation after it completes
            setTimeout(() => {
                buyButton.style.animation = '';
            }, 500);
        }
        
        return;
    }
    
    // If no valid selection (neither download nor artistocks), show error and return
    if (!hasValidSelection) {
        console.log("No valid purchase selection");
        
        // Highlight the toggle to indicate it should be checked
        if (contentUnlockToggle) {
            contentUnlockToggle.parentElement.style.boxShadow = '0 0 10px rgba(255, 255, 255, 0.5)';
            setTimeout(() => {
                contentUnlockToggle.parentElement.style.boxShadow = '';
            }, 3000);
        }
        
        return;
    }
    
    // If download isn't checked AND safeword hasn't been used, show error
    if (!includesDownload && !safewordUsed) {
        console.log("Download not selected and safeword not used, prompting user to check the box");
        
        // Highlight the toggle to indicate it should be checked
        if (contentUnlockToggle) {
            contentUnlockToggle.parentElement.style.boxShadow = '0 0 10px rgba(255, 255, 255, 0.5)';
            setTimeout(() => {
                contentUnlockToggle.parentElement.style.boxShadow = '';
            }, 3000);
        }
        
        return;
    }
    
    console.log("Authenticated, proceeding with purchase flow");
    
    // Force-create the purchase section if it doesn't exist
    ensurePurchaseSectionExists();
    
    // Get the purchase section directly
    const purchaseSection = document.getElementById('purchaseSection');
    if (!purchaseSection) {
        console.error("Purchase section still not found after trying to create it!");
        return;
    }
    
    // First hide all other sections
    document.querySelectorAll('.content-section > div').forEach(section => {
        if (section.id !== 'purchaseSection') {
            section.style.display = 'none';
        }
    });
    
    // Calculate the correct total price and update the headline
    const artistData = getCurrentArtistData();
    if (!artistData) {
        console.error("Could not get artist data!");
        return;
    }
    
    // Check if advanced purchase options are visible and have a value
    const unlockCost = contentUnlockToggle && contentUnlockToggle.checked ? 1 : 0;
    
    // Calculate total price (artistocks + $1 download)
    const totalPrice = artistocksTotal + unlockCost;
    console.log(`Total price: $${totalPrice.toFixed(2)} (Artistocks: $${artistocksTotal.toFixed(2)}, Download: $${unlockCost})`);
    
    // Explicitly update purchase headline
    const purchaseHeadline = document.getElementById('purchaseHeadline');
    if (purchaseHeadline) {
        if (safewordUsed && artistocksTotal > 0) {
            if (unlockCost > 0) {
                // Both artistocks and download
                purchaseHeadline.innerHTML = `Complete your purchase of <span id="purchaseAmount">${new Intl.NumberFormat().format(currentTokenAmount)}</span> <span id="artistStockPurchaseName">${artistData.name}</span> Artistocks + <span class="price-highlight-small">$1 Download</span> for <span class="price-highlight-small">$${totalPrice.toFixed(2)}</span>`;
            } else {
                // Just artistocks, no download
                purchaseHeadline.innerHTML = `Complete your purchase of <span id="purchaseAmount">${new Intl.NumberFormat().format(currentTokenAmount)}</span> <span id="artistStockPurchaseName">${artistData.name}</span> Artistocks for <span class="price-highlight-small">$${totalPrice.toFixed(2)}</span>`;
            }
        } else if (unlockCost > 0) {
            // Just download
            purchaseHeadline.innerHTML = `Complete your download purchase for <span class="price-highlight-small">$1</span>`;
        } else {
            // No purchase selected - this should never happen with our early validation
            purchaseHeadline.innerHTML = `Please select an option to continue`;
        }
    }
    
    // Now force display the purchase section
    purchaseSection.style.display = 'block';
    purchaseSection.style.opacity = '1';
    
    // Ensure payment section is visible
    const paymentSection = purchaseSection.querySelector('.payment-section');
    if (paymentSection) {
        paymentSection.style.display = 'grid';
        paymentSection.style.opacity = '1';
    }
    
    // Extra check for payment buttons - create them if missing
    if (document.querySelectorAll('.payment-btn').length === 0) {
        createPaymentButtons();
    }
    
    // Force redraw
    void purchaseSection.offsetHeight;
    
    // Scroll it into view
    purchaseSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    console.log("Purchase flow setup complete - Forced display of purchase section");
}

// Ensure purchase section exists
function ensurePurchaseSectionExists() {
    console.log("Ensuring purchase section exists");
    
    let purchaseSection = document.getElementById('purchaseSection');
    
    // If purchase section doesn't exist, create it
    if (!purchaseSection) {
        console.log("Purchase section not found, creating it");
        const contentSection = document.querySelector('.content-section');
        if (contentSection) {
            purchaseSection = document.createElement('div');
            purchaseSection.className = 'purchase-section';
            purchaseSection.id = 'purchaseSection';
            
            // Add headline
            const headline = document.createElement('h3');
            headline.id = 'purchaseHeadline';
            headline.innerHTML = `Complete your download purchase for <span class="price-highlight-small">$1</span>`;
            purchaseSection.appendChild(headline);
            
            // Add payment section
            const paymentSection = document.createElement('div');
            paymentSection.className = 'payment-section';
            purchaseSection.appendChild(paymentSection);
            
            // Add payment buttons
            createPaymentButtons(paymentSection);
            
            // Add to DOM
            contentSection.appendChild(purchaseSection);
            console.log("Created new purchase section");
        } else {
            console.error("Content section not found, cannot create purchase section");
        }
    } else {
        // Ensure purchase section has a payment section
        let paymentSection = purchaseSection.querySelector('.payment-section');
        if (!paymentSection) {
            console.log("Payment section not found, creating it");
            paymentSection = document.createElement('div');
            paymentSection.className = 'payment-section';
            purchaseSection.appendChild(paymentSection);
            
            // Add payment buttons
            createPaymentButtons(paymentSection);
        }
    }
}

// Create payment buttons
function createPaymentButtons(parentElement) {
    const paymentSection = parentElement || document.querySelector('.payment-section');
    if (!paymentSection) {
        console.error("Cannot create payment buttons: no payment section found");
        return;
    }
    
    console.log("Creating payment buttons");
    
    // Clear existing buttons
    paymentSection.innerHTML = '';
    
    // Add payment buttons
    const paymentMethods = ['credit', 'paypal', 'venmo', 'crypto'];
    paymentMethods.forEach(method => {
        const btn = document.createElement('button');
        btn.className = `payment-btn ${method}`;
        btn.textContent = method === 'credit' ? 'Credit Card' : 
                         method === 'paypal' ? 'PayPal' : 
                         method === 'venmo' ? 'Venmo' : 'Crypto';
        
        // Add event listener directly
        btn.addEventListener('click', () => handlePayment(method));
        
        paymentSection.appendChild(btn);
    });
    
    console.log(`Created ${paymentMethods.length} payment buttons`);
}

// Set up content unlock toggle functionality
function setupContentUnlockToggle() {
    const toggle = document.getElementById('contentUnlockToggle');
    if (!toggle) return;
    
    // Remove existing event listeners by cloning and replacing
    const newToggle = toggle.cloneNode(true);
    toggle.parentNode.replaceChild(newToggle, toggle);
    
    // Get the new reference
    const updatedToggle = document.getElementById('contentUnlockToggle');
    
    // Create a helper function to show error messages
    const showErrorMessage = (message) => {
        // Remove any existing error message
        const existingError = document.querySelector('.toggle-error-message');
        if (existingError) {
            existingError.remove();
        }
        
        // Get parent container for the toggle
        const toggleContainer = document.querySelector('.content-unlock-toggle');
        if (!toggleContainer) return;
        
        // Create error message element
        const errorElement = document.createElement('div');
        errorElement.className = 'toggle-error-message';
        errorElement.style.color = '#ff6b6b';
        errorElement.style.marginTop = '8px';
        errorElement.style.fontWeight = 'bold';
        errorElement.style.fontSize = '0.9rem';
        errorElement.textContent = message;
        
        // Add to container
        toggleContainer.appendChild(errorElement);
        
        // Remove after delay
        setTimeout(() => {
            if (errorElement.parentNode) {
                errorElement.remove();
            }
        }, 3000);
    };
    
    // Listen for changes to update total price
    updatedToggle.addEventListener('change', () => {
        console.log(`Content unlock toggle changed to: ${updatedToggle.checked ? 'checked' : 'unchecked'}`);
        
        // Get safeword status
        safewordUsed = localStorage.getItem('safewordUsed') === 'true';
        
        // Update the total price calculation
        updateTotalPrice();
        
        // Update buy button text to reflect the change
        updateBuyButton();
        
        // If safeword is used and no artistocks are selected and download is unchecked, warn the user
        if (safewordUsed && currentTokenAmount === 0 && !updatedToggle.checked) {
            console.warn("No purchase selected");
            
            // Show inline error message
            showErrorMessage("Please select either artistocks or enable the download");
            
            // If no valid selection, force toggle back on
            updatedToggle.checked = true;
            
            // Update pricing again after forcing the toggle
            updateTotalPrice();
            updateBuyButton();
        }
        
        // If safeword is NOT used and download is unchecked, force it back on
        if (!safewordUsed && !updatedToggle.checked) {
            console.warn("Download must be selected when safeword is not used");
            
            // Show inline error message
            showErrorMessage("Download selection is required");
            
            // Force toggle back on
            updatedToggle.checked = true;
            
            // Update pricing again
            updateTotalPrice();
            updateBuyButton();
        }
    });
}

// Function to update total price
function updateTotalPrice() {
    console.log("Updating total price");
    const tokenTotalInput = document.getElementById('tokenTotalInput');
    const contentUnlockToggle = document.getElementById('contentUnlockToggle');
    const buyButton = document.getElementById('buyButton');
    
    if (!tokenTotalInput || !contentUnlockToggle) return;
    
    // Get safeword status
    safewordUsed = localStorage.getItem('safewordUsed') === 'true';
    
    // Calculate Artistocks cost
    const artistData = getCurrentArtistData();
    if (!artistData) {
        console.error("Could not get artist data in updateTotalPrice");
        return;
    }
    
    // Get artistocks amount
    const artistocksTotal = currentTokenAmount * artistData.tokenPrice;
    
    // Add $1 if content unlock is checked
    const unlockCost = contentUnlockToggle.checked ? 1 : 0;
    
    // Calculate total price
    const total = artistocksTotal + unlockCost;
    
    // Update total input with correct price
    if (safewordUsed) {
        // When safeword is used, always show total price (artistocks+download or just artistocks)
        tokenTotalInput.value = total.toFixed(2);
    } else {
        // When safeword is not used, always show $1 if checked, otherwise $0
        tokenTotalInput.value = unlockCost.toFixed(2);
    }
    
    console.log(`Total price calculation: Artistocks: $${artistocksTotal.toFixed(2)}, Download: $${unlockCost.toFixed(2)}, Total: $${total.toFixed(2)}`);
    
    // Check if we have a valid selection
    const hasValidSelection = contentUnlockToggle.checked || (safewordUsed && currentTokenAmount > 0);
    
    // Disable buy button if no valid selection
    if (buyButton) {
        if (!hasValidSelection) {
            buyButton.disabled = true;
            buyButton.style.opacity = '0.5';
            buyButton.style.cursor = 'not-allowed';
        } else {
            buyButton.disabled = false;
            buyButton.style.opacity = '1';
            buyButton.style.cursor = 'pointer';
        }
        
        // Also update the buy button text directly to reflect changes
        if (safewordUsed) {
            // Safeword is used - show full details based on selection
            if (artistocksTotal > 0) {
                if (contentUnlockToggle.checked) {
                    // Both artistocks and download
                    buyButton.textContent = `Get Download + ${new Intl.NumberFormat().format(currentTokenAmount)} Artistocks ($${total.toFixed(2)})`;
                } else {
                    // Just artistocks
                    buyButton.textContent = `Buy ${new Intl.NumberFormat().format(currentTokenAmount)} Artistocks ($${artistocksTotal.toFixed(2)})`;
                }
            } else if (contentUnlockToggle.checked) {
                // Just download
                buyButton.textContent = `Get Download ($${config.defaults.downloadPrice.toFixed(2)})`;
            } else {
                // No valid selection
                buyButton.textContent = 'Select Purchase Options';
            }
        } else {
            // Safeword not used - only show download option
            if (contentUnlockToggle.checked) {
                buyButton.textContent = `Get Download ($${config.defaults.downloadPrice.toFixed(2)})`;
            } else {
                buyButton.textContent = 'Select Purchase Options';
            }
        }
    }
    
    // If purchase headline is visible, update it based on content unlock toggle
    const purchaseHeadline = document.getElementById('purchaseHeadline');
    const purchaseSection = document.getElementById('purchaseSection');
    
    if (purchaseHeadline && purchaseSection && 
        window.getComputedStyle(purchaseSection).display !== 'none') {
        
        if (safewordUsed) {
            // If safeword is used, show price according to selection
            if (contentUnlockToggle.checked) {
                if (artistocksTotal > 0) {
                    // Both Artistocks and download
                    purchaseHeadline.innerHTML = `Complete your purchase of <span id="purchaseAmount">${new Intl.NumberFormat().format(currentTokenAmount)}</span> <span id="artistStockPurchaseName">${artistData.name}</span> Artistocks + <span class="price-highlight-small">$1 Download</span> for <span class="price-highlight-small">$${total.toFixed(2)}</span>`;
                } else {
                    // Just download
                    purchaseHeadline.innerHTML = `Complete your download purchase for <span class="price-highlight-small">$1.00</span>`;
                }
            } else if (artistocksTotal > 0) {
                // Just Artistocks
                purchaseHeadline.innerHTML = `Complete your purchase of <span id="purchaseAmount">${new Intl.NumberFormat().format(currentTokenAmount)}</span> <span id="artistStockPurchaseName">${artistData.name}</span> Artistocks for <span class="price-highlight-small">$${artistocksTotal.toFixed(2)}</span>`;
            } else {
                // No selection
                purchaseHeadline.innerHTML = `Please select either download or artistocks to continue`;
            }
        } else {
            // When safeword is not used, always show $1 for download
            purchaseHeadline.innerHTML = `Complete your download purchase for <span class="price-highlight-small">$1.00</span>`;
        }
        
        // Make sure purchaseAmount and artistStockPurchaseName are updated
        const purchaseAmount = document.getElementById('purchaseAmount');
        const artistStockName = document.getElementById('artistStockPurchaseName');
        
        if (purchaseAmount) {
            purchaseAmount.textContent = new Intl.NumberFormat().format(currentTokenAmount);
        }
        
        if (artistStockName) {
            artistStockName.textContent = artistData.name;
        }
    }
    
    // Update slider minimum if safeword is used
    const slider = document.getElementById('tokenSlider');
    if (slider && safewordUsed) {
        const price = artistData.tokenPrice;
        const minTokens = contentUnlockToggle.checked ? 0 : Math.ceil(1 / price);
        slider.min = minTokens;
        
        // If current value is below new minimum, update it
        if (parseInt(slider.value) < minTokens) {
            slider.value = minTokens;
            updateFromTokenAmount(minTokens);
        }
    }
}

// Set up logout button functionality
function setupLogoutButton() {
    const logoutButton = document.getElementById('logoutButton');
    if (!logoutButton) return;

    // Remove any existing event listeners by cloning and replacing the button
    const newLogoutButton = logoutButton.cloneNode(true);
    logoutButton.parentNode.replaceChild(newLogoutButton, logoutButton);
    
    // Add a single event listener to the new button
    newLogoutButton.addEventListener('click', async () => {
        // Ask for confirmation
        if (!confirm('Are you sure you want to reset data? This will log you out.')) {
            return;
        }
        
        // Change button text to indicate logout in progress
        newLogoutButton.textContent = 'Logging out...';
        newLogoutButton.disabled = true;
        
        // Log out from Magic if it's initialized
        if (magic) {
            try {
                console.log('Attempting to logout from Magic...');
                await magic.user.logout();
                console.log('Successfully logged out from Magic');
            } catch (error) {
                console.error('Error logging out from Magic:', error);
            }
        }
        
        // Clear wallet data if wallet module is available
        if (window.wallet && typeof window.wallet.clear === 'function') {
            window.wallet.clear();
        }
        
        // Remove wallet display if it exists
        const walletDisplay = document.getElementById('walletDisplay');
        if (walletDisplay) {
            walletDisplay.remove();
        }
        
        // Clear all localStorage
        localStorage.removeItem('currentArtist');
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('artistUnlocked');
        localStorage.removeItem('artistocksBalance');
        localStorage.removeItem('safewordUsed');
        localStorage.removeItem('userWalletAddress');
        localStorage.removeItem('userEmail');

        // Reset state variables
        isLoggedIn = false;
        isAuthenticated = false;
        paymentSelected = false;
        currentTokenAmount = 100;
        contentUnlocked = {};
        safewordUsed = false;
        userWalletAddress = null;
        userEmail = null;

        // Reset to default artist
        currentArtist = 'gosheesh';
        document.body.className = 'gosheesh-theme';

        // Update UI elements
        document.getElementById('artistName').textContent = 'GOSHEESH';
        document.getElementById('artistTokenName').textContent = getCurrentArtistData().name;
        document.getElementById('artistNameAccess').textContent = getCurrentArtistData().name;
        document.getElementById('artworkTitle').textContent = getCurrentArtistData().artworkTitle;

        // Reset advanced purchase options
        const advancedOptions = document.getElementById('advancedPurchaseOptions');
        if (advancedOptions) {
            advancedOptions.style.display = 'none';
            advancedOptions.classList.remove('show');
            advancedOptions.style.opacity = '0';
            advancedOptions.style.maxHeight = '0';
        }
        
        // Reset buy button text
        const buyButton = document.getElementById('buyButton');
        if (buyButton) {
            buyButton.textContent = `Get Download ($${config.defaults.downloadPrice})`;
            buyButton.classList.remove('safeword-activated');
        }

        // Hide the login feedback message
        const loginFeedback = document.getElementById('loginFeedback');
        if (loginFeedback) {
            loginFeedback.style.display = 'none';
            loginFeedback.textContent = '';
            loginFeedback.classList.remove('error');
        }

        // Reset video source and state
        const video = document.getElementById('artistVideo');
        const source = document.getElementById('videoSource');
        if (video && source) {
            // Store current mute state
            const isMuted = video.muted;
            
            // Update source
            source.src = `assets/${currentArtist}-video.mp4`;
            
            // Reload video
            video.load();
            
            // When video is ready, show it
            video.oncanplay = () => {
                video.style.opacity = '1';
                showVideoFallback(false);
                video.muted = isMuted;
                
                // If unmuted, make sure audio is playing
                if (!video.muted) {
                    video.play().catch(err => {
                        console.error('Error playing video:', err);
                        // If autoplay with sound fails, mute and try again
                        video.muted = true;
                        video.play().catch(err2 => console.error('Video still cannot play:', err2));
                    });
                }
                
                // Update mute button icons
                const mutedIcon = document.querySelector('.muted-icon');
                const unmutedIcon = document.querySelector('.unmuted-icon');
                const muteToggle = document.getElementById('muteToggle');
                
                if (mutedIcon && unmutedIcon && muteToggle) {
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
            };
            
            // Start playing
            video.play().catch(() => {
                showVideoFallback(true);
            });
        }

        // Show login section
        const loginSection = document.getElementById('loginSection');
        if (loginSection) {
            loginSection.style.display = 'flex';
            loginSection.style.opacity = '1';
        }

        // Always show token preview section
        const tokenSection = document.getElementById('tokenPreviewSection');
        if (tokenSection) {
            tokenSection.style.display = 'block';
            tokenSection.style.opacity = '1';
            tokenSection.style.transform = 'translateY(0)';
        }

        // Hide purchase and success sections
        const purchaseSection = document.getElementById('purchaseSection');
        if (purchaseSection) {
            purchaseSection.style.display = 'none';
            purchaseSection.style.opacity = '0';
        }

        const successSection = document.getElementById('successSection');
        if (successSection) {
            successSection.style.display = 'none';
        }

        // Reset content unlock toggle
        const contentUnlockToggle = document.getElementById('contentUnlockToggle');
        if (contentUnlockToggle) {
            contentUnlockToggle.checked = true; // Set to true by default for download availability
        }

        // Reset token slider
        setupTokenSlider();

        // Reset orbital tokens
        setupOrbitalTokens(currentArtist);
        orbitAnimationRunning = false;
        animateOrbit();

        // Reset angle offset
        orbitAngleOffset = 0;
        localStorage.setItem('orbitAngleOffset', '0');

        // Reset button state
        newLogoutButton.textContent = 'Reset Data';
        newLogoutButton.disabled = false;
        
        // Show logout success toast
        showLogoutSuccessToast();
    });
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
            
            // First update the total price calculation
            updateTotalPrice();
            
            // Then update button text to reflect artistock purchase option is now available
            updateBuyButton();
            
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

// Update buy button text based on current state
function updateBuyButton() {
    const buyButton = document.getElementById('buyButton');
    if (!buyButton) return;
    
    // Get safeword status
    safewordUsed = localStorage.getItem('safewordUsed') === 'true';
    
    // Get content unlock status
    const contentUnlockToggle = document.getElementById('contentUnlockToggle');
    const includesDownload = contentUnlockToggle && contentUnlockToggle.checked;
    
    // Get token amount for price calculation
    const artistData = getCurrentArtistData();
    if (!artistData) {
        console.error("Could not get artist data in updateBuyButton");
        return;
    }
    
    // Calculate artistocks total
    let artistocksTotal = 0;
    if (currentTokenAmount > 0) {
        artistocksTotal = currentTokenAmount * artistData.tokenPrice;
    }
    
    // Calculate total price
    const total = artistocksTotal + (includesDownload ? 1 : 0);
    
    // Check if we have a valid selection
    const hasValidSelection = includesDownload || (safewordUsed && artistocksTotal > 0);
    
    // Disable button if no valid selection is made
    buyButton.disabled = !hasValidSelection;
    
    if (!hasValidSelection) {
        buyButton.style.opacity = '0.5';
        buyButton.style.cursor = 'not-allowed';
        buyButton.textContent = 'Select Purchase Options';
        return;
    } else {
        buyButton.style.opacity = '1';
        buyButton.style.cursor = 'pointer';
    }
    
    // Update button text based on purchase content and safeword status
    if (safewordUsed) {
        // Safeword has been used, show all options
        if (artistocksTotal > 0) {
            if (includesDownload) {
                // Both artistocks and download
                buyButton.textContent = `Get Download + ${new Intl.NumberFormat().format(currentTokenAmount)} Artistocks ($${total.toFixed(2)})`;
            } else {
                // Just artistocks
                buyButton.textContent = `Buy ${new Intl.NumberFormat().format(currentTokenAmount)} Artistocks ($${artistocksTotal.toFixed(2)})`;
            }
        } else if (includesDownload) {
            // Just download
            buyButton.textContent = `Get Download ($${config.defaults.downloadPrice.toFixed(2)})`;
        }
        
        buyButton.classList.add('safeword-activated');
    } else {
        // Safeword has NOT been used, only show download option
        buyButton.textContent = `Get Download ($${config.defaults.downloadPrice.toFixed(2)})`;
        buyButton.classList.remove('safeword-activated');
    }
}

// Update UI elements based on authentication state
function updateUIForAuthState() {
    // Always check authentication from localStorage
    isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
    isLoggedIn = isAuthenticated;
    
    // Check safeword status
    safewordUsed = localStorage.getItem('safewordUsed') === 'true';
    
    // Retrieve wallet address and email if they're in localStorage
    if (isAuthenticated) {
        userWalletAddress = localStorage.getItem('userWalletAddress') || userWalletAddress;
        userEmail = localStorage.getItem('userEmail') || userEmail;
    }
    
    console.log("updateUIForAuthState:", { 
        isAuthenticated, 
        safewordUsed, 
        currentArtist,
        userEmail: userEmail ? userEmail.substring(0, 3) + '...' : null,
        walletAddress: userWalletAddress ? userWalletAddress.substring(0, 6) + '...' : null
    });
    
    // Handle UI visibility based on authentication
    const loginSection = document.getElementById('loginSection');
    const tokenSection = document.getElementById('tokenPreviewSection');
    const advancedOptions = document.getElementById('advancedPurchaseOptions');
    const purchaseSection = document.getElementById('purchaseSection');
    const successSection = document.getElementById('successSection');
    const loginFeedback = document.getElementById('loginFeedback');
    
    // Reset login feedback message
    if (loginFeedback) {
        loginFeedback.style.display = 'none';
        loginFeedback.textContent = '';
        loginFeedback.classList.remove('error');
    }
    
    // MOST IMPORTANT: Always ensure token preview section is visible, 
    // regardless of authentication (so the download button is always available)
    if (tokenSection) {
        console.log("Making token section visible");
        tokenSection.style.display = 'block';
        tokenSection.style.opacity = '1';
        tokenSection.style.transform = 'translateY(0)';
    }
    
    // Clear purchase and success sections when updating UI
    if (purchaseSection) {
        purchaseSection.style.display = 'none';
    }
    
    if (successSection) {
        successSection.style.display = 'none';
    }
    
    // Handle wallet display
    const existingWalletDisplay = document.getElementById('walletDisplay');
    
    if (isAuthenticated && userWalletAddress) {
        // Create or update wallet display
        let walletDisplay = existingWalletDisplay;
        
        if (!walletDisplay) {
            walletDisplay = document.createElement('div');
            walletDisplay.id = 'walletDisplay';
            walletDisplay.className = 'wallet-display';
            
            // Insert wallet display after artist name
            const artistName = document.getElementById('artistName');
            if (artistName && artistName.parentNode) {
                artistName.parentNode.insertBefore(walletDisplay, artistName.nextSibling);
            }
        }
        
        // Show abbreviated wallet address
        const shortAddress = userWalletAddress.substring(0, 6) + '...' + userWalletAddress.substring(userWalletAddress.length - 4);
        walletDisplay.textContent = shortAddress;
        
        // Add tooltip with full address and email
        walletDisplay.title = `${userEmail || 'No email available'}\n${userWalletAddress}`;
    } else if (existingWalletDisplay) {
        // Remove wallet display if user is not authenticated
        existingWalletDisplay.remove();
    }
    
    if (isAuthenticated) {
        console.log("User is authenticated - hiding login section");
        // Hide login for authenticated users
        if (loginSection) {
            loginSection.style.display = 'none';
            loginSection.style.opacity = '0';
        }
        
        // Show advanced options if safeword has been used
        if (advancedOptions) {
            if (safewordUsed) {
                console.log("Showing advanced options (safeword used)");
                advancedOptions.style.display = 'block';
                advancedOptions.classList.add('show');
                advancedOptions.style.opacity = '1';
                advancedOptions.style.maxHeight = '300px';
            } else {
                console.log("Hiding advanced options (safeword not used)");
                advancedOptions.style.display = 'none';
                advancedOptions.classList.remove('show');
                advancedOptions.style.opacity = '0';
                advancedOptions.style.maxHeight = '0';
            }
        }
        
        // Update chat input placeholder
        const chatInput = document.getElementById('chatInput');
        if (chatInput) {
            chatInput.placeholder = safewordUsed ? 
                "Type something" : 
                "Type something";
        }
    } else {
        console.log("User is not authenticated - showing login section");
        // Show login for non-authenticated users
        if (loginSection) {
            loginSection.style.display = 'flex';
            loginSection.style.opacity = '1';
        }
    }
}

// Helper function to set up payment buttons
function setupPaymentButtons() {
    console.log("Setting up payment buttons");
    const paymentButtons = document.querySelectorAll('.payment-btn');
    
    if (paymentButtons.length === 0) {
        console.error("No payment buttons found in the DOM!");
        
        // Try to find the payment section
        const paymentSection = document.querySelector('.payment-section');
        if (paymentSection) {
            console.log("Payment section found, but no buttons. Creating them...");
            
            // Add payment buttons
            const paymentMethods = ['credit', 'paypal', 'venmo', 'crypto'];
            paymentMethods.forEach(method => {
                const btn = document.createElement('button');
                btn.className = `payment-btn ${method}`;
                btn.textContent = method.charAt(0).toUpperCase() + method.slice(1);
                paymentSection.appendChild(btn);
            });
            
            // Now get the buttons again
            const newButtons = document.querySelectorAll('.payment-btn');
            console.log(`Created ${newButtons.length} payment buttons`);
            
            // Add event listeners
            newButtons.forEach(button => {
                const method = button.classList[1]; // Get the payment method from class
                button.addEventListener('click', () => handlePayment(method));
            });
            
            return;
        } else {
            console.error("Payment section not found either! Purchase flow is broken.");
            debugPurchaseFlow();
        }
    }
    
    console.log(`Found ${paymentButtons.length} payment buttons, attaching handlers`);
    
    paymentButtons.forEach(button => {
        // Remove existing event listeners by cloning and replacing
        const newButton = button.cloneNode(true);
        button.parentNode.replaceChild(newButton, button);
        const method = newButton.classList[1]; // Get the payment method from class
        
        if (!method) {
            console.error("Payment button missing method class:", newButton);
        }
        
        newButton.addEventListener('click', () => handlePayment(method));
    });
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
            handleBuyClick();
        });
    }
    
    // Direct event listeners for payment buttons
    document.querySelectorAll('.payment-btn').forEach(button => {
        const method = button.classList[1]; // Get payment method from class
        if (method) {
            console.log(`Adding direct click listener to ${method} payment button`);
            button.addEventListener('click', function(e) {
                console.log(`${method} payment clicked directly`);
                handlePayment(method);
            });
        }
    });
});

// Flash payment button animation
function flashPaymentButton(method) {
    const button = document.querySelector(`.payment-btn.${method}`);
    if (!button) {
        console.error(`Payment button for method ${method} not found!`);
        debugPurchaseFlow();
        return;
    }
    
    button.style.transform = 'scale(1.05)';
    button.style.boxShadow = '0 0 20px rgba(255, 255, 255, 0.5)';
    
    setTimeout(() => {
        button.style.transform = '';
        button.style.boxShadow = '';
    }, 300);
}

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
    }, { passive: false }); // Need passive: false to call preventDefault
    
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