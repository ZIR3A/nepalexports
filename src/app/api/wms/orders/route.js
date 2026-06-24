import { NextResponse } from 'next/server';
import { validateWmsApiKey, notifyWmsOrderAllocated } from '@/backend/services/wmsService';

/**
 * POST /api/wms/orders
 * Order Allocation endpoint. Called internally after checkout, or via external system.
 */
export async function POST(req) {
  try {
    if (!validateWmsApiKey(req)) {
      return NextResponse.json({ error: 'Unauthorized: Invalid API Key' }, { status: 401 });
    }

    const body = await req.json();
    const { orderId, orderNumber, items, warehouseId } = body;

    if (!orderId || !items || !warehouseId) {
      return NextResponse.json({ error: 'Missing required fields: orderId, items, warehouseId' }, { status: 400 });
    }

    // Call the WMS service to notify allocation
    const result = await notifyWmsOrderAllocated({
      orderId,
      orderNumber,
      items,
      warehouseId
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('WMS Order Allocation Error:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}
