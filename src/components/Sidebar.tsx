import React from 'react';
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  ShoppingCart, 
  Truck, 
  Wallet, 
  TrendingDown,
  PieChart,
  BarChart3,
  LogOut,
  Shield
} from 'lucide-react';
import { View, User } from '../types';

interface SidebarProps {
  currentView: View;
  onChangeView: (view: View) => void;
  onLogout: () => void;
  currentUser: User | null;
  t: (key: string) => string;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView, onLogout, currentUser, t }) => {
  const menuItems = [
    { id: 'DASHBOARD', label: t('dashboard'), icon: LayoutDashboard },
    { id: 'STOCK', label: t('stock'), icon: Package },
    { id: 'CUSTOMERS', label: t('customers'), icon: Users },
    { id: 'ORDERS', label: t('orders'), icon: ShoppingCart },
    { id: 'SALES', label: t('sales'), icon: Truck },
    { id: 'PURCHASE', label: t('purchase'), icon: TrendingDown },
    { id: 'FINANCE', label: t('finance'), icon: Wallet },
    { id: 'EXPENSES', label: t('expenses'), icon: PieChart },
    { id: 'REPORTS', label: t('reports'), icon: BarChart3 },
  ];

  // Only show User Management for Admins
  if (currentUser?.role === 'admin') {
    menuItems.push({ id: 'USERS', label: t('userManagement'), icon: Shield });
  }

  return (
    <aside className="w-64 bg-slate-900 text-white min-h-screen flex flex-col fixed left-0 top-0 z-10 shadow-xl">
      <div className="p-6 border-b border-slate-800">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-teal-400 bg-clip-text text-transparent">
          TextileERP
        </h1>
        <p className="text-xs text-slate-400 mt-1">Wholesale Management</p>
      </div>
      
      {/* User Profile Summary */}
      <div className="p-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold text-lg">
                {currentUser?.username.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
                <div className="font-bold truncate text-sm">{currentUser?.fullName}</div>
                <div className="text-xs text-slate-400 capitalize">{currentUser?.role}</div>
            </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-4">
        <ul>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <li key={item.id} className="mb-1 px-3">
                <button
                  onClick={() => onChangeView(item.id as View)}
                  className={`flex items-center w-full px-4 py-3 rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Icon size={20} className="mr-3" />
                  <span className="font-medium">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
      
      <div className="p-4 border-t border-slate-800">
        <button onClick={onLogout} className="flex items-center w-full px-4 py-2 text-red-400 hover:bg-slate-800 rounded-lg transition-colors">
            <LogOut size={20} className="mr-3"/>
            <span className="font-medium">{t('logout')}</span>
        </button>
        <div className="mt-4 text-center text-xs text-slate-600">
            v1.3.0 (Auth)
        </div>
      </div>
    </aside>
  );
};