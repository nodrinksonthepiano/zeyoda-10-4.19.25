/**
 * ZEYODA Wallet Module
 * Handles user asset tracking and wallet UI display
 */

// Wallet state management
let userAssets = loadUserAssets();
let isWalletOpen = false;
let walletInitialized = false;

// Initialize immediately to make functions available
if (typeof window !== 'undefined') {
    // Attach to window for global access
    window.wallet = {
        init: initWallet,
        update: updateWalletDisplay,
        addTokens: addArtistTokens,
        addDownload: addArtistDownload,
        clear: clearAssets,
        onPurchaseComplete: onPurchaseComplete,
        loadAssets: loadUserAssets,
        hasAssets: hasAssets,
        hasArtistTokens: hasArtistTokens,
        hasAnyArtistAssets: hasAnyArtistAssets,
        // Add generateIPFSHash reference for download functionality
        generateIPFSHash: function() {
            return generateIPFSHash();
        },
        toggleWallet: toggleWallet
    };
    
    // Initialize wallet on page load
    window.addEventListener('DOMContentLoaded', function() {
        console.log('DOMContentLoaded: initializing wallet');
        setTimeout(function() {
            initWallet();
            updateWalletDisplay();
        }, 500);
    });
}

/**
 * Initialize the wallet module
 * Should be called after user authentication
 */
function initWallet() {
    if (walletInitialized) {
        console.log('Wallet already initialized, updating display');
        updateWalletDisplay();
        return;
    }
    
    console.log('Initializing wallet module');
    
    // Check if user is logged in with Magic
    const isLoggedIn = localStorage.getItem('isAuthenticated') === 'true';
    console.log('User login status:', isLoggedIn);
    
    // Always initialize the wallet, even if not logged in yet
    // This ensures it's ready when the user logs in
    walletInitialized = true;
    
    // For testing - add some test assets if none exist
    if (isLoggedIn && !hasAssets()) {
        console.log('Adding test assets for debugging');
        // Uncomment for testing
        addArtistTokens('gosheesh', 100);
    }
    
    // Update the wallet display based on current assets
    updateWalletDisplay();
    
    // Set up click handler to toggle display
    const walletDisplay = document.getElementById('walletDisplay');
    if (walletDisplay) {
        walletDisplay.addEventListener('click', function() {
            console.log('Wallet clicked');
            toggleWallet();
        });
    } else {
        console.error('Wallet display element not found during initialization');
    }
}

/**
 * Toggle wallet asset panel visibility
 */
function toggleWallet() {
    // Get or create the wallet panel
    let walletPanel = document.getElementById('walletPanel');
    
    if (!walletPanel) {
        // Create wallet panel if it doesn't exist
        createWalletPanel();
        walletPanel = document.getElementById('walletPanel');
    }
    
    // Toggle visibility
    isWalletOpen = !isWalletOpen;
    
    if (isWalletOpen) {
        // No need for body class with popup design
        walletPanel.style.display = 'block';
        // Add transition after display is set
        setTimeout(() => {
            walletPanel.style.opacity = '1';
            walletPanel.style.transform = 'translateY(0)';
        }, 10);
    } else {
        // No need for body class with popup design
        walletPanel.style.opacity = '0';
        walletPanel.style.transform = 'translateY(-10px)';
        // Hide after transition
        setTimeout(() => {
            walletPanel.style.display = 'none';
        }, 300);
    }
}

/**
 * Create wallet panel with assets
 */
function createWalletPanel() {
    // Remove any existing wallet panel
    let existingPanel = document.getElementById('walletPanel');
    if (existingPanel) {
        existingPanel.remove();
    }
    
    // Create wallet panel
    const walletPanel = document.createElement('div');
    walletPanel.id = 'walletPanel';
    walletPanel.className = 'wallet-panel';
    walletPanel.style.opacity = '0';
    walletPanel.style.transform = 'translateY(-10px)';
    
    // Add close button
    const closeBtn = document.createElement('span');
    closeBtn.className = 'close-btn';
    closeBtn.innerHTML = '×';
    closeBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        toggleWallet();
    });
    
    // Add title
    const title = document.createElement('h2');
    title.textContent = 'Your Assets';
    
    // Add assets list
    const assetList = document.createElement('div');
    assetList.className = 'asset-list';
    
    // Check if user has any assets
    let hasAnyAssets = false;
    
    // Populate with assets
    for (const artistId in userAssets) {
        const artistAssets = userAssets[artistId];
        
        // Skip if no assets for this artist
        if (!hasAnyArtistAssets(artistId)) continue;
        
        hasAnyAssets = true;
        
        // Format artist ID for display (only first character capitalized)
        let displayArtistId = artistId.toUpperCase();
        
        // Get artist data
        const artistData = getArtistDataById(artistId) || {
            name: displayArtistId,
            tokenName: displayArtistId,
            artworkTitle: "Content"
        };
        
        // Create artist section
        const artistSection = document.createElement('div');
        artistSection.className = 'artist-section';
        
        // Add artist name as clickable
        const artistName = document.createElement('h3');
        artistName.className = 'artist-name';
        artistName.textContent = artistData.name;
        artistName.style.cursor = 'pointer';
        artistName.addEventListener('click', function(e) {
            e.stopPropagation();
            switchToArtist(artistId);
        });
        artistSection.appendChild(artistName);
        
        // Add tokens if any
        if (artistAssets.tokens && artistAssets.tokens > 0) {
            const tokenItem = document.createElement('div');
            tokenItem.className = 'token-item';
            
            const tokenIcon = document.createElement('span');
            tokenIcon.className = 'token-icon';
            tokenIcon.innerHTML = '⚡';
            
            const tokenAmount = document.createElement('span');
            tokenAmount.className = 'token-amount';
            tokenAmount.textContent = new Intl.NumberFormat().format(artistAssets.tokens);
            
            const tokenName = document.createElement('span');
            tokenName.className = 'token-name';
            tokenName.textContent = ` ${artistData.tokenName} Artistocks`;
            
            tokenItem.appendChild(tokenIcon);
            tokenItem.appendChild(tokenAmount);
            tokenItem.appendChild(tokenName);
            artistSection.appendChild(tokenItem);
        }
        
        // Add downloads if any
        if (artistAssets.downloads && artistAssets.downloads.length > 0) {
            artistAssets.downloads.forEach(download => {
                const downloadItem = document.createElement('div');
                downloadItem.className = 'download-item';
                downloadItem.style.cursor = 'pointer';
                
                const musicIcon = document.createElement('span');
                musicIcon.className = 'music-icon';
                musicIcon.innerHTML = '🎵';
                
                const downloadTitle = document.createElement('span');
                downloadTitle.className = 'download-title';
                downloadTitle.textContent = download.title || artistData.artworkTitle;
                
                downloadItem.addEventListener('click', function(e) {
                    e.stopPropagation();
                    switchToArtist(artistId, download.id || 0);
                });
                
                const downloadLink = document.createElement('a');
                downloadLink.className = 'download-link';
                downloadLink.href = '#';
                downloadLink.textContent = 'Download';
                downloadLink.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    const ipfsHash = download.ipfsHash || generateIPFSHash();
                    alert(`Downloading content (IPFS: ${ipfsHash})...`);
                });
                
                downloadItem.appendChild(musicIcon);
                downloadItem.appendChild(downloadTitle);
                downloadItem.appendChild(downloadLink);
                artistSection.appendChild(downloadItem);
            });
        }
        
        assetList.appendChild(artistSection);
    }
    
    // If no assets found, show an empty state
    if (!hasAnyAssets) {
        const emptyState = document.createElement('div');
        emptyState.className = 'empty-state';
        emptyState.textContent = 'No assets found. Purchase content to see it here!';
        assetList.appendChild(emptyState);
    }
    
    // Add elements to panel
    walletPanel.appendChild(closeBtn);
    walletPanel.appendChild(title);
    walletPanel.appendChild(assetList);
    
    // Add to body
    document.body.appendChild(walletPanel);
    
    // Show panel
    isWalletOpen = true;
    walletPanel.style.display = 'block';
    
    // Add transition after display is set
    setTimeout(() => {
        walletPanel.style.opacity = '1';
        walletPanel.style.transform = 'translateY(0)';
    }, 10);
}

/**
 * Switch to a different artist's page
 */
function switchToArtist(artistId, contentId = null) {
    console.log(`Switching to artist: ${artistId}, content: ${contentId}`);
    
    // If we're already on this artist's page, just change the content if needed
    if (window.currentArtist === artistId) {
        if (contentId !== null) {
            // Switch to specific content
            console.log(`Loading content ID: ${contentId} for current artist`);
            
            // If there's a function to switch content, call it
            if (window.loadArtistContent) {
                window.loadArtistContent(contentId);
            }
        }
        return;
    }
    
    // Otherwise, navigate to the artist's page
    // This could be reloading the current page with a query parameter
    // or navigating to a different page entirely
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.set('artist', artistId);
    
    if (contentId !== null) {
        currentUrl.searchParams.set('content', contentId);
    }
    
    window.location.href = currentUrl.toString();
}

/**
 * Get artist data by ID
 */
function getArtistDataById(artistId) {
    // Try to use getCurrentArtistData if available
    if (window.getCurrentArtistData) {
        const currentArtist = window.getCurrentArtistData();
        if (currentArtist && window.currentArtist === artistId) {
            return currentArtist;
        }
    }
    
    // Try to get from config
    if (window.config && window.config.artists && window.config.artists[artistId]) {
        return window.config.artists[artistId];
    }
    
    // Fallback with basic info
    const fallbackData = {
        'gosheesh': {
            name: 'GOSHEESH',
            tokenName: 'SHEEGOHS',
            artworkTitle: 'NLi10 #1'
        },
        'jai_tea': {
            name: 'JAI TEA',
            tokenName: 'JAI TEA',
            artworkTitle: 'Earth #2'
        },
        'lumilitanide': {
            name: 'LUMILITANIDE',
            tokenName: 'LUMILITANIDE',
            artworkTitle: 'nSTRIPS'
        },
        'i_spir': {
            name: 'i_SPiR',
            tokenName: 'i_SPiR',
            artworkTitle: 'Dream #3'
        }
    };
    
    return fallbackData[artistId] || { name: artistId.toUpperCase(), tokenName: artistId.toUpperCase(), artworkTitle: 'Untitled' };
}

/**
 * Load user assets from localStorage
 * @returns {Object} User assets object
 */
function loadUserAssets() {
    try {
        const storedAssets = localStorage.getItem('userAssets');
        const parsedAssets = storedAssets ? JSON.parse(storedAssets) : {};
        console.log('Loaded user assets:', parsedAssets);
        return parsedAssets;
    } catch (error) {
        console.error('Error loading user assets:', error);
        return {};
    }
}

/**
 * Save user assets to localStorage
 */
function saveUserAssets() {
    try {
        localStorage.setItem('userAssets', JSON.stringify(userAssets));
        console.log('Saved user assets:', userAssets);
    } catch (error) {
        console.error('Error saving user assets:', error);
    }
}

/**
 * Check if user has any assets
 * @returns {Boolean} True if user has any assets
 */
function hasAssets() {
    const hasAnyAssets = Object.values(userAssets).some(artistAssets => 
        (artistAssets.tokens && artistAssets.tokens > 0) || 
        (artistAssets.downloads && artistAssets.downloads.length > 0)
    );
    console.log('User has assets check:', hasAnyAssets);
    return hasAnyAssets;
}

/**
 * Check if user has any assets for a specific artist
 * @param {String} artistId Artist ID
 * @returns {Boolean} True if user has any assets for the artist
 */
function hasAnyArtistAssets(artistId) {
    const artistAssets = userAssets[artistId];
    return artistAssets && (
        (artistAssets.tokens && artistAssets.tokens > 0) || 
        (artistAssets.downloads && artistAssets.downloads.length > 0)
    );
}

/**
 * Check if user has tokens for a specific artist
 * @param {String} artistId Artist ID
 * @returns {Boolean} True if user has tokens for the artist
 */
function hasArtistTokens(artistId) {
    return userAssets[artistId] && userAssets[artistId].tokens > 0;
}

/**
 * Update wallet display based on current assets
 */
function updateWalletDisplay() {
    const walletDisplay = document.getElementById('walletDisplay');
    const hasUserAssets = hasAssets();
    
    if (!walletDisplay) {
        console.error('Wallet display element not found during update');
        return;
    }
    
    console.log('Updating wallet display, assets exist:', hasUserAssets);
    
    if (hasUserAssets) {
        // Count total assets
        let totalTokens = 0;
        let totalDownloads = 0;
        
        for (const artistId in userAssets) {
            const artistAssets = userAssets[artistId];
            if (artistAssets.tokens) totalTokens += artistAssets.tokens;
            if (artistAssets.downloads) totalDownloads += artistAssets.downloads.length;
        }
        
        // Create a more descriptive wallet display
        let displayText = '💼 ';
        if (totalTokens > 0) {
            displayText += new Intl.NumberFormat().format(totalTokens) + ' tokens';
        }
        if (totalTokens > 0 && totalDownloads > 0) {
            displayText += ' | ';
        }
        if (totalDownloads > 0) {
            displayText += totalDownloads + ' downloads';
        }
        
        walletDisplay.innerHTML = displayText;
        walletDisplay.style.display = 'flex';
        walletDisplay.style.opacity = '1';
    } else {
        walletDisplay.style.opacity = '0';
        // Hide after fade out
        setTimeout(() => {
            walletDisplay.style.display = 'none';
        }, 300);
    }
    
    // Update wallet panel if open
    if (isWalletOpen) {
        createWalletPanel();
    }
}

/**
 * Add artist tokens to user assets
 * @param {String} artistId Artist ID
 * @param {Number} amount Token amount
 */
function addArtistTokens(artistId, amount) {
    console.log(`Adding ${amount} tokens for artist ${artistId}`);
    
    // Ensure artist entry exists
    if (!userAssets[artistId]) {
        userAssets[artistId] = {
            tokens: 0,
            downloads: []
        };
    }
    
    // Add tokens
    userAssets[artistId].tokens = (userAssets[artistId].tokens || 0) + amount;
    
    // Save assets
    saveUserAssets();
    
    // Update display
    updateWalletDisplay();
}

/**
 * Add artist download to user assets
 * @param {String} artistId Artist ID
 * @param {Object} download Download info
 */
function addArtistDownload(artistId, download) {
    console.log(`Adding download for artist ${artistId}:`, download);
    
    // Ensure artist entry exists
    if (!userAssets[artistId]) {
        userAssets[artistId] = {
            tokens: 0,
            downloads: []
        };
    }
    
    // Ensure downloads array exists
    if (!userAssets[artistId].downloads) {
        userAssets[artistId].downloads = [];
    }
    
    // Add download if not already in list
    const exists = userAssets[artistId].downloads.some(d => d.id === download.id);
    if (!exists) {
        userAssets[artistId].downloads.push(download);
    }
    
    // Save assets
    saveUserAssets();
    
    // Update display
    updateWalletDisplay();
}

/**
 * Clear user assets
 */
function clearAssets() {
    console.log('Clearing all user assets');
    
    // Clear assets
    userAssets = {};
    
    // Save to localStorage
    saveUserAssets();
    
    // Update display
    updateWalletDisplay();
    
    // Close wallet panel if open
    if (isWalletOpen) {
        toggleWallet();
    }
}

/**
 * Handle purchase completion
 * Called after successful purchase logic
 */
function onPurchaseComplete(artistId, includesArtistocks, tokenAmount, includesDownload = false) {
    console.log(`Purchase complete for ${artistId}:`, {
        includesArtistocks,
        tokenAmount,
        includesDownload
    });
    
    let updatedAssets = false;
    
    // Add tokens if the purchase includes artistocks
    if (includesArtistocks && tokenAmount > 0) {
        addArtistTokens(artistId, tokenAmount);
        updatedAssets = true;
    }
    
    // Add download if the purchase includes a download
    if (includesDownload) {
        const artistData = getArtistDataById(artistId);
        const download = {
            id: Date.now(),
            title: artistData ? artistData.artworkTitle : 'Content',
            purchaseDate: new Date().toISOString(),
            ipfsHash: generateIPFSHash()
        };
        
        addArtistDownload(artistId, download);
        updatedAssets = true;
    }
    
    if (updatedAssets) {
        // Show wallet if there are now assets
        if (hasAssets()) {
            const walletDisplay = document.getElementById('walletDisplay');
            if (walletDisplay) {
                walletDisplay.style.display = 'flex';
                setTimeout(() => {
                    walletDisplay.style.opacity = '1';
                    
                    // Add pulsing effect to highlight new assets
                    walletDisplay.classList.add('new-assets');
                    setTimeout(() => {
                        walletDisplay.classList.remove('new-assets');
                    }, 3000);
                }, 10);
                
                // IMPORTANT: Always open wallet automatically after purchase
                // with a slightly longer delay to ensure animations complete
                setTimeout(() => {
                    console.log('Auto-opening wallet after purchase');
                    if (!isWalletOpen) {
                        createWalletPanel();
                        isWalletOpen = true;
                    }
                }, 800);
            }
        }
        
        // Show purchase success UI
        showPurchaseSuccess(artistId, tokenAmount, includesDownload);
    }
    
    return updatedAssets;
}

/**
 * Show purchase success UI
 * @param {String} artistId Artist ID
 * @param {Number} tokenAmount Token amount
 * @param {Boolean} includesDownload Whether purchase includes download
 */
function showPurchaseSuccess(artistId, tokenAmount, includesDownload) {
    console.log('Showing purchase success UI');
    
    // This is now handled in script.js
    if (window.showSuccessSection) {
        window.showSuccessSection(tokenAmount > 0, includesDownload);
    } else {
        console.error('showSuccessSection function not found in global scope');
    }
}

/**
 * Get current artist data
 * @returns {Object} Artist data object
 */
function getCurrentArtistData() {
    if (window.getCurrentArtistData) {
        return window.getCurrentArtistData();
    } else {
        console.warn('getCurrentArtistData function not found in global scope');
        return null;
    }
}

/**
 * Generate a mock IPFS hash
 * This is a placeholder for actual IPFS functionality
 * @returns {String} IPFS hash
 */
function generateIPFSHash() {
    const chars = '0123456789abcdef';
    let hash = 'Qm';
    
    for (let i = 0; i < 44; i++) {
        hash += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return hash;
} 