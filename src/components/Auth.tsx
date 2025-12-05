import React, { useState } from 'react';
import { User } from '../types';
import { Lock, User as UserIcon, Mail, ShieldCheck } from 'lucide-react';

interface Props {
  onLogin: (user: User) => void;
  onRegister: (user: Omit<User, 'id' | 'status'>) => void;
  users: User[];
  t: (key: string) => string;
}

export const Auth: React.FC<Props> = ({ onLogin, onRegister, users, t }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
    fullName: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (isLogin) {
      const user = users.find(u => u.username === formData.username && u.password === formData.password);
      if (user) {
        if (user.status === 'active') {
          onLogin(user);
        } else {
          setError(t('pendingError'));
        }
      } else {
        setError(t('authError'));
      }
    } else {
      onRegister({
        username: formData.username,
        password: formData.password,
        email: formData.email,
        fullName: formData.fullName,
        role: 'user'
      });
      setSuccess(t('registerSuccess'));
      setIsLogin(true);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-black text-slate-800 mb-2">BOSFOR ERP</h1>
            <p className="text-slate-500">{isLogin ? t('loginTitle') : t('registerTitle')}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t('username')}</label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-3 text-slate-400" size={18} />
                <input 
                  required
                  className="w-full pl-10 p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
                  value={formData.username}
                  onChange={e => setFormData({...formData, username: e.target.value})}
                />
              </div>
            </div>

            {!isLogin && (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t('fullName')}</label>
                  <div className="relative">
                    <ShieldCheck className="absolute left-3 top-3 text-slate-400" size={18} />
                    <input 
                      required
                      className="w-full pl-10 p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
                      value={formData.fullName}
                      onChange={e => setFormData({...formData, fullName: e.target.value})}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t('email')}</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 text-slate-400" size={18} />
                    <input 
                      required
                      type="email"
                      className="w-full pl-10 p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
                      value={formData.email}
                      onChange={e => setFormData({...formData, email: e.target.value})}
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t('password')}</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-slate-400" size={18} />
                <input 
                  required
                  type="password"
                  className="w-full pl-10 p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                />
              </div>
            </div>

            {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg font-medium animate-in fade-in slide-in-from-top-2">{error}</div>}
            {success && <div className="p-3 bg-green-50 text-green-600 text-sm rounded-lg font-medium animate-in fade-in slide-in-from-top-2">{success}</div>}

            <button className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200">
              {isLogin ? t('login') : t('register')}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button 
              onClick={() => { setIsLogin(!isLogin); setError(''); setSuccess(''); }}
              className="text-sm text-slate-500 hover:text-blue-600 font-medium transition-colors"
            >
              {isLogin ? t('noAccount') : t('haveAccount')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};