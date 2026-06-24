import { NextResponse } from 'next/server';
import connectToDatabase from '@/backend/config/db';
import AdminAlert from '@/backend/models/AdminAlert';

/**
 * GET /api/admin/alerts
 * Fetch admin alerts.
 */
export async function GET(req) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const unreadOnly = searchParams.get('unreadOnly') === 'true';

    const query = {};
    if (unreadOnly) {
      query.isRead = false;
    }

    const alerts = await AdminAlert.find(query).sort({ createdAt: -1 }).limit(50);
    
    return NextResponse.json(alerts);
  } catch (error) {
    console.error('Fetch Alerts Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT /api/admin/alerts
 * Mark an alert as read, or mark all of a specific type as read.
 */
export async function PUT(req) {
  try {
    await connectToDatabase();
    const { id, bulkReadType } = await req.json();

    if (bulkReadType) {
      await AdminAlert.updateMany(
        { type: bulkReadType, isRead: false },
        { $set: { isRead: true, resolvedAt: new Date() } }
      );
      return NextResponse.json({ success: true, message: `All ${bulkReadType} marked as read.` });
    }

    if (!id) return NextResponse.json({ error: 'Missing alert id' }, { status: 400 });

    const alert = await AdminAlert.findByIdAndUpdate(id, { isRead: true, resolvedAt: new Date() }, { new: true });
    
    return NextResponse.json(alert);
  } catch (error) {
    console.error('Update Alert Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
