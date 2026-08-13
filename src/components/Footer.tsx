import React from 'react';
import { PengaturanSistem } from '../types';

interface FooterProps {
  settings: PengaturanSistem;
}

export const Footer: React.FC<FooterProps> = ({ settings }) => {
  return (
    <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 text-xs py-6 mt-auto print:hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {settings.logo_kabupaten && (
            <img src={settings.logo_kabupaten} alt="Logo Bireuen" className="w-8 h-8 object-contain bg-white p-0.5 rounded-lg" />
          )}
          <div>
            <p className="font-semibold text-slate-300">{settings.nama_instansi} - {settings.sub_instansi}</p>
            <p className="text-slate-400 text-[11px] mt-0.5">{settings.alamat}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-right">
          <div className="text-right text-[11px]">
            <p className="text-slate-300 font-medium">Copyright &copy; 2026–2027 Nazarullah, S.Kom I SI-BANSOS Kabupaten Bireuen</p>
            <p className="text-slate-400">Sistem Informasi Bantuan Sosial Terpadu</p>
          </div>
          {settings.logo_dinsos && (
            <img src={settings.logo_dinsos} alt="Logo Dinsos" className="w-8 h-8 object-contain bg-white p-0.5 rounded-lg" />
          )}
        </div>
      </div>
    </footer>
  );
};
