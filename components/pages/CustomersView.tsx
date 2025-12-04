
import React, { useState, useRef } from 'react';
import { Customer, Order, Transaction, Currency } from '../../types';
import { UserPlus, Search, Phone, Building2, History, Users, FileText, Download, Printer, MapPin, Mail, Globe, FileSpreadsheet, Edit, Trash2, Truck, FileUp, Cake, X, DollarSign, ShoppingBag, Calendar } from 'lucide-react';
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
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
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

  const openEditModal = (customer: Customer) => {
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
              <div className="flex justify-between items-start p-6 border-b border-slate-100 bg-slate-50">
                  <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-2xl shadow-inner">
                          {selectedCustomer.company.charAt(0).toUpperCase()}
                      </div>
                      <div>
                          <h2 className="text-2xl font-bold text-slate-800">{selectedCustomer.company}</h2>
                          <div className="flex items-center gap-4 text-sm text-slate-500 mt-1">
                              <span className="flex items-center"><Users size={14} className="mr-1"/> {selectedCustomer.name}</span>
                              <span className="flex items-center"><Globe size={14} className="mr-1"/> {selectedCustomer.city}, {selectedCustomer.country}</span>
                          </div>
                      </div>
                  </div>
                  <div className="text-right">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{t('balance')}</p>
                      <p className={`text-3xl font-black ${selectedCustomer.balanceUsd > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          ${selectedCustomer.balanceUsd.toLocaleString(undefined, {minimumFractionDigits: 2})}
                      </p>
                  </div>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-slate-200 px-6 bg-white">
                  <button onClick={() => setActiveTab('OVERVIEW')} className={`py-4 px-6 font-medium text-sm border-b-2 transition-colors ${activeTab === 'OVERVIEW' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                      {t('general')}
                  </button>
                  <button onClick={() => setActiveTab('STATEMENT')} className={`py-4 px-6 font-medium text-sm border-b-2 transition-colors ${activeTab === 'STATEMENT' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                      {t('statement')}
                  </button>
                  <button onClick={() => setActiveTab('ORDERS')} className={`py-4 px-6 font-medium text-sm border-b-2 transition-colors ${activeTab === 'ORDERS' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                      {t('orderHistory')}
                  </button>
              </div>

              {/* Content Area */}
              <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
                  {activeTab === 'OVERVIEW' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                              <h4 className="font-bold text-slate-700 mb-4 flex items-center"><Building2 size={18} className="mr-2 text-blue-500"/> {t('customerDetails')}</h4>
                              <div className="space-y-4">
                                  <div className="flex justify-between border-b border-slate-50 pb-2"><span className="text-slate-500 text-sm">{t('companyName')}</span><span className="font-medium">{selectedCustomer.company}</span></div>
                                  <div className="flex justify-between border-b border-slate-50 pb-2"><span className="text-slate-500 text-sm">{t('authorized')}</span><span className="font-medium">{selectedCustomer.name}</span></div>
                                  <div className="flex justify-between border-b border-slate-50 pb-2"><span className="text-slate-500 text-sm">{t('phone')}</span><span className="font-medium">{selectedCustomer.phone}</span></div>
                                  <div className="flex justify-between border-b border-slate-50 pb-2"><span className="text-slate-500 text-sm">{t('email')}</span><span className="font-medium">{selectedCustomer.email || '-'}</span></div>
                                  <div className="flex justify-between border-b border-slate-50 pb-2"><span className="text-slate-500 text-sm">{t('birthday')}</span><span className="font-medium">{selectedCustomer.birthday || '-'}</span></div>
                              </div>
                          </div>
                          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                              <h4 className="font-bold text-slate-700 mb-4 flex items-center"><Truck size={18} className="mr-2 text-orange-500"/> Lojistik & Adres</h4>
                              <div className="space-y-4">
                                  <div className="flex justify-between border-b border-slate-50 pb-2"><span className="text-slate-500 text-sm">{t('country')}</span><span className="font-medium">{selectedCustomer.country}</span></div>
                                  <div className="flex justify-between border-b border-slate-50 pb-2"><span className="text-slate-500 text-sm">{t('city')}</span><span className="font-medium">{selectedCustomer.city}</span></div>
                                  <div className="flex justify-between border-b border-slate-50 pb-2"><span className="text-slate-500 text-sm">{t('cargoFirm')}</span><span className="font-medium">{selectedCustomer.cargoCompany || '-'}</span></div>
                                  <div className="flex justify-between border-b border-slate-50 pb-2"><span className="text-slate-500 text-sm">{t('cargoNo')}</span><span className="font-medium">{selectedCustomer.cargoCustNo || '-'}</span></div>
                                  <div className="mt-2"><span className="text-slate-500 text-sm block mb-1">{t('address')}</span><p className="text-sm bg-slate-50 p-2 rounded border border-slate-100">{selectedCustomer.address || '-'}</p></div>
                              </div>
                          </div>
                      </div>
                  )}

                  {activeTab === 'STATEMENT' && (
                      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                          <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-slate-50">
                              <h4 className="font-bold text-slate-700">{t('statement')}</h4>
                              <div className="flex gap-2">
                                  <button onClick={() => window.print()} className="p-2 bg-white border border-slate-200 rounded hover:bg-slate-50 text-slate-600"><Printer size={16}/></button>
                                  <button onClick={handleExportStatementExcel} className="p-2 bg-green-50 text-green-700 border border-green-200 rounded hover:bg-green-100"><FileSpreadsheet size={16}/></button>
                              </div>
                          </div>
                          <table className="w-full text-sm">
                              <thead className="bg-slate-100 text-slate-500 font-semibold">
                                  <tr>
                                      <th className="p-3 text-left">{t('date')}</th>
                                      <th className="p-3 text-left">{t('docNo')}</th>
                                      <th className="p-3 text-left">{t('description')}</th>
                                      <th className="p-3 text-right text-red-600">{t('debit')}</th>
                                      <th className="p-3 text-right text-green-600">{t('credit')}</th>
                                      <th className="p-3 text-right">{t('balance')}</th>
                                      <th className="p-3 text-center">{t('action')}</th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                  {statementData.length === 0 ? (
                                      <tr><td colSpan={7} className="p-8 text-center text-slate-400 italic">İşlem bulunamadı.</td></tr>
                                  ) : (
                                      statementData.map(tx => (
                                          <tr key={tx.id} className="hover:bg-blue-50">
                                              <td className="p-3 font-mono text-slate-600">{tx.date}</td>
                                              <td className="p-3 text-xs text-slate-500">{tx.id}</td>
                                              <td className="p-3">{tx.description}</td>
                                              <td className="p-3 text-right text-slate-700 font-medium">{tx.debit > 0 ? `$${tx.debit.toLocaleString()}` : '-'}</td>
                                              <td className="p-3 text-right text-slate-700 font-medium">{tx.credit > 0 ? `$${tx.credit.toLocaleString()}` : '-'}</td>
                                              <td className={`p-3 text-right font-bold ${tx.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>${Math.abs(tx.balance).toLocaleString()}</td>
                                              <td className="p-3 text-center flex justify-center gap-2">
                                                  <button onClick={() => handleEditTxClick(tx)} className="text-blue-400 hover:text-blue-600"><Edit size={14}/></button>
                                                  <button onClick={() => { if(window.confirm(t('confirmDelete'))) onDeleteTransaction(tx.id); }} className="text-red-400 hover:text-red-600"><Trash2 size={14}/></button>
                                              </td>
                                          </tr>
                                      ))
                                  )}
                              </tbody>
                          </table>
                      </div>
                  )}

                  {activeTab === 'ORDERS' && (
                      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                          <div className="p-4 border-b border-slate-100 bg-slate-50">
                              <h4 className="font-bold text-slate-700">{t('orderHistory')}</h4>
                          </div>
                          <table className="w-full text-sm">
                              <thead className="bg-slate-100 text-slate-500 font-semibold">
                                  <tr>
                                      <th className="p-3 text-left">{t('date')}</th>
                                      <th className="p-3 text-left">Sipariş No</th>
                                      <th className="p-3 text-center">Ürün Adedi</th>
                                      <th className="p-3 text-right">Toplam Tutar</th>
                                      <th className="p-3 text-center">Durum</th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                  {customerOrders.length === 0 ? (
                                      <tr><td colSpan={5} className="p-8 text-center text-slate-400 italic">Sipariş kaydı yok.</td></tr>
                                  ) : (
                                      customerOrders.map(o => {
                                          const total = o.items.reduce((acc, i) => acc + (i.orderedQty * i.price), 0);
                                          return (
                                              <tr key={o.id} className="hover:bg-slate-50">
                                                  <td className="p-3 text-slate-600">{o.date}</td>
                                                  <td className="p-3 font-mono text-blue-600">#{o.id}</td>
                                                  <td className="p-3 text-center">{o.items.length}</td>
                                                  <td className="p-3 text-right font-bold text-slate-700">${total.toLocaleString()}</td>
                                                  <td className="p-3 text-center">
                                                      <span className={`px-2 py-1 rounded text-xs font-bold ${o.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{o.status}</span>
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
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between">
              <div>
                  <p className="text-sm text-slate-500 font-bold uppercase">{t('totalReceivable')}</p>
                  <p className="text-3xl font-black text-slate-800 mt-1">${totalReceivable.toLocaleString()}</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-full text-blue-600"><DollarSign size={24}/></div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between">
              <div>
                  <p className="text-sm text-slate-500 font-bold uppercase">{t('activeCustomers')}</p>
                  <p className="text-3xl font-black text-slate-800 mt-1">{totalActiveCustomers}</p>
              </div>
              <div className="p-4 bg-green-50 rounded-full text-green-600"><Users size={24}/></div>
          </div>
      </div>

      {/* List Header & Toolbar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col sm:flex-row justify-between gap-4">
          <div className="relative w-full sm:w-96">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={20}/>
              <input 
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                placeholder={t('search')} 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
          </div>
          <div className="flex gap-2">
                <button onClick={handleImportClick} className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 font-medium border border-green-200"><FileUp size={18}/> {t('import')}</button>
                <button onClick={handleExportCustomerList} className="flex items-center gap-2 px-4 py-2 bg-slate-50 text-slate-700 rounded-lg hover:bg-slate-100 font-medium border border-slate-200"><Download size={18}/> {t('export')}</button>
                <button onClick={openAddModal} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold shadow-md"><UserPlus size={18}/> {t('newCustomer')}</button>
          </div>
      </div>

      {/* Customer List Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex-1">
          <div className="overflow-x-auto h-full">
              <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                      <tr>
                          <th className="p-4 font-bold text-slate-500">{t('companyName')}</th>
                          <th className="p-4 font-bold text-slate-500">{t('authorized')}</th>
                          <th className="p-4 font-bold text-slate-500">{t('city')}</th>
                          <th className="p-4 font-bold text-slate-500">{t('phone')}</th>
                          <th className="p-4 font-bold text-slate-500 text-right">{t('balance')}</th>
                          <th className="p-4 font-bold text-slate-500 text-center">{t('action')}</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                      {filteredCustomers.map(c => (
                          <tr key={c.id} onClick={() => handleRowClick(c)} className="hover:bg-blue-50 cursor-pointer transition-colors group">
                              <td className="p-4 font-bold text-slate-700 flex items-center">
                                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center mr-3 text-slate-500 font-bold text-xs">
                                      {c.company.substring(0,2).toUpperCase()}
                                  </div>
                                  {c.company}
                              </td>
                              <td className="p-4 text-slate-600">{c.name}</td>
                              <td className="p-4 text-slate-500">{c.city}</td>
                              <td className="p-4 text-slate-500">{c.phone}</td>
                              <td className={`p-4 text-right font-bold ${c.balanceUsd > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                  ${Math.abs(c.balanceUsd).toLocaleString()}
                              </td>
                              <td className="p-4 text-center flex justify-center gap-2">
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); openEditModal(c); }} 
                                    className="p-2 text-blue-500 hover:bg-blue-100 rounded transition-colors" 
                                    title={t('edit')}
                                  >
                                      <Edit size={16}/>
                                  </button>
                                  <button 
                                    onClick={(e) => handleDeleteCustomer(e, c.id)} 
                                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" 
                                    title={t('delete')}
                                  >
                                      <Trash2 size={16}/>
                                  </button>
                              </td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
      </div>

      {/* CUSTOMER DETAIL MODAL */}
      {selectedCustomer && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white w-full max-w-5xl h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden relative animate-in fade-in zoom-in duration-200">
                  <button onClick={() => setSelectedCustomer(null)} className="absolute top-4 right-4 z-50 bg-white rounded-full p-2 shadow-md hover:bg-slate-100 transition-colors">
                      <X size={24} className="text-slate-500"/>
                  </button>
                  {renderCustomerContent()}
              </div>
          </div>
      )}

      {/* ADD/EDIT CUSTOMER MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                <h3 className="font-bold text-slate-800 text-lg">{editingId ? t('edit') : t('newCustomer')}</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 text-2xl hover:text-red-500">&times;</button>
            </div>
            <form onSubmit={handleAddOrUpdate} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t('companyName')}</label>
                    <input required className="w-full p-2 border border-slate-300 rounded focus:border-blue-500 outline-none" value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})} />
                </div>
                <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t('authorized')}</label><input required className="w-full p-2 border border-slate-300 rounded focus:border-blue-500 outline-none" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} /></div>
                <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t('phone')}</label><input required className="w-full p-2 border border-slate-300 rounded focus:border-blue-500 outline-none" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} /></div>
                <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t('email')}</label><input className="w-full p-2 border border-slate-300 rounded focus:border-blue-500 outline-none" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} /></div>
                <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t('birthday')}</label><input type="date" className="w-full p-2 border border-slate-300 rounded focus:border-blue-500 outline-none" value={formData.birthday} onChange={e => setFormData({...formData, birthday: e.target.value})} /></div>
                <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t('country')}</label><input className="w-full p-2 border border-slate-300 rounded focus:border-blue-500 outline-none" value={formData.country} onChange={e => setFormData({...formData, country: e.target.value})} /></div>
                <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t('city')}</label><input className="w-full p-2 border border-slate-300 rounded focus:border-blue-500 outline-none" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} /></div>
                <div className="md:col-span-2 grid grid-cols-2 gap-4 border-t border-slate-100 pt-4 mt-2">
                    <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t('cargoFirm')}</label><input className="w-full p-2 border border-slate-300 rounded focus:border-blue-500 outline-none" value={formData.cargoCompany} onChange={e => setFormData({...formData, cargoCompany: e.target.value})} /></div>
                    <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t('cargoNo')}</label><input className="w-full p-2 border border-slate-300 rounded focus:border-blue-500 outline-none" value={formData.cargoCustNo} onChange={e => setFormData({...formData, cargoCustNo: e.target.value})} /></div>
                </div>
                <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t('address')}</label>
                    <textarea className="w-full p-2 border border-slate-300 rounded focus:border-blue-500 outline-none h-20 resize-none" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
                </div>
                <div className="md:col-span-2 pt-4 flex justify-end gap-3 border-t border-slate-100">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 bg-slate-100 rounded hover:bg-slate-200">{t('cancel')}</button>
                    <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded font-bold hover:bg-blue-700 shadow-md">{t('save')}</button>
                </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Transaction Modal (Inside Statement) */}
      {isEditTxOpen && editingTx && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
             <div className="bg-white rounded-xl w-full max-w-md shadow-2xl p-6">
                <h3 className="font-bold text-slate-800 text-lg mb-4">{t('edit')} ({editingTx.id})</h3>
                <form onSubmit={handleTxUpdate} className="space-y-4">
                    <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t('description')}</label><input type="text" className="w-full p-2 border border-slate-300 rounded" value={txForm.description} onChange={e => setTxForm({...txForm, description: e.target.value})} /></div>
                    <div className="grid grid-cols-2 gap-4"><div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t('amount')}</label><input type="number" step="0.01" className="w-full p-2 border border-slate-300 rounded" value={txForm.amount} onChange={e => setTxForm({...txForm, amount: parseFloat(e.target.value)})} /></div></div>
                    <div className="flex gap-2 pt-4"><button type="button" onClick={() => setIsEditTxOpen(false)} className="flex-1 py-2 bg-slate-100 rounded">{t('cancel')}</button><button type="submit" className="flex-1 py-2 bg-blue-600 text-white rounded font-bold">{t('save')}</button></div>
                </form>
             </div>
        </div>
      )}
    </div>
  );
};
