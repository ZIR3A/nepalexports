"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Save, Plus, Trash2, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params?.id;
  const fileInputRef = useRef(null);

  // Data Sources
  const [categories, setCategories] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Tabs: general, attributes, variants, media
  const [activeTab, setActiveTab] = useState("general");

  // Form State
  const [formData, setFormData] = useState({
    name: "", slug: "", sku: "", basePrice: "", localPrice: "", description: "", brand: ""
  });
  const [availableCountries, setAvailableCountries] = useState(["NP", "GB"]);
  const [mainCategory, setMainCategory] = useState("");
  const [subCategory, setSubCategory] = useState("");
  
  const [attributes, setAttributes] = useState({});
  const [variants, setVariants] = useState([]);
  const [images, setImages] = useState([]);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (!productId) return;

    Promise.all([
      fetch("/api/categories").then(res => res.json()),
      fetch("/api/warehouses").then(res => res.json()),
      fetch(`/api/products/${productId}`).then(res => res.json())
    ]).then(([cats, whs, prodData]) => {
      setCategories(cats);
      setWarehouses(whs);
      
      if (prodData) {
        setFormData({
          name: prodData.name || "",
          slug: prodData.slug || "",
          sku: prodData.sku || "",
          basePrice: prodData.basePrice || "",
          localPrice: prodData.localPrice || "",
          description: prodData.description || "",
          brand: prodData.brand || ""
        });
        
        setMainCategory(prodData.mainCategory?._id || prodData.mainCategory || "");
        setSubCategory(prodData.subCategory?._id || prodData.subCategory || "");
        // Convert Mongoose Map attributes to plain object
        let parsedAttributes = prodData.attributes || {};
        if (parsedAttributes && typeof parsedAttributes === 'object' && parsedAttributes.$__parent) {
          parsedAttributes = {};
        }
        // If attributes came as entries (from Mongoose Map), convert
        if (parsedAttributes instanceof Map) {
          parsedAttributes = Object.fromEntries(parsedAttributes);
        }
        setAttributes(parsedAttributes);

        setAvailableCountries(prodData.availableCountries || ["NP", "GB"]);
        setImages(prodData.media?.map(m => m.url) || []);
        
        // Map variants and inventory - use byWarehouse for per-warehouse stock
        const mappedVariants = (prodData.variants || []).map(v => {
          const invEntry = prodData.inventoryMap && prodData.inventoryMap[v._id] ? prodData.inventoryMap[v._id] : {};
          return {
            _id: v._id,
            sku: v.sku,
            size: v.attributes?.size || "",
            color: v.attributes?.color || "",
            priceOverride: v.priceOverride || "",
            inventory: invEntry.byWarehouse || {}
          };
        });
        setVariants(mappedVariants);
      }
      setIsLoadingData(false);
    }).catch(err => {
      console.error(err);
      setIsLoadingData(false);
    });
  }, [productId]);

  const selectedMainCategoryObj = categories.find(c => c._id === mainCategory);

  const handleAttributeChange = (key, value) => {
    setAttributes(prev => ({ ...prev, [key]: value }));
  };

  const addVariant = () => {
    setVariants([...variants, {
      sku: formData.sku ? `${formData.sku}-V${variants.length + 1}` : "",
      size: "",
      color: "",
      priceOverride: "",
      inventory: {} 
    }]);
  };

  const updateVariant = (index, field, value) => {
    const newVariants = [...variants];
    newVariants[index][field] = value;
    setVariants(newVariants);
  };

  const updateVariantInventory = (variantIndex, warehouseId, quantity) => {
    const newVariants = [...variants];
    if (!newVariants[variantIndex].inventory) newVariants[variantIndex].inventory = {};
    newVariants[variantIndex].inventory[warehouseId] = quantity;
    setVariants(newVariants);
  };

  const removeVariant = (index) => {
    setVariants(variants.filter((_, i) => i !== index));
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
        setImages([...images, data.url]);
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
    const newImages = [...images];
    newImages.splice(index, 1);
    setImages(newImages);
  };

  const handleSave = async () => {
    try {
      const mappedVariants = variants.map(v => ({
        ...(v._id ? { _id: v._id } : {}),
        sku: v.sku,
        priceOverride: Number(v.priceOverride) || null,
        attributes: { size: v.size, color: v.color },
        inventoryData: v.inventory 
      }));

      const payload = {
        ...formData,
        basePrice: Number(formData.basePrice) || 0,
        localPrice: Number(formData.localPrice) || 0,
        mainCategory,
        subCategory: subCategory || null,
        attributes,
        availableCountries,
        media: images.map(url => ({ url, type: "image" })),
        variants: mappedVariants
      };

      const res = await fetch(`/api/products/${productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        router.push("/admin/products");
      } else {
        const err = await res.json();
        alert("Failed to save: " + err.message);
      }
    } catch (err) {
      console.error(err);
      alert("Error saving product.");
    }
  };

  if (isLoadingData) return <div className="p-10 flex items-center justify-center"><Loader2 className="animate-spin text-muted-foreground" /></div>;

  return (
    <div className="max-w-5xl mx-auto pb-20">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}><ArrowLeft size={16} /></Button>
          <h2 className="font-display text-2xl">Edit Product</h2>
        </div>
        <Button onClick={handleSave} className="gap-2 bg-foreground text-background"><Save size={16} /> Save Changes</Button>
      </div>

      <div className="flex border-b border-border mb-6 gap-2">
        {["general", "attributes", "variants", "media"].map(t => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`px-4 py-2 text-sm uppercase tracking-wider font-mono transition-colors ${activeTab === t ? "border-b-2 border-foreground text-foreground" : "text-muted-foreground"}`}
          >
            {t}
          </button>
        ))}
      </div>

      {activeTab === "general" && (
        <div className="space-y-6">
          <div className="bg-card border border-border p-6 rounded-md">
            <h3 className="font-medium mb-4">Core Info</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Product Name</Label>
                <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Brand</Label>
                <Input value={formData.brand} onChange={e => setFormData({ ...formData, brand: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>SKU</Label>
                <Input value={formData.sku} onChange={e => setFormData({ ...formData, sku: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Slug</Label>
                <Input value={formData.slug} onChange={e => setFormData({ ...formData, slug: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2 mt-4">
              <Label>Description</Label>
              <Textarea rows={4} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
            </div>
          </div>

          <div className="bg-card border border-border p-6 rounded-md">
            <h3 className="font-medium mb-4">Pricing & Category</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Base Price (£)</Label>
                <Input type="number" value={formData.basePrice} onChange={e => setFormData({ ...formData, basePrice: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Local Price (NPR)</Label>
                <Input type="number" value={formData.localPrice} onChange={e => setFormData({ ...formData, localPrice: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Main Category</Label>
                <select className="w-full border p-2 bg-background rounded-md text-sm" value={mainCategory} onChange={e => { setMainCategory(e.target.value); setSubCategory(""); }}>
                  <option value="">Select...</option>
                  {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Sub Category</Label>
                <select className="w-full border p-2 bg-background rounded-md text-sm" value={subCategory} onChange={e => setSubCategory(e.target.value)} disabled={!mainCategory}>
                  <option value="">Select...</option>
                  {selectedMainCategoryObj?.subCategories?.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-border">
              <Label className="mb-2 block">Available Countries</Label>
              <div className="flex gap-4">
                {[
                  { code: 'NP', name: 'Nepal' },
                  { code: 'GB', name: 'United Kingdom' },
                  { code: 'US', name: 'United States' },
                  { code: 'AU', name: 'Australia' }
                ].map(country => (
                  <label key={country.code} className="flex items-center gap-2 text-sm">
                    <input 
                      type="checkbox" 
                      checked={availableCountries.includes(country.code)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setAvailableCountries([...availableCountries, country.code]);
                        } else {
                          setAvailableCountries(availableCountries.filter(c => c !== country.code));
                        }
                      }}
                    />
                    {country.name}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "attributes" && (
        <div className="bg-card border border-border p-6 rounded-md space-y-4">
          <h3 className="font-medium mb-4">Dynamic Attributes</h3>
          <p className="text-sm text-muted-foreground mb-4">Define custom properties like Material, Wash Care, etc.</p>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Material</Label>
              <Input placeholder="e.g. 100% Cotton" value={attributes.material || ""} onChange={e => handleAttributeChange('material', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Care Instructions</Label>
              <Input placeholder="e.g. Machine Wash Cold" value={attributes.careInstructions || ""} onChange={e => handleAttributeChange('careInstructions', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Weight</Label>
              <Input placeholder="e.g. 200g" value={attributes.weight || ""} onChange={e => handleAttributeChange('weight', e.target.value)} />
            </div>
          </div>
        </div>
      )}

      {activeTab === "variants" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Variants & Inventory</h3>
              <p className="text-sm text-muted-foreground">Manage sizes, colors, and warehouse stock levels.</p>
            </div>
            <Button onClick={addVariant} variant="outline" size="sm" className="gap-2"><Plus size={14} /> Add Variant</Button>
          </div>

          {variants.length === 0 && (
            <div className="p-8 border border-dashed border-border rounded-md text-center text-muted-foreground text-sm">
              No variants added. Product will be treated as a single standard item.
            </div>
          )}

          {variants.map((v, index) => (
            <div key={index} className="bg-card border border-border p-4 rounded-md space-y-4 relative">
              <button onClick={() => removeVariant(index)} className="absolute top-4 right-4 text-red-500 hover:text-red-600"><Trash2 size={16} /></button>
              <div className="grid grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Variant SKU</Label>
                  <Input value={v.sku} onChange={e => updateVariant(index, 'sku', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Size</Label>
                  <Input value={v.size} placeholder="e.g. M" onChange={e => updateVariant(index, 'size', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Color</Label>
                  <Input value={v.color} placeholder="e.g. Black" onChange={e => updateVariant(index, 'color', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Price Override (£)</Label>
                  <Input value={v.priceOverride} placeholder="Optional" onChange={e => updateVariant(index, 'priceOverride', e.target.value)} />
                </div>
              </div>

              <div className="pt-4 border-t border-border mt-4">
                <Label className="mb-2 block">Warehouse Stock Allocation</Label>
                <div className="grid grid-cols-3 gap-4">
                  {warehouses.map(wh => (
                    <div key={wh._id} className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground w-24 truncate">{wh.name}</span>
                      <Input 
                        type="number" 
                        placeholder="Qty" 
                        className="w-20"
                        value={v.inventory?.[wh._id] || ""} 
                        onChange={e => updateVariantInventory(index, wh._id, Number(e.target.value))} 
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === "media" && (
        <div className="bg-card border border-border p-6 rounded-md">
          <h3 className="font-medium mb-4">Media Gallery</h3>
          <div className="flex gap-3 mb-4">
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
            <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
              {isUploading ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <Upload className="w-4 h-4 mr-2" />} 
              Upload to Vercel Blob
            </Button>
          </div>
          
          {images.length > 0 && (
            <div className="grid grid-cols-5 gap-4">
              {images.map((img, i) => (
                <div key={i} className="relative aspect-square bg-muted border border-border group overflow-hidden rounded-md">
                  <img src={img} alt="Preview" className="w-full h-full object-cover" />
                  <button onClick={() => removeImage(i)} className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      
    </div>
  );
}
