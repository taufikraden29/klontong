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
  Database
} from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';

// --- INITIAL DATA ---
const INITIAL_PRODUCTS = [
  { id: 1, name: 'Beras Madura 5kg', costPrice: 65000, price: 75000, stock: 20, unit: 'Bag', category: 'Pokok', barcode: '8991234567890' },
  { id: 2, name: 'Indomie Goreng', costPrice: 2400, price: 3000, stock: 100, unit: 'Pcs', category: 'Makanan', barcode: '8998866200505' },
  { id: 3, name: 'Kopi Kapal Api 165g', costPrice: 12500, price: 15000, stock: 50, unit: 'Sachet', category: 'Minuman', barcode: '8992696404118' },
  { id: 4, name: 'Minyak Goreng 1L', costPrice: 15000, price: 18000, stock: 30, unit: 'Pcs', category: 'Pokok', barcode: '8999999000001' },
];

const CATEGORIES = ['Semua', 'Pokok', 'Makanan', 'Minuman', 'Rokok', 'Cemilan', 'Lainnya'];
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
  const [cart, setCart] = useState([]);
  const [transactions, setTransactions] = useState(() => {
    const saved = localStorage.getItem('klontong_transactions');
    return saved ? JSON.parse(saved) : [];
  });
  const [debts, setDebts] = useState(() => {
    const saved = localStorage.getItem('klontong_debts');
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
  const [scannerMode, setScannerMode] = useState('pos'); // 'pos', 'product', 'search', or 'restock'
  const [scannedBarcode, setScannedBarcode] = useState('');
  const [searchTarget, setSearchTarget] = useState('pos'); // 'pos' or 'inventory'
  const [restockCart, setRestockCart] = useState([]);
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [showMobileCart, setShowMobileCart] = useState(false);
  
  const barcodeBuffer = useRef('');
  const lastKeyTime = useRef(0);

  // Persistence
  useEffect(() => {
    const timeout = setTimeout(() => localStorage.setItem('klontong_products', JSON.stringify(products)), 1000);
    return () => clearTimeout(timeout);
  }, [products]);

  useEffect(() => {
    const timeout = setTimeout(() => localStorage.setItem('klontong_transactions', JSON.stringify(transactions)), 1000);
    return () => clearTimeout(timeout);
  }, [transactions]);

  useEffect(() => {
    const timeout = setTimeout(() => localStorage.setItem('klontong_debts', JSON.stringify(debts)), 1000);
    return () => clearTimeout(timeout);
  }, [debts]);

  // Global Keyboard Listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'F2') { e.preventDefault(); if (cart.length > 0) setShowPaymentModal(true); }
      if (e.key === 'Escape') { setShowPaymentModal(false); setShowScannerModal(false); setShowProductModal(false); setShowReceiptModal(false); setShowDebtModal(false); }
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
        rememberLastUsedCamera: true,
        aspectRatio: 1.0
      });
      scanner.render((decodedText) => {
        handleBarcodeScanned(decodedText);
        scanner.clear();
        setShowScannerModal(false);
      }, (error) => {});
    }
    return () => { if (scanner) scanner.clear().catch(() => {}); };
  }, [showScannerModal]);

  const notify = (message, type = 'success') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 3000);
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
      return [...prev, { ...product, quantity: 1 }];
    });
    if (activeTab !== 'pos') notify(`Ditambahkan: ${product.name}`);
  };

  const updateCartQuantity = (id, delta) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        const product = products.find(p => p.id === id);
        if (delta > 0 && newQty > product.stock) return item;
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const finalizeTransaction = () => {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const total = subtotal - discount;
    const totalCost = cart.reduce((sum, item) => sum + (item.costPrice * item.quantity), 0);
    if (paymentMethod === 'Tunai' && Number(paymentAmount) < total) { notify('Uang kurang!', 'error'); return; }
    if (paymentMethod === 'Hutang' && !debtCustomerName) { notify('Nama wajib diisi!', 'warning'); return; }

    const transactionId = `TRX-${Date.now()}`;
    const newTransaction = {
      id: transactionId, date: new Date().toLocaleString('id-ID'),
      items: [...cart], subtotal, discount, total, profit: total - totalCost,
      paidAmount: paymentMethod === 'Tunai' ? Number(paymentAmount) : 0,
      change: paymentMethod === 'Tunai' ? Number(paymentAmount) - total : 0,
      paymentMethod, customerName: paymentMethod === 'Hutang' ? debtCustomerName : 'Umum'
    };

    if (paymentMethod === 'Hutang') {
      setDebts(prev => [{ id: Date.now(), name: debtCustomerName, amount: total, date: new Date().toLocaleDateString('id-ID'), status: 'Belum Lunas' }, ...prev]);
    }

    setProducts(prev => prev.map(p => {
      const cartItem = cart.find(item => item.id === p.id);
      return cartItem ? { ...p, stock: p.stock - cartItem.quantity } : p;
    }));

    setTransactions(prev => [newTransaction, ...prev]);
    setLastReceipt(newTransaction);
    setCart([]); setDiscount(0); setPaymentAmount(''); setShowPaymentModal(false); setShowReceiptModal(true);
    notify('Transaksi Berhasil!', 'success');
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
    if (editingProduct) setProducts(prev => prev.map(p => p.id === editingProduct.id ? productData : p));
    else setProducts(prev => [...prev, productData]);
    setShowProductModal(false); setEditingProduct(null);
  };

  const markDebtPaid = (id, name) => {
    setDebts(prev => prev.map(item => item.id === id ? { ...item, status: 'Lunas' } : item));
    notify(`Hutang ${name} lunas!`);
  };

  const addToRestock = (product) => {
    setRestockCart(prev => prev.find(i => i.id === product.id) ? prev : [...prev, { ...product, addedQty: 0, newCostPrice: product.costPrice }]);
  };

  const finalizeRestock = () => {
    setProducts(prev => prev.map(p => {
      const item = restockCart.find(i => i.id === p.id);
      return item ? { ...p, stock: p.stock + Number(item.addedQty), costPrice: Number(item.newCostPrice) } : p;
    }));
    setRestockCart([]); setShowRestockModal(false);
    notify('Stok diperbarui!');
  };

  const updateStockQuickly = (id, amount) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, stock: Math.max(0, p.stock + amount) } : p));
  };

  const exportAllData = () => {
    const data = { products, transactions, debts, exportDate: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup_klontong_${new Date().toLocaleDateString()}.json`;
    link.click();
    notify('Backup berhasil didownload!');
  };

  const importAllData = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (data.products) setProducts(data.products);
        if (data.transactions) setTransactions(data.transactions);
        if (data.debts) setDebts(data.debts);
        notify('Data dipulihkan!', 'success');
      } catch (err) { notify('Gagal import data!', 'error'); }
    };
    reader.readAsText(file);
  };

  const addDebtManual = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    setDebts(prev => [{ id: Date.now(), name: formData.get('customerName'), amount: Number(formData.get('amount')), date: new Date().toLocaleDateString('id-ID'), status: 'Belum Lunas' }, ...prev]);
    setShowDebtModal(false);
    notify('Hutang dicatat!');
  };

  // Statistics
  const todayRevenue = transactions.filter(t => t.date.includes(new Date().toLocaleDateString('id-ID'))).reduce((s, t) => s + t.total, 0);
  const todayProfit = transactions.filter(t => t.date.includes(new Date().toLocaleDateString('id-ID'))).reduce((s, t) => s + t.profit, 0);
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
    <div className="flex min-h-screen bg-slate-100 font-sans text-slate-900">
      {/* DESKTOP SIDEBAR */}
      <aside className="fixed left-0 top-0 hidden h-full w-64 flex-col bg-slate-900 p-6 text-white lg:flex z-50">
        <div className="mb-10 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/20"><Store size={24} /></div>
          <span className="text-xl font-outfit font-black tracking-tight">KLO<span className="text-primary-light">NTONG</span></span>
        </div>
        <nav className="flex flex-col gap-2">
          {[
            { id: 'dashboard', icon: LineChart, label: 'Beranda' },
            { id: 'pos', icon: ShoppingCart, label: 'Kasir (POS)' },
            { id: 'inventory', icon: Package, label: 'Stok Barang' },
            { id: 'debts', icon: Users, label: 'Kas Bon' },
            { id: 'transactions', icon: History, label: 'Laporan' },
            { id: 'settings', icon: SettingsIcon, label: 'Pengaturan' },
          ].map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id)} className={`flex items-center gap-4 rounded-xl px-4 py-3 font-semibold transition-all ${activeTab === item.id ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
              <item.icon size={20} /> <span>{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="mt-auto rounded-2xl bg-white/5 p-4">
          <div className="text-xs text-slate-400">Kas Hari Ini</div>
          <div className="text-lg font-bold text-white">{formatPrice(todayRevenue)}</div>
        </div>
      </aside>

      {/* MOBILE BOTTOM NAV */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around border-t bg-white px-2 lg:hidden shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
        {[
          { id: 'dashboard', icon: LineChart, label: 'Home' },
          { id: 'pos', icon: ShoppingCart, label: 'Kasir' },
          { id: 'inventory', icon: Package, label: 'Stok' },
          { id: 'debts', icon: Users, label: 'Bon' },
          { id: 'transactions', icon: History, label: 'Data' },
        ].map(item => (
          <button key={item.id} onClick={() => setActiveTab(item.id)} className={`flex flex-col items-center gap-1 flex-1 py-1 ${activeTab === item.id ? 'text-primary' : 'text-slate-400'}`}>
            <item.icon size={20} /> <span className="text-[10px] font-bold">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* MAIN CONTENT */}
      <main className="flex-1 lg:ml-64 p-4 lg:p-10 pb-24 lg:pb-10">
        {activeTab === 'dashboard' && (
          <div className="animate-slide-up">
            <div className="mb-8 flex items-center justify-between">
              <h1 className="text-3xl">Ringkasan Toko</h1>
              <div className="rounded-full border bg-white px-4 py-1.5 text-xs font-bold text-slate-500 shadow-sm">{new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mb-8">
              <div className="card bg-primary !text-white">
                <div className="text-xs opacity-70">Laba Hari Ini</div>
                <div className="mt-2 text-2xl font-black">{formatPrice(todayProfit)}</div>
              </div>
              <div className="card">
                <div className="text-xs text-slate-500">Omzet Hari Ini</div>
                <div className="mt-2 text-2xl font-black">{formatPrice(todayRevenue)}</div>
              </div>
              <div className="card">
                <div className="text-xs text-slate-500">Nilai Aset Stok</div>
                <div className="mt-2 text-2xl font-black">{formatPrice(totalAsset)}</div>
              </div>
              <div className="card">
                <div className="text-xs text-slate-500">Total Piutang (Bon)</div>
                <div className="mt-2 text-2xl font-black text-amber-600">{formatPrice(totalDebts)}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <div className="card min-h-[350px]">
                <h3 className="mb-6 text-sm uppercase tracking-wider text-slate-400">Tren Penjualan 7 Hari</h3>
                <div className="flex h-56 items-end justify-between px-2">
                  {trendData.map(day => (
                    <div key={day.name} className="flex flex-1 flex-col items-center gap-3">
                      <div className="w-8 rounded-t-lg bg-primary/20 transition-all hover:bg-primary" style={{ height: `${(day.revenue / maxRev) * 100}%`, minHeight: '4px' }}></div>
                      <span className="text-[10px] font-bold text-slate-400">{day.name}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="card">
                <h3 className="mb-6 text-sm uppercase tracking-wider text-slate-400">Status Stok Terendah</h3>
                <div className="space-y-4">
                  {products.filter(p => p.stock < 10).slice(0, 5).map(p => (
                    <div key={p.id} className="flex items-center justify-between border-b border-slate-50 pb-3 last:border-0">
                      <div><div className="text-sm font-bold">{p.name}</div><div className="text-[10px] text-slate-400">{p.category}</div></div>
                      <div className="rounded-lg bg-red-50 px-3 py-1 text-xs font-black text-red-600">{p.stock} {p.unit}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'pos' && (
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-8 animate-slide-up items-start">
            <section>
              <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <h1 className="text-3xl">Kasir</h1>
                <div className="flex flex-1 min-w-[300px] gap-2">
                  <button onClick={() => { setScannerMode('pos'); setShowScannerModal(true); }} className="btn btn-outline !p-3"><ScanLine size={20} /></button>
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input type="text" placeholder="Cari barang..." className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-10 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                    {searchTerm && <X className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-slate-400" size={18} onClick={() => setSearchTerm('')} />}
                  </div>
                </div>
              </div>

              <div className="pos-categories mb-6 flex gap-2 overflow-x-auto pb-2">
                {CATEGORIES.map(cat => (
                  <button key={cat} onClick={() => setSelectedCategory(cat)} className={`whitespace-nowrap rounded-full px-5 py-1.5 text-xs font-bold transition-all ${selectedCategory === cat ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'bg-white border text-slate-600 hover:bg-slate-50'}`}>
                    {cat}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {products.filter(p => (selectedCategory === 'Semua' || p.category === selectedCategory) && p.name.toLowerCase().includes(searchTerm.toLowerCase())).map(p => (
                  <div key={p.id} onClick={() => addToCart(p)} className={`group card cursor-pointer !p-3 ${p.stock <= 0 ? 'opacity-50 grayscale' : ''}`}>
                    <div className="mb-3 flex aspect-square items-center justify-center rounded-xl bg-slate-50 text-slate-300 transition-colors group-hover:bg-primary/5 group-hover:text-primary"><Package size={32} /></div>
                    <div className="text-[10px] font-black uppercase text-primary/60">{p.category}</div>
                    <div className="mb-1 truncate text-xs font-bold">{p.name}</div>
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-black">{formatPrice(p.price)}</div>
                      <div className="text-[10px] font-bold text-slate-400">{p.stock}</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <aside className="sticky top-10 flex flex-col gap-6 hidden xl:flex">
              <div className="card flex h-[calc(100vh-140px)] flex-col !p-0 overflow-hidden">
                <div className="flex items-center justify-between border-b p-5">
                  <h2 className="flex items-center gap-2 text-lg font-black"><ShoppingCart size={22} className="text-primary" /> Keranjang</h2>
                  <button onClick={() => setCart([])} className="text-slate-400 hover:text-red-500"><Eraser size={20} /></button>
                </div>
                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                  {cart.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center text-slate-300">
                      <ShoppingCart size={64} strokeWidth={1} className="mb-4 opacity-20" />
                      <p className="font-bold">Belum ada belanjaan</p>
                    </div>
                  ) : cart.map(item => (
                    <div key={item.id} className="flex items-center justify-between gap-3 border-b border-slate-50 pb-3">
                      <div className="flex-1">
                        <div className="text-xs font-bold leading-tight">{item.name}</div>
                        <div className="text-[10px] text-slate-400">{formatPrice(item.price)}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center rounded-lg bg-slate-100 p-1">
                          <button onClick={() => updateCartQuantity(item.id, -1)} className="px-2 font-black">-</button>
                          <span className="w-6 text-center text-xs font-black">{item.quantity}</span>
                          <button onClick={() => updateCartQuantity(item.id, 1)} className="px-2 font-black">+</button>
                        </div>
                        <button onClick={() => setCart(prev => prev.filter(i => i.id !== item.id))} className="text-red-400"><Trash2 size={16} /></button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="bg-slate-50 p-5 shadow-[0_-4px_12px_rgba(0,0,0,0.02)]">
                  <div className="mb-4 space-y-2">
                    <div className="flex justify-between text-xs text-slate-500"><span>Subtotal</span><span>{formatPrice(cart.reduce((s, i) => s + (i.price * i.quantity), 0))}</span></div>
                    <div className="flex justify-between text-xs font-bold text-green-600"><span>Diskon</span><span>-{formatPrice(discount)}</span></div>
                  </div>
                  <div className="mb-6 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400 uppercase">Total Bayar</span>
                    <span className="text-2xl font-black text-primary">{formatPrice(cart.reduce((s, i) => s + (i.price * i.quantity), 0) - discount)}</span>
                  </div>
                  <button onClick={() => setShowPaymentModal(true)} disabled={cart.length === 0} className="btn btn-primary w-full !py-4 text-base">BAYAR SEKARANG (F2)</button>
                </div>
              </div>
            </aside>

            {/* Mobile Cart Button */}
            <button onClick={() => setShowMobileCart(true)} className="fixed bottom-20 right-4 z-40 flex items-center gap-3 rounded-full bg-slate-900 px-6 py-4 text-white shadow-2xl xl:hidden active:scale-95">
              <div className="relative">
                <ShoppingCart size={24} />
                {cart.length > 0 && <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary-light text-[10px] font-black">{cart.length}</span>}
              </div>
              <div className="text-lg font-black">{formatPrice(cart.reduce((s, i) => s + (i.price * i.quantity), 0) - discount)}</div>
            </button>
          </div>
        )}

        {activeTab === 'inventory' && (
          <div className="animate-slide-up">
            <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
              <div><h1 className="text-3xl">Inventori</h1><p className="text-xs text-slate-400">Kelola stok dan harga produk</p></div>
              <div className="flex gap-2">
                <button onClick={() => setShowRestockModal(true)} className="btn btn-outline"><RefreshCw size={18} /> Restok</button>
                <button onClick={() => { setEditingProduct(null); setShowProductModal(true); }} className="btn btn-primary"><Plus size={18} /> Produk Baru</button>
              </div>
            </div>

            <div className="card mb-6 flex flex-wrap items-center gap-4 !p-4">
              <div className="relative flex-1 min-w-[250px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input type="text" placeholder="Cari produk..." className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-10 text-sm outline-none focus:border-primary" value={inventorySearch} onChange={e => setInventorySearch(e.target.value)} />
              </div>
              <select className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-primary" value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="data-table-container">
              <table className="data-table">
                <thead className="hidden sm:table-header-group">
                  <tr><th>Produk</th><th>Kategori</th><th>Modal</th><th>Jual</th><th>Stok</th><th className="text-right">Aksi</th></tr>
                </thead>
                <tbody>
                  {products.filter(p => (selectedCategory === 'Semua' || p.category === selectedCategory) && p.name.toLowerCase().includes(inventorySearch.toLowerCase())).map(p => (
                    <tr key={p.id}>
                      <td data-label="Produk"><div className="font-bold">{p.name}</div><div className="text-[10px] text-slate-400 font-mono">{p.barcode || '-'}</div></td>
                      <td data-label="Kategori"><span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-500">{p.category}</span></td>
                      <td data-label="Modal" className="text-slate-400">{formatPrice(p.costPrice)}</td>
                      <td data-label="Jual" className="font-bold">{formatPrice(p.price)}</td>
                      <td data-label="Stok">
                        <div className="flex items-center justify-end gap-3 sm:justify-start">
                          <button onClick={() => updateStockQuickly(p.id, -1)} className="h-6 w-6 rounded border bg-white flex items-center justify-center">-</button>
                          <span className="min-w-[30px] text-center font-black">{p.stock}</span>
                          <button onClick={() => updateStockQuickly(p.id, 1)} className="h-6 w-6 rounded border bg-white flex items-center justify-center">+</button>
                        </div>
                      </td>
                      <td data-label="Aksi" className="text-right"><button onClick={() => { setEditingProduct(p); setShowProductModal(true); }} className="text-slate-400 hover:text-primary"><Edit2 size={18} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'debts' && (
          <div className="animate-slide-up">
            <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
              <div><h1 className="text-3xl">Kas Bon</h1><p className="text-xs text-slate-400">Daftar hutang pelanggan</p></div>
              <button onClick={() => setShowDebtModal(true)} className="btn btn-primary"><Plus size={18} /> Catat Hutang</button>
            </div>
            <div className="data-table-container">
              <table className="data-table">
                <thead className="hidden sm:table-header-group">
                  <tr><th>Nama Pelanggan</th><th>Jumlah</th><th>Tanggal</th><th>Status</th><th className="text-right">Aksi</th></tr>
                </thead>
                <tbody>
                  {debts.length === 0 ? <tr><td colSpan="5" className="text-center !py-20 text-slate-400">Tidak ada data hutang</td></tr> : 
                    debts.map(d => (
                      <tr key={d.id}>
                        <td data-label="Nama" className="font-bold">{d.name}</td>
                        <td data-label="Jumlah" className="font-black text-red-600">{formatPrice(d.amount)}</td>
                        <td data-label="Tanggal" className="text-slate-400">{d.date}</td>
                        <td data-label="Status">
                          <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase ${d.status === 'Lunas' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{d.status}</span>
                        </td>
                        <td data-label="Aksi" className="text-right">
                          {d.status !== 'Lunas' && <button onClick={() => markDebtPaid(d.id, d.name)} className="text-xs font-bold text-primary hover:underline">Bayar</button>}
                        </td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'transactions' && (
          <div className="animate-slide-up">
            <div className="mb-8 flex items-center justify-between">
              <div><h1 className="text-3xl">Laporan</h1><p className="text-xs text-slate-400">Riwayat transaksi penjualan</p></div>
              <button className="btn btn-outline" onClick={() => notify('Fitur Export CSV segera hadir')}><Download size={18} /> CSV</button>
            </div>
            <div className="data-table-container">
              <table className="data-table">
                <thead className="hidden sm:table-header-group">
                  <tr><th>ID TRX</th><th>Waktu</th><th>Pelanggan</th><th>Total</th><th>Profit</th><th className="text-right">Metode</th></tr>
                </thead>
                <tbody>
                  {transactions.map(t => (
                    <tr key={t.id}>
                      <td data-label="ID" className="font-mono text-[10px] text-slate-400">{t.id.slice(-8)}</td>
                      <td data-label="Waktu" className="text-xs">{t.date}</td>
                      <td data-label="Nama" className="font-bold">{t.customerName}</td>
                      <td data-label="Total" className="font-black">{formatPrice(t.total)}</td>
                      <td data-label="Profit" className="font-bold text-green-600">+{formatPrice(t.profit)}</td>
                      <td data-label="Metode" className="text-right"><span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase">{t.paymentMethod}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="animate-slide-up max-w-2xl">
            <h1 className="text-3xl mb-8">Pengaturan</h1>
            <div className="space-y-6">
              <div className="card">
                <h3 className="text-lg font-black mb-4 flex items-center gap-2"><Database className="text-primary" size={20} /> Database & Backup</h3>
                <p className="text-xs text-slate-400 mb-6">Amankan data toko Anda dengan mengekspor secara rutin atau pulihkan dari file cadangan.</p>
                <div className="flex flex-wrap gap-4">
                  <button onClick={exportAllData} className="btn btn-outline flex-1"><Download size={18} /> Backup (.json)</button>
                  <label className="btn btn-primary flex-1 cursor-pointer">
                    <Upload size={18} /> Import Data
                    <input type="file" className="hidden" accept=".json" onChange={importAllData} />
                  </label>
                </div>
              </div>
              
              <div className="card">
                <h3 className="text-lg font-black mb-4 flex items-center gap-2"><Store className="text-primary" size={20} /> Informasi Toko</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Nama Toko</label>
                    <input type="text" className="w-full rounded-lg border p-3 text-sm" defaultValue="Toko Klontong Madura" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Alamat Struk</label>
                    <textarea className="w-full rounded-lg border p-3 text-sm" rows="2" defaultValue="Jl. Raya Madura No. 88, Jawa Timur"></textarea>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* MODALS */}
      {showPaymentModal && (
        <div className="modal-overlay">
          <div className="modal !p-8 animate-slide-up">
            <div className="mb-8 flex items-center justify-between">
              <h2 className="text-2xl">Pembayaran</h2>
              <button onClick={() => setShowPaymentModal(false)}><X /></button>
            </div>
            <div className="mb-8 space-y-6">
              <div className="flex gap-4">
                {['Tunai', 'Hutang', 'QRIS'].map(m => (
                  <button key={m} onClick={() => setPaymentMethod(m)} className={`flex-1 rounded-2xl py-4 text-sm font-bold border-2 transition-all ${paymentMethod === m ? 'border-primary bg-primary/5 text-primary' : 'border-slate-100 hover:border-slate-200'}`}>{m}</button>
                ))}
              </div>
              {paymentMethod === 'Tunai' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-400 mb-1 block">Jumlah Uang Diterima</label>
                    <input type="number" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} className="w-full text-3xl font-black p-4 border-b-2 border-slate-100 focus:border-primary outline-none" placeholder="0" autoFocus />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {QUICK_CASH.map(val => (
                      <button key={val} onClick={() => setPaymentAmount(val.toString())} className="rounded-lg bg-slate-100 px-4 py-2 text-xs font-bold hover:bg-slate-200">+{val / 1000}rb</button>
                    ))}
                  </div>
                </div>
              )}
              {paymentMethod === 'Hutang' && (
                <div>
                  <label className="text-xs font-bold text-slate-400 mb-1 block">Nama Pelanggan (Bon)</label>
                  <input type="text" value={debtCustomerName} onChange={e => setDebtCustomerName(e.target.value)} className="w-full text-xl font-bold p-4 border-b-2 border-slate-100 focus:border-primary outline-none" placeholder="Masukkan nama..." autoFocus />
                </div>
              )}
            </div>
            <div className="bg-slate-50 p-6 rounded-2xl mb-8">
              <div className="flex justify-between items-center mb-2">
                <span className="text-slate-500">Total Tagihan</span>
                <span className="text-xl font-black">{formatPrice(cart.reduce((s, i) => s + (i.price * i.quantity), 0) - discount)}</span>
              </div>
              {paymentMethod === 'Tunai' && Number(paymentAmount) > 0 && (
                <div className="flex justify-between items-center text-green-600 font-bold border-t pt-2 mt-2">
                  <span>Kembalian</span>
                  <span>{formatPrice(Math.max(0, Number(paymentAmount) - (cart.reduce((s, i) => s + (i.price * i.quantity), 0) - discount)))}</span>
                </div>
              )}
            </div>
            <button onClick={finalizeTransaction} className="btn btn-primary w-full !py-4 text-lg">PROSES TRANSAKSI</button>
          </div>
        </div>
      )}

      {showProductModal && (
        <div className="modal-overlay">
          <form onSubmit={saveProduct} className="modal animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl">{editingProduct ? 'Edit Produk' : 'Produk Baru'}</h2>
              <button type="button" onClick={() => setShowProductModal(false)}><X /></button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="col-span-2">
                <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Nama Produk</label>
                <input name="name" defaultValue={editingProduct?.name} required className="w-full rounded-xl border p-3" />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Barcode</label>
                <div className="relative">
                  <input name="barcode" value={scannedBarcode || editingProduct?.barcode || ''} onChange={e => setScannedBarcode(e.target.value)} className="w-full rounded-xl border p-3 pr-10" />
                  <button type="button" onClick={() => { setScannerMode('product'); setShowScannerModal(true); }} className="absolute right-3 top-3 text-primary"><ScanLine size={18} /></button>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Kategori</label>
                <select name="category" defaultValue={editingProduct?.category} className="w-full rounded-xl border p-3">
                  {CATEGORIES.slice(1).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Harga Modal</label>
                <input name="costPrice" type="number" defaultValue={editingProduct?.costPrice} required className="w-full rounded-xl border p-3" />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Harga Jual</label>
                <input name="price" type="number" defaultValue={editingProduct?.price} required className="w-full rounded-xl border p-3" />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Stok Awal</label>
                <input name="stock" type="number" defaultValue={editingProduct?.stock} required className="w-full rounded-xl border p-3" />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Satuan</label>
                <select name="unit" defaultValue={editingProduct?.unit} className="w-full rounded-xl border p-3">
                  {['Pcs', 'Kg', 'Bag', 'Box', 'Liter'].map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>
            <button className="btn btn-primary w-full !py-4">SIMPAN PRODUK</button>
          </form>
        </div>
      )}

      {showDebtModal && (
        <div className="modal-overlay">
          <form onSubmit={addDebtManual} className="modal !max-w-md animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl">Catat Hutang</h2>
              <button type="button" onClick={() => setShowDebtModal(false)}><X /></button>
            </div>
            <div className="space-y-4 mb-6">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Nama Pelanggan</label>
                <input name="customerName" required className="w-full rounded-xl border p-3" />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Jumlah Hutang</label>
                <input name="amount" type="number" required className="w-full rounded-xl border p-3" />
              </div>
            </div>
            <button className="btn btn-primary w-full">SIMPAN DATA</button>
          </form>
        </div>
      )}

      {showRestockModal && (
        <div className="modal-overlay">
          <div className="modal !max-w-3xl animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl">Restok Barang</h2>
              <button onClick={() => setShowRestockModal(false)}><X /></button>
            </div>
            <div className="mb-6 relative">
              <Search className="absolute left-3 top-3.5 text-slate-400" size={18} />
              <input type="text" placeholder="Cari barang atau scan..." className="w-full rounded-xl border p-3 pl-10" onChange={e => {
                const p = products.find(prod => prod.name.toLowerCase().includes(e.target.value.toLowerCase()) || prod.barcode === e.target.value);
                if (p && e.target.value.length > 2) { addToRestock(p); e.target.value = ''; }
              }} />
              <button onClick={() => { setScannerMode('restock'); setShowScannerModal(true); }} className="absolute right-3 top-3 text-primary"><ScanLine size={18} /></button>
            </div>
            <div className="max-h-60 overflow-y-auto mb-6">
              <table className="w-full text-sm">
                <thead><tr className="text-slate-400 border-b">
                  <th className="text-left py-2">Barang</th>
                  <th className="text-center py-2">Tambah</th>
                  <th className="text-right py-2">Modal Baru</th>
                  <th className="w-10"></th>
                </tr></thead>
                <tbody>
                  {restockCart.map(item => (
                    <tr key={item.id} className="border-b last:border-0">
                      <td className="py-3 font-bold">{item.name}</td>
                      <td className="py-3"><input type="number" className="w-16 mx-auto block border rounded p-1 text-center" value={item.addedQty} onChange={e => setRestockCart(prev => prev.map(i => i.id === item.id ? { ...i, addedQty: e.target.value } : i))} /></td>
                      <td className="py-3"><input type="number" className="w-24 ml-auto block border rounded p-1 text-right" value={item.newCostPrice} onChange={e => setRestockCart(prev => prev.map(i => i.id === item.id ? { ...i, newCostPrice: e.target.value } : i))} /></td>
                      <td><button onClick={() => setRestockCart(prev => prev.filter(i => i.id !== item.id))} className="text-red-400 p-2"><Trash2 size={16} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button onClick={finalizeRestock} className="btn btn-primary w-full" disabled={restockCart.length === 0}>SIMPAN PERUBAHAN</button>
          </div>
        </div>
      )}

      {showReceiptModal && lastReceipt && (
        <div className="modal-overlay no-print">
          <div className="modal !max-w-sm animate-slide-up">
            <div id="receipt-content" className="bg-white p-4 font-mono text-xs">
              <div className="text-center mb-4">
                <div className="text-lg font-bold">TOKO KLONTONG MADURA</div>
                <div>Jl. Raya Madura No. 88</div>
                <div>--------------------------------</div>
              </div>
              <div className="mb-2 flex justify-between"><span>{lastReceipt.date}</span><span>{lastReceipt.id.slice(-8)}</span></div>
              <div className="mb-4">--------------------------------</div>
              {lastReceipt.items.map(i => (
                <div key={i.id} className="mb-1">
                  <div>{i.name}</div>
                  <div className="flex justify-between"><span>{i.quantity} x {formatPrice(i.price)}</span><span>{formatPrice(i.quantity * i.price)}</span></div>
                </div>
              ))}
              <div className="mt-4 border-t pt-2">
                <div className="flex justify-between font-bold"><span>TOTAL</span><span>{formatPrice(lastReceipt.total)}</span></div>
                <div className="flex justify-between"><span>BAYAR ({lastReceipt.paymentMethod})</span><span>{formatPrice(lastReceipt.paidAmount)}</span></div>
                <div className="flex justify-between"><span>KEMBALI</span><span>{formatPrice(lastReceipt.change)}</span></div>
              </div>
              <div className="text-center mt-6">TERIMA KASIH</div>
            </div>
            <div className="mt-6 flex gap-2">
              <button onClick={() => window.print()} className="btn btn-primary flex-1"><Printer size={18} /> CETAK</button>
              <button onClick={() => setShowReceiptModal(false)} className="btn btn-outline flex-1">TUTUP</button>
            </div>
          </div>
        </div>
      )}

      {/* NOTIFICATIONS */}
      <div className="fixed bottom-20 right-4 z-[60] flex flex-col gap-2 pointer-events-none">
        {notifications.map(n => (
          <div key={n.id} className="toast pointer-events-auto bg-white shadow-xl animate-slide-up border-l-4 border-primary">
            {n.message}
          </div>
        ))}
      </div>

      {/* SCANNER MODAL */}
      {showScannerModal && (
        <div className="modal-overlay z-[70]">
          <div className="modal !max-w-md p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-bold uppercase tracking-widest text-xs">Scanner Kamera</h3>
              <button onClick={() => setShowScannerModal(false)}><X /></button>
            </div>
            <div id="reader" className="overflow-hidden rounded-2xl bg-slate-100"></div>
          </div>
        </div>
      )}
    </div>
  );
}
