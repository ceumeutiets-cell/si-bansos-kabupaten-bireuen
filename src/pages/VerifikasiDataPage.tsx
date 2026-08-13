import React, { useState, useMemo } from 'react';
import { 
  PenerimaBansos, 
  Kecamatan, 
  Desa, 
  User, 
  StatusVerifikasi 
} from '../types';
import { 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  Search, 
  Filter, 
  Building2, 
  MapPin, 
  UserCheck, 
  FileText, 
  Eye, 
  CheckSquare, 
  X, 
  Edit3, 
  Check, 
  MessageSquare, 
  Calendar, 
  User as UserIcon,
  Home,
  Image as ImageIcon,
  ExternalLink,
  ChevronRight,
  Sparkles,
  RefreshCw
} from 'lucide-react';

interface VerifikasiDataPageProps {
  penerimaList: PenerimaBansos[];
  kecamatanList: Kecamatan[];
  desaList: Desa[];
  currentUser: User;
  onVerifikasiSingle: (id: string, status: StatusVerifikasi, catatan?: string) => Promise<void>;
  onVerifikasiMasal: (ids: string[], status: StatusVerifikasi, catatan?: string) => Promise<void>;
  onEditItem?: (item: PenerimaBansos) => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  onRefreshData?: () => void;
}

export const VerifikasiDataPage: React.FC<VerifikasiDataPageProps> = ({
  penerimaList,
  kecamatanList,
  desaList,
  currentUser,
  onVerifikasiSingle,
  onVerifikasiMasal,
  onEditItem,
  showToast,
  onRefreshData
}) => {
  const isAdminOrKabupaten = currentUser.role === 'admin' || currentUser.role === 'petugas_kabupaten';

  // State Filters
  const [activeTab, setActiveTab] = useState<StatusVerifikasi | 'Semua'>('Menunggu Verifikasi');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedKecamatanId, setSelectedKecamatanId] = useState('');
  const [selectedDesaId, setSelectedDesaId] = useState('');

  // Selected items for bulk verification
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Action Modals State
  const [activeModalItem, setActiveModalItem] = useState<PenerimaBansos | null>(null);
  const [modalAction, setModalAction] = useState<StatusVerifikasi | null>(null);
  const [catatanInput, setCatatanInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Detail Modal State
  const [detailItem, setDetailItem] = useState<PenerimaBansos | null>(null);

  // Filtered Desa based on selected Kecamatan
  const availableDesa = useMemo(() => {
    if (!selectedKecamatanId) return desaList;
    return desaList.filter(d => d.kecamatan_id === selectedKecamatanId);
  }, [selectedKecamatanId, desaList]);

  // Status Counts
  const counts = useMemo(() => {
    let pending = 0;
    let approved = 0;
    let needFix = 0;
    let rejected = 0;

    penerimaList.forEach(item => {
      const status = item.status_verifikasi || 'Disetujui';
      if (status === 'Menunggu Verifikasi') pending++;
      else if (status === 'Disetujui') approved++;
      else if (status === 'Perlu Perbaikan') needFix++;
      else if (status === 'Ditolak') rejected++;
    });

    return { pending, approved, needFix, rejected, total: penerimaList.length };
  }, [penerimaList]);

  // Filtered Data List
  const filteredList = useMemo(() => {
    return penerimaList.filter(item => {
      const status = item.status_verifikasi || 'Disetujui';

      // Tab filter
      if (activeTab !== 'Semua' && status !== activeTab) {
        return false;
      }

      // Kecamatan filter
      if (selectedKecamatanId && item.kecamatan_id !== selectedKecamatanId) {
        return false;
      }

      // Desa filter
      if (selectedDesaId && item.desa_id !== selectedDesaId) {
        return false;
      }

      // Search term
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchName = item.nama.toLowerCase().includes(q);
        const matchNik = item.nik.toLowerCase().includes(q);
        const matchKk = item.no_kk.toLowerCase().includes(q);
        const matchDesa = (item.desa_nama || '').toLowerCase().includes(q);
        const matchPengusul = (item.diusulkan_oleh || '').toLowerCase().includes(q);
        return matchName || matchNik || matchKk || matchDesa || matchPengusul;
      }

      return true;
    });
  }, [penerimaList, activeTab, selectedKecamatanId, selectedDesaId, searchTerm]);

  // Handle Select All
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const ids = filteredList.map(item => item.id);
      setSelectedIds(ids);
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  // Open action modal for single item
  const openActionModal = (item: PenerimaBansos, action: StatusVerifikasi) => {
    setActiveModalItem(item);
    setModalAction(action);
    setCatatanInput(
      action === 'Disetujui' ? 'Usulan disetujui, data telah divalidasi oleh Administrator.' :
      action === 'Ditolak' ? 'Usulan tidak memenuhi kriteria penerima bantuan sosial.' :
      'Mohon perbaiki kelengkapan foto dan kesesuaian NIK pada kartu keluarga.'
    );
  };

  // Submit Single Action
  const handleConfirmSingleAction = async () => {
    if (!activeModalItem || !modalAction) return;

    setIsSubmitting(true);
    try {
      await onVerifikasiSingle(activeModalItem.id, modalAction, catatanInput);
      setActiveModalItem(null);
      setModalAction(null);
      setCatatanInput('');
    } catch (err: any) {
      showToast(err.message || 'Gagal memproses verifikasi.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Bulk Action
  const handleConfirmBulkAction = async (status: StatusVerifikasi) => {
    if (selectedIds.length === 0) {
      showToast('Pilih setidaknya satu data usulan.', 'error');
      return;
    }

    const defaultNote = status === 'Disetujui' 
      ? 'Disetujui secara masal oleh Administrator Dinas Sosial' 
      : 'Ditolak secara masal oleh Administrator';

    setIsSubmitting(true);
    try {
      await onVerifikasiMasal(selectedIds, status, defaultNote);
      setSelectedIds([]);
    } catch (err: any) {
      showToast(err.message || 'Gagal memproses verifikasi masal.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">
                Verifikasi Usulan Data Operator Desa / Gampong
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Panel peninjauan dan pengesahan usulan calon penerima bantuan sosial dari Operator Gampong se-Kabupaten Bireuen
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {onRefreshData && (
            <button
              onClick={onRefreshData}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-1.5"
              title="Refresh Data Usulan"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="hidden sm:inline">Refresh Data</span>
            </button>
          )}

          <div className="bg-emerald-950/60 border border-emerald-500/30 px-3.5 py-2 rounded-xl text-xs flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span className="text-slate-300">
              Total Usulan Pending: <strong className="text-emerald-400 font-bold">{counts.pending}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        {/* PENDING CARD */}
        <button
          onClick={() => setActiveTab('Menunggu Verifikasi')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            activeTab === 'Menunggu Verifikasi' 
              ? 'bg-amber-500/15 border-amber-500/50 shadow-lg ring-1 ring-amber-500/30' 
              : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              Menunggu Verifikasi
            </span>
            {counts.pending > 0 && (
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
            )}
          </div>
          <p className="text-2xl font-extrabold text-white mt-2">{counts.pending}</p>
          <p className="text-[10px] text-slate-400 mt-1">Usulan baru dari Gampong</p>
        </button>

        {/* REVISION CARD */}
        <button
          onClick={() => setActiveTab('Perlu Perbaikan')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            activeTab === 'Perlu Perbaikan' 
              ? 'bg-sky-500/15 border-sky-500/50 shadow-lg ring-1 ring-sky-500/30' 
              : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-sky-400 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" />
              Perlu Perbaikan
            </span>
          </div>
          <p className="text-2xl font-extrabold text-white mt-2">{counts.needFix}</p>
          <p className="text-[10px] text-slate-400 mt-1">Dikembalikan ke Operator</p>
        </button>

        {/* APPROVED CARD */}
        <button
          onClick={() => setActiveTab('Disetujui')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            activeTab === 'Disetujui' 
              ? 'bg-emerald-500/15 border-emerald-500/50 shadow-lg ring-1 ring-emerald-500/30' 
              : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              Telah Disetujui
            </span>
          </div>
          <p className="text-2xl font-extrabold text-white mt-2">{counts.approved}</p>
          <p className="text-[10px] text-slate-400 mt-1">Data aktif terpilih</p>
        </button>

        {/* REJECTED CARD */}
        <button
          onClick={() => setActiveTab('Ditolak')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            activeTab === 'Ditolak' 
              ? 'bg-rose-500/15 border-rose-500/50 shadow-lg ring-1 ring-rose-500/30' 
              : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-400 flex items-center gap-1.5">
              <XCircle className="w-4 h-4" />
              Ditolak
            </span>
          </div>
          <p className="text-2xl font-extrabold text-white mt-2">{counts.rejected}</p>
          <p className="text-[10px] text-slate-400 mt-1">Tidak memenuhi syarat</p>
        </button>

      </div>

      {/* FILTER BAR & SEARCH */}
      <div className="bg-slate-900 p-5 rounded-3xl border border-slate-800 shadow-xl space-y-4">
        
        {/* Status Tabs Bar */}
        <div className="flex flex-wrap items-center gap-2 pb-3 border-b border-slate-800">
          <span className="text-xs font-bold text-slate-400 mr-2 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Filter Status:
          </span>

          <button
            onClick={() => setActiveTab('Semua')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'Semua' 
                ? 'bg-emerald-600 text-white shadow-md' 
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Semua Data ({counts.total})
          </button>

          <button
            onClick={() => setActiveTab('Menunggu Verifikasi')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'Menunggu Verifikasi' 
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md' 
                : 'bg-slate-800 text-amber-300 hover:bg-slate-700'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Menunggu Verifikasi ({counts.pending})
          </button>

          <button
            onClick={() => setActiveTab('Perlu Perbaikan')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'Perlu Perbaikan' 
                ? 'bg-sky-600 text-white shadow-md' 
                : 'bg-slate-800 text-sky-300 hover:bg-slate-700'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Perlu Perbaikan ({counts.needFix})
          </button>

          <button
            onClick={() => setActiveTab('Disetujui')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'Disetujui' 
                ? 'bg-emerald-600 text-white shadow-md' 
                : 'bg-slate-800 text-emerald-300 hover:bg-slate-700'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Disetujui ({counts.approved})
          </button>

          <button
            onClick={() => setActiveTab('Ditolak')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'Ditolak' 
                ? 'bg-rose-600 text-white shadow-md' 
                : 'bg-slate-800 text-rose-300 hover:bg-slate-700'
            }`}
          >
            <XCircle className="w-3.5 h-3.5" />
            Ditolak ({counts.rejected})
          </button>
        </div>

        {/* Territory & Search Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          
          {/* Kecamatan Filter */}
          <div>
            <label className="block text-slate-400 mb-1 font-medium">Filter Kecamatan</label>
            <select
              value={selectedKecamatanId}
              onChange={(e) => {
                setSelectedKecamatanId(e.target.value);
                setSelectedDesaId('');
              }}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="">-- Semua Kecamatan (17) --</option>
              {kecamatanList.map(k => (
                <option key={k.id} value={k.id}>{k.nama}</option>
              ))}
            </select>
          </div>

          {/* Desa Filter */}
          <div>
            <label className="block text-slate-400 mb-1 font-medium">Filter Gampong / Desa</label>
            <select
              value={selectedDesaId}
              onChange={(e) => setSelectedDesaId(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="">-- Semua Gampong --</option>
              {availableDesa.map(d => (
                <option key={d.id} value={d.id}>{d.nama}</option>
              ))}
            </select>
          </div>

          {/* Search Box */}
          <div>
            <label className="block text-slate-400 mb-1 font-medium">Cari Nama / NIK / Pengusul</label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari NIK, KK, Nama..."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

        </div>

      </div>

      {/* BULK ACTIONS TOOLBAR (FOR ADMIN) */}
      {isAdminOrKabupaten && selectedIds.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-2 text-amber-300 font-semibold text-xs">
            <CheckSquare className="w-4 h-4 text-amber-400" />
            <span>Terpilih <strong>{selectedIds.length}</strong> data usulan desa</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleConfirmBulkAction('Disetujui')}
              disabled={isSubmitting}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-md"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Setujui Masal ({selectedIds.length})</span>
            </button>

            <button
              onClick={() => handleConfirmBulkAction('Ditolak')}
              disabled={isSubmitting}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-md"
            >
              <XCircle className="w-4 h-4" />
              <span>Tolak Masal ({selectedIds.length})</span>
            </button>

            <button
              onClick={() => setSelectedIds([])}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors"
            >
              Batal
            </button>
          </div>
        </div>
      )}

      {/* LIST OF PROPOSED DATA */}
      <div className="space-y-4">
        
        {/* Bulk select check header */}
        {isAdminOrKabupaten && filteredList.length > 0 && (
          <div className="flex items-center justify-between px-2 text-xs text-slate-400">
            <label className="flex items-center gap-2 cursor-pointer font-medium hover:text-white">
              <input
                type="checkbox"
                checked={selectedIds.length === filteredList.length && filteredList.length > 0}
                onChange={handleSelectAll}
                className="rounded border-slate-700 bg-slate-800 text-emerald-500 focus:ring-emerald-500 w-4 h-4"
              />
              <span>Pilih Semua Data di Halaman Ini ({filteredList.length})</span>
            </label>

            <span>Menampilkan {filteredList.length} usulan data</span>
          </div>
        )}

        {filteredList.length === 0 ? (
          <div className="bg-slate-900/60 p-12 rounded-3xl border border-slate-800 text-center space-y-3">
            <ShieldCheck className="w-12 h-12 text-slate-600 mx-auto" />
            <h3 className="text-base font-bold text-white">Tidak ada usulan data ditemukan</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Tidak ada usulan data calon penerima bansos dari operator desa yang sesuai dengan kriteria filter saat ini.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredList.map(item => {
              const status = item.status_verifikasi || 'Disetujui';
              const isSelected = selectedIds.includes(item.id);

              return (
                <div 
                  key={item.id}
                  className={`bg-slate-900/90 p-5 rounded-3xl border transition-all duration-200 relative ${
                    isSelected 
                      ? 'border-amber-500/60 bg-slate-900/100 shadow-xl ring-1 ring-amber-500/20' 
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    
                    {/* Left: Info Core */}
                    <div className="flex items-start gap-3.5">
                      {isAdminOrKabupaten && (
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(item.id)}
                          className="mt-1 rounded border-slate-700 bg-slate-800 text-amber-500 focus:ring-amber-500 w-4 h-4 shrink-0"
                        />
                      )}

                      <div className="space-y-2">
                        {/* Status Badge & Name */}
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-bold text-white tracking-tight">{item.nama}</h3>
                          
                          <span className="text-[11px] font-mono text-slate-400 bg-slate-800 px-2.5 py-0.5 rounded-lg border border-slate-700">
                            NIK: {item.nik}
                          </span>

                          <span className="text-[11px] font-mono text-slate-400 bg-slate-800 px-2.5 py-0.5 rounded-lg border border-slate-700">
                            KK: {item.no_kk}
                          </span>

                          {/* STATUS BADGE */}
                          {status === 'Menunggu Verifikasi' && (
                            <span className="px-2.5 py-0.5 bg-amber-500/15 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-bold flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 animate-pulse" />
                              Menunggu Verifikasi Admin
                            </span>
                          )}

                          {status === 'Perlu Perbaikan' && (
                            <span className="px-2.5 py-0.5 bg-sky-500/15 text-sky-300 border border-sky-500/30 rounded-lg text-xs font-bold flex items-center gap-1">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              Perlu Perbaikan
                            </span>
                          )}

                          {status === 'Disetujui' && (
                            <span className="px-2.5 py-0.5 bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Disetujui
                            </span>
                          )}

                          {status === 'Ditolak' && (
                            <span className="px-2.5 py-0.5 bg-rose-500/15 text-rose-300 border border-rose-500/30 rounded-lg text-xs font-bold flex items-center gap-1">
                              <XCircle className="w-3.5 h-3.5" />
                              Ditolak
                            </span>
                          )}
                        </div>

                        {/* Location & Bantuan Info */}
                        <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-300">
                          <span className="flex items-center gap-1 text-slate-300">
                            <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                            <strong>{item.desa_nama}</strong>, {item.kecamatan_nama}
                          </span>

                          <span className="flex items-center gap-1 text-amber-300 font-semibold">
                            <Building2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            {item.jenis_bantuan}
                          </span>

                          <span className="px-2 py-0.5 bg-slate-800 rounded-md text-[11px] text-slate-300 font-medium">
                            {item.desil}
                          </span>

                          <span className="text-slate-400 text-[11px]">
                            Thn: {item.tahun_penerimaan}
                          </span>
                        </div>

                        {/* Pengusul & Catatan Box */}
                        <div className="pt-2 flex flex-col sm:flex-row sm:items-center gap-2 text-[11px] text-slate-400">
                          <span className="flex items-center gap-1 text-slate-300">
                            <UserIcon className="w-3.5 h-3.5 text-sky-400" />
                            Diusulkan oleh: <strong className="text-white">{item.diusulkan_oleh || item.created_by || 'Operator Gampong'}</strong>
                          </span>

                          {item.tanggal_usulan && (
                            <span className="flex items-center gap-1 text-slate-400">
                              <Calendar className="w-3.5 h-3.5" />
                              {new Date(item.tanggal_usulan).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}

                          {item.verified_by && (
                            <span className="text-emerald-400 font-medium">
                              (Diverifikasi oleh: {item.verified_by})
                            </span>
                          )}
                        </div>

                        {/* CATATAN VERIFIKASI (IF ANY) */}
                        {item.catatan_verifikasi && (
                          <div className={`mt-2 p-2.5 rounded-xl text-xs border flex items-start gap-2 ${
                            status === 'Perlu Perbaikan' ? 'bg-sky-950/40 border-sky-500/30 text-sky-200' :
                            status === 'Ditolak' ? 'bg-rose-950/40 border-rose-500/30 text-rose-200' :
                            'bg-slate-800/80 border-slate-700/80 text-slate-300'
                          }`}>
                            <MessageSquare className="w-4 h-4 shrink-0 mt-0.5" />
                            <div>
                              <strong className="block text-[11px] uppercase tracking-wider font-bold">
                                Catatan Admin Verifikator:
                              </strong>
                              <p className="mt-0.5">{item.catatan_verifikasi}</p>
                            </div>
                          </div>
                        )}

                      </div>
                    </div>

                    {/* Right: Action Buttons */}
                    <div className="flex items-center gap-2 shrink-0 border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-800">
                      
                      {/* DETAIL / BERKAS BUTTON */}
                      <button
                        onClick={() => setDetailItem(item)}
                        className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
                      >
                        <Eye className="w-4 h-4 text-sky-400" />
                        <span>Berkas Data</span>
                      </button>

                      {/* EDIT BUTTON FOR PETUGAS DESA (ESPECIALLY IF PERLU PERBAIKAN / DITOLAK) */}
                      {onEditItem && (currentUser.role === 'petugas_desa' || isAdminOrKabupaten) && (
                        <button
                          onClick={() => onEditItem(item)}
                          className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
                          title="Edit Data Usulan"
                        >
                          <Edit3 className="w-4 h-4" />
                          <span>Edit</span>
                        </button>
                      )}

                      {/* ADMINISTRATOR VERIFICATION ACTIONS */}
                      {isAdminOrKabupaten && (
                        <>
                          <button
                            onClick={() => openActionModal(item, 'Disetujui')}
                            className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1 shadow-sm"
                            title="Setujui Usulan Desa"
                          >
                            <Check className="w-4 h-4" />
                            <span>Setujui</span>
                          </button>

                          <button
                            onClick={() => openActionModal(item, 'Perlu Perbaikan')}
                            className="px-3 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1 shadow-sm"
                            title="Minta Perbaikan ke Operator Gampong"
                          >
                            <AlertTriangle className="w-4 h-4" />
                            <span>Revisi</span>
                          </button>

                          <button
                            onClick={() => openActionModal(item, 'Ditolak')}
                            className="px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1 shadow-sm"
                            title="Tolak Usulan"
                          >
                            <X className="w-4 h-4" />
                            <span>Tolak</span>
                          </button>
                        </>
                      )}

                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* MODAL ACTION SINGLE ITEM VERIFICATION */}
      {activeModalItem && modalAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl text-white">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-xl border ${
                  modalAction === 'Disetujui' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                  modalAction === 'Perlu Perbaikan' ? 'bg-sky-500/10 text-sky-400 border-sky-500/20' :
                  'bg-rose-500/10 text-rose-400 border-rose-500/20'
                }`}>
                  {modalAction === 'Disetujui' && <CheckCircle2 className="w-5 h-5" />}
                  {modalAction === 'Perlu Perbaikan' && <AlertTriangle className="w-5 h-5" />}
                  {modalAction === 'Ditolak' && <XCircle className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Verifikasi Usulan: {modalAction}
                  </h3>
                  <p className="text-xs text-slate-400">Penerima: {activeModalItem.nama} (NIK: {activeModalItem.nik})</p>
                </div>
              </div>

              <button 
                onClick={() => {
                  setActiveModalItem(null);
                  setModalAction(null);
                }} 
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Catatan Verifikator untuk Operator Gampong:
              </label>
              <textarea
                rows={3}
                value={catatanInput}
                onChange={(e) => setCatatanInput(e.target.value)}
                placeholder="Tuliskan alasan atau instruksi spesifik..."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setActiveModalItem(null);
                  setModalAction(null);
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={handleConfirmSingleAction}
                disabled={isSubmitting}
                className={`px-5 py-2 rounded-xl text-xs font-bold text-white shadow-lg transition-colors ${
                  modalAction === 'Disetujui' ? 'bg-emerald-600 hover:bg-emerald-700' :
                  modalAction === 'Perlu Perbaikan' ? 'bg-sky-600 hover:bg-sky-700' :
                  'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {isSubmitting ? 'Memproses...' : `Konfirmasi Status ${modalAction}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DETAIL MODAL popup FOR COMPLETE INSPECTION */}
      {detailItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 space-y-6 shadow-2xl text-white my-8 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-emerald-400" />
                  Berkas Usulan Penerima Bansos
                </h3>
                <p className="text-xs text-slate-400">Pemeriksaan dokumen usulan lengkap dari Gampong</p>
              </div>

              <button onClick={() => setDetailItem(null)} className="text-slate-400 hover:text-white p-1">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Profile Detail Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-slate-800/50 p-4 rounded-2xl border border-slate-700/60">
              <div>
                <span className="text-slate-400 block font-medium">Nama Lengkap</span>
                <span className="text-sm font-bold text-white">{detailItem.nama}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">NIK (16 Digit)</span>
                <span className="font-mono text-emerald-400 font-bold">{detailItem.nik}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">No. KK (16 Digit)</span>
                <span className="font-mono text-slate-200">{detailItem.no_kk}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Jenis Kelamin / Lahir</span>
                <span className="text-slate-200">{detailItem.jenis_kelamin}, {detailItem.tempat_lahir} ({detailItem.tanggal_lahir})</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Lokasi Wilayah</span>
                <span className="text-slate-200">{detailItem.desa_nama}, {detailItem.kecamatan_nama}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Usulan Program Bantuan</span>
                <span className="text-amber-400 font-semibold">{detailItem.jenis_bantuan} ({detailItem.desil})</span>
              </div>
            </div>

            {/* Foto Dokumentasi */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-sky-400" />
                Dokumentasi Foto Lapangan & Rumah
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 text-center space-y-2">
                  <span className="text-[11px] font-semibold text-slate-400 block">Foto KPM / Lapangan</span>
                  {detailItem.foto_ptks ? (
                    <img 
                      src={detailItem.foto_ptks} 
                      alt="Foto KPM" 
                      className="h-44 w-full object-cover rounded-xl"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="h-44 bg-slate-900 rounded-xl flex items-center justify-center text-slate-500 text-xs">
                      Tidak Ada Foto
                    </div>
                  )}
                </div>

                <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 text-center space-y-2">
                  <span className="text-[11px] font-semibold text-slate-400 block">Foto Kondisi Rumah</span>
                  {detailItem.foto_rumah ? (
                    <img 
                      src={detailItem.foto_rumah} 
                      alt="Foto Rumah" 
                      className="h-44 w-full object-cover rounded-xl"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="h-44 bg-slate-900 rounded-xl flex items-center justify-center text-slate-500 text-xs">
                      Tidak Ada Foto
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setDetailItem(null)}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs"
              >
                Tutup Berkas
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
