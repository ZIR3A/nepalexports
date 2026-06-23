import { NextResponse } from 'next/server';
import connectToDatabase from '@/backend/config/db';
import Order from '@/backend/models/Order';
import { getServerSession } from "next-auth/next";

export async function GET(req) {
  try {
    await connectToDatabase();
    
    // We try to get session, or fallback to an email query param for guest users checking their orders
    const session = await getServerSession();
    const { searchParams } = new URL(req.url);
    const emailParam = searchParams.get('email');
    
    const queryEmail = session?.user?.email || emailParam;

    if (!queryEmail) {
      return NextResponse.json({ error: "Unauthorized: Please log in or provide an email." }, { status: 401 });
    }

    // Find orders where customerDetails.email matches
    const orders = await Order.find({ "customerDetails.email": queryEmail }).sort({ createdAt: -1 });
    
    return NextResponse.json({ success: true, orders }, { status: 200 });
  } catch (error) {
    console.error("Fetch user orders error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
