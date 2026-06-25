import { NextResponse } from 'next/server';
import connectToDatabase from '@/backend/config/db';
import RegionSettings from '@/backend/models/RegionSettings';
import Warehouse from '@/backend/models/Warehouse';

export async function GET(req) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const manualCountry = searchParams.get('country');

    let detectedCountryCode = null;

    if (manualCountry) {
      detectedCountryCode = manualCountry.toUpperCase();
    } else {
      const forwarded = req.headers.get('x-forwarded-for');
      const ip = forwarded ? forwarded.split(',')[0].trim() : '127.0.0.1';
      const isPrivateIp = ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.');
      
      if (!isPrivateIp) {
        try {
          const geoRes = await fetch(`http://ip-api.com/json/${ip}?fields=status,countryCode`, {
            signal: AbortSignal.timeout(3000),
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

    if (!detectedCountryCode) {
      detectedCountryCode = 'GB'; // Default fallback
    }

    // Find if the detected country is an active Region
    let region = await RegionSettings.findOne({ countryCode: detectedCountryCode, isActive: true });
    let isThirdCountry = false;

    // If not found, use a fallback region (e.g., the first active one, or a specific international default)
    if (!region) {
      isThirdCountry = true;
      // Fallback to GB or NP
      region = await RegionSettings.findOne({ countryCode: 'GB', isActive: true });
      if (!region) {
        region = await RegionSettings.findOne({ isActive: true }); // Just pick the first active one
      }
    }

    if (!region) {
      return NextResponse.json({
        error: 'No regions available',
        detectedCountry: detectedCountryCode,
      }, { status: 404 });
    }

    // Check if there are any active warehouses for this region
    const warehouses = await Warehouse.find({ countryCode: region.countryCode, status: 'Active' });
    const canPurchase = warehouses.length > 0;

    const symbolMap = { 'NPR': 'रु', 'GBP': '£', 'USD': '$', 'EUR': '€', 'AUD': 'A$', 'CAD': 'C$' };
    const currencySymbol = symbolMap[region.currency] || '£';

    return NextResponse.json({
      detectedCountryCode: detectedCountryCode,
      countryCode: region.countryCode,
      countryName: region.countryName,
      currency: region.currency,
      currencySymbol: currencySymbol,
      taxRate: region.taxRate,
      isThirdCountry: isThirdCountry,
      thirdCountryMode: isThirdCountry ? 'International Delivery' : null,
      canPurchase: canPurchase,
    });

  } catch (error) {
    console.error('Geo detection error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
