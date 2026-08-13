import React, { useState } from 'react';
import { X, FileSpreadsheet, Download, Upload, AlertCircle, CheckCircle2 } from 'lucide-react';
import * as XLSX from 'xlsx';

interface ImportExcelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSubmit: (items: any[]) => Promise<any>;
}

export const ImportExcelModal: React.FC<ImportExcelModalProps> = ({
  isOpen,
  onClose,
  onImportSubmit
}) => {
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [fileInfo, setFileInfo] = useState<{ name: string; size: number } | null>(null);
  const [validationSummary, setValidationSummary] = useState<{
    valid: number;
    failed: number;
    errors: { row: number; reason: string; nama?: string }[];
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleDownloadTemplate = () => {
    const templateRows = [
      {
        nik: '1111091204750001',
        no_kk: '1111090101150042',
        nama: 'Ahmad Abdullah',
        jenis_kelamin: 'Laki-laki',
        tempat_lahir: 'Bireuen',
        tanggal_lahir: '1980-05-12',
        kecamatan: 'Kota Juang',
        desa: 'Bireuen Meunasah Capa',
        alamat: 'Dusun Mulia No 10',
        desil: 'Desil 1',
        jenis_disabilitas: 'Tidak ada disabilitas',
        jenis_bantuan: 'PKH (Program Keluarga Harapan)',
        keterangan: 'Survei Lapangan 2026',
        latitude: 5.2045,
        longitude: 96.7012
      },
      {
        nik: '1111122508820003',
        no_kk: '1111121003180011',
        nama: 'Siti Aminah',
        jenis_kelamin: 'Perempuan',
        tempat_lahir: 'Peusangan',
        tanggal_lahir: '1985-08-20',
        kecamatan: 'Peusangan',
        desa: 'Krueng Baro Mesjid',
        alamat: 'Jl. Utama Krueng Baro',
        desil: 'Desil 2',
        jenis_disabilitas: 'Disabilitas fisik',
        jenis_bantuan: 'BPNT (Bantuan Pangan Non Tunai)',
        keterangan: 'Sembako Beras',
        latitude: 5.2189,
        longitude: 96.7823
      }
    ];

    const ws = XLSX.utils.json_to_sheet(templateRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template_Penerima_Bansos');
    XLSX.writeFile(wb, 'Template_Import_SI-BANSOS_Bireuen.xlsx');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileInfo({ name: file.name, size: file.size });
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheet];
        const json = XLSX.utils.sheet_to_json(worksheet);

        setParsedData(json);
        validateRows(json);
      } catch (err) {
        alert('Gagal membaca file Excel. Pastikan file berformat .xlsx atau .xls valid.');
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const validateRows = (rows: any[]) => {
    let valid = 0;
    let failed = 0;
    const errors: { row: number; reason: string; nama?: string }[] = [];

    rows.forEach((row, idx) => {
      const rowNum = idx + 2; // header line offset
      const nik = String(row.nik || '').replace(/\D/g, '');
      const kk = String(row.no_kk || row.kk || '').replace(/\D/g, '');

      if (nik.length !== 16) {
        failed++;
        errors.push({ row: rowNum, nama: row.nama, reason: 'NIK harus 16 digit angka' });
        return;
      }

      if (kk.length !== 16) {
        failed++;
        errors.push({ row: rowNum, nama: row.nama, reason: 'Nomor KK harus 16 digit angka' });
        return;
      }

      if (!row.nama) {
        failed++;
        errors.push({ row: rowNum, nama: 'Kosong', reason: 'Nama penerima tidak boleh kosong' });
        return;
      }

      valid++;
    });

    setValidationSummary({ valid, failed, errors });
  };

  const handleExecuteImport = async () => {
    if (parsedData.length === 0) return;
    setIsProcessing(true);
    try {
      const res = await onImportSubmit(parsedData);
      alert(res.message || 'Import data Excel berhasil selesai.');
      onClose();
    } catch (err: any) {
      alert(err.message || 'Gagal melakukan import data Excel.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs print:hidden">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full shadow-2xl p-6 relative animate-scale-up text-white max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-emerald-600/20 text-emerald-400 rounded-xl border border-emerald-500/30">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Import Data Penerima via Excel</h3>
              <p className="text-xs text-slate-400">SI-BANSOS Kabupaten Bireuen</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="py-5 overflow-y-auto flex-1 space-y-5 text-xs">
          
          {/* Download Template Box */}
          <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 flex items-center justify-between gap-4">
            <div>
              <h4 className="font-semibold text-slate-200">Unduh Format Template Excel Official</h4>
              <p className="text-slate-400 text-[11px] mt-0.5">
                Gunakan template standar agar nama kolom dan data NIK/KK valid saat diimpor.
              </p>
            </div>

            <button
              onClick={handleDownloadTemplate}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold flex items-center gap-1.5 shrink-0 transition-colors shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span>Download Template</span>
            </button>
          </div>

          {/* Upload Input File Area */}
          <div className="border-2 border-dashed border-slate-700 rounded-xl p-6 text-center hover:border-emerald-500 transition-colors bg-slate-800/40">
            <Upload className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
            <p className="font-semibold text-slate-200 text-sm">Pilih File Excel (.xlsx / .xls)</p>
            <p className="text-[11px] text-slate-400 mt-1 mb-3">Ukuran maksimal file 10MB</p>

            <input
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={handleFileChange}
              className="hidden"
              id="excel-file-input"
            />
            <label
              htmlFor="excel-file-input"
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-semibold cursor-pointer border border-slate-600 inline-block transition-colors"
            >
              Pilih File Excel...
            </label>

            {fileInfo && (
              <p className="text-emerald-400 font-semibold mt-3 text-xs">
                File Terpilih: {fileInfo.name} ({(fileInfo.size / 1024).toFixed(1)} KB)
              </p>
            )}
          </div>

          {/* Validation Summary */}
          {validationSummary && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-center font-bold">
                <div className="bg-emerald-950/60 border border-emerald-700/80 p-3 rounded-xl text-emerald-300">
                  <CheckCircle2 className="w-5 h-5 mx-auto mb-1 text-emerald-400" />
                  <span className="text-lg block">{validationSummary.valid}</span>
                  <span className="text-[11px] font-normal text-slate-300">Data Valid</span>
                </div>

                <div className="bg-rose-950/60 border border-rose-700/80 p-3 rounded-xl text-rose-300">
                  <AlertCircle className="w-5 h-5 mx-auto mb-1 text-rose-400" />
                  <span className="text-lg block">{validationSummary.failed}</span>
                  <span className="text-[11px] font-normal text-slate-300">Data Gagal / Tidak Valid</span>
                </div>
              </div>

              {validationSummary.errors.length > 0 && (
                <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/80 max-h-36 overflow-y-auto">
                  <p className="font-bold text-rose-400 mb-1.5">Rincian Data Gagal Validasi:</p>
                  <ul className="space-y-1 text-[11px] text-slate-300">
                    {validationSummary.errors.map((e, idx) => (
                      <li key={idx} className="flex items-center justify-between border-b border-slate-700/60 py-1">
                        <span>Baris Excel #{e.row} ({e.nama || 'Tanpa Nama'}):</span>
                        <span className="text-rose-400 font-medium">{e.reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl border border-slate-700 transition-colors"
          >
            Batal
          </button>

          <button
            onClick={handleExecuteImport}
            disabled={isProcessing || !validationSummary || validationSummary.valid === 0}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-md transition-colors disabled:opacity-60 flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            <span>{isProcessing ? 'Memproses...' : 'Proses Import Data Valid'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
