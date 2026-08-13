import React from 'react';
import { PengaturanSistem } from '../types';
import { 
  Settings, 
  Upload, 
  Image as ImageIcon, 
  Trash2, 
  RotateCcw, 
  FileText, 
  Save, 
  Building2, 
  Eye,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { KopSurat } from '../components/PrintHeaderFooter';

interface PengaturanPageProps {
  settingsForm: PengaturanSistem;
  setSettingsForm: React.Dispatch<React.SetStateAction<PengaturanSistem>>;
  onSaveSettings: (e: React.FormEvent) => Promise<void>;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const DEFAULT_LOGO_BIREUEN = '/src/assets/images/logo_bireuen.svg';
const DEFAULT_LOGO_DINSOS = '/src/assets/images/logo_dinsos.svg';

export const PengaturanPage: React.FC<PengaturanPageProps> = ({
  settingsForm,
  setSettingsForm,
  onSaveSettings,
  showToast
}) => {

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    fieldName: keyof PengaturanSistem,
    labelName: string
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/jpg', 'image/svg+xml', 'image/webp'].includes(file.type)) {
      showToast('Format file gambar harus JPG, PNG, WEBP, atau SVG', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('Ukuran file gambar maksimal 5MB', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setSettingsForm(prev => ({
        ...prev,
        [fieldName]: base64
      }));
      showToast(`${labelName} berhasil diunggah!`, 'success');
    };
    reader.readAsDataURL(file);
  };

  const handleClearField = (fieldName: keyof PengaturanSistem, labelName: string) => {
    setSettingsForm(prev => ({
      ...prev,
      [fieldName]: ''
    }));
    showToast(`${labelName} dihapus`, 'info');
  };

  const handleResetLogoBireuen = () => {
    setSettingsForm(prev => ({
      ...prev,
      logo_kabupaten: DEFAULT_LOGO_BIREUEN
    }));
    showToast('Logo Kabupaten Bireuen direset ke logo resmi bawaan', 'success');
  };

  const handleResetLogoDinsos = () => {
    setSettingsForm(prev => ({
      ...prev,
      logo_dinsos: DEFAULT_LOGO_DINSOS
    }));
    showToast('Logo Dinsos direset ke logo bawaan', 'success');
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2.5">
            <Settings className="w-6 h-6 text-amber-500" />
            Pengaturan Identitas Instansi & Logo Surat
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Atur identitas resmi instansi, upload gambar logo untuk Kop Surat, dan format dokumen cetak
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl text-xs font-semibold flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" />
            Dokumen Cetak Siap (PDF)
          </span>
        </div>
      </div>

      <form onSubmit={onSaveSettings} className="space-y-8 text-xs text-white">
        
        {/* SECTION 1: TEKS IDENTITAS INSTANSI */}
        <div className="bg-slate-900/90 p-6 rounded-3xl border border-slate-800 shadow-xl space-y-5">
          <div className="flex items-center space-x-3 pb-3 border-b border-slate-800">
            <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">1. Identitas Instansi & Kepala Dinas</h3>
              <p className="text-[11px] text-slate-400">Nama instansi dan pejabat penandatangan yang tercantum pada dokumen surat dan laporan</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 mb-1 font-semibold">
                Nama Instansi Utama <span className="text-rose-400">*</span>
              </label>
              <input 
                type="text" 
                required
                value={settingsForm.nama_instansi || ''} 
                onChange={(e) => setSettingsForm({ ...settingsForm, nama_instansi: e.target.value })} 
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-all" 
                placeholder="Contoh: PEMERINTAH KABUPATEN BIREUEN"
              />
            </div>

            <div>
              <label className="block text-slate-300 mb-1 font-semibold">
                Sub Instansi / Pelaksana <span className="text-rose-400">*</span>
              </label>
              <input 
                type="text" 
                required
                value={settingsForm.sub_instansi || ''} 
                onChange={(e) => setSettingsForm({ ...settingsForm, sub_instansi: e.target.value })} 
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-all" 
                placeholder="Contoh: DINAS SOSIAL KABUPATEN BIREUEN"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 mb-1 font-semibold">
              Alamat Lengkap Kantor <span className="text-rose-400">*</span>
            </label>
            <input 
              type="text" 
              required
              value={settingsForm.alamat || ''} 
              onChange={(e) => setSettingsForm({ ...settingsForm, alamat: e.target.value })} 
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-all" 
              placeholder="Contoh: Jl. Mayjen T. Hamzah Bendahara No. 12, Bireuen, Aceh"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-300 mb-1 font-semibold">
                Nama Kepala Dinas <span className="text-rose-400">*</span>
              </label>
              <input 
                type="text" 
                required
                value={settingsForm.nama_kepala_dinas || ''} 
                onChange={(e) => setSettingsForm({ ...settingsForm, nama_kepala_dinas: e.target.value })} 
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-all" 
                placeholder="Contoh: Dr. Alfian"
              />
            </div>

            <div>
              <label className="block text-slate-300 mb-1 font-semibold">
                Jabatan Kepala Dinas <span className="text-rose-400">*</span>
              </label>
              <input 
                type="text" 
                required
                value={settingsForm.jabatan_kepala_dinas || ''} 
                onChange={(e) => setSettingsForm({ ...settingsForm, jabatan_kepala_dinas: e.target.value })} 
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-all" 
                placeholder="Contoh: Kepala Dinas Sosial Kabupaten Bireuen"
              />
            </div>

            <div>
              <label className="block text-slate-300 mb-1 font-semibold">
                NIP Kepala Dinas <span className="text-rose-400">*</span>
              </label>
              <input 
                type="text" 
                required
                value={settingsForm.nip_kepala_dinas || ''} 
                onChange={(e) => setSettingsForm({ ...settingsForm, nip_kepala_dinas: e.target.value })} 
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-all" 
                placeholder="Contoh: 19720415 199803 1 004"
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: UPLOAD LOGO KOP SURAT & LOGO FILE SURAT */}
        <div className="bg-slate-900/90 p-6 rounded-3xl border border-slate-800 shadow-xl space-y-6">
          <div className="flex items-center space-x-3 pb-3 border-b border-slate-800">
            <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">2. Upload Gambar Logo & Atribut Surat</h3>
              <p className="text-[11px] text-slate-400">Unggah file logo kabupaten (sebelah kiri), logo instansi (sebelah kanan), atau gambar banner Kop Surat</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* LOGO KABUPATEN BIREUEN (SEBELAH KIRI SURAT) */}
            <div className="bg-slate-800/60 p-5 rounded-2xl border border-slate-700/80 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4" />
                    Logo Pemkab Bireuen (Sebelah Kiri)
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">Ditampilkan pada posisi sebelah kiri Kop Surat resmi</p>
                </div>
                <span className="text-[10px] bg-slate-800 px-2.5 py-1 rounded-full text-slate-400 font-mono">
                  {settingsForm.logo_kabupaten ? 'Tersedia' : 'Kosong'}
                </span>
              </div>

              {/* Preview Box */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-center min-h-32 relative">
                {settingsForm.logo_kabupaten ? (
                  <div className="flex flex-col items-center gap-2">
                    <img 
                      src={settingsForm.logo_kabupaten} 
                      alt="Logo Kabupaten Bireuen" 
                      className="h-24 w-24 object-contain"
                      referrerPolicy="no-referrer"
                    />
                    <span className="text-[10px] text-slate-400 italic">Logo Aktif Sebelah Kiri</span>
                  </div>
                ) : (
                  <div className="text-center text-slate-500 space-y-1">
                    <AlertCircle className="w-6 h-6 mx-auto opacity-50" />
                    <p className="text-[11px]">Belum ada logo sebelah kiri</p>
                  </div>
                )}
              </div>

              {/* Upload Controls */}
              <div className="flex flex-col sm:flex-row gap-2">
                <label className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors flex items-center justify-center gap-2 shadow-md">
                  <Upload className="w-4 h-4" />
                  <span>Upload Logo Kiri</span>
                  <input 
                    type="file" 
                    accept="image/jpeg,image/png,image/jpg,image/svg+xml,image/webp" 
                    onChange={(e) => handleFileUpload(e, 'logo_kabupaten', 'Logo Pemkab Bireuen')} 
                    className="hidden" 
                  />
                </label>

                <button
                  type="button"
                  onClick={handleResetLogoBireuen}
                  className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                  title="Gunakan Logo Resmi Lambang Kabupaten Bireuen"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Logo Bireuen Def</span>
                </button>

                {settingsForm.logo_kabupaten && (
                  <button
                    type="button"
                    onClick={() => handleClearField('logo_kabupaten', 'Logo Pemkab')}
                    className="py-2 px-3 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* LOGO DINAS SOSIAL / INSTANSI (SEBELAH KANAN SURAT) */}
            <div className="bg-slate-800/60 p-5 rounded-2xl border border-slate-700/80 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-sky-400 flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4" />
                    Logo Dinas / Instansi (Sebelah Kanan)
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">Ditampilkan pada posisi sebelah kanan Kop Surat resmi (opsional)</p>
                </div>
                <span className="text-[10px] bg-slate-800 px-2.5 py-1 rounded-full text-slate-400 font-mono">
                  {settingsForm.logo_dinsos ? 'Tersedia' : 'Kosong'}
                </span>
              </div>

              {/* Preview Box */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-center min-h-32 relative">
                {settingsForm.logo_dinsos ? (
                  <div className="flex flex-col items-center gap-2">
                    <img 
                      src={settingsForm.logo_dinsos} 
                      alt="Logo Dinas Sosial" 
                      className="h-24 w-24 object-contain"
                      referrerPolicy="no-referrer"
                    />
                    <span className="text-[10px] text-slate-400 italic">Logo Aktif Sebelah Kanan</span>
                  </div>
                ) : (
                  <div className="text-center text-slate-500 space-y-1">
                    <AlertCircle className="w-6 h-6 mx-auto opacity-50" />
                    <p className="text-[11px]">Belum ada logo sebelah kanan</p>
                  </div>
                )}
              </div>

              {/* Upload Controls */}
              <div className="flex flex-col sm:flex-row gap-2">
                <label className="flex-1 py-2 px-3 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors flex items-center justify-center gap-2 shadow-md">
                  <Upload className="w-4 h-4" />
                  <span>Upload Logo Kanan</span>
                  <input 
                    type="file" 
                    accept="image/jpeg,image/png,image/jpg,image/svg+xml,image/webp" 
                    onChange={(e) => handleFileUpload(e, 'logo_dinsos', 'Logo Dinas Sosial')} 
                    className="hidden" 
                  />
                </label>

                <button
                  type="button"
                  onClick={handleResetLogoDinsos}
                  className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-sky-300 border border-slate-700 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Logo Dinsos Def</span>
                </button>

                {settingsForm.logo_dinsos && (
                  <button
                    type="button"
                    onClick={() => handleClearField('logo_dinsos', 'Logo Dinsos')}
                    className="py-2 px-3 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

          </div>

          {/* BANNER GAMBAR KOP SURAT FULL (OPSIONAL) */}
          <div className="bg-slate-800/60 p-5 rounded-2xl border border-slate-700/80 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <FileText className="w-4 h-4" />
                  Banner Gambar Kop Surat Header (Opsional Gambar Siap Pakai)
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Jika Anda memiliki file gambar Kop Surat utuh yang sudah berlogo dan berteks, upload di sini untuk menggantikan format teks otomatis</p>
              </div>

              {settingsForm.kop_surat && (
                <button
                  type="button"
                  onClick={() => handleClearField('kop_surat', 'Gambar Banner Kop Surat')}
                  className="px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Gunakan Teks Header Otomatis</span>
                </button>
              )}
            </div>

            {settingsForm.kop_surat ? (
              <div className="bg-white p-3 rounded-xl border border-slate-700 flex justify-center">
                <img src={settingsForm.kop_surat} alt="Kop Surat Banner" className="max-h-32 object-contain" />
              </div>
            ) : (
              <div className="p-4 border-2 border-dashed border-slate-700 rounded-xl bg-slate-950/50 text-center">
                <p className="text-slate-400 text-xs">Atur logo kiri & kanan serta teks instansi, atau upload file gambar Kop Surat utuh.</p>
              </div>
            )}

            <div className="flex justify-start">
              <label className="py-2 px-4 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 rounded-xl text-xs font-semibold cursor-pointer transition-colors flex items-center gap-2">
                <Upload className="w-4 h-4 text-amber-400" />
                <span>Upload Banner Gambar Kop Surat</span>
                <input 
                  type="file" 
                  accept="image/jpeg,image/png,image/jpg,image/svg+xml,image/webp" 
                  onChange={(e) => handleFileUpload(e, 'kop_surat', 'Banner Kop Surat')} 
                  className="hidden" 
                />
              </label>
            </div>
          </div>

        </div>

        {/* SECTION 3: LIVE PREVIEW DOKUMEN CETAK KOP SURAT */}
        <div className="bg-slate-900/90 p-6 rounded-3xl border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center space-x-3 pb-3 border-b border-slate-800">
            <div className="p-2.5 bg-sky-500/10 text-sky-400 rounded-xl border border-sky-500/20">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">3. Pratinjau Langsung (Live Preview) Kop Surat pada Dokumen Cetak</h3>
              <p className="text-[11px] text-slate-400">Tampilan Kop Surat resmi yang akan muncul di atas setiap lembar cetak laporan dan dokumen PDF</p>
            </div>
          </div>

          <div className="bg-slate-200 p-4 sm:p-6 rounded-2xl overflow-x-auto">
            <div className="bg-white text-slate-900 p-6 rounded-xl shadow border border-slate-300 max-w-3xl mx-auto">
              <KopSurat settings={settingsForm} />

              <div className="py-6 text-center text-slate-400 border-2 border-dashed border-slate-300 rounded-lg my-2 text-xs">
                [ Tampilan Isian Dokumen Surat / Laporan Penerima Bansos Kabupaten Bireuen ]
              </div>

              <div className="mt-6 flex justify-end">
                <div className="text-center w-56 text-xs">
                  <p>Bireuen, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  <p className="font-bold mt-1">{settingsForm.jabatan_kepala_dinas || 'Kepala Dinas Sosial'}</p>
                  
                  <div className="h-16 my-2 flex items-center justify-center relative">
                  </div>

                  <p className="font-bold underline uppercase">{settingsForm.nama_kepala_dinas || 'Dr. Alfian'}</p>
                  <p className="text-[11px] text-slate-600">NIP. {settingsForm.nip_kepala_dinas}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SAVE BUTTON */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl text-xs shadow-xl transition-all flex items-center gap-2.5"
            id="btn-simpan-pengaturan"
          >
            <Save className="w-4 h-4" />
            <span>Simpan Semua Pengaturan & Logo Surat</span>
          </button>
        </div>

      </form>
    </div>
  );
};
