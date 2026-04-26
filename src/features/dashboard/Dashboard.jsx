import React, { useMemo } from 'react';
import { Clock, TrendingUp, Banknote, Package, Users, ArrowUpRight, CheckCircle2, AlertTriangle, Tag, Info } from 'lucide-react';
import { formatPrice, isSameDay } from '../../utils/helpers';

export const Dashboard = ({ transactions, products, debts, settings, todayRevenue, todayProfit, totalAsset, totalDebts, setActiveTab, categories }) => {
  const trendData = useMemo(() => {
    const data = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const rev = transactions.reduce((sum, t) => isSameDay(t.date, d) ? sum + t.total : sum, 0);
      data.push({ name: d.toLocaleDateString('id-ID', { weekday: 'short' }), revenue: rev });
    }
    return data;
  }, [transactions]);

  const topProducts = useMemo(() => {
    const counts = {};
    transactions.forEach(t => {
      t.items.forEach(item => { counts[item.name] = (counts[item.name] || 0) + item.quantity; });
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [transactions]);

  const recentActivity = transactions.slice(0, 5);
  const maxRev = Math.max(...trendData.map(d => d.revenue), 100000);

  return (
    <div className="animate-fade-in max-w-6xl mx-auto">
      <header className="mb-6 md:mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Halo, {settings.shopName}</h1>
          <p className="text-xs md:text-sm text-neutral-400 font-medium">Pantau kinerja bisnis Anda secara real-time.</p>
        </div>
        <div className="flex items-center gap-2 bg-neutral-50 px-4 py-2 rounded-2xl border border-neutral-100">
          <Clock size={16} className="text-neutral-400" />
          <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">{new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })}</span>
        </div>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-8 md:mb-10">
        {[
          { label: 'Pendapatan', value: formatPrice(todayRevenue), color: 'bg-green-500', icon: TrendingUp, sub: `${transactions.filter(t => isSameDay(t.date, new Date())).length} Transaksi` },
          { label: 'Profit', value: formatPrice(todayProfit), color: 'bg-blue-500', icon: Banknote, sub: 'Estimasi Bersih' },
          { label: 'Aset', value: formatPrice(totalAsset), color: 'bg-amber-500', icon: Package, sub: `${products.length} Jenis Produk` },
          { label: 'Hutang', value: formatPrice(totalDebts), color: 'bg-red-500', icon: Users, sub: 'Kas Bon Belum Lunas' }
        ].map((stat, i) => (
          <div key={i} className="card-minimal !p-4 md:!p-5 relative overflow-hidden group hover:border-primary/20 transition-all">
            <div className={`absolute top-0 right-0 h-16 w-16 -mr-6 -mt-6 rounded-full opacity-5 group-hover:opacity-10 transition-opacity ${stat.color}`}></div>
            <div className="flex items-start justify-between mb-3">
              <div className={`p-2 rounded-xl text-white shadow-lg ${stat.color} shadow-opacity-20`}>
                <stat.icon size={18} />
              </div>
            </div>
            <div className="text-[9px] md:text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1">{stat.label}</div>
            <div className="text-sm md:text-lg lg:text-xl font-bold truncate text-neutral-900 mb-1">{stat.value}</div>
            <div className="text-[8px] md:text-[9px] text-neutral-400 font-bold uppercase">{stat.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 md:gap-8">
        <div className="xl:col-span-2 space-y-6 md:space-y-8">
          <div className="card-minimal !p-6 md:!p-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-base md:text-lg font-bold">Tren Penjualan</h3>
                <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest">7 Hari Terakhir</p>
              </div>
              <div className="flex items-center gap-1 text-green-500 bg-green-50 px-2 py-1 rounded-lg text-[10px] font-bold">
                 <ArrowUpRight size={14} /> +12%
              </div>
            </div>
            <div className="flex h-40 md:h-56 items-end justify-between gap-1 md:gap-4 px-1">
              {trendData.map(day => (
                <div key={day.name} className="flex flex-1 flex-col items-center gap-3 group">
                   <div className="relative w-full flex flex-col justify-end h-full">
                     <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        <div className="bg-neutral-900 text-white text-[8px] font-bold px-2 py-1 rounded whitespace-nowrap">{formatPrice(day.revenue)}</div>
                     </div>
                     <div className="w-full rounded-t-lg bg-neutral-100 transition-all duration-300 group-hover:bg-primary/10" style={{ height: `${Math.max(8, (day.revenue / maxRev) * 100)}%` }}>
                       <div className="h-full w-full rounded-t-lg bg-primary opacity-20 group-hover:opacity-100 transition-all"></div>
                     </div>
                   </div>
                   <span className="text-[9px] md:text-[10px] font-bold text-neutral-400 uppercase tracking-tighter">{day.name}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card-minimal !p-6">
              <h3 className="text-sm md:text-base font-bold mb-6 flex items-center gap-2"><TrendingUp size={18} className="text-primary" /> Produk Terlaris</h3>
              <div className="space-y-4">
                {topProducts.length === 0 ? (
                  <div className="text-center py-10 text-neutral-300 italic text-[10px] font-bold uppercase">Belum ada data</div>
                ) : topProducts.map(([name, qty], i) => (
                  <div key={i} className="flex items-center justify-between group">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-8 w-8 rounded-lg bg-neutral-100 flex items-center justify-center text-[10px] font-bold text-neutral-400 group-hover:bg-primary group-hover:text-white transition-colors">{i+1}</div>
                      <div className="min-w-0">
                        <div className="text-[11px] font-bold truncate uppercase">{name}</div>
                        <div className="text-[9px] text-neutral-400 font-bold uppercase tracking-widest">{qty} Terjual</div>
                      </div>
                    </div>
                    <div className="h-1.5 w-16 bg-neutral-100 rounded-full overflow-hidden"><div className="h-full bg-primary" style={{ width: `${Math.max(20, 100 - (i*20))}%` }}></div></div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card-minimal !p-6">
              <h3 className="text-sm md:text-base font-bold mb-6 flex items-center gap-2"><Clock size={18} className="text-primary" /> Aktivitas Terakhir</h3>
              <div className="space-y-4">
                {recentActivity.length === 0 ? (
                  <div className="text-center py-10 text-neutral-300 italic text-[10px] font-bold uppercase">Belum ada transaksi</div>
                ) : recentActivity.map(t => (
                  <div key={t.id} className="flex items-center justify-between border-b border-neutral-50 pb-3 last:border-0 last:pb-0">
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-tight">{t.customerName}</div>
                      <div className="text-[9px] text-neutral-400 font-bold">{(t.displayDate || t.date).split(',')[1]} • {t.paymentMethod}</div>
                    </div>
                    <div className="text-[11px] font-bold text-neutral-900">{formatPrice(t.total)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card-minimal !p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm md:text-base font-bold flex items-center gap-2"><AlertTriangle size={18} className="text-red-500" /> Peringatan Stok</h3>
              <span className="text-[9px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">{products.filter(p => p.stock < settings.lowStockThreshold).length}</span>
            </div>
            <div className="space-y-3">
              {products.filter(p => p.stock < settings.lowStockThreshold).length === 0 ? (
                <div className="text-center py-8"><CheckCircle2 size={32} className="mx-auto mb-2 text-green-200" /><p className="text-[10px] text-neutral-400 font-bold uppercase">Semua stok aman</p></div>
              ) : products.filter(p => p.stock < settings.lowStockThreshold).slice(0, 8).map(p => (
                <div key={p.id} className="flex items-center justify-between gap-2 p-2 rounded-xl hover:bg-neutral-50 transition-colors">
                  <div className="text-[11px] flex-1 min-w-0">
                    <div className="font-bold truncate uppercase">{p.name}</div>
                    <div className="text-neutral-400 text-[9px] uppercase font-bold tracking-widest">{p.category}</div>
                  </div>
                  <div className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${p.stock <= 0 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                    {p.stock} {p.unit}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card-minimal !p-6 bg-neutral-900 text-white border-0 shadow-2xl">
            <h3 className="text-sm font-bold mb-4 flex items-center gap-2 text-white/90"><Tag size={16} /> Data Toko</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
                <div className="text-[8px] font-bold text-white/40 uppercase tracking-widest mb-1">Kategori</div>
                <div className="text-lg font-bold">{categories.length}</div>
              </div>
              <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
                <div className="text-[8px] font-bold text-white/40 uppercase tracking-widest mb-1">Total Item</div>
                <div className="text-lg font-bold">{products.reduce((s, p) => s + p.stock, 0)}</div>
              </div>
            </div>
            <button onClick={() => setActiveTab('settings')} className="w-full mt-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all">Pengaturan Data</button>
          </div>
        </div>
      </div>
    </div>
  );
};
