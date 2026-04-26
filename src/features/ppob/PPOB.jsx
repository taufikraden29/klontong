import React from 'react';
import { Smartphone, Zap, Globe, Wallet, ArrowDownCircle, ArrowUpCircle, Cpu } from 'lucide-react';
import { PPOB_CATEGORIES } from '../../constants/appConstants';
import { formatPrice } from '../../utils/helpers';

export const PPOB = ({ 
  ppobType, 
  setPpobType, 
  ppobNumber, 
  setPpobNumber, 
  ppobAmount, 
  setPpobAmount, 
  ppobCost, 
  setPpobCost, 
  ppobPrice, 
  setPpobPrice, 
  ppobAdminFee, 
  setPpobAdminFee,
  finalizePpobTransaction 
}) => {
  const currentCategory = PPOB_CATEGORIES.find(c => c.id === ppobType);
  const Icon = currentCategory?.icon || Smartphone;

  return (
    <div className="animate-fade-in max-w-5xl mx-auto h-full">
      <header className="mb-8">
         <h1 className="text-2xl font-bold tracking-tight">Agen Digital & Perbankan</h1>
         <p className="text-sm text-neutral-400">Pencatatan Pulsa, Token PLN, Setor/Tarik Tunai, dll.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
         <div className="lg:col-span-2 space-y-4">
            <div className="card-minimal !p-6">
              <h3 className="text-[10px] font-bold mb-6 text-neutral-400 uppercase tracking-widest text-center lg:text-left">Pilih Layanan Digital</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-2 gap-3">
                 {PPOB_CATEGORIES.map(cat => (
                   <button key={cat.id} onClick={() => { setPpobType(cat.id); setPpobAmount(''); setPpobCost(''); setPpobPrice(''); setPpobAdminFee(''); }} className={`flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all ${ppobType === cat.id ? 'border-primary bg-primary/5 shadow-inner' : 'border-neutral-100 hover:border-neutral-200 bg-white'}`}>
                      <div className={`p-3 rounded-xl transition-all ${ppobType === cat.id ? 'bg-primary text-white scale-110' : `${cat.bg} ${cat.color}`}`}><cat.icon size={24} /></div>
                      <span className={`text-[9px] md:text-[10px] font-bold uppercase tracking-wider text-center leading-none ${ppobType === cat.id ? 'text-primary' : 'text-neutral-500'}`}>{cat.label}</span>
                   </button>
                 ))}
              </div>
            </div>
         </div>

         <div className="lg:col-span-3">
            <form onSubmit={finalizePpobTransaction} className="card-minimal !p-8 space-y-6">
               <div className="flex items-center gap-4 p-4 bg-neutral-900 rounded-2xl text-white mb-4">
                  <div className="p-3 bg-white/10 rounded-xl">
                     <Icon size={24} />
                  </div>
                  <div>
                     <div className="text-[10px] font-bold uppercase text-white/40 tracking-widest leading-none mb-1">Form Transaksi</div>
                     <div className="text-lg font-bold">{currentCategory?.label || 'Digital'}</div>
                  </div>
               </div>

               <div className="space-y-5">
                  <div>
                     <label className="text-[10px] font-bold uppercase text-neutral-400 block mb-2 tracking-wider">Nomor Tujuan / No. Rekening / ID Pel</label>
                     <input type="text" className="input-minimal h-12 text-lg font-bold tracking-widest" value={ppobNumber} onChange={e => setPpobNumber(e.target.value)} placeholder="08xx / 14xxx / 6022xxx" required />
                  </div>

                  {['setor', 'tarik'].includes(ppobType) ? (
                    <>
                      <div className="grid grid-cols-1 gap-4">
                         <div>
                            <label className="text-[10px] font-bold uppercase text-neutral-400 block mb-2 tracking-wider">Nominal Transaksi (Rp)</label>
                            <input type="number" className="input-minimal h-14 text-2xl font-bold" value={ppobAmount} onChange={e => setPpobAmount(e.target.value)} placeholder="0" required />
                         </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                         <div>
                            <label className="text-[10px] font-bold uppercase text-neutral-400 block mb-2 tracking-wider">Biaya Admin (Profit)</label>
                            <input type="number" className="input-minimal h-12" value={ppobAdminFee} onChange={e => { setPpobAdminFee(e.target.value); setPpobPrice(e.target.value); }} placeholder="Mis: 5000" required />
                         </div>
                         <div className="flex flex-col justify-end">
                            <div className="p-3 bg-neutral-50 border border-dashed border-neutral-200 rounded-xl text-center">
                               <div className="text-[8px] font-bold text-neutral-400 uppercase">Total Diterima Pelanggan</div>
                               <div className="text-xs font-bold">{ppobType === 'tarik' ? formatPrice(Number(ppobAmount) - Number(ppobAdminFee)) : formatPrice(Number(ppobAmount))}</div>
                            </div>
                         </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 gap-4">
                         <div>
                            <label className="text-[10px] font-bold uppercase text-neutral-400 block mb-2 tracking-wider">Produk / Nominal (Mis: 50k)</label>
                            <input type="text" className="input-minimal h-12" value={ppobAmount} onChange={e => setPpobAmount(e.target.value)} placeholder="Mis: 50.000" required />
                         </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                         <div>
                            <label className="text-[10px] font-bold uppercase text-neutral-400 block mb-2 tracking-wider">Harga Modal</label>
                            <input type="number" className="input-minimal h-12" value={ppobCost} onChange={e => setPpobCost(e.target.value)} placeholder="0" required />
                         </div>
                         <div>
                            <label className="text-[10px] font-bold uppercase text-neutral-400 block mb-2 tracking-wider">Harga Jual</label>
                            <input type="number" className="input-minimal h-12 text-primary font-bold" value={ppobPrice} onChange={e => setPpobPrice(e.target.value)} placeholder="0" required />
                         </div>
                      </div>
                    </>
                  )}

                  {(ppobPrice && (ppobCost || ppobAdminFee)) && (
                     <div className="p-4 bg-green-50 rounded-xl border border-green-100 flex items-center justify-between animate-fade-in">
                        <span className="text-[10px] font-bold text-green-600 uppercase tracking-widest">Keuntungan Transaksi</span>
                        <span className="text-sm font-bold text-green-700">{formatPrice(ppobType === 'tarik' || ppobType === 'setor' ? Number(ppobAdminFee) : Number(ppobPrice) - Number(ppobCost))}</span>
                     </div>
                  )}
               </div>

               <button type="submit" className="btn-primary w-full h-14 text-sm font-bold uppercase tracking-widest shadow-xl shadow-primary/20 transition-transform active:scale-95">PROSES & CATAT SEKARANG</button>
            </form>
         </div>
      </div>
    </div>
  );
};
