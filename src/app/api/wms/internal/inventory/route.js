import { NextResponse } from 'next/server';
import connectToDatabase from '@/backend/config/db';
import Product from '@/backend/models/Product';
import Inventory from '@/backend/models/Inventory';
import Category from '@/backend/models/Category';
import WmsAuditLog from '@/backend/models/WmsAuditLog';
import { authorizeRoles } from '@/backend/middleware/auth';

/**
 * GET /api/wms/internal/inventory
 * Unified Portal endpoint for Warehouse Managers to get all physical stock entries.
 */
export async function GET(req) {
  try {
    await connectToDatabase();

    const authResponse = await authorizeRoles('super_admin', 'admin', 'warehouse_manager');
    if (authResponse) return authResponse;

    // Fetch all inventory, populate product and warehouse to flatten it on the backend
    const allInventory = await Inventory.find({})
      .populate('product', 'name sku status')
      .populate('warehouse', 'name countryCode');

    const rows = allInventory
      .filter(inv => inv.product != null && inv.warehouse != null)
      .map(inv => ({
        id: inv._id.toString(),
        productId: inv.product?._id?.toString(),
        variantId: inv.variantId?.toString() || 'none',
        sku: inv.product?.sku || 'N/A', // If you have variant sku, you might need to extract it
        name: inv.product?.name || 'Unknown',
        warehouse: inv.warehouse?.name || 'Unknown',
        warehouseId: inv.warehouse?._id?.toString(),
        qty: inv.quantity || 0,
        reservedQty: inv.reservedQuantity || 0,
        status: inv.product?.status || 'Draft',
      }));

    return NextResponse.json(rows);
  } catch (error) {
    console.error('WMS Internal Inventory Fetch Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/wms/internal/inventory
 * Unified Portal endpoint for Warehouse Managers to adjust stock (+/-).
 */
export async function POST(req) {
  try {
    await connectToDatabase();

    const body = await req.json();
    const { sku, warehouseId, quantityChange, actionType, reason, userId, userRole } = body;

    if (!sku || !warehouseId || quantityChange === undefined || !actionType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const authResponse = await authorizeRoles('super_admin', 'admin', 'warehouse_manager');
    if (authResponse) return authResponse;

    const product = await Product.findOne({ sku });
    if (!product) {
      return NextResponse.json({ error: `Product not found for SKU: ${sku}` }, { status: 404 });
    }

    let variantId = product.variants[0]?._id;
    const matchedVariant = product.variants.find(v => v.sku === sku);
    if (matchedVariant) variantId = matchedVariant._id;

    if (!variantId) {
      return NextResponse.json({ error: 'Product has no variants' }, { status: 400 });
    }

    let inventory = await Inventory.findOne({
      product: product._id,
      variantId: variantId,
      warehouse: warehouseId
    });

    const numChange = Number(quantityChange);
    const finalQuantity = inventory ? inventory.quantity + numChange : numChange;

    if (finalQuantity < 0) {
      return NextResponse.json({ error: 'Insufficient stock for this deduction' }, { status: 400 });
    }

    if (inventory) {
      inventory.quantity = finalQuantity;
      await inventory.save();
    } else {
      inventory = await Inventory.create({
        product: product._id,
        variantId: variantId,
        warehouse: warehouseId,
        quantity: finalQuantity
      });
    }

    // Create Audit Log
    await WmsAuditLog.create({
      userId: userId || 'unknown_user',
      userRole: userRole || 'unknown_role',
      action: actionType, // 'add_stock' or 'remove_stock'
      sku,
      quantityChange: numChange,
      warehouseId: warehouseId,
      reason: reason || 'Manual adjustment',
    });

    return NextResponse.json({
      message: 'Inventory adjusted successfully',
      sku,
      newQuantity: finalQuantity
    });

  } catch (error) {
    console.error('WMS Internal Inventory Adjust Error:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}
