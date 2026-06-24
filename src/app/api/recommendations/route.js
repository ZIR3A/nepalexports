import { NextResponse } from 'next/server';
import connectToDatabase from '@/backend/config/db';
import Product from '@/backend/models/Product';
import Inventory from '@/backend/models/Inventory';

export async function GET(req) {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('productId');
    const categoryId = searchParams.get('categoryId');
    const tagsParam = searchParams.get('tags');
    const warehouseId = searchParams.get('warehouseId');

    if (!warehouseId) {
      return NextResponse.json({ message: 'Missing warehouseId' }, { status: 400 });
    }

    // 1. Fetch inventory for the specific warehouse where stock > 0
    const warehouseInventory = await Inventory.find({
      warehouse: warehouseId,
      quantity: { $gt: 0 },
    });

    const inStockProductIds = new Set(warehouseInventory.map(inv => String(inv.product)));
    
    // Build total stock map for annotation
    const stockMap = {};
    warehouseInventory.forEach(inv => {
      const pid = String(inv.product);
      stockMap[pid] = (stockMap[pid] || 0) + inv.quantity;
    });

    // 2. Fetch those products (excluding current productId)
    const filteredIds = Array.from(inStockProductIds).filter(id => id !== productId);

    let products = await Product.find({
      _id: { $in: filteredIds },
      isActive: true,
      status: { $in: ['published', undefined, null] }
    }).populate('mainCategory', 'name slug');

    // Parse tags array
    const queryTags = tagsParam ? tagsParam.split(',').map(t => t.trim()) : [];

    // 3. In-memory scoring algorithm
    products = products.map(p => {
      let score = 0;
      
      // Affinity: Category Match (+2)
      if (categoryId && String(p.mainCategory?._id) === categoryId) {
        score += 2;
      }
      
      // Affinity: Tag overlaps (+1 each)
      if (queryTags.length > 0 && p.tags && p.tags.length > 0) {
        const overlaps = p.tags.filter(tag => queryTags.includes(tag));
        score += overlaps.length;
      }

      const pObj = p.toJSON();
      return {
        ...pObj,
        localStock: stockMap[String(p._id)] || 0,
        isUnavailable: false, // Since we only fetched in-stock
        _score: score
      };
    });

    // 4. Sort by score DESC, then by newest (Fallback)
    products.sort((a, b) => {
      if (b._score !== a._score) {
        return b._score - a._score;
      }
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    // Return exactly 4 items (or fewer if DB doesn't have enough)
    const recommendations = products.slice(0, 4);

    return NextResponse.json(recommendations);
  } catch (error) {
    console.error('Fetch Recommendations Error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
