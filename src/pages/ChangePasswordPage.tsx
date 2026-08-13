import React, { useState } from 'react';
import { Key, Lock, Eye, EyeOff, Save, ShieldAlert } from 'lucide-react';

interface ChangePasswordPageProps {
  isMandatory?: boolean;
  onSubmitChange: (data: { old_password?: string; new_password: string; confirm_password: string }) => Promise<void>;
  onCancel?: () => void;
}

export const ChangePasswordPage: React.FC<ChangePasswordPageProps> = ({
  isMandatory = false,
  onSubmitChange,
  onCancel
}) => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (newPassword.length < 8) {
      setErrorMessage('Password baru harus terdiri dari minimal 8 karakter.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Konfirmasi password baru tidak cocok.');
      return;
    }

    if (oldPassword && oldPassword === newPassword) {
      setErrorMessage('Password baru harus berbeda dari password lama.');
      return;
    }

    setIsLoading(true);
    try {
      await onSubmitChange({
        old_password: oldPassword,
        new_password: newPassword,
        confirm_password: confirmPassword
      });
      setSuccessMessage('Password berhasil diperbarui.');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal mengubah password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto py-8 px-4 text-white">
      
      {isMandatory && (
        <div className="mb-6 p-4 bg-amber-950/80 border border-amber-700 text-amber-200 rounded-2xl text-xs flex items-start space-x-3 shadow-lg">
          <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-sm">Wajib Mengubah Password!</p>
            <p className="mt-0.5">
              Password Anda telah di-reset oleh Administrator. Anda wajib membuat password baru (minimal 8 karakter) sebelum dapat melanjutkan menggunakan sistem.
            </p>
          </div>
        </div>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
        
        <div className="flex items-center space-x-3 border-b border-slate-800 pb-4 mb-6">
          <div className="p-3 bg-emerald-600/20 text-emerald-400 rounded-2xl border border-emerald-500/30">
            <Key className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Ubah Password Akun</h2>
            <p className="text-xs text-slate-400">Pastikan password baru Anda aman dan minimal 8 karakter</p>
          </div>
        </div>

        {errorMessage && (
          <div className="mb-5 p-3.5 bg-rose-950/80 border border-rose-800 text-rose-200 rounded-2xl text-xs font-medium">
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="mb-5 p-3.5 bg-emerald-950/80 border border-emerald-800 text-emerald-200 rounded-2xl text-xs font-medium">
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          
          {/* Old Password */}
          {!isMandatory && (
            <div>
              <label className="block font-semibold text-slate-300 mb-1.5">
                Password Lama
              </label>
              <div className="relative">
                <input
                  type={showOld ? 'text' : 'password'}
                  value={oldPassword}
                  onChange={e => setOldPassword(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-3 text-white text-sm focus:outline-none focus:border-emerald-500 pr-10"
                  placeholder="Masukkan password lama"
                />
                <button
                  type="button"
                  onClick={() => setShowOld(!showOld)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white"
                >
                  {showOld ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {/* New Password */}
          <div>
            <label className="block font-semibold text-slate-300 mb-1.5">
              Password Baru (Minimal 8 Karakter) <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-3 text-white text-sm focus:outline-none focus:border-emerald-500 pr-10"
                placeholder="Minimal 8 karakter"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white"
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block font-semibold text-slate-300 mb-1.5">
              Konfirmasi Password Baru <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-3 text-white text-sm focus:outline-none focus:border-emerald-500 pr-10"
                placeholder="Ulangi password baru"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white"
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end space-x-3">
            {!isMandatory && onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2.5 text-slate-300 hover:text-white border border-slate-700 hover:bg-slate-800 rounded-xl font-semibold transition-colors"
              >
                Batal
              </button>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md transition-colors flex items-center gap-2 disabled:opacity-60"
            >
              <Save className="w-4 h-4" />
              <span>{isLoading ? 'Menyimpan...' : 'Simpan Password Baru'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
