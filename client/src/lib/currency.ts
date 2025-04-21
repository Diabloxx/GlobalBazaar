import { Currency } from '@shared/schema';

/**
 * Format a price with the appropriate currency symbol and decimals
 */
export const formatCurrency = (price: number, currency: Currency): string => {
  const symbol = currency.symbol || currency.code;
  
  // Format the number with appropriate decimal places
  // Using 2 decimal places for most currencies, but no decimals for JPY
  const formattedPrice = currency.code === 'JPY' 
    ? Math.round(price).toString()
    : price.toFixed(2);

  // Return formatted price with currency symbol
  return `${symbol}${formattedPrice}`;
};

/**
 * Get proper currency display for an order
 */
export const getCurrencyDisplay = (
  currencyCode: string, 
  currencies: Currency[]
): Currency => {
  const found = currencies.find(c => c.code === currencyCode);
  if (found) return found;
  
  // Default to USD if currency not found
  return {
    code: 'USD',
    name: 'US Dollar',
    symbol: '$', 
    rate: 1
  };
};
