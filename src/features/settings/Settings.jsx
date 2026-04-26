import React from 'react';
import { Store, Printer, Monitor, ListFilter, X, Plus, Database, Download, Upload, ShieldCheck, AlertCircle, Info } from 'lucide-react';

export const Settings = ({ 
  settings, 
  updateSetting, 
  categories, 
  addCategory, 
  deleteCategory, 
  exportAllData, 
  importAllData, 
  setShowResetConfirm 
}) => {
  return (
    <div className="animate-fade-in max-w-5xl mx-auto space-y-8">
      <header>
         <h1 className="text-2xl font-bold tracking-tight">Pengaturan Toko</h1>
         <p className="text-sm text-neutral-400">Konfigurasi identitas toko, tampilan, dan manajemen data.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         <div className="space-y-8">
           <div className="card-minimal !p-6">
              <h3 className="text-base font-bold mb-6 flex items-center gap-3"><Store size={20} className="text-primary" /> Profil Toko</h3>
              <div className="space-y-4">
                 <div>
                    <label className="text-[10px] font-bold uppercase text-neutral-400 block mb-1.5 tracking-wider">Nama Toko</label>
                    <input type="text" className="input-minimal h-11" value={settings.shopName} onChange={e => updateSetting('shopName', e.target.value)} />
                 </div>
                 <div>
                    <label className="text-[10px] font-bold uppercase text-neutral-400 block mb-1.5 tracking-wider">Alamat</label>
                    <input type="text" className="input-minimal h-11" value={settings.shopAddress} onChange={e => updateSetting('shopAddress', e.target.value)} />
                 </div>
                 <div>
                    <label className="text-[10px] font-bold uppercase text-neutral-400 block mb-1.5 tracking-wider">Nomor Telepon</label>
                    <input type="text" className="input-minimal h-11" value={settings.shopPhone} onChange={e => updateSetting('shopPhone', e.target.value)} />
                 </div>
              </div>
           </div>

           <div className="card-minimal !p-6">
              <h3 className="text-base font-bold mb-6 flex items-center gap-3"><Printer size={20} className="text-primary" /> Pengaturan Struk</h3>
              <div className="space-y-4">
                 <div>
                    <label className="text-[10px] font-bold uppercase text-neutral-400 block mb-1.5 tracking-wider">Pesan Kaki Struk (Footer)</label>
                    <textarea className="input-minimal min-h-[80px] py-3" value={settings.receiptFooter} onChange={e => updateSetting('receiptFooter', e.target.value)} />
                 </div>
              </div>
           </div>
         </div>

         <div className="space-y-8">
           <div className="card-minimal !p-6">
              <h3 className="text-base font-bold mb-6 flex items-center gap-3"><Monitor size={20} className="text-primary" /> Tampilan & Notifikasi</h3>
              <div className="space-y-6">
                 <div className="flex items-center justify-between">
                    <div>
                       <div className="text-sm font-bold">Tampilkan Profit Harian</div>
                       <div className="text-[10px] text-neutral-400 uppercase font-bold">Di Sidebar Desktop</div>
                    </div>
                    <button onClick={() => updateSetting('showProfitSidebar', !settings.showProfitSidebar)} className={`w-12 h-6 rounded-full transition-colors relative ${settings.showProfitSidebar ? 'bg-primary' : 'bg-neutral-200'}`}>
                       <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${settings.showProfitSidebar ? 'left-7' : 'left-1'}`}></div>
                    </button>
                 </div>
                 <div>
                    <label className="text-[10px] font-bold uppercase text-neutral-400 block mb-1.5 tracking-wider">Ambang Batas Stok Rendah</label>
                    <input type="number" className="input-minimal h-11" value={settings.lowStockThreshold} onChange={e => updateSetting('lowStockThreshold', parseInt(e.target.value) || 0)} />
                 </div>
              </div>
           </div>

           <div className="card-minimal !p-6">
              <h3 className="text-base font-bold mb-6 flex items-center gap-3"><ListFilter size={20} className="text-primary" /> Kelola Kategori</h3>
              <div className="space-y-4">
                 <div className="flex gap-2">
                    <input id="new-cat" type="text" className="input-minimal flex-1 h-10 text-xs px-3" placeholder="Nama kategori baru..." onKeyDown={(e) => { if(e.key === 'Enter') { addCategory(e.target.value); e.target.value = ''; } }} />
                    <button onClick={() => { const el = document.getElementById('new-cat'); addCategory(el.value); el.value = ''; }} className="btn-primary h-10 w-10 !p-0"><Plus size={18} /></button>
                 </div>
                 <div className="flex flex-wrap gap-2">{categories.map(c => (<span key={c} className="flex items-center gap-2 rounded-full bg-neutral-100 px-3 py-1.5 text-[10px] font-bold text-neutral-600 border border-neutral-200">{c} <button onClick={() => deleteCategory(c)} className="text-neutral-300 hover:text-red-500"><X size={12} /></button></span>))}</div>
              </div>
           </div>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
         <div className="card-minimal !p-6">
           <h3 className="text-base font-bold mb-6 flex items-center gap-3"><Database size={20} className="text-primary" /> Manajemen Data</h3>
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button onClick={exportAllData} className="btn-secondary justify-start gap-3 h-12 px-4 text-[10px] font-bold uppercase tracking-widest"><Download size={16} /> Cadangkan (.json)</button>
              <label className="btn-secondary justify-start gap-3 h-12 px-4 text-[10px] font-bold uppercase tracking-widest cursor-pointer"><Upload size={16} /> Pulihkan Data<input type="file" className="hidden" accept=".json" onChange={importAllData} /></label>
           </div>
         </div>

         <div className="card-minimal !p-6 border-red-50 bg-red-50/10">
           <h3 className="text-base font-bold mb-6 flex items-center gap-3 text-red-600"><ShieldCheck size={20} /> Zona Bahaya</h3>
           <button onClick={() => setShowResetConfirm(true)} className="flex items-center justify-center gap-3 w-full h-12 rounded-xl bg-red-100 text-red-600 text-[10px] font-bold uppercase tracking-widest hover:bg-red-200 transition-colors"><AlertCircle size={16} /> Hapus Semua Data Aplikasi</button>
         </div>
      </div>

      <div className="text-center pt-10 pb-6 text-neutral-300 text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2">
         <Info size={12} /> Versi Aplikasi 1.2.0 • Build 2026.04.26
      </div>
    </div>
  );
};
