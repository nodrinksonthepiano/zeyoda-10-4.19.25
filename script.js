// Configuration and state management
let config = null;
let currentArtist = localStorage.getItem('currentArtist') || "gosheesh";
let isLoggedIn = false;
let paymentSelected = false;
let orbitAnimationRunning = false;
let currentTokenAmount = 100;
let isAuthenticated = localStorage.getItem('isAuthenticated') === 'true' || false;
let contentUnlocked = {};
let safewordUsed = localStorage.getItem('safewordUsed') === 'true' || false;

// Fetch configuration and initialize the page
document.addEventListener('DOMContentLoaded', async () => {
    // Load configuration
    try {
        const response = await fetch('artists/config.json');
        if (!response.ok) {
            throw new Error(`Failed to load config (${response.status}): ${response.statusText}`);
        }
        config = await response.json();
        
        // Initialize with loaded configuration
        initializeApp();
        
        // Wait a bit to make sure everything is fully initialized
        setTimeout(() => {
            console.log("Running post-initialization checks...");
            
            // Ensure buy button has a click handler
            const buyButton = document.getElementById('buyButton');
            if (buyButton) {
                // Make sure we have the latest event handler
                const newBuyButton = buyButton.cloneNode(true);
                buyButton.parentNode.replaceChild(newBuyButton, buyButton);
                newBuyButton.addEventListener('click', handleBuyClick);
                console.log("Re-attached click handler to buy button after initialization");
            }
            
            // Ensure payment buttons have event handlers
            setupPaymentButtons();
            
            // Debug initial state
            debugPurchaseFlow();
        }, 500); // Wait half a second for everything to settle
        
    } catch (error) {
        console.error('Error loading configuration:', error);
        // Show error message to user
        alert('Failed to load artist configuration. Please try again later.');
    }
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
    
    // Set up content unlock toggle
    setupContentUnlockToggle();
    
    // Set up logout button
    setupLogoutButton();
    
    // Set up chat input listeners
    setupChatInput();
    
    // Set up buy button listener
    const buyButton = document.getElementById('buyButton');
    if (buyButton) {
        // Remove existing listeners by replacing the element
        const newBuyButton = buyButton.cloneNode(true);
        buyButton.parentNode.replaceChild(newBuyButton, buyButton);
        newBuyButton.addEventListener('click', handleBuyClick);
    }
    
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
    
    // Initialize buy button with correct text
    updateBuyButton();
    
    // Set up payment buttons with event handlers
    setupPaymentButtons();
    
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
    const artistocksPrice = (currentTokenAmount * price).toFixed(4);
    
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
        // Add the $1 download price if toggle is checked
        const contentUnlockToggle = document.getElementById('contentUnlockToggle');
        const includeDownload = contentUnlockToggle && contentUnlockToggle.checked;
        const totalPrice = parseFloat(artistocksPrice) + (includeDownload ? 1 : 0);
        tokenTotalInput.value = totalPrice.toFixed(4);
    }
    
    if (purchaseAmount) {
        purchaseAmount.textContent = formattedTokens;
    }
    
    if (purchasedAmount) {
        purchasedAmount.textContent = formattedTokens;
    }
    
    console.log(`Token amount updated: ${formattedTokens} tokens at $${price} = $${artistocksPrice}`);
}

// Update the token price display
function updateArtistTokenPrice() {
    const tokenPriceSpan = document.getElementById('tokenUnitPrice');
    const artistData = getCurrentArtistData();
    if (tokenPriceSpan) {
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
                // Skip current artist
                if (artistId === currentArtist) continue;
                
                // Check if token name matches any artist name or displayName
                const artist = config.artists[artistId];
                if (tokenName === artist.name || tokenName === artist.displayName) {
                    console.log(`Navigating to artist: ${artistId}`);
                    transitionToArtist(artistId);
                    break;
                }
            }
        });
        
        orbitalContainer.appendChild(tokenElement);
    });
    
    // Position the tokens initially
    setTimeout(positionOrbitalTokens, 100); // Small delay to ensure elements are rendered
}

// Animate the orbital tokens
function animateOrbit() {
    // If animation is already running, don't start another instance
    if (orbitAnimationRunning) return;
    
    orbitAnimationRunning = true;
    
    let lastTimestamp = 0;
    const orbitSpeed = 0.004; // Adjusted speed of rotation
    
    function animate(timestamp) {
        // First animation frame doesn't have elapsed time
        if (lastTimestamp === 0) {
            lastTimestamp = timestamp;
            requestAnimationFrame(animate);
            return;
        }
        
        // Calculate time elapsed since last frame
        const elapsed = timestamp - lastTimestamp;
        lastTimestamp = timestamp;
        
        const tokens = document.querySelectorAll('.token');
        
        tokens.forEach(token => {
            // Get the token's base angle and add the rotation
            let angle = parseFloat(token.getAttribute('data-angle') || 0);
            angle += elapsed * orbitSpeed;
            
            // Normalize angle to keep it within 0-360
            if (angle >= 360) angle -= 360;
            token.setAttribute('data-angle', angle);
        });
        
        // Position tokens based on updated angles
        positionOrbitalTokens();
        
        requestAnimationFrame(animate);
    }
    
    // Start the animation
    requestAnimationFrame(animate);
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
        // Get angle in radians
        const angle = parseFloat(token.getAttribute('data-angle') || 0) * (Math.PI / 180);
        
        // Calculate position
        const x = Math.cos(angle) * orbitRadius;
        const y = Math.sin(angle) * orbitRadius;
        
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
function handleEmailLogin() {
    const email = document.getElementById('emailInput').value;
    
    // Very basic email validation
    if (email && email.includes('@') && email.includes('.')) {
        console.log(`Login with email: ${email}`);
        completeLogin('email');
    } else {
        // Show validation error with enhanced shake animation
        const emailInput = document.getElementById('emailInput');
        
        // Add red border
        emailInput.style.borderColor = 'red';
        
        // Apply shake animation
        emailInput.style.animation = 'shake 0.5s';
        
        // Clear styles after animation completes
        setTimeout(() => {
            emailInput.style.borderColor = '';
            emailInput.style.animation = '';
            
            // Focus input to encourage correction
            emailInput.focus();
        }, 500);
    }
}

// Handle social login selection
function handleLogin(method) {
    console.log(`Login selected: ${method}`);
    
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
    
    // Auto-focus on chat input after login completes
    setTimeout(() => {
        const chatInput = document.getElementById('chatInput');
        if (chatInput) {
            chatInput.focus();
            // Update placeholder to be more subtle
            chatInput.placeholder = "Type something here...";
        }
    }, 800);
    
    // Log the login method for analytics (in a real app)
    console.log(`User logged in via ${method}`);
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
        chatInput.placeholder = isAuthenticated ? 
            "Type something here..." : 
            "Type 'artistock' to unlock advanced options...";
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
    
    // Set up buy button event handler
    const buyButton = document.getElementById('buyButton');
    if (buyButton) {
        // Direct approach: Remove all existing listeners
        const newBuyButton = buyButton.cloneNode(true);
        buyButton.parentNode.replaceChild(newBuyButton, buyButton);
        
        // Add click listener directly
        newBuyButton.addEventListener('click', handleBuyClick);
        console.log("Re-attached click handler to buy button");
        
        // Update buy button text
        if (safewordUsed) {
            newBuyButton.textContent = `Get Download ($${config.defaults.downloadPrice}) or Buy Artistocks`;
            newBuyButton.classList.add('safeword-activated');
        } else {
            newBuyButton.textContent = `Get Download ($${config.defaults.downloadPrice})`;
            newBuyButton.classList.remove('safeword-activated');
        }
    }
    
    // Update orbital tokens
    setupOrbitalTokens(currentArtist);
    
    // Update the explore button
    updateExploreButton();
    
    // Reset animation flag to ensure animation restarts with new tokens
    orbitAnimationRunning = false;
    animateOrbit();
    
    // Position tokens correctly after transition
    setTimeout(positionOrbitalTokens, 200);
    
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
    const downloadButton = document.getElementById('downloadVideo');
    const mutedIcon = document.querySelector('.muted-icon');
    const unmutedIcon = document.querySelector('.unmuted-icon');
    
    if (!video || !muteToggle || !fullscreenToggle || !downloadButton) return;
    
    // Mute toggle functionality
    muteToggle.addEventListener('click', () => {
        // Toggle muted state
        video.muted = !video.muted;
        
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
    
    // Download button functionality
    downloadButton.addEventListener('click', () => {
        const videoUrl = video.querySelector('source').src;
        const link = document.createElement('a');
        link.href = videoUrl;
        link.download = `${currentArtist}-artwork.mp4`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
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
    console.log("Buy button clicked - Current artist:", currentArtist); // Enhanced debugging
    
    // Always check authentication from localStorage
    isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
    isLoggedIn = isAuthenticated;
    
    console.log("Authentication state:", isAuthenticated); // Enhanced debugging
    
    if (!isAuthenticated) {
        // Shake the login section to indicate authentication required
        const loginSection = document.getElementById('loginSection');
        if (loginSection) {
            console.log("Not authenticated, showing login"); // Debugging
            // Make sure login section is visible first
            loginSection.style.display = 'flex';
            loginSection.style.opacity = '1';
            
            // Apply shake animation to the entire login section
            loginSection.style.animation = 'shake 0.5s';
            setTimeout(() => {
                loginSection.style.animation = '';
            }, 500);
            
            // Scroll to login section
            loginSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        
        return; // Exit function - don't proceed with purchase
    }
    
    console.log("Authenticated, proceeding with purchase flow"); // Debugging
    
    // SIMPLIFIED DIRECT APPROACH - Don't rely on existing elements
    // Force-create the purchase section if it doesn't exist
    ensurePurchaseSectionExists();
    
    // Get the purchase section directly
    const purchaseSection = document.getElementById('purchaseSection');
    if (!purchaseSection) {
        console.error("Purchase section still not found after trying to create it!");
        return;
    }
    
    // UPDATE UI DIRECTLY
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
    
    // Get safeword status
    safewordUsed = localStorage.getItem('safewordUsed') === 'true';
    
    // Check if advanced purchase options are visible and have a value
    let artistocksTotal = 0;
    const contentUnlockToggle = document.getElementById('contentUnlockToggle');
    const unlockCost = contentUnlockToggle && contentUnlockToggle.checked ? 1 : 0;
    
    if (safewordUsed) {
        // Get token slider value if it exists
        const slider = document.getElementById('tokenSlider');
        const tokenAmountInput = document.getElementById('tokenAmountInput');
        
        // If we have a slider and artistocks amount, calculate that total
        if (slider && tokenAmountInput) {
            let tokenAmount = 0;
            
            // Try to get token amount from input first
            if (tokenAmountInput.value) {
                // Remove commas from formatted number
                tokenAmount = parseInt(tokenAmountInput.value.replace(/,/g, ''));
            }
            
            // Fallback to slider value
            if (isNaN(tokenAmount) || tokenAmount <= 0) {
                tokenAmount = parseInt(slider.value);
            }
            
            // Update current token amount
            currentTokenAmount = tokenAmount;
            
            // Calculate artistocks cost
            artistocksTotal = tokenAmount * artistData.tokenPrice;
            console.log(`Artistocks: ${tokenAmount} at ${artistData.tokenPrice} = $${artistocksTotal.toFixed(2)}`);
        }
    }
    
    // Calculate total price (artistocks + $1 download)
    const totalPrice = artistocksTotal + unlockCost;
    console.log(`Total price: $${totalPrice.toFixed(2)} (Artistocks: $${artistocksTotal.toFixed(2)}, Download: $${unlockCost})`);
    
    // Explicitly update purchase headline
    const purchaseHeadline = document.getElementById('purchaseHeadline');
    if (purchaseHeadline) {
        if (safewordUsed && artistocksTotal > 0) {
            // Both artistocks and download
            purchaseHeadline.innerHTML = `Complete your purchase of <span id="purchaseAmount">${new Intl.NumberFormat().format(currentTokenAmount)}</span> <span id="artistStockPurchaseName">${artistData.name}</span> Artistocks + <span class="price-highlight-small">$1 Download</span> for <span class="price-highlight-small">$${totalPrice.toFixed(2)}</span>`;
        } else {
            // Just download
            purchaseHeadline.innerHTML = `Complete your download purchase for <span class="price-highlight-small">$1</span>`;
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
    
    // Always checked by default to ensure download is available
    toggle.checked = true;
    
    // Load artist-specific saved state if available
    if (contentUnlocked[currentArtist]) {
        toggle.checked = true;
    }
    
    // Listen for changes to update total price
    toggle.addEventListener('change', () => {
        // Update the total price calculation
        updateTotalPrice();
        
        // Also update buy button text to reflect the change
        updateBuyButton();
        
        console.log(`Content unlock toggle changed to: ${toggle.checked ? 'checked' : 'unchecked'}`);
    });
}

// Function to update total price
function updateTotalPrice() {
    console.log("Updating total price");
    const tokenTotalInput = document.getElementById('tokenTotalInput');
    const contentUnlockToggle = document.getElementById('contentUnlockToggle');
    
    if (!tokenTotalInput || !contentUnlockToggle) return;
    
    // Calculate Artistocks cost
    const artistData = getCurrentArtistData();
    if (!artistData) {
        console.error("Could not get artist data in updateTotalPrice");
        return;
    }
    
    const artistocksTotal = currentTokenAmount * artistData.tokenPrice;
    
    // Add $1 if content unlock is checked
    const unlockCost = contentUnlockToggle.checked ? 1 : 0;
    
    // Calculate total
    const total = artistocksTotal + unlockCost;
    
    // Update total input
    tokenTotalInput.value = total.toFixed(4);
    console.log(`Total updated: $${total.toFixed(2)} (Artistocks: $${artistocksTotal.toFixed(2)}, Download: $${unlockCost})`);
    
    // If purchase headline is visible, update it based on content unlock toggle
    const purchaseHeadline = document.getElementById('purchaseHeadline');
    const purchaseSection = document.getElementById('purchaseSection');
    
    if (purchaseHeadline && purchaseSection && 
        window.getComputedStyle(purchaseSection).display !== 'none' && 
        safewordUsed) {
        
        if (contentUnlockToggle.checked) {
            if (artistocksTotal > 0) {
                // Show both Artistocks and download
                purchaseHeadline.innerHTML = `Complete your purchase of <span id="purchaseAmount">${new Intl.NumberFormat().format(currentTokenAmount)}</span> <span id="artistStockPurchaseName">${artistData.name}</span> Artistocks + <span class="price-highlight-small">$1 Download</span> for <span class="price-highlight-small">$${total.toFixed(2)}</span>`;
            } else {
                // Just download
                purchaseHeadline.innerHTML = `Complete your download purchase for <span class="price-highlight-small">$1</span>`;
            }
        } else if (artistocksTotal > 0) {
            // Show only Artistocks
            purchaseHeadline.innerHTML = `Complete your purchase of <span id="purchaseAmount">${new Intl.NumberFormat().format(currentTokenAmount)}</span> <span id="artistStockPurchaseName">${artistData.name}</span> Artistocks for <span class="price-highlight-small">$${total.toFixed(2)}</span>`;
        } else {
            // No artistocks or download (shouldn't happen)
            purchaseHeadline.innerHTML = `Complete your purchase`;
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
    
    // Update buy button text to reflect the total
    updateBuyButton();
    
    // Update slider minimum if content is unlocked
    const slider = document.getElementById('tokenSlider');
    if (slider) {
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

    logoutButton.addEventListener('click', () => {
        // Clear all localStorage
        localStorage.removeItem('currentArtist');
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('artistUnlocked');
        localStorage.removeItem('artistocksBalance');
        localStorage.removeItem('safewordUsed');

        // Reset state variables
        isLoggedIn = false;
        isAuthenticated = false;
        paymentSelected = false;
        currentTokenAmount = 100;
        contentUnlocked = {};
        safewordUsed = false;

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

        // Show confirmation
        alert('All data has been reset!');
    });
}

// Set up chat input to show advanced purchase options when "artistock" is typed
function setupChatInput() {
    const chatInput = document.getElementById('chatInput');
    if (!chatInput) return;
    
    // Get safeword status from localStorage
    safewordUsed = localStorage.getItem('safewordUsed') === 'true';
    
    // If safeword was previously activated, show advanced options
    if (safewordUsed) {
        // Show advanced options only, without affecting purchase functionality
        const advancedOptions = document.getElementById('advancedPurchaseOptions');
        if (advancedOptions) {
            advancedOptions.style.display = 'block';
            advancedOptions.classList.add('show');
            advancedOptions.style.opacity = '1';
            advancedOptions.style.maxHeight = '300px';
        }
        
        // Update the buy button text
        updateBuyButton();
        
        // Update chat input placeholder
        chatInput.placeholder = "Type something here...";
    }
    
    chatInput.addEventListener('input', function() {
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
            
            // Update button text to reflect artistock purchase option is now available
            updateBuyButton();
            
            // Update placeholder text
            this.placeholder = "Type something here...";
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
    
    // Calculate total
    const total = artistocksTotal + (includesDownload ? 1 : 0);
    
    // Update button text based on purchase content
    if (safewordUsed) {
        if (artistocksTotal > 0) {
            if (includesDownload) {
                // Both artistocks and download
                buyButton.textContent = `Get Download + ${new Intl.NumberFormat().format(currentTokenAmount)} Artistocks ($${total.toFixed(2)})`;
            } else {
                // Just artistocks
                buyButton.textContent = `Buy ${new Intl.NumberFormat().format(currentTokenAmount)} Artistocks ($${total.toFixed(2)})`;
            }
        } else if (includesDownload) {
            // Just download
            buyButton.textContent = `Get Download ($${config.defaults.downloadPrice})`;
        } else {
            // No selection (rare case)
            buyButton.textContent = `Select Purchase Options`;
        }
        buyButton.classList.add('safeword-activated');
    } else {
        // Standard download button when safeword is not used
        buyButton.textContent = `Get Download ($${config.defaults.downloadPrice})`;
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
    
    console.log("updateUIForAuthState:", { 
        isAuthenticated, 
        safewordUsed, 
        currentArtist 
    });
    
    // Handle UI visibility based on authentication
    const loginSection = document.getElementById('loginSection');
    const tokenSection = document.getElementById('tokenPreviewSection');
    const advancedOptions = document.getElementById('advancedPurchaseOptions');
    const purchaseSection = document.getElementById('purchaseSection');
    const successSection = document.getElementById('successSection');
    
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
    
    // Always update buy button text based on current safeword state
    updateBuyButton();
    
    // Ensure content unlock toggle is checked by default for the $1 download
    const contentUnlockToggle = document.getElementById('contentUnlockToggle');
    if (contentUnlockToggle) {
        contentUnlockToggle.checked = true;
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
                "Type something here..." : 
                "Type 'artistock' to unlock advanced options...";
        }
        
        // Ensure the buy button has its event handler
        const buyButton = document.getElementById('buyButton');
        if (buyButton) {
            // Remove existing event listeners by cloning and replacing
            const newBuyButton = buyButton.cloneNode(true);
            buyButton.parentNode.replaceChild(newBuyButton, buyButton);
            newBuyButton.addEventListener('click', handleBuyClick);
        }
    } else {
        console.log("User is not authenticated - showing login section");
        // Show login for non-authenticated users
        if (loginSection) {
            loginSection.style.display = 'flex';
            loginSection.style.opacity = '1';
        }
        
        // Always hide advanced options for non-authenticated users
        if (advancedOptions) {
            advancedOptions.style.display = 'none';
            advancedOptions.classList.remove('show');
            advancedOptions.style.opacity = '0';
            advancedOptions.style.maxHeight = '0';
        }
        
        // Reset email input for non-authenticated users
        if (document.getElementById('emailInput')) {
            document.getElementById('emailInput').value = '';
        }
        
        // Update chat input placeholder
        const chatInput = document.getElementById('chatInput');
        if (chatInput) {
            chatInput.placeholder = "Type 'artistock' to unlock advanced options...";
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