/**
 * ZEYODA Orbital Tokens Animation
 * This module handles the orbital token animations around artist profile
 */

// Constants for orbit animation
const ORBIT_CONFIG = {
    // Elliptical orbit dimensions (horizontal radius larger than vertical)
    RADIUS_X: 300,          // Horizontal radius (wider)
    RADIUS_Y: 220,          // Vertical radius (shorter)
    ANIMATION_DURATION: 60, // Full orbit rotation time in seconds
    MIN_SCALE: 0.7,         // Minimum scale for z-index simulation (smaller when far)
    MAX_SCALE: 1.2,         // Maximum scale for z-index simulation (larger when near)
    TOKEN_SIZE: 90,         // Size of tokens in pixels
    OSCILLATION: 8,         // Oscillation amount in pixels
    OSCILLATION_SPEED: 1.5, // Oscillation speed multiplier
    Z_OFFSET: 100,          // Z-offset for depth calculation
    // Responsive scaling factors
    MOBILE_RADIUS_FACTOR: 0.6, // Reduce radius on mobile screens
    TABLET_RADIUS_FACTOR: 0.8  // Reduce radius on tablet screens
};

// Store tokens and animation data
let tokenElements = [];
let isOrbiting = true;
let startTime = Date.now();
let orbitContainer = null;

/**
 * Shows an error banner within a container element
 * @param {HTMLElement} container - The container to show the error in
 * @param {string} message - The error message to display
 */
function showErrorBanner(container, message) {
    if (!container) {
        console.error('Cannot show error banner: no container provided');
        return;
    }
    
    // Create an error banner style if it doesn't exist
    if (!document.querySelector('style#orbit-error-styles')) {
        const style = document.createElement('style');
        style.id = 'orbit-error-styles';
        style.textContent = `
            @keyframes fadeOut {
                0% { opacity: 1; }
                80% { opacity: 1; }
                100% { opacity: 0; }
            }
            
            .error-banner {
                background-color: rgba(244, 67, 54, 0.1);
                border-left: 4px solid #F44336;
                color: #F44336;
                padding: 10px 15px;
                margin: 10px 0;
                border-radius: 4px;
                font-size: 14px;
                animation: fadeOut 5s forwards;
            }
        `;
        document.head.appendChild(style);
    }
    
    // Remove any existing error banners
    const existingBanners = container.querySelectorAll('.error-banner');
    existingBanners.forEach(banner => banner.remove());
    
    // Create the error banner
    const banner = document.createElement('div');
    banner.className = 'error-banner';
    banner.textContent = message;
    
    // Insert at the top of the container
    if (container.firstChild) {
        container.insertBefore(banner, container.firstChild);
    } else {
        container.appendChild(banner);
    }
    
    // Auto-remove after animation completes
    setTimeout(() => {
        if (banner && banner.parentNode) {
            banner.parentNode.removeChild(banner);
        }
    }, 5000);
}

/**
 * Initialize the orbital tokens
 * @param {Object} artistData - Artist data containing orbital tokens
 */
export function setupOrbit(artistData) {
    // If no artist data is provided, try to use default data
    if (!artistData || !artistData.orbitalTokens) {
        console.warn('No orbital tokens found in artist data, using fallback data');
        // Create fallback orbit data if none provided
        artistData = createFallbackOrbitData();
        if (!artistData) {
            // Find a suitable container for the error message
            const contentContainer = document.querySelector('.content-section') || document.body;
            showErrorBanner(contentContainer, 'Failed to initialize orbital tokens: missing artist data');
            return;
        }
    }

    // Get the container
    orbitContainer = document.getElementById('orbitalTokens');
    if (!orbitContainer) {
        console.error('Orbit container not found');
        // Find a suitable container for the error message
        const contentContainer = document.querySelector('.content-section') || document.body;
        showErrorBanner(contentContainer, 'Failed to initialize orbital tokens: container not found');
        return;
    }

    // Clear any existing tokens
    orbitContainer.innerHTML = '';
    tokenElements = [];

    // Adjust radius based on screen size
    const scaleFactor = getResponsiveScaleFactor();
    const radiusX = ORBIT_CONFIG.RADIUS_X * scaleFactor;
    const radiusY = ORBIT_CONFIG.RADIUS_Y * scaleFactor;

    // Create each token
    artistData.orbitalTokens.forEach((token, index) => {
        // Create the token element
        const tokenElement = document.createElement('div');
        tokenElement.className = 'token orbit-token';
        tokenElement.innerHTML = token.name;
        
        // Set data attribute for linked artist if specified (for CSS targeting)
        if (token.artistId) {
            tokenElement.setAttribute('data-artist-id', token.artistId);
        }
        
        // Set initial position based on angle
        const angle = token.angle || (index * (360 / artistData.orbitalTokens.length));
        const radians = (angle * Math.PI) / 180;
        
        // Store token data
        const tokenData = {
            element: tokenElement,
            initialAngle: angle,
            currentAngle: angle,
            radians,
            radiusX,
            radiusY,
            // Support custom z-index ordering if specified
            zIndex: token.zIndex || 5,
            // Custom speed modifier if specified (1 is default)
            speedModifier: token.speedModifier || 1,
            // Add reference to linked artist if specified
            artistId: token.artistId || null,
            // Random oscillation offset for more natural movement
            oscillationOffset: Math.random() * Math.PI * 2
        };
        
        // Add click handler if token links to another artist
        if (token.artistId) {
            tokenElement.addEventListener('click', () => {
                // If there's a handler for artist switching, call it
                if (typeof window.transitionToArtist === 'function') {
                    window.transitionToArtist(token.artistId);
                } else {
                    console.log(`Clicked artist token: ${token.artistId}`);
                }
            });
            tokenElement.style.cursor = 'pointer';
        }
        
        // Add the token to the container
        orbitContainer.appendChild(tokenElement);
        tokenElements.push(tokenData);
    });

    // Start the animation
    startTime = Date.now();
    animateOrbit();
    
    console.log(`Initialized ${tokenElements.length} orbital tokens`);
    
    // Add window resize handler
    window.addEventListener('resize', updateOrbitRadius);
}

/**
 * Create fallback orbit data when no artist data is available
 * @returns {Object} Fallback artist data with orbital tokens
 */
function createFallbackOrbitData() {
    return {
        orbitalTokens: [
            { name: "LONIARI", angle: 0 },
            { name: "ANBRI SPPIR", angle: 72 },
            { name: "IJA TEA", angle: 144 },
            { name: "NYTO SAREGL", angle: 216 },
            { name: "LUMLITANIDE", angle: 288 }
        ]
    };
}

/**
 * Get responsive scale factor based on screen size
 * @returns {number} Scale factor for orbit radius
 */
function getResponsiveScaleFactor() {
    const width = window.innerWidth;
    
    if (width < 480) {
        return ORBIT_CONFIG.MOBILE_RADIUS_FACTOR;
    } else if (width < 768) {
        return ORBIT_CONFIG.TABLET_RADIUS_FACTOR;
    }
    
    return 1;
}

/**
 * Animate the orbital tokens with elliptical path
 * Uses requestAnimationFrame for smooth animation
 */
function animateOrbit() {
    if (!isOrbiting || tokenElements.length === 0) return;
    
    // Calculate time progress
    const elapsed = (Date.now() - startTime) / 1000; // seconds
    const progress = (elapsed % ORBIT_CONFIG.ANIMATION_DURATION) / ORBIT_CONFIG.ANIMATION_DURATION;
    
    // Update each token position
    tokenElements.forEach(token => {
        // Calculate rotation angle
        const rotation = 360 * progress * token.speedModifier;
        token.currentAngle = (token.initialAngle + rotation) % 360;
        token.radians = (token.currentAngle * Math.PI) / 180;
        
        // Calculate position on elliptical orbit
        // Mathematical formulas for 3D elliptical orbit with depth
        const x = Math.cos(token.radians) * token.radiusX;
        const y = Math.sin(token.radians) * token.radiusY;
        
        // Calculate z-depth for 3D effect (negative when behind, positive when in front)
        // We use cosine to determine if token is in front or back
        const zDepth = Math.cos(token.radians) * ORBIT_CONFIG.Z_OFFSET;
        
        // Scale based on z-depth (appears larger when in front, smaller when behind)
        // Map zDepth from -Z_OFFSET to +Z_OFFSET range to MIN_SCALE to MAX_SCALE
        const depthFactor = (zDepth + ORBIT_CONFIG.Z_OFFSET) / (ORBIT_CONFIG.Z_OFFSET * 2);
        const scaleFactor = ORBIT_CONFIG.MIN_SCALE + 
                           depthFactor * (ORBIT_CONFIG.MAX_SCALE - ORBIT_CONFIG.MIN_SCALE);
        
        // Add oscillation with unique offset for each token (more natural movement)
        const oscillation = Math.sin(elapsed * ORBIT_CONFIG.OSCILLATION_SPEED + token.oscillationOffset) * 
                           ORBIT_CONFIG.OSCILLATION;
        
        // Apply position and scale with more pronounced 3D effect
        token.element.style.transform = `
            translate3d(${x}px, ${y + oscillation}px, ${zDepth}px)
            scale(${scaleFactor})
        `;
        
        // Set z-index based on position (higher when in front)
        // Use a smoother transition for z-index by using more steps
        const zOffset = Math.round(20 * depthFactor);
        token.element.style.zIndex = token.zIndex + zOffset;
        
        // Adjust opacity for depth effect (more transparent when further away)
        const opacityFactor = 0.6 + (0.4 * depthFactor);
        token.element.style.opacity = opacityFactor;
        
        // Add subtle blur effect based on depth (blurrier when further away)
        const blurAmount = Math.max(0, 2 * (1 - depthFactor));
        token.element.style.filter = blurAmount > 0.2 ? `blur(${blurAmount}px)` : 'none';
    });
    
    // Continue animation
    requestAnimationFrame(animateOrbit);
}

/**
 * Update orbit radius when window is resized
 */
function updateOrbitRadius() {
    const scaleFactor = getResponsiveScaleFactor();
    const radiusX = ORBIT_CONFIG.RADIUS_X * scaleFactor;
    const radiusY = ORBIT_CONFIG.RADIUS_Y * scaleFactor;
    
    // Update each token's radius
    tokenElements.forEach(token => {
        token.radiusX = radiusX;
        token.radiusY = radiusY;
    });
}

/**
 * Pause the orbit animation
 */
export function pauseOrbit() {
    isOrbiting = false;
}

/**
 * Resume the orbit animation
 */
export function resumeOrbit() {
    if (!isOrbiting) {
        isOrbiting = true;
        startTime = Date.now() - (startTime % (ORBIT_CONFIG.ANIMATION_DURATION * 1000));
        animateOrbit();
    }
}

/**
 * Toggle the orbit animation state
 */
export function toggleOrbit() {
    if (isOrbiting) {
        pauseOrbit();
    } else {
        resumeOrbit();
    }
    return isOrbiting;
}

// Expose functions to the global window object for non-module scripts
if (typeof window !== 'undefined') {
    window.setupOrbit = setupOrbit;
    window.pauseOrbit = pauseOrbit;
    window.resumeOrbit = resumeOrbit;
    window.toggleOrbit = toggleOrbit;
} 