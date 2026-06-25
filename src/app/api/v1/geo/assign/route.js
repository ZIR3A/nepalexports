import { NextResponse } from 'next/server';
import { geoService } from '@/backend/services/geoService';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const body = await req.json();
    const { countryCode } = body;

    if (!countryCode) {
      return NextResponse.json(
        { success: false, message: 'countryCode is required in the request body', error: { code: 'VALIDATION_ERROR' } },
        { status: 400 }
      );
    }

    const warehouse = await geoService.assignWarehouse(countryCode);

    return NextResponse.json({
      success: true,
      data: {
        warehouse
      }
    });
  } catch (error) {
    console.error('Error in geo/assign:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal Server Error' },
      { status: error.message.includes('No active warehouses') ? 503 : 500 }
    );
  }
}
