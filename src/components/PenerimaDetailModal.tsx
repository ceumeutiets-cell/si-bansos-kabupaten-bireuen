import React from 'react';
import { PenerimaBansos, PengaturanSistem } from '../types';
import { 
  X, 
  MapPin, 
  Edit3, 
  Printer, 
  FileCheck2, 
  User, 
  Calendar, 
  Home, 
  Phone, 
  HeartHandshake, 
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { KopSurat } from './PrintHeaderFooter';
import { triggerPrint } from '../lib/printUtils';

interface PenerimaDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  penerima: PenerimaBansos | null;
  settings: PengaturanSistem;
  onEdit?: (penerima: PenerimaBansos) => void;
  onOpenMap?: (lat: number, lng: number, title: string, addr: string) => void;
}

export const PenerimaDetailModal: React.FC<PenerimaDetailModalProps> = ({
  isOpen,
  onClose,
  penerima,
  settings,
  onEdit,
  onOpenMap
}) => {
  if (!isOpen || !penerima) return null;

  const handlePrintCard = () => {
    triggerPrint('.fixed.inset-0', `Kartu Detail Penerima Bansos - ${penerima.nama}`);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Header
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text((settings.nama_instansi || 'PEMERINTAH KABUPATEN BIREUEN').toUpperCase(), 105, 15, { align: 'center' });
    doc.setFontSize(12);
    doc.text((settings.sub_instansi || 'DINAS SOSIAL KABUPATEN BIREUEN').toUpperCase(), 105, 21, { align: 'center' });
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(settings.alamat || 'Jl. Mayjen T. Hamzah Bendahara No. 12, Bireuen, Aceh', 105, 26, { align: 'center' });

    doc.line(15, 29, 195, 29);

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('KARTU DATA DETAIL PENERIMA BANTUAN SOSIAL', 105, 36, { align: 'center' });

    autoTable(doc, {
      startY: 42,
      head: [['Kategori', 'Informasi Penerima']],
      body: [
        ['Nama Lengkap', penerima.nama],
        ['NIK', penerima.nik],
        ['Nomor KK', penerima.no_kk],
        ['Jenis Kelamin', penerima.jenis_kelamin],
        ['Tempat, Tanggal Lahir', `${penerima.tempat_lahir}, ${penerima.tanggal_lahir}`],
        ['Kecamatan', penerima.kecamatan_nama || '-'],
        ['Desa / Gampong', penerima.desa_nama || '-'],
        ['Alamat', penerima.alamat],
        ['Kategori Desil', penerima.desil],
        ['Jenis Bantuan', penerima.jenis_bantuan],
        ['Status Penerima', penerima.status_penerima],
        ['Jenis Disabilitas', penerima.jenis_disabilitas],
        ['Sumber Data', penerima.sumber_data],
        ['Tahun Penerimaan', String(penerima.tahun_penerimaan)],
        ['Titik Koordinat', `${penerima.latitude || '-'}, ${penerima.longitude || '-'}`],
      ],
      theme: 'grid',
      styles: { fontSize: 9 },
      headStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255] }
    });

    // Signature
    const finalY = (doc as any).lastAutoTable.finalY + 15;
    const dateStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

    doc.setFontSize(9);
    doc.text(`Bireuen, ${dateStr}`, 140, finalY);
    doc.text(settings.jabatan_kepala_dinas || 'Kepala Dinas Sosial', 140, finalY + 5);
    doc.text('Kabupaten Bireuen', 140, finalY + 10);

    doc.setFont('helvetica', 'bold');
    doc.text(settings.nama_kepala_dinas || 'Dr. Alfian', 140, finalY + 30);
    doc.setFont('helvetica', 'normal');
    doc.text(`NIP. ${settings.nip_kepala_dinas}`, 140, finalY + 35);

    doc.save(`Detail-Penerima-${penerima.nik}.pdf`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/80 backdrop-blur-xs print:static print:bg-white overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full shadow-2xl my-6 text-white flex flex-col max-h-[90vh] print:max-h-none print:shadow-none print:border-none print:bg-white print:text-black">
        
        {/* KOP SURAT RESMI - TAMPIL SAAT PRINT */}
        <div className="hidden print:block p-6 border-b-2 border-slate-900">
          <KopSurat settings={settings} />
          <div className="text-center mt-2 mb-4">
            <h3 className="text-base font-bold uppercase underline text-slate-900">KARTU DETAIL DATA PENERIMA BANTUAN SOSIAL</h3>
            <p className="text-xs text-slate-600 mt-0.5">Dinas Sosial Kabupaten Bireuen</p>
          </div>
        </div>

        {/* Header Screen */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 print:hidden">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-emerald-600/20 text-emerald-400 rounded-xl border border-emerald-500/30">
              <FileCheck2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Detail Data Penerima Bantuan Sosial</h3>
              <p className="text-xs text-slate-400">SI-BANSOS Kabupaten Bireuen</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Printable Card */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">

          {/* Top Banner Card */}
          <div className="bg-gradient-to-r from-emerald-950/80 to-slate-800 p-5 rounded-2xl border border-emerald-800/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-emerald-500/20 text-emerald-300 text-xs font-bold px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                  {penerima.desil}
                </span>
                <span className="bg-blue-500/20 text-blue-300 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-blue-500/30">
                  {penerima.status_penerima}
                </span>
              </div>
              <h2 className="text-xl font-bold text-white tracking-wide">{penerima.nama}</h2>
              <p className="text-xs text-slate-300 font-mono mt-0.5">NIK: {penerima.nik} | KK: {penerima.no_kk}</p>
            </div>

            <div className="text-right">
              <span className="text-xs text-slate-400 block">Jenis Bantuan:</span>
              <span className="text-sm font-bold text-emerald-400">{penerima.jenis_bantuan}</span>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            
            {/* IDENTITAS */}
            <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/80 space-y-2">
              <h4 className="font-bold text-emerald-400 text-sm flex items-center gap-1.5 border-b border-slate-700 pb-2 mb-2">
                <User className="w-4 h-4" />
                Identitas Diri
              </h4>
              <p><strong className="text-slate-400">Jenis Kelamin:</strong> {penerima.jenis_kelamin}</p>
              <p><strong className="text-slate-400">Tempat, Tgl Lahir:</strong> {penerima.tempat_lahir}, {penerima.tanggal_lahir}</p>
              <p><strong className="text-slate-400">Nomor HP:</strong> {penerima.nomor_hp || '-'}</p>
            </div>

            {/* WILAYAH */}
            <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/80 space-y-2">
              <h4 className="font-bold text-sky-400 text-sm flex items-center gap-1.5 border-b border-slate-700 pb-2 mb-2">
                <Home className="w-4 h-4" />
                Wilayah Administrasi & GIS
              </h4>
              <p><strong className="text-slate-400">Kecamatan:</strong> {penerima.kecamatan_nama || '-'}</p>
              <p><strong className="text-slate-400">Desa / Gampong:</strong> {penerima.desa_nama || '-'}</p>
              <p><strong className="text-slate-400">Alamat:</strong> {penerima.alamat}</p>
              <div className="pt-2 border-t border-slate-700/60 mt-2">
                <p className="flex items-center gap-1 text-slate-300 font-mono text-[11px]">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span><strong>Koordinat:</strong> {penerima.latitude ?? '-'}, {penerima.longitude ?? '-'}</span>
                </p>
                {penerima.latitude && penerima.longitude && (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${penerima.latitude},${penerima.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-sky-400 hover:text-sky-300 font-medium mt-1 transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>Buka Lokasi di Google Maps</span>
                  </a>
                )}
              </div>
            </div>

            {/* DATA SOSIAL */}
            <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/80 space-y-2">
              <h4 className="font-bold text-amber-400 text-sm flex items-center gap-1.5 border-b border-slate-700 pb-2 mb-2">
                <HeartHandshake className="w-4 h-4" />
                Data Sosial & Bantuan
              </h4>
              <p><strong className="text-slate-400">Kategori Desil:</strong> <span className="text-emerald-400 font-bold">{penerima.desil}</span></p>
              <p><strong className="text-slate-400">Sumber Data:</strong> {penerima.sumber_data}</p>
              <p><strong className="text-slate-400">Tahun Penerimaan:</strong> {penerima.tahun_penerimaan}</p>
              {penerima.keterangan_bantuan && (
                <p><strong className="text-slate-400">Keterangan:</strong> {penerima.keterangan_bantuan}</p>
              )}
            </div>

            {/* DISABILITAS */}
            <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/80 space-y-2">
              <h4 className="font-bold text-purple-400 text-sm flex items-center gap-1.5 border-b border-slate-700 pb-2 mb-2">
                <AlertCircle className="w-4 h-4" />
                Status Disabilitas
              </h4>
              <p><strong className="text-slate-400">Kategori:</strong> <span className="font-semibold text-white">{penerima.jenis_disabilitas}</span></p>
            </div>

          </div>

          {/* DOKUMENTASI FOTO */}
          <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/80">
            <h4 className="font-bold text-white text-sm mb-3">Dokumentasi Lapangan</h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold text-slate-300 mb-2">Foto PTKS / Penerima:</p>
                {penerima.foto_ptks ? (
                  <img src={penerima.foto_ptks} alt="Foto PTKS" className="w-full h-48 object-cover rounded-xl border border-slate-600" />
                ) : (
                  <div className="h-48 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center text-slate-500 text-xs">
                    Foto PTKS belum diunggah
                  </div>
                )}
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-300 mb-2">Foto Rumah Tampak Depan:</p>
                {penerima.foto_rumah ? (
                  <img src={penerima.foto_rumah} alt="Foto Rumah" className="w-full h-48 object-cover rounded-xl border border-slate-600" />
                ) : (
                  <div className="h-48 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center text-slate-500 text-xs">
                    Foto rumah belum diunggah
                  </div>
                )}
              </div>
            </div>

            {penerima.keterangan_kondisi_rumah && (
              <p className="text-xs text-slate-300 mt-3 p-3 bg-slate-900/60 rounded-lg border border-slate-700">
                <strong className="text-slate-400">Kondisi Bangunan:</strong> {penerima.keterangan_kondisi_rumah}
              </p>
            )}
          </div>

          {/* TITIK KOORDINAT */}
          <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div>
              <h4 className="font-bold text-emerald-400 text-sm flex items-center gap-1.5 mb-1">
                <MapPin className="w-4 h-4" />
                Titik Koordinat Lokasi
              </h4>
              <p className="text-slate-300 font-mono">
                Latitude: {penerima.latitude || '-'} | Longitude: {penerima.longitude || '-'}
              </p>
            </div>

            {penerima.latitude && penerima.longitude && onOpenMap && (
              <button
                onClick={() => onOpenMap(
                  penerima.latitude!, 
                  penerima.longitude!, 
                  penerima.nama, 
                  `${penerima.desa_nama || ''}, ${penerima.kecamatan_nama || ''}`
                )}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold flex items-center gap-1.5 transition-colors shrink-0"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Lihat di Peta</span>
              </button>
            )}
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 bg-slate-950/60 rounded-b-2xl print:hidden">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl border border-slate-700 transition-colors"
          >
            Kembali
          </button>

          <div className="flex items-center space-x-2">
            {onEdit && (
              <button
                onClick={() => {
                  onClose();
                  onEdit(penerima);
                }}
                className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
              >
                <Edit3 className="w-4 h-4" />
                <span>Edit Data</span>
              </button>
            )}

            <button
              onClick={handleExportPDF}
              className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
            >
              <FileCheck2 className="w-4 h-4" />
              <span>Cetak PDF</span>
            </button>

            <button
              onClick={handlePrintCard}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4" />
              <span>Print Browser</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
