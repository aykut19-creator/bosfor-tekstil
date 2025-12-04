
import React, { useState, useMemo } from 'react';
import { AppState } from '../../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Calendar, TrendingUp, TrendingDown, DollarSign, CreditCard } from 'lucide-react';

interface Props {
  state: AppState;
  t: (key: string) => string;
}

type Period = 'WEEK' | 'MONTH' | 'YEAR';

export const ReportsView: React.FC<Props> = ({ state, t }) => {
  const [period, setPeriod] = useState<Period>('MONTH');

  // Filter Data based on Period
  const filteredData = useMemo(() => {
    const now = new Date();
    const filterDate = new Date();
    
    if (period === 'WEEK') filterDate.setDate(now.getDate() - 7);
    if (period === 'MONTH') filterDate.setMonth(now.getMonth() - 1);
    if (period === 'YEAR') filterDate.setFullYear(now.getFullYear() - 1);

    const transactions = state.transactions.filter(t => new Date(t.date) >= filterDate);
    const orders = state.orders.filter(o => new Date(o.date) >= filterDate);

    return { transactions, orders };
  }, [state, period]);

  // Calculate Metrics
  const metrics = useMemo(() => {
    const { transactions, orders } = filteredData;

    const totalSales = transactions
        .filter(t => t.type === 'INCOME' && t.category === 'Sale Invoice')
        .reduce((acc, t) => acc + t.amountUsd, 0);

    const totalCollections = transactions
        .filter(t => t.type === 'COLLECTION')
        .reduce((acc, t) => acc + t.amountUsd, 0);

    const totalExpenses = transactions
        .filter(t => t.type === 'EXPENSE' || t.type === 'PAYMENT')
        .reduce((acc, t) => acc + t.amountUsd, 0);

    const totalOrders = orders.length;

    return { totalSales, totalCollections, totalExpenses, totalOrders };
  }, [filteredData]);

  // Prepare Chart Data
  const chartData = useMemo(() => {
      const { transactions } = filteredData;
      
      // Group by Date for Trend
      const trendMap: Record<string, { date: string, income: number, expense: number }> = {};
      
      transactions.forEach(t => {
          if (!trendMap[t.date]) trendMap[t.date] = { date: t.date, income: 0, expense: 0 };
          if (t.type === 'INCOME' || t.type === 'COLLECTION') {
              trendMap[t.date].income += t.amountUsd;
          } else {
              trendMap[t.date].expense += t.amountUsd;
          }
      });

      const trendData = Object.values(trendMap).sort((a,b) => a.date.localeCompare(b.date));

      // Group by Category for Pie
      const expenseMap: Record<string, number> = {};
      transactions
        .filter(t => t.type === 'EXPENSE' || t.type === 'PAYMENT')
        .forEach(t => {
           const cat = t.category || 'Other';
           expenseMap[cat] = (expenseMap[cat] || 0) + t.amountUsd;
        });

      const pieData = Object.keys(expenseMap).map(k => ({ name: k, value: expenseMap[k] }));

      return { trendData, pieData };
  }, [filteredData]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#ff6b6b'];

  return (
    <div className="space-y-6">
      {/* Header & Filter */}
      <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center space-x-2 text-slate-700">
              <Calendar size={20} className="text-blue-600"/>
              <span className="font-bold">{t('period')}:</span>
          </div>
          <div className="flex bg-slate-100 p-1 rounded-lg mt-2 sm:mt-0">
              {['WEEK', 'MONTH', 'YEAR'].map((p) => (
                  <button 
                    key={p}
                    onClick={() => setPeriod(p as Period)}
                    className={`px-4 py-2 text-sm font-bold rounded-md transition-all ${period === p ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                      {t(p.toLowerCase() + 'ly')}
                  </button>
              ))}
          </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 border-l-4 border-l-blue-500">
              <div className="flex justify-between items-start">
                  <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('totalSales')}</p>
                      <h3 className="text-2xl font-bold text-slate-800 mt-1">${metrics.totalSales.toLocaleString()}</h3>
                  </div>
                  <div className="p-2 bg-blue-50 rounded-lg text-blue-600"><TrendingUp size={24}/></div>
              </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 border-l-4 border-l-green-500">
              <div className="flex justify-between items-start">
                  <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('totalCollections')}</p>
                      <h3 className="text-2xl font-bold text-slate-800 mt-1">${metrics.totalCollections.toLocaleString()}</h3>
                  </div>
                  <div className="p-2 bg-green-50 rounded-lg text-green-600"><DollarSign size={24}/></div>
              </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 border-l-4 border-l-red-500">
              <div className="flex justify-between items-start">
                  <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('totalExpenses')}</p>
                      <h3 className="text-2xl font-bold text-slate-800 mt-1">${metrics.totalExpenses.toLocaleString()}</h3>
                  </div>
                  <div className="p-2 bg-red-50 rounded-lg text-red-600"><TrendingDown size={24}/></div>
              </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 border-l-4 border-l-indigo-500">
              <div className="flex justify-between items-start">
                  <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('netCashFlow')}</p>
                      <h3 className={`text-2xl font-bold mt-1 ${metrics.totalCollections - metrics.totalExpenses >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ${(metrics.totalCollections - metrics.totalExpenses).toLocaleString()}
                      </h3>
                  </div>
                  <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600"><CreditCard size={24}/></div>
              </div>
          </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-96">
              <h3 className="font-bold text-slate-700 mb-6">{t('salesTrend')} (Income vs Expense)</h3>
              <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData.trendData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false}/>
                      <XAxis dataKey="date" tick={{fontSize: 12}} />
                      <YAxis tick={{fontSize: 12}} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="income" name={t('income')} fill="#10b981" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="expense" name={t('expense')} fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
              </ResponsiveContainer>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-96">
              <h3 className="font-bold text-slate-700 mb-6">{t('expenseDistribution')}</h3>
               <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={chartData.pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            fill="#8884d8"
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {chartData.pieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip formatter={(val: number) => `$${val.toLocaleString()}`} />
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
          </div>
      </div>
    </div>
  );
};
