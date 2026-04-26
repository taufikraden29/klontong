import React from 'react';
import { Search, Plus, RefreshCw, Settings2, Edit2 } from 'lucide-react';
import { formatPrice } from '../../utils/helpers';

export const Inventory = ({ 
  products, 
  categories, 
  inventorySearch, 
  setInventorySearch, 
  selectedCategory, 
  setSelectedCategory,
  inventoryFilter,
  setInventoryFilter,
  settings,
  setShowRestockModal,
  setEditingProduct,
  setShowProductModal,
  setOpnameTarget,
  setShowOpnameModal
}) => {
  return (
    <div className="animate-fade-in max-w-6xl mx-auto">
       <div className="mb-6 md:mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div><h1 className="text-xl md:text-2xl font-bold capitalize">Stok Barang</h1><p className="text-xs md:text-sm text-neutral-400">Kelola data stok barang toko Anda.</p></div>
          <div className="flex gap-2">
             <button onClick={() => setShowRestockModal(true)} className="btn-secondary text-[10px] md:text-xs h-10 px-4 gap-2"><RefreshCw size={14} /> <span className="hidden sm:inline">Restok</span></button>
             <button onClick={() => { setEditingProduct(null); setShowProductModal(true); }} className="btn-primary text-[10px] md:text-xs h-10 px-4 gap-2"><Plus size={14} /> <span className="hidden sm:inline">Tambah Produk</span></button>
          </div>
       </div>
       
       <div className="mb-6 flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={16} />
             <input type="text" placeholder="Cari barang atau barcode..." className="input-minimal pl-10 pr-10 py-3 text-sm" value={inventorySearch} onChange={e => setInventorySearch(e.target.value)} />
          </div>
          <div className="flex gap-2">
             <select className="input-minimal flex-1 md:w-auto py-2 text-[10px] md:text-xs font-bold" value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}><option value="Semua">Kategori</option>{categories.map(c => <option key={c} value={c}>{c}</option>)}</select>
             <select className="input-minimal flex-1 md:w-auto py-2 text-[10px] md:text-xs font-bold" value={inventoryFilter} onChange={e => setInventoryFilter(e.target.value)}><option value="semua">Status</option><option value="rendah">Stok Rendah</option><option value="habis">Habis</option></select>
          </div>
       </div>

       <div className="card-minimal !p-0 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
             <table className="w-full text-left">
                <thead className="bg-neutral-50 text-[9px] md:text-[10px] font-bold text-neutral-400 uppercase tracking-widest border-b border-neutral-100">
                  <tr><th className="px-4 md:px-6 py-4">Produk</th><th className="px-4 md:px-6 py-4 hidden sm:table-cell">Kategori</th><th className="px-4 md:px-6 py-4">Harga</th><th className="px-4 md:px-6 py-4">Stok</th><th className="px-4 md:px-6 py-4 text-right">Aksi</th></tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 text-xs md:text-sm">
                  {products.filter(p => {
                       const matchesSearch = p.name.toLowerCase().includes(inventorySearch.toLowerCase()) || (p.barcode && p.barcode.includes(inventorySearch));
                       const matchesCat = selectedCategory === 'Semua' || p.category === selectedCategory;
                       const matchesFilter = inventoryFilter === 'semua' || (inventoryFilter === 'rendah' && p.stock < settings.lowStockThreshold && p.stock > 0) || (inventoryFilter === 'habis' && p.stock <= 0);
                       return matchesSearch && matchesCat && matchesFilter;
                     }).map(p => (
                       <tr key={p.id} className="hover:bg-neutral-50">
                         <td className="px-4 md:px-6 py-4"><div className="font-bold text-neutral-800 uppercase truncate max-w-[120px] md:max-w-none">{p.name}</div><div className="text-[9px] text-neutral-400 font-mono">{p.barcode || '-'}</div></td>
                         <td className="px-4 md:px-6 py-4 hidden sm:table-cell"><span className="rounded bg-neutral-100 px-2 py-0.5 text-[9px] font-bold uppercase text-neutral-500">{p.category}</span></td>
                         <td className="px-4 md:px-6 py-4"><div className="text-[10px] text-neutral-400 hidden md:block">{formatPrice(p.costPrice)}</div><div className="font-bold">{formatPrice(p.price)}</div></td>
                         <td className="px-4 md:px-6 py-4 text-center md:text-left"><div className={`inline-block rounded-full px-2 py-0.5 font-bold text-[10px] ${p.stock <= 0 ? 'bg-red-100 text-red-700' : p.stock < settings.lowStockThreshold ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>{p.stock} <span className="hidden md:inline">{p.unit}</span></div></td>
                         <td className="px-4 md:px-6 py-4 text-right"><div className="flex justify-end gap-1 md:gap-2"><button onClick={() => { setOpnameTarget(p); setShowOpnameModal(true); }} className="p-1.5 md:p-2 rounded-md hover:bg-neutral-100 text-neutral-400"><Settings2 size={14} md:size={16} /></button><button onClick={() => { setEditingProduct(p); setShowProductModal(true); }} className="p-1.5 md:p-2 rounded-md hover:bg-neutral-100 text-neutral-400"><Edit2 size={14} md:size={16} /></button></div></td>
                       </tr>
                     ))}
                </tbody>
             </table>
          </div>
       </div>
    </div>
  );
};
