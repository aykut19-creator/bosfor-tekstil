
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
import { LogOut, Loader2, Database, Wifi, AlertTriangle } from 'lucide-react'; 

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('DASHBOARD');
  const [language, setLanguage] = useState<Language>('TR');
  const [isLoading, setIsLoading] = useState(true);
  const [dbStatus, setDbStatus] = useState<string>('Sunucuya Bağlanıyor...');
  const [connectionError, setConnectionError] = useState<string | null>(null);
  
  const t = (key: string) => dictionary[language][key] || key;

  // Başlangıç State'i
  const [state, setState] = useState<AppState>({
    users: [],
    currentUser: null, 
    products: [],
    customers: [],
    suppliers: [],
    orders: [],
    transactions: [],
  });

  // --- FIREBASE VERİ SENKRONİZASYONU ---
  // Bu bölüm programın kalbidir. Veritabanındaki değişiklikleri anlık olarak çeker.
  useEffect(() => {
    setDbStatus('Veri Senkronizasyonu Başlatılıyor...');
    
    const unsubscribe = onSnapshot(doc(db, "erp_data", "main_state"), (docSnapshot) => {
        if (docSnapshot.exists()) {
            console.log("Güncel veri sunucudan alındı.");
            const data = docSnapshot.data() as AppState;
            
            // Veriyi state'e yükle (Mevcut oturumu koruyarak)
            setState(prev => ({
                ...data,
                currentUser: prev.currentUser // Oturum bilgisini local state'den koru
            }));
            
            setDbStatus('Online (Canlı Bağlantı)');
            setConnectionError(null);
            setIsLoading(false);
        } else {
            console.log("Veritabanı boş, ilk kurulum başlatılıyor...");
            // Eğer veritabanı tamamen boşsa, başlangıç verilerini yükle
            const initialState = {
                users: initialUsers,
                currentUser: null,
                products: initialProducts,
                customers: initialCustomers,
                suppliers: initialSuppliers,
                orders: initialOrders,
                transactions: initialTransactions,
            };
            
            // İlk veriyi Firebase'e yaz
            setDoc(doc(db, "erp_data", "main_state"), initialState)
              .then(() => {
                  console.log("İlk veriler veritabanına yazıldı.");
                  setDbStatus('Kurulum Tamamlandı');
              })
              .catch(e => {
                  console.error("Yazma Hatası:", e);
                  setConnectionError("Veri yazılamadı. Lütfen Firebase Kurallarını kontrol edin.");
              });
            
            // UI'ı güncelle
            setState(initialState);
            setIsLoading(false);
        }
    }, (error) => {
        console.error("Firebase Bağlantı Hatası:", error);
        // Hata durumunda kullanıcıyı bilgilendir
        if (error.code === 'permission-denied') {
             setConnectionError("Erişim Reddedildi! Firebase Kurallarını 'allow read, write: if true;' yapmalısınız.");
        } else {
             setConnectionError(`Bağlantı Hatası: ${error.message}`);
        }
        setDbStatus('Bağlantı Koptu');
        setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // --- VERİ KAYDETME FONKSİYONU ---
  // State'i güncelleyen ve Firebase'e gönderen merkezi fonksiyon
  const updateState = (updater: (prev: AppState) => AppState) => {
      setState(prev => {
          const newState = updater(prev);
          
          // Oturum bilgisi hariç tüm veriyi veritabanına gönder
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { currentUser, ...dataToSave } = newState;
          
          setDbStatus('Kaydediliyor...');
          
          setDoc(doc(db, "erp_data", "main_state"), dataToSave, { merge: true })
            .then(() => setDbStatus('Online (Senkronize)'))
            .catch(e => {
                console.error("Kayıt hatası:", e);
                setDbStatus('Kayıt Hatası!');
                alert("Veri kaydedilemedi! İnternet bağlantınızı veya yetkilerinizi kontrol edin.");
            });

          return newState;
      });
  };

  // --- AUTH İŞLEMLERİ ---
  const handleLogin = (user: User) => {
      console.log("Giriş yapıldı:", user.username);
      setState(prev => ({ ...prev, currentUser: user }));
  };

  const handleRegister = (newUser: Omit<User, 'id' | 'status'>) => {
      // Eğer sistemde hiç kullanıcı yoksa ilk kullanıcıyı Admin yap
      const isFirstUser = state.users.length === 0;
      
      const user: User = {
          ...newUser,
          id: `u-${Date.now()}`,
          status: isFirstUser ? 'active' : 'pending',
          role: isFirstUser ? 'admin' : 'user'
      };
      
      // Veritabanına kaydet
      updateState(prev => ({ ...prev, users: [...prev.users, user] }));
      
      if (isFirstUser) {
          alert("Sistemin ilk kullanıcısı olduğunuz için YÖNETİCİ yetkisiyle kaydedildiniz.");
      } else {
          alert(t('registerSuccess'));
      }
  };

  const handleLogout = () => {
      setState(prev => ({ ...prev, currentUser: null }));
      setCurrentView('DASHBOARD');
  };

  // Admin İşlemleri
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

  const handleUpdateRole = (id: string, role: any) => {
      updateState(prev => ({
          ...prev,
          users: prev.users.map(u => u.id === id ? { ...u, role: role } : u)
      }));
  };

  // --- DATA İŞLEMLERİ (CRUD) ---
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
  const addTransaction = (t: Transaction) => updateState(prev => ({ ...prev, transactions: [t, ...prev.transactions] }));
  const updateTransaction = (updatedTx: Transaction) => updateState(prev => ({ ...prev, transactions: prev.transactions.map(t => t.id === updatedTx.id ? updatedTx : t) }));
  const deleteTransaction = (id: string) => updateState(prev => ({ ...prev, transactions: prev.transactions.filter(t => t.id !== id) }));

  // Bakiyeleri dinamik hesapla (Veritabanından gelen işlem geçmişine göre)
  useEffect(() => {
    if (isLoading) return; 
    
    // İşlemlerden bakiye hesapla
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

    // Bu işlem local state'i günceller ancak DB'ye yazmaz (DB'de transactions esastır)
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
        
        // Sadece değişiklik varsa güncelle (Render döngüsünü engellemek için)
        if (JSON.stringify(newCustomers) !== JSON.stringify(prev.customers) || JSON.stringify(newSuppliers) !== JSON.stringify(prev.suppliers)) {
            return { ...prev, customers: newCustomers, suppliers: newSuppliers };
        }
        return prev;
    });
  }, [state.transactions, isLoading]); 

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

  // --- YÜKLENİYOR ve HATA EKRANI ---
  if (isLoading || connectionError) {
      return (
          <div className="flex h-screen items-center justify-center bg-slate-900 flex-col text-white p-8 text-center">
              {connectionError ? (
                  <>
                      <div className="bg-red-500 p-4 rounded-full mb-6 animate-pulse">
                          <AlertTriangle size={48} />
                      </div>
                      <h1 className="text-3xl font-bold mb-4">Veritabanı Bağlantı Hatası</h1>
                      <div className="bg-slate-800 p-6 rounded-lg max-w-2xl border border-red-500/50">
                          <p className="text-red-300 font-mono text-lg mb-4">{connectionError}</p>
                          <div className="text-left text-sm text-slate-300 space-y-2">
                              <p className="font-bold text-white">Çözüm İçin Yapılması Gerekenler:</p>
                              <ol className="list-decimal list-inside space-y-1">
                                  <li>Firebase Console'a gidin (console.firebase.google.com).</li>
                                  <li>Projenizi seçin ve sol menüden <strong>Build {'>'} Firestore Database</strong>'e tıklayın.</li>
                                  <li>Üstteki sekmelerden <strong>Rules (Kurallar)</strong> sekmesine gelin.</li>
                                  <li>Mevcut kodları silin ve aşağıdakini yapıştırıp <strong>Publish (Yayınla)</strong> deyin:</li>
                              </ol>
                              <pre className="bg-black p-3 rounded mt-2 font-mono text-green-400">
{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}`}
                              </pre>
                              <p className="mt-4 text-xs text-slate-500">* Not: Bu kural test amaçlıdır ve herkesin okuma/yazma yapmasına izin verir.</p>
                          </div>
                      </div>
                      <button onClick={() => window.location.reload()} className="mt-8 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-bold transition-colors">
                          Tekrar Dene
                      </button>
                  </>
              ) : (
                <>
                    <Loader2 className="w-16 h-16 animate-spin text-blue-500 mb-6"/>
                    <h2 className="text-2xl font-bold">BOSFOR ERP PRO</h2>
                    <p className="text-slate-400 mt-2">Sunucuya bağlanılıyor ve veriler senkronize ediliyor...</p>
                </>
              )}
          </div>
      );
  }

  // --- GİRİŞ KONTROLÜ ---
  if (!state.currentUser) {
      return (
        <>
            <Auth onLogin={handleLogin} onRegister={handleRegister} users={state.users} t={t} />
            <div className="fixed top-4 right-4 flex gap-2 z-50">
                <button onClick={() => setLanguage('TR')} className={`px-3 py-1 rounded text-xs font-bold transition-colors ${language === 'TR' ? 'bg-blue-600 text-white shadow-md' : 'bg-white/80 text-slate-700 hover:bg-white'}`}>TR</button>
                <button onClick={() => setLanguage('RU')} className={`px-3 py-1 rounded text-xs font-bold transition-colors ${language === 'RU' ? 'bg-blue-600 text-white shadow-md' : 'bg-white/80 text-slate-700 hover:bg-white'}`}>RU</button>
            </div>
            {/* Bağlantı Durumu Göstergesi */}
            <div className="fixed bottom-4 left-4 text-xs p-2 rounded shadow flex items-center transition-colors bg-white/90 text-slate-600 font-medium">
                <Database size={14} className="mr-2 text-green-600"/>
                {dbStatus}
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
      case 'USERS': return <UserManagementView users={state.users} onApprove={handleApproveUser} onReject={handleRejectUser} onUpdateRole={handleUpdateRole} t={t} />;
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
                 <p className="text-slate-500 mt-1 flex items-center">
                    <Wifi size={14} className="mr-1 text-green-500"/>
                    Management Console ({dbStatus})
                 </p>
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
