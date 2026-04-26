import React from 'react';
import { Search, ScanLine, ShoppingCart, Minus, Plus, Eraser } from 'lucide-react';
import { formatPrice } from '../../utils/helpers';

export const POS = ({ 
  products, 
  categories, 
  cart, 
  setCart, 
  addToCart, 
  updateCartQuantity, 
  searchTerm, 
  setSearchTerm, 
  selectedCategory, 
  setSelectedCategory,
  cartSubtotal,
  cartTotal,
  discount,
  setDiscount,
  setShowPaymentModal,
  setShowScannerModal,
  setShowMobileCart,
  setScannerMode,
  setSearchTarget,
  settings
}) => {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6 md:gap-8 animate-fade-in items-start h-full">
      <section className="flex flex-col h-full">
        <div className="mb-4 md:mb-6 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl md:text-2xl font-bold">Kasir</h1>
            <div className="flex items-center gap-2 lg:hidden">
              <button onClick={() => { setScannerMode('search'); setSearchTarget('pos'); setShowScannerModal(true); }} className="p-2 rounded-lg bg-neutral-100 text-neutral-600">
                <ScanLine size={20} />
              </button>
            </div>
          </div>
          <div className="relative w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
            <input 
              type="text" 
              placeholder="Cari nama atau scan (F1)..." 
              className="input-minimal pl-11 h-12 md:h-14 text-sm md:text-base" 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)} 
              autoFocus 
            />
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
              <div className="flex items-end justify-between gap-1 mt-auto">
                <div className="text-xs md:text-base font-bold text-primary">{formatPrice(p.price)}</div>
                <div className={`text-[9px] md:text-[10px] font-bold px-2 py-0.5 rounded-full ${p.stock < settings.lowStockThreshold ? 'bg-red-50 text-red-600' : 'bg-neutral-50 text-neutral-400'}`}>
                  Stok {p.stock}
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>

      <aside className="sticky top-10 flex flex-col gap-4 hidden xl:flex">
        <div className="card-minimal !p-0 flex h-[calc(100vh-120px)] flex-col overflow-hidden border-2 border-neutral-100 shadow-xl">
          <div className="border-b border-neutral-100 p-5 flex items-center justify-between bg-neutral-50">
            <h2 className="text-sm font-bold flex items-center gap-2"><ShoppingCart size={16} /> Keranjang</h2>
            <button onClick={() => setCart([])} className="text-neutral-400 hover:text-red-500 transition-colors"><Eraser size={16} /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-white">
            {cart.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-neutral-300 opacity-50">
                <ShoppingCart size={40} strokeWidth={1} className="mb-4" />
                <p className="text-[10px] font-bold uppercase tracking-widest">Kosong</p>
              </div>
            ) : cart.map(item => (
              <div key={item.id} className="flex flex-col gap-2 p-3 rounded-xl border border-neutral-100 hover:border-neutral-200 transition-all bg-neutral-50/30">
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-bold truncate text-neutral-800 uppercase">{item.name}</div>
                    <div className="text-[10px] text-neutral-400 font-medium">{formatPrice(item.price)} / {item.unit}</div>
                  </div>
                </div>
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
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                <span>Subtotal</span><span>{formatPrice(cartSubtotal)}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Diskon</span>
                <input type="number" className="w-24 bg-white border border-neutral-200 text-right text-xs font-bold px-2 py-1 rounded" value={discount} onChange={(e) => setDiscount(Math.max(0, parseInt(e.target.value) || 0))} />
              </div>
              <div className="flex justify-between text-base font-bold border-t border-neutral-200 pt-3 text-neutral-900 uppercase">
                <span>Total</span><span className="text-primary">{formatPrice(cartTotal)}</span>
              </div>
            </div>
            <button onClick={() => setShowPaymentModal(true)} disabled={cart.length === 0} className="btn-primary w-full h-14 text-xs font-bold uppercase shadow-lg shadow-primary/20 tracking-widest transition-transform active:scale-95">Bayar (F2)</button>
          </div>
        </div>
      </aside>

      <button onClick={() => setShowMobileCart(true)} className={`fixed bottom-20 right-4 z-40 flex h-14 md:h-16 items-center gap-3 rounded-full bg-neutral-900 px-5 md:px-6 text-white shadow-2xl lg:hidden transform transition-all active:scale-90 ${cart.length > 0 ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0 pointer-events-none'}`}>
        <div className="relative"><ShoppingCart size={22} /><span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold ring-2 ring-neutral-900">{cart.length}</span></div>
        <div className="flex flex-col items-start leading-none"><span className="text-[8px] font-bold text-neutral-400 uppercase tracking-widest">Total Bayar</span><span className="text-sm md:text-base font-bold">{formatPrice(cartTotal)}</span></div>
      </button>
    </div>
  );
};
