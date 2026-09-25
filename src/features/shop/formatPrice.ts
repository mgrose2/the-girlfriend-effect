/**
 * Prices are plain USD numbers in the seed catalog. Whole dollars drop the
 * cents so a grid of $88 and $128 does not read as a wall of ".00".
 */
export function formatPrice(price: number): string {
  return Number.isInteger(price) ? `$${price}` : `$${price.toFixed(2)}`;
}
