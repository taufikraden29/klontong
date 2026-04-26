import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  ShoppingCart, Package, History, Plus, Search, Trash2, X, Store, ScanLine, Edit2, 
  RefreshCw, LineChart, Users, Settings as SettingsIcon, Eraser, Download, Upload, 
  Database, Printer, ChevronRight, TrendingUp, AlertTriangle, ArrowRight, Minus, 
  CheckCircle2, QrCode, Banknote, Percent, ListFilter, FileText, Settings2, 
  ArrowUpRight, ArrowDownRight, Keyboard, Clock, PieChart, Tag, Monitor, 
  Smartphone, Info, ShieldCheck, AlertCircle, Zap, Globe, Wallet, Cpu, 
  ArrowDownCircle, ArrowUpCircle, CreditCard
} from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';

// Core
import { useKlontongData } from './hooks/useKlontongData';
import { formatPrice, isSameDay } from './utils/helpers';
import { QUICK_CASH, PPOB_CATEGORIES, INITIAL_CATEGORIES } from './constants/appConstants';

// Layout
import { Sidebar, BottomNav } from './components/layout/Navigation';

// Features
import { Dashboard } from './features/dashboard/Dashboard';
import { POS } from './features/pos/POS';
import { PPOB } from './features/ppob/PPOB';
import { Inventory } from './features/inventory/Inventory';
import { History as TransactionHistory } from './features/transactions/History';
import { Debts } from './features/transactions/Debts';
import { StockLogs } from './features/transactions/StockLogs';
import { Settings } from './features/settings/Settings';

export default function App() {
  const {
    products, setProducts,
    categories, setCategories,
    transactions, setTransactions,
    debts, setDebts,
    stockLogs, setStockLogs,
    settings, setSettings,
    addStockLog,
    updateSetting,
    resetAllData
  } = useKlontongData();

  // --- UI STATE ---
  const [activeTab, setActiveTab] = useState('dashboard');
  const [cart, setCart] = useState([]);
  const [notifications, setNotifications] = useState([]);
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
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // PPOB State
  const [ppobType, setPpobType] = useState('pulsa');
  const [ppobNumber, setPpobNumber] = useState('');
  const [ppobAmount, setPpobAmount] = useState('');
  const [ppobCost, setPpobCost] = useState('');
  const [ppobPrice, setPpobPrice] = useState('');
  const [ppobAdminFee, setPpobAdminFee] = useState('');

  const barcodeBuffer = useRef('');
  const lastKeyTime = useRef(0);

  // Global Keyboard Listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'F2') { e.preventDefault(); if (cart.length > 0) setShowPaymentModal(true); }
      if (e.key === 'Escape') { 
        setShowPaymentModal(false); setShowScannerModal(false); 
        setShowProductModal(false); setShowReceiptModal(false); 
        setShowDebtModal(false); setShowRestockModal(false);
        setShowMobileCart(false); setShowOpnameModal(false);
        setShowResetConfirm(false);
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
      id: transactionId, 
      date: new Date().toISOString(),
      displayDate: new Date().toLocaleString('id-ID'),
      items: [...cart], subtotal: cartSubtotal, discount: discount, total: total, profit: total - totalCost,
      paidAmount: paymentMethod === 'Tunai' ? Number(paymentAmount) : (paymentMethod === 'Hutang' ? 0 : total),
      change: paymentMethod === 'Tunai' ? Math.max(0, Number(paymentAmount) - total) : 0,
      paymentMethod, customerName: paymentMethod === 'Hutang' ? debtCustomerName : 'Umum'
    };

    if (paymentMethod === 'Hutang') {
      setDebts(prev => [{ id: Date.now(), name: debtCustomerName, amount: total, date: new Date().toISOString(), status: 'Belum Lunas' }, ...prev]);
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

  const finalizePpobTransaction = (e) => {
    e.preventDefault();
    if (!ppobNumber || !ppobPrice) { notify('Lengkapi data transaksi!', 'warning'); return; }

    const transactionId = `PPOB-${Date.now()}`;
    const categoryLabel = PPOB_CATEGORIES.find(c => c.id === ppobType)?.label || 'Digital';
    
    let itemLabel = '';
    let profit = 0;
    let totalSale = Number(ppobPrice);

    if (ppobType === 'tarik' || ppobType === 'setor') {
      const nominal = Number(ppobAmount);
      const fee = Number(ppobAdminFee);
      itemLabel = `${categoryLabel} ${formatPrice(nominal)} (${ppobNumber})`;
      profit = fee; 
      totalSale = fee;
    } else {
      itemLabel = `${categoryLabel} ${ppobAmount} (${ppobNumber})`;
      profit = Number(ppobPrice) - Number(ppobCost);
    }
    
    const newTransaction = {
      id: transactionId,
      date: new Date().toISOString(),
      displayDate: new Date().toLocaleString('id-ID'),
      items: [{ name: itemLabel, price: totalSale, quantity: 1, itemDiscount: 0 }],
      subtotal: totalSale, discount: 0, total: totalSale, profit: profit,
      paidAmount: totalSale, change: 0, paymentMethod: 'PPOB/Digital', customerName: 'Umum'
    };

    setTransactions(prev => [newTransaction, ...prev]);
    setLastReceipt(newTransaction);
    setPpobNumber(''); setPpobAmount(''); setPpobCost(''); setPpobPrice(''); setPpobAdminFee('');
    setShowReceiptModal(true);
    notify(`${categoryLabel} Berhasil!`);
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

  // --- DERIVED DATA ---
  const todayRevenue = transactions.filter(t => isSameDay(t.date, new Date())).reduce((s, t) => s + t.total, 0);
  const todayProfit = transactions.filter(t => isSameDay(t.date, new Date())).reduce((s, t) => s + t.profit, 0);
  const totalAsset = products.reduce((s, p) => s + (p.costPrice * p.stock), 0);
  const totalDebts = debts.filter(d => d.status === 'Belum Lunas').reduce((s, d) => s + d.amount, 0);

  return (
    <div className="flex min-h-screen bg-white font-inter">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} settings={settings} todayProfit={todayProfit} />
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className={`flex-1 lg:ml-64 p-4 md:p-8 lg:p-10 ${['pos', 'ppob'].includes(activeTab) ? 'pb-24 lg:pb-10' : 'pb-20 lg:pb-10'}`}>
        {activeTab === 'dashboard' && (
          <Dashboard 
            transactions={transactions} products={products} debts={debts} 
            settings={settings} todayRevenue={todayRevenue} todayProfit={todayProfit} 
            totalAsset={totalAsset} totalDebts={totalDebts} setActiveTab={setActiveTab} 
            categories={categories}
          />
        )}

        {activeTab === 'pos' && (
          <POS 
            products={products} categories={categories} cart={cart} setCart={setCart}
            addToCart={addToCart} updateCartQuantity={updateCartQuantity}
            searchTerm={searchTerm} setSearchTerm={setSearchTerm}
            selectedCategory={selectedCategory} setSelectedCategory={setSelectedCategory}
            cartSubtotal={cartSubtotal} cartTotal={cartTotal} discount={discount} setDiscount={setDiscount}
            setShowPaymentModal={setShowPaymentModal} setShowScannerModal={setShowScannerModal}
            setShowMobileCart={setShowMobileCart} setScannerMode={setScannerMode}
            setSearchTarget={setSearchTarget} settings={settings}
          />
        )}

        {activeTab === 'ppob' && (
          <PPOB 
            ppobType={ppobType} setPpobType={setPpobType} ppobNumber={ppobNumber} setPpobNumber={setPpobNumber}
            ppobAmount={ppobAmount} setPpobAmount={setPpobAmount} ppobCost={ppobCost} setPpobCost={setPpobCost}
            ppobPrice={ppobPrice} setPpobPrice={setPpobPrice} ppobAdminFee={ppobAdminFee} setPpobAdminFee={setPpobAdminFee}
            finalizePpobTransaction={finalizePpobTransaction}
          />
        )}

        {activeTab === 'inventory' && (
          <Inventory 
            products={products} categories={categories} inventorySearch={inventorySearch} 
            setInventorySearch={setInventorySearch} selectedCategory={selectedCategory} 
            setSelectedCategory={setSelectedCategory} inventoryFilter={inventoryFilter} 
            setInventoryFilter={setInventoryFilter} settings={settings}
            setShowRestockModal={setShowRestockModal} setEditingProduct={setEditingProduct}
            setShowProductModal={setShowProductModal} setOpnameTarget={setOpnameTarget}
            setShowOpnameModal={setShowOpnameModal}
          />
        )}

        {activeTab === 'stock_logs' && <StockLogs stockLogs={stockLogs} />}
        {activeTab === 'debts' && <Debts debts={debts} setDebts={setDebts} notify={notify} setShowDebtModal={setShowDebtModal} />}
        {activeTab === 'transactions' && <TransactionHistory transactions={transactions} />}
        
        {activeTab === 'settings' && (
          <Settings 
            settings={settings} updateSetting={updateSetting} categories={categories} 
            addCategory={addCategory} deleteCategory={deleteCategory} 
            exportAllData={() => {}} importAllData={() => {}} setShowResetConfirm={setShowResetConfirm} 
          />
        )}
      </main>

      {/* --- MODALS (Shared / Complex) --- */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-neutral-900/80 backdrop-blur-md animate-fade-in">
           <div className="card-minimal w-full max-w-sm !p-8 bg-white rounded-[2rem] text-center">
              <div className="h-16 w-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6"><AlertTriangle size={32} /></div>
              <h3 className="text-lg font-bold mb-2">Hapus Semua Data?</h3>
              <p className="text-sm text-neutral-400 mb-8">Semua produk, transaksi, hutang, dan pengaturan akan dihapus permanen.</p>
              <div className="flex flex-col gap-2">
                 <button onClick={resetAllData} className="w-full h-12 bg-red-600 text-white rounded-xl text-xs font-bold uppercase tracking-widest">YA, HAPUS SEKARANG</button>
                 <button onClick={() => setShowResetConfirm(false)} className="w-full h-12 bg-neutral-100 text-neutral-600 rounded-xl text-xs font-bold uppercase tracking-widest">BATALKAN</button>
              </div>
           </div>
        </div>
      )}

      {showMobileCart && (
        <div className="fixed inset-0 z-[100] flex items-end bg-neutral-900/60 backdrop-blur-sm animate-fade-in lg:hidden">
          <div className="w-full bg-white rounded-t-[2rem] p-6 animate-fade-in-up max-h-[90vh] flex flex-col shadow-2xl overflow-hidden relative">
            <button onClick={() => setShowMobileCart(false)} className="absolute top-6 right-6 p-2 rounded-full bg-neutral-100 text-neutral-400 active:scale-90 z-20"><X size={20} /></button>
            <div className="h-1.5 w-12 bg-neutral-200 rounded-full mx-auto mb-6 shrink-0"></div>
            <div className="flex items-center justify-between mb-6 shrink-0">
              <h2 className="text-lg font-bold flex items-center gap-2"><ShoppingCart size={20} /> Detail Pesanan</h2>
            </div>
            <div className="flex-1 overflow-y-auto mb-6 space-y-4 pr-1">
              {cart.map(item => (
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

      {showReceiptModal && lastReceipt && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-md no-print animate-fade-in">
          <div className="w-full max-w-xs bg-white rounded-[2rem] overflow-hidden shadow-2xl flex flex-col relative">
            <button onClick={() => setShowReceiptModal(false)} className="absolute top-6 right-6 p-2 rounded-full bg-neutral-100 text-neutral-400 active:scale-90 z-20 no-print md:hidden"><X size={20} /></button>
            <div id="receipt-content" className="bg-white p-6 md:p-8 text-[10px] font-mono leading-tight text-neutral-900 overflow-y-auto">
              <div className="text-center mb-6 border-b-2 border-neutral-900 pb-4 shrink-0">
                <div className="text-base font-bold uppercase tracking-tight mb-1 leading-none">{settings.shopName}</div>
                <div className="text-[7px] text-neutral-400 font-bold font-sans uppercase">{settings.shopAddress}</div>
                <div className="text-[7px] text-neutral-400 font-bold font-sans uppercase">Telp: {settings.shopPhone}</div>
              </div>
              <div className="mb-4 flex justify-between font-bold border-b border-neutral-100 pb-2 text-[8px]"><span>TRX {lastReceipt.id.slice(-6)}</span><span>{(lastReceipt.displayDate || lastReceipt.date).split(',')[0]}</span></div>
              <div className="space-y-3 mb-6 border-b border-dashed border-neutral-300 pb-4 text-left">
                {lastReceipt.items.map(i => (<div key={i.id}><div className="flex justify-between font-bold uppercase"><span>{i.name}</span><span>{formatPrice(i.quantity * i.price)}</span></div><div className="flex justify-between text-neutral-500 text-[7px] uppercase"><span>{i.quantity} x {formatPrice(i.price)}</span>{i.itemDiscount > 0 && <span>Disc -{formatPrice(i.itemDiscount)}</span>}</div></div>))}
              </div>
              <div className="space-y-1.5 text-left text-[9px] font-bold">
                <div className="flex justify-between text-xs"><span>TOTAL</span><span>{formatPrice(lastReceipt.total)}</span></div>
                <div className="flex justify-between text-neutral-500"><span>BAYAR ({lastReceipt.paymentMethod})</span><span>{formatPrice(lastReceipt.paidAmount)}</span></div>
                <div className="flex justify-between text-neutral-400"><span>KEMBALI</span><span>{formatPrice(lastReceipt.change)}</span></div>
              </div>
              <div className="mt-8 pt-4 border-t border-dashed border-neutral-200 text-center text-[7px] font-bold uppercase tracking-widest text-neutral-300 italic">{settings.receiptFooter}</div>
            </div>
            <div className="p-4 bg-neutral-50 flex gap-2 border-t border-neutral-100 shrink-0">
              <button onClick={() => window.print()} className="btn-primary flex-1 h-12 text-[10px] font-bold uppercase"><Printer size={16} /> Print</button>
              <button onClick={() => setShowReceiptModal(false)} className="btn-secondary flex-1 h-12 text-[10px] font-bold uppercase">Tutup</button>
            </div>
          </div>
        </div>
      )}

      {showScannerModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-neutral-900/90 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-sm bg-white rounded-[2rem] p-6 relative overflow-hidden">
            <button onClick={() => setShowScannerModal(false)} className="absolute top-4 right-4 z-10 p-2 bg-white/80 rounded-full text-neutral-400 active:scale-90"><X size={20} /></button>
            <h3 className="text-sm font-bold mb-4 flex items-center gap-3"><QrCode className="text-primary" size={20} /> SCANNER AKTIF</h3>
            <div id="reader" className="overflow-hidden rounded-2xl border-4 border-neutral-50 bg-black aspect-square"></div>
          </div>
        </div>
      )}

      {showRestockModal && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-6 bg-neutral-900/60 backdrop-blur-sm animate-fade-in">
          <div className="card-minimal w-full max-w-2xl !p-6 md:!p-8 relative bg-white rounded-t-[2rem] md:rounded-[2rem] h-[90vh] md:h-auto flex flex-col overflow-hidden">
            <button onClick={() => setShowRestockModal(false)} className="absolute top-6 right-6 p-2 rounded-full bg-neutral-100 text-neutral-400 active:scale-90 z-20"><X size={20} /></button>
            <h2 className="text-xl font-bold mb-6 flex items-center gap-3"><RefreshCw size={24} className="text-primary" /> Restok Barang Masuk</h2>
            <div className="flex-1 overflow-y-auto mb-6 pr-1 space-y-4">
               {restockCart.length === 0 ? (
                 <div className="text-center py-20 bg-neutral-50 rounded-[2rem] border-2 border-dashed border-neutral-100 text-neutral-300">
                    <ScanLine size={48} className="mx-auto mb-4 opacity-20" />
                    <p className="text-[10px] font-bold uppercase tracking-widest">Gunakan Scanner atau cari barang</p>
                    <button onClick={() => { setScannerMode('restock'); setShowScannerModal(true); }} className="mt-4 btn-primary text-[10px] font-bold px-6 h-10 uppercase tracking-widest">Buka Scanner</button>
                 </div>
               ) : restockCart.map(item => (
                 <div key={item.id} className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-neutral-50 rounded-2xl border border-neutral-100">
                    <div className="flex-1"><div className="font-bold text-xs uppercase">{item.name}</div><div className="text-[10px] text-neutral-400">Stok Saat Ini: {item.stock} {item.unit}</div></div>
                    <div className="flex gap-3">
                       <div className="flex-1">
                          <label className="text-[8px] font-bold uppercase text-neutral-400 block mb-1">Qty Tambahan</label>
                          <input type="number" className="input-minimal h-10 w-24 text-xs" value={item.addedQty} onChange={(e) => setRestockCart(prev => prev.map(i => i.id === item.id ? { ...i, addedQty: e.target.value } : i))} />
                       </div>
                       <div className="flex-1">
                          <label className="text-[8px] font-bold uppercase text-neutral-400 block mb-1">Harga Modal Baru</label>
                          <input type="number" className="input-minimal h-10 w-32 text-xs" value={item.newCostPrice} onChange={(e) => setRestockCart(prev => prev.map(i => i.id === item.id ? { ...i, newCostPrice: e.target.value } : i))} />
                       </div>
                       <button onClick={() => setRestockCart(prev => prev.filter(i => i.id !== item.id))} className="self-end p-2 text-red-400 hover:bg-red-50 rounded-xl transition-colors"><Trash2 size={18} /></button>
                    </div>
                 </div>
               ))}
            </div>
            <button onClick={finalizeRestock} disabled={restockCart.length === 0} className="btn-primary w-full h-14 font-bold text-sm tracking-widest active:scale-95 shadow-xl shadow-primary/20">KONFIRMASI STOK MASUK</button>
          </div>
        </div>
      )}

      {showOpnameModal && opnameTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-sm animate-fade-in">
           <form onSubmit={finalizeOpname} className="card-minimal w-full max-w-sm !p-8 bg-white rounded-[2rem]">
              <h3 className="text-lg font-bold mb-6 flex items-center gap-2"><Settings2 className="text-primary" /> Penyesuaian Stok</h3>
              <div className="mb-6 p-4 bg-neutral-50 rounded-2xl"><div className="text-[10px] font-bold text-neutral-400 uppercase mb-1">Produk</div><div className="font-bold text-sm uppercase">{opnameTarget.name}</div><div className="text-[10px] text-neutral-500 mt-1">Stok Tercatat: {opnameTarget.stock} {opnameTarget.unit}</div></div>
              <div className="space-y-4">
                 <div><label className="text-[10px] font-bold uppercase text-neutral-400 block mb-1.5 tracking-wider">Stok Fisik Sebenarnya</label><input name="newStock" type="number" required className="input-minimal h-12 text-lg font-bold" defaultValue={opnameTarget.stock} autoFocus /></div>
                 <div><label className="text-[10px] font-bold uppercase text-neutral-400 block mb-1.5 tracking-wider">Alasan Perubahan</label><select name="reason" className="input-minimal h-11 text-xs" required><option value="Opname Rutin">Opname Rutin</option><option value="Barang Rusak">Barang Rusak</option><option value="Barang Hilang">Barang Hilang</option><option value="Bonus/Hadiah">Bonus/Hadiah</option><option value="Lainnya">Lainnya</option></select></div>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-8"><button type="button" onClick={() => setShowOpnameModal(false)} className="btn-secondary h-12 text-[10px] font-bold uppercase">Batal</button><button type="submit" className="btn-primary h-12 text-[10px] font-bold uppercase">Simpan</button></div>
           </form>
        </div>
      )}

      <div className="fixed top-4 md:top-auto md:bottom-20 right-4 left-4 md:left-auto md:right-10 z-[300] flex flex-col gap-3 pointer-events-none items-center md:items-end">
        {notifications.map(n => (<div key={n.id} className="pointer-events-auto flex items-center gap-3 bg-neutral-900 text-white rounded-2xl px-6 py-4 shadow-2xl animate-fade-in text-[11px] font-bold min-w-[200px] border border-white/10">{n.type === 'success' ? <CheckCircle2 size={16} className="text-green-400" /> : <AlertTriangle size={16} className="text-red-400" />}<span>{n.message}</span></div>))}
      </div>
    </div>
  );
}
