import { NextResponse } from 'next/server';
import connectToDatabase from '@/backend/config/db';
import Warehouse from '@/backend/models/Warehouse';
import Product from '@/backend/models/Product';
import Inventory from '@/backend/models/Inventory';

export async function GET() {
  try {
    await connectToDatabase();

    // 1. Clear existing data
    await Warehouse.deleteMany({});
    await Product.deleteMany({});
    await Inventory.deleteMany({});

    // 2. Seed Warehouses
    const nepalWh = await Warehouse.create({ name: 'Nepal Warehouse', country: 'Nepal', currency: 'NPR' });
    const ukWh = await Warehouse.create({ name: 'UK Warehouse', country: 'United Kingdom', currency: 'GBP' });

    // 3. Seed Products
    const tshirt = await Product.create({
      name: 'Classic Nepal Heritage T-Shirt',
      description: 'Premium quality cotton t-shirt featuring traditional Nepali patterns.',
      basePrice: 2500,
      currency: 'NPR',
      category: 'Fashion',
      media: [
        { type: 'image', url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&auto=format&fit=crop' }
      ],
      variants: [
        { size: 'M', color: 'Black', sku: 'TS-HER-BLK-M' },
        { size: 'L', color: 'Black', sku: 'TS-HER-BLK-L' },
      ]
    });

    const momo = await Product.create({
      name: 'Frozen Buff Momo (50 pcs)',
      description: 'Authentic Nepali style frozen momos, ready to steam.',
      basePrice: 1200,
      currency: 'NPR',
      category: 'Food',
      media: [
        { type: 'image', url: 'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=800&auto=format&fit=crop' }
      ],
      variants: [
        { size: 'Standard', color: 'N/A', sku: 'FOOD-MOMO-BUFF-50' },
      ]
    });

    // 4. Seed Inventory
    // T-Shirt: M Black
    await Inventory.create({
      product: tshirt._id,
      variantId: tshirt.variants[0]._id,
      warehouse: nepalWh._id,
      quantity: 50
    });
    await Inventory.create({
      product: tshirt._id,
      variantId: tshirt.variants[0]._id,
      warehouse: ukWh._id,
      quantity: 100
    });

    // Momo
    await Inventory.create({
      product: momo._id,
      variantId: momo.variants[0]._id,
      warehouse: ukWh._id, // Only in UK warehouse
      quantity: 500
    });

    return NextResponse.json({ message: 'Database seeded successfully with warehouses, products, and inventory!' });
  } catch (error) {
    console.error('Seed Error:', error);
    return NextResponse.json({ message: 'Internal server error', error: error.message }, { status: 500 });
  }
}
