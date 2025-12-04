import React, { useState } from 'react';
import { AppState } from '../../types';
import { ArchiveRestore, Plus } from 'lucide-react';

interface Props {
  state: AppState;
  onProcessReturn: (customerId: string, productId: string, qty: number, price: number) => void;
  t: (key: string) => string;
}

export const PurchaseView: React.FC<Props> = ({ state, onProcessReturn, t }) => {
  const [tab, setTab] = useState<'ENTRY' | 'RETURN'>('ENTRY');
  const [returnCust, setReturnCust] = useState('');
  const [returnProd, setReturnProd] = useState('');
  const [returnQty, setReturnQty] = useState(1);

  const handleReturn = (e: React.FormEvent) => {
      e.preventDefault();
      const product = state.products.find(p => p.id === returnProd);
      if(product && returnCust) {
          onProcessReturn(returnCust, returnProd, returnQty, product.satisFiyat);
          setReturnQty(1);
          setReturnProd('');
          alert("Return processed.");
      }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex space-x-4 border-b border-slate-200">
            <button onClick={() => setTab('ENTRY')} className={`pb-2 px-4 font-medium transition-colors ${tab === 'ENTRY' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500'}`}>{t('stockEntry')}</button>
            <button onClick={() => setTab('RETURN')} className={`pb-2 px-4 font-medium transition-colors ${tab === 'RETURN' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500'}`}>{t('customerReturn')}</button>
        </div>

        {tab === 'ENTRY' ? (
            <div className="bg-white p-10 rounded-xl border border-slate-200 text-center shadow-sm">
                 <div className="inline-block p-4 bg-blue-50 rounded-full mb-4 text-blue-500"><Plus size={32} /></div>
                 <h3 className="text-xl font-bold text-slate-800">{t('stockEntry')}</h3>
                 <p className="text-slate-500 mt-2 mb-6">Use Stock Module to import products.</p>
            </div>
        ) : (
            <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-8">
                <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center"><ArchiveRestore size={24} className="mr-2"/> {t('customerReturn')}</h3>
                <form onSubmit={handleReturn} className="space-y-6 max-w-lg">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">{t('customers')}</label>
                        <select required className="w-full p-3 border border-slate-300 rounded-lg outline-none" value={returnCust} onChange={e => setReturnCust(e.target.value)}>
                            <option value="">Select...</option>
                            {state.customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                     <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">{t('productCard')}</label>
                        <select required className="w-full p-3 border border-slate-300 rounded-lg outline-none" value={returnProd} onChange={e => setReturnProd(e.target.value)}>
                            <option value="">Select...</option>
                            {state.products.map(p => <option key={p.id} value={p.id}>{p.modelAdi} - {p.renk} ({p.beden})</option>)}
                        </select>
                    </div>
                     <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Qty</label>
                        <input type="number" min="1" required className="w-full p-3 border border-slate-300 rounded-lg outline-none" value={returnQty} onChange={e => setReturnQty(parseInt(e.target.value))} />
                    </div>
                    <div className="pt-4">
                        <button type="submit" className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg shadow-md transition-colors">{t('processReturn')}</button>
                    </div>
                </form>
            </div>
        )}
    </div>
  );
};