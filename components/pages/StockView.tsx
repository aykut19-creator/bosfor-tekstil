import React, { useState, useRef } from 'react';
import { Product } from '../../types';
import { Plus, Search, FileDown, FileUp, Edit, Image as ImageIcon, CheckSquare, Square, Printer, Grid, X, Loader2, FileText } from 'lucide-react';
import * as XLSX from 'xlsx';

interface Props {
  products: Product[];
  onAdd: (p: Product) => void;
  onUpdate: (p: Product) => void;
  t: (key: string) => string;
}

export const StockView: React.FC<Props> = ({ products, onAdd, onUpdate, t }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewProduct, setViewProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Selection State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  // Form State
  const initialFormState: Omit<Product, 'id'> = {
    ean: '', 
    artikul: '', 
    marka: '', 
    markaKodu: '', 
    modelAdi: '', 
    renk: '', 
    renkKodu: '', 
    beden: '', 
    kumas: '', 
    kumasIcerik: '', 
    fotoKodu: '',
    cinsiyet: '',
    kategori: '',
    stok: 0, 
    maliyetFiyat: 0,
    fabrikaFiyat: 0, 
    satisFiyat: 0,
    imageUrl: ''
  };
  const [formData, setFormData] = useState(initialFormState);

  // Enhanced Search Logic
  const filteredProducts = products.filter(p => {
    const term = searchTerm.toLowerCase();
    return (
      p.modelAdi.toLowerCase().includes(term) || 
      p.artikul.toLowerCase().includes(term) ||
      p.ean.includes(term) ||
      p.marka.toLowerCase().includes(term) ||
      (p.kategori && p.kategori.toLowerCase().includes(term)) ||
      (p.cinsiyet && p.cinsiyet.toLowerCase().includes(term))
    );
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
       onUpdate({ ...formData, id: editingId });
    } else {
       onAdd({ ...formData, id: Date.now().toString() });
    }
    setIsModalOpen(false);
    setFormData(initialFormState);
    setEditingId(null);
  };

  const handleEdit = (e: React.MouseEvent, p: Product) => {
      e.stopPropagation(); // Prevent opening the view modal
      setFormData(p);
      setEditingId(p.id);
      setIsModalOpen(true);
  };

  const handleRowClick = (p: Product) => {
      setViewProduct(p);
  };

  // --- SELECTION LOGIC ---
  const handleSelectRow = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      setSelectedIds(prev => 
          prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
      );
  };

  const handleSelectAll = () => {
      if (selectedIds.length === filteredProducts.length) {
          setSelectedIds([]);
      } else {
          setSelectedIds(filteredProducts.map(p => p.id));
      }
  };

  const handlePrintCatalog = () => {
      window.print();
  };

  const handleDirectPrint = () => {
      setIsPrinting(true);
      // 1. Open the catalog view (render it into DOM)
      setIsCatalogOpen(true);
      
      // 2. Wait a moment for images to load and layout to settle
      setTimeout(() => {
          // 3. Trigger print
          window.print();
          setIsPrinting(false);
      }, 800); 
  };

  // --- EXPORT FUNCTIONALITY (XLSX) ---
  const handleExport = () => {
    const excelData = products.map(p => ({
      "BARKOD EAN13": p.ean,
      "ARTIKUL": p.artikul,
      "MARKA": p.marka,
      "MARKA KODU": p.markaKodu,
      "MODEL ADI": p.modelAdi,
      "RENK": p.renk,
      "RENK KODU": p.renkKodu,
      "BEDEN": p.beden,
      "KUMAS": p.kumas,
      "KUMAS_ICERIK": p.kumasIcerik,
      "FOTO_KODU": p.fotoKodu,
      "CİNSİYET": p.cinsiyet,
      "KATEGORİ": p.kategori,
      "STOK": p.stok,
      "FABRIKA MALIYET $": p.maliyetFiyat,
      "FABRIKA FIYAT $": p.fabrikaFiyat,
      "MOSKOVA SATIS $": p.satisFiyat,
      "RESIM LINK": p.imageUrl || '' 
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Stok Listesi");
    XLSX.writeFile(workbook, `Stock_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // --- IMPORT FUNCTIONALITY (XLSX) ---
  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const data = event.target?.result;
      if (!data) return;

      const workbook = XLSX.read(data, { type: 'binary' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(sheet);

      let updatedCount = 0;
      let newCount = 0;

      jsonData.forEach((row: any) => {
        const ean = (row["BARKOD EAN13"] || row["BARKOD"] || "").toString();
        if (!ean) return; 

        const val = (v: any) => v ? v.toString().trim() : "";
        const num = (v: any) => parseFloat(v) || 0;
        const int = (v: any) => parseInt(v) || 0;

        const productData = {
          ean: ean,
          artikul: val(row["ARTIKUL"]),
          marka: val(row["MARKA"]),
          markaKodu: val(row["MARKA KODU"]),
          modelAdi: val(row["MODEL ADI"]),
          renk: val(row["RENK"]),
          renkKodu: val(row["RENK KODU"]),
          beden: val(row["BEDEN"]),
          kumas: val(row["KUMAS"]),
          kumasIcerik: val(row["KUMAS_ICERIK"]),
          fotoKodu: val(row["FOTO_KODU"]),
          cinsiyet: val(row["CİNSİYET"] || row["GENDER"] || row["SEX"]),
          kategori: val(row["KATEGORİ"] || row["CATEGORY"] || row["CAT"]),
          stok: int(row["STOK"]),
          maliyetFiyat: num(row["FABRIKA MALIYET $"] || row["MALIYET"] || row["COST"]),
          fabrikaFiyat: num(row["FABRIKA FIYAT $"] || row["FABRIKA $"] || row["FACTORY"]),
          satisFiyat: num(row["MOSKOVA SATIS $"] || row["MOCKBA $"] || row["PRICE"]),
          imageUrl: val(row["RESIM LINK"])
        };

        const existingProduct = products.find(p => p.ean === ean);

        if (existingProduct) {
          onUpdate({ ...existingProduct, ...productData });
          updatedCount++;
        } else {
          onAdd({ id: `imp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, ...productData });
          newCount++;
        }
      });

      alert(`Import Complete!\nUpdated: ${updatedCount}\nAdded: ${newCount}`);
      if(fileInputRef.current) fileInputRef.current.value = ''; 
    };
    reader.readAsBinaryString(file);
  };

  const selectedProducts = products.filter(p => selectedIds.includes(p.id));

  return (
    <div className="space-y-6">
       {/* 
          CRITICAL PRINT STYLES: 
          1. Hides everything (#root) by default.
          2. Shows only the catalog container.
          3. Resets overflow to allow multi-page printing.
       */}
       <style>{`
        @media print {
            @page {
                size: A4 portrait;
                margin: 10mm;
            }
            
            body, html {
                height: auto;
                overflow: visible;
                background: white;
            }

            /* Hide the entire application UI */
            body > * {
                display: none !important;
            }

            /* Display strictly the print catalog container */
            #printable-catalog {
                display: block !important;
                position: absolute !important;
                top: 0;
                left: 0;
                width: 100%;
                height: auto;
                z-index: 9999;
                background: white;
                overflow: visible !important;
            }
            
            .no-print {
                display: none !important;
            }

            .catalog-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 20px;
                width: 100%;
            }

            .catalog-item {
                break-inside: avoid;
                page-break-inside: avoid;
                border: 1px solid #e2e8f0;
                background: white;
                margin-bottom: 20px;
            }

            .catalog-image {
                height: 300px;
                width: 100%;
                object-fit: contain;
                background: #f8fafc;
            }
        }
      `}</style>

      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".xlsx, .xls" className="hidden" />

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={20} />
          <input
            type="text"
            placeholder={t('search')}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 flex-wrap sm:flex-nowrap">
            {selectedIds.length > 0 && (
                <>
                    <button onClick={() => setIsCatalogOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg hover:bg-indigo-100 font-bold transition-all">
                        <Grid size={18} />
                        {t('createCatalog')} ({selectedIds.length})
                    </button>
                    <button 
                        onClick={handleDirectPrint} 
                        disabled={isPrinting}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-bold shadow-md transition-all disabled:opacity-75"
                    >
                        {isPrinting ? <Loader2 size={18} className="animate-spin"/> : <FileText size={18} />}
                        {isPrinting ? '...' : t('saveAsPdf')}
                    </button>
                </>
            )}
            <button onClick={handleImportClick} className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 font-medium border border-green-200">
              <FileUp size={18} />
              <span className="hidden sm:inline">{t('import')}</span>
            </button>
            <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 font-medium border border-blue-200">
              <FileDown size={18} />
              <span className="hidden sm:inline">{t('export')}</span>
            </button>
            <button onClick={() => { setEditingId(null); setIsModalOpen(true); }} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold shadow-md">
              <Plus size={18} />
              <span className="hidden sm:inline">{t('newProduct')}</span>
            </button>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="p-4 w-10">
                    <button onClick={handleSelectAll} className="text-slate-400 hover:text-slate-600">
                        {selectedIds.length === filteredProducts.length && filteredProducts.length > 0 ? <CheckSquare size={20}/> : <Square size={20}/>}
                    </button>
                </th>
                <th className="p-4 font-semibold text-slate-500">{t('imageLink')}</th>
                <th className="p-4 font-semibold text-slate-500">{t('model')}</th>
                <th className="p-4 font-semibold text-slate-500">{t('article')} / {t('barcode')}</th>
                <th className="p-4 font-semibold text-slate-500">{t('brand')}</th>
                <th className="p-4 font-semibold text-slate-500">{t('color')} / {t('size')}</th>
                <th className="p-4 font-semibold text-slate-500 text-right">{t('costPrice')}</th>
                <th className="p-4 font-semibold text-slate-500 text-right">{t('factoryPrice')}</th>
                <th className="p-4 font-semibold text-slate-500 text-right">{t('salePrice')}</th>
                <th className="p-4 font-semibold text-slate-500 text-center">{t('stockCount')}</th>
                <th className="p-4 font-semibold text-slate-500 text-center">{t('action')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.map((product) => (
                <tr 
                    key={product.id} 
                    onClick={() => handleRowClick(product)}
                    className={`hover:bg-blue-50 transition-colors cursor-pointer ${selectedIds.includes(product.id) ? 'bg-blue-50/50' : ''}`}
                >
                  <td className="p-4" onClick={(e) => handleSelectRow(e, product.id)}>
                      {selectedIds.includes(product.id) ? <CheckSquare size={20} className="text-blue-600"/> : <Square size={20} className="text-slate-300"/>}
                  </td>
                  <td className="p-4">
                    <div className="h-12 w-12 bg-slate-100 rounded-lg border border-slate-200 flex items-center justify-center overflow-hidden">
                      {product.imageUrl ? (
                        <img src={product.imageUrl.split(',')[0]} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <ImageIcon size={20} className="text-slate-400" />
                      )}
                    </div>
                  </td>
                  <td className="p-4 font-medium text-slate-800">
                      <div>{product.modelAdi}</div>
                      <div className="text-xs text-slate-400">{product.cinsiyet} - {product.kategori}</div>
                  </td>
                  <td className="p-4 text-slate-500">
                    <div className="font-mono text-xs">{product.artikul}</div>
                    <div className="text-[10px] text-slate-400">{product.ean}</div>
                  </td>
                  <td className="p-4"><span className="px-2 py-1 bg-slate-100 rounded text-xs font-bold text-slate-600">{product.marka}</span></td>
                  <td className="p-4 text-slate-600">{product.renk} <span className="text-slate-300">/</span> {product.beden}</td>
                  <td className="p-4 text-right font-mono text-slate-400 text-xs">${product.maliyetFiyat}</td>
                  <td className="p-4 text-right font-mono text-slate-500 text-xs">${product.fabrikaFiyat}</td>
                  <td className="p-4 text-right font-bold text-green-600">${product.satisFiyat}</td>
                  <td className="p-4 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${product.stok > 10 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {product.stok}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <button onClick={(e) => handleEdit(e, product)} className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors">
                      <Edit size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

       {/* CATALOG MODAL (A4 PRINT OPTIMIZED) */}
       {/* We keep this ID 'printable-catalog' to target it specifically in CSS */}
       {isCatalogOpen && (
           <div id="printable-catalog" className="fixed inset-0 bg-black/80 z-[60] overflow-y-auto flex items-start justify-center p-4">
               <div className="bg-white w-full max-w-[210mm] min-h-[297mm] shadow-2xl mx-auto">
                    {/* Header */}
                   <div className="p-8 border-b-2 border-slate-800 flex justify-between items-end bg-white">
                       <div>
                           <h1 className="text-4xl font-black text-slate-900 tracking-tight">PRODUCT CATALOG</h1>
                           <p className="text-slate-500 mt-2">{new Date().toLocaleDateString()}</p>
                       </div>
                       <div className="flex gap-2 no-print">
                           <button onClick={handlePrintCatalog} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-bold shadow-lg hover:bg-blue-700">
                               <Printer size={20}/> {t('printCatalog')}
                           </button>
                           <button onClick={() => setIsCatalogOpen(false)} className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg font-bold hover:bg-slate-300">
                               {t('close')}
                           </button>
                       </div>
                   </div>

                   {/* Catalog Grid */}
                   <div className="p-8 catalog-grid grid grid-cols-1 md:grid-cols-2 gap-8">
                       {selectedProducts.map(p => (
                           <div key={p.id} className="catalog-item border border-slate-200 bg-white flex flex-col shadow-sm">
                               <div className="catalog-image h-[350px] bg-slate-50 flex items-center justify-center border-b border-slate-100 relative overflow-hidden">
                                   {p.imageUrl ? (
                                       <img src={p.imageUrl.split(',')[0]} className="h-full w-full object-contain p-4" alt={p.modelAdi} />
                                   ) : (
                                       <ImageIcon size={64} className="text-slate-300" />
                                   )}
                                   <div className="absolute top-4 right-4 bg-slate-800 text-white text-xs font-bold px-2 py-1 rounded">
                                       {p.marka}
                                   </div>
                                   {p.cinsiyet && <div className="absolute bottom-4 left-4 bg-white/90 text-slate-700 text-xs font-bold px-2 py-1 rounded shadow-sm border border-slate-200">{p.cinsiyet}</div>}
                               </div>
                               <div className="p-6 flex-1 flex flex-col">
                                   <h3 className="text-xl font-black text-slate-800 mb-1 uppercase tracking-wide">{p.modelAdi}</h3>
                                   <p className="text-xs text-slate-400 font-mono mb-4">{p.ean}</p>
                                   
                                   <div className="space-y-2 text-sm flex-1">
                                       <div className="flex justify-between border-b border-slate-50 pb-1">
                                           <span className="text-slate-500">{t('article')}:</span>
                                           <span className="font-bold text-slate-700">{p.artikul}</span>
                                       </div>
                                       <div className="flex justify-between border-b border-slate-50 pb-1">
                                           <span className="text-slate-500">{t('category')}:</span>
                                           <span className="font-bold text-slate-700">{p.kategori}</span>
                                       </div>
                                       <div className="flex justify-between border-b border-slate-50 pb-1">
                                           <span className="text-slate-500">{t('color')}:</span>
                                           <span className="font-bold text-slate-700 uppercase">{p.renk}</span>
                                       </div>
                                       <div className="flex justify-between border-b border-slate-50 pb-1">
                                           <span className="text-slate-500">{t('size')}:</span>
                                           <span className="font-bold text-slate-700">{p.beden}</span>
                                       </div>
                                       <div className="flex justify-between border-b border-slate-50 pb-1">
                                           <span className="text-slate-500">{t('fabric')}:</span>
                                           <span className="font-bold text-slate-700">{p.kumas} / {p.kumasIcerik}</span>
                                       </div>
                                   </div>

                                   <div className="mt-6 pt-4 border-t-2 border-slate-100 flex justify-end items-center">
                                       <div className="text-right">
                                           <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">MOSKOVA SATIŞ ($)</p>
                                           <p className="text-3xl font-black text-green-600">${p.satisFiyat.toFixed(2)}</p>
                                       </div>
                                   </div>
                               </div>
                           </div>
                       ))}
                   </div>
               </div>
           </div>
       )}

      {/* Edit/Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-4xl shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                <h3 className="font-bold text-slate-800 text-lg">{editingId ? t('editProduct') : t('newProduct')}</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 text-2xl hover:text-red-500">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-1">
                     <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t('barcode')}</label>
                     <input className="w-full p-2 border border-slate-300 rounded bg-slate-50 font-mono" value={formData.ean} onChange={e => setFormData({...formData, ean: e.target.value})} />
                </div>
                <div className="md:col-span-1">
                     <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t('article')}</label>
                     <input className="w-full p-2 border border-slate-300 rounded" value={formData.artikul} onChange={e => setFormData({...formData, artikul: e.target.value})} />
                </div>
                <div className="md:col-span-1">
                     <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t('model')}</label>
                     <input required className="w-full p-2 border border-slate-300 rounded font-bold" value={formData.modelAdi} onChange={e => setFormData({...formData, modelAdi: e.target.value})} />
                </div>

                <div className="md:col-span-1">
                     <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t('brand')}</label>
                     <input className="w-full p-2 border border-slate-300 rounded" value={formData.marka} onChange={e => setFormData({...formData, marka: e.target.value})} />
                </div>
                <div className="md:col-span-1">
                     <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t('category')}</label>
                     <input className="w-full p-2 border border-slate-300 rounded" value={formData.kategori} onChange={e => setFormData({...formData, kategori: e.target.value})} />
                </div>
                <div className="md:col-span-1">
                     <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t('gender')}</label>
                     <select className="w-full p-2 border border-slate-300 rounded" value={formData.cinsiyet} onChange={e => setFormData({...formData, cinsiyet: e.target.value})}>
                        <option value="">...</option>
                        <option value="Kadın">Kadın</option>
                        <option value="Erkek">Erkek</option>
                        <option value="Çocuk">Çocuk</option>
                        <option value="Unisex">Unisex</option>
                     </select>
                </div>

                <div className="md:col-span-3 grid grid-cols-4 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t('color')}</label>
                        <input className="w-full p-2 border border-slate-300 rounded" value={formData.renk} onChange={e => setFormData({...formData, renk: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t('size')}</label>
                        <input className="w-full p-2 border border-slate-300 rounded" value={formData.beden} onChange={e => setFormData({...formData, beden: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t('fabric')}</label>
                        <input className="w-full p-2 border border-slate-300 rounded" value={formData.kumas} onChange={e => setFormData({...formData, kumas: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Stok</label>
                        <input type="number" className="w-full p-2 border border-slate-300 rounded font-bold text-blue-600" value={formData.stok} onChange={e => setFormData({...formData, stok: parseInt(e.target.value)})} />
                    </div>
                </div>

                <div className="md:col-span-3 grid grid-cols-3 gap-4 border-t border-slate-200 pt-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1">{t('costPrice')}</label>
                        <input type="number" step="0.01" className="w-full p-2 border border-slate-300 rounded bg-slate-50" value={formData.maliyetFiyat} onChange={e => setFormData({...formData, maliyetFiyat: parseFloat(e.target.value)})} />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t('factoryPrice')}</label>
                        <input type="number" step="0.01" className="w-full p-2 border border-slate-300 rounded" value={formData.fabrikaFiyat} onChange={e => setFormData({...formData, fabrikaFiyat: parseFloat(e.target.value)})} />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-green-600 uppercase mb-1">{t('salePrice')}</label>
                        <input type="number" step="0.01" className="w-full p-2 border-2 border-green-200 rounded focus:border-green-500 font-bold text-lg" value={formData.satisFiyat} onChange={e => setFormData({...formData, satisFiyat: parseFloat(e.target.value)})} />
                    </div>
                </div>

                <div className="md:col-span-3">
                     <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t('imageLink')} (Virgül ile ayırın)</label>
                     <input className="w-full p-2 border border-slate-300 rounded text-xs" value={formData.imageUrl} onChange={e => setFormData({...formData, imageUrl: e.target.value})} placeholder="https://..." />
                </div>

                <div className="md:col-span-3 flex justify-end gap-3 pt-4 border-t border-slate-100">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 bg-slate-100 rounded hover:bg-slate-200">{t('cancel')}</button>
                    <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded font-bold hover:bg-blue-700 shadow-md">{t('save')}</button>
                </div>
            </form>
          </div>
        </div>
      )}

      {/* Product Detail Modal (Single View) */}
      {viewProduct && !isModalOpen && !isCatalogOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col md:flex-row h-[600px]">
                  <div className="md:w-1/2 bg-slate-100 flex items-center justify-center p-8 relative">
                       {viewProduct.imageUrl ? (
                           <img src={viewProduct.imageUrl.split(',')[0]} className="max-h-full max-w-full object-contain drop-shadow-xl" alt="" />
                       ) : (
                           <ImageIcon size={64} className="text-slate-300"/>
                       )}
                       <div className="absolute top-4 left-4">
                           <span className="bg-white/90 backdrop-blur text-slate-800 px-3 py-1 rounded-full text-xs font-bold shadow-sm">{viewProduct.marka}</span>
                       </div>
                  </div>
                  <div className="md:w-1/2 p-8 flex flex-col overflow-y-auto">
                      <div className="flex justify-between items-start mb-6">
                          <div>
                              <h2 className="text-3xl font-black text-slate-800 uppercase leading-tight">{viewProduct.modelAdi}</h2>
                              <p className="text-slate-400 font-mono mt-1">{viewProduct.ean}</p>
                          </div>
                          <button onClick={() => setViewProduct(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                              <X size={24} className="text-slate-400"/>
                          </button>
                      </div>

                      <div className="grid grid-cols-2 gap-6 mb-8">
                          <div>
                              <p className="text-xs font-bold text-slate-400 uppercase">{t('category')}</p>
                              <p className="font-semibold text-slate-700">{viewProduct.kategori || '-'}</p>
                          </div>
                          <div>
                              <p className="text-xs font-bold text-slate-400 uppercase">{t('gender')}</p>
                              <p className="font-semibold text-slate-700">{viewProduct.cinsiyet || '-'}</p>
                          </div>
                          <div>
                              <p className="text-xs font-bold text-slate-400 uppercase">{t('color')}</p>
                              <p className="font-semibold text-slate-700">{viewProduct.renk}</p>
                          </div>
                          <div>
                              <p className="text-xs font-bold text-slate-400 uppercase">{t('size')}</p>
                              <p className="font-semibold text-slate-700">{viewProduct.beden}</p>
                          </div>
                          <div className="col-span-2">
                              <p className="text-xs font-bold text-slate-400 uppercase">{t('fabric')}</p>
                              <p className="font-semibold text-slate-700">{viewProduct.kumas} {viewProduct.kumasIcerik && `(${viewProduct.kumasIcerik})`}</p>
                          </div>
                      </div>

                      <div className="mt-auto bg-slate-50 p-6 rounded-xl border border-slate-100">
                          <div className="grid grid-cols-2 gap-8 items-end">
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase mb-1">{t('stockCount')}</p>
                                    <p className={`text-3xl font-black ${viewProduct.stok > 0 ? 'text-slate-800' : 'text-red-500'}`}>{viewProduct.stok}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-bold text-green-600 uppercase mb-1">{t('salePrice')}</p>
                                    <p className="text-4xl font-black text-green-600">${viewProduct.satisFiyat}</p>
                                </div>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};