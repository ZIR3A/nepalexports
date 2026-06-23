import { NextResponse } from 'next/server';
import connectToDatabase from '@/backend/config/db';
import Category from '@/backend/models/Category';

export async function PUT(req, { params }) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const body = await req.json();

    const category = await Category.findByIdAndUpdate(id, body, { new: true, runValidators: true });
    if (!category) {
      return NextResponse.json({ message: 'Category not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Category updated successfully', category, success: true });
  } catch (error) {
    console.error('Update Category Error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    await connectToDatabase();
    const { id } = await params;

    const category = await Category.findById(id);
    if (!category) {
      return NextResponse.json({ message: 'Category not found' }, { status: 404 });
    }

    // Safety Check: Check if any subcategories depend on this category
    const subCategories = await Category.find({ parentCategory: id });
    if (subCategories.length > 0) {
      return NextResponse.json(
        { message: 'Cannot delete a category that still has subcategories. Please reassign or delete the subcategories first.', success: false },
        { status: 400 }
      );
    }

    await Category.findByIdAndDelete(id);

    return NextResponse.json({ message: 'Category deleted successfully', success: true });
  } catch (error) {
    console.error('Delete Category Error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
