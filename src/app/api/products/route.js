import { NextResponse } from 'next/server';
import connectToDatabase from '@/backend/config/db';
import Product from '@/backend/models/Product';
import Inventory from '@/backend/models/Inventory';
import Category from '@/backend/models/Category';
import { authorizeRoles } from '@/backend/middleware/auth';

export async function GET(req) {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const flashSale = searchParams.get('flashSale');
    const admin = searchParams.get('admin');
    const warehouseId = searchParams.get('warehouseId');
    const countryCode = searchParams.get('countryCode');
    
    const query = {};
    if (category && category !== 'All') {
      query.category = category;
    }
    
    if (flashSale === 'true') {
      query['flashSale.isActive'] = true;
      query['flashSale.expiresAt'] = { $gt: new Date() };
    }
    
    if (admin !== 'true') {
      query.isActive = true;
      // Only show published products on the storefront (not WMS drafts)
      query.status = { $in: ['published', undefined, null] };
    }

    // Country availability filter for storefront
    if (countryCode && admin !== 'true') {
      query.availableCountries = countryCode;
    }

    let products = await Product.find(query)
      .populate('mainCategory', 'name slug productType')
      .populate('subCategory', 'name slug')
      .sort({ createdAt: -1 });

    // For admin mode, we need the inventoryMap for the AdminInventory portal
    if (admin === 'true') {
      const productIds = products.map(p => p._id);
      const allInventory = await Inventory.find({ product: { $in: productIds } });
      
      const inventoryByProduct = {};
      allInventory.forEach(inv => {
        const pid = String(inv.product);
        if (!inventoryByProduct[pid]) inventoryByProduct[pid] = {};
        const vid = String(inv.variantId);
        if (!inventoryByProduct[pid][vid]) {
          inventoryByProduct[pid][vid] = { total: 0, byWarehouse: {}, reservedByWarehouse: {} };
        }
        inventoryByProduct[pid][vid].total += inv.quantity;
        
        const whId = String(inv.warehouse);
        inventoryByProduct[pid][vid].byWarehouse[whId] = (inventoryByProduct[pid][vid].byWarehouse[whId] || 0) + inv.quantity;
        inventoryByProduct[pid][vid].reservedByWarehouse[whId] = (inventoryByProduct[pid][vid].reservedByWarehouse[whId] || 0) + (inv.reservedQuantity || 0);
      });

      products = products.map(p => {
        const pObj = p.toJSON();
        pObj.inventoryMap = inventoryByProduct[String(p._id)] || {};
        return pObj;
      });
    }

    // If warehouseId is provided (storefront mode), filter to only products
    // that have stock > 0 in the user's assigned warehouse
    if (warehouseId && admin !== 'true') {
      // Fetch all inventory for this warehouse
      const warehouseInventory = await Inventory.find({
        warehouse: warehouseId,
        quantity: { $gt: 0 },
      });

      // Build a set of product IDs that have stock in this warehouse
      const inStockProductIds = new Set(
        warehouseInventory.map(inv => String(inv.product))
      );

      // Also build a map of total stock per product for display
      const stockMap = {};
      warehouseInventory.forEach(inv => {
        const pid = String(inv.product);
        stockMap[pid] = (stockMap[pid] || 0) + inv.quantity;
      });

      // Annotate products with local stock info
      products = products.map(p => {
        const pObj = p.toJSON();
        const pid = String(p._id);
        const localStock = stockMap[pid] || 0;
        return {
          ...pObj,
          localStock,
          isUnavailable: localStock === 0,
        };
      });

      // Optionally: include out-of-stock products but mark them,
      // or filter them out entirely. We'll include them marked as unavailable.
      // Products with zero stock appear last.
      products.sort((a, b) => {
        if (a.isUnavailable && !b.isUnavailable) return 1;
        if (!a.isUnavailable && b.isUnavailable) return -1;
        return 0;
      });
    }

    return NextResponse.json(products);
  } catch (error) {
    console.error('Fetch Products Error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const authResponse = await authorizeRoles('super_admin', 'admin', 'marketing_admin');
    if (authResponse) return authResponse;

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
