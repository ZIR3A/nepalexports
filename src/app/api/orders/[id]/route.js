import { NextResponse } from 'next/server';
import connectToDatabase from '@/backend/config/db';
import Order from '@/backend/models/Order';

export async function PATCH(req, { params }) {
  try {
    await connectToDatabase();
    
    // params.id holds the dynamic route parameter
    const { id } = params;
    
    if (!id) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
    }

    const body = await req.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json({ error: "Status is required" }, { status: 400 });
    }

    const validStatuses = ['Processing', 'Shipped', 'Delivered', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status value" }, { status: 400 });
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      { status },
      { new: true } // return updated document
    );

    if (!updatedOrder) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, order: updatedOrder }, { status: 200 });
  } catch (error) {
    console.error("Update order error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
