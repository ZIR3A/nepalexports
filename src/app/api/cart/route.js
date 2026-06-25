import { NextResponse } from 'next/server';
import connectToDatabase from '@/backend/config/db';
import User from '@/backend/models/User';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';

export async function GET(req) {
  try {
    await connectToDatabase();
    
    // 1. Verify session
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await User.findById(session.user.id).select('cart');
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user.cart || []);
  } catch (error) {
    console.error("GET Cart Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    await connectToDatabase();
    
    // 1. Verify session
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const cart = await req.json();

    if (!Array.isArray(cart)) {
      return NextResponse.json({ error: "Invalid cart format" }, { status: 400 });
    }

    const user = await User.findByIdAndUpdate(
      session.user.id,
      { cart },
      { new: true, runValidators: true }
    );

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, cart: user.cart });
  } catch (error) {
    console.error("PUT Cart Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    await connectToDatabase();
    
    // 1. Verify session
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id, color, size } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Explicitly pull the matching variant from the cart array
    const user = await User.findByIdAndUpdate(
      session.user.id,
      { 
        $pull: { 
          cart: { 
            id: id,
            selectedColor: color,
            selectedSize: size
          } 
        } 
      },
      { new: true }
    );

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, cart: user.cart });
  } catch (error) {
    console.error("DELETE Cart Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
