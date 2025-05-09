/**
 * ZEYODA Safeword Manager
 * Allows debug commands to be entered in the chat input
 */

// Define safe words and handlers
const safewords = {
    'unlock': handleUnlock,
    'reset': handleReset,
    'debug': handleDebug,
    'test': handleTest,
    'help': handleHelp
};

// Initialize event listener
document.addEventListener('DOMContentLoaded', function() {
    // Get chat input element
    const chatInput = document.getElementById('chatInput');
    
    if (chatInput) {
        // Add event listener
        chatInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                const command = chatInput.value.trim().toLowerCase();
                
                // Check if command is a safeword
                for (const safeword in safewords) {
                    if (command === safeword || command.startsWith(`${safeword} `)) {
                        const params = command.startsWith(`${safeword} `) ? 
                            command.substring(safeword.length + 1) : '';
                        
                        // Execute handler
                        safewords[safeword](params);
                        
                        // Clear input
                        chatInput.value = '';
                        e.preventDefault();
                        return;
                    }
                }
            }
        });
    }
});

// Handler functions
function handleUnlock(params) {
    console.log('Unlock command executed');
    
    // Add test assets to various artists
    const artistData = {
        'gosheesh': {
            tokens: 40000,
            downloads: [
                { title: 'NLi10 #1' },
                { title: 'NLi10 #1' },
                { title: 'NLi10 #1' },
                { title: 'NLi10 #1' }
            ]
        },
        'jai_tea': {
            tokens: 20000,
            downloads: [
                { title: 'Earth #2' },
                { title: 'Earth #2' }
            ]
        },
        'lumilitanide': {
            tokens: 15000,
            downloads: [
                { title: 'nSTRIPS' }
            ]
        },
        'i_spir': {
            tokens: 10000,
            downloads: [
                { title: 'Dream #3' }
            ]
        }
    };
    
    // If params were specified, modify token amounts
    let multiplier = 1;
    if (params) {
        const paramNumber = parseInt(params);
        if (!isNaN(paramNumber)) {
            multiplier = paramNumber;
        }
    }
    
    // Add tokens and downloads for each artist
    Object.keys(artistData).forEach(artistId => {
        // Clear existing assets first to prevent duplication
        clearArtistAssets(artistId);
        
        // Add tokens based on data and multiplier
        const tokens = artistData[artistId].tokens * multiplier;
        window.wallet.addTokens(artistId, tokens);
        
        // Add downloads
        artistData[artistId].downloads.forEach(download => {
            window.wallet.addDownload(artistId, {
                id: Date.now() + Math.floor(Math.random() * 1000),
                title: download.title,
                purchaseDate: new Date().toISOString(),
                ipfsHash: window.wallet.generateIPFSHash()
            });
        });
    });
    
    // Simulate a purchase completion to test automatic wallet opening
    // but only if requested with "unlock purchase" command
    if (params === 'purchase') {
        window.wallet.onPurchaseComplete('jai_tea', true, 10000, true);
    } else {
        // Show success message
        alert('Wallet unlocked with test assets! You now have assets from multiple artists.');
    }
}

// Clear assets for a specific artist
function clearArtistAssets(artistId) {
    const assets = window.wallet.loadAssets();
    if (assets[artistId]) {
        delete assets[artistId];
        localStorage.setItem('userAssets', JSON.stringify(assets));
    }
}

function handleReset(params) {
    console.log('Reset command executed');
    
    // Clear all assets
    window.wallet.clear();
    
    // Show success message
    alert('All data has been reset!');
}

function handleDebug(params) {
    console.log('Debug command executed');
    
    // Show debug info
    const userAssets = window.wallet.loadAssets();
    const hasAssets = window.wallet.hasAssets();
    
    console.log('Current wallet state:', {
        userAssets,
        hasAssets,
        walletEl: document.getElementById('walletDisplay'),
        isWalletDisplayVisible: document.getElementById('walletDisplay')?.style.display
    });
    
    // Show debug info to user
    alert(`Debug mode\n\nAssets: ${hasAssets ? 'Yes' : 'No'}\nArtists: ${Object.keys(userAssets).join(', ')}`);
}

function handleTest(params) {
    console.log('Test command executed');
    
    // If test has parameters, use them to test specific functionality
    if (params) {
        const [command, value] = params.split(' ');
        
        if (command === 'purchase') {
            // Simulate a purchase
            const artistId = value || 'gosheesh';
            window.wallet.onPurchaseComplete(artistId, true, 10000, true);
            alert(`Test purchase completed for ${artistId}. Wallet should automatically open.`);
        } else if (command === 'tokens') {
            // Add specific tokens
            const artistId = value || 'gosheesh';
            window.wallet.addTokens(artistId, 5000);
            alert(`Added 5000 tokens for ${artistId}`);
        }
    } else {
        // Simulate the purchase completion state to test auto-opening wallet
        window.wallet.onPurchaseComplete('jai_tea', true, 10000, true);
        
        // Tell user what we're testing
        alert('Testing purchase completion with automatic wallet display');
    }
}

function handleHelp() {
    console.log('Help command executed');
    
    // Show help info
    alert(`Available safewords:
- unlock: Add test assets to wallet
- unlock purchase: Add assets and simulate purchase
- reset: Clear all data
- debug: Show debug information
- test: Simulate purchase completion
- test purchase [artist]: Test specific artist purchase
- help: Show this help message`);
} 