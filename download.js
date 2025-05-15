// Configuration import
import { config } from './config.js';

// Local state
let contentUnlocked = {};
let safewordUsed = false;
let currentArtist = '';
let isAuthenticated = false;
let currentTokenAmount = 100;

/**
 * Initialize the download flow functionality
 * @param {Object} state - The application state with required properties
 */
export function initDownloadFlow(state) {
    // Initialize state from the parent module
    currentArtist = state.currentArtist;
    isAuthenticated = state.isAuthenticated;
    safewordUsed = state.safewordUsed;
    contentUnlocked = state.contentUnlocked || {};
    currentTokenAmount = state.currentTokenAmount || 100;
    
    // Set up the download button for the video
    setupVideoDownloadButton();
    
    // Set up the content unlock toggle
    setupContentUnlockToggle();
    
    // Update buy button text
    updateBuyButton();
    
    // Add event listener to buy button
    const buyButton = document.getElementById('buyButton');
    if (buyButton) {
        // Remove existing listeners by replacing the element
        const newBuyButton = buyButton.cloneNode(true);
        buyButton.parentNode.replaceChild(newBuyButton, buyButton);
        newBuyButton.addEventListener('click', handleBuyClick);
    }
    
    // Set up payment buttons with event handlers
    setupPaymentButtons();
}

/**
 * Apply shake animation to an element
 * @param {HTMLElement} element - The element to shake
 */
function applyShakeAnimation(element) {
    if (!element) return;
    
    // Remove any existing animation
    element.style.animation = '';
    
    // Force repaint
    void element.offsetWidth;
    
    // Apply shake animation
    element.style.animation = 'shake 0.5s';
    
    // Remove animation after it completes
    setTimeout(() => {
        element.style.animation = '';
    }, 500);
}

/**
 * Set up the video download button functionality
 */
function setupVideoDownloadButton() {
    const downloadButton = document.getElementById('downloadVideo');
    const video = document.getElementById('artistVideo');
    
    if (!downloadButton || !video) return;
    
    // Download button functionality
    downloadButton.addEventListener('click', () => {
        const videoUrl = video.querySelector('source').src;
        const link = document.createElement('a');
        link.href = videoUrl;
        link.download = `${currentArtist}-artwork.mp4`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });
}

/**
 * Set up content unlock toggle functionality
 */
function setupContentUnlockToggle() {
    const contentUnlockToggle = document.getElementById('contentUnlockToggle');
    if (!contentUnlockToggle) return;
    
    // Always checked by default to ensure download is available
    contentUnlockToggle.checked = true;
    
    // Add event listener to update the total price when toggled
    contentUnlockToggle.addEventListener('change', () => {
        updateTotalPrice();
        
        // If no artistocks are selected and download is unchecked, warn the user
        if (currentTokenAmount === 0 && !contentUnlockToggle.checked) {
            // Replace alert with shake animation
            const buyButton = document.getElementById('buyButton');
            const tokenSection = document.getElementById('tokenPreviewSection');
            
            // Shake the button and the token section
            applyShakeAnimation(buyButton);
            applyShakeAnimation(tokenSection);
            
            // Re-enable the toggle
            contentUnlockToggle.checked = true;
        }
    });
}

/**
 * Update total price based on artistocks and download selection
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
    
    // Only show artistocks total in input if safeword is used
    if (safewordUsed) {
        // Update total input with artistocks price only (not including the $1 download)
        tokenTotalInput.value = artistocksTotal.toFixed(2);
        console.log(`Artistocks total: $${artistocksTotal.toFixed(4)}, Button total with download: $${total.toFixed(2)}`);
    } else {
        // When safeword is not used, only show download price if selected
        tokenTotalInput.value = unlockCost.toFixed(2);
    }
    
    // If purchase headline is visible, update it based on content unlock toggle
    const purchaseHeadline = document.getElementById('purchaseHeadline');
    const purchaseSection = document.getElementById('purchaseSection');
    
    if (purchaseHeadline && purchaseSection && 
        window.getComputedStyle(purchaseSection).display !== 'none') {
        
        if (safewordUsed) {
            // Only show artistocks info if safeword is used
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
        } else {
            // When safeword is not used, only show download price
            purchaseHeadline.innerHTML = `Complete your download purchase for <span class="price-highlight-small">$1.00</span>`;
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
        // Always show simple download price regardless of artistocks amounts
        buyButton.textContent = `Get Download ($${config.defaults.downloadPrice.toFixed(2)})`;
        buyButton.classList.remove('safeword-activated');
    }
}

/**
 * Handle click on the buy button
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
            applyShakeAnimation(loginSection);
            
            // Scroll to login section
            loginSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        
        return; // Exit function - don't proceed with purchase
    }
    
    // Check if content unlock toggle is checked
    const contentUnlockToggle = document.getElementById('contentUnlockToggle');
    const includesDownload = contentUnlockToggle && contentUnlockToggle.checked;
    
    // Get safeword status from localStorage
    safewordUsed = localStorage.getItem('safewordUsed') === 'true';
    
    // If download isn't checked AND safeword hasn't been used, shake the button
    if (!includesDownload && !safewordUsed) {
        console.log("Download not selected and safeword not used, prompting user to check the box");
        
        // Shake the button to indicate download selection required
        const buyButton = document.getElementById('buyButton');
        applyShakeAnimation(buyButton);
        
        // Highlight the toggle to indicate it should be checked
        if (contentUnlockToggle) {
            contentUnlockToggle.parentElement.style.boxShadow = '0 0 10px rgba(255, 255, 255, 0.5)';
            setTimeout(() => {
                contentUnlockToggle.parentElement.style.boxShadow = '';
            }, 3000);
        }
        
        return; // Don't proceed with purchase
    }
    
    console.log("Authenticated and download selected, proceeding with purchase flow");
    
    // Force-create the purchase section if it doesn't exist
    ensurePurchaseSectionExists();
    
    // Get the purchase section directly
    const purchaseSection = document.getElementById('purchaseSection');
    if (!purchaseSection) {
        console.error("Purchase section still not found after trying to create it!");
        return;
    }
    
    // Remove any error messages before proceeding
    const errorMessages = document.querySelectorAll('.purchase-error-message');
    errorMessages.forEach(msg => msg.remove());
    
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
    
    // Always show simple download price for non-safeword users
    const purchaseHeadline = document.getElementById('purchaseHeadline');
    if (purchaseHeadline) {
        purchaseHeadline.innerHTML = `Complete your download purchase for <span class="price-highlight-small">$1</span>`;
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
}

/**
 * Ensure purchase section exists
 */
function ensurePurchaseSectionExists() {
    let purchaseSection = document.getElementById('purchaseSection');
    
    if (!purchaseSection) {
        console.log("Purchase section not found, creating it");
        
        // Get the content section
        const contentSection = document.querySelector('.content-section');
        if (!contentSection) {
            console.error("Content section not found, cannot create purchase section");
            return;
        }
        
        // Create the purchase section
        purchaseSection = document.createElement('div');
        purchaseSection.id = 'purchaseSection';
        purchaseSection.className = 'purchase-section';
        
        // Create purchase headline
        const headline = document.createElement('h3');
        headline.id = 'purchaseHeadline';
        headline.innerHTML = `Complete your download purchase for <span class="price-highlight-small">$1</span>`;
        purchaseSection.appendChild(headline);
        
        // Create payment section
        const paymentSection = document.createElement('div');
        paymentSection.className = 'payment-section';
        purchaseSection.appendChild(paymentSection);
        
        // Add payment buttons
        createPaymentButtons(paymentSection);
        
        // Add to DOM
        contentSection.appendChild(purchaseSection);
    }
    
    return purchaseSection;
}

/**
 * Create payment buttons
 * @param {HTMLElement} parentElement - Optional parent element for buttons
 */
function createPaymentButtons(parentElement) {
    const paymentMethods = ['credit', 'paypal', 'venmo', 'crypto'];
    const container = parentElement || document.querySelector('.payment-section');
    
    if (!container) {
        console.error("Cannot create payment buttons - no container found");
        return;
    }
    
    // Clear any existing payment buttons
    container.innerHTML = '';
    
    // Create buttons for each payment method
    paymentMethods.forEach(method => {
        const button = document.createElement('button');
        button.className = `payment-btn ${method}`;
        button.textContent = method.charAt(0).toUpperCase() + method.slice(1);
        button.addEventListener('click', () => handlePayment(method));
        container.appendChild(button);
    });
}

/**
 * Helper function to set up payment buttons
 */
function setupPaymentButtons() {
    console.log("Setting up payment buttons");
    const paymentButtons = document.querySelectorAll('.payment-btn');
    
    if (paymentButtons.length === 0) {
        console.error("No payment buttons found in the DOM!");
        
        // Try to find the payment section
        const paymentSection = document.querySelector('.payment-section');
        if (paymentSection) {
            console.log("Payment section found, but no buttons. Creating them...");
            
            // Add payment buttons
            createPaymentButtons(paymentSection);
            return;
        } else {
            console.error("Payment section not found either! Purchase flow is broken.");
        }
    }
    
    console.log(`Found ${paymentButtons.length} payment buttons, attaching handlers`);
    
    paymentButtons.forEach(button => {
        // Remove existing event listeners by cloning and replacing
        const newButton = button.cloneNode(true);
        button.parentNode.replaceChild(newButton, button);
        const method = newButton.classList[1]; // Get the payment method from class
        
        if (!method) {
            console.error("Payment button missing method class:", newButton);
        }
        
        newButton.addEventListener('click', () => handlePayment(method));
    });
}

/**
 * Handle payment selection
 * @param {string} method - Payment method selected by user
 */
function handlePayment(method) {
    console.log(`Payment selected: ${method} for artist: ${currentArtist}`);
    
    // Ensure user stays authenticated
    isAuthenticated = true;
    localStorage.setItem('isAuthenticated', 'true');
    
    // Determine the transaction type based on artistock amount
    const artistData = getCurrentArtistData();
    if (!artistData) {
        console.error("Could not get artist data in handlePayment");
        return;
    }
    
    let artistocksTotal = 0;
    let includesArtistocks = false;
    const contentUnlockToggle = document.getElementById('contentUnlockToggle');
    const includesDownload = contentUnlockToggle && contentUnlockToggle.checked;
    
    // Calculate artistocks total if applicable
    if (safewordUsed && currentTokenAmount > 0) {
        artistocksTotal = currentTokenAmount * artistData.tokenPrice;
        includesArtistocks = true;
    }
    
    // Calculate total price
    const totalPrice = (artistocksTotal + (includesDownload ? 1 : 0)).toFixed(2);
    
    // Log the purchase details
    console.log(`Processing payment: $${totalPrice} (Artistocks: ${includesArtistocks ? '$' + artistocksTotal.toFixed(2) : 'No'}, Download: ${includesDownload ? '$1.00' : 'No'})`);
    
    // Don't allow payment if BOTH artistocks AND download are not selected
    // This fixes the issue where payment section would shake when buying only artistocks without download
    if (artistocksTotal === 0 && !includesDownload) {
        console.error("Nothing selected for purchase");
        
        // Shake the payment section instead of showing an alert
        const paymentSection = document.querySelector('.payment-section');
        const purchaseSection = document.getElementById('purchaseSection');
        
        applyShakeAnimation(paymentSection);
        applyShakeAnimation(purchaseSection);
        
        return;
    }
    
    // Flash the selected payment button
    flashPaymentButton(method);
    
    // Complete the payment process after a short delay
    // This ensures the UI has time to update
    setTimeout(() => {
        if (includesArtistocks) {
            console.log("Completing payment process for artistocks + download...");
        } else {
            console.log("Completing payment process for download only...");
        }
        
        // Direct approach to showing success
        showSuccessSection(includesArtistocks);
        
        // Wait a moment for the success section to complete its work
        // before updating the wallet, to ensure contentUnlocked is saved
        setTimeout(() => {
            // Update wallet with the purchase, including whether download was purchased
            if (window.wallet) {
                window.wallet.onPurchaseComplete(currentArtist, includesArtistocks, currentTokenAmount, includesDownload);
            }
        }, 200);
    }, 800);
}

/**
 * Flash payment button animation
 * @param {string} method - Payment method button to flash
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
 * Show success section directly
 * @param {boolean} includesArtistocks - Whether purchase includes artistocks
 */
function showSuccessSection(includesArtistocks = false) {
    console.log(`Showing success section for ${includesArtistocks ? 'artistocks+download' : 'download only'}`);
    
    // Ensure success section exists
    let successSection = document.getElementById('successSection');
    
    // Get artist data
    const artistData = getCurrentArtistData();
    if (!artistData) {
        console.error("Could not get artist data in showSuccessSection");
        return;
    }
    
    // Create or update the success section
    if (!successSection) {
        console.log("Creating new success section");
        const contentSection = document.querySelector('.content-section');
        if (!contentSection) {
            console.error("Content section not found!");
            return;
        }
        
        successSection = document.createElement('div');
        successSection.className = 'success-section';
        successSection.id = 'successSection';
        
        // Create success content
        const checkmark = document.createElement('div');
        checkmark.className = 'success-check';
        checkmark.textContent = '✓';
        successSection.appendChild(checkmark);
        
        // Create title based on purchase type
        const title = document.createElement('h3');
        if (includesArtistocks) {
            title.innerHTML = `You now own <span id="purchasedAmount">${new Intl.NumberFormat().format(currentTokenAmount)}</span> <span id="artistStockName">${artistData.name}</span> Artistocks!`;
        } else {
            title.textContent = "You've unlocked this download!";
        }
        successSection.appendChild(title);
        
        // Generate IPFS hash for download
        const ipfsHash = generateIPFSHash();
        
        // Create message based on purchase type
        const message = document.createElement('p');
        if (includesArtistocks) {
            message.innerHTML = `Your purchase is complete and you are now officially in the orbit.<br><br>🎵 <a href="#" onclick="alert('Downloading content...')" class="download-link">Download your content (IPFS: ${ipfsHash})</a>`;
        } else {
            message.innerHTML = `Your purchase gives you permanent access to this content.<br><br>🎵 <a href="#" onclick="alert('Downloading content...')" class="download-link">Download your content (IPFS: ${ipfsHash})</a>`;
        }
        successSection.appendChild(message);
        
        // Add explore button
        const exploreBtn = document.createElement('button');
        exploreBtn.className = 'explore-btn';
        exploreBtn.textContent = currentArtist === 'gosheesh' ? 'Explore JAI TEA' : 'Explore GOSHEESH';
        exploreBtn.addEventListener('click', () => {
            window.location.hash = currentArtist === 'gosheesh' ? 'jaitea' : 'gosheesh';
        });
        successSection.appendChild(exploreBtn);
        
        // Add to DOM
        contentSection.appendChild(successSection);
    } else {
        console.log("Updating existing success section");
        
        // Clear existing content
        successSection.innerHTML = '';
        
        // Recreate all elements based on purchase type
        const checkmark = document.createElement('div');
        checkmark.className = 'success-check';
        checkmark.textContent = '✓';
        successSection.appendChild(checkmark);
        
        // Create title based on purchase type
        const title = document.createElement('h3');
        if (includesArtistocks) {
            title.innerHTML = `You now own <span id="purchasedAmount">${new Intl.NumberFormat().format(currentTokenAmount)}</span> <span id="artistStockName">${artistData.name}</span> Artistocks!`;
        } else {
            title.textContent = "You've unlocked this download!";
        }
        successSection.appendChild(title);
        
        // Generate IPFS hash for download
        const ipfsHash = generateIPFSHash();
        
        // Create message based on purchase type
        const message = document.createElement('p');
        if (includesArtistocks) {
            message.innerHTML = `Your purchase is complete and you are now officially in the orbit.<br><br>🎵 <a href="#" onclick="alert('Downloading content...')" class="download-link">Download your content (IPFS: ${ipfsHash})</a>`;
        } else {
            message.innerHTML = `Your purchase gives you permanent access to this content.<br><br>🎵 <a href="#" onclick="alert('Downloading content...')" class="download-link">Download your content (IPFS: ${ipfsHash})</a>`;
        }
        successSection.appendChild(message);
        
        // Add explore button
        const exploreBtn = document.createElement('button');
        exploreBtn.className = 'explore-btn';
        exploreBtn.textContent = currentArtist === 'gosheesh' ? 'Explore JAI TEA' : 'Explore GOSHEESH';
        exploreBtn.addEventListener('click', () => {
            window.location.hash = currentArtist === 'gosheesh' ? 'jaitea' : 'gosheesh';
        });
        successSection.appendChild(exploreBtn);
    }
    
    // Mark this artist's content as unlocked
    contentUnlocked[currentArtist] = true;
    localStorage.setItem('artistUnlocked', JSON.stringify(contentUnlocked));
    localStorage.setItem(`${currentArtist}_unlocked`, 'true');
    
    // Hide all sections except success
    document.querySelectorAll('.content-section > div').forEach(section => {
        section.style.display = 'none';
    });
    
    // Show success section
    if (successSection) {
        successSection.style.display = 'block';
        successSection.style.opacity = '1';
        
        // Scroll to success section
        successSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    
    console.log(`Purchase complete for ${includesArtistocks ? 'artistocks+download' : 'download only'}, artist: ${currentArtist}`);
}

/**
 * Helper function to get current artist data from config
 * @returns {Object} The current artist's data from config
 */
function getCurrentArtistData() {
    return config.artists[currentArtist];
}

/**
 * Generate a random IPFS hash for the download
 * @returns {string} A random IPFS hash
 */
function generateIPFSHash() {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let hash = 'Qm';
    for (let i = 0; i < 44; i++) {
        hash += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return hash;
}

/**
 * Update from token amount (for slider/input changes)
 * @param {number} tokens - The new token amount
 */
function updateFromTokenAmount(tokens) {
    // Get current artist data
    const artistData = getCurrentArtistData();
    if (!artistData) return;
    
    // Set current token amount
    currentTokenAmount = parseInt(tokens);
    
    // Format the token amount with commas
    const formattedTokens = new Intl.NumberFormat().format(tokens);
    
    // Calculate the total price in USD
    const totalPrice = (tokens * artistData.tokenPrice).toFixed(2);
    
    // Update the token amount input
    const tokenAmountInput = document.getElementById('tokenAmountInput');
    if (tokenAmountInput) {
        tokenAmountInput.value = formattedTokens;
    }
    
    // Update the total price input
    const tokenTotalInput = document.getElementById('tokenTotalInput');
    if (tokenTotalInput) {
        tokenTotalInput.value = totalPrice;
    }
    
    // Update the buy button
    updateBuyButton();
} 