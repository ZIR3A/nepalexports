import { NextResponse } from 'next/server';
import connectToDatabase from '@/backend/config/db';
import Product from '@/backend/models/Product';
import Inventory from '@/backend/models/Inventory';
import Warehouse from '@/backend/models/Warehouse';
import { unlink } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { del } from '@vercel/blob';
import { authorizeRoles } from '@/backend/middleware/auth';

export const dynamic = 'force-dynamic';

export async function GET(req, { params }) {
  try {
    await connectToDatabase();
    
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const warehouseHeader = req.headers.get('x-warehouse-id');
    const warehouseId = warehouseHeader || searchParams.get('warehouseId');
    const countryCode = searchParams.get('countryCode');
    const admin = searchParams.get('admin');

    let activeWarehouseIds = [];
    let activeRegionId = null;

    if (countryCode) {
      const whs = await Warehouse.find({ countryCode: countryCode, status: 'Active' });
      activeWarehouseIds = whs.map(w => String(w._id));
      const RegionSettings = (await import('@/backend/models/RegionSettings')).default;
      const region = await RegionSettings.findOne({ countryCode });
      if (region) activeRegionId = String(region._id);
    } else if (warehouseId) {
      activeWarehouseIds = [warehouseId];
      const wh = await Warehouse.findById(warehouseId);
      if (wh && wh.countryCode) {
        const RegionSettings = (await import('@/backend/models/RegionSettings')).default;
        const region = await RegionSettings.findOne({ countryCode: wh.countryCode });
        if (region) activeRegionId = String(region._id);
      }
    }

    const product = await Product.findById(id).populate('mainCategory').populate('subCategory');
    if (!product) {
      return NextResponse.json({ message: 'Product not found' }, { status: 404 });
    }

    // Explicit Allowed Regions Block
    if (admin !== 'true') {
      if (product.allowedRegions && product.allowedRegions.length > 0) {
        const isAllowed = activeRegionId ? product.allowedRegions.map(String).includes(activeRegionId) : false;
        if (!isAllowed) {
          return NextResponse.json({ 
            error: "This product is currently not available in your region due to local restrictions.",
            code: "REGION_RESTRICTED" 
          }, { status: 403 });
        }
      }
    }

    // Fetch inventory for all variants across all warehouses
    const inventory = await Inventory.find({ product: id }).populate('warehouse');
    
    // Aggregate total stock simply
    let totalStock = 0;
    let localRegionStock = 0;
    const inventoryMap = {};

    inventory.forEach(inv => {
      totalStock += inv.quantity;
      const vid = String(inv.variantId);
      if (!inventoryMap[vid]) {
        inventoryMap[vid] = { total: 0, byCountry: {}, byWarehouse: {} };
      }
      inventoryMap[vid].total += inv.quantity;
      
      // Per-warehouse mapping (for admin edit form)
      const whId = String(inv.warehouse?._id);
      inventoryMap[vid].byWarehouse[whId] = (inventoryMap[vid].byWarehouse[whId] || 0) + inv.quantity;
      
      // Track stock in the user's specific region
      if (activeWarehouseIds.includes(whId)) {
        localRegionStock += inv.quantity;
      }

      const whCountryCode = inv.warehouse?.countryCode;
      const whName = inv.warehouse?.name?.toLowerCase() || '';

      if (whName.includes('transit')) {
        inventoryMap[vid].byCountry.Transit = (inventoryMap[vid].byCountry.Transit || 0) + inv.quantity;
      } else if (whCountryCode) {
        inventoryMap[vid].byCountry[whCountryCode] = (inventoryMap[vid].byCountry[whCountryCode] || 0) + inv.quantity;
      }
    });

    // Convert product to plain object
    const productObj = product.toJSON();

    // Map enrichment fields to root level for backwards compatibility
    if (productObj.enrichment) {
      productObj.description = productObj.enrichment.description || productObj.description;
      productObj.shortDescription = productObj.enrichment.shortDescription || productObj.shortDescription;
    }

    // If fetched from storefront (activeWarehouseIds is present) and it's completely out of stock there
    let fulfillmentStatus = 'OUT_OF_STOCK';
    let isUnavailable = false;

    if (localRegionStock > 0) {
      fulfillmentStatus = 'IN_STOCK';
    } else if (totalStock > 0) {
      fulfillmentStatus = 'AVAILABLE_VIA_IMPORT';
    }
    isUnavailable = totalStock === 0;
    
    // We intentionally DO NOT return 404 here anymore so the storefront can render the product 
    // page but display the "Out of Stock" state gracefully instead of "Product Not Found".

    return NextResponse.json({ 
      ...productObj, 
      totalStock,
      localWarehouseStock: localRegionStock, // Maintain backwards compatibility for frontend
      isUnavailable,
      fulfillmentStatus,
      inventoryMap
    });
  } catch (error) {
    console.error('Fetch Product Detail Error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    const authResponse = await authorizeRoles('super_admin', 'admin', 'marketing_admin');
    if (authResponse) return authResponse;

    await connectToDatabase();
    const { id } = await params;
    const body = await req.json();

    // Extract variants so we can handle inventory mapping
    const rawVariants = body.variants || [];
    
    // Strip inventoryData before saving to Product model
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

    if (productPayload.status === 'published') {
      const productDoc = await Product.findById(id);
      if (productDoc && productDoc.countryDrafts?.length > 0) {
        productPayload.countryDrafts = [];
      }
    }

    const product = await Product.findByIdAndUpdate(id, productPayload, { new: true, runValidators: true });
    if (!product) {
      return NextResponse.json({ message: 'Product not found' }, { status: 404 });
    }

    // Inventory should NOT be mutated by the Admin UI.
    // Inventory is strictly managed by the WMS sync endpoints.
    // We intentionally leave the Inventory collection untouched during a product metadata update.

    return NextResponse.json({ message: 'Product updated successfully', product, success: true });
  } catch (error) {
    console.error('Update Product Error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const authResponse = await authorizeRoles('super_admin', 'admin', 'marketing_admin');
    if (authResponse) return authResponse;

    await connectToDatabase();
    const { id } = await params;

    const product = await Product.findById(id);
    if (!product) {
      return NextResponse.json({ message: 'Product not found' }, { status: 404 });
    }

    // Delete associated media files from local or cloud storage
    if (product.media && product.media.length > 0) {
      for (const m of product.media) {
        if (m.url) {
          if (m.url.startsWith('/uploads/')) {
            const filename = m.url.replace('/uploads/', '');
            const filePath = join(process.cwd(), "public", "uploads", filename);
            if (existsSync(filePath)) {
              await unlink(filePath).catch(err => console.error("Failed to delete local media:", err));
            }
          } else if (m.url.includes('blob.vercel-storage.com')) {
            await del(m.url).catch(err => console.error("Failed to delete Vercel Blob media:", err));
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
