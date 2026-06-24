import { NextResponse } from 'next/server';
import connectToDatabase from '@/backend/config/db';
import WmsAuditLog from '@/backend/models/WmsAuditLog';

export const dynamic = 'force-dynamic';

/**
 * GET /api/wms/audit
 * Fetch WMS manual adjustment audit logs.
 */
export async function GET(req) {
  try {
    await connectToDatabase();
    
    // In a real app, verify user is warehouse_manager or super_admin
    // For MVP, we just return the logs
    
    const logs = await WmsAuditLog.find()
      .populate('warehouseId', 'name countryCode')
      .sort({ createdAt: -1 })
      .limit(100);
      
    return NextResponse.json(logs);
  } catch (error) {
    console.error('Fetch Audit Logs Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
