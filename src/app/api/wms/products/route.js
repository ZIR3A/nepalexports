import { NextResponse } from 'next/server';
import connectToDatabase from '@/backend/config/db';
import Product from '@/backend/models/Product';
import Inventory from '@/backend/models/Inventory';
import { validateWmsApiKey, resolveWarehouse } from '@/backend/services/wmsService';
import slugify from 'slugify';

/**
 * POST /api/wms/products
 * WMS Webhook for creating a new product draft in the E-commerce system.
 */
export async function POST(req) {
  try {
    if (!validateWmsApiKey(req)) {
      return NextResponse.json({ error: 'Unauthorized: Invalid API Key' }, { status: 401 });
    }

    await connectToDatabase();
    
    const body = await req.json();
    const { sku, name, quantity, weight, dimensions, warehouseCode, wmsProductId, basePrice, category } = body;

    if (!sku || !name || !warehouseCode) {
      return NextResponse.json({ error: 'Missing required fields: sku, name, warehouseCode' }, { status: 400 });
    }

    const warehouse = await resolveWarehouse(warehouseCode);
    if (!warehouse) {
      return NextResponse.json({ error: `Warehouse not found for code: ${warehouseCode}` }, { status: 404 });
    }

    // Check if product already exists
    const existingProduct = await Product.findOne({ sku });
    if (existingProduct) {
      return NextResponse.json({ error: `Product with SKU ${sku} already exists` }, { status: 409 });
    }

    // Create a product draft
    const slug = slugify(`${name}-${sku}`, { lower: true, strict: true });
    
    // We need a dummy mainCategory for schema validation since it's required
    // In a real app, you might look up a default category or require it from WMS
    // Here we'll skip creating the ref and assume the model can save it or it's handled in enrichment.
    // For now, let's omit mainCategory and see if schema validation complains. If so, we'd need to fetch a default one.
    // Wait, mainCategory is required in the schema. Let's find any category or create an "Uncategorized" one.
    const mongoose = require('mongoose');
    const Category = mongoose.model('Category');
    let defaultCategory = await Category.findOne({ name: /Uncategorized/i });
    if (!defaultCategory) {
      defaultCategory = await Category.findOne(); // just get any
    }
    
    if (!defaultCategory) {
       return NextResponse.json({ error: 'No categories found in DB. Please create a category first.' }, { status: 400 });
    }

    const product = new Product({
      name,
      sku,
      slug,
      description: 'Pending marketing enrichment',
      mainCategory: defaultCategory._id,
      basePrice: basePrice || 0,
      status: 'wms_draft',
      wmsData: {
        originalSku: sku,
        weight,
        dimensions,
        wmsProductId,
        sourceWarehouse: warehouse._id,
        receivedAt: new Date()
      },
      // Generate a default variant to hold the inventory
      variants: [{
        sku: sku,
        color: 'N/A',
        size: 'One Size',
      }],
      isActive: false // Keep inactive until enriched
    });

    await product.save();

    // Create initial inventory
    if (quantity > 0) {
      await Inventory.create({
        product: product._id,
        variantId: product.variants[0]._id,
        warehouse: warehouse._id,
        quantity: quantity
      });
    }

    return NextResponse.json({
      message: 'Product draft created successfully',
      productId: product._id,
      status: product.status
    }, { status: 201 });

  } catch (error) {
    console.error('WMS Product Create Error:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}
