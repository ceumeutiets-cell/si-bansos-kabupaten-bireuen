import React, { useState } from 'react';
import { PengaturanSistem } from '../types';
import { Lock, User as UserIcon, Eye, EyeOff, ShieldCheck, ArrowRight } from 'lucide-react';

interface LoginPageProps {
  settings: PengaturanSistem;
  onLoginSubmit: (u: string, p: string) => Promise<void>;
}

export const LoginPage: React.FC<LoginPageProps> = ({ settings, onLoginSubmit }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setErrorMessage('Username dan password wajib diisi.');
      return;
    }

    setErrorMessage('');
    setIsLoading(true);

    try {
      await onLoginSubmit(username, password);
    } catch (err: any) {
      setErrorMessage(err.message || 'Login gagal. Periksa username dan password Anda.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-center items-center p-4 relative overflow-hidden">
      
      {/* Background Glow Accents */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full relative z-10">
        
        {/* Branding Header Card */}
        <div className="text-center mb-6 space-y-2">
          <div className="flex items-center justify-center space-x-3 mb-2">
            {settings.logo_kabupaten && (
              <img
                src={settings.logo_kabupaten}
                alt="Logo Bireuen"
                className="w-14 h-14 object-contain bg-white p-1.5 rounded-2xl shadow-lg hover:scale-105 transition-transform"
                referrerPolicy="no-referrer"
              />
            )}
            {settings.logo_dinsos && (
              <img
                src={settings.logo_dinsos}
                alt="Logo Dinas Sosial"
                className="w-14 h-14 object-contain bg-white p-1.5 rounded-2xl border border-emerald-500/30 shadow-lg hover:scale-105 transition-transform"
                referrerPolicy="no-referrer"
              />
            )}
          </div>

          <p className="text-xs font-bold tracking-widest text-emerald-400 uppercase">
            {settings.nama_instansi}
          </p>
          <h2 className="text-sm font-semibold text-slate-300">
            {settings.sub_instansi}
          </h2>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center justify-center gap-2 mt-1">
            SI-BANSOS
          </h1>
          <p className="text-xs text-slate-400">
            Sistem Informasi Bantuan Sosial Kabupaten Bireuen
          </p>
        </div>

        {/* Login Form Container */}
        <div className="bg-slate-900/90 border border-slate-800 p-7 rounded-3xl shadow-2xl backdrop-blur-md">
          
          <div className="mb-5 border-b border-slate-800 pb-3">
            <h3 className="text-base font-bold text-white tracking-wide">LOGIN SI-BANSOS</h3>
            <p className="text-xs text-slate-400">Masukkan kredensial akun petugas Anda</p>
          </div>

          {errorMessage && (
            <div className="mb-5 p-3.5 bg-rose-950/80 border border-rose-800 text-rose-200 rounded-2xl text-xs flex items-start space-x-2.5">
              <ShieldCheck className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <p className="font-medium leading-relaxed">{errorMessage}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Username Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Username Akun
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <UserIcon className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700/80 rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                  placeholder="Masukkan username Anda"
                  autoComplete="username"
                  id="input-login-username"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700/80 rounded-xl pl-10 pr-11 py-3 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                  placeholder="Masukkan password Anda"
                  autoComplete="current-password"
                  id="input-login-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white"
                  title={showPassword ? 'Sembunyikan Password' : 'Tampilkan Password'}
                  id="btn-toggle-password"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Login Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-emerald-950/50 transition-colors flex items-center justify-center space-x-2 disabled:opacity-60"
              id="btn-login-submit"
            >
              <span>{isLoading ? 'Memproses Login...' : 'Masuk ke Sistem'}</span>
              {!isLoading && <ArrowRight className="w-4 h-4" />}
            </button>

          </form>



        </div>

        {/* Footer info */}
        <p className="text-[11px] text-slate-500 text-center mt-6">
          Copyright &copy; 2026–2027 Nazarullah, S.Kom I SI-BANSOS Kabupaten Bireuen
        </p>

      </div>
    </div>
  );
};
