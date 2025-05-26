/**
 * ZEYODA Purchase Module
 * Manages purchase functionality including token amounts, payment processing, and UI updates
 */

// Import configuration
import { config } from './config.js';

// Constants for token pricing
const TOKEN_PRICE = 0.0005; // $0.0005 per token
const MIN_PURCHASE_AMOUNT = 1.00; // $1 minimum purchase

/**
 * Set up the purchase flow with the given application state
 * @param {Object} appState - Application state object
 * @param {string} appState.currentArtist - Current active artist ID
 * @param {number} appState.currentTokenAmount - Amount of tokens in purchase
 * @param {Object} appState.contentUnlocked - Record of which artists' content is unlocked
 */
export function setupPurchaseFlow(appState = {}) {
    // Helper function to show error banners
    function showErrorBanner(container, message) {
        if (!container) {
            console.error('Cannot show error banner: no container element');
            return;
        }
        
        // Create an error banner style if it doesn't exist
        if (!document.querySelector('style#purchase-error-styles')) {
            const style = document.createElement('style');
            style.id = 'purchase-error-styles';
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
    
    // Extract state from passed object or use defaults
    let currentArtist = appState.currentArtist || localStorage.getItem('currentArtist') || '';
    let currentTokenAmount = appState.currentTokenAmount || parseInt(localStorage.getItem('currentTokenAmount')) || 100;
    let contentUnlocked = appState.contentUnlocked || JSON.parse(localStorage.getItem('contentUnlocked') || '{}');
    
    // These values should always be read from localStorage
    let isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
    let safewordUsed = localStorage.getItem('safewordUsed') === 'true';
    
    // Initialize all components
    setupContentUnlockToggle();
    setupPaymentButtons();
    setupTokenSlider();
    
    // Update price display
    updateTotalPrice();
    
    // Expose generateIPFSHash function to window for use in other modules
    if (typeof window !== 'undefined') {
        window.generateIPFSHash = generateIPFSHash;
    }
    
    // Export functions that need to be accessible from outside
    return {
        handleBuyClick,
        updateBuyButton,
        updateTotalPrice,
        updateFromTokenAmount,
        getCurrentArtistData,
        setupContentUnlockToggle,
        handlePayment,
        flashPaymentButton,
        showSuccessSection,
        ensurePurchaseSectionExists,
        createPaymentButtons,
        setupPaymentButtons,
        generateIPFSHash,
        setupTokenSlider
    };

    /**
     * Handle the buy button click event
     * Manages authentication check and purchase section display
     */
    function handleBuyClick() {
        console.log("Buy button clicked - Current artist:", currentArtist);
        
        // Always check authentication from localStorage
        isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
        safewordUsed = localStorage.getItem('safewordUsed') === 'true';
        
        console.log("Authentication state:", isAuthenticated); 
        
        // Get purchase options selection state
        const contentUnlockToggle = document.getElementById('contentUnlockToggle');
        const includesDownload = contentUnlockToggle && contentUnlockToggle.checked;
        let artistocksTotal = 0;
        
        // Calculate artistocks amount if safeword is used
        if (safewordUsed) {
            const artistData = getCurrentArtistData();
            if (artistData && currentTokenAmount > 0) {
                artistocksTotal = currentTokenAmount * artistData.tokenPrice;
            }
        }
        
        // Check if either download or artistocks is selected
        const hasValidSelection = includesDownload || (safewordUsed && artistocksTotal > 0);
        
        // Check authentication first
        if (!isAuthenticated) {
            console.log("Not authenticated, showing login and applying gentle shake animation");
            
            // Make sure login section is visible first
            const loginSection = document.getElementById('loginSection');
            if (loginSection) {
                loginSection.style.display = 'flex';
                loginSection.style.opacity = '1';
                
                // Apply gentle shake animation to the login section
                loginSection.style.animation = '';
                void loginSection.offsetWidth; // Force reflow
                loginSection.style.animation = 'shake 1.2s ease-in-out';
                
                // Scroll to login section
                loginSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
                
                // Reset animation after it completes
                setTimeout(() => {
                    loginSection.style.animation = '';
                }, 1200);
            }
            
            // Also gently shake the buy button to indicate action needed
            const buyButton = document.getElementById('buyButton');
            if (buyButton) {
                buyButton.style.animation = '';
                void buyButton.offsetWidth; // Force reflow
                buyButton.style.animation = 'shake 1.2s ease-in-out';
                
                // Reset animation after it completes
                setTimeout(() => {
                    buyButton.style.animation = '';
                }, 1200);
            }
            
            return;
        }
        
        // If no valid selection (neither download nor artistocks), show error and return
        if (!hasValidSelection) {
            console.log("No valid purchase selection");
            
            // Highlight the toggle to indicate it should be checked
            if (contentUnlockToggle) {
                contentUnlockToggle.parentElement.style.boxShadow = '0 0 10px rgba(255, 255, 255, 0.5)';
                setTimeout(() => {
                    contentUnlockToggle.parentElement.style.boxShadow = '';
                }, 3000);
            }
            
            // Show error banner
            const tokenSection = document.getElementById('tokenPreviewSection');
            if (tokenSection) {
                showErrorBanner(tokenSection, "Please select an option to continue with your purchase");
            }
            
            return;
        }
        
        // If download isn't checked AND safeword hasn't been used, show error
        if (!includesDownload && !safewordUsed) {
            console.log("Download not selected and safeword not used, prompting user to check the box");
            
            // Highlight the toggle to indicate it should be checked
            if (contentUnlockToggle) {
                contentUnlockToggle.parentElement.style.boxShadow = '0 0 10px rgba(255, 255, 255, 0.5)';
                setTimeout(() => {
                    contentUnlockToggle.parentElement.style.boxShadow = '';
                }, 3000);
            }
            
            // Show error banner
            const tokenSection = document.getElementById('tokenPreviewSection');
            if (tokenSection) {
                showErrorBanner(tokenSection, "Please select the Download option to continue");
            }
            
            return;
        }
        
        console.log("Authenticated, proceeding with purchase flow");
        
        // Force-create the purchase section if it doesn't exist
        ensurePurchaseSectionExists();
        
        // Get the purchase section directly
        const purchaseSection = document.getElementById('purchaseSection');
        if (!purchaseSection) {
            console.error("Purchase section still not found after trying to create it!");
            return;
        }
        
        // First hide all other sections
        document.querySelectorAll('.content-section > div').forEach(section => {
            if (section.id !== 'purchaseSection') {
                section.style.display = 'none';
            }
        });
        
        // Calculate the correct total price and update the headline
        const artistData = getCurrentArtistData();
        if (!artistData) {
            console.error("Could not get artist data!");
            return;
        }
        
        // Check if advanced purchase options are visible and have a value
        const unlockCost = contentUnlockToggle && contentUnlockToggle.checked ? 1 : 0;
        
        // Calculate total price (artistocks + $1 download)
        const totalPrice = artistocksTotal + unlockCost;
        console.log(`Total price: $${totalPrice.toFixed(2)} (Artistocks: $${artistocksTotal.toFixed(2)}, Download: $${unlockCost})`);
        
        // Explicitly update purchase headline
        const purchaseHeadline = document.getElementById('purchaseHeadline');
        if (purchaseHeadline) {
            if (safewordUsed && artistocksTotal > 0) {
                if (unlockCost > 0) {
                    // Both artistocks and download
                    purchaseHeadline.innerHTML = `Complete your purchase of <span id="purchaseAmount">${new Intl.NumberFormat().format(currentTokenAmount)}</span> <span id="artistStockPurchaseName">${artistData.name}</span> Artistocks + <span class="price-highlight-small">$1 Download</span> for <span class="price-highlight-small">$${totalPrice.toFixed(2)}</span>`;
                } else {
                    // Just artistocks, no download
                    purchaseHeadline.innerHTML = `Complete your purchase of <span id="purchaseAmount">${new Intl.NumberFormat().format(currentTokenAmount)}</span> <span id="artistStockPurchaseName">${artistData.name}</span> Artistocks for <span class="price-highlight-small">$${totalPrice.toFixed(2)}</span>`;
                }
            } else if (unlockCost > 0) {
                // Just download
                purchaseHeadline.innerHTML = `Complete your download purchase for <span class="price-highlight-small">$1</span>`;
            } else {
                // No purchase selected - this should never happen with our early validation
                purchaseHeadline.innerHTML = `Please select an option to continue`;
            }
        }
        
        // Now force display the purchase section
        purchaseSection.style.display = 'block';
        purchaseSection.style.opacity = '1';
        
        // Ensure payment section is visible
        const paymentSection = purchaseSection.querySelector('.payment-section');
        if (paymentSection) {
            paymentSection.style.display = 'grid';
            paymentSection.style.opacity = '1';
        }
        
        // Extra check for payment buttons - create them if missing
        if (document.querySelectorAll('.payment-btn').length === 0) {
            createPaymentButtons();
        }
        
        // Force redraw
        void purchaseSection.offsetHeight;
        
        // Scroll it into view
        purchaseSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        console.log("Purchase flow setup complete - Forced display of purchase section");
    }

    /**
     * Function to update total price
     * Updates the token total input and buy button text based on purchase options
     */
    function updateTotalPrice() {
        console.log("Updating total price");
        const tokenTotalInput = document.getElementById('tokenTotalInput');
        const contentUnlockToggle = document.getElementById('contentUnlockToggle');
        const buyButton = document.getElementById('buyButton');
        
        if (!tokenTotalInput || !contentUnlockToggle) return;
        
        // Get safeword status
        safewordUsed = localStorage.getItem('safewordUsed') === 'true';
        
        // Get artist data
        const artistData = getCurrentArtistData();
        if (!artistData) {
            console.error("Could not get artist data in updateTotalPrice");
            return;
        }
        
        // Calculate exact token amount from slider or input
        let exactTokenAmount = 0;
        const tokenInput = document.getElementById('tokenAmountInput');
        const slider = document.getElementById('tokenSlider');
        
        if (tokenInput && tokenInput.value) {
            exactTokenAmount = parseInt(tokenInput.value.replace(/,/g, ''));
        } else if (slider) {
            exactTokenAmount = parseInt(slider.value);
        }
        
        // Validate token amount
        if (isNaN(exactTokenAmount) || !isFinite(exactTokenAmount)) {
            exactTokenAmount = 0;
        }
        
        // Calculate costs
        const artistocksTotal = exactTokenAmount * TOKEN_PRICE;
        const unlockCost = contentUnlockToggle.checked ? 1 : 0;
        const total = artistocksTotal + unlockCost;
        
        // Enforce minimum purchase amount for artistocks
        if (safewordUsed && artistocksTotal > 0 && artistocksTotal < MIN_PURCHASE_AMOUNT) {
            const minTokens = Math.ceil(MIN_PURCHASE_AMOUNT / TOKEN_PRICE);
            exactTokenAmount = minTokens;
            updateFromTokenAmount(minTokens);
        }
        
        // Update total input with correct price
        tokenTotalInput.value = total.toFixed(2);
        
        // Store exact amount for later use
        localStorage.setItem('currentTokenAmount', exactTokenAmount);
        
        // Update purchase headline and button
        const purchaseHeadline = document.getElementById('purchaseHeadline');
        if (purchaseHeadline) {
            if (safewordUsed && exactTokenAmount > 0) {
                if (unlockCost > 0) {
                    purchaseHeadline.innerHTML = `Complete your purchase of ${new Intl.NumberFormat().format(exactTokenAmount)} ${artistData.name} Artistocks + <span class="price-highlight-small">$1 Download</span> for <span class="price-highlight-small">$${total.toFixed(2)}</span>`;
                    buyButton.textContent = `Get Download + ${new Intl.NumberFormat().format(exactTokenAmount)} Artistocks ($${total.toFixed(2)})`;
                } else {
                    purchaseHeadline.innerHTML = `Complete your purchase of ${new Intl.NumberFormat().format(exactTokenAmount)} ${artistData.name} Artistocks for <span class="price-highlight-small">$${artistocksTotal.toFixed(2)}</span>`;
                    buyButton.textContent = `Buy ${new Intl.NumberFormat().format(exactTokenAmount)} Artistocks ($${artistocksTotal.toFixed(2)})`;
                }
            } else if (unlockCost > 0) {
                purchaseHeadline.innerHTML = `Complete your download purchase for <span class="price-highlight-small">$1.00</span>`;
                buyButton.textContent = `Get Download ($1.00)`;
            } else {
                purchaseHeadline.innerHTML = `Please select an option to continue`;
                buyButton.textContent = 'Select Purchase Options';
            }
        }
        
        // Update button state
        const hasValidSelection = unlockCost > 0 || (safewordUsed && exactTokenAmount > 0);
        if (buyButton) {
            buyButton.disabled = !hasValidSelection;
            buyButton.style.opacity = hasValidSelection ? '1' : '0.5';
            buyButton.style.cursor = hasValidSelection ? 'pointer' : 'not-allowed';
        }
    }

    /**
     * Get current artist data from configuration
     * @returns {Object|null} The current artist data or null if not found
     */
    function getCurrentArtistData() {
        if (!currentArtist) return null;
        
        // Try to get data from the new wallets structure (preferred)
        if (config.wallets) {
            // Look for a wallet that has this artist ID
            for (const wallet of Object.values(config.wallets)) {
                if (wallet.artistId === currentArtist) {
                    return wallet;
                }
            }
        }
        
        // Fallback to direct lookup in artists structure
        if (config.artists && config.artists[currentArtist]) {
            return config.artists[currentArtist];
        }
        
        console.error(`Artist data not found for: ${currentArtist}`);
        return null;
    }

    /**
     * Generate a simulated IPFS hash for download links
     * @returns {string} A random IPFS hash starting with 'Qm'
     */
    function generateIPFSHash() {
        const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
        let hash = 'Qm';
        for (let i = 0; i < 44; i++) {
            hash += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return hash;
    }

    /**
     * Update UI elements when token amount changes
     * @param {number} tokens - New token amount
     */
    function updateFromTokenAmount(tokens) {
        // Update current token amount
        currentTokenAmount = tokens;
        
        // Store current token amount in localStorage for persistence
        localStorage.setItem('currentTokenAmount', tokens);
        console.log(`Saved token amount to localStorage: ${tokens}`);
        
        // Get artist data
        const artistData = getCurrentArtistData();
        if (!artistData) {
            console.error("Could not get artist data in updateFromTokenAmount");
            return;
        }
        
        // Update token number display
        const tokenNumberDisplay = document.getElementById('tokenNumber');
        if (tokenNumberDisplay) {
            tokenNumberDisplay.textContent = new Intl.NumberFormat().format(tokens);
        }
        
        // Update token amount input
        const tokenAmountInput = document.getElementById('tokenAmountInput');
        if (tokenAmountInput) {
            tokenAmountInput.value = new Intl.NumberFormat().format(tokens);
        }
        
        // Update slider
        const slider = document.getElementById('tokenSlider');
        if (slider) {
            slider.value = tokens;
        }
        
        // Calculate token price
        const tokenPrice = TOKEN_PRICE * tokens;
        
        // Update token price display
        const tokenPriceDisplay = document.getElementById('tokenPrice');
        if (tokenPriceDisplay) {
            tokenPriceDisplay.textContent = `$${tokenPrice.toFixed(2)}`;
        }
        
        // Update total price calculation
        updateTotalPrice();
    }

    /**
     * Setup token slider functionality
     */
    function setupTokenSlider() {
        const slider = document.getElementById('tokenSlider');
        const tokenAmountInput = document.getElementById('tokenAmountInput');
        
        if (!slider || !tokenAmountInput) return;
        
        // Set initial values
        const initialTokens = parseInt(localStorage.getItem('currentTokenAmount')) || 100;
        slider.value = initialTokens;
        tokenAmountInput.value = new Intl.NumberFormat().format(initialTokens);
        
        // Update on slider change
        slider.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            if (!isNaN(value) && isFinite(value)) {
                updateFromTokenAmount(value);
            }
        });
        
        // Update on input change
        tokenAmountInput.addEventListener('input', (e) => {
            const value = parseInt(e.target.value.replace(/,/g, ''));
            if (!isNaN(value) && isFinite(value)) {
                updateFromTokenAmount(value);
                slider.value = value;
            }
        });
        
        // Initial update
        updateFromTokenAmount(initialTokens);
    }

    /**
     * Update buy button text based on current state
     */
    function updateBuyButton() {
        const buyButton = document.getElementById('buyButton');
        if (!buyButton) return;
        
        // Get safeword status
        safewordUsed = localStorage.getItem('safewordUsed') === 'true';
        
        // Get content unlock status
        const contentUnlockToggle = document.getElementById('contentUnlockToggle');
        const includesDownload = contentUnlockToggle && contentUnlockToggle.checked;
        
        // Get token amount for price calculation
        const artistData = getCurrentArtistData();
        if (!artistData) {
            console.error("Could not get artist data in updateBuyButton");
            return;
        }
        
        // Calculate artistocks total
        let artistocksTotal = 0;
        if (currentTokenAmount > 0) {
            artistocksTotal = currentTokenAmount * artistData.tokenPrice;
        }
        
        // Calculate total price
        const total = artistocksTotal + (includesDownload ? 1 : 0);
        
        // Check if we have a valid selection
        const hasValidSelection = includesDownload || (safewordUsed && artistocksTotal > 0);
        
        // Disable button if no valid selection is made
        buyButton.disabled = !hasValidSelection;
        
        if (!hasValidSelection) {
            buyButton.style.opacity = '0.5';
            buyButton.style.cursor = 'not-allowed';
            buyButton.textContent = 'Select Purchase Options';
            return;
        } else {
            buyButton.style.opacity = '1';
            buyButton.style.cursor = 'pointer';
        }
        
        // Update button text based on purchase content and safeword status
        if (safewordUsed) {
            // Safeword has been used, show all options
            if (artistocksTotal > 0) {
                if (includesDownload) {
                    // Both artistocks and download
                    buyButton.textContent = `Get Download + ${new Intl.NumberFormat().format(currentTokenAmount)} Artistocks ($${total.toFixed(2)})`;
                } else {
                    // Just artistocks
                    buyButton.textContent = `Buy ${new Intl.NumberFormat().format(currentTokenAmount)} Artistocks ($${artistocksTotal.toFixed(2)})`;
                }
            } else if (includesDownload) {
                // Just download
                buyButton.textContent = `Get Download ($${config.defaults.downloadPrice.toFixed(2)})`;
            }
            
            buyButton.classList.add('safeword-activated');
        } else {
            // Safeword has NOT been used, only show download option
            buyButton.textContent = `Get Download ($${config.defaults.downloadPrice.toFixed(2)})`;
            buyButton.classList.remove('safeword-activated');
        }
    }

    /**
     * Setup content unlock toggle functionality
     */
    function setupContentUnlockToggle() {
        const toggle = document.getElementById('contentUnlockToggle');
        if (!toggle) return;
        
        // Remove existing event listeners by cloning and replacing
        const newToggle = toggle.cloneNode(true);
        toggle.parentNode.replaceChild(newToggle, toggle);
        
        // Get the new reference
        const updatedToggle = document.getElementById('contentUnlockToggle');
        
        // Listen for changes to update total price
        updatedToggle.addEventListener('change', () => {
            console.log(`Content unlock toggle changed to: ${updatedToggle.checked ? 'checked' : 'unchecked'}`);
            
            // Get safeword status
            safewordUsed = localStorage.getItem('safewordUsed') === 'true';
            
            // Update the total price calculation
            updateTotalPrice();
            
            // Update buy button text to reflect the change
            updateBuyButton();
            
            // If safeword is used and no artistocks are selected and download is unchecked, warn the user
            if (safewordUsed && currentTokenAmount === 0 && !updatedToggle.checked) {
                console.warn("No purchase selected");
                
                // Highlight the toggle to indicate action needed
                updatedToggle.parentElement.style.boxShadow = '0 0 10px rgba(255, 255, 255, 0.5)';
                setTimeout(() => {
                    updatedToggle.parentElement.style.boxShadow = '';
                }, 3000);
                
                // If no valid selection, force toggle back on
                updatedToggle.checked = true;
                
                // Update pricing again after forcing the toggle
                updateTotalPrice();
                updateBuyButton();
            }
            
            // If safeword is NOT used and download is unchecked, force it back on
            if (!safewordUsed && !updatedToggle.checked) {
                console.warn("Download must be selected when safeword is not used");
                
                // Highlight the toggle to indicate action needed
                updatedToggle.parentElement.style.boxShadow = '0 0 10px rgba(255, 255, 255, 0.5)';
                setTimeout(() => {
                    updatedToggle.parentElement.style.boxShadow = '';
                }, 3000);
                
                // Force toggle back on
                updatedToggle.checked = true;
                
                // Update pricing again
                updateTotalPrice();
                updateBuyButton();
            }
        });
    }

    /**
     * Handle payment method selection
     * @param {string} method - Payment method (credit, paypal, venmo, crypto)
     */
    function handlePayment(method) {
        console.log(`Payment selected: ${method} for artist: ${currentArtist}`);
        
        // Get current state
        const contentUnlockToggle = document.getElementById('contentUnlockToggle');
        const includesDownload = contentUnlockToggle && contentUnlockToggle.checked;
        safewordUsed = localStorage.getItem('safewordUsed') === 'true';
        
        // Get artist data
        const artistData = getCurrentArtistData();
        if (!artistData) {
            console.error("Could not get artist data in handlePayment");
            const purchaseSection = document.getElementById('purchaseSection');
            if (purchaseSection) {
                showErrorBanner(purchaseSection, "Failed to load artist data for this purchase");
            }
            return;
        }
        
        // Get exact token amount from stored value
        const exactTokenAmount = parseInt(localStorage.getItem('currentTokenAmount')) || 0;
        
        // Validate token amount
        if (isNaN(exactTokenAmount) || !isFinite(exactTokenAmount)) {
            console.error("Invalid token amount detected");
            return;
        }
        
        // Calculate final costs
        const artistocksTotal = exactTokenAmount * TOKEN_PRICE;
        const total = artistocksTotal + (includesDownload ? 1 : 0);
        
        // Validate minimum purchase amount
        if (safewordUsed && artistocksTotal > 0 && artistocksTotal < MIN_PURCHASE_AMOUNT) {
            const purchaseSection = document.getElementById('purchaseSection');
            if (purchaseSection) {
                showErrorBanner(purchaseSection, `Minimum purchase amount is $${MIN_PURCHASE_AMOUNT.toFixed(2)}`);
            }
            return;
        }
        
        console.log(`Processing payment: $${total.toFixed(2)} (Artistocks: ${artistocksTotal.toFixed(2)}, Download: ${includesDownload ? '$1.00' : 'No'}, Tokens: ${exactTokenAmount})`);
        
        // Flash the payment button
        flashPaymentButton(method);
        
        // Process payment
        setTimeout(() => {
            // Generate IPFS hash for download if included
            let downloadDetails = null;
            if (includesDownload) {
                const ipfsHash = generateIPFSHash();
                downloadDetails = {
                    title: artistData.artworkTitle || 'Digital Download',
                    ipfsHash: ipfsHash,
                    date: new Date().toISOString()
                };
            }
            
            // Update wallet with exact token amount and download
            if (window.wallet && typeof window.wallet.onPurchaseComplete === 'function') {
                window.wallet.onPurchaseComplete(
                    currentArtist,
                    safewordUsed && exactTokenAmount > 0,
                    exactTokenAmount,
                    downloadDetails
                );
            }
            
            // Show success section with exact token amount
            showSuccessSection(safewordUsed && exactTokenAmount > 0, exactTokenAmount, downloadDetails);
            
            // Clear stored token amount after successful purchase
            localStorage.removeItem('currentTokenAmount');
        }, 800);
    }

    /**
     * Show success section with appropriate content
     * @param {boolean} includesArtistocks - Whether the purchase includes artistocks
     * @param {number} exactTokenAmount - The exact number of tokens purchased
     */
    function showSuccessSection(includesArtistocks = false, exactTokenAmount = null, downloadDetails = null) {
        console.log(`Showing success section for ${includesArtistocks ? 'artistocks+download' : 'download only'}, token amount: ${exactTokenAmount}`);
        
        // Ensure success section exists
        let successSection = document.getElementById('successSection');
        
        // Get artist data
        const artistData = getCurrentArtistData();
        if (!artistData) {
            console.error("Could not get artist data in showSuccessSection");
            return;
        }

        // Use the exact token amount if provided
        const displayTokenAmount = exactTokenAmount || 0;
        const formattedTokens = new Intl.NumberFormat().format(displayTokenAmount);
        
        // Create or update success section content
        if (!successSection) {
            successSection = document.createElement('div');
            successSection.id = 'successSection';
            successSection.className = 'success-section';
            document.querySelector('.content-section').appendChild(successSection);
        }
        
        // Update success section content
        successSection.innerHTML = `
            <div class="success-check">✓</div>
            <h3>${includesArtistocks ? 
                `You now own ${formattedTokens} ${artistData.name} Artistocks!` : 
                "You've unlocked this download!"}</h3>
            <p>${includesArtistocks ? 
                'Your purchase is complete and you are now officially in the orbit.' : 
                'Your purchase gives you permanent access to this content.'}</p>
            ${downloadDetails ? 
                `<p>🎵 <a href="#" onclick="alert('Downloading content...')" class="download-link">Download your content (IPFS: ${downloadDetails.ipfsHash})</a></p>` : 
                ''}
            <button class="explore-btn">
                ${currentArtist === 'gosheesh' ? 'Explore JAI TEA' : 'Explore GOSHEESH'}
            </button>
        `;
        
        // Add click handler to explore button
        const exploreBtn = successSection.querySelector('.explore-btn');
        if (exploreBtn) {
            exploreBtn.addEventListener('click', () => {
                const nextArtist = currentArtist === 'gosheesh' ? 'jaitea' : 'gosheesh';
                if (typeof window.transitionToArtist === 'function') {
                    window.transitionToArtist(nextArtist);
                } else {
                    currentArtist = nextArtist;
                    localStorage.setItem('currentArtist', currentArtist);
                    window.location.reload();
                }
            });
        }
        
        // Hide purchase section
        const purchaseSection = document.getElementById('purchaseSection');
        if (purchaseSection) {
            purchaseSection.style.display = 'none';
        }
        
        // Show and scroll to success section
        successSection.style.display = 'block';
        successSection.style.opacity = '1';
        successSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Mark content as unlocked in localStorage
        if (downloadDetails) {
            const contentUnlocked = JSON.parse(localStorage.getItem('contentUnlocked') || '{}');
            contentUnlocked[currentArtist] = true;
            localStorage.setItem('contentUnlocked', JSON.stringify(contentUnlocked));
        }
    }

    /**
     * Flash animation for the selected payment button
     * @param {string} method - Payment method (credit, paypal, venmo, crypto)
     */
    function flashPaymentButton(method) {
        const button = document.querySelector(`.payment-btn.${method}`);
        if (!button) {
            console.error(`Payment button for method ${method} not found!`);
            return;
        }
        
        button.style.transform = 'scale(1.05)';
        button.style.boxShadow = '0 0 20px rgba(255, 255, 255, 0.5)';
        
        setTimeout(() => {
            button.style.transform = '';
            button.style.boxShadow = '';
        }, 300);
    }

    /**
     * Ensure purchase section exists in the DOM
     */
    function ensurePurchaseSectionExists() {
        console.log("Ensuring purchase section exists");
        
        let purchaseSection = document.getElementById('purchaseSection');
        
        // If purchase section doesn't exist, create it
        if (!purchaseSection) {
            console.log("Purchase section not found, creating it");
            const contentSection = document.querySelector('.content-section');
            if (contentSection) {
                purchaseSection = document.createElement('div');
                purchaseSection.className = 'purchase-section';
                purchaseSection.id = 'purchaseSection';
                
                // Add headline
                const headline = document.createElement('h3');
                headline.id = 'purchaseHeadline';
                headline.innerHTML = `Complete your download purchase for <span class="price-highlight-small">$1</span>`;
                purchaseSection.appendChild(headline);
                
                // Add payment section
                const paymentSection = document.createElement('div');
                paymentSection.className = 'payment-section';
                purchaseSection.appendChild(paymentSection);
                
                // Add payment buttons
                createPaymentButtons(paymentSection);
                
                // Add to DOM
                contentSection.appendChild(purchaseSection);
                console.log("Created new purchase section");
            } else {
                console.error("Content section not found, cannot create purchase section");
                
                // Show error banner on any available element
                const tokenSection = document.getElementById('tokenPreviewSection');
                if (tokenSection) {
                    showErrorBanner(tokenSection, "There was a problem preparing the purchase form. Please try refreshing the page.");
                } else {
                    // Last resort - show on body
                    showErrorBanner(document.body, "There was a problem preparing the purchase form. Please try refreshing the page.");
                }
            }
        } else {
            // Ensure purchase section has a payment section
            let paymentSection = purchaseSection.querySelector('.payment-section');
            if (!paymentSection) {
                console.log("Payment section not found, creating it");
                paymentSection = document.createElement('div');
                paymentSection.className = 'payment-section';
                purchaseSection.appendChild(paymentSection);
                
                // Add payment buttons
                createPaymentButtons(paymentSection);
            }
        }
    }

    /**
     * Create payment buttons in the specified container
     * @param {HTMLElement} [parentElement] - Container for the buttons, defaults to .payment-section
     */
    function createPaymentButtons(parentElement) {
        const paymentSection = parentElement || document.querySelector('.payment-section');
        if (!paymentSection) {
            console.error("Cannot create payment buttons: no payment section found");
            return;
        }
        
        console.log("Creating payment buttons");
        
        // Clear existing buttons
        paymentSection.innerHTML = '';
        
        // Add payment buttons
        const paymentMethods = ['credit', 'paypal', 'venmo', 'crypto'];
        paymentMethods.forEach(method => {
            const btn = document.createElement('button');
            btn.className = `payment-btn ${method}`;
            btn.textContent = method === 'credit' ? 'Credit Card' : 
                             method.charAt(0).toUpperCase() + method.slice(1);
            
            // Add click handler
            btn.addEventListener('click', () => handlePayment(method));
            
            paymentSection.appendChild(btn);
        });
    }

    /**
     * Set up payment buttons with event handlers
     */
    function setupPaymentButtons() {
        console.log("Setting up payment buttons");
        const paymentButtons = document.querySelectorAll('.payment-btn');
        
        if (paymentButtons.length === 0) {
            console.log("No payment buttons found, checking for payment section");
            
            // Try to find the payment section
            const paymentSection = document.querySelector('.payment-section');
            if (paymentSection) {
                console.log("Payment section found, but no buttons. Creating them...");
                
                // Add payment buttons
                createPaymentButtons(paymentSection);
            } else {
                console.log("Payment section not found either. Will create when needed.");
            }
            
            return;
        }
        
        console.log(`Found ${paymentButtons.length} payment buttons, attaching handlers`);
        
        paymentButtons.forEach(button => {
            // Remove existing event listeners by cloning and replacing
            const newButton = button.cloneNode(true);
            button.parentNode.replaceChild(newButton, button);
            const method = newButton.classList[1]; // Get the payment method from class
            
            if (!method) {
                console.error("Payment button missing method class:", newButton);
                return;
            }
            
            newButton.addEventListener('click', () => handlePayment(method));
        });
    }
}

// Function implementations will be added below 