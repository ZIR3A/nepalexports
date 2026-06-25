import { NextResponse } from 'next/server';
import connectToDatabase from '@/backend/config/db';
import User from '@/backend/models/User';
import { authorizeRoles } from '@/backend/middleware/auth';

export async function GET(req) {
  try {
    const authResponse = await authorizeRoles('super_admin', 'admin', 'warehouse_manager');
    if (authResponse) return authResponse;

    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q');
    
    let query = {};
    if (q) {
      query = {
        $or: [
          { name: { $regex: q, $options: 'i' } },
          { email: { $regex: q, $options: 'i' } }
        ]
      };
    }
    
    // Only return users who can potentially be managers
    const users = await User.find(query).select('name email role').limit(10).lean();
    
    return NextResponse.json(users);
  } catch (error) {
    console.error('User Search Error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
