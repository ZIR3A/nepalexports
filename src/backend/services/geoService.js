import Warehouse from '../models/Warehouse.js';
import dbConnect from '../config/db.js';

export const geoService = {
  /**
   * Detect country from IP address
   * @param {string} ip - IP address string
   * @returns {string|null} - ISO 3166-1 alpha-2 country code or null if not found
   */
  detectCountry: (ip) => {
    // Handling localhost/private IPs for testing
    if (ip === '::1' || ip === '127.0.0.1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
      return null;
    }

    try {
      // Require inside function to prevent Next.js build-time evaluation crash
      const geoip = require('geoip-lite');
      const geo = geoip.lookup(ip);
      if (geo && geo.country) {
        return geo.country;
      }
    } catch (e) {
      console.warn("geoip-lite lookup failed", e.message);
    }
    
    return null;
  },

  /**
   * Assign a warehouse based on a country code
   * @param {string} countryCode - ISO 3166-1 alpha-2 country code
   * @returns {Object} - Mongoose Warehouse Document
   */
  assignWarehouse: async (countryCode) => {
    await dbConnect();
    
    // 1. Find warehouses that serve this country
    const warehouses = await Warehouse.find({
      countriesServed: countryCode,
      isActive: true
    });

    if (warehouses.length > 0) {
      // 2. If multiple exist, prioritize the one physically in the country
      const primary = warehouses.find(w => w.countryCode === countryCode);
      if (primary) return primary;
      
      // Return first match if none physically in country
      return warehouses[0];
    }

    // 3. Fallback: return default international warehouse
    const defaultWarehouse = await Warehouse.findOne({
      isDefaultInternational: true,
      isActive: true
    });

    if (defaultWarehouse) {
      return defaultWarehouse;
    }

    // 4. Absolute fallback: Return first active warehouse
    const anyActive = await Warehouse.findOne({ isActive: true });
    
    if (!anyActive) {
      throw new Error('No active warehouses found in the system');
    }

    return anyActive;
  }
};
