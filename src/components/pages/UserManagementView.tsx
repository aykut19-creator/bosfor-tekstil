import React from 'react';
import { User } from '../../types';
import { CheckCircle, XCircle, Shield, User as UserIcon } from 'lucide-react';

interface Props {
  users: User[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onUpdateRole: (id: string, role: any) => void;
  t: (key: string) => string;
}

export const UserManagementView: React.FC<Props> = ({ users, onApprove, onReject, onUpdateRole, t }) => {
  const pendingUsers = users.filter(u => u.status === 'pending');
  const activeUsers = users.filter(u => u.status === 'active');

  return (
    <div className="space-y-8">
      {/* Pending Requests */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-orange-50/50">
          <h3 className="font-bold text-slate-800 flex items-center">
            <Shield size={20} className="mr-2 text-orange-500"/> {t('pendingRequests')}
          </h3>
        </div>
        <div className="p-0">
          {pendingUsers.length === 0 ? (
            <p className="p-8 text-center text-slate-400 italic">Bekleyen üyelik talebi yok.</p>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
                <tr>
                  <th className="p-4">{t('username')}</th>
                  <th className="p-4">{t('fullName')}</th>
                  <th className="p-4">{t('email')}</th>
                  <th className="p-4 text-center">{t('action')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pendingUsers.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="p-4 font-bold text-slate-700">{u.username}</td>
                    <td className="p-4">{u.fullName}</td>
                    <td className="p-4 text-blue-600">{u.email}</td>
                    <td className="p-4 flex justify-center gap-2">
                      <button onClick={() => onApprove(u.id)} className="flex items-center px-3 py-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 font-bold text-xs transition-colors">
                        <CheckCircle size={14} className="mr-1"/> {t('approve')}
                      </button>
                      <button onClick={() => onReject(u.id)} className="flex items-center px-3 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 font-bold text-xs transition-colors">
                        <XCircle size={14} className="mr-1"/> {t('reject')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Active Users */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <h3 className="font-bold text-slate-800 flex items-center">
            <UserIcon size={20} className="mr-2 text-blue-500"/> {t('activeUsers')}
          </h3>
        </div>
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
            <tr>
              <th className="p-4">{t('username')}</th>
              <th className="p-4">{t('fullName')}</th>
              <th className="p-4">{t('email')}</th>
              <th className="p-4">Role</th>
              <th className="p-4 text-center">{t('action')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {activeUsers.map(u => (
              <tr key={u.id} className="hover:bg-slate-50">
                <td className="p-4 font-bold text-slate-700">{u.username}</td>
                <td className="p-4">{u.fullName}</td>
                <td className="p-4 text-slate-500">{u.email}</td>
                <td className="p-4"><span className={`px-2 py-1 rounded text-xs font-bold ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-700'}`}>{u.role.toUpperCase()}</span></td>
                <td className="p-4 text-center">
                  {u.role !== 'admin' && (
                    <button onClick={() => onReject(u.id)} className="text-red-400 hover:text-red-600 transition-colors">
                      <XCircle size={18}/>
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};