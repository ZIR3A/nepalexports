import { NextResponse } from "next/server";
import { put, del } from "@vercel/blob";

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json({ error: "No files received." }, { status: 400 });
    }

    // Generate a unique filename to prevent collisions
    const filename = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;

    // Upload to Vercel Blob
    const blob = await put(filename, file, {
      access: 'public',
    });

    return NextResponse.json({ success: true, url: blob.url });
  } catch (error) {
    console.error("Vercel Blob Upload error:", error);
    return NextResponse.json({ error: "Failed to upload file to Vercel Blob." }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const body = await req.json();
    const { url } = body;
    
    if (!url) {
      return NextResponse.json({ error: "Invalid file URL." }, { status: 400 });
    }
    
    // Delete from Vercel Blob
    await del(url);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Vercel Blob Delete error:", error);
    return NextResponse.json({ error: "Failed to delete file from Vercel Blob." }, { status: 500 });
  }
}
