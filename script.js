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
let currentArtist = "gosheesh";
let isLoggedIn = false;
let paymentSelected = false;
let orbitAnimationRunning = false;
let currentTokenAmount = 100;
let isAuthenticated = false; // Global authentication state that persists between artists

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
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
    const minDollarAmount = 1;
    
    // Calculate token limits based on dollar amounts
    const maxTokens = Math.floor(maxDollarAmount / price);
    const minTokens = Math.ceil(minDollarAmount / price);
    
    // Set min and max attributes dynamically based on price
    slider.min = minTokens;
    slider.max = maxTokens;
    
    // Set initial value to 1% of max or minimum dollar amount equivalent, whichever is greater
    const initialTokens = Math.max(minTokens, Math.floor(maxTokens * 0.01));
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
        // Ensure tokens is a number and within range
        tokens = Math.max(minTokens, Math.min(parseInt(tokens), maxTokens));
        
        // Update slider
        slider.value = tokens;
        
        // Update currentTokenAmount global variable
        currentTokenAmount = tokens;
        
        // Update token amount input
        tokenAmountInput.value = tokens;
        
        // Calculate total cost
        const totalCost = (tokens * price).toFixed(4);
        
        // Update total input
        tokenTotalInput.value = totalCost;
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
        const minDollarAmount = 1;
        
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
    const minTokens = Math.ceil(1 / price); // $1 minimum
    
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
    isLoggedIn = true;
    isAuthenticated = true; // Set global authentication state
    
    // Remember the selected token amount
    const purchaseAmount = document.getElementById('purchaseAmount');
    if (purchaseAmount) {
        purchaseAmount.textContent = new Intl.NumberFormat().format(currentTokenAmount);
    }
    
    // Show token preview section for authenticated users
    const tokenSection = document.getElementById('tokenPreviewSection');
    tokenSection.style.display = 'block';
    tokenSection.style.opacity = '1';
    tokenSection.style.transform = 'translateY(0)';
    
    // Hide login section with fade out
    const loginSection = document.getElementById('loginSection');
    loginSection.style.opacity = '0';
    
    setTimeout(() => {
        loginSection.style.display = 'none';
        
        // Show purchase section with fade in
        const purchaseSection = document.getElementById('purchaseSection');
        purchaseSection.style.display = 'block';
        
        // Slight delay before fading in for smoother transition
        setTimeout(() => {
            purchaseSection.style.opacity = '1';
        }, 50);
    }, 500);
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
    document.querySelector('.purchase-section').style.display = 'none';
    
    // Update purchase amount with formatted number
    document.getElementById('purchasedAmount').textContent = new Intl.NumberFormat().format(currentTokenAmount);
    
    // Show success section
    const successSection = document.getElementById('successSection');
    successSection.style.display = 'block';
    
    // Update artist stock name
    document.getElementById('artistStockName').textContent = artistData[currentArtist].name;
    
    // Set the explore button to switch to the other artist
    const exploreBtn = document.querySelector('.explore-btn');
    if (currentArtist === 'gosheesh') {
        exploreBtn.textContent = 'Explore JAI TEA';
        exploreBtn.onclick = () => transitionToArtist('jaitea');
    } else {
        exploreBtn.textContent = 'Explore GOSHEESH';
        exploreBtn.onclick = () => transitionToArtist('gosheesh');
    }
    
    // Ensure we maintain authenticated state
    isAuthenticated = true;
}

// Safeword detection
document.getElementById('chatInput').addEventListener('input', function(e) {
    // Skip safeword detection if already authenticated
    if (isAuthenticated) return;

    const input = e.target.value.toLowerCase();
    const safewordPatterns = [
        'artistock',
        'artist stock',
        'artstock',
        'art stock'
    ];
    
    // Check for fuzzy matches
    const matches = safewordPatterns.some(pattern => {
        // Allow for plural forms and minor typos
        const fuzzyPattern = pattern.replace(/\s+/g, '.*');
        const regex = new RegExp(fuzzyPattern + 's?', 'i');
        return regex.test(input);
    });

    if (matches) {
        // Clear the input
        e.target.value = '';
        
        // Show the token preview section with a smooth animation
        const tokenSection = document.getElementById('tokenPreviewSection');
        tokenSection.style.display = 'block';
        tokenSection.style.opacity = '0';
        tokenSection.style.transform = 'translateY(-20px)';
        
        // Trigger animation
        setTimeout(() => {
            tokenSection.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            tokenSection.style.opacity = '1';
            tokenSection.style.transform = 'translateY(0)';
        }, 10);
    }
});

// Function to handle artist transition
function transitionToArtist(artistId) {
    // Update the global currentArtist variable
    currentArtist = artistId.toLowerCase();
    
    // Update UI elements with the new artist name
    document.getElementById('artistName').textContent = artistId.toUpperCase();
    document.getElementById('artistTokenName').textContent = artistId.toUpperCase();
    document.getElementById('artistNameAccess').textContent = artistId.toUpperCase();
    document.getElementById('artistVideoName').textContent = artistId.toUpperCase();
    document.getElementById('artworkTitle').textContent = artistData[currentArtist].artworkTitle;
    
    // Update video source if needed
    const videoSource = document.getElementById('videoSource');
    videoSource.src = `assets/${artistId.toLowerCase()}-video.mp4`;
    document.getElementById('artistVideo').load();
    
    // Keep token preview section visible if authenticated
    const tokenSection = document.getElementById('tokenPreviewSection');
    if (isAuthenticated) {
        tokenSection.style.display = 'block';
        tokenSection.style.opacity = '1';
        tokenSection.style.transform = 'translateY(0)';
    } else {
        tokenSection.style.display = 'none';
    }
    
    // Clear chat input
    document.getElementById('chatInput').value = '';
    
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
    
    // Hide success section
    document.getElementById('successSection').style.display = 'none';
    
    // Show appropriate section based on authentication status
    if (isAuthenticated) {
        // User is already authenticated, show purchase section directly
        const loginSection = document.getElementById('loginSection');
        loginSection.style.display = 'none';
        
        const purchaseSection = document.getElementById('purchaseSection');
        purchaseSection.style.display = 'block';
        purchaseSection.style.opacity = '1';
    } else {
        // User is not authenticated, show login section
        const loginSection = document.getElementById('loginSection');
        loginSection.style.display = 'flex';
        loginSection.style.opacity = '1';
        
        // Reset email input
        if (document.getElementById('emailInput')) {
            document.getElementById('emailInput').value = '';
        }
        
        // Hide purchase section
        const purchaseSection = document.getElementById('purchaseSection');
        purchaseSection.style.display = 'none';
        purchaseSection.style.opacity = '0';
    }
    
    // Update orbital tokens
    setupOrbitalTokens(currentArtist);
    
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
    // If user is not authenticated, show login section
    if (!isAuthenticated) {
        const loginSection = document.getElementById('loginSection');
        loginSection.style.display = 'flex';
        loginSection.style.opacity = '1';
    } else {
        // User is authenticated, show purchase section directly
        const purchaseSection = document.getElementById('purchaseSection');
        purchaseSection.style.display = 'block';
        
        // Update purchase amount
        const purchaseAmount = document.getElementById('purchaseAmount');
        if (purchaseAmount) {
            purchaseAmount.textContent = new Intl.NumberFormat().format(currentTokenAmount);
        }
        
        // Show payment section
        const paymentSection = document.querySelector('.payment-section');
        paymentSection.style.display = 'grid';
        
        // Slight delay before fading in for smoother transition
        setTimeout(() => {
            purchaseSection.style.opacity = '1';
            paymentSection.style.opacity = '1';
        }, 50);
    }
} 