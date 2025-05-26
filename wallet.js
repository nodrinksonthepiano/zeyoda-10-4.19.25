/**
 * ZEYODA Wallet Module
 * Handles user asset tracking and wallet UI display
 */

// Wallet state management
let userAssets = loadUserAssets();
let isWalletOpen = false;
let walletInitialized = false;

// Constants
const TOKEN_PRICE = 0.0005; // $0.0005 per token
const MIN_PURCHASE_AMOUNT = 1.00; // $1 minimum purchase

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
        const assets = storedAssets ? JSON.parse(storedAssets) : {};
        
        // Validate and clean up loaded assets
        Object.entries(assets).forEach(([artistId, artistAssets]) => {
            // Ensure tokens is a valid number
            if (artistAssets.tokens) {
                let tokens = parseInt(artistAssets.tokens);
                if (isNaN(tokens) || !isFinite(tokens)) {
                    tokens = 0;
                }
                // Cap at 100 million
                tokens = Math.min(Math.max(0, tokens), 100000000);
                artistAssets.tokens = tokens;
                
                // Also check artist-specific storage
                const artistBalance = localStorage.getItem(`${artistId}_balance`);
                if (artistBalance) {
                    const storedBalance = parseInt(artistBalance);
                    if (!isNaN(storedBalance) && isFinite(storedBalance)) {
                        // Use the higher value between stored balance and current tokens
                        artistAssets.tokens = Math.max(tokens, storedBalance);
                    }
                }
            } else {
                artistAssets.tokens = 0;
            }
            
            // Ensure downloads is an array
            if (!Array.isArray(artistAssets.downloads)) {
                artistAssets.downloads = [];
            }
            
            // Clean up download entries
            artistAssets.downloads = artistAssets.downloads.filter(download => {
                return download && typeof download === 'object' && 
                       download.title && typeof download.title === 'string' &&
                       download.ipfsHash && typeof download.ipfsHash === 'string';
            });
        });
        
        // Save cleaned up assets back to storage
        localStorage.setItem('userAssets', JSON.stringify(assets));
        
        return assets;
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
 * @param {string} [highlightArtistId] Optional artist ID to highlight
 */
function updateWalletDisplay(highlightArtistId = undefined) {
    console.log('Updating wallet display');
    if (!walletInitialized) return;
    
    const walletButton = document.getElementById('walletButton');
    const walletContainer = document.getElementById('walletContainer');
    const walletContent = document.getElementById('walletContent');
    const emptyState = document.getElementById('walletEmptyState');
    
    if (!walletButton || !walletContainer || !walletContent || !emptyState) {
        console.error('Wallet UI elements not found!');
        return;
    }
    
    // Check if user has any assets
    const hasUserAssets = hasAssets();
    
    // Show/hide wallet button based on assets
    walletButton.style.display = hasUserAssets ? 'block' : 'none';
    
    // Show/hide empty state
    emptyState.style.display = hasUserAssets ? 'none' : 'block';
    
    // Clear existing artist sections
    const artistSections = walletContent.querySelectorAll('.wallet-artist-section');
    artistSections.forEach(section => {
        if (section !== emptyState) {
            section.remove();
        }
    });
    
    if (!hasUserAssets) return;
    
    // Create sections for each artist with assets
    Object.entries(userAssets).forEach(([artistId, artistAssets]) => {
        if (!artistAssets || (!artistAssets.tokens && (!artistAssets.downloads || !artistAssets.downloads.length))) {
            return;
        }
        
        // Get artist display name from config
        let artistName = artistId.toUpperCase();
        try {
            const artistConfig = window.config?.artists?.[artistId];
            if (artistConfig?.name) {
                artistName = artistConfig.name;
            }
        } catch (error) {
            console.warn(`Could not get display name for artist ${artistId}`, error);
        }
        
        // Create artist section
        const artistSection = document.createElement('div');
        artistSection.className = 'wallet-artist-section';
        artistSection.setAttribute('data-artist-id', artistId);
        
        // Highlight if needed
        if (highlightArtistId === artistId) {
            artistSection.classList.add('highlighted');
        }
        
        // Add artist name header
        const artistHeader = document.createElement('h4');
        artistHeader.textContent = artistName;
        artistSection.appendChild(artistHeader);
        
        // Create assets list
        const assetsList = document.createElement('ul');
        assetsList.className = 'wallet-assets-list';
        
        // Add token entry if any tokens
        if (artistAssets.tokens && artistAssets.tokens > 0) {
            const tokensItem = document.createElement('li');
            tokensItem.className = 'wallet-asset-item tokens';
            tokensItem.innerHTML = `
                <span class="asset-icon">⚡</span>
                <span class="asset-amount">${new Intl.NumberFormat().format(artistAssets.tokens)}</span>
                <span class="asset-name">${artistName} Artistocks</span>
            `;
            assetsList.appendChild(tokensItem);
        }
        
        // Add download entries
        if (artistAssets.downloads && artistAssets.downloads.length > 0) {
            artistAssets.downloads.forEach(download => {
                const downloadItem = document.createElement('li');
                downloadItem.className = 'wallet-asset-item download';
                downloadItem.innerHTML = `
                    <span class="asset-icon">🎵</span>
                    <span class="asset-title">${download.title || 'Digital Download'}</span>
                    <a href="#" class="asset-download-link" onclick="alert('Downloading content... IPFS: ${download.ipfsHash}'); return false;">
                        Download
                    </a>
                `;
                assetsList.appendChild(downloadItem);
            });
        }
        
        artistSection.appendChild(assetsList);
        walletContent.appendChild(artistSection);
    });
    
    // If highlighting an artist, scroll to their section
    if (highlightArtistId) {
        const highlightedSection = walletContent.querySelector(`[data-artist-id="${highlightArtistId}"]`);
        if (highlightedSection) {
            highlightedSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }
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
    if (!artistId || typeof amount !== 'number' || isNaN(amount) || !isFinite(amount)) {
        console.error('Invalid parameters for addArtistTokens:', { artistId, amount });
        return 0;
    }

    // Load current assets
    const assets = loadUserAssets();
    
    // Initialize artist entry if it doesn't exist
    if (!assets[artistId]) {
        assets[artistId] = { tokens: 0 };
    }
    
    // Convert current balance to number and validate
    let currentBalance = parseInt(assets[artistId].tokens) || 0;
    if (isNaN(currentBalance) || !isFinite(currentBalance)) {
        currentBalance = 0;
    }
    
    // Calculate new balance
    const newBalance = currentBalance + amount;
    
    // Don't allow negative balances
    if (newBalance < 0) {
        console.error(`Cannot reduce balance below 0 for ${artistId}`);
        return currentBalance;
    }
    
    // Update balance
    assets[artistId].tokens = newBalance;
    
    // Save updated assets
    localStorage.setItem('userAssets', JSON.stringify(assets));
    console.log(`Updated ${artistId} token balance: ${currentBalance} -> ${newBalance}`);
    
    // Update UI if available
    updateWalletDisplay();
    
    return newBalance;
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
 * @param {Object} downloadDetails Download details (optional)
 */
function onPurchaseComplete(artistId, includesArtistocks, tokenAmount, downloadDetails = null) {
    console.log(`Purchase complete for ${artistId}: tokens=${includesArtistocks ? tokenAmount : 0}, download=${!!downloadDetails}`);
    
    if (!artistId) {
        console.error('Invalid artist ID in onPurchaseComplete');
        return;
    }
    
    // Initialize artist entry if it doesn't exist
    if (!userAssets[artistId]) {
        userAssets[artistId] = {
            tokens: 0,
            downloads: []
        };
    }
    
    // Handle token purchase
    if (includesArtistocks && tokenAmount !== 0) {
        // Ensure we have a valid token amount
        let actualTokenCount;
        
        if (typeof tokenAmount === 'string') {
            actualTokenCount = parseInt(tokenAmount.replace(/,/g, ''));
        } else if (typeof tokenAmount === 'number') {
            actualTokenCount = Math.floor(tokenAmount);
        } else {
            console.error('Invalid token amount type:', typeof tokenAmount);
            return;
        }
        
        // Validate the token amount
        if (isNaN(actualTokenCount) || !isFinite(actualTokenCount)) {
            console.error('Invalid token amount:', tokenAmount);
            return;
        }
        
        // Validate minimum purchase amount if adding tokens
        if (actualTokenCount > 0) {
            const purchaseAmount = actualTokenCount * TOKEN_PRICE;
            if (purchaseAmount < MIN_PURCHASE_AMOUNT) {
                console.error(`Purchase amount $${purchaseAmount.toFixed(2)} is below minimum $${MIN_PURCHASE_AMOUNT.toFixed(2)}`);
                return;
            }
        }
        
        console.log(`Adding ${actualTokenCount} tokens to wallet for ${artistId}`);
        
        // Add tokens to user assets
        userAssets[artistId].tokens = (userAssets[artistId].tokens || 0) + actualTokenCount;
        
        // Save to localStorage
        saveUserAssets();
    }
    
    // Handle download purchase
    if (downloadDetails && typeof downloadDetails === 'object') {
        // Ensure downloads array exists
        if (!userAssets[artistId].downloads) {
            userAssets[artistId].downloads = [];
        }
        
        // Add download if not already present
        const exists = userAssets[artistId].downloads.some(d => d.ipfsHash === downloadDetails.ipfsHash);
        if (!exists) {
            userAssets[artistId].downloads.push(downloadDetails);
            
            // Save to localStorage
            saveUserAssets();
        }
    }
    
    // Update wallet display
    updateWalletDisplay(artistId); // Highlight the updated artist section
    
    // Show wallet if not already open
    if (!isWalletOpen) {
        setTimeout(() => {
            toggleWallet(true, artistId); // Force open and highlight artist
        }, 1000);
    }
}

/**
 * Update UI elements with consistent token amounts
 * @param {String} artistId Artist ID
 * @param {Number} tokenAmount Token amount from purchase
 * @param {Number} totalBalance Total balance after purchase
 */
function updateUIElements(artistId, tokenAmount, totalBalance) {
    const elements = {
        purchaseAmount: document.getElementById('purchaseAmount'),
        artistStockName: document.getElementById('artistStockName'),
        tokenAmountInput: document.getElementById('tokenAmountInput'),
        tokenTotalInput: document.getElementById('tokenTotalInput'),
        tokenSlider: document.getElementById('tokenSlider'),
        walletBalance: document.getElementById('walletBalance')
    };
    
    // Format numbers consistently
    const formattedAmount = new Intl.NumberFormat().format(tokenAmount);
    const formattedTotal = new Intl.NumberFormat().format(totalBalance);
    
    // Update purchase amount display
    if (elements.purchaseAmount) {
        elements.purchaseAmount.textContent = formattedAmount;
    }
    
    // Update artist stock name
    if (elements.artistStockName) {
        const artistData = window.config?.artists?.[artistId];
        const artistName = artistData ? (artistData.name || artistId.toUpperCase()) : artistId.toUpperCase();
        elements.artistStockName.textContent = artistName;
    }
    
    // Update input fields
    if (elements.tokenAmountInput) {
        elements.tokenAmountInput.value = formattedAmount;
    }
    
    if (elements.tokenTotalInput) {
        const cashValue = (tokenAmount * TOKEN_PRICE).toFixed(2);
        elements.tokenTotalInput.value = cashValue;
    }
    
    // Update slider
    if (elements.tokenSlider) {
        elements.tokenSlider.value = tokenAmount;
    }
    
    // Update wallet balance
    if (elements.walletBalance) {
        elements.walletBalance.textContent = formattedTotal;
    }
    
    // Refresh token lists if available
    if (typeof window.refreshTokenLists === 'function') {
        window.refreshTokenLists();
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