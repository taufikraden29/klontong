import React from 'react';
import { formatPrice } from '../../utils/helpers';

export const History = ({ transactions }) => {
  return (
    <div className="animate-fade-in max-w-6xl mx-auto">
       <div className="mb-6 md:mb-10">
          <h1 className="text-xl md:text-2xl font-bold capitalize">Riwayat Transaksi</h1>
          <p className="text-xs md:text-sm text-neutral-400">Daftar semua transaksi yang pernah dilakukan.</p>
       </div>
       <div className="card-minimal !p-0 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
             <table className="w-full text-left">
                <thead className="bg-neutral-50 text-[9px] font-bold text-neutral-400 uppercase tracking-widest border-b border-neutral-100">
                  <tr><th className="px-4 md:px-6 py-4">Waktu</th><th className="px-4 md:px-6 py-4">Pelanggan</th><th className="px-4 md:px-6 py-4">Total</th><th className="px-4 md:px-6 py-4 hidden sm:table-cell">Metode</th></tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 text-xs">
                  {transactions.map(t => (
                    <tr key={t.id} className="hover:bg-neutral-50">
                      <td className="px-4 md:px-6 py-4 text-neutral-400 text-[10px]">{(t.displayDate || t.date)}</td>
                      <td className="px-4 md:px-6 py-4"><div className="font-bold uppercase">{t.customerName}</div><div className="text-[9px] text-neutral-300">ID {t.id.slice(-6)}</div></td>
                      <td className="px-4 md:px-6 py-4 font-bold">{formatPrice(t.total)}</td>
                      <td className="px-4 md:px-6 py-4 hidden sm:table-cell"><span className="text-[9px] font-bold uppercase text-neutral-400 bg-neutral-100 px-2 py-0.5 rounded-full">{t.paymentMethod}</span></td>
                    </tr>
                  ))}
                </tbody>
             </table>
          </div>
       </div>
    </div>
  );
};
