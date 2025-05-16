// auth.js - Authentication logic for Magic.link and localStorage

// Magic SDK instance
let magic = null;
let userWalletAddress = null;
let userEmail = null;
let isAuthenticated = false;

// Helper function to check authentication state
export function isUserAuthenticated() {
    // Check localStorage first (source of truth)
    const storedAuthState = localStorage.getItem('isAuthenticated') === 'true';
    return storedAuthState || isAuthenticated;
}

// Get user wallet address
export function getUserWalletAddress() {
    return localStorage.getItem('userWalletAddress') || userWalletAddress;
}

// Get user email
export function getUserEmail() {
    return localStorage.getItem('userEmail') || userEmail;
}

// Update UI for current auth state
export function updateUIForAuthState() {
    // Always check authentication from localStorage
    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
    const userWalletAddress = localStorage.getItem('userWalletAddress');
    const userEmail = localStorage.getItem('userEmail');
    const safewordUsed = localStorage.getItem('safewordUsed') === 'true';
    
    console.log("updateUIForAuthState:", { 
        isAuthenticated, 
        safewordUsed,
        userEmail: userEmail ? userEmail.substring(0, 3) + '...' : null,
        walletAddress: userWalletAddress ? userWalletAddress.substring(0, 6) + '...' : null
    });
    
    // Handle UI visibility based on authentication
    const loginSection = document.getElementById('loginSection');
    const tokenSection = document.getElementById('tokenPreviewSection');
    const advancedOptions = document.getElementById('advancedPurchaseOptions');
    const purchaseSection = document.getElementById('purchaseSection');
    const successSection = document.getElementById('successSection');
    const loginFeedback = document.getElementById('loginFeedback');
    
    // Reset login feedback message
    if (loginFeedback) {
        loginFeedback.style.display = 'none';
        loginFeedback.textContent = '';
        loginFeedback.classList.remove('error');
    }
    
    // MOST IMPORTANT: Always ensure token preview section is visible, 
    // regardless of authentication (so the download button is always available)
    if (tokenSection) {
        tokenSection.style.display = 'block';
        tokenSection.style.opacity = '1';
        tokenSection.style.transform = 'translateY(0)';
    }
    
    // Clear purchase and success sections when updating UI
    if (purchaseSection) {
        purchaseSection.style.display = 'none';
    }
    
    if (successSection) {
        successSection.style.display = 'none';
    }
    
    // Handle wallet display
    const existingWalletDisplay = document.getElementById('walletDisplay');
    
    // Remove wallet display element entirely (if it exists)
    if (existingWalletDisplay) {
        existingWalletDisplay.remove();
    }
    
    if (isAuthenticated) {
        // Hide login for authenticated users
        if (loginSection) {
            loginSection.style.display = 'none';
            loginSection.style.opacity = '0';
        }
        
        // Show advanced options if safeword has been used
        if (advancedOptions) {
            if (safewordUsed) {
                advancedOptions.style.display = 'block';
                advancedOptions.classList.add('show');
                advancedOptions.style.opacity = '1';
                advancedOptions.style.maxHeight = '300px';
            } else {
                advancedOptions.style.display = 'none';
                advancedOptions.classList.remove('show');
                advancedOptions.style.opacity = '0';
                advancedOptions.style.maxHeight = '0';
            }
        }
    } else {
        // Show login for non-authenticated users
        if (loginSection) {
            loginSection.style.display = 'flex';
            loginSection.style.opacity = '1';
        }
    }
    
    // Trigger update for any purchase-related UI
    const event = new CustomEvent('auth:stateChanged', { 
        detail: { isAuthenticated, userWalletAddress, userEmail, safewordUsed }
    });
    document.dispatchEvent(event);
}

// Initialize Magic SDK
export function initMagic() {
    try {
        // Make sure Magic is defined
        if (typeof Magic === 'undefined') {
            console.error('Magic SDK not available');
            return false;
        }
        
        // Initialize Magic with Ethereum Sepolia network (optional)
        magic = new Magic('pk_live_0A9CA1AC494AF3E6', {
            network: 'ethereum-sepolia'
        });
        
        // Check if user is already logged in
        checkUserSession();
        
        return true;
    } catch (error) {
        console.error('Error initializing Magic SDK:', error);
        return false;
    }
}

// Generate a deterministic wallet address based on email
function generateDeterministicWallet(email) {
    // Very simplified hash function for demo purposes
    let hash = 0;
    for (let i = 0; i < email.length; i++) {
        const char = email.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    
    // Create a hex string with leading zeros
    const hexHash = Math.abs(hash).toString(16).padStart(40, '0');
    return '0x' + hexHash;
}

// Check if the user already has an active session
export async function checkUserSession() {
    if (!magic) {
        console.log('Magic SDK not initialized, attempting to initialize...');
        if (typeof Magic !== 'undefined') {
            console.log('Magic global is available, initializing...');
            initMagic();
        } else {
            console.log('Magic global not available, falling back to localStorage');
            // Fallback to localStorage if Magic SDK is not available
            userWalletAddress = localStorage.getItem('userWalletAddress');
            userEmail = localStorage.getItem('userEmail');
            if (userWalletAddress && userEmail) {
                isAuthenticated = true;
                updateUIForAuthState();
                return true;
            }
            return false;
        }
    }
    
    try {
        console.log('Checking Magic user session...');
        
        // Check if we're on a redirect from Magic link
        if (window.location.hash.includes('magic_credential')) {
            console.log('Magic credential found in URL, completing authentication...');
            try {
                // This will complete the authentication process after redirect
                await magic.auth.loginWithCredential();
                console.log('Magic credential login successful');
                
                // Get user metadata after successful login
                const userMetadata = await magic.user.getMetadata();
                userWalletAddress = userMetadata.publicAddress;
                userEmail = userMetadata.email;
                
                console.log(`User authenticated: ${userEmail}, wallet: ${userWalletAddress}`);
                
                // Store authentication data
                localStorage.setItem('userWalletAddress', userWalletAddress);
                localStorage.setItem('userEmail', userEmail);
                localStorage.setItem('isAuthenticated', 'true');
                isAuthenticated = true;
                
                // Update UI
                updateUIForAuthState();
                return true;
            } catch (error) {
                console.error('Error completing Magic authentication:', error);
                return false;
            }
        }

        // Normal session check
        const isLoggedIn = await magic.user.isLoggedIn();
        
        if (isLoggedIn) {
            console.log('User is already logged in with Magic');
            const userMetadata = await magic.user.getMetadata();
            userWalletAddress = userMetadata.publicAddress;
            userEmail = userMetadata.email;
            localStorage.setItem('userWalletAddress', userWalletAddress);
            localStorage.setItem('userEmail', userEmail);
            localStorage.setItem('isAuthenticated', 'true');
            isAuthenticated = true;
            updateUIForAuthState();
            return true;
        } else {
            console.log('User is not logged in with Magic');
        }
    } catch (error) {
        console.error('Error checking session:', error);
    }
    
    // Check localStorage as backup
    userWalletAddress = localStorage.getItem('userWalletAddress');
    userEmail = localStorage.getItem('userEmail');
    if (userWalletAddress && userEmail) {
        console.log('Recovered credentials from localStorage');
        isAuthenticated = true;
        updateUIForAuthState();
        return true;
    } else {
        console.log('No credentials found in localStorage');
        resetAuthState();
        return false;
    }
}

// Reset authentication state
export function resetAuthState() {
    isAuthenticated = false;
    userWalletAddress = null;
    userEmail = null;
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userWalletAddress');
    localStorage.removeItem('userEmail');
    updateUIForAuthState();
}

// Handle email login
export async function handleEmailLogin(email) {
    if (!email || !email.includes('@') || !email.includes('.')) {
        throw new Error('Invalid email');
    }

    console.log(`Attempting login with email: ${email.substring(0, 3)}... using Magic UI`);

    // Initialize Magic SDK if needed
    if (!magic) {
        const initialized = initMagic();
        if (!initialized) {
            throw new Error('Authentication service unavailable');
        }
    }

    try {
        // Use Magic OTP (One-Time Password) login WITH Magic's built-in UI
        const didToken = await magic.auth.loginWithEmailOTP({
            email,
            showUI: true // Enable Magic's UI
        });

        if (didToken) {
            console.log("Successfully logged in via Magic UI, DID Token received.");
            // User is logged in. Fetch metadata and update state.

            // Check if Magic user methods are properly available
            if (!magic || !magic.user || typeof magic.user.getMetadata !== 'function') {
                console.warn("Magic user.getMetadata is not available; using deterministic wallet as fallback.");
                
                // Use the email directly and generate a deterministic wallet address
                // This is a reliable fallback since we know the user has authenticated with this email
                userEmail = email;
                userWalletAddress = generateDeterministicWallet(email);
                isAuthenticated = true;
                
                // Store in localStorage
                localStorage.setItem('userWalletAddress', userWalletAddress);
                localStorage.setItem('userEmail', userEmail);
                localStorage.setItem('isAuthenticated', 'true');
                
                // Make magic instance available globally
                window.magic = magic;
                
                // Update UI to reflect logged in state
                updateUIForAuthState();
                
                return { 
                    success: true, 
                    directlyLoggedIn: true, 
                    message: "Login successful via Magic UI (fallback mode)." 
                };
            }
            
            try {
                // Try the standard flow with getMetadata if available
                const userMetadata = await magic.user.getMetadata();
                if (userMetadata && userMetadata.publicAddress && userMetadata.email) {
                    userWalletAddress = userMetadata.publicAddress;
                    userEmail = userMetadata.email;
                    isAuthenticated = true;

                    localStorage.setItem('userWalletAddress', userWalletAddress);
                    localStorage.setItem('userEmail', userEmail);
                    localStorage.setItem('isAuthenticated', 'true');

                    updateUIForAuthState(); // Reflect changes immediately

                    // Make magic instance available globally if it wasn't already (e.g. for logout)
                    if (!window.magic) {
                        window.magic = magic;
                    }

                    return { success: true, directlyLoggedIn: true, message: "Login successful via Magic UI." };
                } else {
                    console.error("Magic UI login succeeded but failed to retrieve user metadata.");
                    throw new Error("Login succeeded but could not fetch user details.");
                }
            } catch (error) {
                console.error("Error during getMetadata, using fallback:", error);
                // Fall back to using email directly
                userEmail = email;
                userWalletAddress = generateDeterministicWallet(email);
                isAuthenticated = true;
                
                localStorage.setItem('userWalletAddress', userWalletAddress);
                localStorage.setItem('userEmail', userEmail);
                localStorage.setItem('isAuthenticated', 'true');
                
                updateUIForAuthState();
                
                return { 
                    success: true, 
                    directlyLoggedIn: true, 
                    message: "Login successful via Magic UI (error recovery mode)." 
                };
            }
        } else {
            // This case might occur if the user closes the modal before completion,
            // but usually Magic throws an error for that.
            console.warn("Magic UI login resolved without a DID token, but also without an error.");
            throw new Error("Login process completed without a token and without an error from Magic.");
        }
    } catch (error) {
        console.error('Login error with Magic UI:', error);
        // Magic RPC Error codes:
        // -10001: User closed modal
        // -32603: User denied account access (e.g. if wallet extension interaction was involved)
        if (error && error.code === -10001) { // User closed modal
            throw new Error("Login process was cancelled by the user.");
        }
        // Propagate other errors with their original message if available
        throw new Error(error.message || 'Authentication failed or was cancelled.');
    }
}

// Logout function
export async function logout() {
    if (magic) {
        try {
            await magic.user.logout();
        } catch (e) {
            console.error('Error during logout:', e);
        }
    }
    resetAuthState();
}

// Export state for use elsewhere
export { magic, userWalletAddress, userEmail, isAuthenticated };

// Initialize Magic SDK on page load
document.addEventListener('DOMContentLoaded', initMagic);

// Add window method for global access
window.checkUserSession = checkUserSession;