import { Product, Customer, Order, Transaction, Currency, OrderStatus, Supplier, User } from '../types';

export const initialUsers: User[] = [
  {
    id: 'u1',
    username: 'admin',
    password: 'admin123', // In a real app, passwords should be hashed
    fullName: 'System Administrator',
    email: 'admin@bosfortekstil.com',
    role: 'admin',
    status: 'active'
  },
  {
    id: 'u2',
    username: 'demo',
    password: 'user123',
    fullName: 'Demo User',
    email: 'demo@example.com',
    role: 'user',
    status: 'pending'
  }
];

export const initialProducts: Product[] = [
  {
    id: '1',
    ean: '8682246969499',
    artikul: '3114526884',
    marka: 'VIENETTA',
    markaKodu: '02',
    modelAdi: 'KADIN SABAH.+SORT',
    renk: 'BLACK',
    renkKodu: '11',
    beden: 'S',
    kumas: 'VISKON',
    kumasIcerik: '%100 VISKON',
    fotoKodu: '3114526884_02_11',
    cinsiyet: 'Kadın',
    kategori: 'Sabahlık',
    stok: 150,
    maliyetFiyat: 4.5,
    fabrikaFiyat: 5.5,
    satisFiyat: 12,
    imageUrl: 'https://picsum.photos/100/100?random=1'
  },
  // ... Diğer ürünleriniz buraya eklenebilir
];

export const initialCustomers: Customer[] = [
  { 
    id: 'c1', 
    name: 'Ahmet Yilmaz', 
    company: 'Yilmaz Giyim Ltd', 
    phone: '+7 999 000 11 22',
    email: 'ahmet@yilmazgiyim.com',
    country: 'Russia',
    city: 'Moscow',
    address: 'Sadovod Market, Line 5, Pavilion 22',
    cargoCompany: 'Antik Kargo',
    cargoCustNo: 'AK-452',
    balanceUsd: 1000 
  },
];

export const initialSuppliers: Supplier[] = [
  {
    id: 's1',
    name: 'Moskova Merkez Ofis',
    category: 'Kira & Ofis',
    phone: '-',
    balanceUsd: 0
  }
];

export const initialOrders: Order[] = [];
export const initialTransactions: Transaction[] = [];