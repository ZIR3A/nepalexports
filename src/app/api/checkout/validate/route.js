import { NextResponse } from 'next/server';
import connectToDatabase from '@/backend/config/db';
import Product from '@/backend/models/Product';
import Warehouse from '@/backend/models/Warehouse';
import Inventory from '@/backend/models/Inventory';
import RegionSettings from '@/backend/models/RegionSettings';

export async function POST(req) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { items, country } = body;

    if (!items || !items.length) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    // 1. Fetch Region Settings
    const region = await RegionSettings.findOne({ countryCode: country, isActive: true });
    if (!region) {
      return NextResponse.json({ error: "Shopping region is not currently supported or inactive." }, { status: 400 });
    }

    const currency = region.currency;
    const taxRate = region.taxRate || 0;

    // 2. Fetch warehouses
    const regionalWarehouses = await Warehouse.find({ countryCode: country, status: 'Active' });
    const allWarehouses = await Warehouse.find({ status: 'Active' });
    
    if (!regionalWarehouses || regionalWarehouses.length === 0) {
      return NextResponse.json({ error: "No active warehouses found for this region." }, { status: 400 });
    }

    const regionalWIds = regionalWarehouses.map(w => String(w._id));
    const allWIds = allWarehouses.map(w => String(w._id));

    // 3. Process inventory for all items in the cart
    let subtotal = 0;
    let totalImportFees = 0;
    const validatedItems = [];
    const reservationsToApply = [];
    const usedWarehouseIds = new Set();
    const now = new Date();

    for (const item of items) {
      const product = await Product.findById(item.id);
      if (!product) {
        return NextResponse.json({ error: "Stock validation failed", details: [`${item.name} is no longer available.`] }, { status: 400 });
      }

      const variant = product.variants?.find(v => {
        if (item.productType === 'food' || (product.category || '').toLowerCase() === 'food') {
          const flavor = v.attributes?.get ? v.attributes.get('flavor') : v.attributes?.flavor;
          const weight = v.attributes?.get ? v.attributes.get('weight') : v.attributes?.weight;
          const packSize = v.attributes?.get ? v.attributes.get('packSize') : v.attributes?.packSize;
          const matchFlavor = flavor === item.selectedColor || flavor === 'N/A' || !flavor;
          const matchWeight = weight === item.selectedSize || packSize === item.selectedSize || weight === 'N/A' || !weight;
          return matchFlavor && matchWeight;
        }
        const size = v.attributes?.get ? v.attributes.get('size') : v.attributes?.size;
        const color = v.attributes?.get ? v.attributes.get('color') : v.attributes?.color;
        return (size === item.selectedSize || size === 'N/A') && (color === item.selectedColor || color === 'N/A');
      });
      if (!variant) {
        return NextResponse.json({ error: "Stock validation failed", details: [`Variant for ${item.name} is invalid.`] }, { status: 400 });
      }

      let requiredQty = item.quantity;
      let isImportedItem = false;
      let fulfilled = false;

      // 3a. Try local regional warehouses first
      const localInventories = await Inventory.find({ product: product._id, variantId: variant._id, warehouse: { $in: regionalWIds } });
      
      // Sort local inventories by available quantity descending (fulfill from "most stock" warehouse first)
      localInventories.sort((a, b) => (b.quantity - (b.reservedQuantity || 0)) - (a.quantity - (a.reservedQuantity || 0)));

      for (const inv of localInventories) {
        if (fulfilled) break;
        const available = inv.quantity - (inv.reservedQuantity || 0);
        if (available >= requiredQty) {
          reservationsToApply.push({ invId: inv._id, amount: requiredQty });
          usedWarehouseIds.add(String(inv.warehouse));
          fulfilled = true;
        }
      }

      // 3b. If still not fulfilled, and product allows import, check global warehouses
      if (!fulfilled && product.allowImport && item.fulfillmentStatus === 'AVAILABLE_VIA_IMPORT') {
        const globalInventories = await Inventory.find({ product: product._id, variantId: variant._id, warehouse: { $in: allWIds, $nin: regionalWIds } });
        
        // Sort global inventories by available quantity descending
        globalInventories.sort((a, b) => (b.quantity - (b.reservedQuantity || 0)) - (a.quantity - (a.reservedQuantity || 0)));

        for (const inv of globalInventories) {
          if (fulfilled) break;
          const available = inv.quantity - (inv.reservedQuantity || 0);
          if (available >= requiredQty) {
            reservationsToApply.push({ invId: inv._id, amount: requiredQty });
            usedWarehouseIds.add(String(inv.warehouse));
            isImportedItem = true;
            fulfilled = true;
          }
        }
      }

      // 3c. If we couldn't fulfill the entire quantity from a single warehouse
      if (!fulfilled) {
        return NextResponse.json({ 
          error: "Stock validation failed", 
          details: [`Not enough stock available for ${item.name} (${item.selectedColor}, ${item.selectedSize}).`] 
        }, { status: 400 });
      }

      // 3d. Flat Import Surcharge (once per item type)
      if (isImportedItem && product.importSurcharge > 0) {
        totalImportFees += product.importSurcharge;
      }

      // Determine price
      let basePrice = product.basePrice;
      let salePrice = product.basePrice;

      // Check regional pricing overrides
      const regionalPricing = product.pricing?.find(p => p.country === country && p.isActive);
      if (regionalPricing) {
        basePrice = regionalPricing.basePrice;
        salePrice = regionalPricing.salePrice || regionalPricing.basePrice;
      }

      // Flash sale overrides everything if active
      if (product.flashSale?.isActive && product.flashSale?.expiresAt > now) {
        salePrice = product.flashSale.price;
        basePrice = product.basePrice; // Ensure basePrice is set so cross-out shows
      }

      subtotal += salePrice * item.quantity;

      validatedItems.push({
        ...item,
        price: salePrice,
        originalPrice: basePrice,
        fulfillmentStatus: isImportedItem ? 'AVAILABLE_VIA_IMPORT' : 'IN_STOCK',
      });
    }

    // 4. Do not apply reservations during validation!
    // Reservations should only be applied when the order is successfully placed in the main checkout endpoint.

    // 5. Shipping Rules
    // Simple mock logic for regional shipping. In real app, calculate based on weight/rules
    let shippingCost = 0;
    if (country === 'NP') {
      shippingCost = subtotal > 5000 ? 0 : 200; // Free over 5000 NPR
    } else if (country === 'GB') {
      shippingCost = subtotal > 80 ? 0 : 5.99; // Free over £80
    } else if (country === 'US') {
      shippingCost = subtotal > 100 ? 0 : 10;
    }

    const taxAmount = subtotal * (taxRate / 100);
    const total = subtotal + shippingCost + taxAmount + totalImportFees;

    return NextResponse.json({
      currency,
      subtotal,
      shippingCost,
      taxRate,
      taxAmount,
      importFees: totalImportFees,
      total,
      items: validatedItems,
      warehouseIds: Array.from(usedWarehouseIds),
    }, { status: 200 });

  } catch (error) {
    console.error("Checkout validation error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
