import { NextResponse } from 'next/server';
import connectToDatabase from '@/backend/config/db';
import Product from '@/backend/models/Product';
import Inventory from '@/backend/models/Inventory';
import Warehouse from '@/backend/models/Warehouse';
import { unlink } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function GET(req, { params }) {
  try {
    await connectToDatabase();
    
    const { id } = await params;

    const product = await Product.findById(id);
    if (!product) {
      return NextResponse.json({ message: 'Product not found' }, { status: 404 });
    }

    // Fetch inventory for all variants across all warehouses
    const inventory = await Inventory.find({ product: id }).populate('warehouse');
    
    // Aggregate total stock simply
    let totalStock = 0;
    const inventoryMap = {};

    inventory.forEach(inv => {
      totalStock += inv.quantity;
      if (!inventoryMap[inv.variantId]) {
        inventoryMap[inv.variantId] = 0;
      }
      inventoryMap[inv.variantId] += inv.quantity;
    });

    return NextResponse.json({ 
      ...product.toObject(), 
      totalStock,
      inventoryMap // maps variantId to total quantity
    });
  } catch (error) {
    console.error('Fetch Product Detail Error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const body = await req.json();

    const product = await Product.findByIdAndUpdate(id, body, { new: true, runValidators: true });
    if (!product) {
      return NextResponse.json({ message: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Product updated successfully', product, success: true });
  } catch (error) {
    console.error('Update Product Error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    await connectToDatabase();
    const { id } = await params;

    const product = await Product.findById(id);
    if (!product) {
      return NextResponse.json({ message: 'Product not found' }, { status: 404 });
    }

    // Delete associated media files from local storage if applicable
    if (product.media && product.media.length > 0) {
      for (const m of product.media) {
        if (m.url && m.url.startsWith('/uploads/')) {
          const filename = m.url.replace('/uploads/', '');
          const filePath = join(process.cwd(), "public", "uploads", filename);
          if (existsSync(filePath)) {
            await unlink(filePath).catch(err => console.error("Failed to delete local media:", err));
          }
        }
      }
    }

    await Product.findByIdAndDelete(id);

    return NextResponse.json({ message: 'Product deleted successfully', success: true });
  } catch (error) {
    console.error('Delete Product Error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
