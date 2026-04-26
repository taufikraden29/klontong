import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  ShoppingCart, 
  Package, 
  History, 
  Plus, 
  Search, 
  Trash2, 
  X,
  Store,
  ScanLine,
  Edit2,
  RefreshCw,
  LineChart,
  Users,
  Settings as SettingsIcon,
  Eraser,
  Download,
  Upload,
  Database,
  Printer,
  ChevronRight,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  Minus,
  CheckCircle2,
  QrCode,
  Banknote,
  Percent,
  ListFilter,
  FileText,
  Settings2,
  ArrowUpRight,
  ArrowDownRight,
  Keyboard
} from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';

// --- INITIAL DATA ---
const INITIAL_PRODUCTS = [
  { id: 1, name: 'Beras Madura 5kg', costPrice: 65000, price: 75000, stock: 20, unit: 'Bag', category: 'Pokok', barcode: '8991234567890' },
  { id: 2, name: 'Indomie Goreng', costPrice: 2400, price: 3000, stock: 100, unit: 'Pcs', category: 'Makanan', barcode: '8998866200505' },
  { id: 3, name: 'Kopi Kapal Api 165g', costPrice: 12500, price: 15000, stock: 50, unit: 'Sachet', category: 'Minuman', barcode: '8992696404118' },
  { id: 4, name: 'Minyak Goreng 1L', costPrice: 15000, price: 18000, stock: 30, unit: 'Pcs', category: 'Pokok', barcode: '8999999000001' },
];

const INITIAL_CATEGORIES = ['Pokok', 'Makanan', 'Minuman', 'Rokok', 'Cemilan', 'Lainnya'];
const QUICK_CASH = [5000, 10000, 20000, 50000, 100000];

const formatPrice = (amount) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};

export default function App() {
  // --- STATE ---
  const [activeTab, setActiveTab] = useState('dashboard');
  const [products, setProducts] = useState(() => {
    const saved = localStorage.getItem('klontong_products');
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
  });
  const [categories, setCategories] = useState(() => {
    const saved = localStorage.getItem('klontong_categories');
    return saved ? JSON.parse(saved) : INITIAL_CATEGORIES;
  });
  const [cart, setCart] = useState([]);
  const [transactions, setTransactions] = useState(() => {
    const saved = localStorage.getItem('klontong_transactions');
    return saved ? JSON.parse(saved) : [];
  });
  const [debts, setDebts] = useState(() => {
    const saved = localStorage.getItem('klontong_debts');
    return saved ? JSON.parse(saved) : [];
  });
  const [stockLogs, setStockLogs] = useState(() => {
    const saved = localStorage.getItem('klontong_stock_logs');
    return saved ? JSON.parse(saved) : [];
  });
  const [notifications, setNotifications] = useState([]);
  
  // UI State
  const [searchTerm, setSearchTerm] = useState('');
  const [discount, setDiscount] = useState(0);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Tunai');
  const [debtCustomerName, setDebtCustomerName] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [inventorySearch, setInventorySearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showDebtModal, setShowDebtModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [lastReceipt, setLastReceipt] = useState(null);
  const [scannerMode, setScannerMode] = useState('pos');
  const [scannedBarcode, setScannedBarcode] = useState('');
  const [searchTarget, setSearchTarget] = useState('pos');
  const [restockCart, setRestockCart] = useState([]);
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [showMobileCart, setShowMobileCart] = useState(false);
  const [inventoryFilter, setInventoryFilter] = useState('semua');
  const [showOpnameModal, setShowOpnameModal] = useState(false);
  const [opnameTarget, setOpnameTarget] = useState(null);

  const barcodeBuffer = useRef('');
  const lastKeyTime = useRef(0);

  // Persistence
  useEffect(() => { localStorage.setItem('klontong_products', JSON.stringify(products)); }, [products]);
  useEffect(() => { localStorage.setItem('klontong_transactions', JSON.stringify(transactions)); }, [transactions]);
  useEffect(() => { localStorage.setItem('klontong_debts', JSON.stringify(debts)); }, [debts]);
  useEffect(() => { localStorage.setItem('klontong_categories', JSON.stringify(categories)); }, [categories]);
  useEffect(() => { localStorage.setItem('klontong_stock_logs', JSON.stringify(stockLogs)); }, [stockLogs]);

  // Global Keyboard Listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'F2') { e.preventDefault(); if (cart.length > 0) setShowPaymentModal(true); }
      if (e.key === 'Escape') { 
        setShowPaymentModal(false); setShowScannerModal(false); 
        setShowProductModal(false); setShowReceiptModal(false); 
        setShowDebtModal(false); setShowRestockModal(false);
        setShowMobileCart(false); setShowOpnameModal(false);
      }
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      const now = Date.now();
      if (now - lastKeyTime.current > 100) barcodeBuffer.current = '';
      lastKeyTime.current = now;
      if (e.key === 'Enter') { if (barcodeBuffer.current.length > 2) { handleBarcodeScanned(barcodeBuffer.current); barcodeBuffer.current = ''; } }
      else if (e.key.length === 1) barcodeBuffer.current += e.key;
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [products, cart]);

  // Scanner Logic
  useEffect(() => {
    let scanner = null;
    if (showScannerModal) {
      scanner = new Html5QrcodeScanner('reader', { 
        fps: 10, 
        qrbox: { width: 250, height: 250 },
        rememberLastUsedCamera: true
      });
      scanner.render((decodedText) => {
        handleBarcodeScanned(decodedText);
        scanner.clear();
        setShowScannerModal(false);
      }, () => {});
    }
    return () => { if (scanner) scanner.clear().catch(() => {}); };
  }, [showScannerModal]);

  const notify = (message, type = 'success') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 3000);
  };

  const addStockLog = (productId, productName, type, amount, reason) => {
    const newLog = { id: Date.now(), productId, productName, type, amount, reason, date: new Date().toLocaleString('id-ID') };
    setStockLogs(prev => [newLog, ...prev].slice(0, 100));
  };

  const handleBarcodeScanned = (code) => {
    if (scannerMode === 'product') { setScannedBarcode(code); notify(`Barcode: ${code}`); return; }
    if (scannerMode === 'search') {
      if (searchTarget === 'pos') setSearchTerm(code);
      else setInventorySearch(code);
      return;
    }
    if (scannerMode === 'restock') {
      const product = products.find(p => p.barcode === code);
      if (product) addToRestock(product);
      else notify(`Produk tidak ditemukan!`, 'error');
      return;
    }
    const product = products.find(p => p.barcode === code);
    if (product) { addToCart(product); notify(`Scan: ${product.name}`); }
    else notify(`Barcode ${code} tidak terdaftar!`, 'error');
  };

  const addToCart = (product) => {
    if (product.stock <= 0) { notify('Stok habis!', 'error'); return; }
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) { notify('Stok tidak mencukupi!', 'warning'); return prev; }
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1, itemDiscount: 0 }];
    });
  };

  const addToRestock = (product) => {
    setRestockCart(prev => {
      if (prev.find(item => item.id === product.id)) return prev;
      return [...prev, { ...product, addedQty: 10, newCostPrice: product.costPrice }];
    });
  };

  const updateCartQuantity = (id, newQty) => {
    const qty = Math.max(1, parseInt(newQty) || 1);
    const product = products.find(p => p.id === id);
    if (qty > product.stock) { notify(`Stok sisa ${product.stock}`, 'warning'); return; }
    setCart(prev => prev.map(item => item.id === id ? { ...item, quantity: qty } : item));
  };

  const cartSubtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity) - (item.itemDiscount || 0), 0);
  const cartTotal = Math.max(0, cartSubtotal - discount);

  const finalizeTransaction = () => {
    if (cart.length === 0) return;
    const total = cartTotal;
    const totalCost = cart.reduce((sum, item) => sum + (item.costPrice * item.quantity), 0);
    if (paymentMethod === 'Tunai' && Number(paymentAmount) < total) { notify('Uang kurang!', 'error'); return; }
    if (paymentMethod === 'Hutang' && !debtCustomerName) { notify('Nama wajib diisi!', 'warning'); return; }

    const transactionId = `TRX-${Date.now()}`;
    const newTransaction = {
      id: transactionId, date: new Date().toLocaleString('id-ID'),
      items: [...cart], subtotal: cartSubtotal, discount: discount, total: total, profit: total - totalCost,
      paidAmount: paymentMethod === 'Tunai' ? Number(paymentAmount) : (paymentMethod === 'Hutang' ? 0 : total),
      change: paymentMethod === 'Tunai' ? Math.max(0, Number(paymentAmount) - total) : 0,
      paymentMethod, customerName: paymentMethod === 'Hutang' ? debtCustomerName : 'Umum'
    };

    if (paymentMethod === 'Hutang') {
      setDebts(prev => [{ id: Date.now(), name: debtCustomerName, amount: total, date: new Date().toLocaleDateString('id-ID'), status: 'Belum Lunas' }, ...prev]);
    }

    setProducts(prev => prev.map(p => {
      const cartItem = cart.find(item => item.id === p.id);
      if (cartItem) {
        addStockLog(p.id, p.name, 'OUT', cartItem.quantity, `Penjualan ${transactionId}`);
        return { ...p, stock: p.stock - cartItem.quantity };
      }
      return p;
    }));

    setTransactions(prev => [newTransaction, ...prev]);
    setLastReceipt(newTransaction);
    setCart([]); setDiscount(0); setPaymentAmount(''); setDebtCustomerName('');
    setShowPaymentModal(false); setShowReceiptModal(true);
    notify('Transaksi Berhasil!');
  };

  const saveProduct = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const productData = {
      id: editingProduct ? editingProduct.id : Date.now(),
      name: formData.get('name'), barcode: formData.get('barcode'),
      costPrice: Number(formData.get('costPrice')), price: Number(formData.get('price')),
      stock: Number(formData.get('stock')), unit: formData.get('unit'), category: formData.get('category'),
    };
    if (editingProduct) {
      if (editingProduct.stock !== productData.stock) {
        addStockLog(productData.id, productData.name, 'ADJUST', productData.stock - editingProduct.stock, 'Edit Manual');
      }
      setProducts(prev => prev.map(p => p.id === editingProduct.id ? productData : p));
    } else {
      setProducts(prev => [...prev, productData]);
      addStockLog(productData.id, productData.name, 'IN', productData.stock, 'Produk Baru');
    }
    setShowProductModal(false); setEditingProduct(null); notify('Produk disimpan');
  };

  const finalizeRestock = () => {
    setProducts(prev => prev.map(p => {
      const item = restockCart.find(i => i.id === p.id);
      if (item) {
        addStockLog(p.id, p.name, 'IN', item.addedQty, 'Restok Barang Masuk');
        return { ...p, stock: p.stock + Number(item.addedQty), costPrice: Number(item.newCostPrice) };
      }
      return p;
    }));
    setRestockCart([]); setShowRestockModal(false); notify('Stok diperbarui');
  };

  const finalizeOpname = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const newStock = Number(formData.get('newStock'));
    const reason = formData.get('reason');
    const diff = newStock - opnameTarget.stock;
    setProducts(prev => prev.map(p => p.id === opnameTarget.id ? { ...p, stock: newStock } : p));
    addStockLog(opnameTarget.id, opnameTarget.name, 'ADJUST', diff, `Opname: ${reason}`);
    setShowOpnameModal(false); setOpnameTarget(null); notify('Stok disesuaikan');
  };

  const addCategory = (name) => {
    if (!name || categories.includes(name)) return;
    setCategories(prev => [...prev, name]); notify(`Kategori ${name} ditambahkan`);
  };

  const deleteCategory = (name) => {
    setCategories(prev => prev.filter(c => c !== name)); notify(`Kategori ${name} dihapus`);
  };

  const exportAllData = () => {
    const data = { products, transactions, debts, categories, stockLogs, exportDate: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = `backup_klontong_${new Date().toLocaleDateString()}.json`; link.click();
  };

  const importAllData = (e) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (data.products) setProducts(data.products);
        if (data.transactions) setTransactions(data.transactions);
        if (data.debts) setDebts(data.debts);
        if (data.categories) setCategories(data.categories);
        if (data.stockLogs) setStockLogs(data.stockLogs);
        notify('Data dipulihkan');
      } catch (err) { notify('Gagal import data', 'error'); }
    };
    reader.readAsText(file);
  };

  // Stats
  const todayTransactions = transactions.filter(t => t.date.includes(new Date().toLocaleDateString('id-ID')));
  const todayRevenue = todayTransactions.reduce((s, t) => s + t.total, 0);
  const todayProfit = todayTransactions.reduce((s, t) => s + t.profit, 0);
  const totalAsset = products.reduce((s, p) => s + (p.costPrice * p.stock), 0);
  const totalDebts = debts.filter(d => d.status === 'Belum Lunas').reduce((s, d) => s + d.amount, 0);

  const trendData = useMemo(() => {
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const str = d.toLocaleDateString('id-ID');
      const rev = transactions.filter(t => t.date.includes(str)).reduce((s, t) => s + t.total, 0);
      data.push({ name: d.toLocaleDateString('id-ID', { weekday: 'short' }), revenue: rev });
    }
    return data;
  }, [transactions]);

  const maxRev = Math.max(...trendData.map(d => d.revenue), 100000);

  return (
    <div className="flex min-h-screen bg-white font-inter">
      {/* --- SIDEBAR (Desktop) --- */}
      <aside className="fixed left-0 top-0 hidden h-full w-64 flex-col border-r border-neutral-100 bg-neutral-50 p-6 lg:flex z-50">
        <div className="mb-10 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary text-white flex items-center justify-center"><Store size={22} /></div>
          <div><span className="text-xl font-bold tracking-tight block">Klontong</span><span className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest">Minimal POS</span></div>
        </div>
        <nav className="flex flex-col gap-1">
          {[
            { id: 'dashboard', icon: LineChart, label: 'Dashboard' },
            { id: 'pos', icon: ShoppingCart, label: 'Kasir' },
            { id: 'inventory', icon: Package, label: 'Stok Barang' },
            { id: 'stock_logs', icon: FileText, label: 'Log Stok' },
            { id: 'debts', icon: Users, label: 'Kas Bon' },
            { id: 'transactions', icon: History, label: 'Riwayat' },
            { id: 'settings', icon: SettingsIcon, label: 'Pengaturan' },
          ].map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id)} className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all ${activeTab === item.id ? 'bg-primary text-white shadow-sm' : 'text-neutral-500 hover:bg-neutral-200'}`}>
              <item.icon size={18} /><span>{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="mt-auto p-4 bg-white border border-neutral-200 rounded-xl">
           <div className="text-[10px] font-bold text-neutral-400 uppercase mb-1">Profit Hari Ini</div>
           <div className="text-lg font-bold text-neutral-900">{formatPrice(todayProfit)}</div>
        </div>
      </aside>

      {/* --- BOTTOM NAV (Mobile) --- */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around border-t border-neutral-100 bg-white/90 backdrop-blur-md lg:hidden px-2">
        {[
          { id: 'dashboard', icon: LineChart, label: 'Beranda' },
          { id: 'pos', icon: ShoppingCart, label: 'Kasir' },
          { id: 'inventory', icon: Package, label: 'Stok' },
          { id: 'debts', icon: Users, label: 'Kas Bon' },
          { id: 'transactions', icon: History, label: 'Riwayat' },
        ].map(item => (
          <button key={item.id} onClick={() => setActiveTab(item.id)} className={`flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors ${activeTab === item.id ? 'text-primary' : 'text-neutral-400'}`}>
            <item.icon size={20} />
            <span className="text-[9px] font-bold uppercase tracking-tighter">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* --- MAIN CONTENT --- */}
      <main className={`flex-1 lg:ml-64 p-4 md:p-8 lg:p-10 ${activeTab === 'pos' ? 'pb-24 lg:pb-10' : 'pb-20 lg:pb-10'}`}>
        {activeTab === 'dashboard' && (
          <div className="animate-fade-in max-w-6xl mx-auto">
            <header className="mb-6 md:mb-10"><h1 className="text-xl md:text-2xl font-bold">Halo, Selamat Datang</h1><p className="text-xs md:text-sm text-neutral-400">Ringkasan toko Anda untuk hari ini.</p></header>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-6 md:mb-10">
              {[{ label: 'Pendapatan', value: formatPrice(todayRevenue), color: 'border-green-500' }, { label: 'Profit', value: formatPrice(todayProfit), color: 'border-blue-500' }, { label: 'Aset', value: formatPrice(totalAsset), color: 'border-amber-500' }, { label: 'Hutang', value: formatPrice(totalDebts), color: 'border-primary' }].map((stat, i) => (
                <div key={i} className={`card-minimal border-l-4 !p-3 md:!p-5 ${stat.color}`}>
                  <div className="text-[9px] md:text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1 md:mb-2">{stat.label}</div>
                  <div className="text-sm md:text-lg lg:text-xl font-bold truncate">{stat.value}</div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="card-minimal xl:col-span-2 !p-4 md:!p-8">
                <div className="flex items-center justify-between mb-6 md:mb-8"><h3 className="text-sm md:text-base font-bold">Tren Penjualan</h3><div className="text-[10px] text-neutral-400 font-bold">7 HARI TERAKHIR</div></div>
                <div className="flex h-36 md:h-48 items-end justify-between gap-1 md:gap-3 px-1 md:px-2">
                  {trendData.map(day => (
                    <div key={day.name} className="flex flex-1 flex-col items-center gap-2 group">
                       <div className="relative w-full flex flex-col justify-end h-full">
                         <div className="w-full rounded-t-sm md:rounded-t-md bg-neutral-100 transition-all duration-300 group-hover:bg-primary/10" style={{ height: `${Math.max(5, (day.revenue / maxRev) * 100)}%` }}>
                           <div className="h-full w-full rounded-t-sm md:rounded-t-md bg-primary opacity-20 group-hover:opacity-100 transition-opacity"></div>
                         </div>
                       </div>
                       <span className="text-[8px] md:text-[10px] font-bold text-neutral-400 uppercase">{day.name}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="card-minimal !p-4 md:!p-8">
                <h3 className="text-sm md:text-base font-bold mb-6">Peringatan Stok</h3>
                <div className="space-y-3">
                  {products.filter(p => p.stock < 10).length === 0 ? (<div className="text-center py-8"><CheckCircle2 size={32} className="mx-auto mb-2 text-green-200" /><p className="text-[10px] text-neutral-400 font-bold uppercase">Semua stok aman</p></div>) : products.filter(p => p.stock < 10).slice(0, 6).map(p => (
                    <div key={p.id} className="flex items-center justify-between gap-2"><div className="text-[11px] flex-1 min-w-0"><div className="font-bold truncate">{p.name}</div><div className="text-neutral-400 text-[9px] uppercase">{p.category}</div></div><div className="text-[11px] font-bold text-red-600 whitespace-nowrap">{p.stock} {p.unit}</div></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'pos' && (
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6 md:gap-8 animate-fade-in items-start h-full">
            <section className="flex flex-col h-full">
              <div className="mb-4 md:mb-6 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h1 className="text-xl md:text-2xl font-bold">Kasir</h1>
                  <div className="flex items-center gap-2 lg:hidden">
                    <button onClick={() => { setScannerMode('search'); setSearchTarget('pos'); setShowScannerModal(true); }} className="p-2 rounded-lg bg-neutral-100 text-neutral-600"><ScanLine size={20} /></button>
                  </div>
                </div>
                <div className="relative w-full">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
                  <input type="text" placeholder="Cari nama atau scan (F1)..." className="input-minimal pl-11 h-12 md:h-14 text-sm md:text-base" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} autoFocus />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 hidden lg:flex items-center gap-2">
                    <button onClick={() => { setScannerMode('search'); setSearchTarget('pos'); setShowScannerModal(true); }} className="p-1 text-neutral-400 hover:text-primary transition-colors" title="Scan Barcode"><ScanLine size={20} /></button>
                  </div>
                </div>
              </div>
              <div className="mb-4 md:mb-6 flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
                <button onClick={() => setSelectedCategory('Semua')} className={`whitespace-nowrap rounded-full px-5 py-2 text-[10px] md:text-xs font-bold transition-all border ${selectedCategory === 'Semua' ? 'bg-neutral-900 text-white border-neutral-900' : 'bg-white text-neutral-500 border-neutral-200'}`}>Semua</button>
                {categories.map(cat => (
                  <button key={cat} onClick={() => setSelectedCategory(cat)} className={`whitespace-nowrap rounded-full px-5 py-2 text-[10px] md:text-xs font-bold transition-all border ${selectedCategory === cat ? 'bg-neutral-900 text-white border-neutral-900' : 'bg-white text-neutral-500 border-neutral-200'}`}>{cat}</button>
                ))}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4 overflow-y-auto pr-1">
                {products.filter(p => (selectedCategory === 'Semua' || p.category === selectedCategory) && (p.name.toLowerCase().includes(searchTerm.toLowerCase()) || (p.barcode && p.barcode.includes(searchTerm)))).map(p => (
                  <button key={p.id} onClick={() => addToCart(p)} className={`card-minimal !p-3 md:!p-4 text-left flex flex-col h-full hover:border-primary/30 active:scale-95 transition-all ${p.stock <= 0 ? 'opacity-40 grayscale cursor-not-allowed' : 'bg-white'}`} disabled={p.stock <= 0}>
                    <div className="text-[8px] md:text-[9px] font-bold text-neutral-400 uppercase mb-1">{p.category}</div>
                    <div className="mb-2 md:mb-3 flex-1 text-[11px] md:text-sm font-bold text-neutral-800 leading-snug line-clamp-2 uppercase">{p.name}</div>
                    <div className="flex items-end justify-between gap-1 mt-auto"><div className="text-xs md:text-base font-bold text-primary">{formatPrice(p.price)}</div><div className={`text-[9px] md:text-[10px] font-bold px-2 py-0.5 rounded-full ${p.stock < 10 ? 'bg-red-50 text-red-600' : 'bg-neutral-50 text-neutral-400'}`}>Stok {p.stock}</div></div>
                  </button>
                ))}
              </div>
            </section>
            <aside className="sticky top-10 flex flex-col gap-4 hidden xl:flex">
              <div className="card-minimal !p-0 flex h-[calc(100vh-120px)] flex-col overflow-hidden border-2 border-neutral-100 shadow-xl">
                <div className="border-b border-neutral-100 p-5 flex items-center justify-between bg-neutral-50"><h2 className="text-sm font-bold flex items-center gap-2"><ShoppingCart size={16} /> Keranjang</h2><button onClick={() => setCart([])} className="text-neutral-400 hover:text-red-500 transition-colors"><Eraser size={16} /></button></div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-white">
                  {cart.length === 0 ? (<div className="flex h-full flex-col items-center justify-center text-neutral-300 opacity-50"><ShoppingCart size={40} strokeWidth={1} className="mb-4" /><p className="text-[10px] font-bold uppercase tracking-widest">Kosong</p></div>) : cart.map(item => (
                    <div key={item.id} className="flex flex-col gap-2 p-3 rounded-xl border border-neutral-100 hover:border-neutral-200 transition-all bg-neutral-50/30">
                      <div className="flex justify-between items-start gap-2"><div className="flex-1 min-w-0"><div className="text-[11px] font-bold truncate text-neutral-800 uppercase">{item.name}</div><div className="text-[10px] text-neutral-400 font-medium">{formatPrice(item.price)} / {item.unit}</div></div><button onClick={() => setCart(prev => prev.filter(i => i.id !== item.id))} className="text-neutral-300 hover:text-red-500 p-1"><X size={14} /></button></div>
                      <div className="flex items-center justify-between gap-2 mt-1">
                        <div className="flex items-center rounded-lg bg-white border border-neutral-200 p-0.5">
                          <button onClick={() => updateCartQuantity(item.id, item.quantity - 1)} className="h-7 w-7 rounded-md flex items-center justify-center hover:bg-neutral-50 transition-colors"><Minus size={10} /></button>
                          <input type="number" className="w-8 md:w-10 bg-transparent text-center text-xs font-bold border-none outline-none focus:ring-0 p-0" value={item.quantity} onChange={(e) => updateCartQuantity(item.id, e.target.value)} />
                          <button onClick={() => updateCartQuantity(item.id, item.quantity + 1)} className="h-7 w-7 rounded-md flex items-center justify-center hover:bg-neutral-50 transition-colors"><Plus size={10} /></button>
                        </div>
                        <div className="text-xs font-bold text-neutral-800">{formatPrice(item.price * item.quantity)}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="bg-neutral-50 p-5 border-t border-neutral-100 space-y-4">
                  <div className="space-y-2"><div className="flex justify-between text-[10px] font-bold text-neutral-400 uppercase tracking-wider"><span>Subtotal</span><span>{formatPrice(cartSubtotal)}</span></div><div className="flex items-center justify-between gap-4"><span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Diskon</span><input type="number" className="w-24 bg-white border border-neutral-200 text-right text-xs font-bold px-2 py-1 rounded" value={discount} onChange={(e) => setDiscount(Math.max(0, parseInt(e.target.value) || 0))} /></div><div className="flex justify-between text-base font-bold border-t border-neutral-200 pt-3 text-neutral-900 uppercase"><span>Total</span><span className="text-primary">{formatPrice(cartTotal)}</span></div></div>
                  <button onClick={() => setShowPaymentModal(true)} disabled={cart.length === 0} className="btn-primary w-full h-14 text-xs font-bold uppercase shadow-lg shadow-primary/20 tracking-widest transition-transform active:scale-95">Bayar (F2)</button>
                </div>
              </div>
            </aside>
            <button onClick={() => setShowMobileCart(true)} className={`fixed bottom-20 right-4 z-40 flex h-14 md:h-16 items-center gap-3 rounded-full bg-neutral-900 px-5 md:px-6 text-white shadow-2xl lg:hidden transform transition-all active:scale-90 ${cart.length > 0 ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0 pointer-events-none'}`}>
              <div className="relative"><ShoppingCart size={22} /><span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold ring-2 ring-neutral-900">{cart.length}</span></div>
              <div className="flex flex-col items-start leading-none"><span className="text-[8px] font-bold text-neutral-400 uppercase tracking-widest">Total Bayar</span><span className="text-sm md:text-base font-bold">{formatPrice(cartTotal)}</span></div>
            </button>
          </div>
        )}

        {['inventory', 'stock_logs', 'debts', 'transactions'].includes(activeTab) && (
          <div className="animate-fade-in max-w-6xl mx-auto">
             <div className="mb-6 md:mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div><h1 className="text-xl md:text-2xl font-bold capitalize">{activeTab.replace('_', ' ')}</h1><p className="text-xs md:text-sm text-neutral-400">Kelola data {activeTab} toko Anda.</p></div>
                <div className="flex gap-2">
                   {activeTab === 'inventory' && (<><button onClick={() => setShowRestockModal(true)} className="btn-secondary text-[10px] md:text-xs h-10 px-4 gap-2"><RefreshCw size={14} /> <span className="hidden sm:inline">Restok</span></button><button onClick={() => { setEditingProduct(null); setShowProductModal(true); }} className="btn-primary text-[10px] md:text-xs h-10 px-4 gap-2"><Plus size={14} /> <span className="hidden sm:inline">Tambah Produk</span></button></>)}
                   {activeTab === 'debts' && <button onClick={() => setShowDebtModal(true)} className="btn-primary text-[10px] md:text-xs h-10 px-4 gap-2"><Plus size={14} /> Tambah Kas Bon</button>}
                </div>
             </div>
             {activeTab === 'inventory' && (
                <div className="mb-6 flex flex-col md:flex-row gap-3">
                   <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={16} />
                      <input type="text" placeholder="Cari barang atau barcode..." className="input-minimal pl-10 pr-10 py-3 text-sm" value={inventorySearch} onChange={e => setInventorySearch(e.target.value)} />
                      <button onClick={() => { setScannerMode('search'); setSearchTarget('inventory'); setShowScannerModal(true); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-primary" title="Scan Barcode"><ScanLine size={18} /></button>
                   </div>
                   <div className="flex gap-2">
                      <select className="input-minimal flex-1 md:w-auto py-2 text-[10px] md:text-xs font-bold" value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}><option value="Semua">Kategori</option>{categories.map(c => <option key={c} value={c}>{c}</option>)}</select>
                      <select className="input-minimal flex-1 md:w-auto py-2 text-[10px] md:text-xs font-bold" value={inventoryFilter} onChange={e => setInventoryFilter(e.target.value)}><option value="semua">Status</option><option value="rendah">Stok Rendah</option><option value="habis">Habis</option></select>
                   </div>
                </div>
             )}
             <div className="card-minimal !p-0 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                   <table className="w-full text-left">
                      {activeTab === 'inventory' && (
                        <>
                          <thead className="bg-neutral-50 text-[9px] md:text-[10px] font-bold text-neutral-400 uppercase tracking-widest border-b border-neutral-100"><tr><th className="px-4 md:px-6 py-4">Produk</th><th className="px-4 md:px-6 py-4 hidden sm:table-cell">Kategori</th><th className="px-4 md:px-6 py-4">Harga</th><th className="px-4 md:px-6 py-4">Stok</th><th className="px-4 md:px-6 py-4 text-right">Aksi</th></tr></thead>
                          <tbody className="divide-y divide-neutral-100 text-xs md:text-sm">{products.filter(p => {
                               const matchesSearch = p.name.toLowerCase().includes(inventorySearch.toLowerCase()) || (p.barcode && p.barcode.includes(inventorySearch));
                               const matchesCat = selectedCategory === 'Semua' || p.category === selectedCategory;
                               const matchesFilter = inventoryFilter === 'semua' || (inventoryFilter === 'rendah' && p.stock < 10 && p.stock > 0) || (inventoryFilter === 'habis' && p.stock <= 0);
                               return matchesSearch && matchesCat && matchesFilter;
                             }).map(p => (<tr key={p.id} className="hover:bg-neutral-50"><td className="px-4 md:px-6 py-4"><div className="font-bold text-neutral-800 uppercase truncate max-w-[120px] md:max-w-none">{p.name}</div><div className="text-[9px] text-neutral-400 font-mono">{p.barcode || '-'}</div></td><td className="px-4 md:px-6 py-4 hidden sm:table-cell"><span className="rounded bg-neutral-100 px-2 py-0.5 text-[9px] font-bold uppercase text-neutral-500">{p.category}</span></td><td className="px-4 md:px-6 py-4"><div className="text-[10px] text-neutral-400 hidden md:block">{formatPrice(p.costPrice)}</div><div className="font-bold">{formatPrice(p.price)}</div></td><td className="px-4 md:px-6 py-4 text-center md:text-left"><div className={`inline-block rounded-full px-2 py-0.5 font-bold text-[10px] ${p.stock <= 0 ? 'bg-red-100 text-red-700' : p.stock < 10 ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>{p.stock} <span className="hidden md:inline">{p.unit}</span></div></td><td className="px-4 md:px-6 py-4 text-right"><div className="flex justify-end gap-1 md:gap-2"><button onClick={() => { setOpnameTarget(p); setShowOpnameModal(true); }} className="p-1.5 md:p-2 rounded-md hover:bg-neutral-100 text-neutral-400"><Settings2 size={14} md:size={16} /></button><button onClick={() => { setEditingProduct(p); setShowProductModal(true); }} className="p-1.5 md:p-2 rounded-md hover:bg-neutral-100 text-neutral-400"><Edit2 size={14} md:size={16} /></button></div></td></tr>))}</tbody>
                        </>
                      )}
                      {activeTab === 'stock_logs' && (
                        <>
                          <thead className="bg-neutral-50 text-[9px] md:text-[10px] font-bold text-neutral-400 uppercase tracking-widest border-b border-neutral-100"><tr><th className="px-4 md:px-6 py-4">Waktu</th><th className="px-4 md:px-6 py-4">Produk</th><th className="px-4 md:px-6 py-4">Tipe</th><th className="px-4 md:px-6 py-4">Jumlah</th><th className="px-4 md:px-6 py-4 hidden sm:table-cell">Keterangan</th></tr></thead>
                          <tbody className="divide-y divide-neutral-100 text-xs">{stockLogs.map(log => (<tr key={log.id} className="hover:bg-neutral-50"><td className="px-4 md:px-6 py-4 text-neutral-400 text-[10px]">{log.date}</td><td className="px-4 md:px-6 py-4 font-bold uppercase">{log.productName}</td><td className="px-4 md:px-6 py-4"><span className={`inline-flex items-center gap-1 text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${log.type === 'IN' ? 'bg-green-50 text-green-600' : log.type === 'OUT' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>{log.type}</span></td><td className="px-4 md:px-6 py-4 font-bold">{log.amount > 0 ? `+${log.amount}` : log.amount}</td><td className="px-4 md:px-6 py-4 hidden sm:table-cell text-neutral-400 italic">{log.reason}</td></tr>))}</tbody>
                        </>
                      )}
                      {activeTab === 'transactions' && (
                        <>
                          <thead className="bg-neutral-50 text-[9px] font-bold text-neutral-400 uppercase tracking-widest border-b border-neutral-100"><tr><th className="px-4 md:px-6 py-4">Waktu</th><th className="px-4 md:px-6 py-4">Pelanggan</th><th className="px-4 md:px-6 py-4">Total</th><th className="px-4 md:px-6 py-4 hidden sm:table-cell">Metode</th></tr></thead>
                          <tbody className="divide-y divide-neutral-100 text-xs">{transactions.map(t => (<tr key={t.id} className="hover:bg-neutral-50"><td className="px-4 md:px-6 py-4 text-neutral-400 text-[10px]">{t.date}</td><td className="px-4 md:px-6 py-4"><div className="font-bold uppercase">{t.customerName}</div><div className="text-[9px] text-neutral-300">ID {t.id.slice(-6)}</div></td><td className="px-4 md:px-6 py-4 font-bold">{formatPrice(t.total)}</td><td className="px-4 md:px-6 py-4 hidden sm:table-cell"><span className="text-[9px] font-bold uppercase text-neutral-400 bg-neutral-100 px-2 py-0.5 rounded-full">{t.paymentMethod}</span></td></tr>))}</tbody>
                        </>
                      )}
                   </table>
                </div>
             </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="animate-fade-in max-w-4xl mx-auto">
            <h1 className="text-xl md:text-2xl font-bold mb-8">Pengaturan Toko</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div className="card-minimal !p-5">
                <h3 className="text-sm md:text-base font-bold mb-4 flex items-center gap-3"><Database size={20} className="text-primary" /> Manajemen Data</h3>
                <div className="flex flex-col gap-2"><button onClick={exportAllData} className="btn-secondary justify-start gap-3 h-12 px-4 text-xs font-bold"><Download size={16} /> CADANGKAN DATA (.json)</button><label className="btn-secondary justify-start gap-3 h-12 px-4 text-xs font-bold cursor-pointer"><Upload size={16} /> PULIHKAN DATA<input type="file" className="hidden" accept=".json" onChange={importAllData} /></label></div>
              </div>
              <div className="card-minimal !p-5">
                <h3 className="text-sm md:text-base font-bold mb-4 flex items-center gap-3"><ListFilter size={20} className="text-primary" /> Kelola Kategori</h3>
                <div className="space-y-4">
                   <div className="flex gap-2"><input id="new-cat" type="text" className="input-minimal flex-1 h-10 text-xs px-3" placeholder="Nama kategori baru..." onKeyDown={(e) => { if(e.key === 'Enter') { addCategory(e.target.value); e.target.value = ''; } }} /><button onClick={() => { const el = document.getElementById('new-cat'); addCategory(el.value); el.value = ''; }} className="btn-primary h-10 w-10 !p-0"><Plus size={18} /></button></div>
                   <div className="flex flex-wrap gap-2">{categories.map(c => (<span key={c} className="flex items-center gap-2 rounded-full bg-neutral-100 px-3 py-1.5 text-[10px] font-bold text-neutral-600 border border-neutral-200">{c} <button onClick={() => deleteCategory(c)} className="text-neutral-300 hover:text-red-500"><X size={12} /></button></span>))}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* --- MODALS --- */}
      {showMobileCart && (
        <div className="fixed inset-0 z-[100] flex items-end bg-neutral-900/60 backdrop-blur-sm animate-fade-in lg:hidden">
          <div className="w-full bg-white rounded-t-[2rem] p-6 animate-fade-in-up max-h-[90vh] flex flex-col shadow-2xl overflow-hidden relative">
            <button onClick={() => setShowMobileCart(false)} className="absolute top-6 right-6 p-2 rounded-full bg-neutral-100 text-neutral-400 active:scale-90 z-20"><X size={20} /></button>
            <div className="h-1.5 w-12 bg-neutral-200 rounded-full mx-auto mb-6 shrink-0"></div>
            <div className="flex items-center justify-between mb-6 shrink-0">
              <h2 className="text-lg font-bold flex items-center gap-2"><ShoppingCart size={20} /> Detail Pesanan</h2>
            </div>
            <div className="flex-1 overflow-y-auto mb-6 space-y-4 pr-1">
              {cart.length === 0 ? (
                <div className="text-center py-10 text-neutral-300 italic uppercase text-[10px] font-bold">Belum ada barang dipilih</div>
              ) : cart.map(item => (
                <div key={item.id} className="flex flex-col gap-3 p-4 bg-neutral-50 rounded-2xl border border-neutral-100 transition-all">
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-xs md:text-sm text-neutral-800 uppercase truncate">{item.name}</div>
                      <div className="text-[10px] text-neutral-400 font-bold tracking-wider">{formatPrice(item.price)}</div>
                    </div>
                    <button onClick={() => setCart(prev => prev.filter(i => i.id !== item.id))} className="text-neutral-300 p-1"><Trash2 size={16} /></button>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <div className="flex items-center rounded-xl bg-white border border-neutral-200 p-1">
                      <button onClick={() => updateCartQuantity(item.id, item.quantity - 1)} className="h-9 w-9 rounded-lg flex items-center justify-center active:bg-neutral-100"><Minus size={14} /></button>
                      <span className="w-10 text-center font-bold text-sm">{item.quantity}</span>
                      <button onClick={() => updateCartQuantity(item.id, item.quantity + 1)} className="h-9 w-9 rounded-lg flex items-center justify-center active:bg-neutral-100"><Plus size={14} /></button>
                    </div>
                    <div className="text-sm font-bold text-neutral-800">{formatPrice(item.price * item.quantity)}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-neutral-900 p-6 rounded-[1.5rem] text-white shrink-0 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Total Tagihan</span>
                  <span className="text-2xl font-bold">{formatPrice(cartTotal)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-bold text-neutral-500 uppercase">Items: {cart.length}</span>
                </div>
              </div>
              <button onClick={() => { setShowMobileCart(false); setShowPaymentModal(true); }} className="btn-primary w-full h-14 font-bold text-sm tracking-widest active:scale-95">PROSES BAYAR SEKARANG</button>
            </div>
          </div>
        </div>
      )}

      {showPaymentModal && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-6 bg-neutral-900/60 backdrop-blur-sm animate-fade-in">
          <div className="card-minimal w-full max-w-lg !p-6 md:!p-8 relative bg-white shadow-2xl rounded-t-[2rem] md:rounded-[2rem] h-[90vh] md:h-auto overflow-y-auto">
            <button onClick={() => setShowPaymentModal(false)} className="absolute top-6 right-6 p-2 rounded-full bg-neutral-100 text-neutral-400 active:scale-90 z-20"><X size={20} /></button>
            <div className="md:hidden h-1.5 w-12 bg-neutral-200 rounded-full mx-auto mb-6"></div>
            <h2 className="text-xl font-bold mb-6 text-center md:text-left uppercase tracking-tight">Selesaikan Pembayaran</h2>
            <div className="grid grid-cols-1 gap-6 md:gap-8">
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-bold uppercase text-neutral-400 block mb-3 tracking-wider">Metode Pembayaran</label>
                  <div className="grid grid-cols-2 md:grid-cols-1 gap-2">
                    {[{ id: 'Tunai', icon: Banknote }, { id: 'QRIS/Transfer', icon: QrCode }, { id: 'Hutang', icon: Users }].map(m => (
                      <button key={m.id} onClick={() => setPaymentMethod(m.id)} className={`flex items-center justify-center md:justify-start gap-3 px-4 py-3 rounded-xl text-[10px] md:text-xs font-bold transition-all border-2 ${paymentMethod === m.id ? 'bg-primary text-white border-primary shadow-md' : 'bg-white text-neutral-400 border-neutral-100 hover:border-neutral-200'}`}><m.icon size={16} />{m.id}</button>
                    ))}
                  </div>
                </div>
                {paymentMethod === 'Hutang' && (
                  <div className="animate-fade-in">
                    <label className="text-[10px] font-bold uppercase text-neutral-400 block mb-2 tracking-wider">Nama Pelanggan (Hutang)</label>
                    <input type="text" className="input-minimal h-12" value={debtCustomerName} onChange={e => setDebtCustomerName(e.target.value)} placeholder="Contoh: Pak Budi" autoFocus />
                  </div>
                )}
              </div>
              <div className="flex flex-col">
                <div className="mb-6 p-6 bg-neutral-900 rounded-2xl text-white text-center md:text-left">
                  <div className="text-[10px] text-neutral-400 uppercase font-bold tracking-widest mb-1">Total Tagihan</div>
                  <div className="text-3xl md:text-4xl font-bold">{formatPrice(cartTotal)}</div>
                </div>
                {paymentMethod === 'Tunai' && (
                  <div className="space-y-4 animate-fade-in mb-6">
                    <div className="flex flex-wrap gap-2">
                      {QUICK_CASH.map(amount => (<button key={amount} onClick={() => setPaymentAmount(amount)} className="flex-1 bg-neutral-100 hover:bg-neutral-200 py-2 rounded-lg text-[9px] md:text-[10px] font-bold">+{amount/1000}k</button>))}
                      <button onClick={() => setPaymentAmount(cartTotal)} className="flex-1 bg-primary/10 text-primary py-2 rounded-lg text-[10px] font-bold">Pas</button>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase text-neutral-400 block mb-2 tracking-wider">Uang yang Diterima</label>
                      <input type="number" className="input-minimal h-14 md:h-16 text-2xl md:text-3xl font-bold text-center" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} placeholder="0" autoFocus />
                      {paymentAmount && Number(paymentAmount) >= cartTotal && (
                        <div className="mt-4 text-center bg-green-50 p-3 rounded-2xl border border-green-100 animate-fade-in">
                          <div className="text-[9px] font-bold text-green-500 uppercase tracking-widest">Uang Kembali</div>
                          <div className="text-lg md:text-xl font-bold text-green-700">{formatPrice(Number(paymentAmount) - cartTotal)}</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                <button onClick={finalizeTransaction} className="btn-primary w-full h-14 md:h-16 text-sm font-bold uppercase tracking-widest active:scale-95 shadow-xl shadow-primary/20">Konfirmasi Pembayaran</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showProductModal && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-6 bg-neutral-900/60 backdrop-blur-sm animate-fade-in">
          <form onSubmit={saveProduct} className="card-minimal w-full max-w-xl !p-6 md:!p-8 relative bg-white rounded-t-[2rem] md:rounded-[2rem] h-[90vh] md:h-auto overflow-y-auto">
            <button type="button" onClick={() => setShowProductModal(false)} className="absolute top-6 right-6 p-2 rounded-full bg-neutral-100 text-neutral-400 active:scale-90 z-20"><X size={20} /></button>
            <div className="md:hidden h-1.5 w-12 bg-neutral-200 rounded-full mx-auto mb-6"></div>
            <h2 className="text-xl font-bold mb-8 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center"><Package size={22} /></div>
              {editingProduct ? 'Edit Informasi Produk' : 'Tambah Produk Baru'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5 mb-10">
              <div className="md:col-span-2">
                <label className="text-[10px] font-bold uppercase text-neutral-400 block mb-1.5 tracking-wider">Nama Produk</label>
                <input name="name" defaultValue={editingProduct?.name} required className="input-minimal h-11" placeholder="Contoh: Beras Madura 5kg" />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-neutral-400 block mb-1.5 tracking-wider">Barcode</label>
                <div className="relative">
                  <input name="barcode" value={scannedBarcode || editingProduct?.barcode || ''} onChange={e => setScannedBarcode(e.target.value)} className="input-minimal pr-10 h-11" />
                  <button type="button" onClick={() => { setScannerMode('product'); setShowScannerModal(true); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-primary bg-primary/10 p-1.5 rounded-lg hover:bg-primary/20 transition-colors" title="Scan Barcode"><ScanLine size={18} /></button>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-neutral-400 block mb-1.5 tracking-wider">Kategori</label>
                <select name="category" defaultValue={editingProduct?.category} className="input-minimal h-11 text-sm">{categories.map(c => <option key={c} value={c}>{c}</option>)}</select>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-neutral-400 block mb-1.5 tracking-wider">Harga Beli</label>
                <input name="costPrice" type="number" defaultValue={editingProduct?.costPrice} required className="input-minimal h-11" />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-neutral-400 block mb-1.5 tracking-wider">Harga Jual</label>
                <input name="price" type="number" defaultValue={editingProduct?.price} required className="input-minimal h-11" />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-neutral-400 block mb-1.5 tracking-wider">Stok</label>
                <input name="stock" type="number" defaultValue={editingProduct?.stock} required className="input-minimal h-11" />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-neutral-400 block mb-1.5 tracking-wider">Satuan</label>
                <select name="unit" defaultValue={editingProduct?.unit} className="input-minimal h-11 text-sm">{['Pcs', 'Kg', 'Bag', 'Box', 'Liter', 'Sachet'].map(u => <option key={u} value={u}>{u}</option>)}</select>
              </div>
            </div>
            <button className="btn-primary w-full h-14 text-sm font-bold shadow-lg shadow-primary/20 uppercase tracking-widest">Simpan Data Produk</button>
          </form>
        </div>
      )}

      {showRestockModal && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-6 bg-neutral-900/60 backdrop-blur-sm animate-fade-in">
          <div className="card-minimal w-full max-w-3xl !p-6 md:!p-8 relative bg-white rounded-t-[2rem] md:rounded-[2rem] h-[90vh] md:h-auto flex flex-col">
            <button onClick={() => setShowRestockModal(false)} className="absolute top-6 right-6 p-2 rounded-full bg-neutral-100 text-neutral-400 active:scale-90 z-20"><X size={20} /></button>
            <div className="md:hidden h-1.5 w-12 bg-neutral-200 rounded-full mx-auto mb-6"></div>
            <h2 className="text-xl font-bold mb-6 flex items-center gap-3"><RefreshCw size={22} className="text-primary" /> Restok Barang</h2>
            <div className="mb-6 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
              <input type="text" placeholder="Cari nama barang atau scan..." className="input-minimal pl-11 pr-12 h-12" onChange={e => { const p = products.find(prod => prod.name.toLowerCase().includes(e.target.value.toLowerCase()) || prod.barcode === e.target.value); if (p && e.target.value.length > 2) { addToRestock(p); e.target.value = ''; } }} />
              <button onClick={() => { setScannerMode('restock'); setShowScannerModal(true); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-primary bg-primary/10 p-1.5 rounded-lg hover:bg-primary/20 transition-colors" title="Scan Barcode"><ScanLine size={20} /></button>
            </div>
            <div className="flex-1 overflow-y-auto mb-6 border border-neutral-100 rounded-2xl">
              <table className="w-full text-xs">
                <thead className="bg-neutral-50 sticky top-0">
                  <tr className="text-left text-[10px] font-bold text-neutral-400 uppercase border-b border-neutral-100"><th className="px-4 py-4">Produk</th><th className="px-4 py-4 text-center">Jumlah</th><th className="px-4 py-4 text-right">Harga Beli</th><th className="w-12"></th></tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {restockCart.length === 0 ? (
                    <tr><td colSpan="4" className="text-center py-12 text-neutral-300 italic">Pilih barang untuk restok</td></tr>
                  ) : restockCart.map(item => (
                    <tr key={item.id}>
                      <td className="px-4 py-4 font-bold">{item.name}</td>
                      <td className="px-4 py-4"><input type="number" className="input-minimal py-1 text-center font-bold h-9" value={item.addedQty} onChange={e => setRestockCart(prev => prev.map(i => i.id === item.id ? { ...i, addedQty: e.target.value } : i))} /></td>
                      <td className="px-4 md:px-6 py-4"><input type="number" className="input-minimal py-1 text-right font-bold h-9" value={item.newCostPrice} onChange={e => setRestockCart(prev => prev.map(i => i.id === item.id ? { ...i, newCostPrice: e.target.value } : i))} /></td>
                      <td className="px-4 py-4 text-center"><button onClick={() => setRestockCart(prev => prev.filter(i => i.id !== item.id))} className="text-neutral-300 hover:text-red-500"><Trash2 size={16} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button onClick={finalizeRestock} className="btn-primary w-full h-14 text-sm font-bold tracking-widest uppercase">Update Stok</button>
          </div>
        </div>
      )}

      {showOpnameModal && opnameTarget && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-6 bg-neutral-900/60 backdrop-blur-sm animate-fade-in">
          <form onSubmit={finalizeOpname} className="card-minimal w-full max-w-md !p-6 md:!p-8 relative bg-white rounded-t-[2rem] md:rounded-[2rem]">
            <button type="button" onClick={() => setShowOpnameModal(false)} className="absolute top-6 right-6 p-2 rounded-full bg-neutral-100 text-neutral-400 active:scale-90 z-20"><X size={20} /></button>
            <div className="md:hidden h-1.5 w-12 bg-neutral-200 rounded-full mx-auto mb-6"></div>
            <h2 className="text-lg font-bold mb-6 flex items-center gap-3"><Settings2 size={20} className="text-primary" /> Penyesuaian Stok</h2>
            <div className="mb-6 p-4 bg-neutral-50 rounded-2xl"><div className="text-[10px] font-bold text-neutral-400 uppercase">Nama Produk</div><div className="text-sm font-bold uppercase">{opnameTarget.name}</div><div className="text-[10px] text-neutral-500 mt-1 uppercase">Stok Sistem: <span className="font-bold">{opnameTarget.stock} {opnameTarget.unit}</span></div></div>
            <div className="space-y-4 mb-8">
              <div><label className="text-[10px] font-bold uppercase text-neutral-400 block mb-2 tracking-wider">Stok Sebenarnya</label><input name="newStock" type="number" required className="input-minimal h-12 text-lg font-bold" defaultValue={opnameTarget.stock} autoFocus /></div>
              <div><label className="text-[10px] font-bold uppercase text-neutral-400 block mb-2 tracking-wider">Pilih Alasan</label><select name="reason" className="input-minimal h-12 text-sm font-bold"><option value="Opname Rutin">Opname Rutin</option><option value="Barang Rusak">Barang Rusak</option><option value="Bonus Distributor">Bonus Distributor</option></select></div>
            </div>
            <button className="btn-primary w-full h-14 font-bold tracking-widest active:scale-95 uppercase">SIMPAN PERUBAHAN</button>
          </form>
        </div>
      )}

      {showScannerModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-neutral-900/90 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-sm bg-white rounded-[2rem] p-6 relative overflow-hidden">
            <button onClick={() => setShowScannerModal(false)} className="absolute top-4 right-4 z-10 p-2 bg-white/80 rounded-full text-neutral-400 active:scale-90"><X size={20} /></button>
            <h3 className="text-sm font-bold mb-4 flex items-center gap-3"><QrCode className="text-primary" size={20} /> SCANNER AKTIF</h3>
            <div id="reader" className="overflow-hidden rounded-2xl border-4 border-neutral-50 bg-black aspect-square"></div>
            <div className="mt-4 text-center"><p className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest animate-pulse">Arahkan kamera ke barcode produk</p></div>
          </div>
        </div>
      )}

      <div className="fixed top-4 md:top-auto md:bottom-20 right-4 left-4 md:left-auto md:right-10 z-[300] flex flex-col gap-3 pointer-events-none items-center md:items-end">
        {notifications.map(n => (<div key={n.id} className="pointer-events-auto flex items-center gap-3 bg-neutral-900 text-white rounded-2xl px-6 py-4 shadow-2xl animate-fade-in text-[11px] font-bold min-w-[200px] border border-white/10">{n.type === 'success' ? <CheckCircle2 size={16} className="text-green-400" /> : <AlertTriangle size={16} className="text-red-400" />}<span>{n.message}</span></div>))}
      </div>

      {showReceiptModal && lastReceipt && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-md no-print animate-fade-in">
          <div className="w-full max-w-xs bg-white rounded-[2rem] overflow-hidden shadow-2xl flex flex-col relative">
            <button onClick={() => setShowReceiptModal(false)} className="absolute top-6 right-6 p-2 rounded-full bg-neutral-100 text-neutral-400 active:scale-90 z-20 no-print md:hidden"><X size={20} /></button>
            <div id="receipt-content" className="bg-white p-6 md:p-8 text-[10px] font-mono leading-tight text-neutral-900 overflow-y-auto">
              <div className="text-center mb-6 border-b-2 border-neutral-900 pb-4 shrink-0">
                <div className="text-base font-bold uppercase tracking-tight mb-1 leading-none">Toko Klontong</div>
                <div className="text-[7px] text-neutral-400 font-bold font-sans uppercase">Jawa Timur, Indonesia</div>
              </div>
              <div className="mb-4 flex justify-between font-bold border-b border-neutral-100 pb-2 text-[8px]"><span>TRX {lastReceipt.id.slice(-6)}</span><span>{lastReceipt.date.split(' ')[0]}</span></div>
              <div className="space-y-3 mb-6 border-b border-dashed border-neutral-300 pb-4 text-left">
                {lastReceipt.items.map(i => (<div key={i.id}><div className="flex justify-between font-bold uppercase"><span>{i.name}</span><span>{formatPrice(i.quantity * i.price)}</span></div><div className="flex justify-between text-neutral-500 text-[7px] uppercase"><span>{i.quantity} x {formatPrice(i.price)}</span>{i.itemDiscount > 0 && <span>Disc -{formatPrice(i.itemDiscount)}</span>}</div></div>))}
              </div>
              <div className="space-y-1.5 text-left text-[9px] font-bold">
                <div className="flex justify-between text-xs"><span>TOTAL</span><span>{formatPrice(lastReceipt.total)}</span></div>
                <div className="flex justify-between text-neutral-500"><span>BAYAR ({lastReceipt.paymentMethod})</span><span>{formatPrice(lastReceipt.paidAmount)}</span></div>
                <div className="flex justify-between text-neutral-400"><span>KEMBALI</span><span>{formatPrice(lastReceipt.change)}</span></div>
              </div>
              <div className="mt-8 pt-4 border-t border-dashed border-neutral-200 text-center text-[7px] font-bold uppercase tracking-widest text-neutral-300 italic">Terima kasih atas kunjungan Anda</div>
            </div>
            <div className="p-4 bg-neutral-50 flex gap-2 border-t border-neutral-100 shrink-0">
              <button onClick={() => window.print()} className="btn-primary flex-1 h-12 text-[10px] font-bold uppercase"><Printer size={16} /> Print</button>
              <button onClick={() => setShowReceiptModal(false)} className="btn-secondary flex-1 h-12 text-[10px] font-bold uppercase">Tutup</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
