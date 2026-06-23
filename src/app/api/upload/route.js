import { NextResponse } from "next/server";
import { writeFile, mkdir, unlink } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json({ error: "No files received." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const filename = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
    
    // In production, you would upload this buffer to Vercel Blob, AWS S3, etc.
    // For local development, we save to the public/uploads directory
    const uploadDir = join(process.cwd(), "public", "uploads");
    
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    const filePath = join(uploadDir, filename);
    await writeFile(filePath, buffer);

    const fileUrl = `/uploads/${filename}`;

    return NextResponse.json({ success: true, url: fileUrl });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Failed to upload file." }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const body = await req.json();
    const { url } = body;
    
    if (!url || !url.startsWith('/uploads/')) {
      return NextResponse.json({ error: "Invalid file URL." }, { status: 400 });
    }
    
    const filename = url.replace('/uploads/', '');
    const filePath = join(process.cwd(), "public", "uploads", filename);
    
    if (existsSync(filePath)) {
      await unlink(filePath);
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete upload error:", error);
    return NextResponse.json({ error: "Failed to delete file." }, { status: 500 });
  }
}
