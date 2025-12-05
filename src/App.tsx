// src/App.tsx
import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { View, AppState, Product, Customer, Order, Transaction, OrderStatus, Currency, Supplier, Language, User } from './types';
import { initialProducts, initialCustomers, initialOrders, initialTransactions, initialSuppliers, initialUsers } from './services/mockData';
import { dictionary } from './services/translations';
import { db } from './firebase'; 
import { doc, setDoc, onSnapshot } from "firebase/firestore"; 

// Pages
import { Dashboard } from './components/pages/Dashboard';
import { StockView } from './components/pages/StockView';
import { CustomersView } from './components/pages/CustomersView';
import { OrdersView } from './components/pages/OrdersView';
import { SalesView } from './components/pages/SalesView';
import { FinanceView } from './components/pages/FinanceView';
import { PurchaseView } from './components/pages/PurchaseView';
import { ExpensesView } from './components/pages/ExpensesView';
import { ReportsView } from './components/pages/ReportsView';
import { UserManagementView } from './components/pages/UserManagementView';
import { AIChat } from './components/AIChat';
import { Auth } from './components/Auth';
import { LogOut, Loader2 } from 'lucide-react'; 

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('DASHBOARD');
  const [language, setLanguage] = useState<Language>('TR');
  const [isLoading, setIsLoading] = useState(true); 
  
  const t = (key: string) => dictionary[language][key] || key;

  // State başlangıcı: currentUser NULL olmalı
  const [state, setState] = useState<AppState>({
    users: [],
    currentUser: null, 
    products: [],
    customers: [],
    suppliers: [],
    orders: [],
    transactions: [],
  });

  // --- FIREBASE BAĞLANTISI ---
  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, "erp_data", "main_state"), (docSnapshot) => {
        if (docSnapshot.exists()) {
            const data = docSnapshot.data() as AppState;
            setState(prev => ({
                ...data,
                currentUser: prev.currentUser // Oturumu koru
            }));
        } else {
            console.log("Initializing Database...");
            const initialState = {
                users: initialUsers,
                currentUser: null,
                products: initialProducts,
                customers: initialCustomers,
                suppliers: initialSuppliers,
                orders: initialOrders,
                transactions: initialTransactions,
            };
            setDoc(doc(db, "erp_data", "main_state"), initialState);
            setState(initialState);
        }
        setIsLoading(false);
    }, (error) => {
        console.error("Firebase Error:", error);
        setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const saveToFirebase = async (newState: AppState) => {
      const { currentUser, ...dataToSave } = newState; 
      try {
          await setDoc(doc(db, "erp_data", "main_state"), dataToSave, { merge: true });
      } catch (e) {
          console.error("Error saving to Firebase", e);
      }
  };

  const updateState = (updater: (prev: AppState) => AppState) => {
      setState(prev => {
          const newState = updater(prev);
          saveToFirebase(newState);
          return newState;
      });
  };

  // --- AUTH İŞLEMLERİ ---
  const handleLogin = (user: User) => {
      setState(prev => ({ ...prev, currentUser: user }));
  };

  const handleRegister = (newUser: Omit<User, 'id' | 'status'>) => {
      const user: User = {
          ...newUser,
          id: `u-${Date.now()}`,
          status: 'pending' 
      };
      updateState(prev => ({ ...prev, users: [...prev.users, user] }));
      alert(t('registerSuccess'));
  };

  const handleLogout = () => {
      setState(prev => ({ ...prev, currentUser: null }));
      setCurrentView('DASHBOARD');
  };

  const handleApproveUser = (id: string) => {
      updateState(prev => ({
          ...prev,
          users: prev.users.map(u => u.id === id ? { ...u, status: 'active' } : u)
      }));
  };

  const handleRejectUser = (id: string) => {
      updateState(prev => ({
          ...prev,
          users: prev.users.filter(u => u.id !== id)
      }));
  };

  // --- DİĞER İŞLEMLER ---
  const addProduct = (p: Product) => updateState(prev => ({ ...prev, products: [...prev.products, p] }));
  const updateProduct = (p: Product) => updateState(prev => ({ ...prev, products: prev.products.map(x => x.id === p.id ? p : x) }));
  
  const addCustomer = (c: Customer) => updateState(prev => ({ ...prev, customers: [...prev.customers, c] }));
  const updateCustomer = (c: Customer) => updateState(prev => ({ ...prev, customers: prev.customers.map(x => x.id === c.id ? c : x) }));
  
  const deleteCustomer = (id: string) => {
      const hasOrders = state.orders.some(o => o.customerId === id);
      const hasTransactions = state.transactions.some(t => t.customerId === id);
      if (hasOrders || hasTransactions) {
          alert(t('cannotDeleteCustomer'));
          return;
      }
      updateState(prev => ({ ...prev, customers: prev.customers.filter(c => c.id !== id) }));
  };

  const addSupplier = (s: Supplier) => updateState(prev => ({ ...prev, suppliers: [...prev.suppliers, s] }));
  const addOrder = (o: Order) => updateState(prev => ({ ...prev, orders: [...prev.orders, o] }));
  const updateOrder = (o: Order) => updateState(prev => ({ ...prev, orders: prev.orders.map(x => x.id === o.id ? o : x) }));
  
  const calculateBalanceImpact = (t: Transaction): { custImpact: number, suppImpact: number } => {
    let custImpact = 0;
    let suppImpact = 0;
    if (t.customerId) {
        if (t.type === 'INCOME') custImpact = t.amountUsd; 
        if (t.type === 'COLLECTION' || t.type === 'EXPENSE') custImpact = -t.amountUsd; 
    } else if (t.supplierId) {
        if (t.type === 'EXPENSE') suppImpact = t.amountUsd;
        if (t.type === 'PAYMENT' || t.type === 'COLLECTION') suppImpact = -t.amountUsd; 
    }
    return { custImpact, suppImpact };
  };

  useEffect(() => {
    if (isLoading) return; 
    setState(prev => {
        const newCustomers = prev.customers.map(c => {
            const balance = prev.transactions
                .filter(t => t.customerId === c.id)
                .reduce((acc, t) => acc + calculateBalanceImpact(t).custImpact, 0);
            return { ...c, balanceUsd: balance };
        });
        const newSuppliers = prev.suppliers.map(s => {
            const balance = prev.transactions
                .filter(t => t.supplierId === s.id)
                .reduce((acc, t) => acc + calculateBalanceImpact(t).suppImpact, 0);
            return { ...s, balanceUsd: balance };
        });
        const custChanged = JSON.stringify(newCustomers) !== JSON.stringify(prev.customers);
        const suppChanged = JSON.stringify(newSuppliers) !== JSON.stringify(prev.suppliers);
        if (custChanged || suppChanged) {
            return { ...prev, customers: newCustomers, suppliers: newSuppliers };
        }
        return prev;
    });
  }, [state.transactions, isLoading]); 

  const addTransaction = (t: Transaction) => updateState(prev => ({ ...prev, transactions: [t, ...prev.transactions] }));
  const updateTransaction = (updatedTx: Transaction) => updateState(prev => ({ ...prev, transactions: prev.transactions.map(t => t.id === updatedTx.id ? updatedTx : t) }));
  const deleteTransaction = (id: string) => updateState(prev => ({ ...prev, transactions: prev.transactions.filter(t => t.id !== id) }));

  const processSale = (orderId: string, itemsToShip: { productId: string, qty: number }[], totalAmount: number) => {
    updateState(prev => {
      const orderIndex = prev.orders.findIndex(o => o.id === orderId);
      if (orderIndex === -1) return prev;
      const order = prev.orders[orderIndex];
      let allCompleted = true;
      const updatedItems = order.items.map(item => {
        const shipItem = itemsToShip.find(x => x.productId === item.productId);
        if (shipItem) {
          const newShipped = item.shippedQty + shipItem.qty;
          if (newShipped < item.orderedQty) allCompleted = false;
          return { ...item, shippedQty: newShipped };
        }
        if (item.shippedQty < item.orderedQty) allCompleted = false;
        return item;
      });
      const updatedOrder = { ...order, items: updatedItems, status: allCompleted ? OrderStatus.COMPLETED : OrderStatus.PARTIAL };
      const updatedOrders = [...prev.orders];
      updatedOrders[orderIndex] = updatedOrder;
      const updatedProducts = prev.products.map(p => {
        const shipItem = itemsToShip.find(x => x.productId === p.id);
        if (shipItem) return { ...p, stok: p.stok - shipItem.qty };
        return p;
      });
      const newTransaction: Transaction = {
        id: `t-${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        type: 'INCOME',
        category: 'Sale Invoice',
        description: `Invoice for Order #${order.id}`,
        amount: totalAmount,
        currency: Currency.USD,
        exchangeRate: 1,
        amountUsd: totalAmount,
        customerId: order.customerId
      };
      return { ...prev, orders: updatedOrders, products: updatedProducts, transactions: [newTransaction, ...prev.transactions] };
    });
  };

  const processReturn = (customerId: string, productId: string, qty: number, price: number) => {
      updateState(prev => {
          const updatedProducts = prev.products.map(p => p.id === productId ? { ...p, stok: p.stok + qty } : p);
           const newTransaction: Transaction = {
            id: `ret-${Date.now()}`,
            date: new Date().toISOString().split('T')[0],
            type: 'EXPENSE',
            category: 'Return',
            description: `Return Product ID: ${productId} x ${qty}`,
            amount: qty * price,
            currency: Currency.USD,
            exchangeRate: 1,
            amountUsd: qty * price,
            customerId: customerId
          };
          return { ...prev, products: updatedProducts, transactions: [newTransaction, ...prev.transactions] };
      });
  };

  if (isLoading) {
      return (
          <div className="flex h-screen items-center justify-center bg-slate-100">
              <div className="text-center">
                  <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto mb-4"/>
                  <p className="text-slate-600 font-medium">Veritabanına Bağlanıyor...</p>
              </div>
          </div>
      );
  }

  // BURASI KRİTİK NOKTA: KULLANICI YOKSA GİRİŞ EKRANINI GÖSTER
  if (!state.currentUser) {
      return (
        <>
            <Auth onLogin={handleLogin} onRegister={handleRegister} users={state.users} t={t} />
            <div className="fixed top-4 right-4 flex gap-2 z-50">
                <button onClick={() => setLanguage('TR')} className={`px-3 py-1 rounded text-xs font-bold transition-colors ${language === 'TR' ? 'bg-blue-600 text-white shadow-md' : 'bg-white/80 text-slate-700 hover:bg-white'}`}>TR</button>
                <button onClick={() => setLanguage('RU')} className={`px-3 py-1 rounded text-xs font-bold transition-colors ${language === 'RU' ? 'bg-blue-600 text-white shadow-md' : 'bg-white/80 text-slate-700 hover:bg-white'}`}>RU</button>
            </div>
        </>
      );
  }

  const renderContent = () => {
    const props = { t, lang: language };
    switch (currentView) {
      case 'DASHBOARD': return <Dashboard state={state} {...props} />;
      case 'STOCK': return <StockView products={state.products} onAdd={addProduct} onUpdate={updateProduct} {...props} />;
      case 'CUSTOMERS': return <CustomersView customers={state.customers} orders={state.orders} transactions={state.transactions} onAdd={addCustomer} onUpdate={updateCustomer} onDelete={deleteCustomer} onUpdateTransaction={updateTransaction} onDeleteTransaction={deleteTransaction} {...props} />;
      case 'ORDERS': return <OrdersView state={state} onAddOrder={addOrder} onUpdateOrder={updateOrder} {...props} />;
      case 'SALES': return <SalesView state={state} onProcessSale={processSale} {...props} />;
      case 'FINANCE': return <FinanceView state={state} onAddTransaction={addTransaction} onUpdateTransaction={updateTransaction} onDeleteTransaction={deleteTransaction} {...props} />;
      case 'PURCHASE': return <PurchaseView state={state} onProcessReturn={processReturn} {...props} />;
      case 'EXPENSES': return <ExpensesView state={state} onAddSupplier={addSupplier} onAddTransaction={addTransaction} onUpdateTransaction={updateTransaction} onDeleteTransaction={deleteTransaction} {...props} />;
      case 'REPORTS': return <ReportsView state={state} {...props} />;
      case 'USERS': return <UserManagementView users={state.users} onApprove={handleApproveUser} onReject={handleRejectUser} t={t} />;
      default: return <Dashboard state={state} {...props} />;
    }
  };

  return (
    <div className="flex bg-slate-50 min-h-screen font-sans">
      <Sidebar currentView={currentView} onChangeView={setCurrentView} onLogout={handleLogout} currentUser={state.currentUser} t={t} />
      <main className="flex-1 ml-64 p-8">
        <header className="mb-8 flex justify-between items-center">
            <div>
                 <h2 className="text-3xl font-bold text-slate-800 tracking-tight">
                    {t(currentView.toLowerCase()) || currentView}
                 </h2>
                 <p className="text-slate-500 mt-1">Management Console</p>
            </div>
            <div className="flex items-center space-x-6">
                <div className="flex bg-white rounded-lg shadow-sm border border-slate-200 p-1">
                    <button onClick={() => setLanguage('TR')} className={`px-3 py-1 text-xs font-bold rounded transition-colors ${language === 'TR' ? 'bg-red-50 text-red-600' : 'text-slate-500 hover:bg-slate-50'}`}>TR</button>
                    <button onClick={() => setLanguage('RU')} className={`px-3 py-1 text-xs font-bold rounded transition-colors ${language === 'RU' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}>RU</button>
                </div>
                <div className="flex items-center space-x-3">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-semibold text-slate-700">{state.currentUser?.fullName}</p>
                        <p className="text-xs text-slate-500 capitalize">{state.currentUser?.role}</p>
                    </div>
                    <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                        {state.currentUser?.username.charAt(0).toUpperCase()}
                    </div>
                    <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors" title={t('logout')}>
                        <LogOut size={20}/>
                    </button>
                </div>
            </div>
        </header>
        {renderContent()}
      </main>
      <AIChat state={state} language={language} t={t} />
    </div>
  );
};

export default App;