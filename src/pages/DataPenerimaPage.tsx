import React, { useState } from 'react';
import { 
  PenerimaBansos, 
  Kecamatan, 
  Desa, 
  User, 
  PengaturanSistem,
  FilterState 
} from '../types';
import { 
  Search, 
  Filter, 
  Plus, 
  Download, 
  Printer, 
  Eye, 
  EyeOff, 
  Edit3, 
  Trash2, 
  FileCheck2, 
  RefreshCw,
  MapPin,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { PrintHeaderFooter } from '../components/PrintHeaderFooter';
import { triggerPrint } from '../lib/printUtils';

interface DataPenerimaPageProps {
  user: User;
  settings: PengaturanSistem;
  penerimaList: PenerimaBansos[];
  kecamatanList: Kecamatan[];
  desaList: Desa[];
  onAddClick: () => void;
  onEditClick: (penerima: PenerimaBansos) => void;
  onDetailClick: (penerima: PenerimaBansos) => void;
  onDeleteClick: (penerima: PenerimaBansos) => void;
  onImportClick: () => void;
  title?: string;
  subtitle?: string;
  filterPreset?: Partial<FilterState>;
}

export const DataPenerimaPage: React.FC<DataPenerimaPageProps> = ({
  user,
  settings,
  penerimaList,
  kecamatanList,
  desaList,
  onAddClick,
  onEditClick,
  onDetailClick,
  onDeleteClick,
  onImportClick,
  title = 'Data Penerima Bantuan Sosial',
  subtitle = 'Daftar penerima bansos Kabupaten Bireuen',
  filterPreset
}) => {
  const [filter, setFilter] = useState<FilterState>({
    search: '',
    kecamatan_id: filterPreset?.kecamatan_id || '',
    desa_id: filterPreset?.desa_id || '',
    desil: filterPreset?.desil || '',
    disabilitas: filterPreset?.disabilitas || '',
    jenis_bantuan: filterPreset?.jenis_bantuan || '',
    status_penerima: filterPreset?.status_penerima || '',
    tahun: filterPreset?.tahun || ''
  });

  const [maskNIK, setMaskNIK] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const isDesa = user.role === 'petugas_desa';

  // Dependent village list
  const filteredDesaList = filter.kecamatan_id
    ? desaList.filter(d => d.kecamatan_id === filter.kecamatan_id)
    : desaList;

  // Filter computation
  const filteredData = penerimaList.filter(item => {
    if (isDesa) {
      if (item.kecamatan_id !== user.kecamatan_id || item.desa_id !== user.desa_id) return false;
    }

    if (filter.kecamatan_id && item.kecamatan_id !== filter.kecamatan_id) return false;
    if (filter.desa_id && item.desa_id !== filter.desa_id) return false;
    if (filter.desil && item.desil !== filter.desil) return false;
    if (filter.disabilitas && item.jenis_disabilitas !== filter.disabilitas) return false;
    if (filter.jenis_bantuan && item.jenis_bantuan !== filter.jenis_bantuan) return false;
    if (filter.status_penerima && item.status_penerima !== filter.status_penerima) return false;
    if (filter.tahun && String(item.tahun_penerimaan) !== String(filter.tahun)) return false;

    if (filter.search) {
      const q = filter.search.toLowerCase().trim();
      const matchNik = item.nik.toLowerCase().includes(q);
      const matchKk = item.no_kk.toLowerCase().includes(q);
      const matchNama = item.nama.toLowerCase().includes(q);
      const matchKec = item.kecamatan_nama?.toLowerCase().includes(q);
      const matchDesa = item.desa_nama?.toLowerCase().includes(q);
      return matchNik || matchKk || matchNama || matchKec || matchDesa;
    }

    return true;
  });

  // Pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage) || 1;
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const formatNIK = (nik: string) => {
    if (!maskNIK || user.role === 'admin') return nik;
    if (nik.length < 16) return nik;
    return `${nik.slice(0, 6)}********${nik.slice(14)}`;
  };

  const handleExportExcel = () => {
    const exportRows = filteredData.map((p, idx) => ({
      No: idx + 1,
      NIK: p.nik,
      No_KK: p.no_kk,
      Nama: p.nama,
      Jenis_Kelamin: p.jenis_kelamin,
      Kecamatan: p.kecamatan_nama || '-',
      Desa: p.desa_nama || '-',
      Alamat: p.alamat,
      Desil: p.desil,
      Jenis_Bantuan: p.jenis_bantuan,
      Status_Penerima: p.status_penerima,
      Disabilitas: p.jenis_disabilitas,
      Tahun: p.tahun_penerimaan,
      Latitude: p.latitude || '',
      Longitude: p.longitude || ''
    }));

    const ws = XLSX.utils.json_to_sheet(exportRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Penerima_Bansos');
    XLSX.writeFile(wb, `Export-Penerima-Bansos-Bireuen-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text((settings.nama_instansi || 'PEMERINTAH KABUPATEN BIREUEN').toUpperCase(), 148, 12, { align: 'center' });
    doc.setFontSize(11);
    doc.text((settings.sub_instansi || 'DINAS SOSIAL KABUPATEN BIREUEN').toUpperCase(), 148, 17, { align: 'center' });
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(settings.alamat || 'Jl. Mayjen T. Hamzah Bendahara No. 12, Bireuen, Aceh', 148, 21, { align: 'center' });
    doc.line(15, 24, 282, 24);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('LAPORAN DATA PENERIMA BANTUAN SOSIAL', 148, 30, { align: 'center' });

    const rows = filteredData.map((p, idx) => [
      idx + 1,
      p.nik,
      p.no_kk,
      p.nama,
      p.kecamatan_nama || '-',
      p.desa_nama || '-',
      p.desil,
      p.jenis_bantuan,
      p.jenis_disabilitas,
      p.status_penerima
    ]);

    autoTable(doc, {
      startY: 35,
      head: [['No', 'NIK', 'KK', 'Nama Penerima', 'Kecamatan', 'Desa', 'Desil', 'Bantuan', 'Disabilitas', 'Status']],
      body: rows,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255] }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 10;
    const dateStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

    doc.setFontSize(9);
    doc.text(`Bireuen, ${dateStr}`, 220, finalY);
    doc.text(settings.jabatan_kepala_dinas || 'Kepala Dinas Sosial', 220, finalY + 5);
    doc.text('Kabupaten Bireuen', 220, finalY + 9);
    doc.setFont('helvetica', 'bold');
    doc.text(settings.nama_kepala_dinas || 'Dr. Alfian', 220, finalY + 25);
    doc.setFont('helvetica', 'normal');
    doc.text(`NIP. ${settings.nip_kepala_dinas}`, 220, finalY + 29);

    doc.save(`Laporan-Penerima-Bansos-Bireuen-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  return (
    <>
      {/* SCREEN VIEW */}
      <div className="space-y-6 text-white print:hidden">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-md">
        <div>
          <h1 className="text-xl font-extrabold text-white tracking-wide">{title}</h1>
          <p className="text-xs text-slate-400 mt-1">{subtitle}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setMaskNIK(!maskNIK)}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
            title="Toggle Penyamaran NIK"
          >
            {maskNIK ? <EyeOff className="w-4 h-4 text-amber-400" /> : <Eye className="w-4 h-4 text-emerald-400" />}
            <span>{maskNIK ? 'NIK Tersamar' : 'NIK Lengkap'}</span>
          </button>

          <button
            onClick={onImportClick}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Import Excel</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
            title="Download Spreadsheet Excel (.xlsx)"
          >
            <Download className="w-4 h-4" />
            <span>Export Excel</span>
          </button>

          <button
            onClick={handleExportPDF}
            className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
            title="Download Dokumen PDF Resmi"
          >
            <FileCheck2 className="w-4 h-4" />
            <span>Download PDF</span>
          </button>

          <button
            onClick={() => triggerPrint('.hidden.print\\:block', title || 'Laporan Data Penerima Bantuan Sosial')}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
            title="Cetak Laporan ke Printer atau Simpan PDF lewat Browser"
          >
            <Printer className="w-4 h-4 text-emerald-400" />
            <span>Cetak / Print</span>
          </button>

          <button
            onClick={onAddClick}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-lg transition-colors flex items-center gap-1.5"
            id="btn-add-penerima"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Data</span>
          </button>
        </div>
      </div>

      {/* Comprehensive Multi-Filter Bar */}
      <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-md space-y-4 text-xs">
        
        {/* Search Bar */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={filter.search}
            onChange={e => {
              setFilter({ ...filter, search: e.target.value });
              setCurrentPage(1);
            }}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-white focus:outline-none focus:border-emerald-500"
            placeholder="Pencarian cepat berdasarkan NIK, Nomor KK, Nama, Kecamatan, atau Desa..."
            id="input-search-penerima"
          />
        </div>

        {/* Dropdown Filters */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          
          {!isDesa && (
            <div>
              <label className="block text-[11px] text-slate-400 font-medium mb-1">Kecamatan</label>
              <select
                value={filter.kecamatan_id}
                onChange={e => {
                  setFilter({ ...filter, kecamatan_id: e.target.value, desa_id: '' });
                  setCurrentPage(1);
                }}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-2 text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="">Semua Kecamatan</option>
                {kecamatanList.map(k => (
                  <option key={k.id} value={k.id}>{k.nama}</option>
                ))}
              </select>
            </div>
          )}

          {!isDesa && (
            <div>
              <label className="block text-[11px] text-slate-400 font-medium mb-1">Desa/Gampong</label>
              <select
                value={filter.desa_id}
                onChange={e => {
                  setFilter({ ...filter, desa_id: e.target.value });
                  setCurrentPage(1);
                }}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-2 text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="">Semua Desa</option>
                {filteredDesaList.map(d => (
                  <option key={d.id} value={d.id}>{d.nama}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-[11px] text-slate-400 font-medium mb-1">Kategori Desil</label>
            <select
              value={filter.desil}
              onChange={e => {
                setFilter({ ...filter, desil: e.target.value });
                setCurrentPage(1);
              }}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-2 text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="">Semua Desil</option>
              {Array.from({ length: 10 }).map((_, i) => (
                <option key={i} value={`Desil ${i + 1}`}>Desil {i + 1}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] text-slate-400 font-medium mb-1">Disabilitas</label>
            <select
              value={filter.disabilitas}
              onChange={e => {
                setFilter({ ...filter, disabilitas: e.target.value });
                setCurrentPage(1);
              }}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-2 text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="">Semua Disabilitas</option>
              <option value="Tidak ada disabilitas">Tidak ada disabilitas</option>
              <option value="Disabilitas fisik">Disabilitas fisik</option>
              <option value="Disabilitas sensorik penglihatan">Disabilitas penglihatan</option>
              <option value="Disabilitas sensorik pendengaran">Disabilitas pendengaran</option>
              <option value="Disabilitas intelektual">Disabilitas intelektual</option>
              <option value="Disabilitas mental">Disabilitas mental</option>
              <option value="Disabilitas ganda">Disabilitas ganda</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] text-slate-400 font-medium mb-1">Jenis Bantuan</label>
            <select
              value={filter.jenis_bantuan}
              onChange={e => {
                setFilter({ ...filter, jenis_bantuan: e.target.value });
                setCurrentPage(1);
              }}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-2 text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="">Semua Bantuan</option>
              <option value="PKH (Program Keluarga Harapan)">PKH</option>
              <option value="BPNT (Bantuan Pangan Non Tunai)">BPNT</option>
              <option value="BLT Desa / Gampong">BLT Desa</option>
              <option value="Bansos Disabilitas">Bansos Disabilitas</option>
              <option value="RTLH (Rumah Tidak Layak Huni)">RTLH</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] text-slate-400 font-medium mb-1">Reset Filter</label>
            <button
              onClick={() => {
                setFilter({
                  search: '',
                  kecamatan_id: '',
                  desa_id: '',
                  desil: '',
                  disabilitas: '',
                  jenis_bantuan: '',
                  status_penerima: '',
                  tahun: ''
                });
                setCurrentPage(1);
              }}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold flex items-center justify-center gap-1 border border-slate-700"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>

        </div>

      </div>

      {/* Main Data Table */}
      <div className="bg-slate-900 rounded-3xl border border-slate-800 shadow-xl overflow-hidden">
        
        <div className="p-4 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Menampilkan <strong>{paginatedData.length}</strong> dari <strong>{filteredData.length}</strong> data terfilter</span>
          <span>Halaman {currentPage} dari {totalPages}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-800/80 text-slate-200 uppercase tracking-wider font-semibold border-b border-slate-700">
              <tr>
                <th className="py-3.5 px-4 text-center">No</th>
                <th className="py-3.5 px-4">Nama Penerima / NIK</th>
                <th className="py-3.5 px-4">Kecamatan & Desa</th>
                <th className="py-3.5 px-4 text-center">Desil</th>
                <th className="py-3.5 px-4">Jenis Bantuan</th>
                <th className="py-3.5 px-4">Verifikasi Desa</th>
                <th className="py-3.5 px-4">Disabilitas</th>
                <th className="py-3.5 px-4 text-center">Koordinat</th>
                <th className="py-3.5 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-500">
                    Tidak ada data penerima bantuan sosial yang sesuai dengan filter.
                  </td>
                </tr>
              ) : (
                paginatedData.map((item, index) => (
                  <tr key={item.id} className="hover:bg-slate-800/50 transition-colors">
                    
                    <td className="py-3.5 px-4 text-center font-medium text-slate-400">
                      {(currentPage - 1) * itemsPerPage + index + 1}
                    </td>

                    <td className="py-3.5 px-4">
                      <p className="font-bold text-white text-sm">{item.nama}</p>
                      <p className="text-[11px] font-mono text-slate-400">
                        NIK: {formatNIK(item.nik)}
                      </p>
                    </td>

                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-slate-200">{item.desa_nama || '-'}</p>
                      <p className="text-[11px] text-slate-400">{item.kecamatan_nama || '-'}</p>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span className="bg-emerald-500/20 text-emerald-300 font-bold px-2.5 py-1 rounded-lg border border-emerald-500/30">
                        {item.desil}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-white">{item.jenis_bantuan}</p>
                      <span className="text-[10px] text-slate-400">{item.status_penerima} ({item.tahun_penerimaan})</span>
                    </td>

                    <td className="py-3.5 px-4">
                      {(!item.status_verifikasi || item.status_verifikasi === 'Disetujui') && (
                        <span className="px-2 py-0.5 bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 rounded text-[10px] font-bold">
                          Disetujui
                        </span>
                      )}
                      {item.status_verifikasi === 'Menunggu Verifikasi' && (
                        <span className="px-2 py-0.5 bg-amber-500/15 text-amber-300 border border-amber-500/30 rounded text-[10px] font-bold">
                          Menunggu
                        </span>
                      )}
                      {item.status_verifikasi === 'Perlu Perbaikan' && (
                        <span className="px-2 py-0.5 bg-sky-500/15 text-sky-300 border border-sky-500/30 rounded text-[10px] font-bold">
                          Revisi
                        </span>
                      )}
                      {item.status_verifikasi === 'Ditolak' && (
                        <span className="px-2 py-0.5 bg-rose-500/15 text-rose-300 border border-rose-500/30 rounded text-[10px] font-bold">
                          Ditolak
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`inline-block px-2 py-0.5 rounded text-[11px] ${
                        item.jenis_disabilitas === 'Tidak ada disabilitas'
                          ? 'text-slate-400'
                          : 'bg-purple-500/20 text-purple-300 font-semibold border border-purple-500/30'
                      }`}>
                        {item.jenis_disabilitas}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      {item.latitude && item.longitude ? (
                        <span className="text-[11px] text-emerald-400 font-mono flex items-center justify-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          Ada GPS
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-500 italic">Belum Set</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center space-x-1.5">
                        <button
                          onClick={() => onDetailClick(item)}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-sky-400 rounded-lg transition-colors"
                          title="Lihat Detail"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => onEditClick(item)}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-lg transition-colors"
                          title="Edit Data"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => onDeleteClick(item)}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-rose-400 rounded-lg transition-colors"
                          title="Hapus Data"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg disabled:opacity-40 transition-colors flex items-center gap-1"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Sebelumnya</span>
          </button>

          <span className="text-slate-400">
            Halaman <strong className="text-white">{currentPage}</strong> dari <strong className="text-white">{totalPages}</strong>
          </span>

          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg disabled:opacity-40 transition-colors flex items-center gap-1"
          >
            <span>Selanjutnya</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

      </div>
      </div>

      {/* PRINT-ONLY OFFICIAL REPORT VIEW WITH KOP SURAT */}
      <div className="hidden print:block bg-white text-slate-900 p-4">
        <PrintHeaderFooter
          title={title || "LAPORAN DATA PENERIMA BANTUAN SOSIAL"}
          subtitle={subtitle || "Dinas Sosial Kabupaten Bireuen"}
          settings={settings}
        >
          <table className="w-full text-xs border-collapse border border-slate-900 mt-4">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-900 font-bold text-center">
                <th className="border border-slate-900 p-2 w-10">NO</th>
                <th className="border border-slate-900 p-2">NIK</th>
                <th className="border border-slate-900 p-2">NO. KK</th>
                <th className="border border-slate-900 p-2">NAMA PENERIMA</th>
                <th className="border border-slate-900 p-2">KECAMATAN</th>
                <th className="border border-slate-900 p-2">GAMPONG / DESA</th>
                <th className="border border-slate-900 p-2">DESIL</th>
                <th className="border border-slate-900 p-2">JENIS BANTUAN</th>
                <th className="border border-slate-900 p-2">STATUS</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((item, index) => (
                <tr key={item.id || index} className="border-b border-slate-900">
                  <td className="border border-slate-900 p-2 text-center">{index + 1}</td>
                  <td className="border border-slate-900 p-2 font-mono text-center">{!maskNIK ? item.nik : item.nik.slice(0, 6) + '**********'}</td>
                  <td className="border border-slate-900 p-2 font-mono text-center">{!maskNIK ? item.no_kk : item.no_kk.slice(0, 6) + '**********'}</td>
                  <td className="border border-slate-900 p-2 font-semibold">{item.nama}</td>
                  <td className="border border-slate-900 p-2">{item.kecamatan_nama || '-'}</td>
                  <td className="border border-slate-900 p-2">{item.desa_nama || '-'}</td>
                  <td className="border border-slate-900 p-2 text-center font-bold">{item.desil}</td>
                  <td className="border border-slate-900 p-2">{item.jenis_bantuan}</td>
                  <td className="border border-slate-900 p-2 text-center">{item.status_penerima}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </PrintHeaderFooter>
      </div>
    </>
  );
};
