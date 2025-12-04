
import { Product, Customer, Order, Transaction, Currency, OrderStatus, Supplier } from '../types';

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
  },
  {
    id: '3',
    ean: '8690001234567',
    artikul: '5010203040',
    marka: 'LUXWEAR',
    markaKodu: '05',
    modelAdi: 'ERKEK PIJAMA',
    renk: 'NAVY',
    renkKodu: '09',
    beden: 'L',
    kumas: 'COTTON',
    kumasIcerik: '%100 COTTON',
    fotoKodu: '5010203040_05_09',
    cinsiyet: 'Erkek',
    kategori: 'Pijama',
    stok: 200,
    maliyetFiyat: 8.0,
    fabrikaFiyat: 10,
    satisFiyat: 22,
    imageUrl: 'https://picsum.photos/100/100?random=3'
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
  },
  { 
    id: 'c3', 
    name: 'Mehmet Demir', 
    company: 'Demir Tekstil', 
    phone: '+90 555 444 33 22',
    email: 'mehmet@demir.com',
    country: 'Turkey',
    city: 'Istanbul',
    address: 'Laleli Caddesi No: 42',
    balanceUsd: 5000 
  },
];

export const initialSuppliers: Supplier[] = [
  {
    id: 's1',
    name: 'Moskova Merkez Ofis',
    category: 'Kira & Ofis',
    phone: '-',
    balanceUsd: 0
  },
  {
    id: 's2',
    name: 'Aras Kargo Lojistik',
    category: 'Kargo',
    phone: '+90 212 444 00 00',
    balanceUsd: 150
  },
  {
    id: 's3',
    name: 'Ahmet (Personel)',
    category: 'Maaş',
    phone: '-',
    balanceUsd: 0
  }
];

export const initialOrders: Order[] = [
  {
    id: 'o1',
    customerId: 'c1',
    date: '2023-10-25',
    status: OrderStatus.PENDING,
    items: [
      { productId: '1', orderedQty: 50, shippedQty: 0, price: 12 },
      { productId: '2', orderedQty: 20, shippedQty: 0, price: 18 }
    ]
  }
];

export const initialTransactions: Transaction[] = [
  {
    id: 't1',
    date: '2023-10-01',
    type: 'INCOME',
    category: 'Sales',
    description: 'Initial Balance Load',
    amount: 1000,
    currency: Currency.USD,
    exchangeRate: 1,
    amountUsd: 1000,
    customerId: 'c1'
  }
];
