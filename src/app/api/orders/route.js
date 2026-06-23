import { NextResponse } from 'next/server';
import connectToDatabase from '@/backend/config/db';
import Order from '@/backend/models/Order';

export async function GET(req) {
  try {
    await connectToDatabase();
    
    // Sort by most recent first
    const orders = await Order.find({}).sort({ createdAt: -1 });
    
    return NextResponse.json({ success: true, orders }, { status: 200 });
  } catch (error) {
    console.error("Fetch orders error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
