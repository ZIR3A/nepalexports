import { NextResponse } from 'next/server';
import connectToDatabase from '@/backend/config/db';
import Warehouse from '@/backend/models/Warehouse';
import RegionSettings from '@/backend/models/RegionSettings';
import { getRegionConfig, SUPPORTED_COUNTRIES, THIRD_COUNTRY_CONFIG } from '@/backend/config/regionConfig';

export async function GET(req) {
  try {
    await connectToDatabase();

    // Check for manual country override
    const { searchParams } = new URL(req.url);
    const manualCountry = searchParams.get('country');

    let detectedCountryCode = null;

    if (manualCountry) {
      // Manual override — skip IP detection
      detectedCountryCode = manualCountry.toUpperCase();
    } else {
      // 1. Try to get IP from headers (works behind proxies / Vercel)
      const forwarded = req.headers.get('x-forwarded-for');
      const ip = forwarded ? forwarded.split(',')[0].trim() : '127.0.0.1';

      // 2. Attempt IP-based geolocation (skip for localhost/private IPs)
      const isPrivateIp = ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.');
      
      if (!isPrivateIp) {
        try {
          const geoRes = await fetch(`http://ip-api.com/json/${ip}?fields=status,countryCode`, {
            signal: AbortSignal.timeout(3000), // 3s timeout
          });
          const geoData = await geoRes.json();
          if (geoData.status === 'success') {
            detectedCountryCode = geoData.countryCode;
          }
        } catch (geoErr) {
          console.warn('IP geolocation failed, falling back:', geoErr.message);
        }
      }
    }

    // 3. Get region config (handles third-country fallback automatically)
    const regionConfig = getRegionConfig(detectedCountryCode);

    // Fetch tax rate from RegionSettings
    let taxRate = 0;
    const regionDb = await RegionSettings.findOne({ countryCode: regionConfig.countryCode });
    if (regionDb) {
      taxRate = regionDb.taxRate;
    }

    // 4. Find the warehouse to assign
    let warehouse = null;
    
    if (regionConfig.isThirdCountry) {
      // Third-country: assign to default international warehouse
      warehouse = await Warehouse.findOne({
        isDefaultInternational: true,
        isActive: true,
      });
      // Fallback if no warehouse marked as default international
      if (!warehouse) {
        warehouse = await Warehouse.findOne({
          name: THIRD_COUNTRY_CONFIG.defaultWarehouseName,
          isActive: true,
        });
      }
    } else {
      // Direct country match
      warehouse = await Warehouse.findOne({
        countryCode: regionConfig.countryCode,
        isActive: true,
      });
    }

    if (!warehouse) {
      return NextResponse.json({
        error: 'No warehouse available for your region',
        detectedCountry: detectedCountryCode,
      }, { status: 404 });
    }

    return NextResponse.json({
      detectedCountryCode: detectedCountryCode,
      countryCode: regionConfig.countryCode,
      countryName: regionConfig.countryName,
      warehouseId: warehouse._id,
      warehouseName: warehouse.name,
      currency: regionConfig.currency,
      currencySymbol: regionConfig.currencySymbol,
      taxRate,
      isThirdCountry: regionConfig.isThirdCountry,
      thirdCountryMode: regionConfig.thirdCountryMode,
      canPurchase: regionConfig.canPurchase,
    });

  } catch (error) {
    console.error('Geo detection error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
