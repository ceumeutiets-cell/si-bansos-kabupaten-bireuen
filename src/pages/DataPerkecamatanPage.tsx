import React, { useState } from 'react';
import { Kecamatan, Desa, PenerimaBansos, PengaturanSistem } from '../types';
import { Building2, Users, Layers, AlertCircle, ChevronRight, Home, ArrowLeft, Printer, FileCheck2, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { PrintHeaderFooter } from '../components/PrintHeaderFooter';
import { triggerPrint } from '../lib/printUtils';

interface DataPerkecamatanPageProps {
  settings?: PengaturanSistem;
  kecamatanList: Kecamatan[];
  desaList: Desa[];
  penerimaList: PenerimaBansos[];
  onSelectBeneficiaryDetail: (penerima: PenerimaBansos) => void;
}

export const DataPerkecamatanPage: React.FC<DataPerkecamatanPageProps> = ({
  settings,
  kecamatanList,
  desaList,
  penerimaList,
  onSelectBeneficiaryDetail
}) => {
  const [selectedKecId, setSelectedKecId] = useState<string | null>(null);

  const selectedKec = kecamatanList.find(k => k.id === selectedKecId);

  // If a kecamatan is selected, show detail view
  if (selectedKecId && selectedKec) {
    const kecDesaList = desaList.filter(d => d.kecamatan_id === selectedKecId);
    const kecPenerima = penerimaList.filter(p => p.kecamatan_id === selectedKecId);

    // Stats
    const totalPenerima = kecPenerima.length;
    const totalDisabilitas = kecPenerima.filter(p => p.jenis_disabilitas !== 'Tidak ada disabilitas').length;
    const desil1Count = kecPenerima.filter(p => p.desil === 'Desil 1').length;
    const desil2Count = kecPenerima.filter(p => p.desil === 'Desil 2').length;
    const desil3Count = kecPenerima.filter(p => p.desil === 'Desil 3').length;

    const handleExportExcel = () => {
      const rows = kecPenerima.map((p, idx) => ({
        No: idx + 1,
        NIK: p.nik,
        No_KK: p.no_kk,
        Nama: p.nama,
        Kecamatan: p.kecamatan_nama || selectedKec.nama,
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
      XLSX.utils.book_append_sheet(wb, ws, `Penerima_${selectedKec.nama}`);
      XLSX.writeFile(wb, `Laporan-Penerima-Bansos-Kecamatan-${selectedKec.nama}.xlsx`);
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
      doc.text(`LAPORAN DATA PENERIMA BANSOS KECAMATAN ${selectedKec.nama.toUpperCase()}`, 148, 30, { align: 'center' });

      const pdfRows = kecPenerima.map((p, idx) => [
        idx + 1,
        p.nik,
        p.no_kk,
        p.nama,
        p.desa_nama || '-',
        p.desil,
        p.jenis_bantuan,
        p.jenis_disabilitas,
        p.status_penerima
      ]);

      autoTable(doc, {
        startY: 35,
        head: [['No', 'NIK', 'KK', 'Nama Penerima', 'Desa / Gampong', 'Desil', 'Bantuan', 'Disabilitas', 'Status']],
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

      doc.save(`Laporan-Penerima-Bansos-Kecamatan-${selectedKec.nama}.pdf`);
    };

    return (
      <>
        <div className="space-y-6 text-white print:hidden">
        
        {/* Back Button & Header */}
        <div className="flex items-center justify-between bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-md print:hidden">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setSelectedKecId(null)}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition-colors"
              title="Kembali ke Daftar Kecamatan"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-white tracking-wide">{selectedKec.nama}</h1>
              <p className="text-xs text-slate-400">Kode Wilayah: {selectedKec.kode} | Kabupaten Bireuen</p>
            </div>
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
              onClick={() => triggerPrint('.hidden.print\\:block', `Laporan Penerima Bansos Kecamatan ${selectedKec.nama}`)}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
              title="Cetak Laporan ke Printer atau Simpan PDF lewat Browser"
            >
              <Printer className="w-4 h-4 text-emerald-400" />
              <span>Cetak / Print</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800">
            <p className="text-slate-400 font-medium">Total Penerima</p>
            <h3 className="text-2xl font-bold text-emerald-400 mt-1">{totalPenerima} Jiwa</h3>
          </div>

          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800">
            <p className="text-slate-400 font-medium">Jumlah Desa / Gampong</p>
            <h3 className="text-2xl font-bold text-sky-400 mt-1">{kecDesaList.length} Gampong</h3>
          </div>

          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800">
            <p className="text-slate-400 font-medium">Penerima Desil 1–3</p>
            <h3 className="text-2xl font-bold text-amber-400 mt-1">{desil1Count + desil2Count + desil3Count} Jiwa</h3>
          </div>

          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800">
            <p className="text-slate-400 font-medium">Disabilitas</p>
            <h3 className="text-2xl font-bold text-purple-400 mt-1">{totalDisabilitas} Jiwa</h3>
          </div>
        </div>

        {/* List Gampong in Kecamatan */}
        <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-md">
          <h3 className="text-sm font-bold text-white mb-3">Daftar Desa / Gampong di {selectedKec.nama}</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 text-xs">
            {kecDesaList.map(d => {
              const countInDesa = kecPenerima.filter(p => p.desa_id === d.id).length;
              return (
                <div key={d.id} className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/80">
                  <p className="font-semibold text-white">{d.nama}</p>
                  <p className="text-[11px] text-emerald-400 mt-0.5">{countInDesa} Penerima</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Beneficiary List Table */}
        <div className="bg-slate-900 rounded-3xl border border-slate-800 p-5">
          <h3 className="text-sm font-bold text-white mb-4">Daftar Penerima Bantuan Sosial di {selectedKec.nama}</h3>
          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left text-slate-300">
              <thead className="bg-slate-800 text-slate-200 uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">Nama</th>
                  <th className="py-3 px-4">Desa/Gampong</th>
                  <th className="py-3 px-4">Desil</th>
                  <th className="py-3 px-4">Bantuan</th>
                  <th className="py-3 px-4">Disabilitas</th>
                  <th className="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {kecPenerima.map(p => (
                  <tr key={p.id} className="hover:bg-slate-800/50">
                    <td className="py-3 px-4 font-bold text-white">{p.nama}</td>
                    <td className="py-3 px-4">{p.desa_nama || '-'}</td>
                    <td className="py-3 px-4"><span className="text-emerald-400 font-bold">{p.desil}</span></td>
                    <td className="py-3 px-4">{p.jenis_bantuan}</td>
                    <td className="py-3 px-4">{p.jenis_disabilitas}</td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => onSelectBeneficiaryDetail(p)}
                        className="px-3 py-1 bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-lg hover:bg-emerald-600 hover:text-white transition-colors"
                      >
                        Detail
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* PRINT-ONLY VIEW WITH OFFICIAL KOP SURAT */}
      <div className="hidden print:block bg-white text-slate-900 p-4">
        {settings && (
          <PrintHeaderFooter
            title={`LAPORAN PENERIMA BANTUAN SOSIAL KECAMATAN ${selectedKec.nama.toUpperCase()}`}
            subtitle={`Kode Wilayah: ${selectedKec.kode} | Kabupaten Bireuen`}
            settings={settings}
          >
            <div className="mb-4 text-xs">
              <p><strong>Total Penerima:</strong> {totalPenerima} Jiwa</p>
              <p><strong>Jumlah Desa / Gampong:</strong> {kecDesaList.length} Gampong</p>
            </div>

            <table className="w-full text-xs border-collapse border border-slate-900 mt-2">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-900 font-bold text-center">
                  <th className="border border-slate-900 p-2 w-10">NO</th>
                  <th className="border border-slate-900 p-2">NIK</th>
                  <th className="border border-slate-900 p-2">NAMA PENERIMA</th>
                  <th className="border border-slate-900 p-2">DESA / GAMPONG</th>
                  <th className="border border-slate-900 p-2">DESIL</th>
                  <th className="border border-slate-900 p-2">JENIS BANTUAN</th>
                  <th className="border border-slate-900 p-2">DISABILITAS</th>
                </tr>
              </thead>
              <tbody>
                {kecPenerima.map((p, idx) => (
                  <tr key={p.id || idx} className="border-b border-slate-900">
                    <td className="border border-slate-900 p-2 text-center">{idx + 1}</td>
                    <td className="border border-slate-900 p-2 font-mono text-center">{p.nik}</td>
                    <td className="border border-slate-900 p-2 font-semibold">{p.nama}</td>
                    <td className="border border-slate-900 p-2">{p.desa_nama || '-'}</td>
                    <td className="border border-slate-900 p-2 text-center font-bold">{p.desil}</td>
                    <td className="border border-slate-900 p-2">{p.jenis_bantuan}</td>
                    <td className="border border-slate-900 p-2">{p.jenis_disabilitas}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </PrintHeaderFooter>
        )}
      </div>
    </>
    );
  }

  // List All 17 Kecamatans
  return (
    <div className="space-y-6 text-white">
      
      <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-md">
        <h1 className="text-xl font-bold text-white tracking-wide">Data Perkecamatan (17 Kecamatan)</h1>
        <p className="text-xs text-slate-400 mt-1">
          Pilih salah satu kecamatan dari 17 kecamatan Kabupaten Bireuen untuk melihat rincian gampong dan data penerima
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {kecamatanList.map(kec => {
          const kecDesaCount = desaList.filter(d => d.kecamatan_id === kec.id).length;
          const kecPenerimaCount = penerimaList.filter(p => p.kecamatan_id === kec.id).length;
          const desil1Count = penerimaList.filter(p => p.kecamatan_id === kec.id && p.desil === 'Desil 1').length;

          return (
            <div
              key={kec.id}
              onClick={() => setSelectedKecId(kec.id)}
              className="bg-slate-900 p-5 rounded-2xl border border-slate-800 hover:border-emerald-500/60 transition-all cursor-pointer shadow-md group"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="p-2.5 bg-emerald-600/20 text-emerald-400 rounded-xl border border-emerald-500/30">
                  <Building2 className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-mono bg-slate-800 text-slate-400 px-2 py-0.5 rounded-md border border-slate-700">
                  {kec.kode}
                </span>
              </div>

              <h3 className="text-base font-bold text-white group-hover:text-emerald-400 transition-colors">
                {kec.nama}
              </h3>

              <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-800 text-[11px] text-center">
                <div className="bg-slate-800/60 p-2 rounded-lg">
                  <p className="text-slate-400">Penerima</p>
                  <p className="font-bold text-emerald-400 mt-0.5">{kecPenerimaCount}</p>
                </div>
                <div className="bg-slate-800/60 p-2 rounded-lg">
                  <p className="text-slate-400">Gampong</p>
                  <p className="font-bold text-sky-400 mt-0.5">{kecDesaCount}</p>
                </div>
                <div className="bg-slate-800/60 p-2 rounded-lg">
                  <p className="text-slate-400">Desil 1</p>
                  <p className="font-bold text-amber-400 mt-0.5">{desil1Count}</p>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-end text-xs text-emerald-400 font-medium group-hover:translate-x-1 transition-transform">
                <span>Lihat Detail</span>
                <ChevronRight className="w-4 h-4 ml-1" />
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
