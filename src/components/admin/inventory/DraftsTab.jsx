import { useState, useRef, Fragment } from "react";
import { Loader2, Upload, Trash2, Edit3, CheckCircle, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function DraftsTab({ products, isLoading, onRefresh }) {
  const [expandedId, setExpandedId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const drafts = products.filter(p => 
    p.status === 'wms_draft' || 
    p.status === 'enrichment_pending' || 
    (p.countryDrafts && p.countryDrafts.length > 0)
  );

  const handleExpand = (p) => {
    if (expandedId === p._id) {
      setExpandedId(null);
    } else {
      setExpandedId(p._id);
      setEditForm({
        name: p.name || "",
        description: p.description || "",
        marketingDescription: p.enrichment?.marketingDescription || "",
        seoTitle: p.enrichment?.seoTitle || "",
        seoDescription: p.enrichment?.seoDescription || "",
        basePrice: p.basePrice || "",
        localPrice: p.localPrice || "",
        images: p.media?.map(m => m.url) || [],
      });
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (data.success) {
        setEditForm(prev => ({ ...prev, images: [...prev.images, data.url] }));
      } else {
        alert("Upload failed");
      }
    } catch (err) {
      alert("Error uploading file.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeImage = (index) => {
    const newImages = [...editForm.images];
    newImages.splice(index, 1);
    setEditForm(prev => ({ ...prev, images: newImages }));
  };

  const handleSave = async (id, publish = false) => {
    setIsSaving(true);
    try {
      const payload = {
        name: editForm.name,
        description: editForm.description,
        basePrice: Number(editForm.basePrice),
        localPrice: Number(editForm.localPrice),
        media: editForm.images.map(url => ({ url, type: "image" })),
        enrichment: {
          marketingDescription: editForm.marketingDescription,
          seoTitle: editForm.seoTitle,
          seoDescription: editForm.seoDescription,
        },
        status: publish ? 'published' : 'enrichment_pending',
        isActive: publish ? true : undefined
      };

      const res = await fetch(`/api/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        if (publish) setExpandedId(null);
        onRefresh();
      } else {
        const err = await res.json();
        alert("Failed to save: " + err.message);
      }
    } catch (err) {
      alert("Error saving product.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-2xl font-light">Drafts & Enrichment</h2>
        <p className="text-sm text-muted-foreground">Enrich WMS drafts with marketing data before publishing.</p>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left px-5 py-3 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">Product</th>
              <th className="text-left px-5 py-3 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">SKU</th>
              <th className="text-left px-5 py-3 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">Status</th>
              <th className="text-right px-5 py-3 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">Action</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={4} className="py-8 text-center"><Loader2 className="animate-spin mx-auto text-muted-foreground" /></td></tr>
            ) : drafts.length === 0 ? (
              <tr><td colSpan={4} className="py-8 text-center text-muted-foreground">No drafts pending enrichment.</td></tr>
            ) : drafts.map((p) => (
              <Fragment key={p._id}>
                <tr className="border-b border-border hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => handleExpand(p)}>
                  <td className="px-5 py-3 text-sm font-medium">{p.name}</td>
                  <td className="px-5 py-3 font-mono text-xs text-muted-foreground">{p.sku || p.variants?.[0]?.sku}</td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-1 text-[10px] rounded-full ${
                      p.status === 'wms_draft' ? 'bg-amber-500/10 text-amber-500' : 
                      p.countryDrafts?.length > 0 && p.status === 'published' ? 'bg-purple-500/10 text-purple-500' :
                      'bg-blue-500/10 text-blue-500'
                    }`}>
                      {p.status === 'wms_draft' ? 'Raw WMS Draft' : 
                       p.countryDrafts?.length > 0 && p.status === 'published' ? `Regional Draft (${p.countryDrafts.join(', ')})` : 
                       'Enrichment Pending'}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      {expandedId === p._id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </Button>
                  </td>
                </tr>
                {expandedId === p._id && (
                  <tr className="border-b border-border bg-muted/10">
                    <td colSpan={4} className="p-6">
                      <div className="grid grid-cols-2 gap-8">
                        {/* Left Column: Basic Info & Media */}
                        <div className="space-y-6">
                          <div className="space-y-2">
                            <Label>Display Name</Label>
                            <Input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Base Price (£)</Label>
                              <Input type="number" value={editForm.basePrice} onChange={e => setEditForm({ ...editForm, basePrice: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                              <Label>Local Price (NPR)</Label>
                              <Input type="number" value={editForm.localPrice} onChange={e => setEditForm({ ...editForm, localPrice: e.target.value })} />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label>Media</Label>
                            <div className="flex gap-3 mb-4">
                              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
                              <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                                {isUploading ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <Upload className="w-4 h-4 mr-2" />} 
                                Upload Image
                              </Button>
                            </div>
                            {editForm.images.length > 0 && (
                              <div className="grid grid-cols-4 gap-2">
                                {editForm.images.map((img, i) => (
                                  <div key={i} className="relative aspect-square bg-background border border-border group overflow-hidden rounded-md">
                                    <img src={img} alt="Preview" className="w-full h-full object-cover" />
                                    <button onClick={() => removeImage(i)} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                                      <Trash2 size={12} />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Right Column: Rich Text & SEO */}
                        <div className="space-y-6">
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <Label>Marketing Description (Rich Text)</Label>
                            </div>
                            {/* Simple text area acting as rich text placeholder. A custom WYSIWYG could be mounted here if needed */}
                            <Textarea 
                              rows={5} 
                              className="font-sans"
                              placeholder="Describe the product beautifully..."
                              value={editForm.marketingDescription || editForm.description} 
                              onChange={e => setEditForm({ ...editForm, marketingDescription: e.target.value })} 
                            />
                          </div>

                          <div className="space-y-4 pt-4 border-t border-border">
                            <h4 className="text-sm font-medium">SEO Enrichment</h4>
                            <div className="space-y-2">
                              <Label className="text-xs">SEO Title</Label>
                              <Input value={editForm.seoTitle} onChange={e => setEditForm({ ...editForm, seoTitle: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-xs">SEO Description</Label>
                              <Input value={editForm.seoDescription} onChange={e => setEditForm({ ...editForm, seoDescription: e.target.value })} />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-border">
                        <Button variant="outline" onClick={() => handleSave(p._id, false)} disabled={isSaving}>
                          {isSaving ? <Loader2 className="animate-spin w-4 h-4" /> : <Edit3 className="w-4 h-4 mr-2" />} 
                          Save Draft
                        </Button>
                        <Button className="bg-emerald-500 hover:bg-emerald-600 text-white" onClick={() => handleSave(p._id, true)} disabled={isSaving}>
                          <CheckCircle className="w-4 h-4 mr-2" /> Publish to Catalog
                        </Button>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
