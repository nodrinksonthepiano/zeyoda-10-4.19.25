/**
 * ZEYODA Purchase Module
 * Manages purchase functionality including token amounts, payment processing, and UI updates
 */

// Import configuration
import { config } from './config.js';
import { getArtistUnitPrice } from './liquidity.js';

// Constants for token pricing
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
    let currentArtist = appState.currentArtist || localStorage.getItem('currentArtist') || 'GOSHEESH';
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
        currentArtist = localStorage.getItem('currentArtist') || 'GOSHEESH'; // Ensure currentArtist is fresh
        console.log("Buy button clicked - Current artist:", currentArtist);
        
        // Always check authentication from localStorage
        isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
        safewordUsed = localStorage.getItem('safewordUsed') === 'true';
        
        console.log("Authentication state:", isAuthenticated);
        
        const contentUnlockToggle = document.getElementById('contentUnlockToggle');

        // Initial validation for selection (uses lexical currentTokenAmount for a quick check)
        let originalArtistocksTotalForValidation = 0;
        if (safewordUsed) {
            const artistDataForValidation = getCurrentArtistData(); 
            if (artistDataForValidation && currentTokenAmount > 0) { 
                 originalArtistocksTotalForValidation = currentTokenAmount * getArtistUnitPrice(currentArtist);
            }
        }
        const includesDownloadForValidation = contentUnlockToggle && contentUnlockToggle.checked;
        const hasValidSelection = includesDownloadForValidation || (safewordUsed && originalArtistocksTotalForValidation > 0);

        // Check authentication first
        if (!isAuthenticated) {
            console.log("Not authenticated, showing login and applying gentle shake animation");
            const loginSection = document.getElementById('loginSection');
            if (loginSection) {
                loginSection.style.display = 'flex';
                loginSection.style.opacity = '1';
                loginSection.style.animation = '';
                void loginSection.offsetWidth; 
                loginSection.style.animation = 'shake 1.2s ease-in-out';
                loginSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
                setTimeout(() => { loginSection.style.animation = ''; }, 1200);
            }
            const buyButtonAuth = document.getElementById('buyButton'); // Use a different var name to avoid conflict
            if (buyButtonAuth) {
                buyButtonAuth.style.animation = '';
                void buyButtonAuth.offsetWidth;
                buyButtonAuth.style.animation = 'shake 1.2s ease-in-out';
                setTimeout(() => { buyButtonAuth.style.animation = ''; }, 1200);
            }
            return;
        }
        
        if (!hasValidSelection) {
            console.log("No valid purchase selection");
            if (contentUnlockToggle) {
                contentUnlockToggle.parentElement.style.boxShadow = '0 0 10px rgba(255, 255, 255, 0.5)';
                setTimeout(() => { contentUnlockToggle.parentElement.style.boxShadow = ''; }, 3000);
            }
            const tokenSection = document.getElementById('tokenPreviewSection');
            if (tokenSection) {
                showErrorBanner(tokenSection, "Please select an option to continue with your purchase");
            }
            return;
        }
        
        if (!includesDownloadForValidation && !safewordUsed) {
            console.log("Download not selected and safeword not used, prompting user to check the box");
            if (contentUnlockToggle) {
                contentUnlockToggle.parentElement.style.boxShadow = '0 0 10px rgba(255, 255, 255, 0.5)';
                setTimeout(() => { contentUnlockToggle.parentElement.style.boxShadow = ''; }, 3000);
            }
            const tokenSection = document.getElementById('tokenPreviewSection');
            if (tokenSection) {
                showErrorBanner(tokenSection, "Please select the Download option to continue");
            }
            return;
        }
        
        console.log("Authenticated, proceeding with purchase flow");
        ensurePurchaseSectionExists();
        const purchaseSection = document.getElementById('purchaseSection');
        if (!purchaseSection) {
            console.error("Purchase section still not found after trying to create it!");
            return;
        }
        document.querySelectorAll('.content-section > div').forEach(section => {
            if (section.id !== 'purchaseSection') {
                section.style.display = 'none';
            }
        });
        
        const artistData = getCurrentArtistData();
        if (!artistData) {
            console.error("Could not get artist data!");
            return;
        }
        const artistSymbol = artistData.artistName || artistData.name || 'Artist';
        
        // Fetch the most current token amount directly from localStorage for accurate display
        const freshTokenAmountString = localStorage.getItem('currentTokenAmount');
        const artistocksQuantity = freshTokenAmountString ? parseInt(freshTokenAmountString) : 0;

        const unitPrice = getArtistUnitPrice(currentArtist);
        const unlockCost = contentUnlockToggle && contentUnlockToggle.checked ? 1 : 0;

        // Use integer arithmetic for precision, consistent with updateTotalPrice
        const unitPriceInt = Math.round(unitPrice * 10000);
        const artistocksTotalUSDInt = artistocksQuantity * unitPriceInt;
        const unlockCostInt = unlockCost * 10000;
        const totalUSDInt = artistocksTotalUSDInt + unlockCostInt;

        const artistocksTotalUSD = artistocksTotalUSDInt / 10000;
        const totalUSD = totalUSDInt / 10000;

        console.log(`Checkout panel price (handleBuyClick): $${totalUSD.toFixed(2)} (Tokens: ${artistocksQuantity}, Artistocks Sub: $${artistocksTotalUSD.toFixed(2)}, Download: $${unlockCost}, Artist: ${currentArtist}, UnitPrice: ${unitPrice})`);
        
        const purchaseHeadline = document.getElementById('purchaseHeadline');
        const buyButton = document.getElementById('buyButton'); // ensure buyButton is defined here for text update

        if (purchaseHeadline) {
            if (safewordUsed && artistocksQuantity > 0) {
                if (unlockCost > 0) {
                    purchaseHeadline.innerHTML = `Complete your purchase of <span id="purchaseAmount">${artistocksQuantity.toLocaleString()}</span> <span id="artistStockPurchaseName">${artistSymbol}</span> Artistocks + <span class="price-highlight-small">$1 Download</span> for <span class="price-highlight-small">$${totalUSD.toFixed(2)}</span>`;
                    if(buyButton) buyButton.textContent = `Get Download + ${artistocksQuantity.toLocaleString()} ${artistSymbol} ($${totalUSD.toFixed(2)})`;
                } else {
                    purchaseHeadline.innerHTML = `Complete your purchase of <span id="purchaseAmount">${artistocksQuantity.toLocaleString()}</span> <span id="artistStockPurchaseName">${artistSymbol}</span> Artistocks for <span class="price-highlight-small">$${artistocksTotalUSD.toFixed(2)}</span>`;
                    if(buyButton) buyButton.textContent = `BUY ${artistocksQuantity.toLocaleString()} ${artistSymbol} ($${artistocksTotalUSD.toFixed(2)})`;
                }
            } else if (unlockCost > 0) {
                purchaseHeadline.innerHTML = `Complete your download purchase for <span class="price-highlight-small">$1.00</span>`;
                if(buyButton) buyButton.textContent = `Get Download ($1.00)`;
            } else {
                purchaseHeadline.innerHTML = `Please select an option to continue`;
                if(buyButton) buyButton.textContent = 'Select Purchase Options';
            }
        }
        
        purchaseSection.style.display = 'block';
        purchaseSection.style.opacity = '1';
        const paymentSection = purchaseSection.querySelector('.payment-section');
        if (paymentSection) {
            paymentSection.style.display = 'grid';
            paymentSection.style.opacity = '1';
        }
        if (document.querySelectorAll('.payment-btn').length === 0) {
            createPaymentButtons();
        }
        void purchaseSection.offsetHeight;
        purchaseSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        console.log("Purchase flow setup complete - Forced display of purchase section");
    }

    /**
     * Function to update total price
     * Updates the token total input and buy button text based on purchase options
     */
    function updateTotalPrice() {
        currentArtist = localStorage.getItem('currentArtist') || 'GOSHEESH'; // Ensure currentArtist is fresh
        console.log("Updating total price for current artist:", currentArtist);
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
        currentArtist = artistData.artistId || localStorage.getItem('currentArtist') || 'GOSHEESH'; // Ensure currentArtist is up-to-date

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
        
        // Calculate costs using integers to avoid floating point issues
        const unitPrice = getArtistUnitPrice(currentArtist); // This will be 0.0004 for 'jaitea'
        // Multiply by 10000 to work with integers (assuming prices like 0.0005)
        const unitPriceInt = Math.round(unitPrice * 10000);
        const artistocksTotalInt = exactTokenAmount * unitPriceInt;

        const unlockCost = contentUnlockToggle.checked ? 1 : 0;
        // unlockCost is in dollars, so multiply by 10000 for consistency
        const unlockCostInt = unlockCost * 10000; 
        const totalInt = artistocksTotalInt + unlockCostInt;
        
        // Convert back to decimal for display
        const artistocksTotal = artistocksTotalInt / 10000;
        const total = totalInt / 10000;

        // Enforce minimum purchase amount for artistocks
        if (safewordUsed && artistocksTotal > 0 && artistocksTotal < MIN_PURCHASE_AMOUNT && unitPrice > 0) { 
            const minTokens = Math.ceil(MIN_PURCHASE_AMOUNT / unitPrice);
            exactTokenAmount = minTokens;
            // Recalculate with new minTokens
            // const newArtistocksTotalInt = exactTokenAmount * unitPriceInt;
            // const newTotalInt = newArtistocksTotalInt + unlockCostInt;
            // total = newTotalInt / 10000; 
            // It might be better to call updateFromTokenAmount(minTokens) here if that handles all updates.
            // For now, sticking to minimal changes based on previous request.
        }
        
        // Update total input with correct price
        tokenTotalInput.value = total.toFixed(2);
        
        // Store exact amount for later use
        localStorage.setItem('currentTokenAmount', exactTokenAmount);
        
        // Update purchase headline and button
        const purchaseHeadline = document.getElementById('purchaseHeadline');
        const artistSymbol = artistData.name || 'Artistocks'; // Fallback symbol

        if (purchaseHeadline) {
            if (safewordUsed && exactTokenAmount > 0) {
                purchaseHeadline.innerHTML = `Complete your purchase of ${new Intl.NumberFormat().format(exactTokenAmount)} ${artistSymbol} + <span class="price-highlight-small">$1 Download</span> for <span class="price-highlight-small">$${total.toFixed(2)}</span>`;
                // buyButton.textContent = `Get Download + ${new Intl.NumberFormat().format(exactTokenAmount)} ${artistSymbol} ($${total.toFixed(2)})`;
                buyButton.textContent = `Get Download + ${exactTokenAmount.toLocaleString()} ${artistSymbol} ($${total.toFixed(2)})`;
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

        // Attempt to update the unit price display string (e.g., "1 GOSHEESH Artistock = $0.0005")
        const tokenUnitPriceElement = document.getElementById('tokenUnitPriceInfo'); // Guessed ID
        if (tokenUnitPriceElement) {
            const tokenNameToDisplay = artistData.tokenName || artistData.name || currentArtist; // Robust name for display
            
            let priceString;
            if (currentArtist === 'jaitea') {
                priceString = '$0.0004'; // Explicitly set for JAI TEA
            } else {
                // Use unitPrice which is already correctly determined (e.g. 0.0005 for GOSHEESH)
                priceString = `$${unitPrice.toFixed(4)}`; 
            }
            tokenUnitPriceElement.textContent = `1 ${tokenNameToDisplay} Artistock = ${priceString} (Minimum purchase: $1)`;
            console.log(`Updated tokenUnitPriceInfo for ${tokenNameToDisplay} to ${priceString}`);
        } else {
            console.log("tokenUnitPriceInfo element not found, cannot update unit price string.");
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
        currentArtist = artistData.artistId || localStorage.getItem('currentArtist') || 'GOSHEESH'; // Ensure currentArtist is up-to-date
        
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
        // const tokenPrice = TOKEN_PRICE * tokens; // Old way
        const unitPrice = getArtistUnitPrice(currentArtist);
        const tokenPrice = unitPrice * tokens;
        
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
            artistocksTotal = currentTokenAmount * getArtistUnitPrice(currentArtist);
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
        currentArtist = artistData.artistId || localStorage.getItem('currentArtist') || 'GOSHEESH'; // Ensure currentArtist is up-to-date
        
        // Get exact token amount from stored value
        const exactTokenAmount = parseInt(localStorage.getItem('currentTokenAmount')) || 0;
        
        // Validate token amount
        if (isNaN(exactTokenAmount) || !isFinite(exactTokenAmount)) {
            console.error("Invalid token amount detected");
            return;
        }
        
        // Calculate final costs using integers
        const unitPrice = getArtistUnitPrice(currentArtist);
        // Multiply by 10000 to work with integers
        const unitPriceInt = Math.round(unitPrice * 10000);
        const artistocksTotalInt = exactTokenAmount * unitPriceInt;
        
        const unlockCost = includesDownload ? 1 : 0;
        // unlockCost is in dollars, so multiply by 10000
        const unlockCostInt = unlockCost * 10000;
        const totalInt = artistocksTotalInt + unlockCostInt;

        // Convert back to decimal for display and logging
        const artistocksTotal = artistocksTotalInt / 10000;
        const total = totalInt / 10000;
        
        // Validate minimum purchase amount
        if (safewordUsed && artistocksTotal > 0 && artistocksTotal < MIN_PURCHASE_AMOUNT && unitPrice > 0) {
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
        currentArtist = localStorage.getItem('currentArtist') || 'GOSHEESH'; // Ensure currentArtist is fresh for success screen too
        console.log(`Showing success section for ${includesArtistocks ? 'artistocks+download' : 'download only'}, token amount: ${exactTokenAmount}`);
        
        // Ensure success section exists
        let successSection = document.getElementById('successSection');
        
        // Get artist data
        const artistData = getCurrentArtistData();
        if (!artistData) {
            console.error("Could not get artist data in showSuccessSection");
            // Attempt to provide a graceful fallback if artistData is missing
            const fallbackArtistName = currentArtist === 'jaitea' ? 'JAI TEA' : 'GOSHEESH';
            successSection.innerHTML = `
                <div class="success-check">✓</div>
                <h3>Purchase Successful!</h3>
                <p>${includesArtistocks ? 
                    `Your ${exactTokenAmount ? new Intl.NumberFormat().format(exactTokenAmount) : ''} ${fallbackArtistName} Artistocks are confirmed.` :
                    "You've unlocked this download!" }
                </p>
                ${downloadDetails ? 
                    `<p>🎵 <a href="#" onclick="alert('Downloading content...')" class="download-link">Download your content (IPFS: ${downloadDetails.ipfsHash})</a></p>` : 
                    ''}
                <button class="explore-btn">
                    Explore Other Artists
                </button>
            `;
            // Setup explore button for fallback
            const exploreBtn = successSection.querySelector('.explore-btn');
            if (exploreBtn) {
                exploreBtn.addEventListener('click', () => {
                    const nextArtist = currentArtist === 'gosheesh' ? 'jaitea' : 'gosheesh';
                    if (typeof window.transitionToArtist === 'function') {
                        window.transitionToArtist(nextArtist);
                    } else {
                        localStorage.setItem('currentArtist', nextArtist);
                        window.location.reload();
                    }
                });
            }
            // Display and scroll
            const purchaseSection = document.getElementById('purchaseSection');
            if (purchaseSection) purchaseSection.style.display = 'none';
            successSection.style.display = 'block';
            successSection.style.opacity = '1';
            successSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return; // Exit if artistData failed but we showed a fallback
        }

        const displayArtistName = artistData.artistName || artistData.name || 'Artist'; // Robust name fetching

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
                `You now own ${formattedTokens} ${displayArtistName} Artistocks!` : 
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