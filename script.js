// Token data for both artists
const tokenData = {
    gosheesh: [
        { name: "Nebula", angle: 0 },
        { name: "Stardust", angle: 72 },
        { name: "EchoSpace", angle: 144 },
        { name: "Cosmic Wave", angle: 216 },
        { name: "Astral Pulse", angle: 288 }
    ],
    jaitea: [
        { name: "Emerald Flow", angle: 0 },
        { name: "Jade Echo", angle: 72 },
        { name: "Forest Pulse", angle: 144 },
        { name: "Crystal Wave", angle: 216 },
        { name: "Aqua Mist", angle: 288 }
    ]
};

// Current artist state
let currentArtist = "gosheesh";
let paymentSelected = false;
let loginSelected = false;
let orbitAnimationRunning = false;

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
});

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
        tokenElement.innerText = token.name;
        
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
    // Using the video width to create a perfect circle
    const orbitRadius = videoWidth * 0.65;
    
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

// Handle payment selection
function handlePayment(method) {
    console.log(`Payment selected: ${method}`);
    paymentSelected = true;
    
    // Check if both payment and login are selected
    checkUnlockCondition();
}

// Handle login selection
function handleLogin(method) {
    console.log(`Login selected: ${method}`);
    
    // Simulate wallet creation
    if (method === 'email') {
        console.log('Wallet created for user@example.com');
    } else if (method === 'gmail') {
        console.log('Wallet created for google user (gmail)');
        // Add special Gmail animation
        flashLoginButton('gmail');
    } else {
        console.log(`Wallet created for ${method} user`);
    }
    
    loginSelected = true;
    
    // Check if both payment and login are selected
    checkUnlockCondition();
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

// Check if Artistock should be unlocked
function checkUnlockCondition() {
    if (paymentSelected && loginSelected) {
        unlockArtistock();
    }
}

// Unlock Artistock
function unlockArtistock() {
    console.log(`Unlocking ${currentArtist} Artistock`);
    
    // Hide payment and login sections
    document.querySelector('.payment-section').style.display = 'none';
    document.querySelector('.login-section').style.display = 'none';
    
    // Show success section
    const successSection = document.getElementById('successSection');
    successSection.style.display = 'block';
    
    // Update artist stock name
    document.getElementById('artistStockName').textContent = currentArtist.toUpperCase();
}

// Transition to a different artist
function transitionToArtist(artistName) {
    // Reset state
    paymentSelected = false;
    loginSelected = false;
    
    // Update current artist
    currentArtist = artistName.toLowerCase();
    
    // Change theme
    document.body.className = `${currentArtist}-theme`;
    
    // Update artist name
    document.getElementById('artistName').textContent = currentArtist.toUpperCase();
    document.getElementById('artistVideoName').textContent = currentArtist.toUpperCase();
    
    // Update video source
    const video = document.getElementById('artistVideo');
    const source = document.getElementById('videoSource');
    
    // Hide video temporarily during transition
    video.style.opacity = '0';
    
    // Update source
    source.src = `assets/${currentArtist}-video.mp4`;
    video.load();
    
    // When video is ready, show it
    video.oncanplay = () => {
        video.style.opacity = '1';
        showVideoFallback(false);
    };
    
    // Start playing
    video.play().catch(() => {
        // Video might not play, handle error
        showVideoFallback(true);
    });
    
    // Update headline
    document.getElementById('supportHeadline').textContent = `Support ${currentArtist.toUpperCase()} and unlock your Artistock`;
    
    // Hide success section
    document.getElementById('successSection').style.display = 'none';
    
    // Show payment and login sections
    document.querySelector('.payment-section').style.display = 'grid';
    document.querySelector('.login-section').style.display = 'flex';
    
    // Update orbital tokens
    setupOrbitalTokens(currentArtist);
    
    // Reset animation flag to ensure animation restarts with new tokens
    orbitAnimationRunning = false;
    animateOrbit();
} 