
import React, { useState, useRef } from 'react';
import { Customer, Order, Transaction, Currency } from '../../types';
import { UserPlus, Search, Phone, Building2, History, Users, FileText, Download, Printer, MapPin, Mail, Globe, FileSpreadsheet, Edit, Trash2, Truck, FileUp, Cake, X, DollarSign, ShoppingBag, Calendar, PlusCircle, CreditCard, ArrowRight } from 'lucide-react';
import * as XLSX from 'xlsx';

interface Props {
  customers: Customer[];
  orders: Order[];
  transactions: Transaction[];
  onAdd: (c: Customer) => void;
  onUpdate: (c: Customer) => void;
  onDelete: (id: string) => void;
  onUpdateTransaction: (t: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
  t: (key: string) => string;
}

export const CustomersView: React.FC<Props> = ({ customers, orders, transactions, onAdd, onUpdate, onDelete, onUpdateTransaction, onDeleteTransaction, t }) => {
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'STATEMENT' | 'ORDERS'>('OVERVIEW');

  const [isEditTxOpen, setIsEditTxOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const initialForm = { 
    name: '', 
    company: '', 
    phone: '', 
    email: '',
    birthday: '', 
    country: '', 
    city: '', 
    address: '', 
    cargoCompany: '',
    cargoCustNo: '',
    balanceUsd: 0 
  };
  const [formData, setFormData] = useState(initialForm);

  const [txForm, setTxForm] = useState({
      description: '',
      amount: 0,
      exchangeRate: 1,
      currency: Currency.USD
  });

  // Calculate Top Stats
  const totalReceivable = customers.reduce((acc, c) => acc + (c.balanceUsd > 0 ? c.balanceUsd : 0), 0);
  const totalActiveCustomers = customers.length;

  const filteredCustomers = customers.filter(c => 
    c.company.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.cargoCustNo && c.cargoCustNo.includes(searchTerm))
  );

  const handleAddOrUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
        onUpdate({ ...formData, id: editingId });
    } else {
        onAdd({ ...formData, id: `c-${Date.now()}` });
    }
    setIsModalOpen(false);
    setFormData(initialForm);
    setEditingId(null);
  };

  const openAddModal = () => {
      setEditingId(null);
      setFormData(initialForm);
      setIsModalOpen(true);
  };

  const openEditModal = (e: React.MouseEvent, customer: Customer) => {
      e.stopPropagation();
      setEditingId(customer.id);
      setFormData({
          name: customer.name,
          company: customer.company,
          phone: customer.phone,
          email: customer.email || '',
          birthday: customer.birthday || '',
          country: customer.country || '',
          city: customer.city || '',
          address: customer.address || '',
          cargoCompany: customer.cargoCompany || '',
          cargoCustNo: customer.cargoCustNo || '',
          balanceUsd: customer.balanceUsd
      });
      setIsModalOpen(true);
  };

  const handleRowClick = (customer: Customer) => {
      setSelectedCustomer(customer);
      setActiveTab('OVERVIEW');
  };

  const handleDeleteCustomer = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      // Check if there are active records before deleting
      const hasOrders = orders.some(o => o.customerId === id);
      const hasTransactions = transactions.some(t => t.customerId === id);

      if (hasOrders || hasTransactions) {
          alert(t('cannotDeleteCustomer'));
          return;
      }

      if (window.confirm(t('confirmDelete'))) {
          onDelete(id);
          if (selectedCustomer?.id === id) setSelectedCustomer(null);
      }
  };

  // --- EXCEL ---
  const handleExportCustomerList = () => {
    const data = customers.map(c => ({
        [t('companyName')]: c.company,
        [t('authorized')]: c.name,
        [t('phone')]: c.phone,
        [t('email')]: c.email,
        [t('birthday')]: c.birthday,
        [t('country')]: c.country,
        [t('city')]: c.city,
        [t('address')]: c.address,
        [t('cargoFirm')]: c.cargoCompany,
        [t('cargoNo')]: c.cargoCustNo,
        [t('balance')]: c.balanceUsd
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "List");
    XLSX.writeFile(wb, `Customers_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  const handleImportClick = () => {
      if(fileInputRef.current) fileInputRef.current.click();
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if(!file) return;

      const reader = new FileReader();
      reader.onload = (evt) => {
          const bstr = evt.target?.result;
          const wb = XLSX.read(bstr, {type:'binary'});
          const wsname = wb.SheetNames[0];
          const ws = wb.Sheets[wsname];
          const data = XLSX.utils.sheet_to_json(ws);

          let count = 0;
          data.forEach((row: any) => {
              const findKey = (possibleKeys: string[]) => {
                  const rowKeys = Object.keys(row);
                  for (const pk of possibleKeys) {
                      const found = rowKeys.find(rk => rk.toLowerCase().replace(/\s/g, '') === pk.toLowerCase().replace(/\s/g, ''));
                      if (found) return row[found];
                  }
                  return undefined;
              };

              const company = findKey(["FirmaAdı", "Firma", "CompanyName", "Company"]);
              
              if(!company) return;

              const newCust: Customer = {
                  id: `imp-c-${Date.now()}-${Math.random().toString(36).substr(2,5)}`,
                  company: String(company),
                  name: String(findKey(["Yetkili", "Name", "Authorized", "Contact"]) || "-"),
                  phone: String(findKey(["Telefon", "Phone", "Tel", "Mobile"]) || "-"),
                  email: String(findKey(["Email", "E-mail", "Mail"]) || ""),
                  birthday: String(findKey(["DoğumGünü", "Birthday", "BirthDate"]) || ""),
                  country: String(findKey(["Ülke", "Country"]) || ""),
                  city: String(findKey(["Şehir", "City"]) || ""),
                  address: String(findKey(["Adres", "Address"]) || ""),
                  cargoCompany: String(findKey(["KargoFirması", "CargoFirm", "Kargo", "Cargo"]) || ""),
                  cargoCustNo: String(findKey(["KargoMüşteriNo", "CargoNo", "KargoNo", "MüşteriNo"]) || ""),
                  balanceUsd: parseFloat(String(findKey(["Bakiye", "Balance"]) || "0"))
              };
              onAdd(newCust);
              count++;
          });
          alert(`${count} Customers Imported Successfully`);
          if(fileInputRef.current) fileInputRef.current.value = '';
      };
      reader.readAsBinaryString(file);
  };

  // --- Statement Logic ---
  const getStatementData = (custId: string) => {
      const custTransactions = transactions
        .filter(t => t.customerId === custId)
        .sort((a, b) => a.date.localeCompare(b.date)); 
      
      let runningBalance = 0;
      
      return custTransactions.map(t => {
          const isDebit = t.type === 'INCOME';
          const isCredit = t.type === 'COLLECTION' || t.type === 'EXPENSE';
          
          const debit = isDebit ? t.amountUsd : 0;
          const credit = isCredit ? t.amountUsd : 0;
          
          runningBalance = runningBalance + debit - credit;
          
          return { ...t, debit, credit, balance: runningBalance };
      });
  };

  const handleExportStatementExcel = () => {
    if (!selectedCustomer) return;
    const statementData = getStatementData(selectedCustomer.id);
    const exportData = statementData.map(item => ({
        [t('date')]: item.date,
        [t('transactionType')]: item.type,
        [t('docNo')]: item.id,
        [t('description')]: item.description,
        [t('debit')]: item.debit,
        [t('credit')]: item.credit,
        [t('balance')]: item.balance
    }));
    
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Ekstre");
    XLSX.writeFile(wb, `Statement_${selectedCustomer.company}.xlsx`);
  };

  const handleTxUpdate = (e: React.FormEvent) => {
      e.preventDefault();
      if (!editingTx) return;
      const amountUsd = txForm.currency === Currency.RUB ? txForm.amount / txForm.exchangeRate : txForm.amount;
      const updatedTx: Transaction = {
          ...editingTx,
          description: txForm.description,
          amount: txForm.amount,
          exchangeRate: txForm.exchangeRate,
          currency: txForm.currency,
          amountUsd: amountUsd
      };
      onUpdateTransaction(updatedTx);
      setIsEditTxOpen(false);
      setEditingTx(null);
  };

  const handleEditTxClick = (t: Transaction) => {
      setEditingTx(t);
      setTxForm({
          description: t.description,
          amount: t.amount,
          exchangeRate: t.exchangeRate,
          currency: t.currency
      });
      setIsEditTxOpen(true);
  };

  // Helper for customer modal content
  const renderCustomerContent = () => {
      if (!selectedCustomer) return null;
      const statementData = getStatementData(selectedCustomer.id);
      const customerOrders = orders.filter(o => o.customerId === selectedCustomer.id);

      return (
          <div className="flex flex-col h-full">
              {/* Modal Header */}
              <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
                  <div className="flex items-center gap-5">
                      <div className="w-16 h-16 bg-blue-600 text-white rounded-2xl flex items-center justify-center font-black text-3xl shadow-lg shadow-blue-200">
                          {selectedCustomer.company.charAt(0).toUpperCase()}
                      </div>
                      <div>
                          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">{selectedCustomer.company}</h2>
                          <div className="flex items-center gap-4 text-sm text-slate-500 mt-1">
                              <span className="flex items-center bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200"><Users size={12} className="mr-1.5"/> {selectedCustomer.name}</span>
                              <span className="flex items-center bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200"><Globe size={12} className="mr-1.5"/> {selectedCustomer.city}</span>
                          </div>
                      </div>
                  </div>
                  <div className="text-right">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{t('balance')}</p>
                      <p className={`text-4xl font-black ${selectedCustomer.balanceUsd > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          ${selectedCustomer.balanceUsd.toLocaleString(undefined, {minimumFractionDigits: 2})}
                      </p>
                  </div>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-slate-200 px-6 bg-white shadow-sm sticky top-0 z-10">
                  <button onClick={() => setActiveTab('OVERVIEW')} className={`py-4 px-6 font-bold text-sm border-b-2 transition-all flex items-center ${activeTab === 'OVERVIEW' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}>
                      <Building2 size={16} className="mr-2"/> {t('general')}
                  </button>
                  <button onClick={() => setActiveTab('STATEMENT')} className={`py-4 px-6 font-bold text-sm border-b-2 transition-all flex items-center ${activeTab === 'STATEMENT' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}>
                      <FileText size={16} className="mr-2"/> {t('statement')}
                  </button>
                  <button onClick={() => setActiveTab('ORDERS')} className={`py-4 px-6 font-bold text-sm border-b-2 transition-all flex items-center ${activeTab === 'ORDERS' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}>
                      <ShoppingBag size={16} className="mr-2"/> {t('orderHistory')}
                  </button>
              </div>

              {/* Content Area */}
              <div className="flex-1 overflow-y-auto p-8 bg-slate-50">
                  {activeTab === 'OVERVIEW' && (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
                          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
                              <h4 className="font-bold text-slate-800 mb-6 flex items-center text-lg border-b border-slate-100 pb-3">
                                  <Users size={20} className="mr-2 text-blue-500"/> {t('customerDetails')}
                              </h4>
                              <div className="space-y-5">
                                  <div className="grid grid-cols-3 items-center"><span className="text-slate-400 text-sm font-medium uppercase">{t('companyName')}</span ><span className="col-span-2 font-semibold text-slate-800">{selectedCustomer.company}</span></div>
                                  <div className="grid grid-cols-3 items-center"><span className="text-slate-400 text-sm font-medium uppercase">{t('authorized')}</span><span className="col-span-2 font-medium text-slate-700">{selectedCustomer.name}</span></div>
                                  <div className="grid grid-cols-3 items-center"><span className="text-slate-400 text-sm font-medium uppercase">{t('phone')}</span><span className="col-span-2 font-mono text-slate-700 bg-slate-50 inline-block w-fit px-2 py-1 rounded">{selectedCustomer.phone}</span></div>
                                  <div className="grid grid-cols-3 items-center"><span className="text-slate-400 text-sm font-medium uppercase">{t('email')}</span><span className="col-span-2 text-blue-600">{selectedCustomer.email || '-'}</span></div>
                                  <div className="grid grid-cols-3 items-center"><span className="text-slate-400 text-sm font-medium uppercase">{t('birthday')}</span><span className="col-span-2 flex items-center"><Cake size={16} className="text-pink-400 mr-2"/> {selectedCustomer.birthday || '-'}</span></div>
                              </div>
                          </div>
                          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
                              <h4 className="font-bold text-slate-800 mb-6 flex items-center text-lg border-b border-slate-100 pb-3">
                                  <Truck size={20} className="mr-2 text-orange-500"/> Lojistik & Adres
                              </h4>
                              <div className="space-y-5">
                                  <div className="grid grid-cols-3 items-center"><span className="text-slate-400 text-sm font-medium uppercase">{t('country')}</span><span className="col-span-2 font-medium">{selectedCustomer.country}</span></div>
                                  <div className="grid grid-cols-3 items-center"><span className="text-slate-400 text-sm font-medium uppercase">{t('city')}</span><span className="col-span-2 font-medium">{selectedCustomer.city}</span></div>
                                  <div className="grid grid-cols-3 items-center"><span className="text-slate-400 text-sm font-medium uppercase">{t('cargoFirm')}</span><span className="col-span-2 font-bold text-slate-800">{selectedCustomer.cargoCompany || '-'}</span></div>
                                  <div className="grid grid-cols-3 items-center"><span className="text-slate-400 text-sm font-medium uppercase">{t('cargoNo')}</span><span className="col-span-2 font-mono bg-orange-50 text-orange-700 px-2 py-1 rounded w-fit">{selectedCustomer.cargoCustNo || '-'}</span></div>
                                  <div className="mt-4 bg-slate-50 p-4 rounded-xl border border-slate-100 text-slate-600 italic text-sm">
                                      <MapPin size={16} className="inline mr-2 text-slate-400"/>
                                      {selectedCustomer.address || 'Adres girilmemiş.'}
                                  </div>
                              </div>
                          </div>
                      </div>
                  )}

                  {activeTab === 'STATEMENT' && (
                      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
                          <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-slate-50">
                              <h4 className="font-bold text-slate-700 flex items-center"><History size={18} className="mr-2 text-blue-600"/> {t('statement')}</h4>
                              <div className="flex gap-2">
                                  <button onClick={() => window.print()} className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 text-sm font-medium transition-colors"><Printer size={16}/> {t('print')}</button>
                                  <button onClick={handleExportStatementExcel} className="flex items-center gap-2 px-3 py-2 bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 text-sm font-medium transition-colors"><FileSpreadsheet size={16}/> Excel</button>
                              </div>
                          </div>
                          <table className="w-full text-sm">
                              <thead className="bg-slate-100 text-slate-500 font-semibold uppercase text-xs">
                                  <tr>
                                      <th className="p-4 text-left">{t('date')}</th>
                                      <th className="p-4 text-left">{t('docNo')}</th>
                                      <th className="p-4 text-left">{t('description')}</th>
                                      <th className="p-4 text-right text-red-600 bg-red-50/30">{t('debit')}</th>
                                      <th className="p-4 text-right text-green-600 bg-green-50/30">{t('credit')}</th>
                                      <th className="p-4 text-right">{t('balance')}</th>
                                      <th className="p-4 text-center">{t('action')}</th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                  {statementData.length === 0 ? (
                                      <tr><td colSpan={7} className="p-12 text-center text-slate-400 italic">Henüz işlem kaydı bulunmuyor.</td></tr>
                                  ) : (
                                      statementData.map(tx => (
                                          <tr key={tx.id} className="hover:bg-blue-50/50 group transition-colors">
                                              <td className="p-4 font-mono text-slate-600">{tx.date}</td>
                                              <td className="p-4 text-xs font-mono text-slate-400 group-hover:text-slate-600">{tx.id}</td>
                                              <td className="p-4 font-medium text-slate-700">{tx.description}</td>
                                              <td className="p-4 text-right text-slate-700 font-medium bg-red-50/5 group-hover:bg-red-50/20">{tx.debit > 0 ? `$${tx.debit.toLocaleString()}` : '-'}</td>
                                              <td className="p-4 text-right text-slate-700 font-medium bg-green-50/5 group-hover:bg-green-50/20">{tx.credit > 0 ? `$${tx.credit.toLocaleString()}` : '-'}</td>
                                              <td className={`p-4 text-right font-bold ${tx.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>${Math.abs(tx.balance).toLocaleString()}</td>
                                              <td className="p-4 text-center flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                  <button onClick={() => handleEditTxClick(tx)} className="p-1.5 text-blue-500 hover:bg-blue-100 rounded"><Edit size={16}/></button>
                                                  <button onClick={() => { if(window.confirm(t('confirmDelete'))) onDeleteTransaction(tx.id); }} className="p-1.5 text-red-500 hover:bg-red-100 rounded"><Trash2 size={16}/></button>
                                              </td>
                                          </tr>
                                      ))
                                  )}
                              </tbody>
                          </table>
                      </div>
                  )}

                  {activeTab === 'ORDERS' && (
                      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
                          <div className="p-5 border-b border-slate-100 bg-slate-50">
                              <h4 className="font-bold text-slate-700 flex items-center"><ShoppingBag size={18} className="mr-2 text-orange-500"/> {t('orderHistory')}</h4>
                          </div>
                          <table className="w-full text-sm">
                              <thead className="bg-slate-100 text-slate-500 font-semibold uppercase text-xs">
                                  <tr>
                                      <th className="p-4 text-left">{t('date')}</th>
                                      <th className="p-4 text-left">Sipariş No</th>
                                      <th className="p-4 text-center">Ürün Adedi</th>
                                      <th className="p-4 text-right">Toplam Tutar</th>
                                      <th className="p-4 text-center">Durum</th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                  {customerOrders.length === 0 ? (
                                      <tr><td colSpan={5} className="p-12 text-center text-slate-400 italic">Sipariş kaydı yok.</td></tr>
                                  ) : (
                                      customerOrders.map(o => {
                                          const total = o.items.reduce((acc, i) => acc + (i.orderedQty * i.price), 0);
                                          return (
                                              <tr key={o.id} className="hover:bg-slate-50 transition-colors">
                                                  <td className="p-4 text-slate-600">{o.date}</td>
                                                  <td className="p-4 font-mono text-blue-600 font-medium">#{o.id}</td>
                                                  <td className="p-4 text-center font-bold">{o.items.length}</td>
                                                  <td className="p-4 text-right font-black text-slate-700">${total.toLocaleString()}</td>
                                                  <td className="p-4 text-center">
                                                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${o.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{o.status}</span>
                                                  </td>
                                              </tr>
                                          );
                                      })
                                  )}
                              </tbody>
                          </table>
                      </div>
                  )}
              </div>
          </div>
      );
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      <input type="file" ref={fileInputRef} onChange={handleImportFile} className="hidden" accept=".xlsx, .xls" />
      
      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between hover:shadow-md transition-shadow">
              <div>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">{t('totalReceivable')}</p>
                  <p className="text-3xl font-black text-slate-800 mt-1">${totalReceivable.toLocaleString()}</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-2xl text-blue-600"><DollarSign size={32}/></div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between hover:shadow-md transition-shadow">
              <div>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">{t('activeCustomers')}</p>
                  <p className="text-3xl font-black text-slate-800 mt-1">{totalActiveCustomers}</p>
              </div>
              <div className="p-4 bg-green-50 rounded-2xl text-green-600"><Users size={32}/></div>
          </div>
      </div>

      {/* List Header & Toolbar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col sm:flex-row justify-between gap-4 items-center">
          <div className="relative w-full sm:w-96">
              <Search className="absolute left-3 top-3 text-slate-400" size={20}/>
              <input 
                className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50 focus:bg-white transition-all" 
                placeholder={t('search')} 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
                <button onClick={handleImportClick} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-3 bg-green-50 text-green-700 rounded-xl hover:bg-green-100 font-bold border border-green-100 transition-colors"><FileUp size={18}/> {t('import')}</button>
                <button onClick={handleExportCustomerList} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-3 bg-slate-50 text-slate-700 rounded-xl hover:bg-slate-100 font-bold border border-slate-200 transition-colors"><Download size={18}/> {t('export')}</button>
                <button onClick={openAddModal} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold shadow-lg shadow-blue-200 transition-all hover:scale-105"><UserPlus size={20}/> {t('newCustomer')}</button>
          </div>
      </div>

      {/* Customer List Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex-1">
          <div className="overflow-x-auto h-full">
              <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                      <tr>
                          <th className="p-5 font-bold text-slate-500 uppercase text-xs tracking-wider">{t('companyName')}</th>
                          <th className="p-5 font-bold text-slate-500 uppercase text-xs tracking-wider">{t('authorized')}</th>
                          <th className="p-5 font-bold text-slate-500 uppercase text-xs tracking-wider">{t('city')}</th>
                          <th className="p-5 font-bold text-slate-500 uppercase text-xs tracking-wider">{t('phone')}</th>
                          <th className="p-5 font-bold text-slate-500 uppercase text-xs tracking-wider text-right">{t('balance')}</th>
                          <th className="p-5 font-bold text-slate-500 uppercase text-xs tracking-wider text-center">{t('action')}</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                      {filteredCustomers.map(c => {
                          const hasRecords = orders.some(o => o.customerId === c.id) || transactions.some(t => t.customerId === c.id);
                          return (
                            <tr key={c.id} onClick={() => handleRowClick(c)} className="hover:bg-blue-50 cursor-pointer transition-colors group">
                                <td className="p-5">
                                    <div className="flex items-center">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center mr-4 text-blue-600 font-bold text-sm shadow-sm">
                                            {c.company.substring(0,2).toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="font-bold text-slate-800 text-base">{c.company}</div>
                                            {c.cargoCompany && <div className="text-xs text-slate-400 flex items-center mt-0.5"><Truck size={10} className="mr-1"/> {c.cargoCompany}</div>}
                                        </div>
                                    </div>
                                </td>
                                <td className="p-5 text-slate-600 font-medium">{c.name}</td>
                                <td className="p-5 text-slate-500"><span className="bg-slate-100 px-2 py-1 rounded text-xs font-bold text-slate-600">{c.city}</span></td>
                                <td className="p-5 text-slate-500 font-mono text-xs">{c.phone}</td>
                                <td className="p-5 text-right">
                                    <span className={`font-black text-base ${c.balanceUsd > 0 ? 'text-red-500' : 'text-green-600'}`}>
                                        ${Math.abs(c.balanceUsd).toLocaleString()}
                                    </span>
                                    <div className="text-[10px] text-slate-400 font-bold uppercase">{c.balanceUsd > 0 ? 'Borçlu' : 'Alacaklı'}</div>
                                </td>
                                <td className="p-5 text-center">
                                    <div className="flex justify-center gap-2">
                                        <button 
                                            onClick={(e) => openEditModal(e, c)} 
                                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" 
                                            title={t('edit')}
                                        >
                                            <Edit size={18}/>
                                        </button>
                                        <button 
                                            onClick={(e) => handleDeleteCustomer(e, c.id)} 
                                            disabled={hasRecords}
                                            className={`p-2 rounded-lg transition-all ${hasRecords ? 'text-slate-200 cursor-not-allowed' : 'text-slate-400 hover:text-red-600 hover:bg-red-50'}`} 
                                            title={hasRecords ? t('cannotDeleteCustomer') : t('delete')}
                                        >
                                            <Trash2 size={18}/>
                                        </button>
                                        <button className="p-2 text-slate-300 hover:text-slate-600 rounded-lg">
                                            <ArrowRight size={18}/>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                          );
                      })}
                  </tbody>
              </table>
          </div>
      </div>

      {/* CUSTOMER DETAIL MODAL (FULL WINDOW) */}
      {selectedCustomer && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white w-full max-w-6xl h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden relative animate-in fade-in zoom-in duration-300 ring-1 ring-white/20">
                  <button onClick={() => setSelectedCustomer(null)} className="absolute top-5 right-5 z-50 bg-white/80 backdrop-blur rounded-full p-2 shadow-lg hover:bg-red-50 hover:text-red-500 transition-all">
                      <X size={24}/>
                  </button>
                  {renderCustomerContent()}
              </div>
          </div>
      )}

      {/* ADD/EDIT CUSTOMER MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-y-auto max-h-[90vh] animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 className="font-bold text-slate-800 text-xl">{editingId ? t('edit') : t('newCustomer')}</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 text-2xl hover:text-red-500 transition-colors">&times;</button>
            </div>
            <form onSubmit={handleAddOrUpdate} className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t('companyName')}</label>
                    <input required className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all" value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})} placeholder="Örn: Yılmaz Tekstil Ltd." />
                </div>
                <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t('authorized')}</label><input required className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} /></div>
                <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t('phone')}</label><input required className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} /></div>
                <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t('email')}</label><input className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} /></div>
                <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t('birthday')}</label><input type="date" className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all" value={formData.birthday} onChange={e => setFormData({...formData, birthday: e.target.value})} /></div>
                <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t('country')}</label><input className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all" value={formData.country} onChange={e => setFormData({...formData, country: e.target.value})} /></div>
                <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t('city')}</label><input className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} /></div>
                <div className="md:col-span-2 grid grid-cols-2 gap-6 p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t('cargoFirm')}</label><input className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white" value={formData.cargoCompany} onChange={e => setFormData({...formData, cargoCompany: e.target.value})} /></div>
                    <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t('cargoNo')}</label><input className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white" value={formData.cargoCustNo} onChange={e => setFormData({...formData, cargoCustNo: e.target.value})} /></div>
                </div>
                <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t('address')}</label>
                    <textarea className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none h-24 resize-none transition-all" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
                </div>
                <div className="md:col-span-2 pt-6 flex justify-end gap-3 border-t border-slate-100">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 text-slate-600 bg-slate-100 rounded-xl font-bold hover:bg-slate-200 transition-colors">{t('cancel')}</button>
                    <button type="submit" className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all transform hover:scale-105">{t('save')}</button>
                </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Transaction Modal */}
      {isEditTxOpen && editingTx && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
             <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-8 animate-in fade-in zoom-in duration-200">
                <h3 className="font-bold text-slate-800 text-xl mb-6">{t('edit')} ({editingTx.id})</h3>
                <form onSubmit={handleTxUpdate} className="space-y-6">
                    <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t('description')}</label><input type="text" className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" value={txForm.description} onChange={e => setTxForm({...txForm, description: e.target.value})} /></div>
                    <div className="grid grid-cols-2 gap-4"><div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t('amount')}</label><input type="number" step="0.01" className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" value={txForm.amount} onChange={e => setTxForm({...txForm, amount: parseFloat(e.target.value)})} /></div></div>
                    <div className="flex gap-3 pt-4"><button type="button" onClick={() => setIsEditTxOpen(false)} className="flex-1 py-3 bg-slate-100 rounded-xl font-bold text-slate-600 hover:bg-slate-200 transition-colors">{t('cancel')}</button><button type="submit" className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg transition-colors">{t('save')}</button></div>
                </form>
             </div>
        </div>
      )}
    </div>
  );
};
