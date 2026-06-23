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
    
    if (flashSale === 'true') {
      query['flashSale.isActive'] = true;
      query['flashSale.expiresAt'] = { $gt: new Date() };
    }
    
    query.isActive = true;

    const products = await Product.find(query).sort({ createdAt: -1 });

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
    const product = await Product.create(body);
    
    return NextResponse.json({ message: 'Product created successfully', product }, { status: 201 });
  } catch (error) {
    console.error('Create Product Error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
