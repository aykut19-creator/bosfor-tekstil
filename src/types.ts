
export type Language = 'TR' | 'RU';

export enum Currency {
  USD = 'USD',
  RUB = 'RUB',
}

export enum OrderStatus {
  PENDING = 'Pending',
  PARTIAL = 'Partial',
  COMPLETED = 'Completed',
}

export interface Product {
  id: string;
  ean: string; 
  artikul: string; 
  marka: string; 
  markaKodu: string; 
  modelAdi: string; 
  renk: string; 
  renkKodu: string; 
  beden: string; 
  kumas: string; 
  kumasIcerik: string; 
  fotoKodu: string; 
  cinsiyet?: string; 
  kategori?: string; 
  stok: number; 
  maliyetFiyat: number; 
  fabrikaFiyat: number; 
  satisFiyat: number;   
  imageUrl?: string; 
}

export interface Customer {
  id: string;
  name: string; 
  company: string; 
  phone: string;
  email?: string;
  birthday?: string;
  country?: string;
  city?: string;
  address?: string;
  cargoCompany?: string; 
  cargoCustNo?: string;  
  balanceUsd: number; 
}

export interface Supplier {
  id: string;
  name: string; 
  category: string; 
  phone?: string;
  balanceUsd: number; 
}

export interface OrderItem {
  productId: string;
  orderedQty: number;
  shippedQty: number;
  price: number;
}

export interface Order {
  id: string;
  customerId: string;
  date: string;
  status: OrderStatus;
  items: OrderItem[];
  note?: string;
}

export interface Transaction {
  id: string;
  date: string;
  type: 'INCOME' | 'EXPENSE' | 'PAYMENT' | 'COLLECTION'; 
  category: string;
  description: string;
  amount: number; 
  currency: Currency;
  exchangeRate: number; 
  amountUsd: number; 
  customerId?: string; 
  supplierId?: string; 
}

export interface AppState {
  products: Product[];
  customers: Customer[];
  suppliers: Supplier[];
  orders: Order[];
  transactions: Transaction[];
}

export type View = 'DASHBOARD' | 'STOCK' | 'CUSTOMERS' | 'ORDERS' | 'SALES' | 'FINANCE' | 'PURCHASE' | 'EXPENSES' | 'REPORTS';
