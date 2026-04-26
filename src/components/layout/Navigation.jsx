import React from 'react';
import { Store, LineChart, ShoppingCart, Smartphone, Package, FileText, Users, History, Settings as SettingsIcon } from 'lucide-react';
import { formatPrice } from '../../utils/helpers';

export const Sidebar = ({ activeTab, setActiveTab, settings, todayProfit }) => {
  const menuItems = [
    { id: 'dashboard', icon: LineChart, label: 'Dashboard' },
    { id: 'pos', icon: ShoppingCart, label: 'Kasir' },
    { id: 'ppob', icon: Smartphone, label: 'Agen Digital' },
    { id: 'inventory', icon: Package, label: 'Stok Barang' },
    { id: 'stock_logs', icon: FileText, label: 'Log Stok' },
    { id: 'debts', icon: Users, label: 'Kas Bon' },
    { id: 'transactions', icon: History, label: 'Riwayat' },
    { id: 'settings', icon: SettingsIcon, label: 'Pengaturan' },
  ];

  return (
    <aside className="fixed left-0 top-0 hidden h-full w-64 flex-col border-r border-neutral-100 bg-neutral-50 p-6 lg:flex z-50">
      <div className="mb-10 flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20">
          <Store size={22} />
        </div>
        <div>
          <span className="text-xl font-bold tracking-tight block truncate w-32">{settings.shopName}</span>
          <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest leading-none">Minimal POS</span>
        </div>
      </div>
      <nav className="flex flex-col gap-1">
        {menuItems.map(item => (
          <button 
            key={item.id} 
            onClick={() => setActiveTab(item.id)} 
            className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all ${activeTab === item.id ? 'bg-primary text-white shadow-md' : 'text-neutral-500 hover:bg-neutral-200'}`}
          >
            <item.icon size={18} /><span>{item.label}</span>
          </button>
        ))}
      </nav>
      {settings.showProfitSidebar && (
        <div className="mt-auto p-4 bg-white border border-neutral-200 rounded-xl">
          <div className="text-[10px] font-bold text-neutral-400 uppercase mb-1">Profit Hari Ini</div>
          <div className="text-lg font-bold text-neutral-900">{formatPrice(todayProfit)}</div>
          <div className="mt-2 h-1 w-full bg-neutral-100 rounded-full overflow-hidden">
            <div className="h-full bg-green-500" style={{ width: '65%' }}></div>
          </div>
        </div>
      )}
    </aside>
  );
};

export const BottomNav = ({ activeTab, setActiveTab }) => {
  const items = [
    { id: 'dashboard', icon: LineChart, label: 'Beranda' },
    { id: 'pos', icon: ShoppingCart, label: 'Kasir' },
    { id: 'ppob', icon: Smartphone, label: 'Agen' },
    { id: 'inventory', icon: Package, label: 'Stok' },
    { id: 'transactions', icon: History, label: 'Riwayat' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around border-t border-neutral-100 bg-white/90 backdrop-blur-md lg:hidden px-2">
      {items.map(item => (
        <button 
          key={item.id} 
          onClick={() => setActiveTab(item.id)} 
          className={`flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors ${activeTab === item.id ? 'text-primary' : 'text-neutral-400'}`}
        >
          <item.icon size={20} />
          <span className="text-[9px] font-bold uppercase tracking-tighter">{item.label}</span>
        </button>
      ))}
    </nav>
  );
};
