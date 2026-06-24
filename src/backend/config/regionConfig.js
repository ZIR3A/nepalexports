/**
 * Regional Configuration for ExportHub
 * Maps countries to warehouses, currencies, tax rates, and display rules.
 */

// Country code → region config
export const REGION_MAP = {
  NP: {
    countryCode: 'NP',
    countryName: 'Nepal',
    warehouseName: 'Nepal Warehouse',
    currency: 'NPR',
    currencySymbol: 'रु',
    taxRate: 0.13, // 13% VAT
    freeShippingThreshold: 5000,
    defaultShippingCost: 200,
    paymentMethods: ['esewa', 'khalti'],
  },
  GB: {
    countryCode: 'GB',
    countryName: 'United Kingdom',
    warehouseName: 'UK Warehouse',
    currency: 'GBP',
    currencySymbol: '£',
    taxRate: 0.20, // 20% VAT
    freeShippingThreshold: 80,
    defaultShippingCost: 5.99,
    paymentMethods: ['card', 'paypal'],
  },
};

// Countries that have a physical warehouse
export const SUPPORTED_COUNTRIES = Object.keys(REGION_MAP);

/**
 * Third-country fallback configuration.
 * mode: 'international' (Option B) — assign to default international warehouse
 * mode: 'viewOnly' (Option A) — restrict from purchasing
 */
export const THIRD_COUNTRY_CONFIG = {
  mode: 'international', // 'international' or 'viewOnly'
  defaultWarehouseName: 'Nepal Warehouse',
  defaultCountryCode: 'NP',
  defaultCurrency: 'NPR',
  defaultCurrencySymbol: 'रु',
};

/**
 * Get region config for a given country code.
 * Falls back to third-country config if the country has no warehouse.
 */
export function getRegionConfig(countryCode) {
  if (REGION_MAP[countryCode]) {
    return {
      ...REGION_MAP[countryCode],
      isThirdCountry: false,
      thirdCountryMode: null,
      canPurchase: true,
    };
  }

  // Third-country fallback
  const fallback = REGION_MAP[THIRD_COUNTRY_CONFIG.defaultCountryCode];
  return {
    ...fallback,
    countryCode: countryCode || 'INTL',
    countryName: 'International',
    isThirdCountry: true,
    thirdCountryMode: THIRD_COUNTRY_CONFIG.mode,
    canPurchase: THIRD_COUNTRY_CONFIG.mode === 'international',
  };
}

/**
 * Format a price value with the correct currency symbol.
 */
export function formatPrice(amount, currency) {
  const config = Object.values(REGION_MAP).find(r => r.currency === currency);
  const symbol = config?.currencySymbol || '£';
  
  if (currency === 'NPR') {
    return `${symbol}${Math.round(amount).toLocaleString()}`;
  }
  return `${symbol}${Number(amount).toFixed(2)}`;
}

/**
 * Get the price field to use for a given currency.
 * GBP → basePrice, NPR → localPrice
 */
export function getPriceField(currency) {
  return currency === 'NPR' ? 'localPrice' : 'basePrice';
}
