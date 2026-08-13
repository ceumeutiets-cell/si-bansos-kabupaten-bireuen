/**
 * Types & Interfaces for SI-BANSOS Kabupaten Bireuen
 */

export type Role = 'admin' | 'petugas_kabupaten' | 'petugas_desa';

export interface User {
  id: string;
  name: string;
  username: string;
  role: Role;
  kecamatan_id?: string;
  desa_id?: string;
  kecamatan_nama?: string;
  desa_nama?: string;
  status: 'Aktif' | 'Nonaktif';
  must_change_password?: boolean;
  last_login?: string;
  created_at: string;
  updated_at: string;
}

export interface Kecamatan {
  id: string;
  kode: string;
  nama: string;
  status: 'Aktif' | 'Nonaktif';
  jumlah_desa?: number;
}

export interface Desa {
  id: string;
  kecamatan_id: string;
  kode: string;
  nama: string;
  status: 'Aktif' | 'Nonaktif';
}

export type Desil = 'Desil 1' | 'Desil 2' | 'Desil 3' | 'Desil 4' | 'Desil 5' | 'Desil 6' | 'Desil 7' | 'Desil 8' | 'Desil 9' | 'Desil 10';

export type JenisDisabilitas = 
  | 'Tidak ada disabilitas'
  | 'Disabilitas fisik'
  | 'Disabilitas sensorik penglihatan'
  | 'Disabilitas sensorik pendengaran'
  | 'Disabilitas sensorik wicara'
  | 'Disabilitas intelektual'
  | 'Disabilitas mental'
  | 'Disabilitas fisik dan mental'
  | 'Disabilitas ganda'
  | 'Disabilitas lainnya';

export type StatusPenerima = 'Aktif' | 'Terdanai' | 'Proses Validasi' | 'Nonaktif' | 'Usulan Baru';

export type StatusVerifikasi = 'Menunggu Verifikasi' | 'Disetujui' | 'Ditolak' | 'Perlu Perbaikan';

export type JenisBantuan = 
  | 'PKH (Program Keluarga Harapan)'
  | 'BPNT (Bantuan Pangan Non Tunai)'
  | 'BLT Desa / Gampong'
  | 'Bansos Disabilitas'
  | 'Bansos Sembako APBK'
  | 'KIS / PBI-JK'
  | 'RTLH (Rumah Tidak Layak Huni)'
  | 'BST (Bantuan Sosial Tunai)';

export interface PenerimaBansos {
  id: string;
  nik: string;
  no_kk: string;
  nama: string;
  jenis_kelamin: 'Laki-laki' | 'Perempuan';
  tempat_lahir: string;
  tanggal_lahir: string;
  nomor_hp: string;
  kecamatan_id: string;
  kecamatan_nama?: string;
  desa_id: string;
  desa_nama?: string;
  alamat: string;
  keterangan?: string;
  
  // Data Sosial
  desil: Desil;
  jenis_bantuan: JenisBantuan;
  status_penerima: StatusPenerima;
  keterangan_bantuan?: string;
  tahun_penerimaan: number;
  sumber_data: 'DTKS' | 'P3KE' | 'Regsosek' | 'Survey Desa' | 'Usulan Gampong';
  
  // Disabilitas
  jenis_disabilitas: JenisDisabilitas;
  
  // Dokumentasi
  foto_ptks?: string;
  foto_rumah?: string;
  foto_rumah_kondisi?: string;
  keterangan_kondisi_rumah?: string;
  
  // Koordinat
  latitude?: number;
  longitude?: number;
  
  // Verifikasi Data Operator Desa oleh Administrator
  status_verifikasi?: StatusVerifikasi;
  catatan_verifikasi?: string;
  tanggal_verifikasi?: string;
  verified_by?: string;
  diusulkan_oleh?: string;
  tanggal_usulan?: string;

  // Audit
  created_by?: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export interface LogAktivitas {
  id: string;
  user_id: string;
  user_name: string;
  username: string;
  role: Role;
  aktivitas: string;
  modul: string;
  ip_address: string;
  user_agent: string;
  waktu: string;
  keterangan: string;
}

export interface PengaturanSistem {
  id: string;
  nama_instansi: string;
  sub_instansi: string;
  alamat: string;
  logo_kabupaten: string;
  logo_dinsos: string;
  kop_surat?: string;
  nama_kepala_dinas: string;
  jabatan_kepala_dinas: string;
  nip_kepala_dinas: string;
  tanda_tangan?: string;
  stempel?: string;
  header_kegiatan?: string;
}

export interface FilterState {
  search: string;
  kecamatan_id: string;
  desa_id: string;
  desil: string;
  disabilitas: string;
  jenis_bantuan: string;
  status_penerima: string;
  tahun: string;
}
