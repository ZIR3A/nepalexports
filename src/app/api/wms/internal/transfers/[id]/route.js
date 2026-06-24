import { NextResponse } from 'next/server';
import connectToDatabase from '@/backend/config/db';
import Transfer from '@/backend/models/Transfer';
import Inventory from '@/backend/models/Inventory';
import WmsAuditLog from '@/backend/models/WmsAuditLog';
import FreightClaim from '@/backend/models/FreightClaim';
import Product from '@/backend/models/Product';
import Warehouse from '@/backend/models/Warehouse';
import { withActivityTracker } from '@/backend/middleware/activityTracker';

export const PUT = withActivityTracker(async (req, { params }) => {
  try {
    await connectToDatabase();
    const { id } = await params;
    const { status, cargoTrackingNumber, actualQuantities } = await req.json();

    const transfer = await Transfer.findById(id).populate('destinationWarehouse');
    if (!transfer) {
      return NextResponse.json({ error: "Transfer not found" }, { status: 404 });
    }

    if (transfer.status === 'Received') {
      return NextResponse.json({ error: "Transfer is already received and cannot be modified." }, { status: 400 });
    }

    transfer.status = status || transfer.status;
    transfer.cargoTrackingNumber = cargoTrackingNumber || transfer.cargoTrackingNumber;

    // If status is updated to 'Received', process partial receipts and add stock
    if (status === 'Received') {
      for (const item of transfer.items) {
        // Use actual quantity if provided, otherwise default to expected
        const itemId = item._id ? item._id.toString() : item.product.toString();
        const intactQuantity = actualQuantities && actualQuantities[itemId] !== undefined 
          ? Number(actualQuantities[itemId]) 
          : item.quantity;
        
        const lostQuantity = item.quantity - intactQuantity;

        if (intactQuantity > 0) {
          // Find existing inventory record at destination or create a new one
          let inventory = await Inventory.findOne({
            product: item.product,
            variantId: item.variantId,
            warehouse: transfer.destinationWarehouse._id
          });

          if (inventory) {
            inventory.quantity += intactQuantity;
            await inventory.save();
          } else {
            await Inventory.create({
              product: item.product,
              variantId: item.variantId,
              warehouse: transfer.destinationWarehouse._id,
              quantity: intactQuantity
            });
          }

          await WmsAuditLog.create({
            userId: 'system_admin',
            userRole: 'super_admin',
            action: 'transfer_received',
            sku: 'multiple', 
            quantityChange: intactQuantity,
            warehouseId: transfer.destinationWarehouse._id,
            reason: `Cargo received from transfer ${transfer.transferReference}`
          });
        }

        if (lostQuantity > 0) {
          await FreightClaim.create({
            transfer: transfer._id,
            transferReference: transfer.transferReference,
            cargoTrackingNumber: transfer.cargoTrackingNumber,
            product: item.product,
            variantId: item.variantId,
            missingQuantity: lostQuantity,
            status: 'Pending'
          });

          await WmsAuditLog.create({
            userId: 'system_admin',
            userRole: 'super_admin',
            action: 'cargo_loss',
            sku: 'multiple', 
            quantityChange: lostQuantity,
            warehouseId: transfer.destinationWarehouse._id,
            reason: `Lost cargo reported during transfer receipt ${transfer.transferReference}`
          });
        }

        // Storefront Publishing Logic (Scenario A vs B)
        const product = await Product.findById(item.product);
        if (product && transfer.destinationWarehouse?.countryCode) {
          const destCode = transfer.destinationWarehouse.countryCode;
          // Check if this country is already available
          if (!product.availableCountries?.includes(destCode)) {
            // Check if it's already in drafts to avoid duplicates
            if (!product.countryDrafts?.includes(destCode)) {
              product.countryDrafts = product.countryDrafts || [];
              product.countryDrafts.push(destCode);
              await product.save();
            }
          }
        }
      }
    }

    await transfer.save();

    return NextResponse.json({ success: true, transfer });

  } catch (error) {
    console.error("Update Transfer Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}, 'update_transfer_milestone');
