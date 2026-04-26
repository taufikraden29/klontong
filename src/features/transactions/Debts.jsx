import React from 'react';
import { Plus } from 'lucide-react';
import { formatPrice } from '../../utils/helpers';

export const Debts = ({ debts, setDebts, notify, setShowDebtModal }) => {
  return (
    <div className="animate-fade-in max-w-6xl mx-auto">
       <div className="mb-6 md:mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div><h1 className="text-xl md:text-2xl font-bold capitalize">Kas Bon</h1><p className="text-xs md:text-sm text-neutral-400">Kelola daftar hutang pelanggan.</p></div>
          <button onClick={() => setShowDebtModal(true)} className="btn-primary text-[10px] md:text-xs h-10 px-4 gap-2"><Plus size={14} /> Tambah Kas Bon</button>
       </div>
       <div className="card-minimal !p-0 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
             <table className="w-full text-left">
                <thead className="bg-neutral-50 text-[9px] font-bold text-neutral-400 uppercase tracking-widest border-b border-neutral-100">
                  <tr><th className="px-4 md:px-6 py-4">Tanggal</th><th className="px-4 md:px-6 py-4">Pelanggan</th><th className="px-4 md:px-6 py-4">Jumlah</th><th className="px-4 md:px-6 py-4">Status</th><th className="px-4 md:px-6 py-4 text-right">Aksi</th></tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 text-xs">
                  {debts.map(debt => (
                    <tr key={debt.id} className="hover:bg-neutral-50">
                      <td className="px-4 md:px-6 py-4 text-neutral-400 text-[10px]">{(debt.displayDate || debt.date)}</td>
                      <td className="px-4 md:px-6 py-4 font-bold uppercase">{debt.name}</td>
                      <td className="px-4 md:px-6 py-4 font-bold">{formatPrice(debt.amount)}</td>
                      <td className="px-4 md:px-6 py-4">
                        <span className={`inline-flex items-center gap-1 text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${debt.status === 'Lunas' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                          {debt.status}
                        </span>
                      </td>
                      <td className="px-4 md:px-6 py-4 text-right">
                        {debt.status === 'Belum Lunas' && (
                          <button onClick={() => {
                            setDebts(prev => prev.map(d => d.id === debt.id ? { ...d, status: 'Lunas' } : d));
                            notify('Kas bon dilunasi');
                          }} className="text-primary font-bold uppercase text-[9px] hover:underline">Lunaskan</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
             </table>
          </div>
       </div>
    </div>
  );
};
