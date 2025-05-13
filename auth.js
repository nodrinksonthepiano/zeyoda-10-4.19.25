// auth.js - Authentication logic for Magic.link and localStorage

// Magic SDK instance
let magic = null;
let userWalletAddress = null;
let userEmail = null;
let isAuthenticated = false;

// Placeholder for UI update (to be implemented in main app)
export function updateUIForAuthState() {}

// Initialize Magic SDK
export function initMagic() {
    try {
        magic = new Magic('pk_live_0A9CA1AC494AF3E6', {
            network: 'ethereum-sepolia'
        });
        checkUserSession();
    } catch (error) {
        console.error('Error initializing Magic SDK:', error);
        throw error;
    }
}

// Check if the user already has an active session
export async function checkUserSession() {
    if (!magic) return false;
    let isLoggedInWithMagic = false;
    try {
        isLoggedInWithMagic = await magic.user.isLoggedIn();
    } catch (sessionError) {
        return false;
    }
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
            return false;
        }
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

// Handle email login (returns true if successful)
export async function handleEmailLogin(email) {
    if (!magic) throw new Error('Magic SDK not initialized');
    if (!email || !email.includes('@') || !email.includes('.')) {
        throw new Error('Invalid email');
    }
    await magic.auth.loginWithEmailOTP({ email });
    const userMetadata = await magic.user.getMetadata();
    userWalletAddress = userMetadata.publicAddress;
    userEmail = userMetadata.email;
    saveAuthToLocalStorage(userWalletAddress, userEmail);
    isAuthenticated = true;
    updateUIForAuthState();
    return { userWalletAddress, userEmail };
}

// Logout function
export async function logout() {
    if (magic) {
        try {
            await magic.user.logout();
        } catch (e) {}
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
export { magic, userWalletAddress, userEmail, isAuthenticated }; 