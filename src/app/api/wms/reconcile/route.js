import { NextResponse } from 'next/server';
import connectToDatabase from '@/backend/config/db';
import Inventory from '@/backend/models/Inventory';
import Product from '@/backend/models/Product';
import { validateWmsApiKey, resolveWarehouse, createAdminAlert } from '@/backend/services/wmsService';

/**
 * POST /api/wms/reconcile
 * On-demand endpoint to reconcile WMS inventory against the E-commerce database.
 */
export async function POST(req) {
  try {
    if (!validateWmsApiKey(req)) {
      return NextResponse.json({ error: 'Unauthorized: Invalid API Key' }, { status: 401 });
    }

    await connectToDatabase();
    
    const body = await req.json();
    const { items } = body; // Array of { sku, warehouseCode, wmsQuantity }

    if (!Array.isArray(items)) {
      return NextResponse.json({ error: 'Expected items array' }, { status: 400 });
    }

    const discrepancies = [];
    const updates = [];

    // Process each item
    for (const item of items) {
      const { sku, warehouseCode, wmsQuantity } = item;
      
      try {
        const warehouse = await resolveWarehouse(warehouseCode);
        if (!warehouse) continue;

        const product = await Product.findOne({ sku });
        if (!product) continue;

        let variantId = product.variants[0]?._id;
        const matchedVariant = product.variants.find(v => v.sku === sku);
        if (matchedVariant) {
          variantId = matchedVariant._id;
        }

        let inventory = await Inventory.findOne({
          product: product._id,
          variantId: variantId,
          warehouse: warehouse._id
        });

        const ecomQuantity = inventory ? inventory.quantity : 0;

        if (ecomQuantity !== wmsQuantity) {
          discrepancies.push({
            sku,
            productName: product.name,
            warehouseName: warehouse.name,
            ecomQuantity,
            wmsQuantity
          });

          // Force update E-commerce to match WMS
          if (inventory) {
            inventory.quantity = wmsQuantity;
            updates.push(inventory.save());
          } else {
            updates.push(Inventory.create({
              product: product._id,
              variantId: variantId,
              warehouse: warehouse._id,
              quantity: wmsQuantity
            }));
          }
        }
      } catch (err) {
        console.error(`Reconciliation error for SKU ${sku}:`, err);
      }
    }

    await Promise.all(updates);

    if (discrepancies.length > 0) {
      await createAdminAlert({
        type: 'stock_discrepancy',
        severity: 'warning',
        title: `Inventory Reconciliation: ${discrepancies.length} Discrepancies Found`,
        message: 'The scheduled reconciliation job found discrepancies between WMS and the e-commerce database. Stock levels have been force-synced to match WMS.',
        metadata: { discrepancies }
      });
    }

    return NextResponse.json({
      message: 'Reconciliation complete',
      itemsProcessed: items.length,
      discrepanciesFound: discrepancies.length,
      discrepancies
    });

  } catch (error) {
    console.error('WMS Reconcile Error:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}
