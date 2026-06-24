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

export async function GET(req, { params }) {
  try {
    await connectToDatabase();
    
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const warehouseId = searchParams.get('warehouseId');

    const product = await Product.findById(id).populate('mainCategory').populate('subCategory');
    if (!product) {
      return NextResponse.json({ message: 'Product not found' }, { status: 404 });
    }

    // Fetch inventory for all variants across all warehouses
    const inventory = await Inventory.find({ product: id }).populate('warehouse');
    
    // Aggregate total stock simply
    let totalStock = 0;
    let localWarehouseStock = 0;
    const inventoryMap = {};

    inventory.forEach(inv => {
      totalStock += inv.quantity;
      const vid = String(inv.variantId);
      if (!inventoryMap[vid]) {
        inventoryMap[vid] = { total: 0, byCountry: { NP: 0, GB: 0, Transit: 0 }, byWarehouse: {} };
      }
      inventoryMap[vid].total += inv.quantity;
      
      // Per-warehouse mapping (for admin edit form)
      const whId = String(inv.warehouse?._id);
      inventoryMap[vid].byWarehouse[whId] = (inventoryMap[vid].byWarehouse[whId] || 0) + inv.quantity;
      
      // Track stock in the user's specific warehouse
      if (warehouseId && whId === warehouseId) {
        localWarehouseStock += inv.quantity;
      }

      const whName = inv.warehouse?.name?.toLowerCase() || '';
      const whCountry = inv.warehouse?.country || '';

      if (whName.includes('transit')) {
        inventoryMap[vid].byCountry.Transit += inv.quantity;
      } else if (whCountry === 'Nepal' || whName.includes('nepal')) {
        inventoryMap[vid].byCountry.NP += inv.quantity;
      } else if (whCountry === 'United Kingdom' || whName.includes('uk')) {
        inventoryMap[vid].byCountry.GB += inv.quantity;
      }
    });

    // Convert product to plain object — toJSON flattens Mongoose Maps (including nested variant.attributes)
    const productObj = product.toJSON();

    return NextResponse.json({ 
      ...productObj, 
      totalStock,
      localWarehouseStock,
      isUnavailable: warehouseId ? localWarehouseStock === 0 : false,
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

    if (productPayload.status === 'published') {
      const productDoc = await Product.findById(id);
      if (productDoc && productDoc.countryDrafts?.length > 0) {
        const newCountries = [...new Set([...(productDoc.availableCountries || []), ...productDoc.countryDrafts])];
        productPayload.availableCountries = newCountries;
        productPayload.countryDrafts = [];
      }
    }

    const product = await Product.findByIdAndUpdate(id, productPayload, { new: true, runValidators: true });
    if (!product) {
      return NextResponse.json({ message: 'Product not found' }, { status: 404 });
    }

    // Map the inventoryData to the new Inventory collection
    // First, optionally clear existing inventory for this product if we are completely resetting it?
    // Or just update/create based on the new payload. For simplicity, we can remove old inventory and recreate
    await Inventory.deleteMany({ product: id });
    
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
