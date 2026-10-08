'use client';

import React, { useState, useRef } from 'react';
import {
  X,
  Boxes,
  Upload,
  Image as ImageIcon,
  Trash2,
  Link as LinkIcon,
  Sparkles,
  Camera,
  CheckCircle2,
} from 'lucide-react';
import { Product, Warehouse } from '@/types';

interface CreateProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  warehouses: Warehouse[];
  productToEdit?: Product | null;
  onSaveProduct: (
    product: Partial<Product> & {
      name: string;
      sku: string;
      category: string;
      selling_price: number;
      id?: string;
    }
  ) => void;
}

// Preset catalog images for quick selection
const PRESET_PRODUCT_IMAGES = [
  {
    name: 'Server Rack 2U',
    category: 'Server Hardware',
    url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=500&auto=format&fit=crop&q=80',
  },
  {
    name: 'Network Switch',
    category: 'Networking',
    url: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=500&auto=format&fit=crop&q=80',
  },
  {
    name: 'Enterprise RAM',
    category: 'Memory & Storage',
    url: 'https://images.unsplash.com/photo-1562976540-1502c2145186?w=500&auto=format&fit=crop&q=80',
  },
  {
    name: 'NVMe SSD',
    category: 'Memory & Storage',
    url: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=500&auto=format&fit=crop&q=80',
  },
  {
    name: 'Fiber Optic Cable',
    category: 'Cabling & SAN',
    url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&auto=format&fit=crop&q=80',
  },
  {
    name: 'Power Unit UPS',
    category: 'Power Management',
    url: 'https://images.unsplash.com/photo-1588508065123-287b28e013da?w=500&auto=format&fit=crop&q=80',
  },
];

function ProductModalForm({
  productToEdit,
  warehouses,
  onClose,
  onSaveProduct,
}: {
  productToEdit?: Product | null;
  warehouses: Warehouse[];
  onClose: () => void;
  onSaveProduct: CreateProductModalProps['onSaveProduct'];
}) {
  const [sku, setSku] = useState(productToEdit?.sku || '');
  const [name, setName] = useState(productToEdit?.name || '');
  const [description, setDescription] = useState(productToEdit?.description || '');
  const [category, setCategory] = useState(productToEdit?.category || 'Server Hardware');
  const [subcategory, setSubcategory] = useState(productToEdit?.subcategory || '');
  const [brand, setBrand] = useState(productToEdit?.brand || 'Zenith Industrial');
  const [hsnCode, setHsnCode] = useState(productToEdit?.hsn_sac_code || '84715000');
  const [barcode, setBarcode] = useState(productToEdit?.barcode || '');
  const [unit, setUnit] = useState(productToEdit?.unit || 'Units');
  const [purchasePrice, setPurchasePrice] = useState<number>(productToEdit?.purchase_price || 0);
  const [sellingPrice, setSellingPrice] = useState<number>(productToEdit?.selling_price || 0);
  const [mrp, setMrp] = useState<number>(productToEdit?.mrp || productToEdit?.selling_price || 0);
  const [gstRate, setGstRate] = useState<number>(productToEdit?.gst_rate ?? 18);
  const [openingStock, setOpeningStock] = useState<number>(
    productToEdit ? productToEdit.current_stock : 10
  );
  const [minStock, setMinStock] = useState<number>(productToEdit?.min_stock || 5);
  const [maxStock, setMaxStock] = useState<number>(productToEdit?.max_stock || 200);
  const [warehouseId, setWarehouseId] = useState(
    productToEdit?.warehouse_id || warehouses[0]?.id || 'wh-1'
  );
  const [rack, setRack] = useState(productToEdit?.rack || '');

  // Image Upload state
  const [imageUrl, setImageUrl] = useState(productToEdit?.image_url || '');
  const [imageUploadMode, setImageUploadMode] = useState<'upload' | 'url' | 'presets'>('upload');
  const [customUrlInput, setCustomUrlInput] = useState(productToEdit?.image_url || '');
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Process & compress file to optimized Base64
  const processImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file (PNG, JPG, WebP, etc.)');
      return;
    }

    setIsProcessingImage(true);
    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Resize to standard catalog bounds (max 800px width/height)
        const canvas = document.createElement('canvas');
        const maxDim = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/webp', 0.85);
          setImageUrl(compressedDataUrl);
          setCustomUrlInput('');
        }
        setIsProcessingImage(false);
      };
      img.onerror = () => {
        setIsProcessingImage(false);
        alert('Failed to load image file.');
      };
      img.src = event.target?.result as string;
    };

    reader.onerror = () => {
      setIsProcessingImage(false);
      alert('Error reading uploaded image.');
    };

    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processImageFile(e.dataTransfer.files[0]);
    }
  };

  const handleApplyCustomUrl = () => {
    if (customUrlInput.trim()) {
      setImageUrl(customUrlInput.trim());
    }
  };

  const handleRemoveImage = () => {
    setImageUrl('');
    setCustomUrlInput('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !sku.trim()) return;

    onSaveProduct({
      ...(productToEdit ? { id: productToEdit.id } : {}),
      sku: sku.trim().toUpperCase(),
      name: name.trim(),
      description: description.trim(),
      category,
      subcategory: subcategory.trim(),
      brand: brand.trim(),
      hsn_sac_code: hsnCode.trim(),
      barcode: barcode.trim() || undefined,
      unit,
      purchase_price: purchasePrice,
      selling_price: sellingPrice,
      mrp: mrp || sellingPrice,
      discount_percent: productToEdit?.discount_percent || 0,
      gst_rate: gstRate,
      opening_stock: openingStock,
      min_stock: minStock,
      max_stock: maxStock,
      warehouse_id: warehouseId,
      rack: rack.trim() || undefined,
      image_url: imageUrl.trim() || undefined,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700">
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {productToEdit ? 'Edit Product & Inventory Item' : 'Add New Product / Inventory Item'}
              </h2>
              <p className="text-xs text-slate-500">
                {productToEdit
                  ? `Update details and photo for SKU: ${productToEdit.sku}`
                  : 'Configure product photo, SKU, pricing, GST tax slab & stock reorder levels'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
          {/* PRODUCT IMAGE UPLOAD SECTION */}
          <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-indigo-600" />
                <span className="font-bold text-slate-800 text-xs">Product Image / Catalog Photo</span>
                <span className="text-[10px] text-slate-500">
                  (Displayed in catalog, invoices, & delivery challans)
                </span>
              </div>

              {/* Mode switch */}
              <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-200 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setImageUploadMode('upload')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                    imageUploadMode === 'upload'
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Upload className="w-3 h-3 inline mr-1" />
                  Upload File
                </button>
                <button
                  type="button"
                  onClick={() => setImageUploadMode('url')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                    imageUploadMode === 'url'
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <LinkIcon className="w-3 h-3 inline mr-1" />
                  Image URL
                </button>
                <button
                  type="button"
                  onClick={() => setImageUploadMode('presets')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                    imageUploadMode === 'presets'
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Sparkles className="w-3 h-3 inline mr-1" />
                  Presets
                </button>
              </div>
            </div>

            {/* Image Preview & Upload Controls */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
              {/* Thumbnail Preview Area */}
              <div className="md:col-span-4 flex items-center justify-center">
                <div className="relative group w-36 h-36 rounded-xl border-2 border-dashed border-slate-300 bg-white overflow-hidden flex items-center justify-center shadow-xs">
                  {imageUrl ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={imageUrl}
                        alt="Product preview"
                        className="w-full h-full object-cover object-center"
                      />
                      <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          title="Replace Photo"
                          className="p-1.5 bg-white text-slate-800 rounded-lg hover:bg-slate-100 shadow-xs"
                        >
                          <Camera className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          title="Remove Photo"
                          className="p-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 shadow-xs"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-3 text-center text-slate-400">
                      <ImageIcon className="w-8 h-8 mb-1 text-slate-300" />
                      <span className="text-[11px] font-medium text-slate-500">No Image</span>
                      <span className="text-[9px] text-slate-400 mt-0.5">Upload or select</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Upload Input Area */}
              <div className="md:col-span-8 space-y-2.5">
                {imageUploadMode === 'upload' && (
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png, image/jpeg, image/jpg, image/webp, image/svg+xml"
                      onChange={handleFileInputChange}
                      className="hidden"
                    />

                    <div
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDragOver={handleDrag}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`cursor-pointer border-2 border-dashed rounded-xl p-4 text-center transition-all ${
                        dragActive
                          ? 'border-indigo-600 bg-indigo-50/50'
                          : 'border-slate-300 hover:border-indigo-400 hover:bg-indigo-50/20 bg-white'
                      }`}
                    >
                      <div className="flex flex-col items-center justify-center gap-1.5">
                        <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                          <Upload className="w-4 h-4" />
                        </div>
                        <p className="font-semibold text-slate-700 text-xs">
                          {isProcessingImage ? 'Optimizing photo...' : 'Click or Drag & Drop Product Image'}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          Supports PNG, JPG, WebP, SVG • Automatically resized & optimized
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {imageUploadMode === 'url' && (
                  <div className="space-y-2">
                    <label className="font-semibold text-slate-700 block">External Image URL</label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        placeholder="https://example.com/product-image.jpg"
                        value={customUrlInput}
                        onChange={(e) => setCustomUrlInput(e.target.value)}
                        className="flex-1 px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-hidden focus:border-indigo-500"
                      />
                      <button
                        type="button"
                        onClick={handleApplyCustomUrl}
                        className="px-3 py-1.5 bg-slate-900 text-white font-semibold rounded-lg hover:bg-slate-800 transition-colors"
                      >
                        Apply
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-400">
                      Paste a direct HTTPS image URL from your cloud storage or supplier catalog.
                    </p>
                  </div>
                )}

                {imageUploadMode === 'presets' && (
                  <div className="space-y-1.5">
                    <span className="font-medium text-slate-600 block text-[11px]">
                      Select from standard hardware presets:
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      {PRESET_PRODUCT_IMAGES.map((preset) => (
                        <button
                          key={preset.name}
                          type="button"
                          onClick={() => {
                            setImageUrl(preset.url);
                            setCustomUrlInput(preset.url);
                          }}
                          className={`flex items-center gap-1.5 p-1.5 rounded-lg border text-left transition-all ${
                            imageUrl === preset.url
                              ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 font-bold'
                              : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                          }`}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={preset.url}
                            alt={preset.name}
                            className="w-6 h-6 rounded-md object-cover flex-shrink-0"
                          />
                          <span className="truncate text-[10px]">{preset.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Status indicator */}
                {imageUrl && (
                  <div className="flex items-center justify-between text-[11px] text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Image ready for product catalog
                    </span>
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="text-xs text-red-600 hover:text-red-800 font-semibold"
                    >
                      Clear
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Identifiers */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">SKU / Item Code *</label>
              <input
                type="text"
                placeholder="e.g. ZEN-SVR-01"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md font-mono uppercase text-slate-900 font-medium"
                required
              />
            </div>
            <div className="sm:col-span-2 space-y-1">
              <label className="font-semibold text-slate-700">Product / Item Name *</label>
              <input
                type="text"
                placeholder="e.g. Managed 24-Port Gigabit Switch"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-slate-900 font-semibold"
                required
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-700">Description</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Technical specs, dimensions, packaging details..."
              className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-slate-800"
            />
          </div>

          {/* Classification & Taxation */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-slate-900 font-medium"
              >
                <option value="Server Hardware">Server Hardware</option>
                <option value="Networking">Networking</option>
                <option value="Memory & Storage">Memory & Storage</option>
                <option value="Power Management">Power Management</option>
                <option value="Cabling & SAN">Cabling & SAN</option>
                <option value="Industrial Spares">Industrial Spares</option>
                <option value="Office Equipment">Office Equipment</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">HSN/SAC Code *</label>
              <input
                type="text"
                value={hsnCode}
                onChange={(e) => setHsnCode(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md font-mono text-slate-900"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">GST Slab Rate *</label>
              <select
                value={gstRate}
                onChange={(e) => setGstRate(Number(e.target.value))}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-slate-900 font-mono"
              >
                <option value={0}>0% (Exempt)</option>
                <option value={5}>5%</option>
                <option value={12}>12%</option>
                <option value={18}>18% (Standard)</option>
                <option value={28}>28%</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Unit of Measurement</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-slate-900"
              >
                <option value="Units">Units (Pcs)</option>
                <option value="Rolls">Rolls</option>
                <option value="Meters">Meters</option>
                <option value="Boxes">Boxes</option>
                <option value="Kgs">Kgs</option>
                <option value="Sets">Sets</option>
              </select>
            </div>
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Purchase Price (₹)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(Number(e.target.value) || 0)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded bg-white font-mono text-slate-900 font-semibold"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Selling Price (₹) *</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={sellingPrice}
                onChange={(e) => setSellingPrice(Number(e.target.value) || 0)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded bg-white font-mono text-slate-900 font-bold"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">MRP (Max Retail) (₹)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={mrp}
                onChange={(e) => setMrp(Number(e.target.value) || 0)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded bg-white font-mono text-slate-900"
              />
            </div>
          </div>

          {/* Stock Levels & Warehouse */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">
                {productToEdit ? 'Current Stock Level' : 'Initial Opening Stock'}
              </label>
              <input
                type="number"
                min="0"
                value={openingStock}
                onChange={(e) => setOpeningStock(Number(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md font-mono text-slate-900 font-bold"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Min Reorder Level</label>
              <input
                type="number"
                min="0"
                value={minStock}
                onChange={(e) => setMinStock(Number(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md font-mono text-slate-900"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Default Warehouse</label>
              <select
                value={warehouseId}
                onChange={(e) => setWarehouseId(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-slate-900"
              >
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Rack / Shelf Location</label>
              <input
                type="text"
                placeholder="e.g. Bay-04-A"
                value={rack}
                onChange={(e) => setRack(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-slate-900"
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 font-semibold text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm transition-colors flex items-center gap-2"
            >
              <Boxes className="w-4 h-4" />
              <span>{productToEdit ? 'Save Product Changes' : 'Save Product to Catalog'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CreateProductModal({
  isOpen,
  onClose,
  warehouses,
  productToEdit,
  onSaveProduct,
}: CreateProductModalProps) {
  if (!isOpen) return null;

  return (
    <ProductModalForm
      key={productToEdit ? productToEdit.id : 'new-product-modal'}
      productToEdit={productToEdit}
      warehouses={warehouses}
      onClose={onClose}
      onSaveProduct={onSaveProduct}
    />
  );
}
