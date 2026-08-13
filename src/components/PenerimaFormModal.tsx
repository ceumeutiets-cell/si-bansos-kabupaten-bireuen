import React, { useState, useEffect } from 'react';
import { 
  PenerimaBansos, 
  Kecamatan, 
  Desa, 
  Desil, 
  JenisDisabilitas, 
  JenisBantuan, 
  StatusPenerima,
  User
} from '../types';
import { 
  X, 
  Save, 
  MapPin, 
  Camera, 
  Upload, 
  Trash2, 
  UserCheck, 
  FileText, 
  HeartHandshake,
  LocateFixed,
  AlertCircle,
  Image as ImageIcon,
  CheckCircle,
  ExternalLink,
  Navigation,
  RotateCcw
} from 'lucide-react';
import { MapModal } from './MapModal';

interface PenerimaFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<PenerimaBansos>) => Promise<void>;
  initialData?: PenerimaBansos | null;
  kecamatanList: Kecamatan[];
  desaList: Desa[];
  currentUser?: User | null;
  onOpenMapPicker?: (lat: number, lng: number) => void;
}

const SAMPLE_FOTO_KPM = 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=500&auto=format&fit=crop&q=80';
const SAMPLE_FOTO_RUMAH = 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=500&auto=format&fit=crop&q=80';

export const PenerimaFormModal: React.FC<PenerimaFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  kecamatanList,
  desaList,
  currentUser,
  onOpenMapPicker
}) => {
  const [formData, setFormData] = useState<Partial<PenerimaBansos>>({
    nik: '',
    no_kk: '',
    nama: '',
    jenis_kelamin: 'Laki-laki',
    tempat_lahir: 'Bireuen',
    tanggal_lahir: '1990-01-01',
    nomor_hp: '',
    kecamatan_id: '',
    desa_id: '',
    alamat: '',
    keterangan: '',
    desil: 'Desil 1',
    jenis_bantuan: 'PKH (Program Keluarga Harapan)',
    status_penerima: 'Aktif',
    keterangan_bantuan: '',
    tahun_penerimaan: new Date().getFullYear(),
    sumber_data: 'DTKS',
    jenis_disabilitas: 'Tidak ada disabilitas',
    foto_ptks: '',
    foto_rumah: '',
    foto_rumah_kondisi: '',
    keterangan_kondisi_rumah: '',
    latitude: 5.2045,
    longitude: 96.7012
  });

  const [filteredDesa, setFilteredDesa] = useState<Desa[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [isMapPickerOpen, setIsMapPickerOpen] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({ ...initialData });
    } else {
      const defaultKecId = currentUser?.role === 'petugas_desa' ? (currentUser.kecamatan_id || kecamatanList[0]?.id || '') : (kecamatanList[0]?.id || '');
      const defaultDesaId = currentUser?.role === 'petugas_desa' ? (currentUser.desa_id || '') : '';

      setFormData({
        nik: '',
        no_kk: '',
        nama: '',
        jenis_kelamin: 'Laki-laki',
        tempat_lahir: 'Bireuen',
        tanggal_lahir: '1990-01-01',
        nomor_hp: '',
        kecamatan_id: defaultKecId,
        desa_id: defaultDesaId,
        alamat: '',
        keterangan: '',
        desil: 'Desil 1',
        jenis_bantuan: 'PKH (Program Keluarga Harapan)',
        status_penerima: 'Aktif',
        keterangan_bantuan: '',
        tahun_penerimaan: new Date().getFullYear(),
        sumber_data: 'DTKS',
        jenis_disabilitas: 'Tidak ada disabilitas',
        foto_ptks: '',
        foto_rumah: '',
        foto_rumah_kondisi: '',
        keterangan_kondisi_rumah: '',
        latitude: 5.2045,
        longitude: 96.7012
      });
    }
    setErrors({});
    setGeneralError('');
  }, [initialData, isOpen, currentUser, kecamatanList]);

  // Dependent dropdown desa based on kecamatan_id
  useEffect(() => {
    if (formData.kecamatan_id) {
      const list = desaList.filter(d => d.kecamatan_id === formData.kecamatan_id);
      setFilteredDesa(list);
      // Auto select first village if current selected village is not in list
      if (list.length > 0 && !list.some(d => d.id === formData.desa_id)) {
        setFormData(prev => ({ ...prev, desa_id: list[0].id }));
      }
    } else {
      setFilteredDesa([]);
    }
  }, [formData.kecamatan_id, desaList]);

  if (!isOpen) return null;

  const handleKecamatanChange = (kecId: string) => {
    setFormData(prev => ({
      ...prev,
      kecamatan_id: kecId,
      desa_id: ''
    }));
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert('Browser Anda tidak mendukung fitur Geolocation.');
      return;
    }

    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFormData(prev => ({
          ...prev,
          latitude: Number(pos.coords.latitude.toFixed(6)),
          longitude: Number(pos.coords.longitude.toFixed(6))
        }));
        setGettingLocation(false);
      },
      (err) => {
        setGettingLocation(false);
        alert(`Gagal mengambil lokasi: ${err.message}. Pastikan izin lokasi diberikan.`);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, fieldName: 'foto_ptks' | 'foto_rumah') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
      alert('Format foto harus JPG, JPEG, atau PNG');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Ukuran file foto maksimal 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setFormData(prev => ({ ...prev, [fieldName]: base64 }));
    };
    reader.readAsDataURL(file);
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    const nikDigits = (formData.nik || '').replace(/\D/g, '');
    const kkDigits = (formData.no_kk || '').replace(/\D/g, '');

    if (!formData.nama || formData.nama.trim().length < 2) {
      newErrors.nama = 'Nama lengkap sesuai KTP wajib diisi.';
    }

    if (nikDigits.length !== 16) {
      newErrors.nik = 'NIK harus 16 digit angka.';
    }

    if (kkDigits.length !== 16) {
      newErrors.no_kk = 'No. KK harus 16 digit angka.';
    }

    if (!formData.tempat_lahir) {
      newErrors.tempat_lahir = 'Tempat lahir wajib diisi.';
    }

    if (!formData.tanggal_lahir) {
      newErrors.tanggal_lahir = 'Tanggal lahir wajib diisi.';
    }

    if (!formData.kecamatan_id) {
      newErrors.kecamatan_id = 'Kecamatan wajib dipilih.';
    }

    if (!formData.desa_id) {
      newErrors.desa_id = 'Gampong / Desa wajib dipilih.';
    }

    if (!formData.alamat || formData.alamat.trim().length < 3) {
      newErrors.alamat = 'Alamat domisili wajib diisi.';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      setGeneralError('Seluruh bidang input wajib diisi. NIK dan No. KK harus 16 digit angka.');
      return false;
    }

    setGeneralError('');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave(formData);
      onClose();
    } catch (err: any) {
      setGeneralError(err.message || 'Gagal menyimpan data penerima.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isDesaUser = currentUser?.role === 'petugas_desa';

  const desilOptions = [
    { label: 'Desil 1 (Sangat Miskin)', value: 'Desil 1' },
    { label: 'Desil 2 (Miskin)', value: 'Desil 2' },
    { label: 'Desil 3 (Hampir Miskin)', value: 'Desil 3' },
    { label: 'Desil 4 (Rentan Miskin)', value: 'Desil 4' },
    { label: 'Desil 5', value: 'Desil 5' },
    { label: 'Desil 6', value: 'Desil 6' },
    { label: 'Desil 7', value: 'Desil 7' },
    { label: 'Desil 8', value: 'Desil 8' },
    { label: 'Desil 9', value: 'Desil 9' },
    { label: 'Desil 10', value: 'Desil 10' },
  ];

  const disabilitasOptions = [
    'Tidak ada disabilitas',
    'Disabilitas fisik',
    'Disabilitas sensorik penglihatan',
    'Disabilitas sensorik pendengaran',
    'Disabilitas sensorik wicara',
    'Disabilitas intelektual',
    'Disabilitas mental',
    'Disabilitas fisik dan mental',
    'Disabilitas ganda',
    'Disabilitas lainnya'
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-sm print:hidden overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full shadow-2xl my-6 text-white flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-slate-800 bg-slate-900/90 rounded-t-3xl">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl border border-emerald-500/20">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">
                {initialData ? 'Edit Data Penerima Bansos' : 'Tambah Data Penerima Bansos'}
              </h3>
              <p className="text-xs text-amber-400/90 font-medium mt-0.5">
                Seluruh bidang input wajib diisi. NIK dan No. KK harus 16 digit angka.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Error Banner */}
        {generalError && (
          <div className="mx-6 mt-4 p-3.5 bg-rose-500/15 border border-rose-500/30 rounded-2xl flex items-center gap-3 text-xs text-rose-300">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
            <span>{generalError}</span>
          </div>
        )}

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-6 text-xs text-slate-200">
          
          {/* SECTION 1: INFORMASI UTAMA & IDENTITAS KPM */}
          <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800/80 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
              <UserCheck className="w-4 h-4" />
              Identitas KPM (Keluarga Penerima Manfaat)
            </h4>

            {/* Nama Lengkap */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Nama Lengkap <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={formData.nama || ''}
                onChange={e => setFormData({ ...formData, nama: e.target.value })}
                className="w-full bg-slate-800/90 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-all"
                placeholder="Nama sesuai KTP"
              />
              {errors.nama && <p className="text-rose-400 text-[11px] mt-1">{errors.nama}</p>}
            </div>

            {/* NIK & No. KK Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* NIK */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-300 font-semibold">
                    NIK <span className="text-rose-400">*</span>
                  </label>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                    (formData.nik || '').replace(/\D/g, '').length === 16 
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                      : 'bg-slate-800 text-slate-400'
                  }`}>
                    {(formData.nik || '').replace(/\D/g, '').length}/16
                  </span>
                </div>
                <input
                  type="text"
                  maxLength={16}
                  value={formData.nik || ''}
                  onChange={e => setFormData({ ...formData, nik: e.target.value.replace(/\D/g, '') })}
                  className="w-full bg-slate-800/90 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-white font-mono placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-all"
                  placeholder="16 Digit NIK"
                />
                {errors.nik && <p className="text-rose-400 text-[11px] mt-1">{errors.nik}</p>}
              </div>

              {/* No. KK */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-300 font-semibold">
                    No. KK <span className="text-rose-400">*</span>
                  </label>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                    (formData.no_kk || '').replace(/\D/g, '').length === 16 
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                      : 'bg-slate-800 text-slate-400'
                  }`}>
                    {(formData.no_kk || '').replace(/\D/g, '').length}/16
                  </span>
                </div>
                <input
                  type="text"
                  maxLength={16}
                  value={formData.no_kk || ''}
                  onChange={e => setFormData({ ...formData, no_kk: e.target.value.replace(/\D/g, '') })}
                  className="w-full bg-slate-800/90 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-white font-mono placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-all"
                  placeholder="16 Digit KK"
                />
                {errors.no_kk && <p className="text-rose-400 text-[11px] mt-1">{errors.no_kk}</p>}
              </div>

            </div>

            {/* Tempat Lahir & Tanggal Lahir */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Tempat Lahir <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.tempat_lahir || ''}
                  onChange={e => setFormData({ ...formData, tempat_lahir: e.target.value })}
                  className="w-full bg-slate-800/90 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-all"
                  placeholder="Bireuen"
                />
                {errors.tempat_lahir && <p className="text-rose-400 text-[11px] mt-1">{errors.tempat_lahir}</p>}
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Tanggal Lahir <span className="text-rose-400">*</span>
                </label>
                <input
                  type="date"
                  value={formData.tanggal_lahir || ''}
                  onChange={e => setFormData({ ...formData, tanggal_lahir: e.target.value })}
                  className="w-full bg-slate-800/90 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-500 transition-all"
                />
                {errors.tanggal_lahir && <p className="text-rose-400 text-[11px] mt-1">{errors.tanggal_lahir}</p>}
              </div>

            </div>

            {/* Jenis Kelamin */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Jenis Kelamin <span className="text-rose-400">*</span>
              </label>
              <select
                value={formData.jenis_kelamin || 'Laki-laki'}
                onChange={e => setFormData({ ...formData, jenis_kelamin: e.target.value as any })}
                className="w-full bg-slate-800/90 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-500 transition-all"
              >
                <option value="Laki-laki">Laki-laki</option>
                <option value="Perempuan">Perempuan</option>
              </select>
            </div>

          </div>

          {/* SECTION 2: DESIL & WILAYAH */}
          <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800/80 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
              <HeartHandshake className="w-4 h-4" />
              Kategori Kesejahteraan & Wilayah Domisili
            </h4>

            {/* Kategori Desil */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Kategori Desil <span className="text-rose-400">*</span>
              </label>
              <select
                value={formData.desil || 'Desil 1'}
                onChange={e => setFormData({ ...formData, desil: e.target.value as Desil })}
                className="w-full bg-slate-800/90 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-amber-300 font-semibold focus:outline-none focus:border-emerald-500 transition-all"
              >
                {desilOptions.map(opt => (
                  <option key={opt.value} value={opt.value} className="bg-slate-900 text-white">
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Kecamatan & Gampong / Desa */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Kecamatan <span className="text-rose-400">*</span>
                </label>
                <select
                  disabled={isDesaUser}
                  value={formData.kecamatan_id || ''}
                  onChange={e => handleKecamatanChange(e.target.value)}
                  className="w-full bg-slate-800/90 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-500 disabled:opacity-60 transition-all"
                >
                  <option value="">-- Pilih Kecamatan --</option>
                  {kecamatanList.map(k => (
                    <option key={k.id} value={k.id}>{k.nama}</option>
                  ))}
                </select>
                {errors.kecamatan_id && <p className="text-rose-400 text-[11px] mt-1">{errors.kecamatan_id}</p>}
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Gampong / Desa <span className="text-rose-400">*</span>
                </label>
                <select
                  disabled={isDesaUser}
                  value={formData.desa_id || ''}
                  onChange={e => setFormData({ ...formData, desa_id: e.target.value })}
                  className="w-full bg-slate-800/90 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-500 disabled:opacity-60 transition-all"
                >
                  <option value="">-- Pilih Gampong / Desa --</option>
                  {filteredDesa.map(d => (
                    <option key={d.id} value={d.id}>{d.nama}</option>
                  ))}
                </select>
                {errors.desa_id && <p className="text-rose-400 text-[11px] mt-1">{errors.desa_id}</p>}
              </div>

            </div>

            {/* Alamat Domisili */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Alamat Domisili <span className="text-rose-400">*</span>
              </label>
              <textarea
                rows={2}
                value={formData.alamat || ''}
                onChange={e => setFormData({ ...formData, alamat: e.target.value })}
                className="w-full bg-slate-800/90 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-all"
                placeholder="Nama jalan, lorong, nomor rumah, dusun..."
              />
              {errors.alamat && <p className="text-rose-400 text-[11px] mt-1">{errors.alamat}</p>}
            </div>

            {/* Kategori Disabilitas */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Kategori Disabilitas <span className="text-rose-400">*</span>
              </label>
              <select
                value={formData.jenis_disabilitas || 'Tidak ada disabilitas'}
                onChange={e => setFormData({ ...formData, jenis_disabilitas: e.target.value as JenisDisabilitas })}
                className="w-full bg-slate-800/90 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-500 transition-all"
              >
                {disabilitasOptions.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

          </div>

          {/* SECTION: TITIK KOORDINAT LOKASI KPM (GIS / GEOLOCATION) */}
          <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800/80 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-400" />
                  Titik Koordinat Lokasi KPM (GIS)
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Koordinat lokasi tempat tinggal KPM (Latitude & Longitude) untuk pemetaan GIS dan verifikasi lapangan
                </p>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={handleGetLocation}
                  disabled={gettingLocation}
                  className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-60"
                  title="Deteksi lokasi GPS perangkat Anda"
                >
                  <LocateFixed className={`w-3.5 h-3.5 ${gettingLocation ? 'animate-spin text-amber-400' : ''}`} />
                  <span>{gettingLocation ? 'Deteksi GPS...' : 'GPS Saat Ini'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsMapPickerOpen(true)}
                  className="px-3 py-1.5 bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  title="Pilih posisi titik koordinat di peta interaktif"
                >
                  <MapPin className="w-3.5 h-3.5 text-sky-400" />
                  <span>Pilih di Peta</span>
                </button>
              </div>
            </div>

            {/* Input Latitude & Longitude */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Latitude (Garis Lintang)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    value={formData.latitude !== undefined ? formData.latitude : ''}
                    onChange={e => setFormData({ ...formData, latitude: e.target.value === '' ? undefined : parseFloat(e.target.value) })}
                    className="w-full bg-slate-800/90 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-white font-mono placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-all pr-10"
                    placeholder="Contoh: 5.204500"
                  />
                  <span className="absolute right-3 top-2.5 text-[10px] text-slate-500 font-mono">°N</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Longitude (Garis Bujur)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    value={formData.longitude !== undefined ? formData.longitude : ''}
                    onChange={e => setFormData({ ...formData, longitude: e.target.value === '' ? undefined : parseFloat(e.target.value) })}
                    className="w-full bg-slate-800/90 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-white font-mono placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-all pr-10"
                    placeholder="Contoh: 96.701200"
                  />
                  <span className="absolute right-3 top-2.5 text-[10px] text-slate-500 font-mono">°E</span>
                </div>
              </div>
            </div>

            {/* Quick Location Preview Info Bar */}
            <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 text-slate-300 font-mono text-[11px]">
                <Navigation className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Lat: <strong className="text-emerald-400">{formData.latitude ?? '-'}</strong></span>
                <span className="text-slate-600">|</span>
                <span>Lng: <strong className="text-emerald-400">{formData.longitude ?? '-'}</strong></span>
              </div>

              <div className="flex items-center gap-2 text-[11px]">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, latitude: 5.2045, longitude: 96.7012 }))}
                  className="text-slate-400 hover:text-amber-300 transition-colors flex items-center gap-1"
                  title="Atur ulang ke koordinat Bireuen"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset Bireuen</span>
                </button>

                {formData.latitude && formData.longitude && (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${formData.latitude},${formData.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sky-400 hover:text-sky-300 font-semibold transition-colors flex items-center gap-1 ml-2"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>Cek Google Maps</span>
                  </a>
                )}
              </div>
            </div>

          </div>

          {/* SECTION 3: DOKUMENTASI FOTO KPM & RUMAH */}
          <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800/80 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-2 border-b border-slate-800">
              <h4 className="text-xs font-bold uppercase tracking-wider text-sky-400 flex items-center gap-2">
                <Camera className="w-4 h-4" />
                Dokumentasi Foto KPM & Rumah <span className="text-rose-400">*</span>
              </h4>
              <span className="text-[11px] text-slate-400 font-normal">Format: JPG, PNG (Maks 5MB)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Foto KPM */}
              <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-200">Foto KPM</span>
                  <span className="text-[10px] text-slate-400">
                    {formData.foto_ptks ? 'Foto ter-upload' : 'No file chosen'}
                  </span>
                </div>

                {formData.foto_ptks ? (
                  <div className="relative rounded-xl overflow-hidden border border-slate-700 bg-black aspect-video">
                    <img src={formData.foto_ptks} alt="Foto KPM" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, foto_ptks: '' })}
                      className="absolute top-2 right-2 p-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-md transition-colors"
                      title="Hapus Foto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-slate-700 hover:border-emerald-500 rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer bg-slate-800/40 hover:bg-slate-800/80 transition-all">
                    <Camera className="w-7 h-7 text-emerald-400 mb-1" />
                    <span className="font-semibold text-slate-200 text-xs">Pilih Foto KPM</span>
                    <span className="text-[10px] text-slate-400 mt-0.5">Klik untuk upload foto</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/jpg"
                      onChange={e => handleFileUpload(e, 'foto_ptks')}
                      className="hidden"
                    />
                  </label>
                )}

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, foto_ptks: SAMPLE_FOTO_KPM })}
                  className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 rounded-lg text-[11px] font-medium border border-slate-700 transition-colors flex items-center justify-center gap-1.5"
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Gunakan Foto Contoh</span>
                </button>
              </div>

              {/* Foto Rumah KPM */}
              <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-200">Foto Rumah KPM</span>
                  <span className="text-[10px] text-slate-400">
                    {formData.foto_rumah ? 'Foto ter-upload' : 'No file chosen'}
                  </span>
                </div>

                {formData.foto_rumah ? (
                  <div className="relative rounded-xl overflow-hidden border border-slate-700 bg-black aspect-video">
                    <img src={formData.foto_rumah} alt="Foto Rumah KPM" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, foto_rumah: '' })}
                      className="absolute top-2 right-2 p-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-md transition-colors"
                      title="Hapus Foto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-slate-700 hover:border-sky-500 rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer bg-slate-800/40 hover:bg-slate-800/80 transition-all">
                    <Upload className="w-7 h-7 text-sky-400 mb-1" />
                    <span className="font-semibold text-slate-200 text-xs">Pilih Foto Rumah</span>
                    <span className="text-[10px] text-slate-400 mt-0.5">Klik untuk upload foto</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/jpg"
                      onChange={e => handleFileUpload(e, 'foto_rumah')}
                      className="hidden"
                    />
                  </label>
                )}

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, foto_rumah: SAMPLE_FOTO_RUMAH })}
                  className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-sky-300 rounded-lg text-[11px] font-medium border border-slate-700 transition-colors flex items-center justify-center gap-1.5"
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Gunakan Foto Contoh</span>
                </button>
              </div>

            </div>
          </div>

        </form>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-800 flex items-center justify-between bg-slate-900/90 rounded-b-3xl">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl border border-slate-700 transition-colors"
          >
            Batal
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-6 py-2.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-lg transition-all flex items-center gap-2 disabled:opacity-60"
            id="btn-simpan-penerima"
          >
            <Save className="w-4 h-4" />
            <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Penerima'}</span>
          </button>
        </div>

      </div>

      {/* MAP PICKER MODAL */}
      {isMapPickerOpen && (
        <MapModal
          isOpen={isMapPickerOpen}
          onClose={() => setIsMapPickerOpen(false)}
          latitude={formData.latitude || 5.2045}
          longitude={formData.longitude || 96.7012}
          title={`Pilih Titik Koordinat: ${formData.nama || 'KPM'}`}
          address={formData.alamat || 'Kabupaten Bireuen'}
          isPicker={true}
          onSelectCoordinates={(lat, lng) => {
            setFormData(prev => ({
              ...prev,
              latitude: lat,
              longitude: lng
            }));
          }}
        />
      )}
    </div>
  );
};
