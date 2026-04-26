import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  LayoutGrid, 
  ShoppingCart, 
  Package, 
  History, 
  Plus, 
  Search, 
  Trash2, 
  ChevronRight, 
  CheckCircle2, 
  X,
  CreditCard,
  TrendingUp,
  Store,
  Maximize,
  ScanLine,
  Edit2,
  AlertTriangle,
  Filter,
  Download,
  DollarSign,
  Box,
  ArrowUpRight,
  TrendingDown,
  Printer,
  Eraser,
  QrCode,
  Banknote,
  Users,
  LineChart,
  PieChart,
  ClipboardList,
  UserPlus
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
const UNITS = ['Pcs', 'Kg', 'Bag', 'Box', 'Liter', 'Sachet', 'Botol'];
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
  
  const barcodeBuffer = useRef('');
  const lastKeyTime = useRef(0);

  // Persistence
  useEffect(() => localStorage.setItem('klontong_products', JSON.stringify(products)), [products]);
  useEffect(() => localStorage.setItem('klontong_transactions', JSON.stringify(transactions)), [transactions]);
  useEffect(() => localStorage.setItem('klontong_debts', JSON.stringify(debts)), [debts]);

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

  // Actions
  const notify = (message, type = 'success') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 3000);
  };

  const handleBarcodeScanned = (code) => {
    const product = products.find(p => p.barcode === code);
    if (product) {
      addToCart(product);
      notify(`Berhasil scan: ${product.name}`);
    } else {
      notify(`Barcode ${code} tidak terdaftar!`, 'error');
    }
  };

  const addToCart = (product) => {
    if (product.stock <= 0) {
      notify('Stok habis!', 'error');
      return;
    }
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          notify('Stok tidak mencukupi!', 'warning');
          return prev;
        }
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    if (activeTab !== 'pos') notify(`Ditambahkan ke keranjang: ${product.name}`);
  };

  const updateCartQuantity = (id, delta) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        const product = products.find(p => p.id === id);
        if (delta > 0 && newQty > product.stock) {
          notify('Stok tidak mencukupi!', 'warning');
          return item;
        }
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const finalizeTransaction = () => {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const total = subtotal - discount;
    const totalCost = cart.reduce((sum, item) => sum + (item.costPrice * item.quantity), 0);
    
    if (paymentMethod === 'Tunai' && Number(paymentAmount) < total) {
      notify('Jumlah uang kurang!', 'error');
      return;
    }
    if (paymentMethod === 'Hutang' && !debtCustomerName) {
      notify('Nama pelanggan wajib diisi untuk Kas Bon!', 'warning');
      return;
    }

    const transactionId = `TRX-${Date.now()}`;
    const newTransaction = {
      id: transactionId,
      date: new Date().toLocaleString('id-ID'),
      items: [...cart],
      subtotal, discount, total,
      profit: total - totalCost,
      paidAmount: paymentMethod === 'Tunai' ? Number(paymentAmount) : (paymentMethod === 'Hutang' ? 0 : total),
      change: paymentMethod === 'Tunai' ? Number(paymentAmount) - total : 0,
      paymentMethod,
      customerName: paymentMethod === 'Hutang' ? debtCustomerName : 'Umum'
    };

    if (paymentMethod === 'Hutang') {
      const newDebt = {
        id: Date.now(),
        name: debtCustomerName,
        amount: total,
        date: new Date().toLocaleDateString('id-ID'),
        status: 'Belum Lunas',
        transactionId
      };
      setDebts(prev => [newDebt, ...prev]);
      notify(`Kas Bon dicatat atas nama ${debtCustomerName}`);
    }

    setProducts(prev => prev.map(p => {
      const cartItem = cart.find(item => item.id === p.id);
      return cartItem ? { ...p, stock: p.stock - cartItem.quantity } : p;
    }));

    setTransactions(prev => [newTransaction, ...prev]);
    setLastReceipt(newTransaction);
    setCart([]); setDiscount(0); setPaymentAmount(''); setPaymentMethod('Tunai'); setDebtCustomerName(''); setShowPaymentModal(false); setShowReceiptModal(true);
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
    if (editingProduct) {
      setProducts(prev => prev.map(p => p.id === editingProduct.id ? productData : p));
      notify(`Berhasil update: ${productData.name}`);
    } else {
      setProducts(prev => [...prev, productData]);
      notify(`Produk baru terdaftar: ${productData.name}`);
    }
    setShowProductModal(false); setEditingProduct(null);
  };

  const exportSalesCSV = () => {
    const headers = ['ID', 'Tanggal', 'Subtotal', 'Diskon', 'Total', 'Profit', 'Metode', 'Pelanggan'];
    const rows = transactions.map(t => [t.id, t.date, t.subtotal, t.discount, t.total, t.profit, t.paymentMethod, t.customerName]);
    let csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(r => r.join(",")).join("\n");
    const link = document.createElement("a"); link.setAttribute("href", encodeURI(csvContent)); link.setAttribute("download", `laporan_penjualan_${new Date().toLocaleDateString()}.csv`); link.click();
    notify('Laporan berhasil didownload');
  };

  const markDebtPaid = (id, name) => {
    setDebts(prev => prev.map(item => item.id === id ? { ...item, status: 'Lunas' } : item));
    notify(`Hutang ${name} telah lunas!`, 'success');
  };

  // --- STATS ---
  const todaySales = transactions.filter(t => {
    const trxDate = new Date(t.date.split(',')[0].split('/').reverse().join('-'));
    return trxDate.toDateString() === new Date().toDateString();
  });
  
  const todayRevenue = todaySales.reduce((sum, t) => sum + t.total, 0);
  const todayProfit = todaySales.reduce((sum, t) => sum + t.profit, 0);
  const totalAsset = products.reduce((sum, p) => sum + (p.costPrice * p.stock), 0);
  const totalDebts = debts.filter(d => d.status === 'Belum Lunas').reduce((sum, d) => sum + d.amount, 0);
  const avgTransaction = todaySales.length > 0 ? todayRevenue / todaySales.length : 0;

  // 7-Day Trend
  const last7Days = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString('id-ID');
      const dayRevenue = transactions
        .filter(t => t.date.includes(dateStr))
        .reduce((sum, t) => sum + t.total, 0);
      days.push({ name: d.toLocaleDateString('id-ID', { weekday: 'short' }), revenue: dayRevenue });
    }
    return days;
  }, [transactions]);

  const maxRevenue = Math.max(...last7Days.map(d => d.revenue), 100000);

  const topProducts = useMemo(() => {
    const counts = {};
    transactions.forEach(t => t.items.forEach(item => {
      counts[item.name] = (counts[item.name] || 0) + item.quantity;
    }));
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [transactions]);

  const categoryPerformance = useMemo(() => {
    const perf = {};
    transactions.forEach(t => t.items.forEach(item => {
      perf[item.category] = (perf[item.category] || 0) + (item.price * item.quantity);
    }));
    return Object.entries(perf).sort((a, b) => b[1] - a[1]);
  }, [transactions]);

  const lowStock = products.filter(p => p.stock <= 10).sort((a, b) => a.stock - b.stock);

  // Targets
  const monthlyTarget = 10000000; // Rp 10jt
  const monthlyRevenue = transactions
    .filter(t => {
      const parts = t.date.split(',')[0].split('/');
      return parts[1] === (new Date().getMonth() + 1).toString().padStart(2, '0');
    })
    .reduce((sum, t) => sum + t.total, 0);
  const targetProgress = Math.min(100, (monthlyRevenue / monthlyTarget) * 100);

  return (
    <div className="app-container">
      {/* ... sidebar remains same ... */}
      <div className="sidebar">
        <div className="logo">
          <div className="logo-icon"><Store size={24} color="white" /></div>
          <span className="logo-text">KLO<span style={{color: 'var(--primary-light)'}}>NTONG</span></span>
        </div>
        <div className="nav-links">
          <div className={`nav-link ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
            <LineChart size={20} /> <span>Dashboard</span>
          </div>
          <div className={`nav-link ${activeTab === 'pos' ? 'active' : ''}`} onClick={() => setActiveTab('pos')}>
            <ShoppingCart size={20} /> <span>Kasir (POS)</span>
          </div>
          <div className={`nav-link ${activeTab === 'inventory' ? 'active' : ''}`} onClick={() => setActiveTab('inventory')}>
            <Package size={20} /> <span>Inventori</span>
          </div>
          <div className={`nav-link ${activeTab === 'debts' ? 'active' : ''}`} onClick={() => setActiveTab('debts')}>
            <Users size={20} /> <span>Kas Bon (Hutang)</span>
          </div>
          <div className={`nav-link ${activeTab === 'transactions' ? 'active' : ''}`} onClick={() => setActiveTab('transactions')}>
            <History size={20} /> <span>Laporan Penjualan</span>
          </div>
        </div>
        <div style={{ marginTop: 'auto', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>
          <div style={{ color: '#9ca3af', fontSize: '0.75rem', marginBottom: '0.5rem' }}>Kas Hari Ini</div>
          <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{formatPrice(todayRevenue)}</div>
        </div>
      </div>
      
      <main className="main-content">
        {activeTab === 'dashboard' && (
          <div className="animate-fade-in">
            <h1 style={{fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.5rem'}}>Ringkasan Toko</h1>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
              <div className="card" style={{ background: 'var(--primary)', color: 'white' }}>
                <div style={{ opacity: 0.8, fontSize: '0.8rem' }}>Laba Bersih Hari Ini</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '0.5rem' }}>{formatPrice(todayProfit)}</div>
              </div>
              <div className="card">
                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Omzet Hari Ini</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '0.5rem' }}>{formatPrice(todayRevenue)}</div>
              </div>
              <div className="card">
                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Rata-rata Belanja</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '0.5rem' }}>{formatPrice(avgTransaction)}</div>
              </div>
              <div className="card" style={{ borderLeft: '4px solid #f59e0b' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Tagihan Kas Bon</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '0.5rem', color: '#f59e0b' }}>{formatPrice(totalDebts)}</div>
              </div>
              <div className="card">
                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Total Transaksi Hari Ini</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '0.5rem' }}>{todaySales.length} Transaksi</div>
              </div>
              <div className="card">
                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Nilai Stok (Aset)</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '0.5rem' }}>{formatPrice(totalAsset)}</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
              <div className="card">
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.5rem' }}>Tren Omzet 7 Hari Terakhir</h3>
                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '200px', padding: '0 1rem' }}>
                  {last7Days.map(day => (
                    <div key={day.name} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
                      <div style={{ width: '30px', height: `${(day.revenue / maxRevenue) * 150}px`, background: 'var(--primary)', borderRadius: '4px 4px 0 0', minHeight: '4px', transition: 'height 0.5s ease' }}></div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>{day.name}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="card">
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.5rem' }}>Target Omzet Bulanan</h3>
                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>{formatPrice(monthlyRevenue)}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>dari target {formatPrice(monthlyTarget)}</div>
                </div>
                <div style={{ width: '100%', height: '12px', background: '#f3f4f6', borderRadius: '10px', overflow: 'hidden', marginBottom: '0.5rem' }}>
                  <div style={{ width: `${targetProgress}%`, height: '100%', background: 'var(--primary)', borderRadius: '10px' }}></div>
                </div>
                <div style={{ textAlign: 'right', fontSize: '0.8rem', fontWeight: 700 }}>{targetProgress.toFixed(1)}%</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
              <div className="card">
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>Produk Terlaris</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {topProducts.map(([name, qty]) => (
                    <div key={name} className="flex-between" style={{ fontSize: '0.85rem' }}>
                      <span>{name}</span>
                      <span style={{ fontWeight: 700 }}>{qty}x</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="card">
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>Performa Kategori</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {categoryPerformance.map(([cat, rev]) => (
                    <div key={cat} style={{ marginBottom: '0.5rem' }}>
                      <div className="flex-between" style={{ fontSize: '0.8rem', marginBottom: '0.25rem' }}>
                        <span>{cat}</span>
                        <span style={{ fontWeight: 700 }}>{formatPrice(rev)}</span>
                      </div>
                      <div style={{ width: '100%', height: '4px', background: '#f3f4f6', borderRadius: '2px' }}>
                        <div style={{ width: `${(rev / todayRevenue) * 100}%`, height: '100%', background: 'var(--accent)', borderRadius: '2px' }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="card">
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', color: '#ef4444' }}>Stok Menipis</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {lowStock.slice(0, 5).map(p => (
                    <div key={p.id} className="flex-between" style={{ fontSize: '0.85rem' }}>
                      <span>{p.name}</span>
                      <span style={{ color: '#ef4444', fontWeight: 700 }}>{p.stock} {p.unit}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'pos' && (
          <div className="pos-layout animate-fade-in">
            <section>
              <div className="flex-between mb-4">
                <h1 style={{fontSize: '1.5rem', fontWeight: 800}}>Kasir Utama</h1>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button className="btn btn-outline" onClick={() => setShowScannerModal(true)}><ScanLine size={20} /></button>
                  <div style={{ position: 'relative', width: '300px' }}>
                    <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                    <input type="text" placeholder="Cari barang atau barcode..." className="card" style={{ width: '100%', padding: '0.75rem 0.75rem 0.75rem 2.5rem', borderRadius: '10px' }} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                  </div>
                </div>
              </div>
              <div className="product-grid">
                {products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || (p.barcode && p.barcode.includes(searchTerm))).map(product => (
                  <div key={product.id} className="card product-card" onClick={() => addToCart(product)} style={{ opacity: product.stock <= 0 ? 0.5 : 1 }}>
                    <div className="product-image"><Package size={32} strokeWidth={1.5} /></div>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600, textTransform: 'uppercase' }}>{product.category}</div>
                      <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{product.name}</div>
                      <div className="flex-between">
                        <span className="text-bold">{formatPrice(product.price)}</span>
                        <span style={{ fontSize: '0.8rem', color: product.stock <= 5 ? 'var(--primary)' : 'var(--text-muted)' }}>{product.stock} {product.unit}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
            <aside>
              <div className="card cart-panel">
                <div className="flex-between"><h2 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}><ShoppingCart size={20} /> Keranjang</h2><button onClick={() => setCart([])} style={{ color: '#6b7280', background: 'none', border: 'none' }}><Eraser size={18}/></button></div>
                <div className="cart-items">
                  {cart.length === 0 ? <div style={{ textAlign: 'center', color: '#9ca3af', marginTop: '2rem' }}><ShoppingCart size={48} style={{ opacity: 0.2 }} /><p>Kosong</p></div> : 
                    cart.map(item => (
                      <div key={item.id} className="cart-item">
                        <div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{item.name}</div><div style={{ fontSize: '0.8rem', color: '#6b7280' }}>{formatPrice(item.price)}</div></div>
                        <div className="flex-between" style={{ gap: '0.5rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', background: '#f3f4f6', borderRadius: '6px' }}>
                            <button onClick={() => updateCartQuantity(item.id, -1)} style={{ border: 'none', background: 'none', padding: '4px 8px' }}>-</button>
                            <span style={{ fontWeight: 600 }}>{item.quantity}</span>
                            <button onClick={() => updateCartQuantity(item.id, 1)} style={{ border: 'none', background: 'none', padding: '4px 8px' }}>+</button>
                          </div>
                          <button onClick={() => setCart(prev => prev.filter(i => i.id !== item.id))} style={{ color: '#ef4444', background: 'none', border: 'none' }}><Trash2 size={16} /></button>
                        </div>
                      </div>
                    ))
                  }
                </div>
                <div className="cart-total">
                  <div style={{ background: '#f9fafb', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem' }}>
                    <div className="flex-between" style={{ fontSize: '0.85rem', color: '#6b7280' }}><span>Subtotal</span><span>{formatPrice(cart.reduce((sum, i) => sum + (i.price * i.quantity), 0))}</span></div>
                    <div className="flex-between" style={{ fontSize: '0.85rem', color: '#10b981' }}><span>Diskon</span><span>-{formatPrice(discount)}</span></div>
                  </div>
                  <div className="flex-between" style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1rem' }}><span>TOTAL</span><span className="text-primary">{formatPrice(cart.reduce((sum, i) => sum + (i.price * i.quantity), 0) - discount)}</span></div>
                  <button className="btn btn-primary" style={{ width: '100%', padding: '1.25rem' }} disabled={cart.length === 0} onClick={() => setShowPaymentModal(true)}>BAYAR (F2)</button>
                </div>
              </div>
            </aside>
          </div>
        )}

        {activeTab === 'inventory' && (
          <div className="animate-fade-in">
            <div className="flex-between mb-6"><div><h1 style={{fontSize: '1.5rem', fontWeight: 800}}>Inventori Produk</h1><p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Kelola ketersediaan barang di rak</p></div><button className="btn btn-primary" onClick={() => { setEditingProduct(null); setShowProductModal(true); }}><Plus size={18} /> Tambah Produk</button></div>
            <div className="card mb-6" style={{ padding: '1rem', display: 'flex', gap: '1rem' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                <input type="text" placeholder="Cari nama atau barcode..." style={{ width: '100%', padding: '0.6rem 0.6rem 0.6rem 2.5rem', border: '1px solid var(--border)', borderRadius: '8px' }} value={inventorySearch} onChange={(e) => setInventorySearch(e.target.value)} />
              </div>
              <select style={{ padding: '0.6rem', border: '1px solid var(--border)', borderRadius: '8px' }} value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>{CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}</select>
            </div>
            <div className="card" style={{ overflow: 'hidden', padding: 0 }}>
              <table className="data-table">
                <thead><tr><th>Barcode</th><th>Nama</th><th>Kategori</th><th>Modal</th><th>Jual</th><th>Stok</th><th style={{ textAlign: 'right' }}>Aksi</th></tr></thead>
                <tbody>
                  {products.filter(p => (p.name.toLowerCase().includes(inventorySearch.toLowerCase()) || (p.barcode && p.barcode.includes(inventorySearch))) && (selectedCategory === 'Semua' || p.category === selectedCategory)).map(p => (
                    <tr key={p.id}>
                      <td style={{ fontFamily: 'monospace' }}>{p.barcode || '-'}</td>
                      <td style={{ fontWeight: 600 }}>{p.name}</td>
                      <td><span style={{ padding: '2px 8px', background: '#f3f4f6', borderRadius: '4px', fontSize: '0.7rem' }}>{p.category}</span></td>
                      <td>{formatPrice(p.costPrice)}</td>
                      <td style={{ fontWeight: 700 }}>{formatPrice(p.price)}</td>
                      <td><div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><span style={{ width: '8px', height: '8px', borderRadius: '50%', background: p.stock <= 0 ? '#ef4444' : p.stock <= 10 ? '#f59e0b' : '#10b981' }}></span>{p.stock} {p.unit}</div></td>
                      <td style={{ textAlign: 'right' }}><button className="btn btn-outline" style={{ padding: '0.4rem' }} onClick={() => { setEditingProduct(p); setShowProductModal(true); }}><Edit2 size={16} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'debts' && (
          <div className="animate-fade-in">
            <div className="flex-between mb-6"><div><h1 style={{fontSize: '1.5rem', fontWeight: 800}}>Kas Bon (Hutang Pelanggan)</h1><p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Catat pelanggan yang belum membayar lunas</p></div><button className="btn btn-primary" onClick={() => setShowDebtModal(true)}><Plus size={18} /> Catat Hutang</button></div>
            <div className="card" style={{ overflow: 'hidden', padding: 0 }}>
              <table className="data-table">
                <thead><tr><th>Nama Pelanggan</th><th>Jumlah</th><th>Tanggal</th><th>Status</th><th>Aksi</th></tr></thead>
                <tbody>
                  {debts.length === 0 ? <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>Tidak ada data hutang</td></tr> : 
                    debts.map(d => (
                      <tr key={d.id}>
                        <td style={{ fontWeight: 600 }}>{d.name}</td>
                        <td style={{ fontWeight: 700, color: d.status === 'Lunas' ? '#10b981' : '#ef4444' }}>{formatPrice(d.amount)}</td>
                        <td>{d.date}</td>
                        <td><span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700, background: d.status === 'Lunas' ? '#ecfdf5' : '#fee2e2', color: d.status === 'Lunas' ? '#047857' : '#b91c1c' }}>{d.status}</span></td>
                        <td>{d.status !== 'Lunas' && <button className="btn btn-outline" style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }} onClick={() => markDebtPaid(d.id, d.name)}>Tandai Lunas</button>}</td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'transactions' && (
          <div className="animate-fade-in">
            <div className="flex-between mb-6">
              <h1 style={{fontSize: '1.5rem', fontWeight: 800}}>Laporan Penjualan</h1>
              <button className="btn btn-outline" onClick={exportSalesCSV}><Download size={18}/> Export CSV</button>
            </div>
            <div className="card" style={{ overflow: 'hidden', padding: 0 }}>
              <table className="data-table">
                <thead><tr><th>ID</th><th>Waktu</th><th>Pelanggan</th><th>Omzet</th><th>Profit</th><th>Metode</th></tr></thead>
                <tbody>{transactions.map(t => (<tr key={t.id}><td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{t.id}</td><td>{t.date}</td><td style={{fontWeight: 600}}>{t.customerName}</td><td style={{ fontWeight: 700 }}>{formatPrice(t.total)}</td><td style={{ color: '#10b981' }}>+{formatPrice(t.profit)}</td><td><span style={{padding: '2px 6px', background: '#f3f4f6', borderRadius: '4px', fontSize: '0.75rem'}}>{t.paymentMethod}</span></td></tr>))}</tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* NOTIFICATIONS */}
      <div className="toast-container">
        {notifications.map(n => (
          <div key={n.id} className={`toast ${n.type}`}>
            <div className="toast-icon">
              {n.type === 'success' && <CheckCircle2 size={20} color="#10b981" />}
              {n.type === 'error' && <AlertTriangle size={20} color="#ef4444" />}
              {n.type === 'warning' && <AlertTriangle size={20} color="#f59e0b" />}
              {n.type === 'info' && <Search size={20} color="#3b82f6" />}
            </div>
            <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{n.message}</div>
          </div>
        ))}
      </div>

      {/* MODALS */}
      {showPaymentModal && (
        <div className="modal-overlay">
          <div className="modal animate-fade-in" style={{ maxWidth: '850px', display: 'grid', gridTemplateColumns: '1fr 320px', gap: '2rem' }}>
            <div style={{ borderRight: '1px solid var(--border)', paddingRight: '2rem' }}>
              <div className="flex-between mb-6"><h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Pembayaran</h2><button onClick={() => setShowPaymentModal(false)} style={{ background: 'none', border: 'none' }}><X /></button></div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '2rem' }}>
                <div onClick={() => setPaymentMethod('Tunai')} className={`card ${paymentMethod === 'Tunai' ? 'active' : ''}`} style={{ cursor: 'pointer', textAlign: 'center', padding: '1rem', border: paymentMethod === 'Tunai' ? '2px solid var(--primary)' : '1px solid var(--border)' }}>
                  <Banknote size={24} style={{ margin: '0 auto 0.5rem' }}/><div style={{ fontWeight: 700 }}>Tunai</div>
                </div>
                <div onClick={() => setPaymentMethod('QRIS')} className={`card ${paymentMethod === 'QRIS' ? 'active' : ''}`} style={{ cursor: 'pointer', textAlign: 'center', padding: '1rem', border: paymentMethod === 'QRIS' ? '2px solid var(--primary)' : '1px solid var(--border)' }}>
                  <QrCode size={24} style={{ margin: '0 auto 0.5rem' }}/><div style={{ fontWeight: 700 }}>QRIS</div>
                </div>
                <div onClick={() => setPaymentMethod('Hutang')} className={`card ${paymentMethod === 'Hutang' ? 'active' : ''}`} style={{ cursor: 'pointer', textAlign: 'center', padding: '1rem', border: paymentMethod === 'Hutang' ? '2px solid #ef4444' : '1px solid var(--border)' }}>
                  <UserPlus size={24} color="#ef4444" style={{ margin: '0 auto 0.5rem' }}/><div style={{ fontWeight: 700 }}>Kas Bon</div>
                </div>
              </div>
              
              {paymentMethod === 'Tunai' && (
                <div>
                  <label style={{ display: 'block', fontWeight: 700, marginBottom: '0.5rem' }}>Uang Diterima</label>
                  <input type="number" className="card" style={{ width: '100%', fontSize: '2rem', fontWeight: 800, padding: '1rem', textAlign: 'right', marginBottom: '1rem' }} value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} autoFocus />
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>{QUICK_CASH.map(amt => <button key={amt} className="btn btn-outline" onClick={() => setPaymentAmount(amt)}>{formatPrice(amt)}</button>)}<button className="btn btn-outline" onClick={() => setPaymentAmount(cart.reduce((sum, i) => sum + (i.price * i.quantity), 0) - discount)}>Uang Pas</button></div>
                </div>
              )}
              {paymentMethod === 'QRIS' && <div style={{ textAlign: 'center', padding: '2rem', background: '#f3f4f6', borderRadius: '12px' }}><QrCode size={120} style={{ margin: '0 auto 1rem' }}/><p style={{fontWeight: 700}}>Silakan Scan QRIS</p></div>}
              {paymentMethod === 'Hutang' && (
                <div className="animate-fade-in">
                  <label style={{ display: 'block', fontWeight: 700, marginBottom: '0.5rem' }}>Nama Pelanggan (Wajib)</label>
                  <input type="text" className="card" style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }} value={debtCustomerName} onChange={(e) => setDebtCustomerName(e.target.value)} placeholder="Masukkan nama pelanggan..." autoFocus />
                  <div style={{ marginTop: '1rem', padding: '1rem', background: '#fff1f2', borderRadius: '8px', color: '#ef4444', fontSize: '0.85rem' }}>* Transaksi ini akan dicatat otomatis ke menu Kas Bon</div>
                </div>
              )}
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>Ringkasan</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: '#f9fafb', padding: '1.5rem', borderRadius: '12px' }}>
                <div className="flex-between"><span>Subtotal</span><span>{formatPrice(cart.reduce((sum, i) => sum + (i.price * i.quantity), 0))}</span></div>
                <div className="flex-between" style={{ color: '#10b981' }}><span>Diskon</span><input type="number" style={{ width: '80px', textAlign: 'right', border: '1px solid #ddd', borderRadius: '4px' }} value={discount} onChange={(e) => setDiscount(Number(e.target.value))} /></div>
                <div style={{ borderTop: '1px dashed #d1d5db', paddingTop: '1rem' }}>
                  <div className="flex-between" style={{ fontSize: '1.25rem', fontWeight: 800 }}><span>TOTAL</span><span className="text-primary">{formatPrice(cart.reduce((sum, i) => sum + (i.price * i.quantity), 0) - discount)}</span></div>
                </div>
                {paymentMethod === 'Tunai' && <div style={{ borderTop: '1px dashed #d1d5db', paddingTop: '1rem' }}><div className="flex-between" style={{ fontSize: '1.25rem', fontWeight: 800, color: '#3b82f6' }}><span>Kembali</span><span>{formatPrice(Math.max(0, Number(paymentAmount) - (cart.reduce((sum, i) => sum + (i.price * i.quantity), 0) - discount)))}</span></div></div>}
              </div>
              <button className="btn btn-primary" style={{ width: '100%', padding: '1.25rem', marginTop: '2rem', fontSize: '1.1rem' }} onClick={finalizeTransaction}>KONFIRMASI (F2)</button>
            </div>
          </div>
        </div>
      )}

      {showDebtModal && (
        <div className="modal-overlay">
          <form className="modal animate-fade-in" style={{ maxWidth: '400px' }} onSubmit={addDebt}>
            <div className="flex-between mb-6"><h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Catat Kas Bon Manual</h2><button type="button" onClick={() => setShowDebtModal(false)} style={{ background: 'none', border: 'none' }}><X /></button></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div><label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.4rem' }}>Nama Pelanggan</label><input name="customerName" required className="card" style={{ width: '100%', padding: '0.7rem' }} /></div>
              <div><label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.4rem' }}>Jumlah Hutang (Rp)</label><input name="amount" type="number" required className="card" style={{ width: '100%', padding: '0.7rem' }} /></div>
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '2rem' }}>Simpan</button>
          </form>
        </div>
      )}

      {showReceiptModal && lastReceipt && (
        <div className="modal-overlay">
          <div className="modal animate-fade-in" style={{ maxWidth: '400px', textAlign: 'center' }}>
            <CheckCircle2 size={48} color="#10b981" style={{ margin: '0 auto 1rem' }} />
            <h2 style={{ fontWeight: 800, marginBottom: '1rem' }}>Transaksi Berhasil!</h2>
            <div style={{ textAlign: 'left', background: 'white', padding: '1rem', border: '1px solid #ddd', borderRadius: '8px', fontSize: '0.8rem', fontFamily: 'monospace', marginBottom: '1.5rem' }}>
              <div style={{ textAlign: 'center', fontWeight: 800 }}>TOKO MADURA</div>
              <div style={{ borderBottom: '1px dashed #000', margin: '0.5rem 0' }}></div>
              <div className="flex-between"><span>{lastReceipt.id}</span><span>{lastReceipt.customerName}</span></div>
              <div style={{ borderBottom: '1px dashed #000', margin: '0.5rem 0' }}></div>
              {lastReceipt.items.map(i => <div key={i.id} className="flex-between"><span>{i.name} x{i.quantity}</span><span>{formatPrice(i.price * i.quantity)}</span></div>)}
              <div style={{ borderBottom: '1px dashed #000', margin: '0.5rem 0' }}></div>
              <div className="flex-between" style={{ fontWeight: 800 }}><span>TOTAL ({lastReceipt.paymentMethod})</span><span>{formatPrice(lastReceipt.total)}</span></div>
              {lastReceipt.paymentMethod === 'Hutang' && <div style={{ textAlign: 'center', marginTop: '0.5rem', color: '#ef4444' }}>*** STATUS: KAS BON ***</div>}
            </div>
            <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => setShowReceiptModal(false)}>Tutup</button>
          </div>
        </div>
      )}

      {showScannerModal && (
        <div className="modal-overlay"><div className="modal animate-fade-in" style={{ maxWidth: '400px' }}><div className="flex-between mb-4"><h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Scan Barcode</h2><button onClick={() => setShowScannerModal(false)} style={{ background: 'none', border: 'none' }}><X /></button></div><div id="reader"></div></div></div>
      )}

      {showProductModal && (
        <div className="modal-overlay">
          <form className="modal animate-fade-in" style={{ maxWidth: '600px' }} onSubmit={saveProduct}>
            <div className="flex-between mb-6"><h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>{editingProduct ? 'Edit Produk' : 'Tambah Produk'}</h2><button type="button" onClick={() => setShowProductModal(false)} style={{ background: 'none', border: 'none' }}><X /></button></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={{ gridColumn: 'span 2' }}><input name="name" placeholder="Nama Produk" required defaultValue={editingProduct?.name} className="card" style={{ width: '100%', padding: '0.7rem' }} /></div>
              <input name="barcode" placeholder="Barcode" defaultValue={editingProduct?.barcode} className="card" style={{ width: '100%', padding: '0.7rem' }} />
              <select name="category" defaultValue={editingProduct?.category || 'Pokok'} className="card" style={{ width: '100%', padding: '0.7rem', background: 'white' }}>{CATEGORIES.slice(1).map(cat => <option key={cat} value={cat}>{cat}</option>)}</select>
              <input name="costPrice" type="number" placeholder="Harga Modal" required defaultValue={editingProduct?.costPrice} className="card" style={{ width: '100%', padding: '0.7rem' }} />
              <input name="price" type="number" placeholder="Harga Jual" required defaultValue={editingProduct?.price} className="card" style={{ width: '100%', padding: '0.7rem' }} />
              <input name="stock" type="number" placeholder="Stok" required defaultValue={editingProduct?.stock} className="card" style={{ width: '100%', padding: '0.7rem' }} />
              <select name="unit" defaultValue={editingProduct?.unit || 'Pcs'} className="card" style={{ width: '100%', padding: '0.7rem', background: 'white' }}>{UNITS.map(u => <option key={u} value={u}>{u}</option>)}</select>
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '2rem' }}>Simpan</button>
          </form>
        </div>
      )}
    </div>
  );
}



