// Token data for both artists
const tokenData = {
    gosheesh: [
        { name: "LONIARI", angle: 0 },
        { name: "ANBRI SPPIR", angle: 72 },
        { name: "IJA TEA", angle: 144 },
        { name: "NYTO SAREGL", angle: 216 },
        { name: "LUMLITANIDE\nSTRIPIS", angle: 288 }
    ],
    jaitea: [
        { name: "LONIARI", angle: 0 },
        { name: "ANBRI SPPIR", angle: 72 },
        { name: "SHEEGOHS", angle: 144 },
        { name: "NYTO SAREGL", angle: 216 },
        { name: "LUMLITANIDE\nSTRIPIS", angle: 288 }
    ]
};

// Artist specific data
const artistData = {
    gosheesh: {
        tokenPrice: 0.0005, // $0.0005 per Artistock
        name: "SHEEGOHS",
        artworkTitle: "NLi10 #1"
    },
    jaitea: {
        tokenPrice: 0.0004, // $0.0004 per Artistock
        name: "IJA TEA",
        artworkTitle: "Earth #2"
    }
};

// Current artist state
let currentArtist = localStorage.getItem('currentArtist') || "gosheesh";
let isLoggedIn = false;
let paymentSelected = false;
let orbitAnimationRunning = false;
let currentTokenAmount = 100;
let isAuthenticated = localStorage.getItem('isAuthenticated') === 'true' || false; // Global authentication state that persists between artists
let contentUnlocked = {}; // Track which artists' content has been unlocked
let safewordUsed = localStorage.getItem('safewordUsed') === 'true' || false; // Track if safeword has been used in this session

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
    // Set initial theme based on stored artist
    document.body.className = `${currentArtist}-theme`;
    
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
        buyButton.addEventListener('click', handleBuyClick);
        // Update button text based on safeword state
        if (safewordUsed) {
            buyButton.textContent = 'Buy Artistocks';
            buyButton.classList.add('safeword-activated');
        } else {
            buyButton.textContent = 'Get Download ($1)';
            buyButton.classList.remove('safeword-activated');
        }
    }
    
    // Set up explore button (important for switching between artists)
    updateExploreButton();
    
    // Check localStorage for previous unlocks and balances
    const storedUnlocks = localStorage.getItem('artistUnlocked');
    if (storedUnlocks) {
        contentUnlocked = JSON.parse(storedUnlocks);
        const toggle = document.getElementById('contentUnlockToggle');
        if (toggle) {
            toggle.checked = contentUnlocked[currentArtist] || false;
        }
    }
    
    const storedBalance = localStorage.getItem('artistocksBalance');
    if (storedBalance) {
        currentTokenAmount = parseInt(storedBalance);
        updateFromTokenAmount(currentTokenAmount);
    }

    // Always show token preview section with $1 download button
    const tokenSection = document.getElementById('tokenPreviewSection');
    if (tokenSection) {
        tokenSection.style.display = 'block';
        tokenSection.style.opacity = '1';
        tokenSection.style.transform = 'translateY(0)';
    }
    
    // Show appropriate sections based on authentication state
    if (isAuthenticated) {
        // For authenticated users, hide login
        const loginSection = document.getElementById('loginSection');
        if (loginSection) loginSection.style.display = 'none';
        
        // Show/hide advanced purchase options based on safeword state
        const advancedOptions = document.getElementById('advancedPurchaseOptions');
        if (advancedOptions) {
            if (safewordUsed) {
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
    } else {
        // For non-authenticated users, ensure login section is visible
        const loginSection = document.getElementById('loginSection');
        if (loginSection) {
            loginSection.style.display = 'flex';
            loginSection.style.opacity = '1';
        }
    }

    // Always hide success and purchase sections on initial load
    const successSection = document.getElementById('successSection');
    if (successSection) {
        successSection.style.display = 'none';
    }
    
    const purchaseSection = document.getElementById('purchaseSection');
    if (purchaseSection) {
        purchaseSection.style.display = 'none';
    }
    
    // Update artist name and related elements
    document.getElementById('artistName').textContent = currentArtist.toUpperCase();
    document.getElementById('artistTokenName').textContent = artistData[currentArtist].name;
    document.getElementById('artistNameAccess').textContent = artistData[currentArtist].name;
    document.getElementById('artworkTitle').textContent = artistData[currentArtist].artworkTitle;
});

// Set up token slider functionality
function setupTokenSlider() {
    const slider = document.getElementById('tokenSlider');
    const tokenAmountInput = document.getElementById('tokenAmountInput');
    const tokenTotalInput = document.getElementById('tokenTotalInput');
    
    if (!slider) return;
    
    // Calculate price and limits
    const price = artistData[currentArtist].tokenPrice;
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
    });
    
    // Update when token amount input changes
    tokenAmountInput.addEventListener('input', function() {
        // Remove non-numeric characters
        this.value = this.value.replace(/[^0-9]/g, '');
        
        if (this.value === '' || parseInt(this.value) < minTokens) {
            this.value = minTokens.toString();
        }
        
        // Make sure it's within token limits
        const tokens = Math.min(Math.max(parseInt(this.value), minTokens), maxTokens);
        this.value = tokens;
        
        // Update other elements
        updateFromTokenAmount(tokens);
    });
    
    // Update when total amount input changes
    tokenTotalInput.addEventListener('input', function() {
        // Allow numbers and decimal point
        this.value = this.value.replace(/[^0-9.]/g, '');
        
        // Only allow one decimal point
        const decimalCount = (this.value.match(/\./g) || []).length;
        if (decimalCount > 1) {
            this.value = this.value.substring(0, this.value.lastIndexOf('.'));
        }
        
        if (this.value === '' || parseFloat(this.value) < minDollarAmount) {
            this.value = minDollarAmount.toFixed(2);
        }
        
        // Make sure it's within dollar limits
        const total = Math.min(Math.max(parseFloat(this.value), minDollarAmount), maxDollarAmount);
        
        // Calculate tokens from total
        const tokens = Math.ceil(total / price);
        
        // Update other elements
        updateFromTokenAmount(tokens);
    });
    
    // Function to update all elements from token amount
    function updateFromTokenAmount(tokens) {
        const slider = document.getElementById('tokenSlider');
        const tokenAmountInput = document.getElementById('tokenAmountInput');
        const tokenTotalInput = document.getElementById('tokenTotalInput');
        
        if (!slider || !tokenAmountInput || !tokenTotalInput) return;
        
        // Calculate price and limits
        const price = artistData[currentArtist].tokenPrice;
        const maxDollarAmount = 10000;
        const minDollarAmount = 0;
        
        // Calculate token limits based on dollar amounts
        const maxTokens = Math.floor(maxDollarAmount / price);
        const minTokens = Math.ceil(minDollarAmount / price);
        
        // Ensure tokens is a number and within range
        tokens = Math.max(minTokens, Math.min(parseInt(tokens), maxTokens));
        
        // Update slider
        slider.value = tokens;
        
        // Update currentTokenAmount global variable
        currentTokenAmount = tokens;
        
        // Update token amount input
        tokenAmountInput.value = tokens;
        
        // Update total price
        updateTotalPrice();

        // Update purchase headline with formatted token amount
        const purchaseAmount = document.getElementById('purchaseAmount');
        if (purchaseAmount) {
            purchaseAmount.textContent = new Intl.NumberFormat().format(tokens);
        }
    }
}

// Update artist token price in UI
function updateArtistTokenPrice() {
    const tokenUnitPrice = document.querySelectorAll('#tokenUnitPrice');
    const artistTokenName = document.getElementById('artistTokenName');
    const artistNameAccess = document.getElementById('artistNameAccess');
    const artistStockPurchaseName = document.getElementById('artistStockPurchaseName');
    
    const price = artistData[currentArtist].tokenPrice;
    
    // Update all instances of the token price
    tokenUnitPrice.forEach(el => {
        if (el) el.textContent = price.toFixed(4);
    });
    
    if (artistTokenName) {
        artistTokenName.textContent = artistData[currentArtist].name;
    }
    
    if (artistNameAccess) {
        artistNameAccess.textContent = artistData[currentArtist].name;
    }
    
    if (artistStockPurchaseName) {
        artistStockPurchaseName.textContent = artistData[currentArtist].name;
    }
    
    // Recalculate token limits for slider
    if (document.getElementById('tokenSlider')) {
        const slider = document.getElementById('tokenSlider');
        const maxDollarAmount = 10000;
        const minDollarAmount = 0;
        
        // Calculate token limits based on dollar amounts
        const maxTokens = Math.floor(maxDollarAmount / price);
        const minTokens = Math.ceil(minDollarAmount / price);
        
        // Set min and max attributes
        slider.min = minTokens;
        slider.max = maxTokens;
        
        // Reset to a default value (1% of max or minimum, whichever is greater)
        const defaultTokens = Math.max(minTokens, Math.floor(maxTokens * 0.01));
        
        // Update all fields with the new default value
        updateTokenValues(defaultTokens);
    }
}

// Helper function for updating token values (reused in updateArtistTokenPrice)
function updateTokenValues(value) {
    const tokenAmountInput = document.getElementById('tokenAmountInput');
    const tokenTotalInput = document.getElementById('tokenTotalInput');
    const slider = document.getElementById('tokenSlider');
    
    if (!tokenAmountInput || !tokenTotalInput) return;
    
    // Calculate price and limits
    const price = artistData[currentArtist].tokenPrice;
    const minTokens = Math.ceil(0 / price); // $0 minimum
    
    // Ensure value is within range
    value = Math.max(minTokens, parseInt(value));
    
    // Update slider
    if (slider) slider.value = value;
    
    // Update currentTokenAmount global variable
    currentTokenAmount = value;
    
    // Update token amount input
    tokenAmountInput.value = value;
    
    // Calculate total cost
    const totalCost = (value * price).toFixed(4);
    
    // Update total input
    tokenTotalInput.value = totalCost;
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
    const orbitalTokensContainer = document.getElementById('orbitalTokens');
    orbitalTokensContainer.innerHTML = '';
    
    tokenData[artist].forEach((token, index) => {
        const tokenElement = document.createElement('div');
        tokenElement.classList.add('token');
        tokenElement.setAttribute('data-index', index);
        tokenElement.setAttribute('data-angle', token.angle);
        tokenElement.setAttribute('data-artist', token.name.replace('\n', ' '));
        tokenElement.innerHTML = token.name;
        
        // Make tokens clickable
        tokenElement.addEventListener('click', function() {
            const tokenArtist = this.getAttribute('data-artist');
            
            // Handle navigation based on token name
            if (tokenArtist === 'IJA TEA' && currentArtist.toLowerCase() === 'gosheesh') {
                // Navigate to JAI TEA page
                transitionToArtist('jaitea');
            } else if (tokenArtist === 'SHEEGOHS' && currentArtist.toLowerCase() === 'jaitea') {
                // Navigate to GOSHEESH page
                transitionToArtist('gosheesh');
            }
            // Add more cases for other artists when they have pages
        });
        
        orbitalTokensContainer.appendChild(tokenElement);
    });
}

// Animate the orbital tokens
function animateOrbit() {
    // If animation is already running, don't start another instance
    if (orbitAnimationRunning) return;
    
    orbitAnimationRunning = true;
    
    const tokens = document.querySelectorAll('.token');
    const container = document.querySelector('.video-container');
    const video = document.getElementById('artistVideo');
    
    // Animation properties
    // Use video dimensions to calculate orbit radius
    const videoWidth = video.offsetWidth;
    const videoHeight = video.offsetHeight;
    
    // Match the orbital radius to the orbit-glow element 
    // Using the video width to create a perfect circle - increased for longer artist names
    const orbitRadius = videoWidth * 0.75; // Increased from 0.7 to 0.75
    
    const orbitSpeed = 0.004; // Adjusted speed of rotation
    
    let lastTimestamp = 0;
    
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
        
        tokens.forEach(token => {
            // Get the token's base angle and add the rotation
            let angle = parseFloat(token.getAttribute('data-angle'));
            angle += elapsed * orbitSpeed;
            
            // Normalize angle to keep it within 0-360
            if (angle >= 360) angle -= 360;
            token.setAttribute('data-angle', angle);
            
            // Convert angle to radians
            const radians = angle * (Math.PI / 180);
            
            // Calculate x and y position using sine and cosine
            const x = Math.cos(radians) * orbitRadius;
            const y = Math.sin(radians) * orbitRadius;
            
            // Calculate center of container for positioning
            const centerX = container.offsetWidth / 2;
            const centerY = container.offsetHeight / 2;
            
            // Position token
            token.style.left = `${centerX + x - token.offsetWidth / 2}px`;
            token.style.top = `${centerY + y - token.offsetHeight / 2}px`;
            
            // Handle z-index based on position
            // Higher z-index when in front (top half), lower when behind (bottom half)
            // This creates a visual effect of tokens going behind the video
            if (y < 0) {
                // Token is in the top half of the orbit, in front
                token.style.zIndex = "4";
            } else {
                // Token is in the bottom half of the orbit, behind
                token.style.zIndex = "1";
            }
        });
        
        requestAnimationFrame(animate);
    }
    
    // Start the animation
    requestAnimationFrame(animate);
}

// Handle email login form
function handleEmailLogin() {
    const email = document.getElementById('emailInput').value;
    
    // Very basic email validation
    if (email && email.includes('@') && email.includes('.')) {
        console.log(`Login with email: ${email}`);
        completeLogin('email');
    } else {
        // Show validation error
        const emailInput = document.getElementById('emailInput');
        emailInput.style.borderColor = 'red';
        emailInput.style.animation = 'shake 0.5s';
        
        setTimeout(() => {
            emailInput.style.borderColor = '';
            emailInput.style.animation = '';
        }, 1000);
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
    // Set authentication state
    isAuthenticated = true;
    localStorage.setItem('isAuthenticated', 'true');

    // Hide login section
    const loginSection = document.getElementById('loginSection');
    if (loginSection) {
        loginSection.style.opacity = '0';
        setTimeout(() => {
            loginSection.style.display = 'none';
        }, 300);
    }
    
    // Show token preview section
    const tokenSection = document.getElementById('tokenPreviewSection');
    if (tokenSection) {
        tokenSection.style.display = 'block';
        // Animation delay
        setTimeout(() => {
            tokenSection.style.opacity = '1';
            tokenSection.style.transform = 'translateY(0)';
        }, 100);
    }
    
    // Check if safeword was already entered
    const safewordActive = window.safewordActivated ? window.safewordActivated() : false;
    const buyButton = document.getElementById('buyButton');
    
    // Check if advanced options should be shown (if safeword was already entered)
    const chatInput = document.getElementById('chatInput');
    if (chatInput && chatInput.value) {
        const inputText = chatInput.value.toLowerCase();
        const keywordMatches = [
            'artistock', 'artist stock', 'art stock', 'artisstok', 
            'art istok', 'artstock', 'art ist ock', 'artis tok'
        ];
        
        const foundMatch = keywordMatches.some(keyword => inputText.includes(keyword));
        
        if (foundMatch) {
            const advancedOptions = document.getElementById('advancedPurchaseOptions');
            if (advancedOptions) {
                // Update button text to reflect advanced capabilities
                if (buyButton) {
                    buyButton.textContent = 'Buy Artistocks';
                    buyButton.classList.add('safeword-activated');
                }
                
                // Show after a delay for better UX
                setTimeout(() => {
                    advancedOptions.style.display = 'block';
                    advancedOptions.classList.add('show');
                    advancedOptions.style.opacity = '1';
                    advancedOptions.style.maxHeight = '300px';
                }, 500);
            }
        }
    } else if (safewordActive && buyButton) {
        // If safeword was previously found but chat input is cleared, still show right button text
        buyButton.textContent = 'Buy Artistocks';
        buyButton.classList.add('safeword-activated');
    }
    
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
    console.log(`Payment selected: ${method}`);
    paymentSelected = true;
    
    // Flash the selected payment button
    flashPaymentButton(method);
    
    // Complete the payment process
    setTimeout(() => {
        unlockArtistock();
    }, 800);
}

// Flash payment button animation
function flashPaymentButton(method) {
    const button = document.querySelector(`.payment-btn.${method}`);
    if (!button) return;
    
    button.style.transform = 'scale(1.05)';
    button.style.boxShadow = '0 0 20px rgba(255, 255, 255, 0.5)';
    
    setTimeout(() => {
        button.style.transform = '';
        button.style.boxShadow = '';
    }, 300);
}

// Unlock Artistock
function unlockArtistock() {
    console.log(`Unlocking ${currentTokenAmount} ${currentArtist} Artistock tokens`);
    
    // Hide purchase section
    const purchaseSection = document.querySelector('.purchase-section');
    if (purchaseSection) {
        purchaseSection.style.display = 'none';
    }
    
    // Get content unlock status
    const contentUnlockToggle = document.getElementById('contentUnlockToggle');
    const hasUnlockedContent = contentUnlockToggle && contentUnlockToggle.checked;
    
    // Mark content as unlocked for this artist
    contentUnlocked[currentArtist] = true;
    
    // Store in localStorage
    localStorage.setItem('artistUnlocked', JSON.stringify(contentUnlocked));
    
    // Hide token section
    const tokenSection = document.getElementById('tokenPreviewSection');
    if (tokenSection) {
        tokenSection.style.display = 'none';
    }
    
    // Update purchase amount with formatted number
    const purchasedAmount = document.getElementById('purchasedAmount');
    if (purchasedAmount) {
        if (!safewordUsed) {
            // For non-safeword users, just use the minimum token amount for display
            const price = artistData[currentArtist].tokenPrice;
            const minTokenAmount = Math.ceil(1 / price);
            purchasedAmount.textContent = new Intl.NumberFormat().format(minTokenAmount);
        } else {
            purchasedAmount.textContent = new Intl.NumberFormat().format(currentTokenAmount);
        }
    }
    
    // Show success section
    const successSection = document.getElementById('successSection');
    if (successSection) {
        successSection.style.display = 'block';
    }
    
    // Update artist stock name
    const artistStockName = document.getElementById('artistStockName');
    if (artistStockName) {
        artistStockName.textContent = artistData[currentArtist].name;
    }
    
    // Update success message based on purchase type
    const successMessage = document.querySelector('.success-section p');
    const successTitle = document.querySelector('.success-section h3');
    
    if (!safewordUsed) {
        // Download-only purchase for $1
        // Update success title and message
        if (successTitle) {
            successTitle.textContent = "You've unlocked this download!";
        }
        
        // Generate simulated IPFS link
        const ipfsHash = generateIPFSHash();
        if (successMessage) {
            successMessage.innerHTML = `Your purchase gives you permanent access to this content.<br><br>🎵 <a href="#" onclick="alert('Downloading content...')" class="download-link">Download your content (IPFS: ${ipfsHash})</a>`;
        }
    } else {
        // Full Artistocks + optional download purchase
        if (hasUnlockedContent) {
            // Store in localStorage
            localStorage.setItem('artistocksBalance', currentTokenAmount);
            
            // Generate simulated IPFS link
            const ipfsHash = generateIPFSHash();
            
            // Update success title to reflect both purchase types
            if (successTitle) {
                successTitle.innerHTML = `You now own <span id="purchasedAmount">${new Intl.NumberFormat().format(currentTokenAmount)}</span> <span id="artistStockName">${artistData[currentArtist].name}</span> Artistocks + Download!`;
            }
            
            if (successMessage) {
                successMessage.innerHTML = `You've unlocked the download and received ${new Intl.NumberFormat().format(currentTokenAmount)} Artistocks. Welcome to the orbit!<br><br>🎵 <a href="#" onclick="alert('Downloading content...')" class="download-link">Download your content (IPFS: ${ipfsHash})</a>`;
            }
        } else {
            // Artistocks only
            localStorage.setItem('artistocksBalance', currentTokenAmount);
            
            // Update success title for Artistocks only
            if (successTitle) {
                successTitle.innerHTML = `You now own <span id="purchasedAmount">${new Intl.NumberFormat().format(currentTokenAmount)}</span> <span id="artistStockName">${artistData[currentArtist].name}</span> Artistocks`;
            }
            
            if (successMessage) {
                successMessage.textContent = `You've received ${new Intl.NumberFormat().format(currentTokenAmount)} Artistocks. Welcome to the orbit!`;
            }
        }
    }
    
    // Make sure the explore button is visible and properly set up
    const exploreBtn = document.querySelector('.explore-btn');
    if (exploreBtn) {
        exploreBtn.style.display = 'block';
        exploreBtn.style.opacity = '1';
        updateExploreButton();
    }
    
    // Ensure we maintain authenticated state
    isAuthenticated = true;
    localStorage.setItem('isAuthenticated', 'true');
    
    // Scroll to success section
    if (successSection) {
        successSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
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

// Function to handle artist transition
function transitionToArtist(artistId) {
    // Update the global currentArtist variable
    currentArtist = artistId.toLowerCase();
    
    // Store current artist in localStorage
    localStorage.setItem('currentArtist', currentArtist);
    
    // Update UI elements with the new artist name
    document.getElementById('artistName').textContent = artistId.toUpperCase();
    document.getElementById('artistTokenName').textContent = artistData[currentArtist].name;
    document.getElementById('artistNameAccess').textContent = artistData[currentArtist].name;
    document.getElementById('artistVideoName').textContent = artistId.toUpperCase();
    document.getElementById('artworkTitle').textContent = artistData[currentArtist].artworkTitle;
    
    // Update video source if needed
    const videoSource = document.getElementById('videoSource');
    videoSource.src = `assets/${artistId.toLowerCase()}-video.mp4`;
    document.getElementById('artistVideo').load();
    
    // Reset state but preserve authentication
    isLoggedIn = isAuthenticated;
    paymentSelected = false;
    
    // Change theme
    document.body.className = `${currentArtist}-theme`;
    
    // Update video source
    const video = document.getElementById('artistVideo');
    const source = document.getElementById('videoSource');
    const isMuted = video.muted; // Store the current mute state
    
    // Hide video temporarily during transition
    video.style.opacity = '0';
    
    // Update source
    source.src = `assets/${currentArtist}-video.mp4`;
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
    
    // Update purchase headline for the new artist
    const purchaseAmount = document.getElementById('purchaseAmount');
    if (purchaseAmount) {
        purchaseAmount.textContent = new Intl.NumberFormat().format(currentTokenAmount);
    }
    
    // Clear chat input
    document.getElementById('chatInput').value = '';
    
    // Show appropriate sections based on authentication status
    if (isAuthenticated) {
        // Hide login section
        const loginSection = document.getElementById('loginSection');
        if (loginSection) {
            loginSection.style.display = 'none';
        }
        
        // Show token section
        const tokenSection = document.getElementById('tokenPreviewSection');
        if (tokenSection) {
            tokenSection.style.display = 'block';
            tokenSection.style.opacity = '1';
            tokenSection.style.transform = 'translateY(0)';
        }
        
        // Show/hide advanced purchase options based on safeword state
        const advancedOptions = document.getElementById('advancedPurchaseOptions');
        const buyButton = document.getElementById('buyButton');
        
        if (advancedOptions) {
            if (safewordUsed) {
                advancedOptions.style.display = 'block';
                advancedOptions.classList.add('show');
                advancedOptions.style.opacity = '1';
                advancedOptions.style.maxHeight = '300px';
                
                if (buyButton) {
                    buyButton.textContent = 'Buy Artistocks';
                    buyButton.classList.add('safeword-activated');
                }
            } else {
                advancedOptions.style.display = 'none';
                advancedOptions.classList.remove('show');
                advancedOptions.style.opacity = '0';
                advancedOptions.style.maxHeight = '0';
                
                if (buyButton) {
                    buyButton.textContent = 'Get Download ($1)';
                    buyButton.classList.remove('safeword-activated');
                }
            }
        }
        
        // Hide purchase and success sections
        const purchaseSection = document.getElementById('purchaseSection');
        if (purchaseSection) {
            purchaseSection.style.display = 'none';
        }
        
        const successSection = document.getElementById('successSection');
        if (successSection) {
            successSection.style.display = 'none';
        }
    } else {
        // User is not authenticated, show login section
        const loginSection = document.getElementById('loginSection');
        if (loginSection) {
            loginSection.style.display = 'flex';
            loginSection.style.opacity = '1';
        }
        
        // Reset email input
        if (document.getElementById('emailInput')) {
            document.getElementById('emailInput').value = '';
        }
        
        // Hide other sections
        const tokenSection = document.getElementById('tokenPreviewSection');
        if (tokenSection) {
            tokenSection.style.display = 'none';
        }
        
        const purchaseSection = document.getElementById('purchaseSection');
        if (purchaseSection) {
            purchaseSection.style.display = 'none';
            purchaseSection.style.opacity = '0';
        }
        
        const successSection = document.getElementById('successSection');
        if (successSection) {
            successSection.style.display = 'none';
        }
    }
    
    // Update orbital tokens
    setupOrbitalTokens(currentArtist);
    
    // Update the explore button
    updateExploreButton();
    
    // Reset animation flag to ensure animation restarts with new tokens
    orbitAnimationRunning = false;
    animateOrbit();
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
    console.log("Buy button clicked");
    
    // Check if the user is authenticated
    if (!isAuthenticated) {
        // Flash the login section
        const loginSection = document.getElementById('loginSection');
        if (loginSection) {
            loginSection.style.display = 'flex';
            loginSection.style.opacity = '1';
            loginSection.style.animation = 'shake 0.5s';
            setTimeout(() => {
                loginSection.style.animation = '';
            }, 500);
        }
        return;
    }
    
    // Set up for purchase according to mode
    if (!safewordUsed) {
        // Without safeword: Force $1 download purchase only
        const price = artistData[currentArtist].tokenPrice;
        const minTokenAmount = Math.ceil(1 / price); // Calculate tokens for $1
        currentTokenAmount = minTokenAmount;
        
        // Make sure content unlock is checked
        const contentUnlockToggle = document.getElementById('contentUnlockToggle');
        if (contentUnlockToggle) {
            contentUnlockToggle.checked = true;
        }
        
        // Update values
        if (typeof updateFromTokenAmount === 'function') {
            updateFromTokenAmount(minTokenAmount);
        }
        
        // Update purchase headline
        const purchaseHeadline = document.getElementById('purchaseHeadline');
        if (purchaseHeadline) {
            purchaseHeadline.innerHTML = `Complete your download purchase for <span class="price-highlight-small">$1</span>`;
        }
    } else {
        // With safeword: Use advanced options if visible
        const advancedOptions = document.getElementById('advancedPurchaseOptions');
        const isAdvancedVisible = advancedOptions && window.getComputedStyle(advancedOptions).display !== 'none';
        
        // Check if content unlock toggle is checked (digital download)
        const contentUnlockToggle = document.getElementById('contentUnlockToggle');
        const includesDownload = contentUnlockToggle && contentUnlockToggle.checked;
        
        // Update purchase headline to focus on both download and tokens
        const purchaseHeadline = document.getElementById('purchaseHeadline');
        if (purchaseHeadline) {
            if (includesDownload) {
                // Show both Artistocks and download
                purchaseHeadline.innerHTML = `Complete your purchase of <span id="purchaseAmount">${new Intl.NumberFormat().format(currentTokenAmount)}</span> <span id="artistStockPurchaseName">${artistData[currentArtist].name}</span> Artistocks + <span class="price-highlight-small">$1 Download</span>`;
            } else {
                // Show only Artistocks
                purchaseHeadline.innerHTML = `Complete your purchase of <span id="purchaseAmount">${new Intl.NumberFormat().format(currentTokenAmount)}</span> <span id="artistStockPurchaseName">${artistData[currentArtist].name}</span> Artistocks`;
            }
        }
    }
    
    // Show purchase section with payment options
    const purchaseSection = document.getElementById('purchaseSection');
    if (purchaseSection) {
        // Make sure display is block and not none
        purchaseSection.style.display = 'block';
        
        // Immediately make purchase section visible
        purchaseSection.style.opacity = '1';
        
        // Ensure payment section is visible
        const paymentSection = purchaseSection.querySelector('.payment-section');
        if (paymentSection) {
            paymentSection.style.display = 'grid';
            paymentSection.style.opacity = '1';
        }
        
        // Scroll to purchase section
        purchaseSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    
    // Hide token section
    const tokenSection = document.getElementById('tokenPreviewSection');
    if (tokenSection) {
        tokenSection.style.display = 'none';
    }
    
    // Hide success section if visible
    const successSection = document.getElementById('successSection');
    if (successSection) {
        successSection.style.display = 'none';
    }
    
    // Update purchase amounts in the display
    const purchaseAmount = document.getElementById('purchaseAmount');
    const artistStockName = document.getElementById('artistStockPurchaseName');
    
    if (purchaseAmount) {
        purchaseAmount.textContent = new Intl.NumberFormat().format(currentTokenAmount);
    }
    
    if (artistStockName) {
        artistStockName.textContent = artistData[currentArtist].name;
    }
}

// Set up content unlock toggle functionality
function setupContentUnlockToggle() {
    const toggle = document.getElementById('contentUnlockToggle');
    if (!toggle) return;
    
    // Always checked by default
    toggle.checked = true;
    
    toggle.addEventListener('change', () => {
        updateTotalPrice();
    });
}

// Function to update total price
function updateTotalPrice() {
    const tokenTotalInput = document.getElementById('tokenTotalInput');
    const contentUnlockToggle = document.getElementById('contentUnlockToggle');
    
    if (!tokenTotalInput || !contentUnlockToggle) return;
    
    // Calculate Artistocks cost
    const artistocksTotal = currentTokenAmount * artistData[currentArtist].tokenPrice;
    
    // Add $1 if content unlock is checked
    const unlockCost = contentUnlockToggle.checked ? 1 : 0;
    
    // Calculate total
    const total = artistocksTotal + unlockCost;
    
    // Update total input
    tokenTotalInput.value = total.toFixed(4);
    
    // If purchase headline is visible, update it based on content unlock toggle
    const purchaseHeadline = document.getElementById('purchaseHeadline');
    const purchaseSection = document.getElementById('purchaseSection');
    
    if (purchaseHeadline && purchaseSection && 
        window.getComputedStyle(purchaseSection).display !== 'none' && 
        safewordUsed) {
        
        if (contentUnlockToggle.checked) {
            // Show both Artistocks and download
            purchaseHeadline.innerHTML = `Complete your purchase of <span id="purchaseAmount">${new Intl.NumberFormat().format(currentTokenAmount)}</span> <span id="artistStockPurchaseName">${artistData[currentArtist].name}</span> Artistocks + <span class="price-highlight-small">$1 Download</span>`;
        } else {
            // Show only Artistocks
            purchaseHeadline.innerHTML = `Complete your purchase of <span id="purchaseAmount">${new Intl.NumberFormat().format(currentTokenAmount)}</span> <span id="artistStockPurchaseName">${artistData[currentArtist].name}</span> Artistocks`;
        }
        
        // Make sure purchaseAmount and artistStockPurchaseName are updated
        const purchaseAmount = document.getElementById('purchaseAmount');
        const artistStockName = document.getElementById('artistStockPurchaseName');
        
        if (purchaseAmount) {
            purchaseAmount.textContent = new Intl.NumberFormat().format(currentTokenAmount);
        }
        
        if (artistStockName) {
            artistStockName.textContent = artistData[currentArtist].name;
        }
    }
    
    // Update slider minimum if content is unlocked
    const slider = document.getElementById('tokenSlider');
    if (slider) {
        const price = artistData[currentArtist].tokenPrice;
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
        document.getElementById('artistTokenName').textContent = artistData[currentArtist].name;
        document.getElementById('artistNameAccess').textContent = artistData[currentArtist].name;
        document.getElementById('artworkTitle').textContent = artistData[currentArtist].artworkTitle;

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
            buyButton.textContent = 'Get Download ($1)';
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
            contentUnlockToggle.checked = false;
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
    
    // If safeword was previously activated, show advanced options
    if (safewordUsed) {
        const advancedOptions = document.getElementById('advancedPurchaseOptions');
        const buyButton = document.getElementById('buyButton');
        
        if (advancedOptions) {
            advancedOptions.style.display = 'block';
            advancedOptions.classList.add('show');
            advancedOptions.style.opacity = '1';
            advancedOptions.style.maxHeight = '300px';
        }
        
        if (buyButton) {
            buyButton.textContent = 'Buy Artistocks';
            buyButton.classList.add('safeword-activated');
        }
    }
    
    chatInput.addEventListener('input', function() {
        const inputText = this.value.toLowerCase();
        const advancedOptions = document.getElementById('advancedPurchaseOptions');
        const buyButton = document.getElementById('buyButton');
        
        // Check for variations of "artistock"
        const keywordMatches = [
            'artistock', 'artist stock', 'art stock', 'artisstok', 
            'art istok', 'artstock', 'art ist ock', 'artis tok'
        ];
        
        const foundMatch = keywordMatches.some(keyword => inputText.includes(keyword));
        
        // Only trigger the animation if this is the first time finding the keyword
        if (foundMatch && !safewordUsed && advancedOptions) {
            safewordUsed = true;
            
            // Store safeword status in localStorage
            localStorage.setItem('safewordUsed', 'true');
            
            // Update the buy button text to reflect advanced capabilities
            if (buyButton) {
                buyButton.textContent = 'Buy Artistocks';
                buyButton.classList.add('safeword-activated');
            }
            
            // Update token purchase section to show if it's hidden
            const tokenSection = document.getElementById('tokenPreviewSection');
            if (tokenSection && tokenSection.style.display === 'none') {
                tokenSection.style.display = 'block';
                tokenSection.style.opacity = '1';
                tokenSection.style.transform = 'translateY(0)';
                
                // Set timeout to ensure token section animation completes first
                setTimeout(() => {
                    // Show advanced options with animation
                    advancedOptions.style.display = 'block';
                    advancedOptions.style.opacity = '0';
                    advancedOptions.style.maxHeight = '0';
                    
                    // Force reflow to ensure transition works
                    void advancedOptions.offsetWidth;
                    
                    // Add class for animation
                    advancedOptions.classList.add('show');
                    advancedOptions.style.opacity = '1';
                    advancedOptions.style.maxHeight = '300px';
                    
                    // Update slider and input values
                    updateFromTokenAmount(currentTokenAmount);
                }, 300);
            } else {
                // If token section is already visible, just show advanced options
                advancedOptions.style.display = 'block';
                advancedOptions.style.opacity = '0';
                advancedOptions.style.maxHeight = '0';
                
                // Force reflow
                void advancedOptions.offsetWidth;
                
                // Add class for animation
                advancedOptions.classList.add('show');
                advancedOptions.style.opacity = '1';
                advancedOptions.style.maxHeight = '300px';
                
                // Update slider and input values
                updateFromTokenAmount(currentTokenAmount);
            }
            
            // Flash highlight on the unlocked slider
            advancedOptions.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
            setTimeout(() => {
                advancedOptions.style.backgroundColor = '';
            }, 1000);
        }
    });
    
    // Store safeword status in a property we can check elsewhere
    window.safewordActivated = function() {
        return safewordUsed;
    };
}

// Set up explore button (important for switching between artists)
function updateExploreButton() {
    const exploreBtn = document.querySelector('.explore-btn');
    if (exploreBtn) {
        if (currentArtist === 'gosheesh') {
            exploreBtn.textContent = 'Explore JAI TEA';
            exploreBtn.onclick = () => transitionToArtist('jaitea');
        } else if (currentArtist === 'jaitea') {
            exploreBtn.textContent = 'Explore GOSHEESH';
            exploreBtn.onclick = () => transitionToArtist('gosheesh');
        }
    }
} 