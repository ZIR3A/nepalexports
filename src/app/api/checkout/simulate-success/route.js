import { NextResponse } from 'next/server';
import connectToDatabase from '@/backend/config/db';
import Order from '@/backend/models/Order';
import Inventory from '@/backend/models/Inventory';
import Product from '@/backend/models/Product';

export async function POST(req) {
  try {
    await connectToDatabase();
    const { orderId } = await req.json();

    if (!orderId) {
      return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.status !== 'Pending' || order.payment.status !== 'Pending') {
      return NextResponse.json({ error: "Order is not in pending state" }, { status: 400 });
    }

    // Mark as paid
    order.payment.status = 'Paid';
    order.payment.transactionId = `txn_success_${Math.random().toString(36).substr(2, 9)}`;
    order.status = 'Processing';
    await order.save();

    // Permanently deduct from reserved stock
    for (const item of order.items) {
      const product = await Product.findById(item.product);
      if (!product) continue;

      const variant = product.variants.find(v => 
        (v.size === item.size || v.size === 'N/A') && 
        (v.color === item.color || v.color === 'N/A')
      );

      if (variant) {
        await Inventory.updateOne(
          { product: product._id, variantId: variant._id, warehouse: order.warehouse },
          { $inc: { reservedQuantity: -item.quantity } }
        );
      }
    }

    return NextResponse.json({ success: true, message: "Payment succeeded, order confirmed." });
  } catch (error) {
    console.error("Simulate success error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
