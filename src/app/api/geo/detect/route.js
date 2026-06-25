import { NextResponse } from 'next/server';
import connectToDatabase from '@/backend/config/db';
import Warehouse from '@/backend/models/Warehouse';
import RegionSettings from '@/backend/models/RegionSettings';
import { getRegionConfig, SUPPORTED_COUNTRIES, THIRD_COUNTRY_CONFIG } from '@/backend/config/regionConfig';

export async function GET(req) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const manualCountry = searchParams.get('country');
    const manualWarehouseId = searchParams.get('warehouseId');

    let warehouse = null;
    let detectedCountryCode = null;

    if (manualWarehouseId) {
      warehouse = await Warehouse.findById(manualWarehouseId);
      if (!warehouse) {
        return NextResponse.json({ error: 'Warehouse not found' }, { status: 404 });
      }
      // Extract from warehouse
      detectedCountryCode = warehouse.countryCode;
    } else if (manualCountry) {
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

    if (!warehouse) {
      const regionConfig = getRegionConfig(detectedCountryCode);
      if (regionConfig.isThirdCountry) {
        warehouse = await Warehouse.findOne({
          isDefaultInternational: true,
          status: 'Active',
        });
        if (!warehouse) {
          warehouse = await Warehouse.findOne({
            name: THIRD_COUNTRY_CONFIG.defaultWarehouseName,
            status: 'Active',
          });
        }
      } else {
        warehouse = await Warehouse.findOne({
          countryCode: regionConfig.countryCode,
          status: 'Active',
        });
      }
      
      if (!warehouse) {
        return NextResponse.json({
          error: 'No warehouse available for your region',
          detectedCountry: detectedCountryCode,
        }, { status: 404 });
      }
    }

    // Now we have the warehouse, we can determine final outputs
    const currency = warehouse.currency || 'GBP';
    // Mapping symbols
    const symbolMap = { 'NPR': 'रु', 'GBP': '£', 'USD': '$', 'EUR': '€' };
    const currencySymbol = symbolMap[currency] || '£';

    let taxRate = 0;
    const regionDb = await RegionSettings.findOne({ countryCode: warehouse.countryCode });
    if (regionDb) {
      taxRate = regionDb.taxRate;
    }

    return NextResponse.json({
      detectedCountryCode: detectedCountryCode || warehouse.countryCode,
      countryCode: warehouse.countryCode,
      countryName: warehouse.country || warehouse.name,
      warehouseId: warehouse._id,
      warehouseName: warehouse.name,
      currency: currency,
      currencySymbol: currencySymbol,
      taxRate,
      isThirdCountry: warehouse.isDefaultInternational,
      thirdCountryMode: warehouse.isDefaultInternational ? 'International Delivery' : null,
      canPurchase: warehouse.status === 'Active',
    });

  } catch (error) {
    console.error('Geo detection error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
