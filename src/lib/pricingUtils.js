export function getPriceForRegion(product, countryCode) {
  if (!product || !product.pricing || product.pricing.length === 0) {
    return { basePrice: 0, salePrice: null, taxRate: 0, currency: 'GBP' };
  }
  
  // Try to find exact country match
  const regionPricing = product.pricing.find(pr => pr.country === countryCode);
  if (regionPricing) {
    return regionPricing;
  }

  // Fallback to first available pricing (usually GB)
  return product.pricing[0];
}
