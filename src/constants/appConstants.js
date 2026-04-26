import { Smartphone, Globe, Zap, Wallet, ArrowDownCircle, ArrowUpCircle, Cpu } from 'lucide-react';

export const INITIAL_PRODUCTS = [
  { id: 1, name: 'Beras Madura 5kg', costPrice: 65000, price: 75000, stock: 20, unit: 'Bag', category: 'Pokok', barcode: '8991234567890' },
  { id: 2, name: 'Indomie Goreng', costPrice: 2400, price: 3000, stock: 100, unit: 'Pcs', category: 'Makanan', barcode: '8998866200505' },
  { id: 3, name: 'Kopi Kapal Api 165g', costPrice: 12500, price: 15000, stock: 50, unit: 'Sachet', category: 'Minuman', barcode: '8992696404118' },
  { id: 4, name: 'Minyak Goreng 1L', costPrice: 15000, price: 18000, stock: 30, unit: 'Pcs', category: 'Pokok', barcode: '8999999000001' },
];

export const INITIAL_CATEGORIES = ['Pokok', 'Makanan', 'Minuman', 'Rokok', 'Cemilan', 'Lainnya'];

export const QUICK_CASH = [5000, 10000, 20000, 50000, 100000];

export const PPOB_CATEGORIES = [
  { id: 'pulsa', label: 'Pulsa', icon: Smartphone, color: 'text-blue-500', bg: 'bg-blue-50' },
  { id: 'data', label: 'Paket Data', icon: Globe, color: 'text-green-500', bg: 'bg-green-50' },
  { id: 'pln', label: 'Token PLN', icon: Zap, color: 'text-amber-500', bg: 'bg-amber-50' },
  { id: 'wallet', label: 'E-Wallet', icon: Wallet, color: 'text-purple-500', bg: 'bg-purple-50' },
  { id: 'setor', label: 'Setor Tunai', icon: ArrowDownCircle, color: 'text-orange-500', bg: 'bg-orange-50' },
  { id: 'tarik', label: 'Tarik Tunai', icon: ArrowUpCircle, color: 'text-red-500', bg: 'bg-red-50' },
  { id: 'lainnya', label: 'Lainnya', icon: Cpu, color: 'text-neutral-500', bg: 'bg-neutral-50' }
];
