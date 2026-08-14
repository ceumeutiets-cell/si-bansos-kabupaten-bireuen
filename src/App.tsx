import React, { useState, useEffect } from 'react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { 
  User, 
  PenerimaBansos, 
  Kecamatan, 
  Desa, 
  LogAktivitas, 
  PengaturanSistem,
  FilterState,
  StatusVerifikasi 
} from './types';
import { api, setAuthToken, getAuthToken } from './lib/api';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { Footer } from './components/Footer';
import { Toast } from './components/Toast';
import { ConfirmModal } from './components/ConfirmModal';
import { PenerimaFormModal } from './components/PenerimaFormModal';
import { PenerimaDetailModal } from './components/PenerimaDetailModal';
import { ImportExcelModal } from './components/ImportExcelModal';
import { MapModal } from './components/MapModal';

import { LoginPage } from './pages/LoginPage';
import { ChangePasswordPage } from './pages/ChangePasswordPage';
import { DashboardPage } from './pages/DashboardPage';
import { DataPenerimaPage } from './pages/DataPenerimaPage';
import { DataPerkecamatanPage } from './pages/DataPerkecamatanPage';
import { DataPerdesaPage } from './pages/DataPerdesaPage';
import { DataDesilPage } from './pages/DataDesilPage';
import { PengaturanPage } from './pages/PengaturanPage';
import { VerifikasiDataPage } from './pages/VerifikasiDataPage';

import { INITIAL_PENGATURAN, INITIAL_KECAMATAN, INITIAL_DESA } from './data/bireuenData';
import { 
  Building2, 
  Users, 
  History, 
  Settings, 
  Download, 
  Upload, 
  Database, 
  Key, 
  Plus, 
  CheckCircle2, 
  AlertTriangle,
  RefreshCw,
  ShieldCheck,
  UserCheck,
  Trash2,
  Lock,
  HardDrive
} from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string>(getAuthToken());
  const [loading, setLoading] = useState<boolean>(true);
  const [activeMenu, setActiveMenu] = useState<string>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);

  // System State Data
  const [penerimaList, setPenerimaList] = useState<PenerimaBansos[]>([]);
  const [kecamatanList, setKecamatanList] = useState<Kecamatan[]>(INITIAL_KECAMATAN);
  const [desaList, setDesaList] = useState<Desa[]>(INITIAL_DESA);
  const [logs, setLogs] = useState<LogAktivitas[]>([]);
  const [settings, setSettings] = useState<PengaturanSistem>(INITIAL_PENGATURAN);
  const [usersList, setUsersList] = useState<User[]>([]);

  // Modals & UI States
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [formModalOpen, setFormModalOpen] = useState<boolean>(false);
  const [selectedPenerimaForEdit, setSelectedPenerimaForEdit] = useState<PenerimaBansos | null>(null);
  
  const [detailModalOpen, setDetailModalOpen] = useState<boolean>(false);
  const [selectedPenerimaForDetail, setSelectedPenerimaForDetail] = useState<PenerimaBansos | null>(null);

  const [importModalOpen, setImportModalOpen] = useState<boolean>(false);
  const [mapModalOpen, setMapModalOpen] = useState<boolean>(false);
  const [mapCoords, setMapCoords] = useState<{ lat: number; lng: number; title: string }>({ lat: 5.2052, lng: 96.7011, title: 'Bireuen' });

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  // User Admin Form Modal State
  const [newUserModalOpen, setNewUserModalOpen] = useState(false);
  const [newUserData, setNewUserData] = useState({
    name: '',
    username: '',
    password: '',
    role: 'petugas_desa' as User['role'],
    kecamatan_id: '',
    desa_id: ''
  });

  // Settings Edit State
  const [settingsForm, setSettingsForm] = useState<PengaturanSistem>(INITIAL_PENGATURAN);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
  };

  // Auth Initialization
  useEffect(() => {
    async function checkAuth() {
      setLoading(true);
      const existingToken = getAuthToken();
      if (existingToken) {
        try {
          const res = await api.getMe();
          setUser(res.user);
          await loadInitialData();
        } catch (err) {
          console.error('Session expired or invalid token:', err);
          setAuthToken('');
          setUser(null);
        }
      } else {
        // Default login placeholder fallback if needed
        setUser(null);
      }
      setLoading(false);
    }
    checkAuth();
  }, [token]);

  // Load backend data
  const loadInitialData = async () => {
    try {
      const [penerimaRes, kecRes, desaRes, settingsRes, logsRes, usersRes] = await Promise.allSettled([
        api.getPenerimaList(),
        api.getKecamatan(),
        api.getDesa(),
        api.getSettings(),
        api.getLogs(),
        api.getUsers()
      ]);

      if (penerimaRes.status === 'fulfilled') setPenerimaList(penerimaRes.value.penerima || []);
      if (kecRes.status === 'fulfilled') setKecamatanList(kecRes.value.kecamatan || INITIAL_KECAMATAN);
      if (desaRes.status === 'fulfilled') setDesaList(desaRes.value.desa || INITIAL_DESA);
      if (settingsRes.status === 'fulfilled') {
        setSettings(settingsRes.value.settings || INITIAL_PENGATURAN);
        setSettingsForm(settingsRes.value.settings || INITIAL_PENGATURAN);
      }
      if (logsRes.status === 'fulfilled') setLogs(logsRes.value.logs || []);
      if (usersRes.status === 'fulfilled') setUsersList(usersRes.value.users || []);
    } catch (err) {
      console.error('Error loading backend data:', err);
    }
  };

  const handleLoginSuccess = async (u: User, tokenStr: string) => {
    setAuthToken(tokenStr);
    setTokenState(tokenStr);
    setUser(u);
    showToast(`Selamat datang kembali, ${u.name}!`, 'success');
    await loadInitialData();
  };

  const handleLogout = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Konfirmasi Keluar',
      message: 'Apakah Anda yakin ingin keluar dari Sistem Informasi Bantuan Sosial Kabupaten Bireuen?',
      onConfirm: () => {
        setAuthToken('');
        setTokenState('');
        setUser(null);
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        showToast('Anda telah keluar dari sistem', 'info');
      }
    });
  };

  // Penerima CRUD Handlers
  const handleSavePenerima = async (data: Partial<PenerimaBansos>) => {
    try {
      if (selectedPenerimaForEdit) {
        const res = await api.updatePenerima(selectedPenerimaForEdit.id, data);
        showToast('Data penerima bantuan sosial berhasil diperbarui!', 'success');
        setPenerimaList(prev => prev.map(p => p.id === selectedPenerimaForEdit.id ? res.penerima : p));
      } else {
        const res = await api.createPenerima(data);
        showToast('Penerima bantuan sosial baru berhasil ditambahkan!', 'success');
        setPenerimaList(prev => [res.penerima, ...prev]);
      }
      setFormModalOpen(false);
      setSelectedPenerimaForEdit(null);
      loadInitialData();
    } catch (err: any) {
      showToast(err.message || 'Gagal menyimpan data penerima', 'error');
    }
  };

  const handleDeletePenerima = (penerima: PenerimaBansos) => {
    setConfirmModal({
      isOpen: true,
      title: 'Hapus Penerima Bansos',
      message: `Apakah Anda yakin ingin menghapus data penerima NIK ${penerima.nik} (${penerima.nama})? Data yang dihapus tidak dapat dikembalikan.`,
      onConfirm: async () => {
        try {
          await api.deletePenerima(penerima.id);
          setPenerimaList(prev => prev.filter(p => p.id !== penerima.id));
          showToast('Data penerima bansos berhasil dihapus', 'success');
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        } catch (err: any) {
          showToast(err.message || 'Gagal menghapus data', 'error');
        }
      }
    });
  };

  // Single Verification Handler
  const handleVerifikasiSingle = async (id: string, status: StatusVerifikasi, catatan?: string) => {
    try {
      const res = await api.verifikasiSingle(id, status, catatan);
      showToast(res.message || `Status verifikasi berhasil diubah menjadi '${status}'`, 'success');
      loadInitialData();
    } catch (err: any) {
      showToast(err.message || 'Gagal memverifikasi usulan data', 'error');
    }
  };

  // Bulk Verification Handler
  const handleVerifikasiMasal = async (ids: string[], status: StatusVerifikasi, catatan?: string) => {
    try {
      const res = await api.verifikasiMasal(ids, status, catatan);
      showToast(res.message || `${ids.length} data usulan berhasil diubah statusnya menjadi '${status}'`, 'success');
      loadInitialData();
    } catch (err: any) {
      showToast(err.message || 'Gagal memverifikasi masal data usulan', 'error');
    }
  };

  const handleImportSubmit = async (items: any[]) => {
    try {
      const res = await api.importExcel(items);
      showToast(`Import Selesai! ${res.validCount} berhasil, ${res.failedCount} gagal.`, res.failedCount > 0 ? 'info' : 'success');
      setImportModalOpen(false);
      loadInitialData();
    } catch (err: any) {
      showToast(err.message || 'Gagal import data Excel', 'error');
    }
  };

  // Admin Create User Handler
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserData.name || !newUserData.username || !newUserData.password) {
      showToast('Nama, Username, dan Password wajib diisi!', 'error');
      return;
    }
    try {
      await api.createUser(newUserData);
      showToast('User petugas baru berhasil dibuat!', 'success');
      setNewUserModalOpen(false);
      setNewUserData({
        name: '',
        username: '',
        password: '',
        role: 'petugas_desa',
        kecamatan_id: '',
        desa_id: ''
      });
      loadInitialData();
    } catch (err: any) {
      showToast(err.message || 'Gagal membuat user baru', 'error');
    }
  };

  // Toggle User Status
  const handleToggleUserStatus = async (userId: string) => {
    try {
      await api.toggleUserStatus(userId);
      showToast('Status user berhasil diperbarui!', 'success');
      loadInitialData();
    } catch (err: any) {
      showToast(err.message || 'Gagal mengubah status user', 'error');
    }
  };

  // Generate / Reset Collective Operator Accounts
  const handleGenerateCollectiveOperators = async () => {
    try {
      const res = await api.generateCollectiveOperators();
      showToast(res.message, 'success');
      setUsersList(res.users);
    } catch (err: any) {
      showToast(err.message || 'Gagal generate akun kolektif operator', 'error');
    }
  };

  // Save Settings Handler
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.updateSettings(settingsForm);
      setSettings(res.settings);
      showToast('Pengaturan instansi berhasil disimpan!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Gagal menyimpan pengaturan', 'error');
    }
  };

  // Render Logic
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-white">
        <div className="w-16 h-16 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mb-4" />
        <h2 className="text-lg font-bold tracking-wide">SI-BANSOS KABUPATEN BIREUEN</h2>
        <p className="text-xs text-slate-400 mt-1">Memuat Sistem Informasi Bantuan Sosial...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <LoginPage 
        settings={settings} 
        onLoginSubmit={async (u, p) => {
          const res = await api.login(u, p);
          await handleLoginSuccess(res.user, res.token);
        }} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500 selection:text-white flex flex-col">
      
      {/* HEADER */}
      <Header 
        user={user} 
        settings={settings} 
        onLogout={handleLogout} 
        onChangePasswordClick={() => setActiveMenu('ubah-password')} 
        toggleSidebar={() => setSidebarOpen(!sidebarOpen)} 
      />

      <div className="flex flex-1 relative">
        
        {/* SIDEBAR */}
        <Sidebar 
          user={user} 
          activeMenu={activeMenu} 
          onSelectMenu={(menuKey) => {
            if (menuKey === 'import-excel') {
              setImportModalOpen(true);
            } else {
              setActiveMenu(menuKey);
            }
          }} 
          onLogout={handleLogout} 
          isOpen={sidebarOpen} 
          onCloseMobile={() => setSidebarOpen(false)} 
        />

        {/* MAIN CONTENT CANVAS */}
        <main className="flex-1 lg:ml-72 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full transition-all duration-300">
          
          {/* Menu Route 1: DASHBOARD */}
          {activeMenu === 'dashboard' && (
            <DashboardPage 
              user={user} 
              penerimaList={penerimaList} 
              kecamatanList={kecamatanList} 
              desaList={desaList} 
              logs={logs} 
              settings={settings} 
              onNavigateMenu={(menu) => setActiveMenu(menu)} 
            />
          )}

          {/* Menu Route 2: DATA PENERIMA BANSOS */}
          {(activeMenu === 'data-penerima' || activeMenu === 'data-perkabupaten' || activeMenu === 'jenis-bantuan' || activeMenu === 'laporan-kabupaten') && (
            <DataPenerimaPage 
              user={user} 
              settings={settings} 
              penerimaList={penerimaList} 
              kecamatanList={kecamatanList} 
              desaList={desaList} 
              onAddClick={() => {
                setSelectedPenerimaForEdit(null);
                setFormModalOpen(true);
              }} 
              onEditClick={(penerima) => {
                setSelectedPenerimaForEdit(penerima);
                setFormModalOpen(true);
              }} 
              onDetailClick={(penerima) => {
                setSelectedPenerimaForDetail(penerima);
                setDetailModalOpen(true);
              }} 
              onDeleteClick={handleDeletePenerima} 
              onImportClick={() => setImportModalOpen(true)} 
              title={
                activeMenu === 'data-perkabupaten' ? 'Data Penerima Perkabupaten Bireuen' :
                activeMenu === 'jenis-bantuan' ? 'Penyaluran Bansos Berdasarkan Jenis Bantuan' :
                activeMenu === 'laporan-kabupaten' ? 'Laporan Bantuan Sosial Kabupaten Bireuen' :
                'Data Penerima Bantuan Sosial (SI-BANSOS)'
              }
            />
          )}

          {/* Menu Route: VERIFIKASI DATA USULAN DESA OLEH ADMINISTRATOR */}
          {activeMenu === 'verifikasi-usulan' && (
            <VerifikasiDataPage
              penerimaList={penerimaList}
              kecamatanList={kecamatanList}
              desaList={desaList}
              currentUser={user}
              onVerifikasiSingle={handleVerifikasiSingle}
              onVerifikasiMasal={handleVerifikasiMasal}
              onEditItem={(penerima) => {
                setSelectedPenerimaForEdit(penerima);
                setFormModalOpen(true);
              }}
              showToast={showToast}
              onRefreshData={loadInitialData}
            />
          )}

          {/* Menu Route 3: DATA PERKECAMATAN */}
          {(activeMenu === 'data-perkecamatan' || activeMenu === 'wilayah-kecamatan' || activeMenu === 'laporan-kecamatan') && (
            <DataPerkecamatanPage 
              settings={settings}
              kecamatanList={kecamatanList} 
              desaList={desaList} 
              penerimaList={penerimaList} 
              onSelectBeneficiaryDetail={(penerima) => {
                setSelectedPenerimaForDetail(penerima);
                setDetailModalOpen(true);
              }} 
            />
          )}

          {/* Menu Route 4: DATA PERDESA */}
          {(activeMenu === 'data-perdesa' || activeMenu === 'wilayah-desa' || activeMenu === 'laporan-desa') && (
            <DataPerdesaPage 
              settings={settings}
              kecamatanList={kecamatanList} 
              desaList={desaList} 
              penerimaList={penerimaList} 
              user={user} 
              onSelectBeneficiaryDetail={(penerima) => {
                setSelectedPenerimaForDetail(penerima);
                setDetailModalOpen(true);
              }} 
            />
          )}

          {/* Menu Route 5: DATA DESIL */}
          {(activeMenu === 'data-desil' || activeMenu === 'laporan-desil') && (
            <DataDesilPage 
              settings={settings}
              penerimaList={penerimaList} 
              onSelectBeneficiaryDetail={(penerima) => {
                setSelectedPenerimaForDetail(penerima);
                setDetailModalOpen(true);
              }} 
            />
          )}

          {/* Menu Route 6: DATA DISABILITAS */}
          {(activeMenu === 'data-disabilitas' || activeMenu === 'laporan-disabilitas') && (
            <DataPenerimaPage 
              user={user} 
              settings={settings} 
              penerimaList={penerimaList.filter(p => p.jenis_disabilitas !== 'Tidak ada disabilitas')} 
              kecamatanList={kecamatanList} 
              desaList={desaList} 
              onAddClick={() => {
                setSelectedPenerimaForEdit(null);
                setFormModalOpen(true);
              }} 
              onEditClick={(penerima) => {
                setSelectedPenerimaForEdit(penerima);
                setFormModalOpen(true);
              }} 
              onDetailClick={(penerima) => {
                setSelectedPenerimaForDetail(penerima);
                setDetailModalOpen(true);
              }} 
              onDeleteClick={handleDeletePenerima} 
              onImportClick={() => setImportModalOpen(true)} 
              title="Data Penerima Bansos Penyandang Disabilitas" 
              subtitle="Monitoring bantuan khusus warga disabilitas Kabupaten Bireuen" 
            />
          )}

          {/* Menu Route 7: UBAH PASSWORD */}
          {activeMenu === 'ubah-password' && (
            <ChangePasswordPage 
              onSuccess={() => {
                showToast('Password Anda berhasil diubah!', 'success');
                setActiveMenu('dashboard');
              }} 
            />
          )}

          {/* Menu Route 8: MANAJEMEN USER (ADMIN ONLY) */}
          {activeMenu === 'manajemen-user' && user.role === 'admin' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-md">
                <div>
                  <h1 className="text-xl font-bold text-white flex items-center gap-2">
                    <Users className="w-6 h-6 text-emerald-400" />
                    Manajemen Pengguna & Akun Kolektif Operator Desa
                  </h1>
                  <p className="text-xs text-slate-400 mt-1">
                    Kelola akun Dinas Sosial Kabupaten dan Akun Kolektif Operator Desa seluruh 17 Kecamatan
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={handleGenerateCollectiveOperators}
                    className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-lg transition-all flex items-center gap-2"
                    title="Generate atau Reset Akun Operator Kolektif 17 Kecamatan"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Generate / Reset Akun Kolektif
                  </button>
                  <button
                    onClick={() => {
                      const collectiveUsers = usersList.filter(u => u.username.startsWith('operator_'));
                      const textData = collectiveUsers.map(u => `Nama: ${u.name} | Username: ${u.username} | Password: operator1234 | Wilayah: ${u.kecamatan_nama || 'Seluruh Bireuen'}`).join('\n');
                      navigator.clipboard.writeText(textData);
                      showToast('Daftar login akun kolektif berhasil disalin ke clipboard!', 'success');
                    }}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold shadow-md transition-all flex items-center gap-2"
                  >
                    <Download className="w-4 h-4 text-emerald-400" />
                    Salin Rekap Login
                  </button>
                  <button
                    onClick={() => setNewUserModalOpen(true)}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-lg transition-all flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Tambah Petugas Baru
                  </button>
                </div>
              </div>

              {/* Info Box Akun Kolektif Operator Desa */}
              <div className="bg-emerald-950/40 border border-emerald-800/60 p-5 rounded-3xl shadow-xl space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-emerald-300 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    Status Akun Login Kolektif Operator Desa (17 Kecamatan)
                  </h3>
                  <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-[10px] font-bold">
                    Password Default: operator1234
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Seluruh 17 Kecamatan di Kabupaten Bireuen telah diprioritaskan dengan akun login kolektif khusus Operator Desa (<code className="text-emerald-400 font-mono">operator_[namakecamatan]</code>). Petugas gampong di tiap kecamatan dapat login menggunakan username masing-masing kecamatan dengan password <strong className="text-white">operator1234</strong>.
                </p>
              </div>

              {/* Users Table Card Bento */}
              <div className="bg-slate-900/80 rounded-3xl border border-slate-800/80 p-5 shadow-xl overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-800 text-slate-200 uppercase font-semibold">
                    <tr>
                      <th className="py-3 px-4 rounded-l-xl">Nama Lengkap / Instansi</th>
                      <th className="py-3 px-4">Username Login</th>
                      <th className="py-3 px-4">Password Default</th>
                      <th className="py-3 px-4">Peran (Role)</th>
                      <th className="py-3 px-4">Wilayah Tugas</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 rounded-r-xl text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {usersList.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-800/50 transition-colors">
                        <td className="py-3 px-4 font-semibold text-white">{u.name}</td>
                        <td className="py-3 px-4 font-mono text-emerald-400 font-bold">{u.username}</td>
                        <td className="py-3 px-4 font-mono text-amber-300">
                          {u.username.startsWith('operator_') ? 'operator1234' : u.username === 'admin' ? 'admin1234' : '******'}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border ${
                            u.role === 'admin'
                              ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                              : u.role === 'petugas_kabupaten'
                              ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                              : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          }`}>
                            {u.role === 'admin' ? 'Administrator' : u.role === 'petugas_kabupaten' ? 'Petugas Kabupaten' : 'Petugas Desa'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-400">
                          {u.desa_nama ? `${u.desa_nama} (${u.kecamatan_nama})` : u.kecamatan_nama ? `Kec. ${u.kecamatan_nama}` : 'Semua Wilayah'}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            u.status === 'Aktif' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                          }`}>
                            {u.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleToggleUserStatus(u.id)}
                            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-xs text-amber-300 rounded-lg border border-slate-700"
                          >
                            Toggle Status
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Menu Route 9: LOG AKTIVITAS (ADMIN ONLY) */}
          {activeMenu === 'log-aktivitas' && user.role === 'admin' && (
            <div className="space-y-6">
              <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-md">
                <h1 className="text-xl font-bold text-white flex items-center gap-2">
                  <History className="w-6 h-6 text-amber-400" />
                  Log Audit Aktivitas Sistem
                </h1>
                <p className="text-xs text-slate-400 mt-1">
                  Catatan riwayat transaksi dan aktivitas seluruh petugas operasional
                </p>
              </div>

              <div className="bg-slate-900/80 rounded-3xl border border-slate-800/80 p-5 shadow-xl overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-800 text-slate-200 uppercase font-semibold">
                    <tr>
                      <th className="py-3 px-4 rounded-l-xl">Waktu</th>
                      <th className="py-3 px-4">Petugas</th>
                      <th className="py-3 px-4">Aktivitas</th>
                      <th className="py-3 px-4">Modul</th>
                      <th className="py-3 px-4">IP Address</th>
                      <th className="py-3 px-4 rounded-r-xl">Keterangan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {logs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-800/50 transition-colors">
                        <td className="py-3 px-4 font-mono text-slate-400">{new Date(log.waktu).toLocaleString('id-ID')}</td>
                        <td className="py-3 px-4 font-semibold text-white">{log.user_name}</td>
                        <td className="py-3 px-4 text-emerald-400 font-medium">{log.aktivitas}</td>
                        <td className="py-3 px-4 text-slate-300">{log.modul}</td>
                        <td className="py-3 px-4 font-mono text-slate-400">{log.ip_address}</td>
                        <td className="py-3 px-4 text-slate-300">{log.keterangan}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Menu Route 10: PENGATURAN INSTANSI & LOGO SURAT (ADMIN ONLY) */}
          {activeMenu === 'pengaturan' && user.role === 'admin' && (
            <PengaturanPage 
              settingsForm={settingsForm} 
              setSettingsForm={setSettingsForm} 
              onSaveSettings={handleSaveSettings} 
              showToast={showToast} 
            />
          )}

          {/* Menu Route 11: BACKUP & RESTORE DB */}
          {activeMenu === 'backup-restore' && user.role === 'admin' && (
            <div className="space-y-6">
              <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-md">
                <h1 className="text-xl font-bold text-white flex items-center gap-2">
                  <HardDrive className="w-6 h-6 text-indigo-400" />
                  Backup & Restore Database Systems
                </h1>
                <p className="text-xs text-slate-400 mt-1">
                  Amankan cadangan data kependudukan dan bantuan sosial Kabupaten Bireuen
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-900/80 p-6 rounded-3xl border border-slate-800/80 shadow-xl space-y-4">
                  <div className="flex items-center space-x-3 text-emerald-400 font-bold">
                    <Download className="w-5 h-5" />
                    <span>Backup Master Data (JSON)</span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Unduh file arsip lengkap seluruh penerima, data wilayah kecamatan/desa, dan log aktivitas.
                  </p>
                  <button
                    onClick={() => {
                      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ penerimaList, kecamatanList, desaList, settings }, null, 2));
                      const downloadAnchor = document.createElement('a');
                      downloadAnchor.setAttribute("href", dataStr);
                      downloadAnchor.setAttribute("download", `SI-BANSOS-BIREUEN-BACKUP-${new Date().toISOString().slice(0,10)}.json`);
                      document.body.appendChild(downloadAnchor);
                      downloadAnchor.click();
                      downloadAnchor.remove();
                      showToast('Backup database JSON berhasil diunduh!', 'success');
                    }}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs transition-all flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Unduh File Backup JSON
                  </button>
                </div>

                <div className="bg-slate-900/80 p-6 rounded-3xl border border-slate-800/80 shadow-xl space-y-4">
                  <div className="flex items-center space-x-3 text-sky-400 font-bold">
                    <Upload className="w-5 h-5" />
                    <span>Restore Database</span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Pulihkan database dari file cadangan JSON yang tersimpan sebelumnya.
                  </p>
                  <input
                    type="file"
                    accept=".json"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = async (event) => {
                        try {
                          const json = JSON.parse(event.target?.result as string);
                          await api.restoreDB(json);
                          showToast('Database berhasil dipulihkan!', 'success');
                          loadInitialData();
                        } catch (err: any) {
                          showToast('Format file backup JSON tidak valid', 'error');
                        }
                      };
                      reader.readAsText(file);
                    }}
                    className="w-full text-xs text-slate-300 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-sky-300 hover:file:bg-slate-700"
                  />
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* FOOTER */}
      <Footer settings={settings} />

      {/* MODALS & TOAST */}
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}

      {confirmModal.isOpen && (
        <ConfirmModal 
          isOpen={confirmModal.isOpen} 
          title={confirmModal.title} 
          message={confirmModal.message} 
          onConfirm={confirmModal.onConfirm} 
          onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))} 
        />
      )}

      {formModalOpen && (
        <PenerimaFormModal 
          isOpen={formModalOpen} 
          initialData={selectedPenerimaForEdit} 
          kecamatanList={kecamatanList} 
          desaList={desaList} 
          currentUser={user}
          onSave={handleSavePenerima} 
          onClose={() => {
            setFormModalOpen(false);
            setSelectedPenerimaForEdit(null);
          }} 
        />
      )}

      {detailModalOpen && selectedPenerimaForDetail && (
        <PenerimaDetailModal 
          isOpen={detailModalOpen} 
          penerima={selectedPenerimaForDetail} 
          settings={settings} 
          onClose={() => {
            setDetailModalOpen(false);
            setSelectedPenerimaForDetail(null);
          }} 
        />
      )}

      {importModalOpen && (
        <ImportExcelModal 
          isOpen={importModalOpen} 
          kecamatanList={kecamatanList} 
          desaList={desaList} 
          onSubmit={handleImportSubmit} 
          onClose={() => setImportModalOpen(false)} 
        />
      )}

      {/* Create User Modal (Admin) */}
      {newUserModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl text-xs text-white space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-400" />
              Tambah Petugas / Operator Baru
            </h3>
            <form onSubmit={handleCreateUser} className="space-y-3">
              <div>
                <label className="block text-slate-300 mb-1 font-medium">Nama Lengkap</label>
                <input
                  type="text"
                  value={newUserData.name}
                  onChange={e => setNewUserData({ ...newUserData, name: e.target.value })}
                  placeholder="Contoh: Muhammad Ilham"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Username</label>
                <input
                  type="text"
                  value={newUserData.username}
                  onChange={e => setNewUserData({ ...newUserData, username: e.target.value })}
                  placeholder="Contoh: ilham_gampong"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Password</label>
                <input
                  type="password"
                  value={newUserData.password}
                  onChange={e => setNewUserData({ ...newUserData, password: e.target.value })}
                  placeholder="Minimal 6 Karakter"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Role / Akses</label>
                <select
                  value={newUserData.role}
                  onChange={e => setNewUserData({ ...newUserData, role: e.target.value as User['role'] })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="petugas_desa">Operator Desa / Gampong</option>
                  <option value="petugas_kabupaten">Petugas Dinas Kabupaten</option>
                  <option value="admin">Administrator Sistem</option>
                </select>
              </div>

              {newUserData.role === 'petugas_desa' && (
                <>
                  <div>
                    <label className="block text-slate-300 mb-1 font-medium">Kecamatan</label>
                    <select
                      value={newUserData.kecamatan_id}
                      onChange={e => setNewUserData({ ...newUserData, kecamatan_id: e.target.value, desa_id: '' })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="">-- Pilih Kecamatan --</option>
                      {kecamatanList.map(k => (
                        <option key={k.id} value={k.id}>{k.nama}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 mb-1 font-medium">Desa / Gampong</label>
                    <select
                      value={newUserData.desa_id}
                      onChange={e => setNewUserData({ ...newUserData, desa_id: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="">-- Pilih Gampong --</option>
                      {desaList.filter(d => d.kecamatan_id === newUserData.kecamatan_id).map(d => (
                        <option key={d.id} value={d.id}>{d.nama}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              <div className="flex items-center justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setNewUserModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-lg"
                >
                  Simpan User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <SpeedInsights />
    </div>
  );
}
