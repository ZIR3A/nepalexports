import { NextResponse } from 'next/server';
import connectToDatabase from '@/backend/config/db';
import Category from '@/backend/models/Category';

export async function GET(req) {
  try {
    await connectToDatabase();
    
    // Fetch all categories
    const categories = await Category.find({}).sort({ name: 1 });
    
    // Organize into a hierarchy (Main Categories and their subcategories)
    const categoryMap = {};
    const mainCategories = [];

    // Initialize all categories in the map
    categories.forEach(cat => {
      categoryMap[cat._id.toString()] = { ...cat.toObject(), subCategories: [] };
    });

    // Build the tree
    categories.forEach(cat => {
      if (cat.parentCategory) {
        if (categoryMap[cat.parentCategory.toString()]) {
          categoryMap[cat.parentCategory.toString()].subCategories.push(categoryMap[cat._id.toString()]);
        }
      } else {
        mainCategories.push(categoryMap[cat._id.toString()]);
      }
    });

    return NextResponse.json(mainCategories);
  } catch (error) {
    console.error('Fetch Categories Error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const category = await Category.create(body);
    return NextResponse.json({ message: 'Category created', category }, { status: 201 });
  } catch (error) {
    console.error('Create Category Error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
