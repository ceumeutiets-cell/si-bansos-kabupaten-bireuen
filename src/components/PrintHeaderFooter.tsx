import React from 'react';
import { PengaturanSistem } from '../types';

interface KopSuratProps {
  settings: PengaturanSistem;
  className?: string;
}

export const KopSurat: React.FC<KopSuratProps> = ({ settings, className = '' }) => {
  return (
    <div className={`border-b-4 border-double border-slate-900 pb-4 mb-6 text-center relative bg-white text-slate-900 ${className}`}>
      <div className="flex items-center justify-between px-2 sm:px-4 gap-3">
        {settings.logo_kabupaten ? (
          <img
            src={settings.logo_kabupaten}
            alt="Logo Kabupaten Bireuen"
            className="w-20 h-20 sm:w-24 sm:h-24 object-contain shrink-0"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-20 sm:w-24" />
        )}

        <div className="text-center flex-1 mx-2">
          <h2 className="text-sm sm:text-base md:text-lg font-bold uppercase tracking-wider text-slate-900 leading-tight">
            {settings.nama_instansi || 'PEMERINTAH KABUPATEN BIREUEN'}
          </h2>
          <h1 className="text-base sm:text-lg md:text-xl font-extrabold uppercase tracking-wide text-slate-900 leading-tight mt-0.5">
            {settings.sub_instansi || 'DINAS SOSIAL KABUPATEN BIREUEN'}
          </h1>
          <p className="text-[10px] sm:text-xs text-slate-700 mt-1">
            {settings.alamat || 'Jl. Mayjen T. Hamzah Bendahara No. 12, Bireuen, Aceh'}
          </p>
          <p className="text-[9px] sm:text-[11px] text-slate-600 font-medium">
            E-mail: dinsos@bireuenkab.go.id | Website: dinsos.bireuenkab.go.id
          </p>
        </div>

        {settings.logo_dinsos ? (
          <img
            src={settings.logo_dinsos}
            alt="Logo Dinsos"
            className="w-20 h-20 sm:w-24 sm:h-24 object-contain shrink-0"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-20 sm:w-24" />
        )}
      </div>
    </div>
  );
};

interface PrintHeaderFooterProps {
  title: string;
  subtitle?: string;
  settings: PengaturanSistem;
  children: React.ReactNode;
}

export const PrintHeaderFooter: React.FC<PrintHeaderFooterProps> = ({
  title,
  subtitle,
  settings,
  children
}) => {
  const currentDateFormatted = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="print-document bg-white text-slate-900 p-6 sm:p-8 max-w-5xl mx-auto">
      {/* KOP SURAT RESMI DINAS SOSIAL KABUPATEN BIREUEN */}
      <KopSurat settings={settings} />

      {/* DOCUMENT TITLE */}
      <div className="text-center mb-6">
        <h3 className="text-base font-bold uppercase underline tracking-wide text-slate-900">
          {title}
        </h3>
        {subtitle && (
          <p className="text-xs font-semibold text-slate-700 mt-0.5">
            {subtitle}
          </p>
        )}
        <p className="text-[11px] text-slate-500 mt-1">
          Tanggal Cetak: {currentDateFormatted}
        </p>
      </div>

      {/* CONTENT BODY */}
      <div className="my-4">
        {children}
      </div>

      {/* FOOTER TANDA TANGAN & STEMPEL */}
      <div className="mt-12 pt-4 flex justify-end text-slate-900 break-inside-avoid">
        <div className="text-center w-64">
          <p className="text-xs text-slate-800">
            Bireuen, {currentDateFormatted}
          </p>
          <p className="text-xs font-bold text-slate-900 mt-1">
            {settings.jabatan_kepala_dinas || 'Kepala Dinas Sosial'}
          </p>
          <p className="text-xs font-bold uppercase text-slate-900">
            Kabupaten Bireuen
          </p>

          {/* Space for Signature & Stamp */}
          <div className="h-20 my-2" />

          <p className="text-sm font-bold underline text-slate-900 uppercase">
            {settings.nama_kepala_dinas || 'Dr. Alfian'}
          </p>
          <p className="text-xs text-slate-700">
            NIP. {settings.nip_kepala_dinas}
          </p>
        </div>
      </div>
    </div>
  );
};

