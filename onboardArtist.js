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
                }
                
                return `Media asset uploaded successfully! What title would you like to give to your artwork?`;
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
        // Start onboarding if user is authenticated
        if (isAuthenticated) {
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
 * Start the onboarding process
 */
function startOnboarding() {
    if (onboardingActive) {
        console.log("Onboarding already active, ignoring start request");
        return;
    }
    
    // Clear any existing timeout
    if (window.onboardingTimeoutId) {
        clearTimeout(window.onboardingTimeoutId);
        window.onboardingTimeoutId = null;
    }
    
    console.log("Starting onboarding process");
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
    
    // Make sure upload button is hidden initially
    const uploadButton = document.getElementById('chatUploadButton');
    if (uploadButton) {
        uploadButton.style.display = 'none';
    }
    
    // Show the first prompt
    sendChatbotMessage(onboardingSteps[currentStep].prompt);
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
    }
    
    return response;
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