/**
 * ZEYODA Wallet Module
 * Handles user asset tracking and wallet UI display
 */

// Wallet state management
let userAssets = loadUserAssets();
let isWalletOpen = false;
let walletInitialized = false;

/**
 * Initialize the wallet module
 * Should be called after user authentication
 */
function initWallet() {
    if (walletInitialized) return;
    
    console.log('Initializing wallet module');
    
    // Check if user is logged in with Magic
    const isLoggedIn = localStorage.getItem('isAuthenticated') === 'true';
    
    if (!isLoggedIn) {
        console.log('User not logged in, skipping wallet initialization');
        return;
    }
    
    // Create wallet display if it doesn't exist
    createWalletUI();
    
    // Mark as initialized
    walletInitialized = true;
    
    // Update the wallet display based on current assets
    updateWalletDisplay();
}

/**
 * Load user assets from localStorage
 * @returns {Object} User assets by artist
 */
function loadUserAssets() {
    try {
        const storedAssets = localStorage.getItem('userAssets');
        return storedAssets ? JSON.parse(storedAssets) : {};
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
    } catch (error) {
        console.error('Error saving user assets:', error);
    }
}

/**
 * Check if user has any assets
 * @returns {Boolean} True if user has assets
 */
function hasAssets() {
    // Check if userAssets has any artist entries with assets
    return Object.values(userAssets).some(artistAssets => {
        return (
            (artistAssets.tokens && artistAssets.tokens > 0) || 
            (artistAssets.downloads && artistAssets.downloads.length > 0)
        );
    });
}

/**
 * Create wallet UI elements
 */
function createWalletUI() {
    console.log('Creating wallet UI');
    
    // Create wallet button in header (similar to logout button, but on left side)
    const header = document.querySelector('header');
    if (!header) {
        console.error('Header not found!');
        return;
    }
    
    // Create wallet button
    let walletButton = document.getElementById('walletButton');
    if (!walletButton) {
        walletButton = document.createElement('button');
        walletButton.id = 'walletButton';
        walletButton.className = 'wallet-button';
        walletButton.innerHTML = '💼';
        walletButton.title = 'View your wallet';
        
        // Add click handler to toggle wallet display
        walletButton.addEventListener('click', toggleWallet);
        
        // Insert at the beginning of header
        header.prepend(walletButton);
    }
    
    // Create wallet container (initially hidden)
    let walletContainer = document.getElementById('walletContainer');
    if (!walletContainer) {
        walletContainer = document.createElement('div');
        walletContainer.id = 'walletContainer';
        walletContainer.className = 'wallet-container';
        
        // Create wallet header
        const walletHeader = document.createElement('div');
        walletHeader.className = 'wallet-header';
        
        const walletTitle = document.createElement('h3');
        walletTitle.textContent = 'Your Assets';
        walletHeader.appendChild(walletTitle);
        
        const closeButton = document.createElement('button');
        closeButton.className = 'wallet-close-button';
        closeButton.innerHTML = '&times;';
        closeButton.addEventListener('click', toggleWallet);
        walletHeader.appendChild(closeButton);
        
        walletContainer.appendChild(walletHeader);
        
        // Create wallet content area
        const walletContent = document.createElement('div');
        walletContent.id = 'walletContent';
        walletContent.className = 'wallet-content';
        walletContainer.appendChild(walletContent);
        
        // Create empty state message
        const emptyState = document.createElement('div');
        emptyState.id = 'walletEmptyState';
        emptyState.className = 'wallet-empty-state';
        emptyState.innerHTML = `
            <div class="empty-icon">💫</div>
            <p>No assets yet.</p>
            <p class="empty-hint">Purchase downloads or Artistocks to get started.</p>
        `;
        walletContent.appendChild(emptyState);
        
        // Add to document body
        document.body.appendChild(walletContainer);
    }
}

/**
 * Toggle wallet open/closed state
 */
function toggleWallet() {
    // Get wallet container
    const walletContainer = document.getElementById('walletContainer');
    if (!walletContainer) return;
    
    // Update state
    isWalletOpen = !isWalletOpen;
    
    // Toggle wallet visibility
    if (isWalletOpen) {
        walletContainer.classList.add('open');
        // Update wallet content when opening
        updateWalletDisplay();
    } else {
        walletContainer.classList.remove('open');
    }
}

/**
 * Update wallet display with current assets
 */
function updateWalletDisplay() {
    console.log('Updating wallet display');
    
    // Don't update if not initialized
    if (!walletInitialized) return;
    
    // Get wallet button and container
    const walletButton = document.getElementById('walletButton');
    const walletContainer = document.getElementById('walletContainer');
    
    if (!walletButton || !walletContainer) {
        console.error('Wallet UI elements not found!');
        return;
    }
    
    // Check if user has any assets
    const hasUserAssets = hasAssets();
    
    // Show/hide wallet button based on whether user has assets
    walletButton.style.display = hasUserAssets ? 'block' : 'none';
    
    // Get wallet content and empty state message
    const walletContent = document.getElementById('walletContent');
    const emptyState = document.getElementById('walletEmptyState');
    
    if (!walletContent || !emptyState) {
        console.error('Wallet content elements not found!');
        return;
    }
    
    // Show/hide empty state message based on whether user has assets
    emptyState.style.display = hasUserAssets ? 'none' : 'block';
    
    // Clear existing artist sections
    const artistSections = walletContent.querySelectorAll('.wallet-artist-section');
    artistSections.forEach(section => {
        if (section !== emptyState) {
            section.remove();
        }
    });
    
    // Skip if no assets
    if (!hasUserAssets) return;
    
    // Create a section for each artist with assets
    Object.entries(userAssets).forEach(([artistId, artistAssets]) => {
        // Skip if no assets for this artist
        if (!((artistAssets.tokens && artistAssets.tokens > 0) || 
              (artistAssets.downloads && artistAssets.downloads.length > 0))) {
            return;
        }
        
        // Get artist display name from config if available, or use ID
        let artistName = artistId.toUpperCase();
        try {
            const artistConfig = config.artists[artistId];
            if (artistConfig && artistConfig.name) {
                artistName = artistConfig.name;
            }
        } catch (error) {
            console.warn(`Could not get display name for artist ${artistId}`, error);
        }
        
        // Create artist section
        const artistSection = document.createElement('div');
        artistSection.className = 'wallet-artist-section';
        
        // Create artist header - make it clickable
        const artistHeader = document.createElement('h4');
        artistHeader.textContent = artistName;
        artistHeader.className = 'clickable-artist';
        artistHeader.style.cursor = 'pointer';
        
        // Add event listener to navigate to this artist's page
        artistHeader.addEventListener('click', () => {
            console.log(`Artist header clicked: ${artistId}`);
            
            // Close the wallet
            toggleWallet();
            
            // Navigate to the artist's page after a slight delay
            setTimeout(() => {
                // Use the global transitionToArtist function if available
                if (typeof window.transitionToArtist === 'function') {
                    window.transitionToArtist(artistId);
                } else if (typeof transitionToArtist === 'function') {
                    transitionToArtist(artistId);
                } else {
                    console.error('transitionToArtist function not available');
                }
            }, 300);
        });
        
        artistSection.appendChild(artistHeader);
        
        // Create list of assets
        const assetsList = document.createElement('ul');
        assetsList.className = 'wallet-assets-list';
        
        // Add tokens if any
        if (artistAssets.tokens && artistAssets.tokens > 0) {
            const tokensItem = document.createElement('li');
            tokensItem.className = 'wallet-asset-item tokens';
            
            // Create elements individually to add click handler to artist name
            const iconSpan = document.createElement('span');
            iconSpan.className = 'asset-icon';
            iconSpan.textContent = '⚡';
            
            const amountSpan = document.createElement('span');
            amountSpan.className = 'asset-amount';
            amountSpan.textContent = new Intl.NumberFormat().format(artistAssets.tokens);
            
            const nameSpan = document.createElement('span');
            nameSpan.className = 'asset-name clickable-asset';
            nameSpan.textContent = `${artistName} Artistocks`;
            nameSpan.style.cursor = 'pointer';
            
            // Add click handler to the name
            nameSpan.addEventListener('click', () => {
                console.log(`Asset name clicked: ${artistId}`);
                // Close the wallet
                toggleWallet();
                
                // Navigate to the artist's page after a slight delay
                setTimeout(() => {
                    if (typeof window.transitionToArtist === 'function') {
                        window.transitionToArtist(artistId);
                    } else if (typeof transitionToArtist === 'function') {
                        transitionToArtist(artistId);
                    } else {
                        console.error('transitionToArtist function not available');
                    }
                }, 300);
            });
            
            // Append all elements to the list item
            tokensItem.appendChild(iconSpan);
            tokensItem.appendChild(amountSpan);
            tokensItem.appendChild(nameSpan);
            
            assetsList.appendChild(tokensItem);
        }
        
        // Add downloads if any
        if (artistAssets.downloads && artistAssets.downloads.length > 0) {
            artistAssets.downloads.forEach(download => {
                const downloadItem = document.createElement('li');
                downloadItem.className = 'wallet-asset-item download';
                
                // Create elements individually to add click handler to title
                const iconSpan = document.createElement('span');
                iconSpan.className = 'asset-icon';
                iconSpan.textContent = '🎵';
                
                const titleSpan = document.createElement('span');
                titleSpan.className = 'asset-title clickable-asset';
                titleSpan.textContent = download.title || 'Digital Download';
                titleSpan.style.cursor = 'pointer';
                
                // Add click handler to the title
                titleSpan.addEventListener('click', () => {
                    console.log(`Download title clicked: ${artistId}`);
                    // Close the wallet
                    toggleWallet();
                    
                    // Navigate to the artist's page after a slight delay
                    setTimeout(() => {
                        if (typeof window.transitionToArtist === 'function') {
                            window.transitionToArtist(artistId);
                        } else if (typeof transitionToArtist === 'function') {
                            transitionToArtist(artistId);
                        } else {
                            console.error('transitionToArtist function not available');
                        }
                    }, 300);
                });
                
                const downloadLink = document.createElement('a');
                downloadLink.href = '#';
                downloadLink.className = 'asset-download-link';
                downloadLink.dataset.ipfs = download.ipfsHash;
                downloadLink.textContent = 'Download';
                downloadLink.onclick = function() {
                    handleAssetDownload(download.ipfsHash);
                    return false;
                };
                
                // Append all elements to the list item
                downloadItem.appendChild(iconSpan);
                downloadItem.appendChild(titleSpan);
                downloadItem.appendChild(downloadLink);
                
                assetsList.appendChild(downloadItem);
            });
        }
        
        artistSection.appendChild(assetsList);
        walletContent.appendChild(artistSection);
    });
}

/**
 * Handle click on asset download link
 * @param {String} ipfsHash IPFS hash of the download
 */
function handleAssetDownload(ipfsHash) {
    alert(`Starting download... IPFS: ${ipfsHash}`);
    // This would be replaced with actual IPFS download logic
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
 * @param {Object} download Download details
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
    
    // Add download (avoid duplicates)
    const exists = userAssets[artistId].downloads.some(d => d.ipfsHash === download.ipfsHash);
    if (!exists) {
        userAssets[artistId].downloads.push(download);
    }
    
    // Save assets
    saveUserAssets();
    
    // Update display
    updateWalletDisplay();
}

/**
 * Clear all user assets (called on logout)
 */
function clearAssets() {
    console.log('Clearing all user assets');
    
    // Reset assets
    userAssets = {};
    
    // Save empty assets
    saveUserAssets();
    
    // Update display
    updateWalletDisplay();
    
    // Reset wallet state
    isWalletOpen = false;
    walletInitialized = false;
    
    // Close wallet if open
    const walletContainer = document.getElementById('walletContainer');
    if (walletContainer) {
        walletContainer.classList.remove('open');
    }
}

/**
 * Hook wallet module into payment completion
 * @param {String} artistId Artist ID
 * @param {Boolean} includesArtistocks Whether purchase includes artistocks
 * @param {Number} tokenAmount Amount of tokens purchased
 * @param {Boolean} includesDownload Whether purchase includes the download (added parameter)
 */
function onPurchaseComplete(artistId, includesArtistocks, tokenAmount, includesDownload = false) {
    console.log(`Purchase complete for ${artistId}: tokens=${includesArtistocks ? tokenAmount : 0}, download=${includesDownload}`);
    
    // Initialize wallet if not already initialized
    if (!walletInitialized) {
        initWallet();
    }
    
    // If purchase includes artistocks, add tokens
    if (includesArtistocks && tokenAmount > 0) {
        addArtistTokens(artistId, tokenAmount);
    }
    
    // Add download ONLY if specifically purchased (when includesDownload is true)
    // This fixes the bug where downloads appear even when only tokens were purchased
    if (includesDownload) {
        // Check if we already have this download
        const artistAssets = userAssets[artistId] || { tokens: 0, downloads: [] };
        const artistData = getCurrentArtistData();
        
        if (!artistData) {
            console.error("Could not get artist data for download");
            return;
        }
        
        const title = artistData.artworkTitle || 'Digital Download';
        const hasDownload = artistAssets.downloads && artistAssets.downloads.some(d => d.title === title);
        
        // Only add if we don't already have this download
        if (!hasDownload) {
            // Generate IPFS hash for download
            const ipfsHash = generateIPFSHash ? generateIPFSHash() : `Qm${Math.random().toString(36).substring(2, 15)}`;
            
            // Add download
            addArtistDownload(artistId, {
                title: title,
                ipfsHash,
                date: new Date().toISOString()
            });
        }
    }
    
    // Always open wallet immediately after purchase
    console.log("Opening wallet immediately after purchase");
    
    // Force wallet to open, whether it's already open or not
    if (isWalletOpen) {
        // If already open, close and reopen for effect
        toggleWallet();
        setTimeout(toggleWallet, 100);
    } else {
        // Open wallet immediately
        toggleWallet();
    }
    
    // First immediately setup the orbital tokens for just the current artist
    // This gives immediate visual feedback right after purchase
    try {
        if (typeof window.setupOrbitalTokens === 'function') {
            window.setupOrbitalTokens(artistId);
        } else if (typeof setupOrbitalTokens === 'function') {
            setupOrbitalTokens(artistId);
        }
    } catch (e) {
        console.error("Error setting up orbital tokens for current artist:", e);
    }
    
    // Then after a slight delay, update all artists' tokens to ensure cross-visibility
    setTimeout(() => {
        // Find all artists that the user has assets for
        Object.keys(userAssets).forEach(id => {
            if (hasAnyArtistAssets(id) && id !== artistId) {
                try {
                    // Try to update tokens for other artists to ensure they appear in orbit
                    if (typeof window.setupOrbitalTokens === 'function') {
                        window.setupOrbitalTokens(id);
                    } else if (typeof setupOrbitalTokens === 'function') {
                        setupOrbitalTokens(id);
                    }
                } catch (e) {
                    console.error(`Error setting up orbital tokens for ${id}:`, e);
                }
            }
        });
        
        // Finally, make sure we update the current artist's tokens again, as it may have changed
        const currentArtistId = window.currentArtist || currentArtist;
        if (currentArtistId && currentArtistId !== artistId) {
            try {
                if (typeof window.setupOrbitalTokens === 'function') {
                    window.setupOrbitalTokens(currentArtistId);
                } else if (typeof setupOrbitalTokens === 'function') {
                    setupOrbitalTokens(currentArtistId);
                }
            } catch (e) {
                console.error("Error setting up orbital tokens for current artist:", e);
            }
        }
    }, 300);
}

/**
 * Check if user has tokens for a specific artist
 * @param {String} artistId Artist ID
 * @returns {Boolean} True if user has tokens for the artist
 */
function hasArtistTokens(artistId) {
    return userAssets[artistId] && 
           userAssets[artistId].tokens && 
           userAssets[artistId].tokens > 0;
}

/**
 * Check if user has any assets (tokens or downloads) for a specific artist
 * @param {String} artistId Artist ID
 * @returns {Boolean} True if user has any assets for the artist
 */
function hasAnyArtistAssets(artistId) {
    return userAssets[artistId] && (
        (userAssets[artistId].tokens && userAssets[artistId].tokens > 0) ||
        (userAssets[artistId].downloads && userAssets[artistId].downloads.length > 0)
    );
}

// Export wallet functions for use in main script
if (typeof window !== 'undefined') {
    // Attach to window for global access
    window.wallet = {
        init: initWallet,
        toggle: toggleWallet,
        update: updateWalletDisplay,
        addTokens: addArtistTokens,
        addDownload: addArtistDownload,
        clear: clearAssets,
        onPurchaseComplete: onPurchaseComplete,
        loadAssets: loadUserAssets,
        hasAssets: hasAssets,
        hasArtistTokens: hasArtistTokens,
        hasAnyArtistAssets: hasAnyArtistAssets
    };
} 