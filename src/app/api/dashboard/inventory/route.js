import { NextResponse } from 'next/server';
import connectToDatabase from '@/backend/config/db';
import Inventory from '@/backend/models/Inventory';
import Product from '@/backend/models/Product';
import Warehouse from '@/backend/models/Warehouse';
import Transfer from '@/backend/models/Transfer';

export async function GET() {
  try {
    await connectToDatabase();
    
    const inventory = await Inventory.find({}).populate('warehouse').populate('product');
    
    let totalValue = 0;
    let nepalStock = 0;
    let ukStock = 0;
    let transitStock = 0;
    let lowStockItems = 0;

    inventory.forEach(inv => {
      const val = (inv.product?.basePrice || 0) * inv.quantity;
      totalValue += val;

      const whName = inv.warehouse?.name?.toLowerCase() || '';
      const whCountry = inv.warehouse?.country || '';

      if (whName.includes('transit')) {
        transitStock += inv.quantity;
      } else if (whCountry === 'Nepal' || whName.includes('nepal')) {
        nepalStock += inv.quantity;
      } else if (whCountry === 'United Kingdom' || whName.includes('uk')) {
        ukStock += inv.quantity;
      }

      if (inv.quantity < (inv.minimumStockLimit || 10)) {
        lowStockItems++;
      }
    });

    const pendingTransfers = await Transfer.countDocuments({ status: { $in: ['Draft', 'Packed', 'Dispatched', 'In Transit', 'Customs Clearance'] } });

    return NextResponse.json({
      totalValue,
      nepalStock,
      ukStock,
      transitStock,
      lowStockItems,
      pendingTransfers
    });
  } catch (error) {
    console.error('Inventory Dashboard API Error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
