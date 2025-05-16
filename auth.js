// auth.js - Authentication logic for Magic.link and localStorage

// Magic SDK instance
let magic = null;
let userWalletAddress = null;
let userEmail = null;
let isAuthenticated = false;
let isMagicAvailable = false;
let useFallbackMode = false;

// Immediately check if Magic is defined
try {
    isMagicAvailable = typeof Magic !== 'undefined';
    console.log('Initial Magic SDK availability check:', isMagicAvailable);
} catch (e) {
    console.error('Magic SDK not available at load time');
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
    
    if (isAuthenticated && userWalletAddress) {
        // Create or update wallet display
        let walletDisplay = existingWalletDisplay;
        
        if (!walletDisplay) {
            walletDisplay = document.createElement('div');
            walletDisplay.id = 'walletDisplay';
            walletDisplay.className = 'wallet-display';
            
            // Insert wallet display after artist name
            const artistName = document.getElementById('artistName');
            if (artistName && artistName.parentNode) {
                artistName.parentNode.insertBefore(walletDisplay, artistName.nextSibling);
            }
        }
        
        // Show abbreviated wallet address
        const shortAddress = userWalletAddress.substring(0, 6) + '...' + userWalletAddress.substring(userWalletAddress.length - 4);
        walletDisplay.textContent = shortAddress;
        
        // Add tooltip with full address and email
        walletDisplay.title = `${userEmail || 'No email available'}\n${userWalletAddress}`;
    } else if (existingWalletDisplay) {
        // Remove wallet display if user is not authenticated
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

// Initialize Magic SDK with much more robust error handling
export function initMagic() {
    return new Promise((resolve) => {
        // First check if Magic global is available
        try {
            isMagicAvailable = typeof Magic !== 'undefined';
        } catch (e) {
            isMagicAvailable = false;
        }
        
        if (!isMagicAvailable) {
            console.error('Magic SDK not available - switching to fallback mode');
            useFallbackMode = true;
            resolve(false);
            return;
        }
        
        console.log('Initializing Magic SDK...');
        
        try {
            // Initialize Magic with Ethereum Sepolia network
            magic = new Magic('pk_live_0A9CA1AC494AF3E6', {
                network: 'ethereum-sepolia'
            });
            
            // Add a delay to let Magic fully initialize
            setTimeout(() => {
                try {
                    // Verify magic instance has required methods
                    if (!magic || !magic.auth || !magic.user) {
                        console.error('Magic SDK instance missing required properties');
                        useFallbackMode = true;
                        resolve(false);
                        return;
                    }
                    
                    console.log('Magic SDK initialized successfully');
                    checkUserSession();
                    resolve(true);
                } catch (err) {
                    console.error('Error verifying Magic SDK:', err);
                    useFallbackMode = true;
                    resolve(false);
                }
            }, 1000);
        } catch (error) {
            console.error('Error initializing Magic SDK:', error);
            useFallbackMode = true;
            resolve(false);
        }
    });
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
    if (useFallbackMode || !magic) {
        // Fallback to localStorage only in fallback mode
        userWalletAddress = getWalletAddressFromLocalStorage();
        userEmail = getEmailFromLocalStorage();
        if (userWalletAddress && userEmail) {
            isAuthenticated = true;
            updateUIForAuthState();
            return true;
        }
        return false;
    }
    
    try {
        const isLoggedInWithMagic = await magic.user.isLoggedIn();
        
        if (isLoggedInWithMagic) {
            try {
                const userMetadata = await magic.user.getMetadata();
                userWalletAddress = userMetadata.publicAddress;
                userEmail = userMetadata.email;
                saveAuthToLocalStorage(userWalletAddress, userEmail);
                isAuthenticated = true;
                updateUIForAuthState();
                return true;
            } catch (metadataError) {
                console.error('Error getting metadata:', metadataError);
            }
        }
    } catch (sessionError) {
        console.error('Error checking session:', sessionError);
    }
    
    // Fallback to localStorage
    userWalletAddress = getWalletAddressFromLocalStorage();
    userEmail = getEmailFromLocalStorage();
    if (userWalletAddress && userEmail) {
        isAuthenticated = true;
        updateUIForAuthState();
        return true;
    } else {
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

// Handle email login - with fallback mode that doesn't require Magic SDK
export async function handleEmailLogin(email) {
    if (!email || !email.includes('@') || !email.includes('.')) {
        throw new Error('Invalid email');
    }
    
    console.log(`Attempting login with email: ${email.substring(0, 3)}...`);
    
    // Initialize magic if not already done
    if (!magic && !useFallbackMode) {
        const initResult = await initMagic();
        if (!initResult) {
            console.warn('Magic initialization failed - using fallback mode');
        }
    }
    
    // If in fallback mode or Magic failed to initialize
    if (useFallbackMode || !magic) {
        console.log('Using fallback authentication mode');
        
        // Simulate "sending" a magic link
        // In a real implementation, you'd send an email here
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Generate a deterministic wallet address from the email
        const walletAddress = generateDeterministicWallet(email);
        
        // Simulate login success with the generated wallet
        userWalletAddress = walletAddress;
        userEmail = email;
        saveAuthToLocalStorage(walletAddress, email);
        isAuthenticated = true;
        updateUIForAuthState();
        
        // Return simulated user data
        return { 
            success: true, 
            fallbackMode: true,
            message: 'Authenticated in fallback mode. Magic link services will be available later.',
            userWalletAddress: walletAddress,
            userEmail: email
        };
    }
    
    // Standard Magic SDK flow if available
    try {
        console.log('Using standard Magic SDK authentication');
        
        // Add timeout for Magic login
        const loginPromise = magic.auth.loginWithEmailOTP({ email });
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => {
                reject(new Error('Login request timed out'));
            }, 10000);
        });
        
        // Use the faster of the two
        await Promise.race([loginPromise, timeoutPromise]);
        
        console.log('Magic link sent! Check your email');
        
        // In normal operation, actually getting here means the magic link was
        // sent but not yet clicked. We'll treat this as a "success" for the UI.
        return {
            success: true,
            emailSent: true,
            message: 'Magic link sent! Please check your email including spam folders.'
        };
        
    } catch (error) {
        console.error('Magic login error:', error);
        
        // If timeout or other error, switch to fallback mode
        if (error.message.includes('timed out') || 
            error.message.includes('Magic SDK') ||
            error.message.includes('undefined') ||
            error.message.includes('authentication service')) {
            
            console.log('Magic SDK error - falling back to direct method');
            useFallbackMode = true;
            
            // Use the fallback method in this case
            return handleEmailLogin(email);
        }
        
        throw new Error(`Authentication failed: ${error.message || 'Unknown error'}`);
    }
}

// Logout function
export async function logout() {
    if (magic && !useFallbackMode) {
        try {
            await magic.user.logout();
        } catch (e) {
            console.error('Error during Magic logout:', e);
        }
    }
    resetAuthState();
}

// Helpers for localStorage
export function saveAuthToLocalStorage(wallet, email) {
    localStorage.setItem('userWalletAddress', wallet);
    localStorage.setItem('userEmail', email);
    localStorage.setItem('isAuthenticated', 'true');
}
export function getWalletAddressFromLocalStorage() {
    return localStorage.getItem('userWalletAddress');
}
export function getEmailFromLocalStorage() {
    return localStorage.getItem('userEmail');
}
export function isUserAuthenticated() {
    return localStorage.getItem('isAuthenticated') === 'true';
}

// Export state for use elsewhere
export { magic, userWalletAddress, userEmail, isAuthenticated, useFallbackMode };

// Initialize Magic SDK early - on page load
document.addEventListener('DOMContentLoaded', () => {
    // Pre-initialize Magic SDK as soon as the page loads
    setTimeout(() => {
        console.log('Pre-initializing Magic SDK...');
        initMagic();
    }, 1000); // Slight delay to allow other critical page elements to load first
}); 