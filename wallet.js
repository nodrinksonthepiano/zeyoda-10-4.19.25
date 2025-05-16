/**
 * ZEYODA Wallet Module
 * Handles user asset tracking and wallet UI display
 */

// Wallet state management
let userAssets = loadUserAssets();
let isWalletOpen = false;
let walletInitialized = false;

/**
 * Get the connected wallet address
 * @returns {Promise<string>} The wallet address or a fallback address
 */
async function getWalletAddress() {
    // Try to get address from localStorage first
    const storedAddress = localStorage.getItem('userWalletAddress');
    
    if (storedAddress) {
        console.log(`Retrieved wallet address from storage: ${storedAddress.substring(0, 8)}...`);
        return storedAddress;
    }
    
    // If we're authenticated but don't have an address, create a temporary one
    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
    if (isAuthenticated) {
        // Generate deterministic address based on email if available
        const email = localStorage.getItem('userEmail');
        if (email) {
            // Simple hash function to generate a deterministic hex string from email
            let emailHash = 0;
            for (let i = 0; i < email.length; i++) {
                emailHash = (emailHash << 5) - emailHash + email.charCodeAt(i);
                emailHash = emailHash & emailHash; // Convert to 32bit integer
            }
            
            // Generate a valid-looking Ethereum address
            const deterministicAddress = '0x' + Math.abs(emailHash).toString(16).padStart(40, '0');
            console.log(`Generated wallet address from email: ${deterministicAddress.substring(0, 8)}...`);
            
            // Store it for future use
            localStorage.setItem('userWalletAddress', deterministicAddress);
            
            return deterministicAddress;
        }
    }
    
    // Fallback to current artist's default address
    const currentArtist = localStorage.getItem('currentArtist') || 'gosheesh';
    const fallbackAddresses = {
        'gosheesh': '0xabc123def456789abcdef0123456789abcdef01',
        'jaitea': '0xdef456abc789012def3456789abcdef01234567'
    };
    
    console.log(`Using fallback address for artist ${currentArtist}`);
    return fallbackAddresses[currentArtist] || fallbackAddresses['gosheesh'];
}

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
function toggleWallet(open = undefined, highlightArtistId = undefined) {
    const walletContainer = document.getElementById('walletContainer');
    if (!walletContainer) return;
    // Determine open/close state
    if (typeof open === 'boolean') {
        isWalletOpen = open;
    } else {
        isWalletOpen = !isWalletOpen;
    }
    if (isWalletOpen) {
        walletContainer.classList.add('open');
        updateWalletDisplay(highlightArtistId);
    } else {
        walletContainer.classList.remove('open');
    }
}

/**
 * Update wallet display with current assets
 */
function updateWalletDisplay(highlightArtistId = undefined) {
    console.log('Updating wallet display');
    if (!walletInitialized) return;
    const walletButton = document.getElementById('walletButton');
    const walletContainer = document.getElementById('walletContainer');
    if (!walletButton || !walletContainer) {
        console.error('Wallet UI elements not found!');
        return;
    }
    const hasUserAssets = hasAssets();
    walletButton.style.display = hasUserAssets ? 'block' : 'none';
    const walletContent = document.getElementById('walletContent');
    const emptyState = document.getElementById('walletEmptyState');
    if (!walletContent || !emptyState) {
        console.error('Wallet content elements not found!');
        return;
    }
    emptyState.style.display = hasUserAssets ? 'none' : 'block';
    // Clear existing artist sections
    const artistSections = walletContent.querySelectorAll('.wallet-artist-section');
    artistSections.forEach(section => {
        if (section !== emptyState) {
            section.remove();
        }
    });
    if (!hasUserAssets) return;
    Object.entries(userAssets).forEach(([artistId, artistAssets]) => {
        if (!((artistAssets.tokens && artistAssets.tokens > 0) || 
              (artistAssets.downloads && artistAssets.downloads.length > 0))) {
            return;
        }
        let artistName = artistId.toUpperCase();
        let artistLogo = '';
        let artistProfileUrl = '';
        try {
            const artistConfig = config.artists[artistId];
            if (artistConfig) {
                if (artistConfig.name) artistName = artistConfig.name;
                if (artistConfig.logo) artistLogo = artistConfig.logo;
                if (artistConfig.profileUrl) artistProfileUrl = artistConfig.profileUrl;
            }
        } catch (error) {
            console.warn(`Could not get display name for artist ${artistId}`, error);
        }
        // Create artist section
        const artistSection = document.createElement('div');
        artistSection.className = 'wallet-artist-section';
        artistSection.setAttribute('data-artist-id', artistId);
        // Highlight if needed
        if (highlightArtistId && artistId === highlightArtistId) {
            artistSection.style.background = 'rgba(255,255,255,0.08)';
            setTimeout(() => {
                artistSection.scrollIntoView({behavior: 'smooth', block: 'center'});
            }, 200);
        }
        // Create artist header (logo + name, clickable)
        const artistHeader = document.createElement('h4');
        artistHeader.style.display = 'flex';
        artistHeader.style.alignItems = 'center';
        artistHeader.style.cursor = 'pointer';
        if (artistLogo) {
            const logoImg = document.createElement('img');
            logoImg.src = artistLogo;
            logoImg.alt = artistName + ' logo';
            logoImg.style.width = '28px';
            logoImg.style.height = '28px';
            logoImg.style.marginRight = '10px';
            logoImg.style.borderRadius = '50%';
            artistHeader.appendChild(logoImg);
        }
        const nameSpan = document.createElement('span');
        nameSpan.textContent = artistName;
        artistHeader.appendChild(nameSpan);
        // Make header clickable to jump to artist profile in orbit
        artistHeader.addEventListener('click', () => {
            if (typeof transitionToArtist === 'function') {
                transitionToArtist(artistId);
            } else if (artistProfileUrl) {
                window.open(artistProfileUrl, '_blank');
            }
        });
        artistSection.appendChild(artistHeader);
        // Create list of assets
        const assetsList = document.createElement('ul');
        assetsList.className = 'wallet-assets-list';
        if (artistAssets.tokens && artistAssets.tokens > 0) {
            const tokensItem = document.createElement('li');
            tokensItem.className = 'wallet-asset-item tokens';
            
            // Ensure tokens are displayed properly, by forcing numeric conversion
            const tokenCount = parseInt(artistAssets.tokens);
            console.log(`Displaying ${tokenCount} tokens for ${artistId}`);
            
            // Display the token count with proper formatting
            tokensItem.innerHTML = `
                <span class="asset-icon">⚡</span>
                <span class="asset-amount">${new Intl.NumberFormat().format(tokenCount)}</span>
                <span class="asset-name">${artistName} Artistocks</span>
            `;
            assetsList.appendChild(tokensItem);
        }
        if (artistAssets.downloads && artistAssets.downloads.length > 0) {
            artistAssets.downloads.forEach(download => {
                const downloadItem = document.createElement('li');
                downloadItem.className = 'wallet-asset-item download';
                downloadItem.innerHTML = `
                    <span class="asset-icon">🎵</span>
                    <span class="asset-title">${download.title || 'Digital Download'}</span>
                    <a href="#" class="asset-download-link" data-ipfs="${download.ipfsHash}" onclick="handleAssetDownload('${download.ipfsHash}'); return false;">Download</a>
                `;
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
    
    // Ensure amount is a number
    const parsedAmount = typeof amount === 'string' ? parseInt(amount.replace(/,/g, '')) : parseInt(amount);
    
    // Ensure artist entry exists
    if (!userAssets[artistId]) {
        userAssets[artistId] = {
            tokens: 0,
            downloads: []
        };
    }
    
    // Add tokens - if the user already has tokens, don't overwrite them, add to existing total
    const currentTokens = parseInt(userAssets[artistId].tokens || 0);
    userAssets[artistId].tokens = currentTokens + parsedAmount;
    
    // Log the current token total
    console.log(`New token total for ${artistId}: ${userAssets[artistId].tokens}`);
    
    // Save assets
    saveUserAssets();
    
    // Update display
    updateWalletDisplay();
    
    // Also save in localStorage for consistent token display across pages
    localStorage.setItem('artistocksBalance', userAssets[artistId].tokens);
    localStorage.setItem('currentTokenAmount', userAssets[artistId].tokens);
    localStorage.setItem('lastPurchaseAmount', parsedAmount);
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
        // Convert tokenAmount to number if it's a string
        const tokenCount = typeof tokenAmount === 'string' ? parseInt(tokenAmount.replace(/,/g, '')) : parseInt(tokenAmount);
        console.log(`Adding ${tokenCount} tokens to wallet for ${artistId}`);
        
        // Update global success display
        const purchasedAmount = document.getElementById('purchasedAmount');
        if (purchasedAmount) {
            purchasedAmount.textContent = new Intl.NumberFormat().format(tokenCount);
        }
        
        // Fix the "undefined" Artistocks text
        const artistStockName = document.getElementById('artistStockName');
        if (artistStockName && artistStockName.textContent === 'undefined') {
            const artistData = window.config && window.config.artists && window.config.artists[artistId];
            const artistName = artistData ? (artistData.name || artistId.toUpperCase()) : artistId.toUpperCase();
            artistStockName.textContent = artistName;
        }
        
        // Add tokens to wallet
        addArtistTokens(artistId, tokenCount);
    }
    
    // Add download ONLY if specifically purchased (when includesDownload is true)
    // This fixes the bug where downloads appear even when only tokens were purchased
    if (includesDownload) {
        // Check if we already have this download
        const artistAssets = userAssets[artistId] || { tokens: 0, downloads: [] };
        
        // Get artist data - we can't use getCurrentArtistData() directly as it's in script.js,
        // so we'll try to get it from the global config object
        let title = 'Digital Download';
        try {
            if (window.config && window.config.artists && window.config.artists[artistId]) {
                title = window.config.artists[artistId].artworkTitle || 'Digital Download';
            }
        } catch (error) {
            console.error("Error accessing config for artwork title:", error);
        }
        
        const hasDownload = artistAssets.downloads && artistAssets.downloads.some(d => d.title === title);
        
        // Only add if we don't already have this download
        if (!hasDownload) {
            // Generate IPFS hash for download - use a simple random hash if the function isn't available
            const ipfsHash = typeof generateIPFSHash === 'function' ? 
                generateIPFSHash() : 
                `Qm${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
            
            // Add download
            addArtistDownload(artistId, {
                title: title,
                ipfsHash,
                date: new Date().toISOString()
            });
        }
    }
    
    // Show wallet if not already open
    if (!isWalletOpen) {
        setTimeout(() => {
            toggleWallet();
        }, 1000); // Wait a second after purchase to show wallet
    }
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
        getAddress: getWalletAddress
    };
} 