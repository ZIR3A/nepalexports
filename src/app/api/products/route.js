import { NextResponse } from 'next/server';
import connectToDatabase from '@/backend/config/db';
import Product from '@/backend/models/Product';
import Inventory from '@/backend/models/Inventory';
import Category from '@/backend/models/Category';
import Warehouse from '@/backend/models/Warehouse';
import RegionSettings from '@/backend/models/RegionSettings';
import mongoose from 'mongoose';
import { authorizeRoles } from '@/backend/middleware/auth';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const flashSale = searchParams.get('flashSale');
    const admin = searchParams.get('admin');
    
    // Check header first for global storefront, fallback to query param
    const warehouseHeader = req.headers.get('x-warehouse-id');
    const activeWarehouseId = warehouseHeader || searchParams.get('warehouseId');
    const countryCode = searchParams.get('countryCode');
    
    const query = {};
    if (category && category !== 'All') {
      query.category = category;
    }
    
    if (flashSale === 'true') {
      query['flashSale.isActive'] = true;
      query['flashSale.expiresAt'] = { $gt: new Date() };
    }
    
    let activeWarehouseIds = [];
    let activeRegionId = null;

    if (countryCode) {
      const whs = await Warehouse.find({ countryCode: countryCode, status: 'Active' });
      activeWarehouseIds = whs.map(w => String(w._id));
      const region = await RegionSettings.findOne({ countryCode });
      if (region) activeRegionId = String(region._id);
    } else if (activeWarehouseId) {
      activeWarehouseIds = [activeWarehouseId];
      const wh = await Warehouse.findById(activeWarehouseId);
      if (wh && wh.countryCode) {
        const region = await RegionSettings.findOne({ countryCode: wh.countryCode });
        if (region) activeRegionId = String(region._id);
      }
    }

    if (admin !== 'true') {
      query.isActive = true;
      // Only show published products on the storefront (not WMS drafts)
      query.status = { $in: ['published', null] };
      



      // Allowed Regions strict regulatory block
      query.$or = [
        { allowedRegions: { $exists: false } },
        { allowedRegions: { $size: 0 } }
      ];
      if (activeRegionId) {
        query.$or.push({ allowedRegions: activeRegionId });
      }
    }

    let products = await Product.find(query)
      .populate('mainCategory', 'name slug productType')
      .populate('subCategory', 'name slug')
      .sort({ createdAt: -1 });

    let plainProducts = products.map(p => {
      const pObj = p.toJSON ? p.toJSON() : p;
      
      if (pObj.enrichment) {
        pObj.description = pObj.enrichment.description || pObj.description;
        pObj.shortDescription = pObj.enrichment.shortDescription || pObj.shortDescription;
      }

      return pObj;
    });

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

      plainProducts = plainProducts.map(pObj => {
        const invMap = inventoryByProduct[String(pObj._id)] || {};
        pObj.inventoryMap = invMap;
        
        // Collect warehouses where this product has an explicit inventory record
        const activeWhIds = new Set();
        Object.values(invMap).forEach(vMap => {
          Object.keys(vMap.byWarehouse || {}).forEach(whId => activeWhIds.add(whId));
        });
        
        pObj.allowedWarehouses = Array.from(activeWhIds);
        return pObj;
      });
    }

    // If activeWarehouseIds exist (storefront mode), annotate stock info
    if (activeWarehouseIds.length > 0 && admin !== 'true') {
      const productIds = plainProducts.map(p => p._id);
      
      // Fetch all global inventory to determine import availability
      const globalInventory = await Inventory.find({
        product: { $in: productIds },
        quantity: { $gt: 0 }
      });

      const stockMap = {};
      const globalStockMap = {};
      
      globalInventory.forEach(inv => {
        const pid = String(inv.product);
        globalStockMap[pid] = (globalStockMap[pid] || 0) + inv.quantity;
        
        if (activeWarehouseIds.includes(String(inv.warehouse))) {
          stockMap[pid] = (stockMap[pid] || 0) + inv.quantity;
        }
      });

      // Annotate the remaining products with fulfillmentStatus
      plainProducts = plainProducts
        .map(pObj => {
          const pid = String(pObj._id);
          const localStock = stockMap[pid] || 0;
          const globalStock = globalStockMap[pid] || 0;
          
          let fulfillmentStatus = 'OUT_OF_STOCK';
          if (localStock > 0) {
            fulfillmentStatus = 'IN_STOCK';
          } else if (globalStock > 0 && pObj.allowImport) {
            fulfillmentStatus = 'AVAILABLE_VIA_IMPORT';
          }

          return {
            ...pObj,
            localStock,
            fulfillmentStatus,
            isUnavailable: fulfillmentStatus === 'OUT_OF_STOCK',
          };
        });
      
      // Products with OUT_OF_STOCK appear last
      plainProducts.sort((a, b) => {
        if (a.fulfillmentStatus === 'OUT_OF_STOCK' && b.fulfillmentStatus !== 'OUT_OF_STOCK') return 1;
        if (a.fulfillmentStatus !== 'OUT_OF_STOCK' && b.fulfillmentStatus === 'OUT_OF_STOCK') return -1;
        return 0;
      });
    }

    return NextResponse.json(plainProducts);
  } catch (error) {
    console.error('Fetch Products Error:', error);
    return NextResponse.json({ message: 'Internal server error', error: error.message, stack: error.stack }, { status: 500 });
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
    
    // Map enrichment fields if they come from the old UI flat structure
    if (body.description !== undefined || body.shortDescription !== undefined) {
      productPayload.enrichment = {
        ...(productPayload.enrichment || {}),
        description: body.description,
        shortDescription: body.shortDescription
      };
    }

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
