
import React, { useState } from 'react';
import { AppState, Order, OrderStatus, Product } from '../../types';
import { Plus, ShoppingCart, Trash2, Eye, Edit2, Save, X } from 'lucide-react';

interface Props {
  state: AppState;
  onAddOrder: (o: Order) => void;
  onUpdateOrder: (o: Order) => void;
  t: (key: string) => string;
}

export const OrdersView: React.FC<Props> = ({ state, onAddOrder, onUpdateOrder, t }) => {
  const [viewMode, setViewMode] = useState<'LIST' | 'CREATE'>('LIST');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editItems, setEditItems] = useState<{productId: string, qty: number}[]>([]);

  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [cart, setCart] = useState<{product: Product, qty: number}[]>([]);
  const [productSearch, setProductSearch] = useState('');

  const filteredProducts = state.products.filter(p => p.modelAdi.toLowerCase().includes(productSearch.toLowerCase()));

  const addToCart = (p: Product) => {
    const existing = cart.find(i => i.product.id === p.id);
    if (existing) {
      setCart(cart.map(i => i.product.id === p.id ? { ...i, qty: i.qty + 1 } : i));
    } else {
      setCart([...cart, { product: p, qty: 1 }]);
    }
  };

  const removeFromCart = (pid: string) => setCart(cart.filter(i => i.product.id !== pid));
  const updateQty = (pid: string, qty: number) => {
      if(qty < 1) return;
      setCart(cart.map(i => i.product.id === pid ? { ...i, qty } : i));
  };

  const handleCreateOrder = () => {
    if (!selectedCustomer || cart.length === 0) return;
    const newOrder: Order = {
      id: Math.floor(1000 + Math.random() * 9000).toString(),
      customerId: selectedCustomer,
      date: new Date().toISOString().split('T')[0],
      status: OrderStatus.PENDING,
      items: cart.map(i => ({ productId: i.product.id, orderedQty: i.qty, shippedQty: 0, price: i.product.satisFiyat }))
    };
    onAddOrder(newOrder);
    setCart([]);
    setSelectedCustomer('');
    setViewMode('LIST');
  };

  const openOrderDetail = (o: Order) => {
    setSelectedOrder(o);
    setIsEditMode(false);
    setEditItems(o.items.map(i => ({ productId: i.productId, qty: i.orderedQty })));
  };

  const handleSaveEdit = () => {
      if (!selectedOrder) return;
      const updatedOrder: Order = {
          ...selectedOrder,
          items: selectedOrder.items.map(item => {
              const editItem = editItems.find(e => e.productId === item.productId);
              return editItem ? { ...item, orderedQty: editItem.qty } : item;
          })
      };
      onUpdateOrder(updatedOrder);
      setSelectedOrder(updatedOrder);
      setIsEditMode(false);
  };

  const handleEditQtyChange = (pid: string, qty: number) => {
      setEditItems(prev => prev.map(item => item.productId === pid ? { ...item, qty } : item));
  };

  const calculateTotal = () => cart.reduce((acc, item) => acc + (item.qty * item.product.satisFiyat), 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
         <div className="flex space-x-2 bg-slate-200 p-1 rounded-lg">
             <button onClick={() => setViewMode('LIST')} className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === 'LIST' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600'}`}>{t('orderList')}</button>
             <button onClick={() => setViewMode('CREATE')} className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === 'CREATE' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600'}`}>{t('newOrder')}</button>
         </div>
      </div>

      {viewMode === 'LIST' ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full text-left text-sm">
                <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-xs">
                        <th className="p-4">{t('orderId')}</th>
                        <th className="p-4">{t('date')}</th>
                        <th className="p-4">{t('customers')}</th>
                        <th className="p-4 text-center">{t('items')}</th>
                        <th className="p-4 text-right">{t('totalValue')}</th>
                        <th className="p-4">{t('status')}</th>
                        <th className="p-4 text-center">{t('action')}</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {state.orders.map(o => {
                        const customer = state.customers.find(c => c.id === o.customerId);
                        const total = o.items.reduce((acc, i) => acc + (i.orderedQty * i.price), 0);
                        return (
                            <tr key={o.id} className="hover:bg-slate-50">
                                <td className="p-4 font-mono font-medium text-blue-600">#{o.id}</td>
                                <td className="p-4 text-slate-600">{o.date}</td>
                                <td className="p-4 font-medium text-slate-800">{customer?.name || 'Unknown'}</td>
                                <td className="p-4 text-center">{o.items.length}</td>
                                <td className="p-4 text-right font-medium text-slate-700">${total.toLocaleString()}</td>
                                <td className="p-4"><span className={`px-2 py-1 text-xs rounded-full font-bold ${o.status === OrderStatus.COMPLETED ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{o.status}</span></td>
                                <td className="p-4 text-center"><button onClick={() => openOrderDetail(o)} className="p-2 text-slate-400 hover:text-blue-600 rounded"><Eye size={18} /></button></td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <input className="w-full p-2 border border-slate-300 rounded-lg outline-none" placeholder={t('search')} value={productSearch} onChange={e => setProductSearch(e.target.value)} />
                </div>
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden max-h-[600px] overflow-y-auto">
                    <table className="w-full text-left text-sm">
                         <tbody className="divide-y divide-slate-100">
                             {filteredProducts.map(p => (
                                 <tr key={p.id} className="hover:bg-slate-50 group">
                                     <td className="p-3 font-medium">{p.modelAdi}</td>
                                     <td className="p-3 text-slate-500">{p.renk} / {p.beden}</td>
                                     <td className="p-3 text-right font-bold">{p.stok}</td>
                                     <td className="p-3 text-right text-green-600 font-medium">${p.satisFiyat}</td>
                                     <td className="p-3 text-right"><button disabled={p.stok === 0} onClick={() => addToCart(p)} className="p-1.5 bg-blue-100 text-blue-600 rounded disabled:opacity-50"><Plus size={16}/></button></td>
                                 </tr>
                             ))}
                         </tbody>
                    </table>
                </div>
            </div>

            <div className="lg:col-span-1">
                <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6 sticky top-24">
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center"><ShoppingCart size={20} className="mr-2"/> {t('newOrder')}</h3>
                    <div className="mb-4">
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">{t('customers')}</label>
                        <select className="w-full p-2 border border-slate-300 rounded outline-none" value={selectedCustomer} onChange={e => setSelectedCustomer(e.target.value)}>
                            <option value="">Select...</option>
                            {state.customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div className="space-y-3 mb-6 max-h-60 overflow-y-auto pr-1">
                        {cart.map(item => (
                            <div key={item.product.id} className="flex justify-between items-center text-sm border-b border-slate-100 pb-2">
                                <div className="flex-1">
                                    <div className="font-medium text-slate-800">{item.product.modelAdi}</div>
                                    <div className="text-xs text-slate-500">{item.product.renk} / {item.product.beden}</div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <input type="number" className="w-12 text-center border rounded p-1" value={item.qty} onChange={(e) => updateQty(item.product.id, parseInt(e.target.value))} />
                                    <button onClick={() => removeFromCart(item.product.id)} className="text-red-400"><Trash2 size={16}/></button>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="border-t border-slate-200 pt-4 mb-4"><div className="flex justify-between items-center text-lg font-bold text-slate-800"><span>{t('total')}</span><span>${calculateTotal().toLocaleString()}</span></div></div>
                    <button onClick={handleCreateOrder} disabled={cart.length === 0 || !selectedCustomer} className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium">{t('createOrder')}</button>
                </div>
            </div>
        </div>
      )}

      {selectedOrder && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl w-full max-w-3xl shadow-2xl max-h-[90vh] overflow-y-auto">
                  <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                      <div><h3 className="text-xl font-bold text-slate-800">{t('orderDetails')} #{selectedOrder.id}</h3></div>
                      <button onClick={() => setSelectedOrder(null)} className="text-slate-400"><X size={24}/></button>
                  </div>
                  <div className="p-6">
                      <div className="flex justify-between items-center mb-4">
                          <div className="text-sm font-semibold text-slate-500 uppercase">{t('items')}</div>
                          {selectedOrder.status !== OrderStatus.COMPLETED && (
                              <button onClick={() => isEditMode ? handleSaveEdit() : setIsEditMode(true)} className={`px-4 py-2 rounded flex items-center gap-2 text-sm font-bold ${isEditMode ? 'bg-green-600 text-white' : 'bg-slate-100 text-slate-700'}`}>
                                {isEditMode ? <><Save size={16}/> {t('save')}</> : <><Edit2 size={16}/> {t('edit')}</>}
                              </button>
                          )}
                      </div>
                      <table className="w-full text-sm text-left">
                          <thead className="bg-slate-100 text-slate-500 uppercase text-xs">
                              <tr><th className="p-3">{t('model')}</th><th className="p-3">{t('size')}</th><th className="p-3 text-right">{t('salePrice')}</th><th className="p-3 text-center">Qty</th><th className="p-3 text-right">{t('total')}</th></tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                              {selectedOrder.items.map(item => {
                                  const product = state.products.find(p => p.id === item.productId);
                                  const editItem = editItems.find(e => e.productId === item.productId);
                                  const displayQty = isEditMode ? (editItem?.qty || item.orderedQty) : item.orderedQty;
                                  return (
                                      <tr key={item.productId}>
                                          <td className="p-3 font-medium">{product?.modelAdi}</td>
                                          <td className="p-3 text-slate-500">{product?.renk} / {product?.beden}</td>
                                          <td className="p-3 text-right">${item.price}</td>
                                          <td className="p-3 text-center">{isEditMode ? <input type="number" className="w-16 p-1 border rounded text-center" value={displayQty} onChange={(e) => handleEditQtyChange(item.productId, parseInt(e.target.value))} /> : <span className="font-bold">{item.orderedQty}</span>}</td>
                                          <td className="p-3 text-right font-medium">${(displayQty * item.price).toLocaleString()}</td>
                                      </tr>
                                  );
                              })}
                          </tbody>
                      </table>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
