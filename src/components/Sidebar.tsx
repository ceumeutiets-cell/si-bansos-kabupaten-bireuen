import React, { useState } from 'react';
import { User } from '../types';
import { triggerPrint } from '../lib/printUtils';
import { 
  LayoutDashboard, 
  Database, 
  MapPin, 
  Users, 
  FileText, 
  DownloadCloud, 
  UserCheck, 
  Settings, 
  LogOut, 
  ChevronDown, 
  ChevronRight,
  ShieldAlert,
  ShieldCheck,
  Building2,
  ListFilter,
  FileSpreadsheet,
  Printer,
  History,
  Lock,
  HardDrive
} from 'lucide-react';

interface SidebarProps {
  user: User;
  activeMenu: string;
  onSelectMenu: (menuKey: string) => void;
  onLogout: () => void;
  isOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  user,
  activeMenu,
  onSelectMenu,
  onLogout,
  isOpen,
  onCloseMobile
}) => {
  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({
    bansos: true,
    wilayah: false,
    sosial: false,
    laporan: false,
    importExport: false,
    pengguna: false,
    sistem: false
  });

  const toggleSubmenu = (key: string) => {
    setOpenSubmenus(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleMenuClick = (key: string) => {
    onSelectMenu(key);
    onCloseMobile();
  };

  const isAdmin = user.role === 'admin';
  const isKabupaten = user.role === 'petugas_kabupaten';
  const isDesa = user.role === 'petugas_desa';

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed top-20 bottom-0 left-0 w-72 bg-slate-900 text-slate-200 border-r border-slate-800 z-40 transition-transform duration-300 ease-in-out overflow-y-auto print:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="p-4 space-y-6">

          {/* User Profile Badge Box */}
          <div className="p-3.5 bg-slate-800/80 rounded-xl border border-slate-700/60 shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-lg shrink-0">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-semibold text-white truncate">{user.name}</p>
                <p className="text-[11px] text-emerald-400 font-medium capitalize">
                  {user.role === 'admin' ? 'Administrator' : user.role === 'petugas_kabupaten' ? 'Petugas Kabupaten' : 'Petugas Desa'}
                </p>
                {isDesa && user.desa_nama && (
                  <p className="text-[10px] text-slate-300 truncate">
                    {user.desa_nama} ({user.kecamatan_nama})
                  </p>
                )}
              </div>
            </div>
          </div>

          <nav className="space-y-1.5 text-sm">

            {/* DASHBOARD */}
            <button
              onClick={() => handleMenuClick('dashboard')}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-lg transition-all font-medium ${
                activeMenu === 'dashboard'
                  ? 'bg-emerald-600 text-white shadow-md font-semibold'
                  : 'hover:bg-slate-800/80 text-slate-300 hover:text-white'
              }`}
              id="menu-dashboard"
            >
              <LayoutDashboard className="w-5 h-5" />
              <span>Dashboard</span>
            </button>

            {/* VERIFIKASI USULAN DESA */}
            <button
              onClick={() => handleMenuClick('verifikasi-usulan')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg transition-all font-medium ${
                activeMenu === 'verifikasi-usulan'
                  ? 'bg-emerald-600 text-white shadow-md font-semibold'
                  : 'hover:bg-slate-800/80 text-amber-300 hover:text-amber-200'
              }`}
              id="menu-verifikasi-usulan"
            >
              <div className="flex items-center space-x-3">
                <ShieldCheck className="w-5 h-5 text-amber-400" />
                <span>Verifikasi Usulan Desa</span>
              </div>
            </button>

            {/* DATA BANSOS SUBMENU */}
            <div>
              <button
                onClick={() => toggleSubmenu('bansos')}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg hover:bg-slate-800/80 text-slate-300 hover:text-white font-medium"
              >
                <div className="flex items-center space-x-3">
                  <Database className="w-5 h-5 text-emerald-400" />
                  <span>Data Bansos</span>
                </div>
                {openSubmenus.bansos ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>

              {openSubmenus.bansos && (
                <div className="ml-8 mt-1 space-y-1 border-l-2 border-slate-700/80 pl-3">
                  {!isDesa && (
                    <button
                      onClick={() => handleMenuClick('data-perkabupaten')}
                      className={`w-full text-left py-1.5 px-2.5 rounded-md text-xs transition-colors ${
                        activeMenu === 'data-perkabupaten' ? 'bg-emerald-500/20 text-emerald-300 font-semibold' : 'text-slate-400 hover:text-white'
                      }`}
                      id="menu-perkabupaten"
                    >
                      Data Perkabupaten
                    </button>
                  )}

                  {!isDesa && (
                    <button
                      onClick={() => handleMenuClick('data-perkecamatan')}
                      className={`w-full text-left py-1.5 px-2.5 rounded-md text-xs transition-colors ${
                        activeMenu === 'data-perkecamatan' ? 'bg-emerald-500/20 text-emerald-300 font-semibold' : 'text-slate-400 hover:text-white'
                      }`}
                      id="menu-perkecamatan"
                    >
                      Data Perkecamatan
                    </button>
                  )}

                  <button
                    onClick={() => handleMenuClick('data-perdesa')}
                    className={`w-full text-left py-1.5 px-2.5 rounded-md text-xs transition-colors ${
                      activeMenu === 'data-perdesa' ? 'bg-emerald-500/20 text-emerald-300 font-semibold' : 'text-slate-400 hover:text-white'
                    }`}
                    id="menu-perdesa"
                  >
                    Data Perdesa / Gampong
                  </button>

                  <button
                    onClick={() => handleMenuClick('data-penerima')}
                    className={`w-full text-left py-1.5 px-2.5 rounded-md text-xs transition-colors ${
                      activeMenu === 'data-penerima' ? 'bg-emerald-500/20 text-emerald-300 font-semibold' : 'text-slate-400 hover:text-white'
                    }`}
                    id="menu-penerima"
                  >
                    Data Penerima Bansos
                  </button>

                  <button
                    onClick={() => handleMenuClick('verifikasi-usulan')}
                    className={`w-full text-left py-1.5 px-2.5 rounded-md text-xs transition-colors ${
                      activeMenu === 'verifikasi-usulan' ? 'bg-amber-500/20 text-amber-300 font-semibold' : 'text-amber-400 hover:text-white font-medium'
                    }`}
                    id="menu-verifikasi-usulan-sub"
                  >
                    Verifikasi Usulan Desa
                  </button>
                </div>
              )}
            </div>

            {/* DATA WILAYAH SUBMENU (Admin & Petugas Kab) */}
            {!isDesa && (
              <div>
                <button
                  onClick={() => toggleSubmenu('wilayah')}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg hover:bg-slate-800/80 text-slate-300 hover:text-white font-medium"
                >
                  <div className="flex items-center space-x-3">
                    <Building2 className="w-5 h-5 text-blue-400" />
                    <span>Data Wilayah</span>
                  </div>
                  {openSubmenus.wilayah ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>

                {openSubmenus.wilayah && (
                  <div className="ml-8 mt-1 space-y-1 border-l-2 border-slate-700/80 pl-3">
                    <button
                      onClick={() => handleMenuClick('wilayah-kecamatan')}
                      className={`w-full text-left py-1.5 px-2.5 rounded-md text-xs transition-colors ${
                        activeMenu === 'wilayah-kecamatan' ? 'bg-blue-500/20 text-blue-300 font-semibold' : 'text-slate-400 hover:text-white'
                      }`}
                      id="menu-wilayah-kecamatan"
                    >
                      Kecamatan (17 Kecamatan)
                    </button>
                    <button
                      onClick={() => handleMenuClick('wilayah-desa')}
                      className={`w-full text-left py-1.5 px-2.5 rounded-md text-xs transition-colors ${
                        activeMenu === 'wilayah-desa' ? 'bg-blue-500/20 text-blue-300 font-semibold' : 'text-slate-400 hover:text-white'
                      }`}
                      id="menu-wilayah-desa"
                    >
                      Desa / Gampong
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* DATA SOSIAL SUBMENU */}
            <div>
              <button
                onClick={() => toggleSubmenu('sosial')}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg hover:bg-slate-800/80 text-slate-300 hover:text-white font-medium"
              >
                <div className="flex items-center space-x-3">
                  <ListFilter className="w-5 h-5 text-amber-400" />
                  <span>Data Sosial</span>
                </div>
                {openSubmenus.sosial ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>

              {openSubmenus.sosial && (
                <div className="ml-8 mt-1 space-y-1 border-l-2 border-slate-700/80 pl-3">
                  <button
                    onClick={() => handleMenuClick('data-desil')}
                    className={`w-full text-left py-1.5 px-2.5 rounded-md text-xs transition-colors ${
                      activeMenu === 'data-desil' ? 'bg-amber-500/20 text-amber-300 font-semibold' : 'text-slate-400 hover:text-white'
                    }`}
                    id="menu-data-desil"
                  >
                    Data Desil (Desil 1–10)
                  </button>
                  <button
                    onClick={() => handleMenuClick('data-disabilitas')}
                    className={`w-full text-left py-1.5 px-2.5 rounded-md text-xs transition-colors ${
                      activeMenu === 'data-disabilitas' ? 'bg-amber-500/20 text-amber-300 font-semibold' : 'text-slate-400 hover:text-white'
                    }`}
                    id="menu-data-disabilitas"
                  >
                    Data Disabilitas
                  </button>
                  <button
                    onClick={() => handleMenuClick('jenis-bantuan')}
                    className={`w-full text-left py-1.5 px-2.5 rounded-md text-xs transition-colors ${
                      activeMenu === 'jenis-bantuan' ? 'bg-amber-500/20 text-amber-300 font-semibold' : 'text-slate-400 hover:text-white'
                    }`}
                    id="menu-jenis-bantuan"
                  >
                    Jenis Bantuan Sosial
                  </button>
                </div>
              )}
            </div>

            {/* LAPORAN SUBMENU */}
            <div>
              <button
                onClick={() => toggleSubmenu('laporan')}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg hover:bg-slate-800/80 text-slate-300 hover:text-white font-medium"
              >
                <div className="flex items-center space-x-3">
                  <FileText className="w-5 h-5 text-purple-400" />
                  <span>Laporan</span>
                </div>
                {openSubmenus.laporan ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>

              {openSubmenus.laporan && (
                <div className="ml-8 mt-1 space-y-1 border-l-2 border-slate-700/80 pl-3">
                  {!isDesa && (
                    <button
                      onClick={() => handleMenuClick('laporan-kabupaten')}
                      className={`w-full text-left py-1.5 px-2.5 rounded-md text-xs transition-colors ${
                        activeMenu === 'laporan-kabupaten' ? 'bg-purple-500/20 text-purple-300 font-semibold' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Laporan Kabupaten
                    </button>
                  )}
                  {!isDesa && (
                    <button
                      onClick={() => handleMenuClick('laporan-kecamatan')}
                      className={`w-full text-left py-1.5 px-2.5 rounded-md text-xs transition-colors ${
                        activeMenu === 'laporan-kecamatan' ? 'bg-purple-500/20 text-purple-300 font-semibold' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Laporan Kecamatan
                    </button>
                  )}
                  <button
                    onClick={() => handleMenuClick('laporan-desa')}
                    className={`w-full text-left py-1.5 px-2.5 rounded-md text-xs transition-colors ${
                      activeMenu === 'laporan-desa' ? 'bg-purple-500/20 text-purple-300 font-semibold' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Laporan Desa / Gampong
                  </button>
                  <button
                    onClick={() => handleMenuClick('laporan-desil')}
                    className={`w-full text-left py-1.5 px-2.5 rounded-md text-xs transition-colors ${
                      activeMenu === 'laporan-desil' ? 'bg-purple-500/20 text-purple-300 font-semibold' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Laporan Desil
                  </button>
                  <button
                    onClick={() => handleMenuClick('laporan-disabilitas')}
                    className={`w-full text-left py-1.5 px-2.5 rounded-md text-xs transition-colors ${
                      activeMenu === 'laporan-disabilitas' ? 'bg-purple-500/20 text-purple-300 font-semibold' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Laporan Disabilitas
                  </button>
                </div>
              )}
            </div>

            {/* IMPORT / EXPORT SUBMENU */}
            <div>
              <button
                onClick={() => toggleSubmenu('importExport')}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg hover:bg-slate-800/80 text-slate-300 hover:text-white font-medium"
              >
                <div className="flex items-center space-x-3">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                  <span>Import / Export</span>
                </div>
                {openSubmenus.importExport ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>

              {openSubmenus.importExport && (
                <div className="ml-8 mt-1 space-y-1 border-l-2 border-slate-700/80 pl-3">
                  <button
                    onClick={() => handleMenuClick('import-excel')}
                    className={`w-full text-left py-1.5 px-2.5 rounded-md text-xs transition-colors ${
                      activeMenu === 'import-excel' ? 'bg-emerald-500/20 text-emerald-300 font-semibold' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Import Data Excel
                  </button>
                  <button
                    onClick={() => handleMenuClick('export-excel')}
                    className={`w-full text-left py-1.5 px-2.5 rounded-md text-xs transition-colors ${
                      activeMenu === 'export-excel' ? 'bg-emerald-500/20 text-emerald-300 font-semibold' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Export Data Excel
                  </button>
                  <button
                    onClick={() => handleMenuClick('export-pdf')}
                    className={`w-full text-left py-1.5 px-2.5 rounded-md text-xs transition-colors ${
                      activeMenu === 'export-pdf' ? 'bg-emerald-500/20 text-emerald-300 font-semibold' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Cetak Laporan PDF
                  </button>
                  <button
                    onClick={() => {
                      triggerPrint();
                      onCloseMobile();
                    }}
                    className="w-full text-left py-1.5 px-2.5 rounded-md text-xs transition-colors text-slate-400 hover:text-white flex items-center gap-1.5"
                  >
                    <Printer className="w-3.5 h-3.5 text-slate-400" />
                    Cetak Browser (Print)
                  </button>
                </div>
              )}
            </div>

            {/* PENGGUNA (Admin User Management, Ubah Password, Log) */}
            <div>
              <button
                onClick={() => toggleSubmenu('pengguna')}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg hover:bg-slate-800/80 text-slate-300 hover:text-white font-medium"
              >
                <div className="flex items-center space-x-3">
                  <Users className="w-5 h-5 text-sky-400" />
                  <span>Pengguna</span>
                </div>
                {openSubmenus.pengguna ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>

              {openSubmenus.pengguna && (
                <div className="ml-8 mt-1 space-y-1 border-l-2 border-slate-700/80 pl-3">
                  {isAdmin && (
                    <button
                      onClick={() => handleMenuClick('manajemen-user')}
                      className={`w-full text-left py-1.5 px-2.5 rounded-md text-xs transition-colors ${
                        activeMenu === 'manajemen-user' ? 'bg-sky-500/20 text-sky-300 font-semibold' : 'text-slate-400 hover:text-white'
                      }`}
                      id="menu-manajemen-user"
                    >
                      Manajemen User
                    </button>
                  )}
                  <button
                    onClick={() => handleMenuClick('ubah-password')}
                    className={`w-full text-left py-1.5 px-2.5 rounded-md text-xs transition-colors ${
                      activeMenu === 'ubah-password' ? 'bg-sky-500/20 text-sky-300 font-semibold' : 'text-slate-400 hover:text-white'
                    }`}
                    id="menu-ubah-password"
                  >
                    Ubah Password
                  </button>
                  {isAdmin && (
                    <button
                      onClick={() => handleMenuClick('log-aktivitas')}
                      className={`w-full text-left py-1.5 px-2.5 rounded-md text-xs transition-colors ${
                        activeMenu === 'log-aktivitas' ? 'bg-sky-500/20 text-sky-300 font-semibold' : 'text-slate-400 hover:text-white'
                      }`}
                      id="menu-log-aktivitas"
                    >
                      Log Aktivitas
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* SISTEM (Pengaturan, Backup, Restore) - Admin Only */}
            {isAdmin && (
              <div>
                <button
                  onClick={() => toggleSubmenu('sistem')}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg hover:bg-slate-800/80 text-slate-300 hover:text-white font-medium"
                >
                  <div className="flex items-center space-x-3">
                    <Settings className="w-5 h-5 text-amber-500" />
                    <span>Sistem</span>
                  </div>
                  {openSubmenus.sistem ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>

                {openSubmenus.sistem && (
                  <div className="ml-8 mt-1 space-y-1 border-l-2 border-slate-700/80 pl-3">
                    <button
                      onClick={() => handleMenuClick('pengaturan')}
                      className={`w-full text-left py-1.5 px-2.5 rounded-md text-xs transition-colors ${
                        activeMenu === 'pengaturan' ? 'bg-amber-500/20 text-amber-300 font-semibold' : 'text-slate-400 hover:text-white'
                      }`}
                      id="menu-pengaturan"
                    >
                      Pengaturan Instansi
                    </button>
                    <button
                      onClick={() => handleMenuClick('backup-restore')}
                      className={`w-full text-left py-1.5 px-2.5 rounded-md text-xs transition-colors ${
                        activeMenu === 'backup-restore' ? 'bg-amber-500/20 text-amber-300 font-semibold' : 'text-slate-400 hover:text-white'
                      }`}
                      id="menu-backup-restore"
                    >
                      Backup & Restore DB
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* LOGOUT */}
            <div className="pt-4 border-t border-slate-800">
              <button
                onClick={onLogout}
                className="w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 font-medium transition-colors"
                id="menu-logout"
              >
                <LogOut className="w-5 h-5" />
                <span>Logout</span>
              </button>
            </div>

          </nav>
        </div>
      </aside>
    </>
  );
};
