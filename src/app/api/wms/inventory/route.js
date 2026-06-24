import { NextResponse } from 'next/server';
import connectToDatabase from '@/backend/config/db';
import Product from '@/backend/models/Product';
import Inventory from '@/backend/models/Inventory';
import { validateWmsApiKey, resolveWarehouse, createAdminAlert } from '@/backend/services/wmsService';

/**
 * POST /api/wms/inventory
 * WMS Webhook for live inventory updates.
 */
export async function POST(req) {
  try {
    if (!validateWmsApiKey(req)) {
      return NextResponse.json({ error: 'Unauthorized: Invalid API Key' }, { status: 401 });
    }

    await connectToDatabase();
    
    const body = await req.json();
    const { sku, warehouseCode, newQuantity, reason } = body;

    if (!sku || !warehouseCode || newQuantity === undefined) {
      return NextResponse.json({ error: 'Missing required fields: sku, warehouseCode, newQuantity' }, { status: 400 });
    }

    const warehouse = await resolveWarehouse(warehouseCode);
    if (!warehouse) {
      return NextResponse.json({ error: `Warehouse not found for code: ${warehouseCode}` }, { status: 404 });
    }

    const product = await Product.findOne({ sku });
    if (!product) {
      return NextResponse.json({ error: `Product not found for SKU: ${sku}` }, { status: 404 });
    }

    // Find the variant. If there's only one, use it. Otherwise, assume the SKU belongs to the first variant or matches a variant SKU.
    let variantId = product.variants[0]?._id;
    const matchedVariant = product.variants.find(v => v.sku === sku);
    if (matchedVariant) {
      variantId = matchedVariant._id;
    }

    if (!variantId) {
      return NextResponse.json({ error: 'Product has no variants' }, { status: 400 });
    }

    // Find existing inventory or create new
    let inventory = await Inventory.findOne({
      product: product._id,
      variantId: variantId,
      warehouse: warehouse._id
    });

    const oldQuantity = inventory ? inventory.quantity : 0;

    if (inventory) {
      inventory.quantity = newQuantity;
      await inventory.save();
    } else {
      inventory = await Inventory.create({
        product: product._id,
        variantId: variantId,
        warehouse: warehouse._id,
        quantity: newQuantity
      });
    }

    // Check for significant swings or 0 stock to trigger an alert
    if (newQuantity === 0 && oldQuantity > 0) {
      await createAdminAlert({
        type: 'low_stock',
        severity: 'warning',
        title: `Product Out of Stock: ${product.name}`,
        message: `Stock reached 0 in ${warehouse.name} for SKU ${sku}. Reason: ${reason || 'Update from WMS'}.`,
        metadata: { productId: product._id, sku, warehouseId: warehouse._id }
      });
    } else if (Math.abs(newQuantity - oldQuantity) > 50) {
      await createAdminAlert({
        type: 'stock_discrepancy',
        severity: 'info',
        title: `Large Stock Adjustment: ${product.name}`,
        message: `Stock adjusted by ${newQuantity - oldQuantity} units in ${warehouse.name} for SKU ${sku}.`,
        metadata: { productId: product._id, sku, warehouseId: warehouse._id, oldQuantity, newQuantity, reason }
      });
    }

    return NextResponse.json({
      message: 'Inventory updated successfully',
      sku,
      warehouseCode,
      quantity: newQuantity
    });

  } catch (error) {
    console.error('WMS Inventory Update Error:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}
