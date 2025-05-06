/**
 * ZEYODA Artist Onboarding Module
 * Handles the chatbot-driven artist onboarding process
 */

// Onboarding state management
let onboardingActive = false;
let currentStep = 0;
let artistData = {
    name: '',
    displayName: '',
    tokenName: '',
    artworkTitle: 'Untitled',
    artworkYear: new Date().getFullYear().toString(),
    tokenPrice: 0.0005,
    videoSrc: '',
    theme: {
        primaryColor: '#0a1a3b',
        accentColor: '#4073ff',
        gradientStart: '#d4af37',
        gradientMiddle: '#f9f295',
        gradientEnd: '#d4af37',
        fontFamily: 'Bungee, cursive'
    },
    orbitalTokens: [
        { name: "ARTIST 1", angle: 0 },
        { name: "ARTIST 2", angle: 72 },
        { name: "ARTIST 3", angle: 144 },
        { name: "ARTIST 4", angle: 216 },
        { name: "ARTIST 5", angle: 288 }
    ]
};

// Asset storage (simulated IPFS)
let uploadedAssets = {
    logo: null,
    media: []
};

// Onboarding steps
const onboardingSteps = [
    {
        prompt: "Hi there! I'll help you set up your ZEYODA artist profile. What's your artist name?",
        field: "name",
        process: (value) => {
            artistData.name = value.trim().toUpperCase();
            artistData.displayName = value.trim().toUpperCase();
            artistData.tokenName = value.trim().toUpperCase();
            
            // Update orbital tokens with artist name
            artistData.orbitalTokens = [
                { name: artistData.name, angle: 0 },
                { name: "ARTIST 2", angle: 72 },
                { name: "ARTIST 3", angle: 144 },
                { name: "ARTIST 4", angle: 216 },
                { name: "ARTIST 5", angle: 288 }
            ];
            
            return `Great! Your artist name is ${artistData.name}. Now, please upload your logo image.`;
        }
    },
    {
        prompt: "Please upload your logo image.",
        field: "logo",
        process: (file) => {
            if (file && file.type.startsWith('image/')) {
                uploadedAssets.logo = {
                    filename: file.name,
                    type: file.type,
                    ipfsHash: generateIPFSHash()
                };
                
                // In a real implementation, we would store the logo and use it
                // For now, we'll just acknowledge it was uploaded
                return `Logo uploaded successfully! Now, let's choose your theme color (HEX code or color name).`;
            } else {
                currentStep--; // Stay on this step
                return `Sorry, that doesn't seem to be a valid image file. Please try again.`;
            }
        }
    },
    {
        prompt: "Choose your theme color (HEX code or color name).",
        field: "themeColor",
        process: (value) => {
            // Simple validation for hex code format
            const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
            let color = value.trim();
            
            if (!color.startsWith('#')) {
                color = '#' + color;
            }
            
            if (hexRegex.test(color)) {
                artistData.theme.primaryColor = color;
                // Set accent color as a slightly lighter variant
                artistData.theme.accentColor = lightenColor(color, 0.3);
                // Update gradient colors
                artistData.theme.gradientStart = color;
                artistData.theme.gradientMiddle = lightenColor(color, 0.5);
                artistData.theme.gradientEnd = color;
                
                // IMMEDIATELY apply the color to the UI
                document.body.style.backgroundColor = color;
                const headerElement = document.querySelector('header');
                if (headerElement) {
                    headerElement.style.backgroundColor = color;
                }
                
                // Force color application with high-priority CSS
                const colorStyle = document.createElement('style');
                colorStyle.id = 'color-override-style';
                colorStyle.textContent = `
                    body, header, .content-container, .main-container, .artist-header {
                        background-color: ${color} !important;
                        transition: none !important;
                    }
                    
                    .artist-name, #artistName, .artist-title {
                        color: #000 !important;
                        font-family: ${artistData.theme.fontFamily} !important;
                        font-weight: bold !important;
                    }
                    
                    .orbital-tokens .token::before {
                        background: linear-gradient(135deg, 
                            ${artistData.theme.gradientStart}, 
                            ${artistData.theme.gradientMiddle}, 
                            ${artistData.theme.gradientEnd}
                        ) !important;
                    }
                    
                    .orbital-tokens .token {
                        opacity: 1 !important;
                    }
                `;
                
                // Remove existing color override style if exists
                const existingColorStyle = document.getElementById('color-override-style');
                if (existingColorStyle) {
                    existingColorStyle.remove();
                }
                
                document.head.appendChild(colorStyle);
                
                // Force a repaint to make sure colors update immediately
                document.body.offsetHeight;
                
                return `Theme color set to ${color}. Now, choose your font style.`;
            } else {
                currentStep--; // Stay on this step
                return `Please enter a valid HEX color code (e.g., #0a1a3b).`;
            }
        }
    },
    {
        prompt: "Choose your font style:\n1. Bungee (stylized)\n2. Inter (clean, modern)\n3. Times New Roman (classic)\n4. Arial (standard)\n5. Courier (monospace)\nEnter the number or name:",
        field: "font",
        process: (value) => {
            const choice = value.trim().toLowerCase();
            let font = '';
            
            if (choice === '1' || choice.includes('bungee')) {
                font = 'Bungee, cursive';
            } else if (choice === '2' || choice.includes('inter')) {
                font = 'Inter, sans-serif';
            } else if (choice === '3' || choice.includes('times')) {
                font = 'Times New Roman, serif';
            } else if (choice === '4' || choice.includes('arial')) {
                font = 'Arial, sans-serif';
            } else if (choice === '5' || choice.includes('courier')) {
                font = 'Courier, monospace';
            } else {
                currentStep--; // Stay on this step
                return `Please select a valid font option (1-5).`;
            }
            
            artistData.theme.fontFamily = font;
            return `Font style set to ${font.split(',')[0]}. Now, let's upload your media asset (audio, video, image, or text).`;
        }
    },
    {
        prompt: "Upload your media asset (audio, video, image, or text file).",
        field: "media",
        process: (file) => {
            if (file) {
                const asset = {
                    filename: file.name,
                    type: file.type,
                    ipfsHash: generateIPFSHash()
                };
                
                uploadedAssets.media.push(asset);
                
                // If it's a video, set it as the main video source
                if (file.type.startsWith('video/')) {
                    artistData.videoSrc = `assets/${artistData.name.toLowerCase().replace(/\s+/g, '-')}/${asset.filename}`;
                    
                    // In a real implementation, we'd load the video
                    // For now, we'll just acknowledge it
                    const video = document.getElementById('artistVideo');
                    const fallback = document.getElementById('videoFallback');
                    if (video && fallback) {
                        fallback.querySelector('#artistVideoName').textContent = artistData.name;
                    }
                }
                
                return `Media asset "${file.name}" uploaded successfully! What title would you like to give to your artwork?`;
            } else {
                currentStep--; // Stay on this step
                return `Sorry, please upload a valid media file.`;
            }
        }
    },
    {
        prompt: "What title would you like to give to your artwork?",
        field: "artworkTitle",
        process: (value) => {
            artistData.artworkTitle = value.trim();
            return `Artwork title set to "${artistData.artworkTitle}". What year was this created?`;
        }
    },
    {
        prompt: "What year was this artwork created?",
        field: "artworkYear",
        process: (value) => {
            const yearValue = value.trim();
            const currentYear = new Date().getFullYear();
            const yearNumber = parseInt(yearValue);
            
            if (!isNaN(yearNumber) && yearNumber > 1900 && yearNumber <= currentYear) {
                artistData.artworkYear = yearValue;
                return `Artwork year set to ${artistData.artworkYear}. Now, set the price per Artistock token (in USD, e.g., 0.0005):`;
            } else {
                currentStep--; // Stay on this step
                return `Please enter a valid year between 1900 and ${currentYear}.`;
            }
        }
    },
    {
        prompt: "Set the price per Artistock token (in USD, e.g., 0.0005):",
        field: "tokenPrice",
        process: (value) => {
            const price = parseFloat(value.trim());
            
            if (!isNaN(price) && price > 0 && price <= 0.01) {
                artistData.tokenPrice = price;
                return `Token price set to $${price.toFixed(4)} per Artistock. You'll mint 1 billion tokens. Ready to complete your onboarding?`;
            } else {
                currentStep--; // Stay on this step
                return `Please enter a valid price between 0.0001 and 0.01 USD.`;
            }
        }
    },
    {
        prompt: "Ready to complete your onboarding? Type 'yes' to continue:",
        field: "confirmation",
        process: (value) => {
            if (value.trim().toLowerCase() === 'yes') {
                // Save artist data and perform contract deployment
                saveArtistData();
                deployArtistContracts();
                updateOrbitMap();
                
                // Immediately clear any pending timeouts that might trigger next steps
                if (window.onboardingTimeoutId) {
                    clearTimeout(window.onboardingTimeoutId);
                    window.onboardingTimeoutId = null;
                }
                
                // Restore original layout with proper elements
                restoreOriginalLayout();
                
                // Apply full styling for completed profile
                applyCompletedProfileStyling();
                
                // Reset onboarding state completely
                setTimeout(() => {
                    // Use a slight delay to ensure this happens after the current message is processed
                    onboardingActive = false;
                    window.onboardingActive = false;
                    currentStep = 0;
                    
                    // Hide upload button when onboarding is complete
                    const uploadButton = document.getElementById('chatUploadButton');
                    if (uploadButton) {
                        uploadButton.style.display = 'none';
                    }
                    
                    console.log("Onboarding completed - state reset");
                }, 100);
                
                return `🎉 Congratulations! Your ZEYODA artist profile has been created. Your 1 billion Artistocks have been minted on Base Sepolia testnet. You can now share your unique artist orbit with the world!`;
            } else {
                currentStep--; // Stay on this step
                return `To complete your onboarding, please type 'yes'.`;
            }
        }
    }
];

/**
 * Trigger the onboarding process when the safeword is detected
 * @param {string} input - User input from the chat
 * @returns {boolean} - Whether the safeword was detected
 */
function checkForSafeword(input) {
    const safeword = 'zeyoda';
    
    // Case-insensitive check for exact match
    if (input.trim().toLowerCase() === safeword) {
        console.log('Safeword detected! Starting onboarding process...');
        
        // Start onboarding if user is authenticated
        if (isAuthenticated) {
            // Send a simple acknowledgment
            sendChatbotMessage("ah ha!");
            
            // Initialize artist data
            artistData = {
                name: '',
                displayName: '',
                tokenName: '',
                artworkTitle: 'Untitled',
                artworkYear: new Date().getFullYear().toString(),
                tokenPrice: 0.0005,
                videoSrc: '',
                theme: {
                    primaryColor: '#f0f0f0', // Canvas cloth color
                    accentColor: '#4073ff',
                    gradientStart: '#d4af37',
                    gradientMiddle: '#f9f295',
                    gradientEnd: '#d4af37',
                    fontFamily: 'Bungee, cursive'
                },
                orbitalTokens: [
                    { name: "ARTIST 1", angle: 0 },
                    { name: "ARTIST 2", angle: 72 },
                    { name: "ARTIST 3", angle: 144 },
                    { name: "ARTIST 4", angle: 216 },
                    { name: "ARTIST 5", angle: 288 }
                ]
            };
            
            // Initialize uploadedAssets
            uploadedAssets = {
                logo: null,
                media: []
            };
            
            // Make artist data and assets globally available
            window.artistData = artistData;
            window.uploadedAssets = uploadedAssets;
            
            // Apply the blank artist profile to the existing page
            applyArtistProfileToUI();
            
            // Start onboarding
            startOnboarding();
            
            return true;
        } else {
            // Prompt user to login first
            sendChatbotMessage("Please log in with Magic.link first to set up your artist profile.");
            return true;
        }
    }
    
    return false;
}

/**
 * Apply artist data to the existing UI
 * Updates the page elements to reflect the current artist data
 */
function applyArtistProfileToUI() {
    console.log('Applying artist profile to UI');
    
    // Determine if this is a blank/new profile
    const isNewProfile = !artistData.name;
    
    // Update artist name
    const artistNameElements = document.querySelectorAll('#artistName, #artistNameAccess, #artistVideoName, #artistTokenName, #artistStockPurchaseName, #artistStockName, .artist-name');
    artistNameElements.forEach(element => {
        element.textContent = artistData.name || 'NEW ARTIST';
    });
    
    // Update artwork details
    const artworkTitleElement = document.getElementById('artworkTitle');
    if (artworkTitleElement) {
        artworkTitleElement.textContent = artistData.artworkTitle || 'Untitled Artwork';
    }
    
    const artworkYearElement = document.querySelector('.artwork-description');
    if (artworkYearElement) {
        artworkYearElement.textContent = `© ${artistData.artworkYear}`;
    }
    
    // Add classes to body to reflect state for CSS transitions
    if (artistData.name) {
        document.body.classList.add('has-artist-name');
    } else {
        document.body.classList.remove('has-artist-name');
    }
    
    // Font selection state
    if (currentStep > 3) {
        document.body.classList.add('has-artist-font');
        
        // Apply font to artist name immediately
        artistNameElements.forEach(element => {
            element.style.fontFamily = artistData.theme.fontFamily;
        });
    }
    
    // Color selection state - this is critical
    if (currentStep > 2) {
        document.body.classList.add('has-artist-color');
        
        // IMMEDIATELY change the color of everything
        // Force change background color of body and header
        document.body.style.backgroundColor = artistData.theme.primaryColor;
        
        const headerElement = document.querySelector('header');
        if (headerElement) {
            headerElement.style.backgroundColor = artistData.theme.primaryColor;
        }
        
        // Apply font and color to artist name
        artistNameElements.forEach(element => {
            element.style.fontFamily = artistData.theme.fontFamily;
            element.style.color = '#000';
            element.style.fontWeight = 'bold';
        });
        
        // Force color application with high-priority CSS
        const colorStyle = document.createElement('style');
        colorStyle.id = 'color-override-style';
        colorStyle.textContent = `
            body, header, .content-container, .main-container, .artist-header {
                background-color: ${artistData.theme.primaryColor} !important;
                transition: none !important;
            }
            
            .artist-name, #artistName, .artist-title {
                color: #000 !important;
                font-family: ${artistData.theme.fontFamily} !important;
                font-weight: bold !important;
            }
            
            .orbital-tokens .token::before {
                background: linear-gradient(135deg, 
                    ${artistData.theme.gradientStart}, 
                    ${artistData.theme.gradientMiddle}, 
                    ${artistData.theme.gradientEnd}
                ) !important;
            }
            
            .orbital-tokens .token {
                opacity: 1 !important;
            }
        `;
        
        // Remove existing color override style if exists
        const existingColorStyle = document.getElementById('color-override-style');
        if (existingColorStyle) {
            existingColorStyle.remove();
        }
        
        document.head.appendChild(colorStyle);
        
        // Force a repaint to make sure colors update immediately
        document.body.offsetHeight;
    }
    
    // Media upload state
    if (currentStep > 4 && uploadedAssets.media.length > 0) {
        document.body.classList.add('has-artist-media');
    }
    
    // Update orbital tokens
    updateOrbitalTokensDisplay();
}

/**
 * Hide elements that should not be shown for incomplete profiles
 */
function hideIncompleteElements(isNewProfile) {
    // Elements to hide for new profiles
    const buyButton = document.getElementById('buyButton');
    const tokenPreviewSection = document.getElementById('tokenPreviewSection');
    const videoControls = document.querySelector('.video-controls');
    const tokenPurchaseConfirmation = document.querySelector('.token-purchase-confirmation');
    const artistocksAmount = document.querySelector('.artistocks-amount');
    const purchaseSection = document.querySelector('.token-preview-section');
    const priceDisplay = document.querySelector('.price-display');
    const sliderContainer = document.querySelector('.slider-container');
    const totalPriceSection = document.querySelector('.total-price');
    
    if (isNewProfile || onboardingActive) {
        // Hide purchase elements for incomplete profiles
        if (buyButton) buyButton.style.display = 'none';
        if (tokenPreviewSection) {
            tokenPreviewSection.style.opacity = '0.5';
            tokenPreviewSection.style.display = 'none';
        }
        if (videoControls) videoControls.style.display = 'none';
        if (tokenPurchaseConfirmation) tokenPurchaseConfirmation.style.display = 'none';
        if (artistocksAmount) artistocksAmount.style.display = 'none';
        if (purchaseSection) purchaseSection.style.display = 'none';
        if (priceDisplay) priceDisplay.style.display = 'none';
        if (sliderContainer) sliderContainer.style.display = 'none';
        if (totalPriceSection) totalPriceSection.style.display = 'none';
        
        // Hide any token purchase-related elements
        document.querySelectorAll('.token-purchase, .token-purchase-related, .price-related').forEach(el => {
            el.style.display = 'none';
        });
        
        // Add a class to body to indicate incomplete state
        document.body.classList.add('incomplete-profile');
    } else {
        // Show elements for complete profiles
        if (buyButton) buyButton.style.display = 'block';
        if (tokenPreviewSection) {
            tokenPreviewSection.style.opacity = '1';
            tokenPreviewSection.style.display = 'block';
        }
        if (videoControls) videoControls.style.display = 'flex';
        if (purchaseSection) purchaseSection.style.display = 'block';
        if (priceDisplay) priceDisplay.style.display = 'block';
        if (sliderContainer) sliderContainer.style.display = 'block';
        if (totalPriceSection) totalPriceSection.style.display = 'block';
        
        // Remove the incomplete class
        document.body.classList.remove('incomplete-profile');
    }
}

/**
 * Apply custom theme styles based on artist data
 */
function applyCustomTheme() {
    // Remove any existing custom style
    const existingStyle = document.getElementById('artist-custom-style');
    if (existingStyle) {
        existingStyle.remove();
    }
    
    // Is this a new/blank profile?
    const isNewProfile = !artistData.name;
    
    // Set default canvas color
    const defaultCanvasColor = '#f0f0f0';
    
    // Only use artist theme color after the color step (step 3) has been completed
    const useArtistThemeColor = currentStep > 2 && !isNewProfile;
    
    // Set appropriate colors for the profile state
    const bgColor = useArtistThemeColor ? artistData.theme.primaryColor : defaultCanvasColor;
    const textColor = useArtistThemeColor ? '#000' : '#999';
    
    // Create new style element
    const style = document.createElement('style');
    style.id = 'artist-custom-style';
    style.textContent = `
        .new-artist-theme {
            --primary-color: ${bgColor};
            --accent-color: ${artistData.theme.accentColor};
            --gradient-start: ${artistData.theme.gradientStart};
            --gradient-middle: ${artistData.theme.gradientMiddle};
            --gradient-end: ${artistData.theme.gradientEnd};
            --artist-font: ${artistData.theme.fontFamily};
        }
        
        .new-artist-theme .artist-name,
        .new-artist-theme #artworkTitle {
            font-family: ${artistData.theme.fontFamily};
            color: ${textColor};
        }
        
        .new-artist-theme header {
            background-color: ${bgColor};
            border-bottom: 1px solid rgba(0,0,0,0.1);
        }
        
        .new-artist-theme .buy-button,
        .new-artist-theme .login-btn {
            background-color: ${artistData.theme.accentColor};
        }
        
        .new-artist-theme .orbital-tokens .token::before {
            background: linear-gradient(135deg, 
                ${artistData.theme.gradientStart}, 
                ${artistData.theme.gradientMiddle}, 
                ${artistData.theme.gradientEnd}
            );
            box-shadow: 0 0 15px rgba(0,0,0,0.2);
        }
        
        .new-artist-theme .orbital-tokens .placeholder-token::before {
            background: #ddd;
            box-shadow: none;
        }
        
        .new-artist-theme .video-container {
            border: 1px solid rgba(0,0,0,0.1);
            background-color: rgba(240,240,240,0.5);
        }
        
        .new-artist-theme .video-fallback {
            background-color: ${bgColor};
            color: ${textColor};
        }
        
        .new-artist-theme #orbitalTokens {
            opacity: ${isNewProfile ? '0.7' : '1'};
        }
        
        .new-artist-theme .content-section {
            border-top: 1px solid rgba(0,0,0,0.1);
        }
        
        /* Styles for incomplete profiles */
        .incomplete-profile .token-preview-section,
        .incomplete-profile .token-purchase-section,
        .incomplete-profile .video-controls,
        .incomplete-profile .token-purchase-confirmation,
        .incomplete-profile .price-display,
        .incomplete-profile .slider-container,
        .incomplete-profile .total-price {
            pointer-events: none;
            display: none !important;
        }
        
        .incomplete-profile .artwork-title {
            opacity: 0.7;
        }
        
        .new-artist-theme .placeholder-token::before {
            background: #ddd;
            opacity: 0.5;
        }
        
        .token-purchase-confirmation {
            display: none;
        }
        
        /* Hide all purchase-related elements during onboarding */
        body.incomplete-profile .price-related,
        body.incomplete-profile .token-purchase,
        body.incomplete-profile .token-purchase-related {
            display: none !important;
        }
        
        /* Make sure other elements match the styling of Gosheesh and Jai Tea */
        .new-artist-theme.active-profile .artist-name {
            font-weight: bold;
            font-size: 2.5rem;
        }
        
        .new-artist-theme .orbit {
            transition: all 0.5s ease;
        }
    `;
    
    document.head.appendChild(style);
}

/**
 * Update the orbital tokens displayed on the page
 */
function updateOrbitalTokensDisplay() {
    const orbitalContainer = document.getElementById('orbitalTokens');
    if (!orbitalContainer) return;
    
    console.log('Updating orbital tokens display');
    
    // Store references to any existing tokens by angle
    const existingTokens = {};
    
    // Get the angles of JAI TEA and GOSHEESH tokens
    // We'll keep these intact and only replace the others
    const preserveTokens = ['JAI TEA', 'GOSHEESH'];
    const preservedAngles = new Set();
    
    // Find existing tokens to preserve
    Array.from(orbitalContainer.children).forEach(token => {
        const tokenName = token.getAttribute('data-name');
        if (tokenName) {
            const angle = parseInt(token.style.transform.match(/rotate\((\d+)deg/)?.[1] || '0');
            existingTokens[angle] = tokenName;
            
            if (preserveTokens.some(name => tokenName.includes(name))) {
                preservedAngles.add(angle);
            }
        }
    });
    
    // Clear existing tokens
    orbitalContainer.innerHTML = '';
    
    // For new/blank profiles, show placeholder orbit
    if (!artistData.name) {
        console.log('Creating placeholder orbit for new profile');
        // Create placeholder tokens for a new artist
        for (let i = 0; i < 5; i++) {
            const angle = i * 72; // 5 tokens evenly spaced
            const tokenElement = document.createElement('div');
            tokenElement.className = 'token placeholder-token';
            tokenElement.style.transform = `rotate(${angle}deg) translateY(-150px)`;
            orbitalContainer.appendChild(tokenElement);
        }
    } else {
        // Add the real tokens
        artistData.orbitalTokens.forEach(token => {
            const angle = token.angle;
            const tokenElement = document.createElement('div');
            tokenElement.className = 'token';
            
            // If this angle should be preserved for an existing token, use that name
            const tokenName = preservedAngles.has(angle) ? existingTokens[angle] : token.name;
            tokenElement.setAttribute('data-name', tokenName);
            tokenElement.style.transform = `rotate(${angle}deg) translateY(-150px)`;
            
            // Add logo to the first token (angle 0) if we have uploaded a logo
            if (angle === 0 && uploadedAssets.logo && !preservedAngles.has(angle)) {
                // Create a style for this token to use the logo as background
                const logoStyle = document.createElement('style');
                logoStyle.textContent = `
                    [data-name="${tokenName}"]::before {
                        background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 100 100"><text y=".9em" font-size="90">${artistData.name.charAt(0)}</text></svg>') !important;
                        background-size: cover !important;
                        background-position: center !important;
                    }
                `;
                document.head.appendChild(logoStyle);
            }
            
            orbitalContainer.appendChild(tokenElement);
        });
    }
}

/**
 * Start the onboarding process
 */
function startOnboarding() {
    if (onboardingActive) {
        console.log("Onboarding already active, ignoring start request");
        return;
    }
    
    console.log("Starting onboarding process");
    
    // FIRST: Take a radical approach - capture just what we need and rebuild the page
    radicallyCleanPage();
    
    // Then proceed with normal setup
    onboardingActive = true;
    window.onboardingActive = true;
    currentStep = 0;
    
    // Reset artist data
    artistData = {
        name: '',
        displayName: '',
        tokenName: '',
        artworkTitle: 'Untitled',
        artworkYear: new Date().getFullYear().toString(),
        tokenPrice: 0.0005,
        videoSrc: '',
        theme: {
            primaryColor: '#f0f0f0', // Start with canvas color
            accentColor: '#4073ff',
            gradientStart: '#d4af37',
            gradientMiddle: '#f9f295',
            gradientEnd: '#d4af37',
            fontFamily: 'Bungee, cursive'
        },
        orbitalTokens: [
            { name: "ARTIST 1", angle: 0 },
            { name: "ARTIST 2", angle: 72 },
            { name: "ARTIST 3", angle: 144 },
            { name: "ARTIST 4", angle: 216 },
            { name: "ARTIST 5", angle: 288 }
        ]
    };
    
    uploadedAssets = {
        logo: null,
        media: []
    };
    
    // Clone existing page template, but make it clean canvas
    setupCleanCanvasTemplate();
    
    // Make sure upload button is hidden initially
    const uploadButton = document.getElementById('chatUploadButton');
    if (uploadButton) {
        uploadButton.style.display = 'none';
    }
    
    // Show the first prompt
    sendChatbotMessage(onboardingSteps[currentStep].prompt);
}

/**
 * Radical approach: captures essential elements, removes everything else, and rebuilds the page
 */
function radicallyCleanPage() {
    console.log("Radically cleaning page for onboarding");
    
    // 1. Capture important elements we need to keep
    // Chat container - we need to preserve it
    const chatContainer = document.querySelector('.chat-container');
    const chatHtml = chatContainer ? chatContainer.outerHTML : '';
    
    // Artist name in header
    const artistNameEl = document.querySelector('.artist-name');
    const artistNameHtml = artistNameEl ? artistNameEl.outerHTML : '<h1 class="artist-name">NEW ARTIST</h1>';
    
    // Year info
    const yearEl = document.querySelector('.artwork-description');
    const yearHtml = yearEl ? yearEl.outerHTML : '<div class="artwork-description">© 2025</div>';
    
    // Video container
    const videoContainer = document.querySelector('.video-container');
    const videoContainerHtml = videoContainer ? videoContainer.outerHTML : '<div class="video-container"><div class="video-fallback">NEW ARTIST</div></div>';
    
    // Orbital tokens
    const orbitalEl = document.querySelector('#orbitalTokens');
    const orbitalHtml = orbitalEl ? orbitalEl.outerHTML : '<div id="orbitalTokens" class="orbital-tokens"></div>';
    
    // 2. Find content container and main container
    const contentContainer = document.querySelector('.content-container');
    const mainContainer = document.querySelector('.main-container');
    
    // 3. RADICAL STEP: Clear almost everything
    if (contentContainer) {
        contentContainer.innerHTML = '';
        
        // 4. Rebuild only what we want to show
        contentContainer.innerHTML = `
            <div class="artist-header">
                ${artistNameHtml}
                ${yearHtml}
            </div>
            ${videoContainerHtml}
            <div class="orbit-container">
                ${orbitalHtml}
            </div>
        `;
    }
    
    // 5. Make sure we keep the chat
    if (mainContainer && chatContainer) {
        // Remove all children except chat
        Array.from(mainContainer.children).forEach(child => {
            if (!child.classList.contains('chat-container')) {
                child.remove();
            }
        });
        
        // If content container was removed, add it back
        if (!mainContainer.querySelector('.content-container')) {
            // Add back the content container if it was removed
            if (contentContainer) {
                mainContainer.insertBefore(contentContainer, chatContainer);
            } else {
                const newContentContainer = document.createElement('div');
                newContentContainer.className = 'content-container';
                newContentContainer.innerHTML = `
                    <div class="artist-header">
                        ${artistNameHtml}
                        ${yearHtml}
                    </div>
                    ${videoContainerHtml}
                    <div class="orbit-container">
                        ${orbitalHtml}
                    </div>
                `;
                mainContainer.insertBefore(newContentContainer, chatContainer);
            }
        }
    }
    
    // 6. Ensure body has clean styling - use off-white/tan color
    document.body.style.backgroundColor = '#f2eee5'; // Warmer off-white/tan color
    
    // Apply canvas styling
    const canvasStyle = document.createElement('style');
    canvasStyle.id = 'canvas-base-style';
    canvasStyle.textContent = `
        body.canvas-mode {
            background-color: #f2eee5 !important; /* Warmer off-white/tan color */
            transition: background-color 0.5s ease;
        }
        
        body.canvas-mode header {
            background-color: #f2eee5 !important;
            border-bottom: 1px solid rgba(0,0,0,0.1);
        }
        
        body.canvas-mode .artist-name {
            color: #666;
            font-family: 'Inter', sans-serif;
        }
        
        body.canvas-mode .video-container {
            border: 1px solid rgba(0,0,0,0.1);
            background-color: #f2eee5;
        }
        
        body.canvas-mode .video-fallback {
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100%;
            color: #999;
        }
        
        body.canvas-mode .orbital-tokens .token {
            opacity: 0.3;
        }
    `;
    
    // Remove existing canvas style if it exists
    const existingCanvasStyle = document.getElementById('canvas-base-style');
    if (existingCanvasStyle) {
        existingCanvasStyle.remove();
    }
    
    document.head.appendChild(canvasStyle);
    
    // 7. Remove any purchase confirmation or other elements that might be visible
    const elementsToRemove = [
        '.token-purchase-confirmation',
        '.token-preview-section',
        '.buy-section',
        '.price-display',
        '.slider-container',
        '.total-price',
        '.ipfs-link',
        '.nft-display'
    ];
    
    elementsToRemove.forEach(selector => {
        document.querySelectorAll(selector).forEach(el => {
            if (el && el.parentNode) {
                el.parentNode.removeChild(el);
            }
        });
    });
    
    // Add canvas mode class to body
    document.body.classList.add('canvas-mode');
}

/**
 * Set up a clean canvas template based on existing artist page
 */
function setupCleanCanvasTemplate() {
    // Add classes to control styling
    document.body.classList.add('canvas-mode');
    document.body.classList.remove('gosheesh-theme', 'jaitea-theme');
    document.body.classList.add('new-artist-theme');
    
    // Hide all elements that shouldn't be visible at start
    const elementsToHide = [
        '.token-purchase-confirmation',
        '.token-preview-section',
        '.buy-section',
        '.video-controls',
        '#buyButton',
        '.price-display',
        '.slider-container',
        '.total-price',
        '.price-related',
        '.token-purchase',
        '.token-purchase-related',
        '.content-preview',
        '.download-content'
    ];
    
    elementsToHide.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
            if (el) {
                // Use dataset to mark as hidden during onboarding
                el.dataset.hiddenDuringOnboarding = 'true';
                el.style.display = 'none';
            }
        });
    });
    
    // Hide all content above chat that might be jumbled
    const contentContainer = document.querySelector('.content-container');
    if (contentContainer) {
        // Hide all direct children except for the artist name section
        Array.from(contentContainer.children).forEach(child => {
            if (!child.classList.contains('artist-header') && !child.classList.contains('video-container')) {
                child.dataset.hiddenDuringOnboarding = 'true';
                child.style.display = 'none';
            }
        });
    }
    
    // Set canvas styling
    const style = document.createElement('style');
    style.id = 'canvas-template-style';
    style.textContent = `
        body.canvas-mode {
            background-color: #f0f0f0;
        }
        
        body.canvas-mode .new-artist-theme header {
            background-color: #f0f0f0;
            border-bottom: 1px solid rgba(0,0,0,0.1);
        }
        
        body.canvas-mode .new-artist-theme .artist-name {
            color: #666;
            font-family: 'Inter', sans-serif;
            transition: all 0.3s ease;
        }
        
        body.canvas-mode .new-artist-theme .artwork-description {
            color: #999;
            transition: all 0.3s ease;
        }
        
        body.canvas-mode .video-container {
            border: 1px solid rgba(0,0,0,0.1);
            background-color: rgba(240,240,240,0.5);
            transition: all 0.3s ease;
        }
        
        body.canvas-mode .placeholder-token::before {
            background: #ddd;
            opacity: 0.5;
        }
        
        /* Only show orbital tokens when name is set */
        body.canvas-mode .orbital-tokens .token {
            opacity: 0;
            transition: opacity 0.5s ease;
        }
        
        body.canvas-mode.has-artist-name .orbital-tokens .token {
            opacity: 0.5;
        }
        
        body.canvas-mode.has-artist-color .orbital-tokens .token {
            opacity: 1;
        }
        
        /* Font transition */
        body.canvas-mode.has-artist-font .artist-name {
            font-weight: bold;
        }
        
        /* Hide all purchase elements during onboarding */
        body.canvas-mode [data-hidden-during-onboarding="true"] {
            display: none !important;
        }
        
        /* Clean slate for video area */
        body.canvas-mode .video-fallback {
            background-color: #f0f0f0;
            color: #999;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        /* Hide any jumbled data */
        body.canvas-mode .token-purchase-confirmation,
        body.canvas-mode .download-content,
        body.canvas-mode .content-preview,
        body.canvas-mode .ipfs-link,
        body.canvas-mode .purchase-cta {
            display: none !important;
        }
    `;
    
    // Remove existing style if it exists
    const existingStyle = document.getElementById('canvas-template-style');
    if (existingStyle) {
        existingStyle.remove();
    }
    
    document.head.appendChild(style);
    
    // Make sure we have blank placeholder tokens
    updateOrbitalTokensDisplay();
}

/**
 * Restore the original layout elements and apply proper styling after onboarding
 */
function restoreOriginalLayout() {
    console.log("Restoring original layout after onboarding");
    
    // Remove canvas-specific styles
    const canvasStyle = document.getElementById('canvas-base-style');
    if (canvasStyle) {
        canvasStyle.remove();
    }
    
    // Remove classes added during onboarding
    document.body.classList.remove('incomplete-profile');
    document.body.classList.remove('onboarding-active');
    
    // Create new elements to replace removed ones
    const mainContainer = document.querySelector('.main-container') || document.body;
    
    // Create and add token purchase confirmation
    const confirmationDiv = document.createElement('div');
    confirmationDiv.className = 'token-purchase-confirmation';
    confirmationDiv.innerHTML = `
        <div class="confirmation-check">✓</div>
        <div>You now own 4,995,546 ${artistData.name} Artistocks!</div>
        <div>Your purchase is complete and you are now officially in the orbit.</div>
    `;
    mainContainer.appendChild(confirmationDiv);
    
    // Create buy section with slider
    const buySection = document.createElement('div');
    buySection.className = 'token-preview-section';
    buySection.innerHTML = `
        <div class="price-display">$1</div>
        <div class="pricing-details">includes permanent access to featured download</div>
        <div class="slider-container">
            <input type="range" id="tokenSlider" min="2000" max="1000000" value="200000" class="slider">
        </div>
        <div class="token-amounts">
            <div>Artistocks: <span id="tokenAmount">200,000</span></div>
            <div>Total: $<span id="totalPrice">100.00</span></div>
        </div>
        <button id="buyButton" class="buy-button">Buy Now</button>
    `;
    mainContainer.appendChild(buySection);
    
    // Create video controls
    const videoContainer = document.querySelector('.video-container');
    if (videoContainer) {
        const videoControls = document.createElement('div');
        videoControls.className = 'video-controls';
        videoControls.innerHTML = `
            <button class="control-button play-pause">Play</button>
            <button class="control-button mute">Mute</button>
            <button class="control-button fullscreen">Fullscreen</button>
        `;
        videoContainer.appendChild(videoControls);
    }
    
    // Add the artist to the wallet if not already there
    addArtistToWallet();
}

/**
 * Process user input for the current onboarding step
 * @param {string|File} input - User input or uploaded file
 * @returns {string} - Response message
 */
function processOnboardingInput(input) {
    if (!onboardingActive || currentStep >= onboardingSteps.length) {
        return null;
    }
    
    const step = onboardingSteps[currentStep];
    const response = step.process(input);
    
    // Update the UI with the new artist data
    applyArtistProfileToUI();
    
    // Move to next step
    currentStep++;
    
    // If there are more steps, show the next prompt
    if (currentStep < onboardingSteps.length) {
        // Clear any existing timeout
        if (window.onboardingTimeoutId) {
            clearTimeout(window.onboardingTimeoutId);
        }
        
        // Set new timeout and save the ID
        window.onboardingTimeoutId = setTimeout(() => {
            // Only proceed if onboarding is still active
            if (!onboardingActive) {
                console.log("Onboarding was deactivated, skipping next step");
                return;
            }
            
            sendChatbotMessage(onboardingSteps[currentStep].prompt);
            
            // Show or hide upload button based on the step
            const uploadButton = document.getElementById('chatUploadButton');
            if (uploadButton) {
                // Show upload button for steps that need file uploads
                if (onboardingSteps[currentStep].field === 'logo' || 
                    onboardingSteps[currentStep].field === 'media') {
                    uploadButton.style.display = 'block';
                } else {
                    uploadButton.style.display = 'none';
                }
            }
            
            // Clear the timeout ID after it has executed
            window.onboardingTimeoutId = null;
        }, 500);
    } else {
        // Onboarding complete - set up final state
        completeOnboarding();
        
        // Show final message
        setTimeout(() => {
            sendChatbotMessage("Your artist profile is complete! You can now upload files to create new Artistocks. Just drag and drop them into the chat.");
        }, 1000);
    }
    
    return response;
}

/**
 * Complete the onboarding and set up the final artist profile
 */
function completeOnboarding() {
    console.log("Setting up completed artist profile");
    
    // 1. First, we'll make a radical transformation by cloning from a template
    cloneTemplateProfile();
    
    // 2. Remove canvas mode and add completed profile class
    document.body.classList.remove('canvas-mode');
    document.body.classList.add('completed-profile');
    
    // 3. Apply artist's chosen theme
    applyFinalTheme();
    
    // 4. Set up the artist content
    setupArtistContent();
    
    // 5. Show all the purchase UI elements that should be visible
    showPurchaseElements();
    
    // 6. Reset onboarding state
    onboardingActive = false;
    window.onboardingActive = false;
    currentStep = 0;
}

/**
 * Show all purchase elements that should be visible for a completed profile
 */
function showPurchaseElements() {
    console.log("Setting up purchase elements");
    
    // Make sure all needed elements are visible and properly styled
    const elementsToShow = [
        '.token-preview-section',
        '.price-display',
        '.slider-container', 
        '.total-price',
        '.buy-button',
        '#buyButton'
    ];
    
    // Show all required elements
    elementsToShow.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
            if (el) {
                el.style.display = 'block';
                el.style.visibility = 'visible';
                el.style.opacity = '1';
                
                // Remove any data attributes that might hide it
                if (el.dataset) {
                    delete el.dataset.hiddenDuringOnboarding;
                }
            }
        });
    });
    
    // Set the price display to $1
    const priceDisplay = document.querySelector('.price-display');
    if (priceDisplay) {
        priceDisplay.textContent = '$1';
    }
    
    // Make sure slider exists and is properly set up
    setupPurchaseSection();
    
    // Force display block for token preview section
    const previewSection = document.querySelector('.token-preview-section');
    if (previewSection) {
        previewSection.style.display = 'block';
        previewSection.style.visibility = 'visible';
        previewSection.style.opacity = '1';
    }
    
    // Hide the purchase confirmation initially
    const confirmation = document.querySelector('.token-purchase-confirmation');
    if (confirmation) {
        confirmation.style.display = 'none';
    }
    
    // Add the artist to the wallet if not already there
    addArtistToWallet(0);
}

/**
 * Apply the final theme with artist's selected colors
 */
function applyFinalTheme() {
    // Create final theme style
    const style = document.createElement('style');
    style.id = 'final-artist-theme';
    style.textContent = `
        body.completed-profile {
            background-color: ${artistData.theme.primaryColor} !important;
        }
        
        .completed-profile header,
        .completed-profile .content-container,
        .completed-profile .main-container {
            background-color: ${artistData.theme.primaryColor} !important;
        }
        
        .completed-profile .artist-name {
            font-family: ${artistData.theme.fontFamily} !important;
            color: #000 !important;
            font-weight: bold !important;
        }
        
        .completed-profile .orbital-tokens .token::before {
            background: linear-gradient(135deg, 
                ${artistData.theme.gradientStart}, 
                ${artistData.theme.gradientMiddle}, 
                ${artistData.theme.gradientEnd}
            ) !important;
        }
        
        .completed-profile .buy-button,
        .completed-profile #buyButton {
            background-color: ${artistData.theme.accentColor} !important;
            display: block !important;
        }
        
        .completed-profile .token-preview-section {
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
        }
        
        .completed-profile .price-display {
            display: block !important;
        }
        
        .completed-profile .slider-container {
            display: block !important;
        }
        
        .completed-profile .token-purchase-confirmation {
            opacity: 0;
            display: none;
            transition: opacity 0.3s ease;
        }
        
        .completed-profile.purchase-complete .token-purchase-confirmation {
            opacity: 1;
            display: block;
        }
        
        .completed-profile.purchase-complete .token-preview-section {
            display: none;
        }
    `;
    
    // Remove existing styles
    ['canvas-template-style', 'artist-theme-color-style', 'completed-profile-style', 'final-artist-theme'].forEach(id => {
        const existingStyle = document.getElementById(id);
        if (existingStyle) existingStyle.remove();
    });
    
    document.head.appendChild(style);
    
    // Force apply theme to header and body
    const header = document.querySelector('header');
    if (header) {
        header.style.backgroundColor = artistData.theme.primaryColor;
    }
    document.body.style.backgroundColor = artistData.theme.primaryColor;
    
    // Force repaint
    document.body.offsetHeight;
}

/**
 * Set up the purchase section
 */
function setupPurchaseSection() {
    // Find or create the token preview section
    let purchaseSection = document.querySelector('.token-preview-section');
    if (!purchaseSection) {
        purchaseSection = document.createElement('div');
        purchaseSection.className = 'token-preview-section';
        
        // Add it to the content container
        const contentContainer = document.querySelector('.content-container');
        if (contentContainer) {
            contentContainer.appendChild(purchaseSection);
        } else {
            document.body.appendChild(purchaseSection);
        }
    }
    
    // Ensure the purchase section is visible
    purchaseSection.style.display = 'block';
    purchaseSection.style.visibility = 'visible';
    purchaseSection.style.opacity = '1';
    
    // Make sure it has the necessary elements
    let priceDisplay = purchaseSection.querySelector('.price-display');
    if (!priceDisplay) {
        priceDisplay = document.createElement('div');
        priceDisplay.className = 'price-display';
        priceDisplay.textContent = '$1';
        purchaseSection.appendChild(priceDisplay);
    }
    
    let pricingDetails = purchaseSection.querySelector('.pricing-details');
    if (!pricingDetails) {
        pricingDetails = document.createElement('div');
        pricingDetails.className = 'pricing-details';
        pricingDetails.textContent = 'includes permanent access to featured download';
        purchaseSection.appendChild(pricingDetails);
    }
    
    // Make sure slider exists
    let sliderContainer = purchaseSection.querySelector('.slider-container');
    if (!sliderContainer) {
        sliderContainer = document.createElement('div');
        sliderContainer.className = 'slider-container';
        sliderContainer.innerHTML = `
            <input type="range" id="tokenSlider" min="2000" max="1000000" value="200000" class="slider">
        `;
        purchaseSection.appendChild(sliderContainer);
    }
    
    // Make sure token amounts exist
    let tokenAmounts = purchaseSection.querySelector('.token-amounts');
    if (!tokenAmounts) {
        tokenAmounts = document.createElement('div');
        tokenAmounts.className = 'token-amounts';
        tokenAmounts.innerHTML = `
            <div>Artistocks: <span id="tokenAmount">200,000</span></div>
            <div>Total: $<span id="totalPrice">100.00</span></div>
        `;
        purchaseSection.appendChild(tokenAmounts);
    }
    
    // Make sure buy button exists
    let buyButton = purchaseSection.querySelector('#buyButton');
    if (!buyButton) {
        buyButton = document.createElement('button');
        buyButton.id = 'buyButton';
        buyButton.className = 'buy-button';
        buyButton.textContent = 'Buy Now';
        purchaseSection.appendChild(buyButton);
    }
    
    // Show all elements
    purchaseSection.querySelectorAll('*').forEach(el => {
        el.style.display = '';
        el.style.visibility = 'visible';
        el.style.opacity = '1';
    });
    
    // Set up slider functionality
    const tokenSlider = document.getElementById('tokenSlider');
    const tokenAmountDisplay = document.getElementById('tokenAmount');
    const totalPriceDisplay = document.getElementById('totalPrice');
    
    if (tokenSlider && tokenAmountDisplay && totalPriceDisplay) {
        // Update values immediately
        const amount = parseInt(tokenSlider.value);
        const price = (amount / 2000).toFixed(2); // $1 per 2000 tokens
        tokenAmountDisplay.textContent = amount.toLocaleString();
        totalPriceDisplay.textContent = price;
        
        // Add event listener if not already added
        tokenSlider.addEventListener('input', () => {
            const amount = parseInt(tokenSlider.value);
            const price = (amount / 2000).toFixed(2); // $1 per 2000 tokens
            
            tokenAmountDisplay.textContent = amount.toLocaleString();
            totalPriceDisplay.textContent = price;
        });
    }
    
    // Set up buy button
    setupBuyButton();
}

/**
 * Set up the artist video if one was uploaded
 */
function setupArtistVideo() {
    const videoContainer = document.querySelector('.video-container');
    const video = document.getElementById('artistVideo') || document.querySelector('video');
    const videoFallback = document.querySelector('.video-fallback');
    
    if (!video && videoContainer) {
        // If no video element exists, create one
        const newVideo = document.createElement('video');
        newVideo.id = 'artistVideo';
        newVideo.controls = true;
        newVideo.style.width = '100%';
        newVideo.style.display = 'none'; // Hide initially
        videoContainer.appendChild(newVideo);
    }
    
    // Get the video element again in case we just created it
    const videoElement = document.getElementById('artistVideo') || document.querySelector('video');
    
    if (videoElement && videoContainer) {
        // If we have a real video, use it
        if (uploadedAssets.media.some(asset => asset.type && asset.type.startsWith('video/'))) {
            const videoAsset = uploadedAssets.media.find(asset => asset.type && asset.type.startsWith('video/'));
            
            // Create or get video source
            let videoSource = videoElement.querySelector('source');
            if (!videoSource) {
                videoSource = document.createElement('source');
                videoElement.appendChild(videoSource);
            }
            
            // Set video source
            if (videoAsset.file) {
                videoSource.src = URL.createObjectURL(videoAsset.file);
            } else if (videoAsset.url) {
                videoSource.src = videoAsset.url;
            } else {
                // Mock video source for testing
                videoSource.src = 'data:video/mp4;base64,AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDEAAAAIZnJlZQAAAu1tZGF0AAACrQYF//+p3EXpvebZSLeWLNgg2SPu73gyNjQgLSBjb3JlIDE0MiByMjQ4OSA5MzRlNTU3IC0gSC4yNjQvTVBFRy00IEFWQyBjb2RlYyAtIENvcHlsZWZ0IDIwMDMtMjAxNSAtIGh0dHA6Ly93d3cudmlkZW9sYW4ub3JnL3gyNjQuaHRtbCAtIG9wdGlvbnM6IGNhYmFjPTEgcmVmPTMgZGVibG9jaz0xOjA6MCBhbmFseXNlPTB4MzoweDExMyBtZT1oZXggc3VibWU9NyBwc3k9MSBwc3lfcmQ9MS4wMDowLjAwIG1peGVkX3JlZj0xIG1lX3JhbmdlPTE2IGNocm9tYV9tZT0xIHRyZWxsaXM9MSA4eDhkY3Q9MSBjcW09MCBkZWFkem9uZT0yMSwxMSBmYXN0X3Bza2lwPTEgY2hyb21hX3FwX29mZnNldD0tMiB0aHJlYWRzPTYgbG9va2FoZWFkX3RocmVhZHM9MSBzbGljZWRfdGhyZWFkcz0wIG5yPTAgZGVjaW1hdGU9MSBpbnRlcmxhY2VkPTAgYmx1cmF5X2NvbXBhdD0wIGNvbnN0cmFpbmVkX2ludHJhPTAgYmZyYW1lcz0zIGJfcHlyYW1pZD0yIGJfYWRhcHQ9MSBiX2JpYXM9MCBkaXJlY3Q9MSB3ZWlnaHRiPTEgb3Blbl9nb3A9MCB3ZWlnaHRwPTIga2V5aW50PTI1MCBrZXlpbnRfbWluPTEgc2NlbmVjdXQ9NDAgaW50cmFfcmVmcmVzaD0wIHJjX2xvb2thaGVhZD00MCByYz1jcmYgbWJ0cmVlPTEgY3JmPTI4LjAgcWNvbXA9MC42MCBxcG1pbj0wIHFwbWF4PTY5IHFwc3RlcD00IGlwX3JhdGlvPTEuNDAgYXE9MToxLjAwAIAAAAAOZYiEAD//8m+P5OXfBeLGOfKT';
            }
            
            videoSource.type = videoAsset.type || 'video/mp4';
            
            // Show video, hide fallback
            videoElement.style.display = 'block';
            videoElement.load();
            if (videoFallback) videoFallback.style.display = 'none';
            
            // Add video controls if not present
            const videoControls = document.querySelector('.video-controls');
            if (!videoControls) {
                const newControls = document.createElement('div');
                newControls.className = 'video-controls';
                newControls.innerHTML = `
                    <button class="control-button play-pause">Play</button>
                    <button class="control-button mute">Mute</button>
                    <button class="control-button fullscreen">Fullscreen</button>
                `;
                videoContainer.appendChild(newControls);
            }
        } else {
            // No video, show fallback
            if (videoElement) videoElement.style.display = 'none';
            if (videoFallback) {
                videoFallback.style.display = 'flex';
                videoFallback.textContent = artistData.name || 'NEW ARTIST';
            }
        }
    }
}

/**
 * Set up buy button event
 */
function setupBuyButton() {
    const buyButton = document.getElementById('buyButton');
    if (!buyButton) return;
    
    buyButton.addEventListener('click', () => {
        // Get the token amount
        const tokenAmountEl = document.getElementById('tokenAmount');
        const amount = tokenAmountEl ? parseInt(tokenAmountEl.textContent.replace(/,/g, '')) : 200000;
        
        // Update confirmation with correct amount
        const confirmationAmount = document.querySelector('.token-purchase-confirmation .token-amount');
        if (confirmationAmount) {
            confirmationAmount.textContent = amount.toLocaleString();
        }
        
        // Show confirmation
        const confirmationElement = document.querySelector('.token-purchase-confirmation');
        if (confirmationElement) {
            confirmationElement.style.display = 'block';
        }
        
        // Add tokens to wallet
        addArtistToWallet(amount);
        
        // Mark purchase as complete
        document.body.classList.add('purchase-complete');
        
        // Hide purchase section
        const purchaseSection = document.querySelector('.token-preview-section');
        if (purchaseSection) {
            purchaseSection.style.display = 'none';
        }
    });
}

/**
 * Add the artist to the wallet display
 */
function addArtistToWallet(tokenAmount = 4995546) {
    // Find the wallet assets section
    const walletPanel = document.querySelector('.wallet-panel');
    if (!walletPanel) return;
    
    // Check if this artist is already in the wallet
    const existingArtist = Array.from(walletPanel.querySelectorAll('.wallet-artist')).find(el => 
        el.textContent.includes(artistData.name)
    );
    
    if (!existingArtist) {
        // Create new artist section
        const artistSection = document.createElement('div');
        artistSection.className = 'wallet-artist';
        
        // Add artist name
        const artistName = document.createElement('div');
        artistName.className = 'artist-name';
        artistName.textContent = artistData.name;
        
        // Add token Lightning bolt icon
        const artistTokens = document.createElement('div');
        artistTokens.className = 'artist-tokens';
        
        // Create lightning bolt icon
        const lightning = document.createElement('span');
        lightning.className = 'lightning-icon';
        lightning.innerHTML = '⚡';
        
        // Create token amount and name
        const tokenText = document.createTextNode(` ${tokenAmount.toLocaleString()} ${artistData.name} Artistocks`);
        
        // Build the structure
        artistTokens.appendChild(lightning);
        artistTokens.appendChild(tokenText);
        
        artistSection.appendChild(artistName);
        artistSection.appendChild(artistTokens);
        
        // Add download links for content if we have any
        if (uploadedAssets.media.length > 0) {
            uploadedAssets.media.forEach((asset, index) => {
                const downloadLink = document.createElement('div');
                downloadLink.className = 'download-link';
                
                // Create note icon
                const noteIcon = document.createElement('span');
                noteIcon.className = 'note-icon';
                noteIcon.innerHTML = '🎵';
                
                // Create download text with asset name
                const assetName = asset.filename || `Asset #${index + 1}`;
                downloadLink.appendChild(noteIcon);
                downloadLink.appendChild(document.createTextNode(` ${assetName}`));
                
                // Add download button
                const downloadButton = document.createElement('button');
                downloadButton.className = 'download-button';
                downloadButton.textContent = 'Download';
                downloadLink.appendChild(downloadButton);
                
                artistSection.appendChild(downloadLink);
            });
        }
        
        // Add to wallet panel
        walletPanel.appendChild(artistSection);
    }
}

/**
 * Send a chatbot message to the UI
 */
function sendChatbotMessage(message) {
    // Don't define the function here - we're now using the window.sendChatbotMessage 
    // function defined in script.js to ensure consistency
    
    // Call the global method if available, otherwise fallback
    if (window.sendChatbotMessage) {
        window.sendChatbotMessage(message);
    } else {
        // Fallback implementation if needed
        const chatMessage = document.createElement('div');
        chatMessage.className = 'chat-message bot';
        chatMessage.textContent = message;
        
        // Get or create chat messages container
        let chatMessages = document.getElementById('chatMessages');
        if (!chatMessages) {
            chatMessages = document.createElement('div');
            chatMessages.id = 'chatMessages';
            chatMessages.className = 'chat-messages';
            document.querySelector('.chat-input-container').before(chatMessages);
        }
        
        chatMessages.appendChild(chatMessage);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
}

/**
 * Display user message in the chat
 */
function displayUserMessage(message) {
    // Don't define the function here - we're now using the window.displayUserMessage 
    // function defined in script.js to ensure consistency
    
    // Call the global method if available, otherwise fallback
    if (window.displayUserMessage) {
        window.displayUserMessage(message);
    } else {
        // Fallback implementation if needed
        const userMessage = document.createElement('div');
        userMessage.className = 'chat-message user';
        userMessage.textContent = message;
        
        // Get chat messages container
        const chatMessages = document.getElementById('chatMessages');
        if (chatMessages) {
            chatMessages.appendChild(userMessage);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    }
}

/**
 * Save artist data to config files
 */
function saveArtistData() {
    console.log('Saving artist data:', artistData);
    
    // In a real implementation, this would make an API call to save the data
    // For now, we'll just log the actions that would be taken
    
    console.log(`Artist data would be saved to: /artists/${artistData.name.toLowerCase().replace(/\s+/g, '-')}/config.json`);
    console.log(`Assets would be saved to: /assets/${artistData.name.toLowerCase().replace(/\s+/g, '-')}/`);
    
    // Simulate updating the global config.json file
    console.log('Global config.json would be updated with new artist data');
    
    // Update the DOM to show artist information correctly
    applyArtistProfileToUI();
    
    // Add the artist to the wallet assets if not already there
    addArtistToWallet();
}

/**
 * Deploy artist contracts to the blockchain
 */
function deployArtistContracts() {
    console.log('Deploying artist contracts...');
    
    // In a real implementation, this would call tokenFactory.js to deploy the contracts
    const artistId = artistData.name.toLowerCase().replace(/\s+/g, '-');
    console.log(`ERC-20 token would be deployed for ${artistData.name} with 1,000,000,000 supply`);
    console.log(`ERC-721 contract would be deployed for ${artistData.name} NFTs`);
    
    // Simulate contract addresses
    const erc20Address = `0x${generateRandomHex(40)}`;
    const erc721Address = `0x${generateRandomHex(40)}`;
    
    console.log(`ERC-20 deployed at: ${erc20Address}`);
    console.log(`ERC-721 deployed at: ${erc721Address}`);
}

/**
 * Update the orbitMap.json file with new artist data
 */
function updateOrbitMap() {
    console.log('Updating orbit map...');
    
    // In a real implementation, this would update the orbitMap.json file
    const artistId = artistData.name.toLowerCase().replace(/\s+/g, '-');
    console.log(`orbitMap.json would be updated to include: ${artistId} linked to ${userWalletAddress}`);
}

/**
 * Reset the onboarding state completely
 * This can be called to force a clean state if issues occur
 */
function resetOnboarding() {
    console.log("Forcibly resetting onboarding state");
    
    // Clear any pending timeouts
    if (window.onboardingTimeoutId) {
        clearTimeout(window.onboardingTimeoutId);
        window.onboardingTimeoutId = null;
    }
    
    // Reset all state variables
    onboardingActive = false;
    window.onboardingActive = false;
    currentStep = 0;
    
    // Reset artist data
    artistData = {
        name: '',
        displayName: '',
        tokenName: '',
        artworkTitle: 'Untitled',
        artworkYear: new Date().getFullYear().toString(),
        tokenPrice: 0.0005,
        videoSrc: '',
        theme: {
            primaryColor: '#0a1a3b',
            accentColor: '#4073ff',
            gradientStart: '#d4af37',
            gradientMiddle: '#f9f295',
            gradientEnd: '#d4af37',
            fontFamily: 'Bungee, cursive'
        },
        orbitalTokens: [
            { name: "ARTIST 1", angle: 0 },
            { name: "ARTIST 2", angle: 72 },
            { name: "ARTIST 3", angle: 144 },
            { name: "ARTIST 4", angle: 216 },
            { name: "ARTIST 5", angle: 288 }
        ]
    };
    
    uploadedAssets = {
        logo: null,
        media: []
    };
    
    // Hide the upload button
    const uploadButton = document.getElementById('chatUploadButton');
    if (uploadButton) {
        uploadButton.style.display = 'none';
    }
    
    // Optional: Clear the chat messages
    const chatMessages = document.getElementById('chatMessages');
    if (chatMessages) {
        chatMessages.innerHTML = '';
    }
    
    console.log("Onboarding state reset complete");
    
    // Send a message to the user
    sendChatbotMessage("Onboarding process has been reset. Type 'zeyoda' to start again.");
}

/**
 * Utility function to lighten a color
 * @param {string} color - Hex color code
 * @param {number} factor - Factor by which to lighten (0-1)
 * @returns {string} - Lightened hex color
 */
function lightenColor(color, factor) {
    // Convert hex to RGB
    let r = parseInt(color.substring(1, 3), 16);
    let g = parseInt(color.substring(3, 5), 16);
    let b = parseInt(color.substring(5, 7), 16);
    
    // Lighten RGB values
    r = Math.round(r + (255 - r) * factor);
    g = Math.round(g + (255 - g) * factor);
    b = Math.round(b + (255 - b) * factor);
    
    // Convert back to hex
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/**
 * Generate random hex string of specified length
 * @param {number} length - Length of hex string
 * @returns {string} - Random hex string
 */
function generateRandomHex(length) {
    let result = '';
    const characters = '0123456789abcdef';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

/**
 * Show all elements that should be visible for a completed profile
 */
function showCompletedProfileElements() {
    // Remove any hiding styles
    const elementsToShow = [
        '.token-preview-section',
        '.video-controls',
        '#buyButton'
    ];
    
    // Show required elements
    elementsToShow.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
            if (el) el.style.display = '';
        });
    });
    
    // Make sure token purchase confirmation is visible and properly styled
    const confirmation = document.querySelector('.token-purchase-confirmation');
    if (confirmation) {
        confirmation.style.display = 'block';
        confirmation.style.visibility = 'visible';
        confirmation.style.opacity = '1';
        confirmation.innerHTML = `
            <div class="confirmation-check">✓</div>
            <div>You now own 4,995,546 ${artistData.name} Artistocks!</div>
            <div>Your purchase is complete and you are now officially in the orbit.</div>
        `;
    }
    
    // Add the artist to the wallet if not already there
    addArtistToWallet();
    
    // Update the orbital tokens to use the correct styling
    updateOrbitalTokensDisplay();
}

/**
 * Apply styling for a completed artist profile
 */
function applyCompletedProfileStyling() {
    // Apply proper artist theme
    const style = document.createElement('style');
    style.id = 'completed-profile-style';
    style.textContent = `
        .new-artist-theme {
            --primary-color: ${artistData.theme.primaryColor};
            --accent-color: ${artistData.theme.accentColor};
            --gradient-start: ${artistData.theme.gradientStart};
            --gradient-middle: ${artistData.theme.gradientMiddle};
            --gradient-end: ${artistData.theme.gradientEnd};
            --artist-font: ${artistData.theme.fontFamily};
        }
        
        .new-artist-theme .artist-name,
        .new-artist-theme #artworkTitle {
            font-family: ${artistData.theme.fontFamily};
            color: #000;
            font-weight: bold;
        }
        
        .new-artist-theme header {
            background-color: ${artistData.theme.primaryColor};
            border-bottom: 1px solid rgba(0,0,0,0.1);
        }
        
        .new-artist-theme .buy-button,
        .new-artist-theme .login-btn {
            background-color: ${artistData.theme.accentColor};
        }
        
        .new-artist-theme .orbital-tokens .token::before {
            background: linear-gradient(135deg, 
                ${artistData.theme.gradientStart}, 
                ${artistData.theme.gradientMiddle}, 
                ${artistData.theme.gradientEnd}
            );
            box-shadow: 0 0 15px rgba(0,0,0,0.2);
        }
        
        .new-artist-theme .token-purchase-confirmation {
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
            margin: 20px auto;
            text-align: center;
            padding: 20px;
        }
        
        .new-artist-theme .confirmation-check {
            font-size: 2rem;
            color: #4CAF50;
            margin-bottom: 10px;
        }
        
        .new-artist-theme .token-preview-section {
            margin: 20px auto;
            max-width: 600px;
            text-align: center;
            padding: 20px;
            background-color: rgba(255,255,255,0.7);
            border-radius: 10px;
        }
        
        .new-artist-theme #buyButton {
            margin-top: 20px;
            padding: 10px 30px;
            font-size: 1.2rem;
            background-color: ${artistData.theme.accentColor};
            border: none;
            border-radius: 5px;
            color: white;
            cursor: pointer;
        }
    `;
    
    // Remove existing style if it exists
    const existingStyle = document.getElementById('completed-profile-style');
    if (existingStyle) {
        existingStyle.remove();
    }
    
    document.head.appendChild(style);
    
    // Update the orbital tokens with final styling
    updateOrbitalTokensDisplay();
}

/**
 * Clone from an existing template profile to ensure it works exactly the same
 */
function cloneTemplateProfile() {
    // Grab template design and structure from an existing profile (GOSHEESH or JAI TEA)
    const templateProfile = document.querySelector('.gosheesh-theme, .jaitea-theme');
    
    if (!templateProfile) {
        console.warn("Could not find a template profile to clone from");
        return;
    }
    
    // Get the main content container
    const mainContainer = document.querySelector('.main-container');
    if (!mainContainer) return;
    
    // Keep chat container reference as we'll need to preserve it
    const chatContainer = document.querySelector('.chat-container');
    
    // Clone the template structure but not the content
    const templateContentContainer = templateProfile.querySelector('.content-container');
    if (templateContentContainer) {
        // Create a copy of the template structure
        const clonedContainer = templateContentContainer.cloneNode(false);
        
        // Find our content container
        const ourContentContainer = document.querySelector('.new-artist-theme .content-container, .content-container');
        
        // Extract essential elements from our current content
        let artistHeader, videoContainer, orbitContainer;
        
        if (ourContentContainer) {
            artistHeader = ourContentContainer.querySelector('.artist-header');
            videoContainer = ourContentContainer.querySelector('.video-container');
            orbitContainer = ourContentContainer.querySelector('.orbit-container');
            
            // Replace our container with the cloned one
            if (ourContentContainer.parentNode) {
                ourContentContainer.parentNode.replaceChild(clonedContainer, ourContentContainer);
            }
        } else {
            // If we don't have a content container, create one from the template
            mainContainer.insertBefore(clonedContainer, chatContainer);
        }
        
        // Add back our important content
        if (artistHeader) clonedContainer.appendChild(artistHeader);
        if (videoContainer) clonedContainer.appendChild(videoContainer);
        if (orbitContainer) clonedContainer.appendChild(orbitContainer);
    }
}

/**
 * Set up artist content (video, purchase, etc.)
 */
function setupArtistContent() {
    // Update artist name everywhere
    document.querySelectorAll('.artist-name').forEach(el => {
        el.textContent = artistData.name;
        el.style.fontFamily = artistData.theme.fontFamily;
    });
    
    // Set up the video if media was uploaded
    if (uploadedAssets.media.length > 0) {
        setupArtistVideo();
    }
    
    // Add to wallet (but only show the artist name, not tokens yet)
    addArtistToWallet(0);
    
    // Set up token purchase confirmation but keep it hidden initially
    setupPurchaseConfirmation();
}

/**
 * Set up purchase confirmation (initially hidden)
 */
function setupPurchaseConfirmation() {
    // Check if confirmation element exists
    let confirmationElement = document.querySelector('.token-purchase-confirmation');
    
    // If not, create it
    if (!confirmationElement) {
        confirmationElement = document.createElement('div');
        confirmationElement.className = 'token-purchase-confirmation';
        
        // Add to content container
        const contentContainer = document.querySelector('.content-container');
        if (contentContainer) {
            contentContainer.appendChild(confirmationElement);
        } else {
            document.body.appendChild(confirmationElement);
        }
    }
    
    // Hide initially
    confirmationElement.style.display = 'none';
    
    // Set up the content
    confirmationElement.innerHTML = `
        <div class="confirmation-check">✓</div>
        <div>You now own <span class="token-amount">200,000</span> ${artistData.name} Artistocks!</div>
        <div>Your purchase is complete and you are now officially in the orbit.</div>
    `;
}

// Make functions available globally
window.checkForSafeword = checkForSafeword; 