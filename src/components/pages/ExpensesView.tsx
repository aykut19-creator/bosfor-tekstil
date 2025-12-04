import React, { useState } from 'react';
import { AppState, Supplier, Transaction } from '../../types';
import { UserPlus, Search, Building2, History, Users, FileText, Briefcase, Plus, Edit, Trash2 } from 'lucide-react';

interface Props {
  state: AppState;
  onAddSupplier: (s: Supplier) => void;
  onAddTransaction: (t: Transaction) => void;
  onUpdateTransaction: (t: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
  t: (key: string) => string;
}

export const ExpensesView: React.FC<Props> = ({ state, onAddSupplier, onAddTransaction, onUpdateTransaction, onDeleteTransaction, t }) => {
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const initialForm = { 
    name: '', 
    category: '', 
    phone: '', 
    balanceUsd: 0 
  };
  const [formData, setFormData] = useState(initialForm);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    onAddSupplier({ ...formData, id: `s-${Date.now()}` });
    setIsModalOpen(false);
    setFormData(initialForm);
  };

  const getStatementData = () => {
      if (!selectedSupplier) return [];
      const transactions = state.transactions.filter(t => t.supplierId === selectedSupplier.id).sort((a, b) => a.date.localeCompare(b.date));
      let runningBalance = 0;
      return transactions.map(t => {
          const isExpense = t.type === 'EXPENSE';
          const isPayment = t.type === 'PAYMENT' || t.type === 'COLLECTION'; 
          const debit = isPayment ? t.amountUsd : 0; 
          const credit = isExpense ? t.amountUsd : 0; 
          runningBalance = runningBalance + credit - debit;
          return { ...t, debit, credit, balance: runningBalance };
      });
  };

  const statementData = getStatementData();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-140px)]">
      <div className="lg:col-span-3 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-full">
        <div className="p-4 border-b border-slate-100 space-y-3">
           <div className="flex justify-between items-center">
              <h3 className="font-bold text-slate-700">{t('expenseAccounts')}</h3>
              <button onClick={() => setIsModalOpen(true)} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"><Plus size={18}/></button>
           </div>
           <div className="relative">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={16}/>
              <input className="w-full pl-9 p-2 text-sm border border-slate-200 rounded-lg bg-slate-50 outline-none" placeholder={t('search')} />
           </div>
        </div>
        <div className="overflow-y-auto flex-1 p-2 space-y-2">
            {state.suppliers.map(s => (
                <div key={s.id} onClick={() => setSelectedSupplier(s)} className={`p-3 rounded-lg cursor-pointer transition-all border ${selectedSupplier?.id === s.id ? 'bg-blue-50 border-blue-200 shadow-sm' : 'bg-white border-transparent hover:bg-slate-50'}`}>
                    <div className="flex justify-between items-start">
                        <div className="overflow-hidden">
                            <div className="font-semibold text-slate-800 truncate">{s.name}</div>
                            <div className="text-xs text-slate-500 flex items-center mt-1 truncate"><Briefcase size={12} className="mr-1 flex-shrink-0"/> {s.category}</div>
                        </div>
                        <div className={`text-sm font-bold ml-2 whitespace-nowrap ${s.balanceUsd > 0 ? 'text-red-500' : 'text-green-600'}`}>${Math.abs(s.balanceUsd).toLocaleString()}</div>
                    </div>
                </div>
            ))}
        </div>
      </div>

      <div className="lg:col-span-9 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-full overflow-hidden">
        {selectedSupplier ? (
            <>
                <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex flex-col md:flex-row justify-between gap-6">
                        <div className="flex-1">
                            <h2 className="text-2xl font-bold text-slate-800 flex items-center"><Building2 size={24} className="mr-2 text-blue-600"/> {selectedSupplier.name}</h2>
                            <div className="mt-2 text-slate-500 flex items-center">
                                <span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded text-xs font-bold uppercase mr-2">{selectedSupplier.category}</span>
                                <span className="text-sm">{selectedSupplier.phone}</span>
                            </div>
                        </div>
                        <div className="flex items-center">
                            <div className="text-right p-4 bg-white rounded-xl shadow-sm border border-slate-200 min-w-[200px]">
                                <p className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">{t('balance')}</p>
                                <p className={`text-3xl font-bold ${selectedSupplier.balanceUsd > 0 ? 'text-red-600' : 'text-green-600'}`}>${selectedSupplier.balanceUsd.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="flex-1 overflow-hidden flex flex-col">
                    <div className="px-6 py-3 border-b border-slate-100 flex items-center justify-between bg-white">
                         <h4 className="font-bold text-slate-700 flex items-center text-sm uppercase tracking-wide"><History size={16} className="mr-2 text-blue-600"/> {t('statement')}</h4>
                    </div>

                    <div className="flex-1 overflow-auto bg-slate-50 p-6">
                        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr className="text-xs font-bold text-slate-500 uppercase tracking-wider text-left">
                                        <th className="py-3 pl-4">{t('date')}</th><th className="py-3">{t('transactionType')}</th><th className="py-3">{t('description')}</th><th className="py-3 text-right text-green-600 bg-green-50/30">{t('debit')}</th><th className="py-3 text-right text-red-600 bg-red-50/30">{t('credit')}</th><th className="py-3 text-right pr-4 font-bold text-slate-700">{t('balance')}</th><th className="py-3 text-center">{t('action')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {statementData.map((tx) => (
                                        <tr key={tx.id} className="hover:bg-blue-50/30 transition-colors group">
                                            <td className="py-3 pl-4 font-mono text-slate-600">{tx.date}</td>
                                            <td className="py-3"><span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${tx.type === 'EXPENSE' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{tx.type === 'EXPENSE' ? 'GİDER' : 'ÖDEME'}</span></td>
                                            <td className="py-3 text-slate-700 max-w-xs truncate">{tx.description}</td>
                                            <td className="py-3 text-right font-medium text-slate-700 bg-green-50/10 border-l border-slate-100">{tx.debit > 0 ? `$${tx.debit.toFixed(2)}` : '-'}</td>
                                            <td className="py-3 text-right font-medium text-slate-700 bg-red-50/10 border-l border-slate-100">{tx.credit > 0 ? `$${tx.credit.toFixed(2)}` : '-'}</td>
                                            <td className={`py-3 text-right pr-4 font-bold border-l border-slate-200 ${tx.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>${Math.abs(tx.balance).toFixed(2)}</td>
                                            <td className="py-3 text-center"><button onClick={() => { if(window.confirm(t('confirmDelete'))) onDeleteTransaction(tx.id); }} className="text-red-400 hover:text-red-600"><Trash2 size={14} /></button></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </>
        ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50/50">
                <Briefcase size={48} className="text-blue-200 mb-4"/>
                <p>{t('expenseAccounts')}</p>
            </div>
        )}
      </div>

       {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-md shadow-2xl">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                <h3 className="font-bold text-slate-800 text-lg">{t('newExpense')}</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-red-500">&times;</button>
            </div>
            <form onSubmit={handleAdd} className="p-6 space-y-4">
                <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t('companyName')}</label><input required className="w-full p-2 border border-slate-300 rounded" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} /></div>
                <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t('category')}</label>
                    <select className="w-full p-2 border border-slate-300 rounded" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                             <option value="">...</option><option value="Kira">Kira</option><option value="Maaş">Maaş</option><option value="Kargo">Kargo</option><option value="Ofis">Ofis</option><option value="Diğer">Diğer</option>
                    </select>
                </div>
                <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t('phone')}</label><input className="w-full p-2 border border-slate-300 rounded" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} /></div>
                <div className="pt-4 border-t border-slate-100 flex justify-end gap-3"><button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 bg-slate-100 rounded">{t('cancel')}</button><button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded font-bold">{t('save')}</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};