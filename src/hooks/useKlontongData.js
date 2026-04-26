import { useState, useEffect } from 'react';
import { INITIAL_PRODUCTS, INITIAL_CATEGORIES } from '../constants/appConstants';

export const useKlontongData = () => {
  const [products, setProducts] = useState(() => {
    try {
      const saved = localStorage.getItem('klontong_products');
      return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
    } catch (e) { console.error(e); return INITIAL_PRODUCTS; }
  });
  
  const [categories, setCategories] = useState(() => {
    try {
      const saved = localStorage.getItem('klontong_categories');
      return saved ? JSON.parse(saved) : INITIAL_CATEGORIES;
    } catch (e) { console.error(e); return INITIAL_CATEGORIES; }
  });
  
  const [transactions, setTransactions] = useState(() => {
    try {
      const saved = localStorage.getItem('klontong_transactions');
      return saved ? JSON.parse(saved) : [];
    } catch (e) { console.error(e); return []; }
  });
  
  const [debts, setDebts] = useState(() => {
    try {
      const saved = localStorage.getItem('klontong_debts');
      return saved ? JSON.parse(saved) : [];
    } catch (e) { console.error(e); return []; }
  });
  
  const [stockLogs, setStockLogs] = useState(() => {
    try {
      const saved = localStorage.getItem('klontong_stock_logs');
      return saved ? JSON.parse(saved) : [];
    } catch (e) { console.error(e); return []; }
  });
  
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('klontong_settings');
      return saved ? JSON.parse(saved) : {
        shopName: 'Toko Klontong',
        shopAddress: 'Jawa Timur, Indonesia',
        shopPhone: '0812-3456-7890',
        receiptFooter: 'Terima kasih atas kunjungan Anda',
        showProfitSidebar: true,
        lowStockThreshold: 10
      };
    } catch (e) { 
      console.error(e); 
      return {
        shopName: 'Toko Klontong',
        shopAddress: 'Jawa Timur, Indonesia',
        shopPhone: '0812-3456-7890',
        receiptFooter: 'Terima kasih atas kunjungan Anda',
        showProfitSidebar: true,
        lowStockThreshold: 10
      };
    }
  });

  // Persistence
  useEffect(() => { localStorage.setItem('klontong_products', JSON.stringify(products)); }, [products]);
  useEffect(() => { localStorage.setItem('klontong_transactions', JSON.stringify(transactions)); }, [transactions]);
  useEffect(() => { localStorage.setItem('klontong_debts', JSON.stringify(debts)); }, [debts]);
  useEffect(() => { localStorage.setItem('klontong_categories', JSON.stringify(categories)); }, [categories]);
  useEffect(() => { localStorage.setItem('klontong_stock_logs', JSON.stringify(stockLogs)); }, [stockLogs]);
  useEffect(() => { localStorage.setItem('klontong_settings', JSON.stringify(settings)); }, [settings]);

  const addStockLog = (productId, productName, type, amount, reason) => {
    const newLog = { 
      id: Date.now(), 
      productId, 
      productName, 
      type, 
      amount, 
      reason, 
      date: new Date().toISOString(),
      displayDate: new Date().toLocaleString('id-ID')
    };
    setStockLogs(prev => [newLog, ...prev].slice(0, 100));
  };

  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const resetAllData = () => {
    localStorage.clear();
    setProducts(INITIAL_PRODUCTS);
    setTransactions([]);
    setDebts([]);
    setCategories(INITIAL_CATEGORIES);
    setStockLogs([]);
    setSettings({ 
      shopName: 'Toko Klontong', 
      shopAddress: 'Jawa Timur, Indonesia', 
      shopPhone: '0812-3456-7890', 
      receiptFooter: 'Terima kasih atas kunjungan Anda', 
      showProfitSidebar: true, 
      lowStockThreshold: 10 
    });
  };

  return {
    products, setProducts,
    categories, setCategories,
    transactions, setTransactions,
    debts, setDebts,
    stockLogs, setStockLogs,
    settings, setSettings,
    addStockLog,
    updateSetting,
    resetAllData
  };
};
