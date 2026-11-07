/**
 * Money utilities for INR currency and paise/cents conversion
 */

export function formatINR(cents: number): string {
  // cents are stored as paise (1 INR = 100 paise)
  const rupees = cents / 100;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2
  }).format(rupees);
}

export function parseRupeesToCents(rupeesStr: string): number {
  const num = parseFloat(rupeesStr);
  if (isNaN(num)) return 0;
  return Math.round(num * 100);
}

export function centsToRupeesString(cents: number): string {
  return (cents / 100).toFixed(2);
}
