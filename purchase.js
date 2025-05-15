// purchase.js - Purchase-related functions for ZEYODA

// Import configuration
import { config } from './config.js';

// State variables
let currentArtist = localStorage.getItem('currentArtist') || "gosheesh";
let isAuthenticated = false;
let safewordUsed = false;
let currentTokenAmount = 100;
let contentUnlocked = {};

/**
 * Initialize the purchase flow with the current application state
 * @param {Object} artistData - Current artist data
 */
export function setupPurchaseFlow(artistData) {
    // Initialize state from localStorage
    isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
    safewordUsed = localStorage.getItem('safewordUsed') === 'true';
    currentArtist = localStorage.getItem('currentArtist') || "gosheesh";
    
    // Get stored token amount if available
    const storedBalance = localStorage.getItem('artistocksBalance');
    if (storedBalance) {
        currentTokenAmount = parseInt(storedBalance);
    } else {
        currentTokenAmount = config.defaults.initialTokenAmount;
    }
    
    // Check localStorage for previous unlocks
    const storedUnlocks = localStorage.getItem('artistUnlocked');
    if (storedUnlocks) {
        try {
            contentUnlocked = JSON.parse(storedUnlocks);
        } catch (e) {
            console.error("Error parsing stored unlocks:", e);
            contentUnlocked = {};
        }
    }
    
    // Set up content unlock toggle
    setupContentUnlockToggle();
    
    // Update token price display
    updateTotalPrice();
    
    // Update buy button text based on current state
    updateBuyButton();
    
    // Add event listener to buy button
    const buyButton = document.getElementById('buyButton');
    if (buyButton) {
        // Remove existing listeners
        const newBuyButton = buyButton.cloneNode(true);
        buyButton.parentNode.replaceChild(newBuyButton, buyButton);
        
        // Add new click event listener
        newBuyButton.addEventListener('click', handleBuyClick);
    }
}

/**
 * Handle buy button click
 */
function handleBuyClick() {
    console.log("Buy button clicked - Current artist:", currentArtist);
    
    // Always check authentication from localStorage
    isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
    
    console.log("Authentication state:", isAuthenticated);
    
    if (!isAuthenticated) {
        // Shake the login section to indicate authentication required
        const loginSection = document.getElementById('loginSection');
        if (loginSection) {
            console.log("Not authenticated, showing login");
            // Make sure login section is visible first
            loginSection.style.display = 'flex';
            loginSection.style.opacity = '1';
            
            // Apply shake animation to the entire login section
            loginSection.style.animation = 'shake 0.5s';
            setTimeout(() => {
                loginSection.style.animation = '';
            }, 500);
            
            // Scroll to login section
            loginSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        
        return; // Exit function - don't proceed with purchase
    }
    
    // Check if content unlock toggle is checked
    const contentUnlockToggle = document.getElementById('contentUnlockToggle');
    const includesDownload = contentUnlockToggle && contentUnlockToggle.checked;
    
    // Get safeword status
    safewordUsed = localStorage.getItem('safewordUsed') === 'true';
    
    // If download isn't checked AND safeword hasn't been used, shake the button
    if (!includesDownload && !safewordUsed) {
        console.log("Download not selected and safeword not used, prompting user to check the box");
        
        // Shake the button to indicate download selection required
        const buyButton = document.getElementById('buyButton');
        buyButton.style.animation = 'shake 0.5s';
        setTimeout(() => {
            buyButton.style.animation = '';
        }, 500);
        
        // Highlight the toggle to indicate it should be checked
        if (contentUnlockToggle) {
            contentUnlockToggle.parentElement.style.boxShadow = '0 0 10px rgba(255, 255, 255, 0.5)';
            setTimeout(() => {
                contentUnlockToggle.parentElement.style.boxShadow = '';
            }, 3000);
        }
        
        return; // Don't proceed with purchase
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
    let artistocksTotal = 0;
    const unlockCost = contentUnlockToggle && contentUnlockToggle.checked ? 1 : 0;
    
    if (safewordUsed) {
        // Get token slider value if it exists
        const slider = document.getElementById('tokenSlider');
        const tokenAmountInput = document.getElementById('tokenAmountInput');
        
        // If we have a slider and artistocks amount, calculate that total
        if (slider && tokenAmountInput) {
            let tokenAmount = 0;
            
            // Try to get token amount from input first
            if (tokenAmountInput.value) {
                // Remove commas from formatted number
                tokenAmount = parseInt(tokenAmountInput.value.replace(/,/g, ''));
            }
            
            // Fallback to slider value
            if (isNaN(tokenAmount) || tokenAmount <= 0) {
                tokenAmount = parseInt(slider.value);
            }
            
            // Update current token amount
            currentTokenAmount = tokenAmount;
            
            // Calculate artistocks cost
            artistocksTotal = tokenAmount * artistData.tokenPrice;
            console.log(`Artistocks: ${tokenAmount} at ${artistData.tokenPrice} = $${artistocksTotal.toFixed(2)}`);
        }
    }
    
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
 * Create payment buttons in the payment section
 * @param {HTMLElement} parentElement - The payment section element to add buttons to
 */
function createPaymentButtons(parentElement) {
    const paymentSection = parentElement || document.querySelector('.payment-section');
    if (!paymentSection) {
        console.error("Cannot create payment buttons: no payment section found");
        return;
    }
    
    // Define available payment methods
    const paymentMethods = [
        { method: 'credit', label: 'Credit Card' },
        { method: 'paypal', label: 'PayPal' },
        { method: 'venmo', label: 'Venmo' },
        { method: 'crypto', label: 'Crypto' }
    ];
    
    // Clear existing buttons
    paymentSection.innerHTML = '';
    
    // Create buttons for each payment method
    paymentMethods.forEach(method => {
        const button = document.createElement('button');
        button.className = `payment-btn ${method.method}`;
        button.textContent = method.label;
        button.addEventListener('click', () => handlePayment(method.method));
        paymentSection.appendChild(button);
    });
    
    console.log(`Created ${paymentMethods.length} payment buttons`);
}

/**
 * Handle payment method selection
 * @param {string} method - Selected payment method
 */
function handlePayment(method) {
    console.log(`Payment method selected: ${method}`);
    
    // Validate authentication
    isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
    if (!isAuthenticated) {
        console.error("Cannot process payment: user not authenticated");
        return;
    }
    
    // Flash the selected payment button
    flashPaymentButton(method);
    
    // For demo purposes, simulate payment processing and show success
    const contentUnlockToggle = document.getElementById('contentUnlockToggle');
    const includesDownload = contentUnlockToggle && contentUnlockToggle.checked;
    
    // Get current artist data
    const artistData = getCurrentArtistData();
    if (!artistData) {
        console.error("Could not get artist data for payment");
        return;
    }
    
    // Calculate purchase metrics
    const artistocksTotal = currentTokenAmount * artistData.tokenPrice;
    const includesArtistocks = safewordUsed && currentTokenAmount > 0;
    
    // In a real implementation, we would process payment here
    // For demo, just show success immediately
    setTimeout(() => {
        // Save unlock status to localStorage
        if (includesDownload) {
            contentUnlocked[currentArtist] = true;
            localStorage.setItem('artistUnlocked', JSON.stringify(contentUnlocked));
        }
        
        // Save token balance if purchasing artistocks
        if (includesArtistocks) {
            localStorage.setItem('artistocksBalance', currentTokenAmount.toString());
        }
        
        // Show success message with appropriate content
        showSuccessSection(includesArtistocks);
    }, 800); // Short delay to simulate processing
}

/**
 * Flash payment button to indicate selection
 * @param {string} method - The payment method to flash
 */
function flashPaymentButton(method) {
    // Get all payment buttons
    const buttons = document.querySelectorAll('.payment-btn');
    
    // Flash the selected button
    buttons.forEach(btn => {
        if (btn.classList.contains(method)) {
            // Add pulse animation
            btn.classList.add('pulse-animation');
            
            // Change text to show selected state
            btn.textContent = 'Processing...';
            
            // Remove animation after a delay
            setTimeout(() => {
                btn.classList.remove('pulse-animation');
            }, 1000);
        } else {
            // Dim other buttons
            btn.style.opacity = '0.5';
        }
    });
}

/**
 * Show success section after purchase
 * @param {boolean} includesArtistocks - Whether the purchase included artistocks
 */
function showSuccessSection(includesArtistocks = false) {
    // Hide purchase section
    const purchaseSection = document.getElementById('purchaseSection');
    if (purchaseSection) {
        purchaseSection.style.display = 'none';
    }
    
    // Get success section
    const successSection = document.getElementById('successSection');
    if (!successSection) {
        console.error("Success section not found, cannot show success");
        return;
    }
    
    // Update success content based on purchase type
    const purchasedAmount = document.getElementById('purchasedAmount');
    const artistStockName = document.getElementById('artistStockName');
    
    if (purchasedAmount && includesArtistocks) {
        purchasedAmount.textContent = new Intl.NumberFormat().format(currentTokenAmount);
    }
    
    if (artistStockName) {
        const artistData = getCurrentArtistData();
        if (artistData) {
            artistStockName.textContent = artistData.name;
        }
    }
    
    // Show success section
    successSection.style.display = 'block';
    successSection.style.opacity = '1';
    
    // Scroll to success section
    successSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

/**
 * Set up content unlock toggle functionality
 */
function setupContentUnlockToggle() {
    const toggle = document.getElementById('contentUnlockToggle');
    if (!toggle) return;
    
    // Always checked by default to ensure download is available
    toggle.checked = true;
    
    // Load artist-specific saved state if available
    if (contentUnlocked[currentArtist]) {
        toggle.checked = true;
    }
    
    // Remove existing listeners by cloning
    const newToggle = toggle.cloneNode(true);
    toggle.parentNode.replaceChild(newToggle, toggle);
    
    // Listen for changes to update total price
    newToggle.addEventListener('change', () => {
        console.log(`Content unlock toggle changed to: ${newToggle.checked ? 'checked' : 'unchecked'}`);
        
        // Update the total price calculation
        updateTotalPrice();
        
        // Update buy button text to reflect the change
        updateBuyButton();
        
        // If no artistocks are selected and download is unchecked, warn the user
        if (safewordUsed && currentTokenAmount === 0 && !newToggle.checked) {
            console.warn("No purchase selected");
            
            // Apply shake to relevant elements
            const buyButton = document.getElementById('buyButton');
            const tokenSection = document.getElementById('tokenPreviewSection');
            
            if (buyButton) {
                buyButton.style.animation = 'shake 0.5s';
                setTimeout(() => { buyButton.style.animation = ''; }, 500);
            }
            
            if (tokenSection) {
                tokenSection.style.animation = 'shake 0.5s';
                setTimeout(() => { tokenSection.style.animation = ''; }, 500);
            }
            
            // Add visual error message
            const errorMessage = document.createElement('div');
            errorMessage.className = 'purchase-error-message';
            errorMessage.textContent = 'Please select either artistocks or enable the download';
            errorMessage.style.color = '#ff6b6b';
            errorMessage.style.textAlign = 'center';
            errorMessage.style.marginTop = '10px';
            errorMessage.style.marginBottom = '10px';
            errorMessage.style.fontWeight = 'bold';
            
            // Add to token section
            if (tokenSection && !tokenSection.querySelector('.purchase-error-message')) {
                if (buyButton && buyButton.parentNode) {
                    buyButton.parentNode.insertBefore(errorMessage, buyButton.nextSibling);
                } else {
                    tokenSection.appendChild(errorMessage);
                }
                
                // Remove after 3 seconds
                setTimeout(() => {
                    if (errorMessage.parentNode) {
                        errorMessage.remove();
                    }
                }, 3000);
            }
            
            // Force toggle back on
            newToggle.checked = true;
            updateTotalPrice(); // Update price again
            updateBuyButton(); // Update button again
        }
    });
}

/**
 * Update total price based on current selections
 */
function updateTotalPrice() {
    console.log("Updating total price");
    const tokenTotalInput = document.getElementById('tokenTotalInput');
    const contentUnlockToggle = document.getElementById('contentUnlockToggle');
    
    if (!tokenTotalInput || !contentUnlockToggle) return;
    
    // Calculate Artistocks cost
    const artistData = getCurrentArtistData();
    if (!artistData) {
        console.error("Could not get artist data in updateTotalPrice");
        return;
    }
    
    const artistocksTotal = currentTokenAmount * artistData.tokenPrice;
    
    // Add $1 if content unlock is checked (for the blue button, but not the input field)
    const unlockCost = contentUnlockToggle.checked ? 1 : 0;
    
    // Calculate total for the button
    const total = artistocksTotal + unlockCost;
    
    // Update total input with artistocks price only (not including the $1 download)
    tokenTotalInput.value = artistocksTotal.toFixed(2);
    console.log(`Artistocks total: $${artistocksTotal.toFixed(4)}, Button total with download: $${total.toFixed(2)}`);
    
    // If purchase headline is visible, update it based on content unlock toggle
    const purchaseHeadline = document.getElementById('purchaseHeadline');
    const purchaseSection = document.getElementById('purchaseSection');
    
    if (purchaseHeadline && purchaseSection && 
        window.getComputedStyle(purchaseSection).display !== 'none' && 
        safewordUsed) {
        
        if (contentUnlockToggle.checked) {
            if (artistocksTotal > 0) {
                // Show both Artistocks and download
                purchaseHeadline.innerHTML = `Complete your purchase of <span id="purchaseAmount">${new Intl.NumberFormat().format(currentTokenAmount)}</span> <span id="artistStockPurchaseName">${artistData.name}</span> Artistocks + <span class="price-highlight-small">$1 Download</span> for <span class="price-highlight-small">$${total.toFixed(2)}</span>`;
            } else {
                // Just download
                purchaseHeadline.innerHTML = `Complete your download purchase for <span class="price-highlight-small">$1.00</span>`;
            }
        } else if (artistocksTotal > 0) {
            // Show only Artistocks
            purchaseHeadline.innerHTML = `Complete your purchase of <span id="purchaseAmount">${new Intl.NumberFormat().format(currentTokenAmount)}</span> <span id="artistStockPurchaseName">${artistData.name}</span> Artistocks for <span class="price-highlight-small">$${artistocksTotal.toFixed(2)}</span>`;
        } else {
            // No artistocks or download (shouldn't happen)
            purchaseHeadline.innerHTML = `Complete your purchase`;
        }
        
        // Make sure purchaseAmount and artistStockPurchaseName are updated
        const purchaseAmount = document.getElementById('purchaseAmount');
        const artistStockName = document.getElementById('artistStockPurchaseName');
        
        if (purchaseAmount) {
            purchaseAmount.textContent = new Intl.NumberFormat().format(currentTokenAmount);
        }
        
        if (artistStockName) {
            artistStockName.textContent = artistData.name;
        }
    }
    
    // Update buy button text to reflect the total
    updateBuyButton();
    
    // Update slider minimum if content is unlocked
    const slider = document.getElementById('tokenSlider');
    if (slider) {
        const price = artistData.tokenPrice;
        const minTokens = contentUnlockToggle.checked ? 0 : Math.ceil(1 / price);
        slider.min = minTokens;
        
        // If current value is below new minimum, update it
        if (parseInt(slider.value) < minTokens) {
            slider.value = minTokens;
            updateFromTokenAmount(minTokens);
        }
    }
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
    
    // Calculate total
    const total = artistocksTotal + (includesDownload ? 1 : 0);
    
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
        } else {
            // No selection (rare case)
            buyButton.textContent = `Select Purchase Options`;
        }
        buyButton.classList.add('safeword-activated');
    } else {
        // Safeword has NOT been used, only show download option
        buyButton.textContent = `Get Download ($${config.defaults.downloadPrice.toFixed(2)})`;
        buyButton.classList.remove('safeword-activated');
    }
}

/**
 * Get current artist data from the config
 * @returns {Object} The current artist's data
 */
function getCurrentArtistData() {
    currentArtist = localStorage.getItem('currentArtist') || 'gosheesh';
    return config.artists[currentArtist];
}

/**
 * Update token amount display when the slider changes
 * @param {number} tokens - The new token amount
 */
function updateFromTokenAmount(tokens) {
    // This was referenced but needs to be implemented
    currentTokenAmount = tokens;
    
    // Update UI elements that reference the token amount
    const tokenAmountInput = document.getElementById('tokenAmountInput');
    if (tokenAmountInput) {
        tokenAmountInput.value = new Intl.NumberFormat().format(tokens);
    }
    
    // Update the total price
    updateTotalPrice();
}

// Export the functions that need to be accessed from other modules
export { 
    updateBuyButton, 
    updateTotalPrice, 
    setupContentUnlockToggle,
    handleBuyClick,
    handlePayment
}; 