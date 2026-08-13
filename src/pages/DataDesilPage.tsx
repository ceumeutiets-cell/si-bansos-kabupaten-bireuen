import React, { useState } from 'react';
import { PenerimaBansos, PengaturanSistem } from '../types';
import { Layers, Users, Eye, Search, Filter, Printer, FileCheck2, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { PrintHeaderFooter } from '../components/PrintHeaderFooter';
import { triggerPrint } from '../lib/printUtils';

interface DataDesilPageProps {
  settings?: PengaturanSistem;
  penerimaList: PenerimaBansos[];
  onSelectBeneficiaryDetail: (penerima: PenerimaBansos) => void;
}

export const DataDesilPage: React.FC<DataDesilPageProps> = ({
  settings,
  penerimaList,
  onSelectBeneficiaryDetail
}) => {
  const [selectedDesil, setSelectedDesil] = useState<string>('Desil 1');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const desilList = Array.from({ length: 10 }).map((_, i) => `Desil ${i + 1}`);

  // Count by desil
  const desilCounts: Record<string, number> = {};
  desilList.forEach(d => {
    desilCounts[d] = penerimaList.filter(p => p.desil === d).length;
  });

  const filteredPenerima = penerimaList
    .filter(p => p.desil === selectedDesil)
    .filter(p => {
      if (!searchTerm) return true;
      const q = searchTerm.toLowerCase();
      return p.nama.toLowerCase().includes(q) || p.nik.includes(q) || (p.kecamatan_nama && p.kecamatan_nama.toLowerCase().includes(q));
    });

  const handleExportExcel = () => {
    const rows = filteredPenerima.map((p, idx) => ({
      No: idx + 1,
      NIK: p.nik,
      No_KK: p.no_kk,
      Nama: p.nama,
      Kecamatan: p.kecamatan_nama || '-',
      Desa: p.desa_nama || '-',
      Alamat: p.alamat,
      Desil: p.desil,
      Jenis_Bantuan: p.jenis_bantuan,
      Status: p.status_penerima,
      Disabilitas: p.jenis_disabilitas,
      Tahun: p.tahun_penerimaan
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, selectedDesil);
    XLSX.writeFile(wb, `Laporan-Penerima-Bansos-${selectedDesil.replace(' ', '_')}.xlsx`);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text((settings?.nama_instansi || 'PEMERINTAH KABUPATEN BIREUEN').toUpperCase(), 148, 12, { align: 'center' });
    doc.setFontSize(11);
    doc.text((settings?.sub_instansi || 'DINAS SOSIAL KABUPATEN BIREUEN').toUpperCase(), 148, 17, { align: 'center' });
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(settings?.alamat || 'Jl. Mayjen T. Hamzah Bendahara No. 12, Bireuen, Aceh', 148, 21, { align: 'center' });
    doc.line(15, 24, 282, 24);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`LAPORAN DATA PENERIMA BANTUAN SOSIAL KATEGORI ${selectedDesil.toUpperCase()}`, 148, 30, { align: 'center' });

    const pdfRows = filteredPenerima.map((p, idx) => [
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
      head: [['No', 'NIK', 'KK', 'Nama Penerima', 'Kecamatan', 'Desa / Gampong', 'Desil', 'Bantuan', 'Disabilitas', 'Status']],
      body: pdfRows,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255] }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 10;
    const dateStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

    doc.setFontSize(9);
    doc.text(`Bireuen, ${dateStr}`, 220, finalY);
    doc.text(settings?.jabatan_kepala_dinas || 'Kepala Dinas Sosial', 220, finalY + 5);
    doc.text('Kabupaten Bireuen', 220, finalY + 9);
    doc.setFont('helvetica', 'bold');
    doc.text(settings?.nama_kepala_dinas || 'Dr. Alfian', 220, finalY + 25);
    doc.setFont('helvetica', 'normal');
    doc.text(`NIP. ${settings?.nip_kepala_dinas || ''}`, 220, finalY + 29);

    doc.save(`Laporan-Penerima-Bansos-${selectedDesil.replace(' ', '_')}.pdf`);
  };

  return (
    <>
      {/* SCREEN VIEW */}
      <div className="space-y-6 text-white print:hidden">
        
        {/* Header Banner Bento */}
        <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <Layers className="w-4 h-4" />
              <span>Kategori Kesejahteraan Sosial</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Data Penerima Bansos Berdasarkan Desil (1–10)
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              Klasifikasi tingkat kesejahteraan rumah tangga penerima bantuan sosial Kabupaten Bireuen
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
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
              onClick={() => triggerPrint('.hidden.print\\:block', `Laporan Penerima Bansos Kategori ${selectedDesil}`)}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
              title="Cetak Laporan ke Printer atau Simpan PDF lewat Browser"
            >
              <Printer className="w-4 h-4 text-emerald-400" />
              <span>Cetak / Print</span>
            </button>
          </div>
        </div>

      {/* Desil Selector Bento Grid Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {desilList.map(desil => {
          const isSelected = selectedDesil === desil;
          const count = desilCounts[desil] || 0;
          return (
            <button
              key={desil}
              onClick={() => setSelectedDesil(desil)}
              className={`p-4 rounded-2xl border text-left transition-all ${
                isSelected
                  ? 'bg-amber-500/20 border-amber-500/60 ring-2 ring-amber-500/30'
                  : 'bg-slate-900/80 hover:bg-slate-900 border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold ${isSelected ? 'text-amber-300' : 'text-slate-400'}`}>
                  {desil}
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                  isSelected ? 'bg-amber-500/30 text-amber-200' : 'bg-slate-800 text-slate-400'
                }`}>
                  {count} Jiwa
                </span>
              </div>
              <p className="text-lg font-extrabold text-white mt-2">{count}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {desil === 'Desil 1' ? 'Sangat Miskin' : desil === 'Desil 2' ? 'Miskin' : desil === 'Desil 3' ? 'Hampir Miskin' : desil === 'Desil 4' ? 'Rentan Miskin' : 'Kesejahteraan Menengah'}
              </p>
            </button>
          );
        })}
      </div>

      {/* Selected Desil Beneficiaries Table */}
      <div className="bg-slate-900/80 rounded-3xl border border-slate-800/80 p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-400" />
              Daftar Penerima Bansos ({selectedDesil})
            </h3>
            <p className="text-xs text-slate-400">Menampilkan {filteredPenerima.length} penerima terdaftar</p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cari Nama / NIK..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left text-slate-300">
            <thead className="bg-slate-800 text-slate-200 uppercase font-semibold">
              <tr>
                <th className="py-3 px-4 rounded-l-xl">Nama Lengkap</th>
                <th className="py-3 px-4">NIK</th>
                <th className="py-3 px-4">Kecamatan</th>
                <th className="py-3 px-4">Desa / Gampong</th>
                <th className="py-3 px-4">Jenis Bantuan</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 rounded-r-xl text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredPenerima.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    Tidak ada data penerima ditemukan untuk {selectedDesil}
                  </td>
                </tr>
              ) : (
                filteredPenerima.map(item => (
                  <tr key={item.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="py-3 px-4 font-semibold text-white">{item.nama}</td>
                    <td className="py-3 px-4 font-mono text-slate-400">{item.nik}</td>
                    <td className="py-3 px-4 text-slate-300">{item.kecamatan_nama || '-'}</td>
                    <td className="py-3 px-4 text-slate-300">{item.desa_nama || '-'}</td>
                    <td className="py-3 px-4 font-medium text-emerald-400">{item.jenis_bantuan}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        {item.status_penerima}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => onSelectBeneficiaryDetail(item)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-xs text-amber-300 rounded-lg border border-slate-700 flex items-center gap-1 ml-auto"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Detail</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      </div>

      {/* PRINT-ONLY VIEW WITH OFFICIAL KOP SURAT */}
      <div className="hidden print:block bg-white text-slate-900 p-4">
        {settings && (
          <PrintHeaderFooter
            title={`LAPORAN DATA PENERIMA BANTUAN SOSIAL KATEGORI ${selectedDesil.toUpperCase()}`}
            subtitle="Pemerintah Kabupaten Bireuen - Dinas Sosial"
            settings={settings}
          >
            <table className="w-full text-xs border-collapse border border-slate-900 mt-2">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-900 font-bold text-center">
                  <th className="border border-slate-900 p-2 w-10">NO</th>
                  <th className="border border-slate-900 p-2">NIK</th>
                  <th className="border border-slate-900 p-2">NAMA PENERIMA</th>
                  <th className="border border-slate-900 p-2">KECAMATAN</th>
                  <th className="border border-slate-900 p-2">GAMPONG / DESA</th>
                  <th className="border border-slate-900 p-2">JENIS BANTUAN</th>
                  <th className="border border-slate-900 p-2">STATUS</th>
                </tr>
              </thead>
              <tbody>
                {filteredPenerima.map((item, idx) => (
                  <tr key={item.id || idx} className="border-b border-slate-900">
                    <td className="border border-slate-900 p-2 text-center">{idx + 1}</td>
                    <td className="border border-slate-900 p-2 font-mono text-center">{item.nik}</td>
                    <td className="border border-slate-900 p-2 font-semibold">{item.nama}</td>
                    <td className="border border-slate-900 p-2">{item.kecamatan_nama || '-'}</td>
                    <td className="border border-slate-900 p-2">{item.desa_nama || '-'}</td>
                    <td className="border border-slate-900 p-2">{item.jenis_bantuan}</td>
                    <td className="border border-slate-900 p-2 text-center">{item.status_penerima}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </PrintHeaderFooter>
        )}
      </div>
    </>
  );
};
