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
  const [dbRegions, setDbRegions] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Tabs: general, attributes, variants, media
  const [activeTab, setActiveTab] = useState("general");

  // Form State
  const [formData, setFormData] = useState({
    name: "", slug: "", sku: "", description: "", brand: "",
    pricing: [],
    status: "published",
    wmsData: {},
    enrichment: { marketingDescription: "", seoTitle: "", seoDescription: "" },
    foodCompliance: {
      ingredientsList: "",
      nutritionalFacts: {},
      allergenWarnings: [],
      dietaryTags: []
    },
    logisticsAttributes: {
      shelfLife: "",
      storageConditions: "Room Temperature",
      certifications: []
    }
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
      fetch("/api/regions").then(res => res.json()),
      fetch(`/api/products/${productId}`).then(res => res.json())
    ]).then(([cats, whs, regions, prodData]) => {
      setCategories(cats);
      setWarehouses(whs);
      setDbRegions(regions);
      
      if (prodData) {
        setFormData({
          name: prodData.name || "",
          slug: prodData.slug || "",
          sku: prodData.sku || "",
          pricing: prodData.pricing || [],
          description: prodData.description || "",
          brand: prodData.brand || "",
          status: prodData.status || "published",
          wmsData: prodData.wmsData || {},
          enrichment: prodData.enrichment || { marketingDescription: "", seoTitle: "", seoDescription: "" },
          foodCompliance: {
            ingredientsList: prodData.foodCompliance?.ingredientsList || "",
            nutritionalFacts: prodData.foodCompliance?.nutritionalFacts || {},
            allergenWarnings: (prodData.foodCompliance?.allergenWarnings || []).join(", "),
            dietaryTags: (prodData.foodCompliance?.dietaryTags || []).join(", ")
          },
          logisticsAttributes: prodData.logisticsAttributes || {
            shelfLife: "",
            storageConditions: "Room Temperature",
            certifications: []
          }
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
            weight: v.attributes?.weight || "",
            flavor: v.attributes?.flavor || "",
            packSize: v.attributes?.packSize || "",
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

  const handleCategoryChange = (newCatId) => {
    const newCat = categories.find(c => c._id === newCatId);
    if (selectedMainCategoryObj && newCat && selectedMainCategoryObj.productType !== newCat.productType) {
      if (!window.confirm(`Warning: Switching from ${selectedMainCategoryObj.productType} to ${newCat.productType} may clear or invalidate existing category-specific attributes. Continue?`)) {
        return;
      }
      setAttributes({});
    }
    setMainCategory(newCatId);
    setSubCategory("");
  };

  const handleAttributeChange = (key, value) => {
    setAttributes(prev => ({ ...prev, [key]: value }));
  };

  const addVariant = () => {
    setVariants([...variants, {
      sku: formData.sku ? `${formData.sku}-V${variants.length + 1}` : "",
      size: "",
      color: "",
      weight: "",
      flavor: "",
      packSize: "",
      priceOverride: "",
      inventory: {} 
    }]);
  };

  const updateVariant = (index, field, value) => {
    const newVariants = [...variants];
    newVariants[index][field] = value;
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

  const handleSave = async (overrideStatus = null) => {
    try {
      const mappedVariants = variants.map(v => ({
        ...(v._id ? { _id: v._id } : {}),
        sku: v.sku,
        priceOverride: Number(v.priceOverride) || null,
        attributes: selectedMainCategoryObj?.productType === 'food' 
          ? { weight: v.weight, flavor: v.flavor, packSize: v.packSize }
          : { size: v.size, color: v.color },
        inventoryData: v.inventory 
      }));

      const payload = {
        ...formData,
        pricing: formData.pricing,
        mainCategory,
        subCategory: subCategory || null,
        attributes,
        availableCountries,
        media: images.map(url => ({ url, type: "image" })),
        variants: mappedVariants,
        status: overrideStatus || formData.status,
        wmsData: formData.wmsData,
        enrichment: formData.enrichment,
        foodCompliance: {
          ...formData.foodCompliance,
          allergenWarnings: typeof formData.foodCompliance?.allergenWarnings === 'string'
            ? formData.foodCompliance.allergenWarnings.split(',').map(s=>s.trim()).filter(Boolean)
            : formData.foodCompliance?.allergenWarnings || [],
          dietaryTags: typeof formData.foodCompliance?.dietaryTags === 'string'
            ? formData.foodCompliance.dietaryTags.split(',').map(s=>s.trim()).filter(Boolean)
            : formData.foodCompliance?.dietaryTags || []
        },
        logisticsAttributes: formData.logisticsAttributes,
        isActive: (overrideStatus || formData.status) === 'published' ? true : formData.isActive
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
        <div className="flex gap-3">
          {formData.status !== 'published' && (
            <Button 
              onClick={() => handleSave('published')} 
              className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90"
            >
              Publish Product
            </Button>
          )}
          <Button onClick={() => handleSave()} className="gap-2 bg-foreground text-background"><Save size={16} /> Save Changes</Button>
        </div>
      </div>

      <div className="flex border-b border-border mb-6 gap-2">
        {["general", "enrichment", "attributes", "variants", "media", ...(selectedMainCategoryObj?.productType === 'food' ? ["compliance"] : [])].map(t => (
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
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium">Regional Pricing</h3>
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2"
                onClick={() => setFormData({
                  ...formData,
                  pricing: [...formData.pricing, { country: "", currency: "", basePrice: 0, salePrice: null, taxRate: 0, isActive: true }]
                })}
              >
                <Plus size={14} /> Add Region Price
              </Button>
            </div>
            
            <div className="space-y-4 mb-6">
              {formData.pricing.map((p, index) => (
                <div key={index} className="grid grid-cols-6 gap-3 p-4 bg-muted/30 border border-border rounded-md relative">
                  <button 
                    onClick={() => {
                      const newPricing = [...formData.pricing];
                      newPricing.splice(index, 1);
                      setFormData({ ...formData, pricing: newPricing });
                    }} 
                    className="absolute top-2 right-2 text-red-500 hover:text-red-600"
                  >
                    <Trash2 size={14} />
                  </button>
                  
                  <div className="space-y-2">
                    <Label>Country</Label>
                    <select 
                      className="w-full border border-border bg-background p-2 rounded-md text-sm outline-none"
                      value={p.country} 
                      onChange={e => {
                        const newP = [...formData.pricing];
                        const selectedRegion = dbRegions.find(r => r.countryCode === e.target.value);
                        newP[index].country = e.target.value;
                        if (selectedRegion) {
                          newP[index].currency = selectedRegion.currency;
                          newP[index].taxRate = selectedRegion.taxRate;
                        }
                        setFormData({ ...formData, pricing: newP });
                      }}
                    >
                      <option value="">Select Region...</option>
                      {dbRegions.map(r => <option key={r.countryCode} value={r.countryCode}>{r.name} ({r.countryCode})</option>)}
                      {!dbRegions.find(r => r.countryCode === p.country) && p.country && <option value={p.country}>{p.country} (Legacy)</option>}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Currency</Label>
                    <div className="p-2 border border-border bg-muted/50 rounded-md text-sm text-muted-foreground">{p.currency || '-'}</div>
                  </div>
                  <div className="space-y-2">
                    <Label>Base Price</Label>
                    <Input type="number" value={p.basePrice} onChange={e => {
                      const newP = [...formData.pricing];
                      newP[index].basePrice = Number(e.target.value);
                      setFormData({ ...formData, pricing: newP });
                    }} />
                  </div>
                  <div className="space-y-2">
                    <Label>Sale Price</Label>
                    <Input type="number" placeholder="Optional" value={p.salePrice || ""} onChange={e => {
                      const newP = [...formData.pricing];
                      newP[index].salePrice = e.target.value ? Number(e.target.value) : null;
                      setFormData({ ...formData, pricing: newP });
                    }} />
                  </div>
                  <div className="space-y-2">
                    <Label>Tax Rate (%)</Label>
                    <div className="p-2 border border-border bg-muted/50 rounded-md text-sm text-muted-foreground">{p.taxRate || '0'}%</div>
                  </div>
                  <div className="space-y-2 flex flex-col justify-end">
                    <label className="flex items-center gap-2 mb-2 text-sm">
                      <input type="checkbox" checked={p.isActive} onChange={e => {
                        const newP = [...formData.pricing];
                        newP[index].isActive = e.target.checked;
                        setFormData({ ...formData, pricing: newP });
                      }} />
                      Active
                    </label>
                  </div>
                </div>
              ))}
              {formData.pricing.length === 0 && (
                <div className="text-center text-sm text-muted-foreground py-4">No regional pricing added.</div>
              )}
            </div>

            <h3 className="font-medium mb-4">Category Assignment</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Main Category</Label>
                <select className="w-full border p-2 bg-background rounded-md text-sm" value={mainCategory} onChange={e => handleCategoryChange(e.target.value)}>
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


          </div>
        </div>
      )}

      {activeTab === "enrichment" && (
        <div className="space-y-6">
          <div className="bg-card border border-border p-6 rounded-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium">Product Status Workflow</h3>
              <div className="flex gap-2">
                <Button 
                  variant={formData.status === 'wms_draft' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => setFormData({ ...formData, status: 'wms_draft' })}
                >
                  WMS Draft
                </Button>
                <Button 
                  variant={formData.status === 'enrichment_pending' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => setFormData({ ...formData, status: 'enrichment_pending' })}
                >
                  Needs Enrichment
                </Button>
                <Button 
                  variant={formData.status === 'published' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => setFormData({ ...formData, status: 'published' })}
                >
                  Published
                </Button>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border p-6 rounded-md">
            <h3 className="font-medium mb-4">WMS Logistical Data (Read Only)</h3>
            <div className="grid grid-cols-4 gap-4 bg-muted/50 p-4 rounded text-sm">
              <div>
                <p className="text-muted-foreground mb-1">Original SKU</p>
                <p className="font-mono">{formData.wmsData.originalSku || 'N/A'}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Weight</p>
                <p className="font-mono">{formData.wmsData.weight || 'N/A'}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Dimensions</p>
                <p className="font-mono">{formData.wmsData.dimensions || 'N/A'}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">WMS ID</p>
                <p className="font-mono">{formData.wmsData.wmsProductId || 'N/A'}</p>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border p-6 rounded-md">
            <h3 className="font-medium mb-4">Marketing & SEO Enrichment</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Marketing Description</Label>
                <Textarea 
                  rows={4} 
                  placeholder="Rich description for the storefront..."
                  value={formData.enrichment.marketingDescription} 
                  onChange={e => setFormData({ ...formData, enrichment: { ...formData.enrichment, marketingDescription: e.target.value } })} 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>SEO Title</Label>
                  <Input 
                    value={formData.enrichment.seoTitle} 
                    onChange={e => setFormData({ ...formData, enrichment: { ...formData.enrichment, seoTitle: e.target.value } })} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>SEO Description</Label>
                  <Input 
                    value={formData.enrichment.seoDescription} 
                    onChange={e => setFormData({ ...formData, enrichment: { ...formData.enrichment, seoDescription: e.target.value } })} 
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "attributes" && (
        <div className="bg-card border border-border p-6 rounded-md space-y-4">
          <h3 className="font-medium mb-4">Dynamic Attributes</h3>
          <p className="text-sm text-muted-foreground mb-4">Define custom properties specific to the {selectedMainCategoryObj?.productType || 'standard'} category.</p>
          
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

      {activeTab === "compliance" && selectedMainCategoryObj?.productType === 'food' && (
        <div className="bg-card border border-border p-6 rounded-md space-y-8">
          <div>
            <h3 className="font-medium mb-4 text-red-600">Safety & Compliance</h3>
            <p className="text-sm text-muted-foreground mb-4">Food products require strict regulatory compliance data.</p>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2 col-span-2">
                <Label>Ingredients List</Label>
                <Textarea 
                  placeholder="Comma separated ingredients" 
                  value={formData.foodCompliance.ingredientsList} 
                  onChange={e => setFormData({...formData, foodCompliance: {...formData.foodCompliance, ingredientsList: e.target.value}})} 
                />
              </div>
              <div className="space-y-2">
                <Label>Allergens (comma separated)</Label>
                <Input 
                  placeholder="e.g. Peanuts, Dairy" 
                  value={formData.foodCompliance.allergenWarnings} 
                  onChange={e => setFormData({...formData, foodCompliance: {...formData.foodCompliance, allergenWarnings: e.target.value}})} 
                />
              </div>
              <div className="space-y-2">
                <Label>Dietary Tags (comma separated)</Label>
                <Input 
                  placeholder="e.g. Vegan, Gluten-Free" 
                  value={formData.foodCompliance.dietaryTags} 
                  onChange={e => setFormData({...formData, foodCompliance: {...formData.foodCompliance, dietaryTags: e.target.value}})} 
                />
              </div>
              <div className="space-y-2 col-span-2 mt-4">
                <Label>Nutritional Facts (JSON)</Label>
                <Textarea 
                  rows={4} 
                  placeholder='{"Calories": "200kcal", "Protein": "15g"}' 
                  value={typeof formData.foodCompliance.nutritionalFacts === 'object' ? JSON.stringify(formData.foodCompliance.nutritionalFacts) : (formData.foodCompliance.nutritionalFacts || "")} 
                  onChange={e => {
                    let val = e.target.value;
                    try { val = JSON.parse(val); } catch(err) { /* string temporarily */ }
                    setFormData({...formData, foodCompliance: {...formData.foodCompliance, nutritionalFacts: val}});
                  }} 
                />
                <p className="text-xs text-muted-foreground mt-1">Provide a valid JSON object. Leave plain text if typing.</p>
              </div>
            </div>
          </div>
          
          <div className="pt-6 border-t border-border">
            <h3 className="font-medium mb-4 text-blue-600">Logistics & Storage</h3>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Shelf Life</Label>
                <Input 
                  placeholder="e.g. 6 Months" 
                  value={formData.logisticsAttributes.shelfLife} 
                  onChange={e => setFormData({...formData, logisticsAttributes: {...formData.logisticsAttributes, shelfLife: e.target.value}})} 
                />
              </div>
              <div className="space-y-2">
                <Label>Storage Conditions</Label>
                <select 
                  className="w-full border border-border bg-background p-2 rounded-md text-sm outline-none"
                  value={formData.logisticsAttributes.storageConditions}
                  onChange={e => setFormData({...formData, logisticsAttributes: {...formData.logisticsAttributes, storageConditions: e.target.value}})}
                >
                  <option value="Room Temperature">Room Temperature</option>
                  <option value="Refrigerated">Refrigerated</option>
                  <option value="Frozen">Frozen</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "variants" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Variants</h3>
              <p className="text-sm text-muted-foreground">Manage sizes and colors.</p>
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
                {selectedMainCategoryObj?.productType === 'food' ? (
                  <>
                    <div className="space-y-2">
                      <Label>Weight / Volume</Label>
                      <Input value={v.weight || ""} placeholder="e.g. 250g" onChange={e => updateVariant(index, 'weight', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Flavor / Type</Label>
                      <Input value={v.flavor || ""} placeholder="e.g. Spicy" onChange={e => updateVariant(index, 'flavor', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Pack Size</Label>
                      <Input value={v.packSize || ""} placeholder="e.g. 6-Pack" onChange={e => updateVariant(index, 'packSize', e.target.value)} />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label>Size</Label>
                      <Input value={v.size || ""} placeholder="e.g. M" onChange={e => updateVariant(index, 'size', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Color</Label>
                      <Input value={v.color || ""} placeholder="e.g. Black" onChange={e => updateVariant(index, 'color', e.target.value)} />
                    </div>
                  </>
                )}
                <div className="space-y-2">
                  <Label>Price Override (£)</Label>
                  <Input value={v.priceOverride} placeholder="Optional" onChange={e => updateVariant(index, 'priceOverride', e.target.value)} />
                </div>
              </div>

              <div className="pt-4 border-t border-border mt-4">
                <Label className="mb-2 block">Current Warehouse Stock (Read-Only)</Label>
                <div className="flex flex-wrap gap-6 text-sm">
                  {warehouses.map(wh => (
                    <div key={wh._id} className="flex items-center gap-2">
                      <span className="text-muted-foreground">{wh.name}:</span>
                      <span className="font-mono font-medium">{v.inventory?.[wh._id] || 0}</span>
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
