import React from 'react';
import { User, PengaturanSistem } from '../types';
import { LogOut, Key, ShieldCheck, MapPin, Menu, UserCheck } from 'lucide-react';

interface HeaderProps {
  user: User;
  settings: PengaturanSistem;
  onLogout: () => void;
  onChangePasswordClick: () => void;
  toggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  settings,
  onLogout,
  onChangePasswordClick,
  toggleSidebar
}) => {
  return (
    <header className="bg-slate-900 text-white shadow-md border-b border-slate-800 sticky top-0 z-30 print:hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Left branding & mobile menu toggle */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-md text-slate-300 hover:text-white hover:bg-slate-800 lg:hidden focus:outline-none"
              title="Buka Menu Sidebar"
              id="btn-sidebar-toggle"
            >
              <Menu className="w-6 h-6" />
            </button>

            <div className="flex items-center space-x-3">
              {settings.logo_kabupaten ? (
                <img
                  src={settings.logo_kabupaten}
                  alt="Logo Kabupaten Bireuen"
                  className="w-11 h-11 object-contain rounded-xl bg-white p-1 shadow-md hover:scale-105 transition-transform shrink-0"
                  referrerPolicy="no-referrer"
                />
              ) : null}

              <div>
                <p className="text-[10px] sm:text-xs font-semibold tracking-wider text-emerald-400 uppercase">
                  {settings.nama_instansi}
                </p>
                <h1 className="text-base sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
                  SI-BANSOS
                  <span className="hidden md:inline-block text-xs font-normal bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                    Kabupaten Bireuen
                  </span>
                </h1>
                <p className="text-[11px] sm:text-xs text-slate-300 hidden sm:block">
                  {settings.sub_instansi}
                </p>
              </div>

              {settings.logo_dinsos ? (
                <img
                  src={settings.logo_dinsos}
                  alt="Logo Dinas Sosial"
                  className="w-11 h-11 object-contain rounded-xl bg-white p-1 border border-emerald-500/30 hidden sm:block shadow-md hover:scale-105 transition-transform shrink-0 ml-1"
                  referrerPolicy="no-referrer"
                />
              ) : null}
            </div>
          </div>

          {/* Right User Status & Actions */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="hidden md:flex flex-col items-end text-right">
              <span className="text-sm font-semibold text-white flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-emerald-400" />
                {user.name}
              </span>
              <span className="text-xs text-slate-300 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                {user.role === 'admin'
                  ? 'Administrator'
                  : user.role === 'petugas_kabupaten'
                  ? 'Petugas Kabupaten'
                  : `Petugas Desa (${user.desa_nama || 'Gampong'})`}
              </span>
              {user.role === 'petugas_desa' && user.kecamatan_nama && (
                <span className="text-[11px] text-amber-300 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  Kec. {user.kecamatan_nama}
                </span>
              )}
            </div>

            <div className="flex items-center space-x-1 sm:space-x-2 border-l border-slate-700 pl-3">
              <button
                onClick={onChangePasswordClick}
                className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1 text-xs"
                title="Ubah Password"
                id="btn-header-change-password"
              >
                <Key className="w-4 h-4 text-amber-400" />
                <span className="hidden xl:inline">Ubah Password</span>
              </button>

              <button
                onClick={onLogout}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 shadow-sm"
                title="Keluar dari Sistem"
                id="btn-header-logout"
              >
                <LogOut className="w-4 h-4" />
                <span>Keluar</span>
              </button>
            </div>
          </div>

        </div>
      </div>
    </header>
  );
};
