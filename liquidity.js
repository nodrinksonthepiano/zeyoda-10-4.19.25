/**
 * Constant Product Market Maker (CPMM) swap simulation
 * @param {string} fromToken - Token being sold (CASH or artist symbol)
 * @param {string} toToken - Token being bought (CASH or artist symbol)
 * @param {number} fromAmount - Amount of fromToken to swap
 * @returns {Object} Simulated swap result with toAmount
 */
export function simulateSwap(fromToken, toToken, fromAmount) {
    // For CASH→TOKEN or TOKEN→CASH swaps, find the relevant artist data
    const fromArtist = fromToken === 'CASH' ? null : 
        Object.values(window.config.artists).find(a => a.tokenName === fromToken);
    const toArtist = toToken === 'CASH' ? null : 
        Object.values(window.config.artists).find(a => a.tokenName === toToken);
    
    if (!fromArtist && !toArtist) return { toAmount: 0 };

    // For CASH→TOKEN: amount / price
    if (fromToken === 'CASH' && toArtist) {
        return {
            toAmount: Math.floor(fromAmount / toArtist.tokenPrice)
        };
    }
    
    // For TOKEN→CASH: amount * price
    if (fromArtist && toToken === 'CASH') {
        return {
            toAmount: fromAmount * fromArtist.tokenPrice
        };
    }

    // For TOKEN→TOKEN cross-swaps:
    // Convert source tokens to cash, then cash to destination tokens
    if (fromArtist && toArtist) {
        const cashAmount = fromAmount * fromArtist.tokenPrice;
        return {
            toAmount: Math.floor(cashAmount / toArtist.tokenPrice)
        };
    }

    return { toAmount: 0 };
}

export function getArtistUnitPrice(artistId) {
  // default 0.0005 unless we've defined a special price
  if (artistId === 'jaitea') return 0.0004;
  return 0.0005;
} 