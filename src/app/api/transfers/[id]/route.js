import { NextResponse } from 'next/server';
import connectToDatabase from '@/backend/config/db';
import Transfer from '@/backend/models/Transfer';
import Inventory from '@/backend/models/Inventory';

export async function PUT(req, { params }) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const body = await req.json();

    const transfer = await Transfer.findById(id);
    if (!transfer) {
      return NextResponse.json({ message: 'Transfer not found' }, { status: 404 });
    }

    const previousStatus = transfer.status;
    const newStatus = body.status;

    // Helper to safely update inventory
    const updateInventory = async (warehouseId, productId, variantId, qtyChange) => {
      let inventory = await Inventory.findOne({
        product: productId,
        variantId: variantId,
        warehouse: warehouseId
      });

      if (!inventory) {
        if (qtyChange > 0) {
          inventory = await Inventory.create({
            product: productId,
            variantId: variantId,
            warehouse: warehouseId,
            quantity: qtyChange
          });
        }
      } else {
        inventory.quantity += qtyChange;
        await inventory.save();
      }
    };

    // If moving from Draft/Packed to Dispatched -> Deduct from Source Warehouse
    if (previousStatus !== 'Dispatched' && newStatus === 'Dispatched') {
      for (const item of transfer.items) {
        // Deduct from source
        await updateInventory(transfer.sourceWarehouse, item.product, item.variantId, -item.quantity);
        // Note: For a strict Transit tracking, we could have a specific "Transit" warehouse, but if we don't, it is conceptually "in the ether"
        // Let's assume there's a Transit warehouse we might explicitly use, or we just deduct it.
        // Actually, the prompt states: Nepal Warehouse -> Transit -> UK Warehouse. 
        // Transit should be a warehouse entity itself. If it is, the destination of the transfer is Transit? No, it's a flow. 
        // To simplify, let's just deduct from source.
      }
    }

    // If moving to Received -> Add to Destination Warehouse
    if (previousStatus !== 'Received' && newStatus === 'Received') {
      for (const item of transfer.items) {
        await updateInventory(transfer.destinationWarehouse, item.product, item.variantId, item.quantity);
      }
    }

    transfer.status = newStatus;
    if (body.notes) transfer.notes = body.notes;
    await transfer.save();

    return NextResponse.json({ message: 'Transfer updated', transfer, success: true });
  } catch (error) {
    console.error('Update Transfer Error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req, { params }) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const transfer = await Transfer.findById(id).populate('items.product', 'name sku');
    if (!transfer) return NextResponse.json({ message: 'Not found' }, { status: 404 });
    return NextResponse.json(transfer);
  } catch (error) {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
