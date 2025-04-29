/**
 * Converts integer cents to dollars with 2 decimal places
 * @param {number} cents - Amount in cents (integer)
 * @returns {number} - Amount in dollars (float with 2 decimal places)
 */
export function integerCentsToDollars(cents) {
  return parseFloat((cents / 100).toFixed(2));
}

/**
 * Multiplies an integer amount by a float while preserving precision
 * @param {number} amount - Integer amount (e.g., cents)
 * @param {number} multiplier - Float multiplier (e.g., exchange rate)
 * @returns {number} - Resulting integer amount
 */
export function integerMultiplyByFloat(amount, multiplier) {
  return Math.round(amount * multiplier);
}

/**
 * Splits an integer amount by weights
 * @param {number} amount - Integer amount to split
 * @param {number[]} weights - Array of weights
 * @param {string} [txId] - Optional transaction ID for debugging
 * @returns {number[]} - Array of integer amounts corresponding to weights
 */
export function integerSplitByWeights(amount, weights, txId = "") {
  if (!weights || weights.length === 0) return [];
  
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  if (totalWeight === 0) return weights.map(() => 0);
  
  // Calculate each portion based on weight
  const portions = weights.map(weight => (weight / totalWeight) * amount);
  
  // Round down to ensure we don't allocate more than the total
  const roundedPortions = portions.map(p => Math.floor(p));
  
  // Calculate the sum after rounding down
  const allocatedSum = roundedPortions.reduce((sum, p) => sum + p, 0);
  
  // Distribute the remaining cents (due to rounding) to maintain the total
  const remainder = amount - allocatedSum;
  
  if (remainder > 0 && remainder <= weights.length) {
    // Allocate one cent to each person until remainder is distributed
    // Sort by the decimal part to give extra cents to those who lost most in rounding
    const sortedIndices = portions
      .map((p, i) => ({ index: i, fraction: p - Math.floor(p) }))
      .sort((a, b) => b.fraction - a.fraction)
      .map(item => item.index);
    
    for (let i = 0; i < remainder; i++) {
      roundedPortions[sortedIndices[i]]++;
    }
  } else if (remainder > weights.length) {
    console.warn(`Unusually large remainder (${remainder}) in transaction ${txId}`);
    
    // Distribute based on weights for larger remainders
    const sortedIndices = weights
      .map((w, i) => ({ index: i, weight: w }))
      .sort((a, b) => b.weight - a.weight)
      .map(item => item.index);
    
    let remainingCents = remainder;
    let currentIndex = 0;
    
    while (remainingCents > 0) {
      roundedPortions[sortedIndices[currentIndex % weights.length]]++;
      remainingCents--;
      currentIndex++;
    }
  }
  
  return roundedPortions;
}