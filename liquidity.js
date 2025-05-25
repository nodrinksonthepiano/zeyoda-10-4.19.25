/**
 * Constant Product Market Maker (CPMM) swap simulation
 * @param {string} fromToken - Token being sold (CASH or artist symbol)
 * @param {string} toToken - Token being bought (CASH or artist symbol)
 * @param {number} fromAmount - Amount of fromToken to swap
 * @returns {Object} Simulated swap result with toAmount
 */
export function simulateSwap(fromToken, toToken, fromAmount) {
    // Get current artist data from config
    const artistData = window.config.wallets[Object.keys(window.config.wallets)[0]];
    if (!artistData) return { toAmount: 0 };

    // For CASH→TOKEN: amount * price
    if (fromToken === 'CASH' && toToken === artistData.tokenName) {
        return {
            toAmount: Math.floor(fromAmount / artistData.tokenPrice)
        };
    }
    
    // For TOKEN→CASH: amount / price
    if (fromToken === artistData.tokenName && toToken === 'CASH') {
        return {
            toAmount: fromAmount * artistData.tokenPrice
        };
    }

    // For TOKEN→TOKEN cross-swaps: 
    // First convert to CASH then to target token
    if (fromToken !== 'CASH' && toToken !== 'CASH') {
        // Find price data for both tokens
        const fromArtist = Object.values(window.config.wallets)
            .find(w => w.tokenName === fromToken);
        const toArtist = Object.values(window.config.wallets)
            .find(w => w.tokenName === toToken);

        if (!fromArtist || !toArtist) return { toAmount: 0 };

        // Convert to CASH then to target token
        const cashAmount = fromAmount * fromArtist.tokenPrice;
        return {
            toAmount: Math.floor(cashAmount / toArtist.tokenPrice)
        };
    }

    return { toAmount: 0 };
} 