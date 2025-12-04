import React from 'react';
import { AppState } from '../../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { DollarSign, Package, ShoppingBag, Users } from 'lucide-react';

interface Props {
  state: AppState;
  t: (key: string) => string;
}

export const Dashboard: React.FC<Props> = ({ state, t }) => {
  // Stats Calculation
  const totalStock = state.products.reduce((acc, p) => acc + p.stok, 0);
  const totalReceivables = state.customers.reduce((acc, c) => acc + (c.balanceUsd > 0 ? c.balanceUsd : 0), 0);
  const totalOrders = state.orders.length;
  
  // Chart Data preparation
  const stockByBrand = state.products.reduce((acc, p) => {
      acc[p.marka] = (acc[p.marka] || 0) + p.stok;
      return acc;
  }, {} as Record<string, number>);
  
  const pieData = Object.keys(stockByBrand).map(k => ({ name: k, value: stockByBrand[k] }));
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  // Mock Weekly Sales
  const salesData = [
      { name: 'Mon', sales: 4000 },
      { name: 'Tue', sales: 3000 },
      { name: 'Wed', sales: 2000 },
      { name: 'Thu', sales: 2780 },
      { name: 'Fri', sales: 1890 },
      { name: 'Sat', sales: 2390 },
      { name: 'Sun', sales: 3490 },
  ];

  return (
    <div className="space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center">
                <div className="p-3 bg-blue-100 text-blue-600 rounded-full mr-4"><DollarSign size={24}/></div>
                <div>
                    <p className="text-sm text-slate-500 uppercase font-semibold">{t('debit')}</p>
                    <p className="text-2xl font-bold text-slate-800">${totalReceivables.toLocaleString()}</p>
                </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center">
                <div className="p-3 bg-indigo-100 text-indigo-600 rounded-full mr-4"><Package size={24}/></div>
                <div>
                    <p className="text-sm text-slate-500 uppercase font-semibold">{t('stockCount')}</p>
                    <p className="text-2xl font-bold text-slate-800">{totalStock.toLocaleString()}</p>
                </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center">
                <div className="p-3 bg-orange-100 text-orange-600 rounded-full mr-4"><ShoppingBag size={24}/></div>
                <div>
                    <p className="text-sm text-slate-500 uppercase font-semibold">{t('orders')}</p>
                    <p className="text-2xl font-bold text-slate-800">{totalOrders}</p>
                </div>
            </div>
             <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center">
                <div className="p-3 bg-green-100 text-green-600 rounded-full mr-4"><Users size={24}/></div>
                <div>
                    <p className="text-sm text-slate-500 uppercase font-semibold">{t('customers')}</p>
                    <p className="text-2xl font-bold text-slate-800">{state.customers.length}</p>
                </div>
            </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-96">
                <h3 className="font-bold text-slate-700 mb-4">Weekly Sales</h3>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={salesData} margin={{top: 20, right: 30, left: 20, bottom: 25}}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0"/>
                        <XAxis dataKey="name" tick={{fill: '#64748b'}} axisLine={false} tickLine={false} />
                        <YAxis tick={{fill: '#64748b'}} axisLine={false} tickLine={false}/>
                        <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}/>
                        <Bar dataKey="sales" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-96">
                <h3 className="font-bold text-slate-700 mb-4">{t('stock')} Distribution</h3>
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            fill="#8884d8"
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {pieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip />
                    </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap justify-center gap-4 mt-[-20px]">
                    {pieData.map((entry, index) => (
                         <div key={index} className="flex items-center text-xs text-slate-600">
                             <div className="w-2 h-2 rounded-full mr-2" style={{backgroundColor: COLORS[index % COLORS.length]}}></div>
                             {entry.name}
                         </div>
                    ))}
                </div>
            </div>
        </div>
    </div>
  );
};