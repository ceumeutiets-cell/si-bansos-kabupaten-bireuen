import React, { useState } from 'react';
import { Kecamatan, Desa, PenerimaBansos, PengaturanSistem } from '../types';
import { Home, Users, Building2, Eye, Printer, FileCheck2, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { PrintHeaderFooter } from '../components/PrintHeaderFooter';
import { triggerPrint } from '../lib/printUtils';

interface DataPerdesaPageProps {
  settings?: PengaturanSistem;
  kecamatanList: Kecamatan[];
  desaList: Desa[];
  penerimaList: PenerimaBansos[];
  user?: any;
  onSelectBeneficiaryDetail: (penerima: PenerimaBansos) => void;
}

export const DataPerdesaPage: React.FC<DataPerdesaPageProps> = ({
  settings,
  kecamatanList,
  desaList,
  penerimaList,
  onSelectBeneficiaryDetail
}) => {
  const [selectedKecId, setSelectedKecId] = useState<string>('');
  const [selectedDesaId, setSelectedDesaId] = useState<string>('');

  const filteredDesa = selectedKecId
    ? desaList.filter(d => d.kecamatan_id === selectedKecId)
    : desaList;

  const filteredPenerima = penerimaList.filter(p => {
    if (selectedKecId && p.kecamatan_id !== selectedKecId) return false;
    if (selectedDesaId && p.desa_id !== selectedDesaId) return false;
    return true;
  });

  const selectedDesa = desaList.find(d => d.id === selectedDesaId);

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
    XLSX.utils.book_append_sheet(wb, ws, 'Penerima_Gampong');
    XLSX.writeFile(wb, `Laporan-Penerima-Bansos-Gampong-${selectedDesa ? selectedDesa.nama : 'Bireuen'}.xlsx`);
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
    doc.text(`LAPORAN DATA PENERIMA BANSOS GAMPONG / DESA ${selectedDesa ? selectedDesa.nama.toUpperCase() : 'BIREUEN'}`, 148, 30, { align: 'center' });

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

    doc.save(`Laporan-Penerima-Bansos-Gampong-${selectedDesa ? selectedDesa.nama : 'Bireuen'}.pdf`);
  };

  return (
    <>
      {/* SCREEN VIEW */}
      <div className="space-y-6 text-white print:hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-md">
          <div>
            <h1 className="text-xl font-bold text-white tracking-wide">Data Perdesa / Gampong</h1>
            <p className="text-xs text-slate-400 mt-1">
              Filter data bantuan sosial berdasarkan Desa/Gampong resmi Kabupaten Bireuen
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
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
              onClick={() => triggerPrint('.hidden.print\\:block', `Laporan Penerima Bansos Gampong ${selectedDesa ? selectedDesa.nama : 'Bireuen'}`)}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
              title="Cetak Laporan ke Printer atau Simpan PDF lewat Browser"
            >
              <Printer className="w-4 h-4 text-emerald-400" />
              <span>Cetak / Print</span>
            </button>
          </div>
        </div>

      {/* Selector Dropdowns */}
      <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
        <div>
          <label className="block text-slate-300 font-semibold mb-1">Pilih Kecamatan</label>
          <select
            value={selectedKecId}
            onChange={e => {
              setSelectedKecId(e.target.value);
              setSelectedDesaId('');
            }}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-emerald-500"
          >
            <option value="">-- Semua Kecamatan --</option>
            {kecamatanList.map(k => (
              <option key={k.id} value={k.id}>{k.nama}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-slate-300 font-semibold mb-1">Pilih Desa / Gampong</label>
          <select
            value={selectedDesaId}
            onChange={e => setSelectedDesaId(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-emerald-500"
          >
            <option value="">-- Semua Desa/Gampong --</option>
            {filteredDesa.map(d => (
              <option key={d.id} value={d.id}>{d.nama}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Village Card Stats if Selected */}
      {selectedDesa && (
        <div className="bg-gradient-to-r from-emerald-950/80 to-slate-900 p-5 rounded-2xl border border-emerald-800/40 flex items-center justify-between text-xs">
          <div>
            <span className="text-[10px] uppercase tracking-wider text-emerald-400 font-bold block mb-0.5">
              Profil Desa / Gampong Terpilih
            </span>
            <h2 className="text-lg font-extrabold text-white">{selectedDesa.nama}</h2>
            <p className="text-slate-300 font-mono text-[11px] mt-0.5">Kode Desa: {selectedDesa.kode}</p>
          </div>

          <div className="text-right">
            <span className="text-slate-400 text-[11px]">Total Penerima Bansos:</span>
            <p className="text-xl font-black text-emerald-400">{filteredPenerima.length} Jiwa</p>
          </div>
        </div>
      )}

      {/* Beneficiaries Table */}
      <div className="bg-slate-900 rounded-3xl border border-slate-800 p-5">
        <h3 className="text-sm font-bold text-white mb-4">
          Daftar Penerima Bantuan Sosial {selectedDesa ? `Gampong ${selectedDesa.nama}` : ''}
        </h3>

        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left text-slate-300">
            <thead className="bg-slate-800 text-slate-200 uppercase font-semibold">
              <tr>
                <th className="py-3.5 px-4">Nama</th>
                <th className="py-3.5 px-4">Kecamatan / Desa</th>
                <th className="py-3.5 px-4">Desil</th>
                <th className="py-3.5 px-4">Jenis Bantuan</th>
                <th className="py-3.5 px-4">Disabilitas</th>
                <th className="py-3.5 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredPenerima.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-500">
                    Tidak ada data penerima bantuan sosial untuk desa yang dipilih.
                  </td>
                </tr>
              ) : (
                filteredPenerima.map(p => (
                  <tr key={p.id} className="hover:bg-slate-800/50">
                    <td className="py-3.5 px-4 font-bold text-white">{p.nama}</td>
                    <td className="py-3.5 px-4">{p.desa_nama || '-'} ({p.kecamatan_nama || '-'})</td>
                    <td className="py-3.5 px-4"><span className="text-emerald-400 font-bold">{p.desil}</span></td>
                    <td className="py-3.5 px-4">{p.jenis_bantuan}</td>
                    <td className="py-3.5 px-4">{p.jenis_disabilitas}</td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => onSelectBeneficiaryDetail(p)}
                        className="px-3 py-1 bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-lg hover:bg-emerald-600 hover:text-white transition-colors"
                      >
                        Detail
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
            title={`LAPORAN DATA PENERIMA BANTUAN SOSIAL ${selectedDesa ? 'GAMPONG ' + selectedDesa.nama.toUpperCase() : 'PERDESA / GAMPONG'}`}
            subtitle="Pemerintah Kabupaten Bireuen - Dinas Sosial"
            settings={settings}
          >
            <table className="w-full text-xs border-collapse border border-slate-900 mt-2">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-900 font-bold text-center">
                  <th className="border border-slate-900 p-2 w-10">NO</th>
                  <th className="border border-slate-900 p-2">NIK</th>
                  <th className="border border-slate-900 p-2">NAMA PENERIMA</th>
                  <th className="border border-slate-900 p-2">GAMPONG / DESA</th>
                  <th className="border border-slate-900 p-2">KECAMATAN</th>
                  <th className="border border-slate-900 p-2">DESIL</th>
                  <th className="border border-slate-900 p-2">JENIS BANTUAN</th>
                </tr>
              </thead>
              <tbody>
                {filteredPenerima.map((p, idx) => (
                  <tr key={p.id || idx} className="border-b border-slate-900">
                    <td className="border border-slate-900 p-2 text-center">{idx + 1}</td>
                    <td className="border border-slate-900 p-2 font-mono text-center">{p.nik}</td>
                    <td className="border border-slate-900 p-2 font-semibold">{p.nama}</td>
                    <td className="border border-slate-900 p-2">{p.desa_nama || '-'}</td>
                    <td className="border border-slate-900 p-2">{p.kecamatan_nama || '-'}</td>
                    <td className="border border-slate-900 p-2 text-center font-bold">{p.desil}</td>
                    <td className="border border-slate-900 p-2">{p.jenis_bantuan}</td>
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
