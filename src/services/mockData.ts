import { Product, Customer, Order, Transaction, Currency, OrderStatus, Supplier, User } from '../types';

export const initialUsers: User[] = [
  {
    id: 'u1',
    username: 'admin',
    password: 'admin123', 
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
  {
    id: '2',
    ean: '8684410010334',
    artikul: '4050470000',
    marka: 'VIENETTA',
    markaKodu: '02',
    modelAdi: 'KADIN ELBISE',
    renk: 'HERBAL',
    renkKodu: '05',
    beden: 'M',
    kumas: 'POLY/VIS',
    kumasIcerik: '%63 POLY %33 VIS',
    fotoKodu: '4050470000_02_05',
    cinsiyet: 'Kadın',
    kategori: 'Elbise',
    stok: 80,
    maliyetFiyat: 6.5,
    fabrikaFiyat: 8,
    satisFiyat: 18,
    imageUrl: 'https://picsum.photos/100/100?random=2'
  }
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
  { 
    id: 'c2', 
    name: 'Elena Petrova', 
    company: 'Moda Moscow', 
    phone: '+7 911 222 33 44',
    email: 'info@modamoscow.ru',
    country: 'Russia',
    city: 'St. Petersburg',
    address: 'Nevsky Prospect 14',
    cargoCompany: 'Lider Kargo',
    cargoCustNo: '9902',
    balanceUsd: -50 
  }
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