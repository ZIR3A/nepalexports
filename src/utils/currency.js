/**
 * Formats a given amount into the specified currency.
 * 
 * @param {number} amount - The amount to format
 * @param {string} currency - The currency code (e.g. 'GBP', 'NPR', 'USD', 'EUR')
 * @param {string} symbol - Optional explicit currency symbol
 * @returns {string} Formatted price string
 */
export function formatCurrency(amount, currency, symbol = null) {
  if (amount === undefined || amount === null) return "";
  
  // Default symbol mapping if not provided
  const symbolMap = { 'NPR': 'रु', 'GBP': '£', 'USD': '$', 'EUR': '€' };
  const currencySymbol = symbol || symbolMap[currency] || '£';

  if (currency === "NPR") {
    // NPR usually drops the decimal for clean UI
    return `${currencySymbol}${Math.round(amount).toLocaleString()}`;
  }
  
  // GBP/USD/EUR defaults to 2 decimal places
  return `${currencySymbol}${Number(amount).toFixed(2)}`;
}
