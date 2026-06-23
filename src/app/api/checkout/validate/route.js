import { NextResponse } from 'next/server';
import connectToDatabase from '@/backend/config/db';
import Product from '@/backend/models/Product';
import Warehouse from '@/backend/models/Warehouse';
import Inventory from '@/backend/models/Inventory';

export async function POST(req) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { items, country } = body;

    if (!items || !items.length) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    // Determine the warehouse based on country
    const isNepal = country === 'NP';
    const warehouseName = isNepal ? 'Nepal Warehouse' : 'UK Warehouse';
    const warehouse = await Warehouse.findOne({ name: warehouseName });

    if (!warehouse) {
      return NextResponse.json({ error: "Warehouse configuration error" }, { status: 500 });
    }

    // Currency and Tax Rules
    const currency = isNepal ? 'NPR' : 'GBP';
    // Exchange rate: 1 GBP = ~170 NPR (mock)
    const conversionRate = isNepal ? 170 : 1;
    const taxRate = isNepal ? 0.13 : 0.20; // 13% VAT for Nepal, 20% for UK/EU

    let subtotal = 0;
    const validatedItems = [];
    const stockErrors = [];
    const now = new Date();

    // Verify stock and price for each item
    for (const item of items) {
      const product = await Product.findById(item.id);
      if (!product) {
        stockErrors.push(`${item.name} is no longer available.`);
        continue;
      }

      // Find the specific variant the user selected
      const variant = product.variants?.find(v => v.attributes?.color === item.selectedColor && v.attributes?.size === item.selectedSize);
      if (!variant) {
        stockErrors.push(`Variant for ${item.name} (${item.selectedSize}, ${item.selectedColor}) is invalid.`);
        continue;
      }

      // We prioritize inventory in userCountry. If userCountry has enough stock, we reserve there.
      // Otherwise we reserve in Transit, or Nepal (import).
      const inventoryRecords = await Inventory.find({ product: item.id, variantId: variant._id }).populate('warehouse');
      
      let requiredQty = item.quantity;
      
      // Sort warehouses by priority: userCountry > Transit > Others
      inventoryRecords.sort((a, b) => {
        const aCode = (a.warehouse?.country === 'United Kingdom' || a.warehouse?.name?.includes('UK')) ? 'GB' : (a.warehouse?.country === 'Nepal' || a.warehouse?.name?.includes('Nepal')) ? 'NP' : '';
        const bCode = (b.warehouse?.country === 'United Kingdom' || b.warehouse?.name?.includes('UK')) ? 'GB' : (b.warehouse?.country === 'Nepal' || b.warehouse?.name?.includes('Nepal')) ? 'NP' : '';
        
        if (aCode === country) return -1;
        if (bCode === country) return 1;
        if (a.warehouse?.name?.toLowerCase().includes('transit')) return -1;
        if (b.warehouse?.name?.toLowerCase().includes('transit')) return 1;
        return 0;
      });

      let reservedForThisItem = 0;
      const reservationsForItem = [];

      for (const inv of inventoryRecords) {
        if (requiredQty === 0) break;
        
        const available = inv.quantity - (inv.reservedQuantity || 0);
        if (available > 0) {
          const reserveAmt = Math.min(available, requiredQty);
          reservationsForItem.push({ invId: inv._id, amount: reserveAmt });
          requiredQty -= reserveAmt;
          reservedForThisItem += reserveAmt;
        }
      }

      if (requiredQty > 0) {
        stockErrors.push(`Only ${reservedForThisItem} items left in stock for ${item.name}.`);
      } else {
        // We will apply reservations if everything is successful
        item.reservations = reservationsForItem;
      }

      // Determine the active price (checking for flash sale)
      let activeBasePrice = product.basePrice;
      if (product.flashSale?.isActive && product.flashSale?.expiresAt > now) {
        activeBasePrice = product.flashSale.price;
      }

      // Calculate price
      const basePriceInLocalCurrency = activeBasePrice * conversionRate;
      subtotal += basePriceInLocalCurrency * item.quantity;

      validatedItems.push({
        ...item,
        price: basePriceInLocalCurrency,
        originalPrice: product.basePrice * conversionRate,
      });
    }

    if (stockErrors.length > 0) {
      return NextResponse.json({ error: "Stock validation failed", details: stockErrors }, { status: 400 });
    }

    // Apply Reservations
    for (const item of validatedItems) {
      if (item.reservations) {
        for (const res of item.reservations) {
          await Inventory.findByIdAndUpdate(res.invId, {
            $inc: { reservedQuantity: res.amount }
          });
        }
        delete item.reservations; // clean up payload
      }
    }

    // Shipping Rules
    let shippingCost = 0;
    if (isNepal) {
      shippingCost = subtotal > 5000 ? 0 : 200; // Free over 5000 NPR, else 200 NPR
    } else {
      shippingCost = subtotal > 80 ? 0 : 5.99; // Free over £80, else £5.99
    }

    const taxAmount = subtotal * taxRate;
    const total = subtotal + shippingCost + taxAmount;

    return NextResponse.json({
      currency,
      subtotal,
      shippingCost,
      taxRate,
      taxAmount,
      total,
      items: validatedItems,
      warehouseId: warehouse._id,
    }, { status: 200 });

  } catch (error) {
    console.error("Checkout validation error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
