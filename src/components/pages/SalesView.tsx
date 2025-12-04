import React, { useState } from 'react';
import { AppState, Order, Product } from '../../types';
import { Truck, CheckCircle2, AlertCircle } from 'lucide-react';

interface Props {
  state: AppState;
  onProcessSale: (orderId: string, itemsToShip: { productId: string, qty: number }[], totalAmount: number) => void;
  t: (key: string) => string;
}

export const SalesView: React.FC<Props> = ({ state, onProcessSale, t }) => {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [shipQuantities, setShipQuantities] = useState<Record<string, number>>({});

  const handleSelectOrder = (o: Order) => {
    setSelectedOrder(o);
    const initial: Record<string, number> = {};
    o.items.forEach(item => {
        initial[item.productId] = item.orderedQty - item.shippedQty;
    });
    setShipQuantities(initial);
  };

  const handleQtyChange = (pid: string, val: number, max: number) => {
    if (val < 0) val = 0;
    if (val > max) val = max;
    setShipQuantities(prev => ({ ...prev, [pid]: val }));
  };

  const calculateShipmentTotal = () => {
    if (!selectedOrder) return 0;
    let total = 0;
    selectedOrder.items.forEach(item => {
        const qty = shipQuantities[item.productId] || 0;
        total += qty * item.price;
    });
    return total;
  };

  const handleConfirmShipment = () => {
      if (!selectedOrder) return;
      const itemsToShip = Object.keys(shipQuantities)
          .map(pid => ({ productId: pid, qty: shipQuantities[pid] }))
          .filter(i => i.qty > 0);
      if (itemsToShip.length === 0) return;
      onProcessSale(selectedOrder.id, itemsToShip, calculateShipmentTotal());
      setSelectedOrder(null);
  };

  const activeOrders = state.orders.filter(o => o.status !== 'Completed');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-140px)]">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50">
                <h3 className="font-bold text-slate-700 flex items-center"><Truck size={18} className="mr-2"/> {t('pendingOrders')}</h3>
            </div>
            <div className="overflow-y-auto p-4 space-y-3">
                {activeOrders.length === 0 && <p className="text-center text-slate-400 py-10">No pending orders.</p>}
                {activeOrders.map(o => {
                    const customer = state.customers.find(c => c.id === o.customerId);
                    return (
                        <div key={o.id} onClick={() => handleSelectOrder(o)} className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md ${selectedOrder?.id === o.id ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-white'}`}>
                            <div className="flex justify-between items-start mb-2">
                                <div><span className="text-xs font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded">#{o.id}</span><span className="ml-2 text-xs text-slate-500">{o.date}</span></div>
                                <span className="text-xs font-semibold px-2 py-1 bg-yellow-100 text-yellow-700 rounded">{o.status}</span>
                            </div>
                            <div className="font-bold text-slate-800">{customer?.name}</div>
                            <div className="mt-2 text-sm text-slate-600">{o.items.reduce((acc, i) => acc + (i.orderedQty - i.shippedQty), 0)} {t('remaining')}</div>
                        </div>
                    );
                })}
            </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
             {selectedOrder ? (
                 <>
                    <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                        <h3 className="font-bold text-slate-700">{t('createInvoice')}</h3>
                        <div className="text-right"><div className="text-xs text-slate-500 uppercase">{t('invoiceAmount')}</div><div className="text-xl font-bold text-green-600">${calculateShipmentTotal().toLocaleString()}</div></div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4">
                        <div className="space-y-4">
                             {selectedOrder.items.map(item => {
                                 const product = state.products.find(p => p.id === item.productId);
                                 const remaining = item.orderedQty - item.shippedQty;
                                 if (remaining <= 0) return null;
                                 const inStock = product?.stok || 0;
                                 const shipping = shipQuantities[item.productId] || 0;
                                 const isStockLow = inStock < shipping;
                                 return (
                                     <div key={item.productId} className="flex flex-col sm:flex-row items-center gap-4 p-4 border border-slate-100 rounded-lg bg-slate-50/50">
                                         <div className="flex-1">
                                             <div className="font-bold text-slate-700">{product?.modelAdi}</div>
                                             <div className="text-xs text-slate-500">{product?.renk} - {product?.beden}</div>
                                             <div className="text-xs mt-1 text-slate-400">Order: {item.orderedQty} | Shipped: {item.shippedQty}</div>
                                         </div>
                                         <div className="flex items-center gap-4">
                                             <div className="text-right">
                                                 <div className="text-xs text-slate-400">{t('stockCount')}: <span className={inStock < remaining ? 'text-red-500 font-bold' : 'text-slate-600'}>{inStock}</span></div>
                                                 <div className="text-xs text-slate-400">{t('remaining')}: {remaining}</div>
                                             </div>
                                             <div className="w-24"><input type="number" className={`w-full p-2 border rounded text-center font-bold outline-none ${isStockLow ? 'border-red-300 bg-red-50 text-red-700' : 'border-blue-300'}`} value={shipQuantities[item.productId]} onChange={(e) => handleQtyChange(item.productId, parseInt(e.target.value) || 0, remaining)} /></div>
                                         </div>
                                     </div>
                                 );
                             })}
                        </div>
                    </div>
                    <div className="p-4 border-t border-slate-100 bg-slate-50">
                        <button onClick={handleConfirmShipment} className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg shadow-md transition-all flex justify-center items-center"><CheckCircle2 size={20} className="mr-2"/> {t('shipSelected')}</button>
                    </div>
                 </>
             ) : (
                 <div className="flex-1 flex flex-col items-center justify-center text-slate-400"><Truck size={64} className="mb-4 opacity-20"/><p>{t('pendingOrders')}</p></div>
             )}
        </div>
    </div>
  );
};