import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { View, AppState, Product, Customer, Order, Transaction, OrderStatus, Currency, Supplier, Language } from './types';
import { initialProducts, initialCustomers, initialOrders, initialTransactions, initialSuppliers } from './services/mockData';
import { dictionary } from './services/translations';

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
import { AIChat } from './components/AIChat';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('DASHBOARD');
  const [language, setLanguage] = useState<Language>('TR');
  
  // Translation helper
  const t = (key: string) => dictionary[language][key] || key;

  // Central State Management
  const [state, setState] = useState<AppState>({
    products: initialProducts,
    customers: initialCustomers,
    suppliers: initialSuppliers,
    orders: initialOrders,
    transactions: initialTransactions,
  });

  // State Helpers
  const addProduct = (p: Product) => setState(prev => ({ ...prev, products: [...prev.products, p] }));
  const updateProduct = (p: Product) => setState(prev => ({ ...prev, products: prev.products.map(x => x.id === p.id ? p : x) }));
  
  const addCustomer = (c: Customer) => setState(prev => ({ ...prev, customers: [...prev.customers, c] }));
  const updateCustomer = (c: Customer) => setState(prev => ({ ...prev, customers: prev.customers.map(x => x.id === c.id ? c : x) }));
  
  const deleteCustomer = (id: string) => {
      // Validation: Check if customer has any linked data
      const hasOrders = state.orders.some(o => o.customerId === id);
      const hasTransactions = state.transactions.some(t => t.customerId === id);

      if (hasOrders || hasTransactions) {
          alert(t('cannotDeleteCustomer'));
          return;
      }

      setState(prev => ({
          ...prev,
          customers: prev.customers.filter(c => c.id !== id)
      }));
  };

  const addSupplier = (s: Supplier) => setState(prev => ({ ...prev, suppliers: [...prev.suppliers, s] }));
  
  const addOrder = (o: Order) => setState(prev => ({ ...prev, orders: [...prev.orders, o] }));
  const updateOrder = (o: Order) => setState(prev => ({ ...prev, orders: prev.orders.map(x => x.id === o.id ? o : x) }));
  
  // CORE LOGIC: Determines how a transaction affects a balance
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
  }, [state.transactions]);

  const addTransaction = (t: Transaction) => {
    setState(prev => ({
        ...prev,
        transactions: [t, ...prev.transactions]
    }));
  };

  const updateTransaction = (updatedTx: Transaction) => {
    setState(prev => ({
        ...prev,
        transactions: prev.transactions.map(t => t.id === updatedTx.id ? updatedTx : t)
    }));
  };

  const deleteTransaction = (id: string) => {
      setState(prev => ({
          ...prev,
          transactions: prev.transactions.filter(t => t.id !== id)
      }));
  };

  const processSale = (orderId: string, itemsToShip: { productId: string, qty: number }[], totalAmount: number) => {
    setState(prev => {
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

      const updatedOrder = {
        ...order,
        items: updatedItems,
        status: allCompleted ? OrderStatus.COMPLETED : OrderStatus.PARTIAL
      };

      const updatedOrders = [...prev.orders];
      updatedOrders[orderIndex] = updatedOrder;

      const updatedProducts = prev.products.map(p => {
        const shipItem = itemsToShip.find(x => x.productId === p.id);
        if (shipItem) {
          return { ...p, stok: p.stok - shipItem.qty };
        }
        return p;
      });

      const newTransaction: Transaction = {
        id: `t-${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        type: 'INCOME',
        category: 'Sale Invoice',
        description: `Invoice for Order #${order.id} (${allCompleted ? 'Final' : 'Partial'})`,
        amount: totalAmount,
        currency: Currency.USD,
        exchangeRate: 1,
        amountUsd: totalAmount,
        customerId: order.customerId
      };

      return {
        ...prev,
        orders: updatedOrders,
        products: updatedProducts,
        transactions: [newTransaction, ...prev.transactions],
      };
    });
  };

  const processReturn = (customerId: string, productId: string, qty: number, price: number) => {
      setState(prev => {
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

          return {
              ...prev,
              products: updatedProducts,
              transactions: [newTransaction, ...prev.transactions]
          };
      });
  };

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
      default: return <Dashboard state={state} {...props} />;
    }
  };

  return (
    <div className="flex bg-slate-50 min-h-screen font-sans">
      <Sidebar currentView={currentView} onChangeView={setCurrentView} t={t} />
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
                    <button 
                      onClick={() => setLanguage('TR')}
                      className={`px-3 py-1 text-xs font-bold rounded transition-colors ${language === 'TR' ? 'bg-red-50 text-red-600' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                      TR
                    </button>
                    <button 
                      onClick={() => setLanguage('RU')}
                      className={`px-3 py-1 text-xs font-bold rounded transition-colors ${language === 'RU' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                      RU
                    </button>
                </div>
                <div className="flex items-center space-x-3">
                    <div className="text-right">
                        <p className="text-sm font-semibold text-slate-700">Admin User</p>
                        <p className="text-xs text-slate-500">Istanbul HQ</p>
                    </div>
                    <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">AU</div>
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