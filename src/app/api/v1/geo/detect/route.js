import { NextResponse } from 'next/server';
import { geoService } from '@/backend/services/geoService';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    // Attempt to get the IP from headers (common in proxies/Next.js deployments)
    const forwardedFor = req.headers.get('x-forwarded-for');
    const realIp = req.headers.get('x-real-ip');
    
    // IP detection logic
    let ip = null;
    if (forwardedFor) {
      ip = forwardedFor.split(',')[0].trim();
    } else if (realIp) {
      ip = realIp;
    }

    if (!ip) {
      return NextResponse.json(
        { success: false, message: 'Could not determine IP address', error: { code: 'IP_UNKNOWN' } },
        { status: 400 }
      );
    }

    const countryCode = geoService.detectCountry(ip);

    if (countryCode) {
      return NextResponse.json({
        success: true,
        data: {
          ip,
          detectedCountry: countryCode
        }
      });
    } else {
      return NextResponse.json(
        { success: false, message: 'Could not resolve country from IP', data: { ip, detectedCountry: null } },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('Error in geo/detect:', error);
    return NextResponse.json(
      { success: false, message: 'Internal Server Error', error: error.message },
      { status: 500 }
    );
  }
}
