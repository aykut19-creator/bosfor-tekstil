
import React, { useState } from 'react';
import { AppState, Currency, Transaction } from '../../types';
import { Wallet, Calendar, Edit, Save, Plus, ArrowRightLeft, Trash2 } from 'lucide-react';

interface Props {
  state: AppState;
  onAddTransaction: (t: Transaction) => void;
  onUpdateTransaction: (t: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
  t: (key: string) => string;
}

export const FinanceView: React.FC<Props> = ({ state, onAddTransaction, onUpdateTransaction, onDeleteTransaction, t }) => {
  const [activeTab, setActiveTab] = useState<'CUSTOMER' | 'EXPENSE'>('CUSTOMER');
  
  const [formData, setFormData] = useState({
    type: 'COLLECTION', 
    amount: 0,
    currency: Currency.USD,
    exchangeRate: 90.0,
    category: 'Tahsilat',
    description: '',
    customerId: '',
    supplierId: ''
  });

  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const calculatedUsd = formData.currency === Currency.RUB 
    ? formData.amount / formData.exchangeRate 
    : formData.amount;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newTx: Transaction = {
        id: editingTx ? editingTx.id : `t-${Date.now()}`,
        date: editingTx ? editingTx.date : new Date().toISOString().split('T')[0],
        type: formData.type as any,
        category: formData.category,
        description: formData.description,
        amount: formData.amount,
        currency: formData.currency,
        exchangeRate: formData.currency === Currency.RUB ? formData.exchangeRate : 1,
        amountUsd: calculatedUsd,
        customerId: activeTab === 'CUSTOMER' ? formData.customerId : undefined,
        supplierId: activeTab === 'EXPENSE' ? formData.supplierId : undefined
    };
    if (editingTx) {
        onUpdateTransaction(newTx);
        setIsModalOpen(false);
        setEditingTx(null);
    } else {
        onAddTransaction(newTx);
    }
    if (!editingTx) {
        setFormData({ ...formData, amount: 0, description: '' });
    }
  };

  const openEditModal = (t: Transaction) => {
      setEditingTx(t);
      if (t.customerId) setActiveTab('CUSTOMER');
      else if (t.supplierId) setActiveTab('EXPENSE');
      setFormData({
          type: t.type,
          amount: t.amount,
          currency: t.currency,
          exchangeRate: t.exchangeRate,
          category: t.category,
          description: t.description,
          customerId: t.customerId || '',
          supplierId: t.supplierId || ''
      });
      setIsModalOpen(true);
  };

  const transactions = state.transactions;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
       <div className="lg:col-span-1 bg-white rounded-xl shadow-lg border border-slate-200 p-6 h-fit sticky top-6">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center"><Wallet size={20} className="mr-2"/> {t('cashOps')}</h3>
          
          <div className="flex bg-slate-100 p-1 rounded-lg mb-6">
               <button onClick={() => { setActiveTab('CUSTOMER'); setFormData({...formData, type: 'COLLECTION', category: 'Tahsilat'}); }} className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${activeTab === 'CUSTOMER' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}>{t('customerOps')}</button>
               <button onClick={() => { setActiveTab('EXPENSE'); setFormData({...formData, type: 'PAYMENT', category: 'Ödeme'}); }} className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${activeTab === 'EXPENSE' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}>{t('expenseOps')}</button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
              {activeTab === 'CUSTOMER' ? (
                  <div className="grid grid-cols-2 gap-2">
                    <button type="button" onClick={() => setFormData({...formData, type: 'COLLECTION', category: 'Tahsilat'})} className={`py-2 text-sm font-bold rounded border ${formData.type === 'COLLECTION' ? 'bg-green-50 border-green-500 text-green-700' : 'bg-white border-slate-200 text-slate-600'}`}>{t('collection')}</button>
                    <button type="button" onClick={() => setFormData({...formData, type: 'EXPENSE', category: 'İade'})} className={`py-2 text-sm font-bold rounded border ${formData.type === 'EXPENSE' ? 'bg-red-50 border-red-500 text-red-700' : 'bg-white border-slate-200 text-slate-600'}`}>{t('payment')}</button>
                  </div>
              ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <button type="button" onClick={() => setFormData({...formData, type: 'PAYMENT', category: 'Ödeme'})} className={`py-2 text-sm font-bold rounded border ${formData.type === 'PAYMENT' ? 'bg-red-50 border-red-500 text-red-700' : 'bg-white border-slate-200 text-slate-600'}`}>{t('payment')}</button>
                    <button type="button" onClick={() => setFormData({...formData, type: 'EXPENSE', category: 'Borç'})} className={`py-2 text-sm font-bold rounded border ${formData.type === 'EXPENSE' ? 'bg-orange-50 border-orange-500 text-orange-700' : 'bg-white border-slate-200 text-slate-600'}`}>{t('expense')}</button>
                  </div>
              )}

              <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">{activeTab === 'CUSTOMER' ? t('customers') : t('expenseAccounts')}</label>
                  {activeTab === 'CUSTOMER' ? (
                      <select required className="w-full p-2 border border-slate-300 rounded outline-none focus:border-blue-500" value={formData.customerId} onChange={e => setFormData({...formData, customerId: e.target.value})}>
                          <option value="">...</option>
                          {state.customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                  ) : (
                      <select required className="w-full p-2 border border-slate-300 rounded outline-none focus:border-blue-500" value={formData.supplierId} onChange={e => setFormData({...formData, supplierId: e.target.value})}>
                          <option value="">...</option>
                          {state.suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                  )}
              </div>

               <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">{t('currency')}</label>
                    <div className="flex gap-4">
                        <label className="flex items-center space-x-2 cursor-pointer"><input type="radio" name="curr" checked={formData.currency === Currency.USD} onChange={() => setFormData({...formData, currency: Currency.USD})} /><span>USD ($)</span></label>
                        <label className="flex items-center space-x-2 cursor-pointer"><input type="radio" name="curr" checked={formData.currency === Currency.RUB} onChange={() => setFormData({...formData, currency: Currency.RUB})} /><span>RUB (₽)</span></label>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-xs font-semibold text-slate-500 uppercase mb-1">{t('amount')}</label><input type="number" required step="0.01" className="w-full p-2 border border-slate-300 rounded focus:border-blue-500 outline-none" value={formData.amount} onChange={e => setFormData({...formData, amount: parseFloat(e.target.value)})} /></div>
                    {formData.currency === Currency.RUB && (
                        <div><label className="block text-xs font-semibold text-slate-500 uppercase mb-1">{t('exchangeRate')}</label><input type="number" required step="0.01" className="w-full p-2 border border-slate-300 rounded focus:border-blue-500 outline-none" value={formData.exchangeRate} onChange={e => setFormData({...formData, exchangeRate: parseFloat(e.target.value)})} /></div>
                    )}
                </div>

                {formData.currency === Currency.RUB && (
                    <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-800 flex justify-between"><span>{t('usdEquiv')}:</span><span className="font-bold">${calculatedUsd.toFixed(2)}</span></div>
                )}

                <div><label className="block text-xs font-semibold text-slate-500 uppercase mb-1">{t('description')}</label><input type="text" required className="w-full p-2 border border-slate-300 rounded focus:border-blue-500 outline-none" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} /></div>
                <button type="submit" className="w-full py-3 bg-slate-800 text-white rounded-lg font-bold hover:bg-slate-900 transition-colors">{t('save')}</button>
          </form>
       </div>

       <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-[calc(100vh-140px)]">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="font-bold text-slate-700">{t('recentTx')}</h3>
                <div className="text-sm text-slate-500 flex items-center"><Calendar size={14} className="mr-1"/> {t('view')}</div>
            </div>
            <div className="flex-1 overflow-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-100 text-slate-500 uppercase text-xs sticky top-0">
                        <tr><th className="p-3">{t('date')}</th><th className="p-3">{t('description')}</th><th className="p-3 text-right">{t('income')}</th><th className="p-3 text-right">{t('expense')}</th><th className="p-3 text-right">USD</th><th className="p-3 text-center">{t('action')}</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {transactions.map(tx => {
                            const isIncome = tx.type === 'INCOME' || tx.type === 'COLLECTION';
                            const relatedName = tx.customerId ? state.customers.find(c => c.id === tx.customerId)?.company : state.suppliers.find(s => s.id === tx.supplierId)?.name;
                            return (
                                <tr key={tx.id} className="hover:bg-slate-50 group">
                                    <td className="p-3 text-slate-500 font-mono text-xs">{tx.date}</td>
                                    <td className="p-3"><div className="font-bold text-slate-700">{relatedName || 'Unknown'}</div><div className="text-xs text-slate-500">{tx.description}</div></td>
                                    <td className="p-3 text-right font-medium text-green-600">{isIncome ? `${tx.amount.toLocaleString()} ${tx.currency}` : '-'}</td>
                                    <td className="p-3 text-right font-medium text-red-500">{!isIncome ? `${tx.amount.toLocaleString()} ${tx.currency}` : '-'}</td>
                                    <td className="p-3 text-right text-slate-400 text-xs font-mono">${tx.amountUsd.toFixed(2)}</td>
                                    <td className="p-3 text-center flex justify-center gap-1">
                                        <button onClick={() => openEditModal(tx)} className="p-1.5 text-blue-500 hover:bg-blue-100 rounded opacity-0 group-hover:opacity-100"><Edit size={16}/></button>
                                        <button onClick={() => { if(window.confirm(t('confirmDelete'))) onDeleteTransaction(tx.id); }} className="p-1.5 text-red-500 hover:bg-red-100 rounded opacity-0 group-hover:opacity-100"><Trash2 size={16}/></button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
       </div>
    </div>
  );
};
