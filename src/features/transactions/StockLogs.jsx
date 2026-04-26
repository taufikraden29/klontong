import React from 'react';

export const StockLogs = ({ stockLogs }) => {
  return (
    <div className="animate-fade-in max-w-6xl mx-auto">
       <div className="mb-6 md:mb-10">
          <h1 className="text-xl md:text-2xl font-bold capitalize">Log Stok</h1>
          <p className="text-xs md:text-sm text-neutral-400">Lacak riwayat perubahan stok barang (Masuk/Keluar/Penyesuaian).</p>
       </div>
       <div className="card-minimal !p-0 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
             <table className="w-full text-left">
                <thead className="bg-neutral-50 text-[9px] md:text-[10px] font-bold text-neutral-400 uppercase tracking-widest border-b border-neutral-100">
                  <tr><th className="px-4 md:px-6 py-4">Waktu</th><th className="px-4 md:px-6 py-4">Produk</th><th className="px-4 md:px-6 py-4">Tipe</th><th className="px-4 md:px-6 py-4">Jumlah</th><th className="px-4 md:px-6 py-4 hidden sm:table-cell">Keterangan</th></tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 text-xs">
                  {stockLogs.map(log => (
                    <tr key={log.id} className="hover:bg-neutral-50">
                      <td className="px-4 md:px-6 py-4 text-neutral-400 text-[10px]">{(log.displayDate || log.date)}</td>
                      <td className="px-4 md:px-6 py-4 font-bold uppercase">{log.productName}</td>
                      <td className="px-4 md:px-6 py-4"><span className={`inline-flex items-center gap-1 text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${log.type === 'IN' ? 'bg-green-50 text-green-600' : log.type === 'OUT' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>{log.type}</span></td>
                      <td className="px-4 md:px-6 py-4 font-bold">{log.amount > 0 ? `+${log.amount}` : log.amount}</td>
                      <td className="px-4 md:px-6 py-4 hidden sm:table-cell text-neutral-400 italic">{log.reason}</td>
                    </tr>
                  ))}
                </tbody>
             </table>
          </div>
       </div>
    </div>
  );
};
