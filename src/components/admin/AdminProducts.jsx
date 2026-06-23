import { useState, useRef } from "react";
import { Upload, Plus, Image as ImageIcon, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminProducts() {
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        setUploadedUrl(data.url);
      } else {
        alert("Upload failed: " + data.error);
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred during upload.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDeleteImage = async () => {
    if (!uploadedUrl) return;

    try {
      setIsDeleting(true);
      const res = await fetch("/api/upload", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: uploadedUrl })
      });
      const data = await res.json();
      if (data.success) {
        setUploadedUrl(null);
      } else {
        alert("Delete failed: " + data.error);
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred during deletion.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="font-display text-2xl font-light">Product Management</h2>
          <p className="text-sm text-muted-foreground">Add new products and manage images.</p>
        </div>
        <Button variant="default" size="sm" className="flex items-center gap-2">
          <Plus size={14} /> Add Product
        </Button>
      </div>

      <div className="bg-card border border-border p-6 max-w-2xl">
        <h3 className="font-medium text-foreground mb-4">Upload Product Image</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Upload high-resolution images to the cloud for fast CDN delivery.
        </p>

        <div 
          className="border-2 border-dashed border-border rounded-none p-12 flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors group"
          onClick={() => !uploadedUrl && !isUploading && !isDeleting && fileInputRef.current?.click()}
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*"
            onChange={handleFileUpload}
          />
          
          {isUploading || isDeleting ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="animate-spin text-accent" size={32} />
              <p className="text-sm font-medium text-foreground">{isDeleting ? "Removing Image..." : "Uploading to Cloud..."}</p>
            </div>
          ) : uploadedUrl ? (
            <div className="flex flex-col items-center gap-4 cursor-default">
              <div className="w-32 h-40 bg-muted overflow-hidden border border-border">
                <img src={uploadedUrl} alt="Uploaded" className="w-full h-full object-cover" />
              </div>
              <p className="font-mono text-[10px] text-emerald-400">Upload Successful</p>
              <p className="font-mono text-xs text-muted-foreground break-all">{uploadedUrl}</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                <Upload className="text-muted-foreground group-hover:text-accent transition-colors" size={20} />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">Click to upload image</p>
                <p className="font-mono text-[10px] text-muted-foreground mt-1 tracking-wide uppercase">SVG, PNG, JPG or GIF (MAX. 800x400px)</p>
              </div>
            </div>
          )}
        </div>

        {uploadedUrl && !isUploading && !isDeleting && (
          <div className="mt-6 flex justify-end gap-3">
            <Button variant="outline" size="sm" onClick={handleDeleteImage} className="text-red-400 border-red-400/20 hover:bg-red-400/10">
              <Trash2 size={14} className="mr-2" /> Remove Image
            </Button>
            <Button variant="default" size="sm" onClick={() => fileInputRef.current?.click()}>
              Replace Image
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
