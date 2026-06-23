import { NextResponse } from 'next/server';
import connectToDatabase from '@/backend/config/db';
import Product from '@/backend/models/Product';
import Inventory from '@/backend/models/Inventory';

export async function GET(req) {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const flashSale = searchParams.get('flashSale');
    
    const query = {};
    if (category && category !== 'All') {
      query.category = category;
    }
    
    const admin = searchParams.get('admin');
    
    if (flashSale === 'true') {
      query['flashSale.isActive'] = true;
      query['flashSale.expiresAt'] = { $gt: new Date() };
    }
    
    if (admin !== 'true') {
      query.isActive = true;
    }

    const products = await Product.find(query)
      .populate('mainCategory', 'name slug productType')
      .populate('subCategory', 'name slug')
      .sort({ createdAt: -1 });

    return NextResponse.json(products);
  } catch (error) {
    console.error('Fetch Products Error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    // Note: Add Admin auth check here
    await connectToDatabase();
    
    const body = await req.json();
    
    // Extract variants so we can handle inventory mapping
    const rawVariants = body.variants || [];
    
    // Strip inventoryData before saving to Product model to avoid schema validation issues
    const productVariants = rawVariants.map(v => {
      const { inventoryData, ...rest } = v;
      return rest;
    });

    const productPayload = { ...body, variants: productVariants };
    const product = await Product.create(productPayload);
    
    // After product is created, product.variants will have generated _ids
    // Map the inventoryData to the new Inventory collection
    for (let i = 0; i < rawVariants.length; i++) {
      const rawVariant = rawVariants[i];
      const savedVariant = product.variants[i];
      
      if (rawVariant.inventoryData && Object.keys(rawVariant.inventoryData).length > 0) {
        for (const [warehouseId, quantity] of Object.entries(rawVariant.inventoryData)) {
          if (quantity > 0) {
            await Inventory.create({
              product: product._id,
              variantId: savedVariant._id,
              warehouse: warehouseId,
              quantity: quantity
            });
          }
        }
      }
    }
    
    return NextResponse.json({ message: 'Product created successfully', product }, { status: 201 });
  } catch (error) {
    console.error('Create Product Error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
