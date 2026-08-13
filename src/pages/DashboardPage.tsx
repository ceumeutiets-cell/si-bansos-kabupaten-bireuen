import React from 'react';
import { 
  User, 
  PenerimaBansos, 
  Kecamatan, 
  Desa, 
  LogAktivitas,
  PengaturanSistem 
} from '../types';
import { 
  Users, 
  Building2, 
  Home, 
  Layers, 
  HeartHandshake, 
  AlertCircle, 
  History, 
  TrendingUp, 
  CheckCircle2,
  PieChart as PieIcon,
  BarChart3
} from 'lucide-react';

interface DashboardPageProps {
  user: User;
  penerimaList: PenerimaBansos[];
  kecamatanList: Kecamatan[];
  desaList: Desa[];
  logs: LogAktivitas[];
  settings: PengaturanSistem;
  onNavigateMenu: (menuKey: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  user,
  penerimaList,
  kecamatanList,
  desaList,
  logs,
  settings,
  onNavigateMenu
}) => {
  // Filter list based on user scope
  const isDesa = user.role === 'petugas_desa';
  const filteredList = isDesa
    ? penerimaList.filter(p => p.kecamatan_id === user.kecamatan_id && p.desa_id === user.desa_id)
    : penerimaList;

  const totalPenerima = filteredList.length;

  // Desil counts (1 to 10)
  const desilCounts: Record<string, number> = {};
  for (let i = 1; i <= 10; i++) {
    desilCounts[`Desil ${i}`] = filteredList.filter(p => p.desil === `Desil ${i}`).length;
  }

  // Disability totals
  const totalDisabilitas = filteredList.filter(p => p.jenis_disabilitas !== 'Tidak ada disabilitas').length;
  const totalTidakDisabilitas = filteredList.filter(p => p.jenis_disabilitas === 'Tidak ada disabilitas').length;

  // Disability breakdown by type
  const disabilitasTypeCounts: Record<string, number> = {};
  filteredList.forEach(p => {
    disabilitasTypeCounts[p.jenis_disabilitas] = (disabilitasTypeCounts[p.jenis_disabilitas] || 0) + 1;
  });

  // Kecamatan breakdown
  const kecCounts: Record<string, number> = {};
  filteredList.forEach(p => {
    const name = p.kecamatan_nama || 'Lainnya';
    kecCounts[name] = (kecCounts[name] || 0) + 1;
  });

  return (
    <div className="space-y-6 text-white">
      
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 p-6 rounded-3xl border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Building2 className="w-4 h-4" />
            <span>SI-BANSOS Dashboard Terpadu</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Selamat Datang, {user.name}
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            {isDesa
              ? `Monitoring Bantuan Sosial Gampong ${user.desa_nama || ''} Kecamatan ${user.kecamatan_nama || ''}`
              : `Sistem Informasi Bantuan Sosial Kabupaten Bireuen — Dinas Sosial Kabupaten Bireuen`}
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <button
            onClick={() => onNavigateMenu('verifikasi-usulan')}
            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-bold shadow-lg transition-colors flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Verifikasi Usulan ({penerimaList.filter(p => p.status_verifikasi === 'Menunggu Verifikasi').length})</span>
          </button>

          <button
            onClick={() => onNavigateMenu('data-penerima')}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-lg transition-colors flex items-center gap-1.5"
          >
            <Users className="w-4 h-4" />
            <span>Kelola Penerima</span>
          </button>
        </div>
      </div>

      {/* VERIFICATION PENDING NOTICE FOR ADMIN & OPERATOR */}
      {penerimaList.some(p => p.status_verifikasi === 'Menunggu Verifikasi') && (
        <div className="bg-gradient-to-r from-amber-950/60 to-slate-900 border border-amber-500/40 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30 shrink-0">
              <AlertCircle className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-amber-300">
                Ada {penerimaList.filter(p => p.status_verifikasi === 'Menunggu Verifikasi').length} Usulan Data Desa Menunggu Verifikasi Administrator
              </h3>
              <p className="text-[11px] text-slate-300 mt-0.5">
                Operator Gampong telah menyeleksi dan mengajukan calon penerima bansos baru. Mohon diperiksa dan disetujui.
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigateMenu('verifikasi-usulan')}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs shrink-0 transition-colors shadow-md"
          >
            Proses Verifikasi Sekarang
          </button>
        </div>
      )}

      {/* Primary Statistics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Total Penerima */}
        <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 shadow-md flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400">Total Penerima Bansos</p>
            <h3 className="text-2xl font-extrabold text-white mt-1">{totalPenerima}</h3>
            <p className="text-[11px] text-emerald-400 font-medium mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Data Terverifikasi</span>
            </p>
          </div>
          <div className="p-3 bg-emerald-600/20 text-emerald-400 rounded-2xl border border-emerald-500/30">
            <Users className="w-7 h-7" />
          </div>
        </div>

        {/* Card 2: Total Desil 1 - 3 (Sangat Miskin & Miskin) */}
        <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 shadow-md flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400">Penerima Desil 1 – 3</p>
            <h3 className="text-2xl font-extrabold text-amber-400 mt-1">
              {(desilCounts['Desil 1'] || 0) + (desilCounts['Desil 2'] || 0) + (desilCounts['Desil 3'] || 0)}
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">Prioritas Bantuan Sosial</p>
          </div>
          <div className="p-3 bg-amber-600/20 text-amber-400 rounded-2xl border border-amber-500/30">
            <Layers className="w-7 h-7" />
          </div>
        </div>

        {/* Card 3: Disabilitas */}
        <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 shadow-md flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400">Penyandang Disabilitas</p>
            <h3 className="text-2xl font-extrabold text-purple-400 mt-1">{totalDisabilitas}</h3>
            <p className="text-[11px] text-slate-400 mt-1">Non-Disabilitas: {totalTidakDisabilitas}</p>
          </div>
          <div className="p-3 bg-purple-600/20 text-purple-400 rounded-2xl border border-purple-500/30">
            <AlertCircle className="w-7 h-7" />
          </div>
        </div>

        {/* Card 4: Wilayah Scope */}
        <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 shadow-md flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400">Wilayah Cakupan</p>
            <h3 className="text-2xl font-extrabold text-sky-400 mt-1">
              {isDesa ? '1 Desa' : '17 Kecamatan'}
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">
              {isDesa ? `${user.desa_nama}` : `${desaList.length} Desa / Gampong`}
            </p>
          </div>
          <div className="p-3 bg-sky-600/20 text-sky-400 rounded-2xl border border-sky-500/30">
            <Home className="w-7 h-7" />
          </div>
        </div>

      </div>

      {/* DESIL BREAKDOWN 1 TO 10 GRID */}
      <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-md">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
          <div className="flex items-center space-x-2">
            <Layers className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">Rincian Data Penerima Berdasarkan Desil (Desil 1 – 10)</h3>
          </div>
          <button
            onClick={() => onNavigateMenu('data-desil')}
            className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold"
          >
            Lihat Semua Desil &rarr;
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
          {Array.from({ length: 10 }).map((_, idx) => {
            const desilKey = `Desil ${idx + 1}`;
            const count = desilCounts[desilKey] || 0;
            return (
              <div
                key={idx}
                className="bg-slate-800/60 p-3.5 rounded-2xl border border-slate-700/80 text-center hover:border-emerald-500/60 transition-colors"
              >
                <p className="font-semibold text-slate-400">{desilKey}</p>
                <p className="text-xl font-bold text-white mt-1">{count}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Penerima</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* VISUAL CHARTS BREAKDOWN */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Chart 1: Per Kecamatan Breakdown */}
        {!isDesa && (
          <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-md flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <div className="flex items-center space-x-2">
                <BarChart3 className="w-5 h-5 text-sky-400" />
                <h3 className="text-sm font-bold text-white">Distribusi Penerima Per Kecamatan</h3>
              </div>
              <span className="text-[11px] text-slate-400 font-medium">17 Kecamatan</span>
            </div>

            <div className="space-y-2.5 overflow-y-auto max-h-72 pr-2 text-xs">
              {kecamatanList.map(kec => {
                const count = kecCounts[kec.nama] || 0;
                const percentage = totalPenerima > 0 ? ((count / totalPenerima) * 100).toFixed(1) : 0;
                return (
                  <div key={kec.id} className="space-y-1">
                    <div className="flex justify-between font-medium text-slate-300">
                      <span>{kec.nama}</span>
                      <span className="font-bold text-white">{count} ({percentage}%)</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-sky-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Chart 2: Disability Breakdown */}
        <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-md flex flex-col">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
            <div className="flex items-center space-x-2">
              <PieIcon className="w-5 h-5 text-purple-400" />
              <h3 className="text-sm font-bold text-white">Statistik Kategori Disabilitas</h3>
            </div>
            <span className="text-[11px] text-purple-400 font-medium">{totalDisabilitas} Jiwa</span>
          </div>

          <div className="space-y-2.5 overflow-y-auto max-h-72 pr-2 text-xs">
            {Object.entries(disabilitasTypeCounts).map(([type, count], idx) => {
              const percentage = totalPenerima > 0 ? ((count / totalPenerima) * 100).toFixed(1) : 0;
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between font-medium text-slate-300">
                    <span className={type === 'Tidak ada disabilitas' ? 'text-slate-400' : 'text-purple-300 font-semibold'}>
                      {type}
                    </span>
                    <span className="font-bold text-white">{count} ({percentage}%)</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${
                        type === 'Tidak ada disabilitas' ? 'bg-slate-600' : 'bg-purple-500'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* RECENT ACTIVITY LOGS */}
      {user.role === 'admin' && (
        <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-md">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
            <div className="flex items-center space-x-2">
              <History className="w-5 h-5 text-amber-400" />
              <h3 className="text-sm font-bold text-white">Aktivitas Pengguna Terakhir</h3>
            </div>
            <button
              onClick={() => onNavigateMenu('log-aktivitas')}
              className="text-xs text-amber-400 hover:text-amber-300 font-semibold"
            >
              Lihat Log Lengkap &rarr;
            </button>
          </div>

          <div className="divide-y divide-slate-800 text-xs">
            {logs.slice(0, 5).map(log => (
              <div key={log.id} className="py-2.5 flex items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-slate-200">
                    {log.user_name} <span className="text-slate-400 font-normal">({log.aktivitas})</span>
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{log.keterangan}</p>
                </div>
                <div className="text-right shrink-0 text-[10px] text-slate-500">
                  {new Date(log.waktu).toLocaleString('id-ID')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
