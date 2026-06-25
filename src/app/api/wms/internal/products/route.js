import { NextResponse } from 'next/server';
import connectToDatabase from '@/backend/config/db';
import Product from '@/backend/models/Product';
import Inventory from '@/backend/models/Inventory';
import WmsAuditLog from '@/backend/models/WmsAuditLog';
import AdminAlert from '@/backend/models/AdminAlert';
import Category from '@/backend/models/Category';
import slugify from 'slugify';
import mongoose from 'mongoose';

/**
 * POST /api/wms/internal/products
 * Unified Portal endpoint for Warehouse Managers to log completely new physical items.
 */
export async function POST(req) {
  try {
    await connectToDatabase();
    
    // In MVP, we read the simulated user details from headers or body
    const body = await req.json();
    const { sku, name, quantity, weight, warehouseId, userId, userRole, isFoodItem, batchNumber, expiryDate, storageConditions, shelfLife } = body;

    if (!sku || !name || !warehouseId || quantity === undefined) {
      return NextResponse.json({ error: 'Missing required fields: sku, name, warehouseId, quantity' }, { status: 400 });
    }

    if (userRole !== 'warehouse_manager' && userRole !== 'super_admin') {
      return NextResponse.json({ error: 'Unauthorized: Only warehouse staff can log new physical items.' }, { status: 403 });
    }

    // Check if product already exists
    const existingProduct = await Product.findOne({ sku });
    if (existingProduct) {
      return NextResponse.json({ error: `Product with SKU ${sku} already exists` }, { status: 409 });
    }

    const slug = slugify(`${name}-${sku}`, { lower: true, strict: true });
    
    let defaultCategory = await Category.findOne({ name: /Uncategorized/i });
    if (!defaultCategory) {
      defaultCategory = await Category.findOne(); 
    }

    const product = new Product({
      name,
      sku,
      slug,
      description: 'Pending marketing enrichment',
      mainCategory: defaultCategory?._id,
      basePrice: 0,
      status: 'wms_draft', // Enters the Enrichment pipeline here
      wmsData: {
        originalSku: sku,
        weight,
        sourceWarehouse: warehouseId,
        receivedAt: new Date()
      },
      logisticsAttributes: isFoodItem ? {
        storageConditions: storageConditions || 'Room Temperature',
        shelfLife: shelfLife || '',
        certifications: []
      } : undefined,
      variants: [{
        sku: sku,
        color: 'N/A',
        size: 'One Size',
      }],
      isActive: false
    });

    await product.save();

    // Create initial inventory
    if (quantity > 0) {
      await Inventory.create({
        product: product._id,
        variantId: product.variants[0]._id,
        warehouse: warehouseId,
        quantity: quantity
      });

      // If food, create Batch
      if (isFoodItem && batchNumber) {
        // We must dynamically import Batch inside the route or at the top.
        // It's already imported at the top? Wait, I didn't import Batch at the top of route.js.
        // I will just use mongoose.models.Batch or require it here.
        const Batch = mongoose.models.Batch || (await import('@/backend/models/Batch')).default;
        await Batch.create({
          product: product._id,
          variantId: product.variants[0]._id,
          warehouse: warehouseId,
          batchNumber: batchNumber,
          expiryDate: expiryDate ? new Date(expiryDate) : undefined,
          quantity: quantity
        });
      }
    }

    // Create Audit Log
    await WmsAuditLog.create({
      userId: userId || 'unknown_user',
      userRole: userRole || 'unknown_role',
      action: 'log_new_item',
      sku,
      quantityChange: quantity,
      warehouseId: warehouseId,
      reason: 'Initial intake of new physical SKU',
    });

    // Create Admin Alert for Marketing Team
    await AdminAlert.create({
      type: 'wms_product_received',
      severity: 'info',
      title: 'New WMS Draft Needs Enrichment',
      message: `A new physical item (${sku}) was logged and requires marketing enrichment.`,
      metadata: { productId: product._id, sku, warehouseId },
    });

    // Mock Email Automation
    console.log(`[EMAIL MOCK] To: marketing@store.com`);
    console.log(`[EMAIL MOCK] Subject: New WMS Draft Alert - SKU: ${sku}`);
    console.log(`[EMAIL MOCK] Body: Warehouse staff just logged a new physical item. Please click here to enrich it: https://admin.store.com/inventory?tab=drafts&highlight=${product._id}`);

    return NextResponse.json({
      message: 'Physical item logged. Draft created for Marketing Enrichment.',
      productId: product._id,
      status: product.status
    }, { status: 201 });

  } catch (error) {
    console.error('WMS Internal Log New Item Error:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}
