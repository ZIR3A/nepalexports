import { NextResponse } from 'next/server';
import connectToDatabase from '@/backend/config/db';
import ActivityLog from '@/backend/models/ActivityLog';

export async function GET(req) {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(req.url);
    const userName = searchParams.get('userName');
    const actionType = searchParams.get('actionType');

    let query = {};
    if (userName) {
      query.userName = { $regex: userName, $options: 'i' };
    }
    if (actionType && actionType !== 'all') {
      query.action_type = actionType;
    }

    const logs = await ActivityLog.find(query).sort({ createdAt: -1 }).limit(100);
    
    return NextResponse.json(logs);
  } catch (error) {
    console.error('Fetch Activity Logs Error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
