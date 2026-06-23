import { NextResponse } from 'next/server';
import connectToDatabase from '@/backend/config/db';
import Product from '@/backend/models/Product';
import Warehouse from '@/backend/models/Warehouse';
import Batch from '@/backend/models/Batch';

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

      const variant = product.variants.find(v => 
        (v.size === item.selectedSize || v.size === 'N/A') && 
        (v.color === item.selectedColor || v.color === 'N/A')
      );

      if (!variant) {
        stockErrors.push(`Variant for ${item.name} (${item.selectedSize}, ${item.selectedColor}) is invalid.`);
        continue;
      }

      // Check stock in warehouse across non-expired batches
      const validBatches = await Batch.find({
        product: product._id,
        variantId: variant._id,
        warehouse: warehouse._id,
        $or: [
          { expiryDate: { $gt: now } },
          { expiryDate: { $exists: false } },
          { expiryDate: null }
        ],
        quantity: { $gt: 0 }
      });

      const availableQuantity = validBatches.reduce((sum, batch) => sum + batch.quantity, 0);

      if (availableQuantity < item.quantity) {
        stockErrors.push(`Only ${availableQuantity} non-expired items left in stock for ${item.name} in your region.`);
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
