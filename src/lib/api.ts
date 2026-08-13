/**
 * API client for SI-BANSOS Express Backend
 */

import { 
  User, 
  Kecamatan, 
  Desa, 
  PenerimaBansos, 
  LogAktivitas, 
  PengaturanSistem,
  FilterState 
} from '../types';

let authToken = localStorage.getItem('sibansos_token') || '';

export function setAuthToken(token: string) {
  authToken = token;
  if (token) {
    localStorage.setItem('sibansos_token', token);
  } else {
    localStorage.removeItem('sibansos_token');
  }
}

export function getAuthToken(): string {
  return authToken || localStorage.getItem('sibansos_token') || '';
}

async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(endpoint, {
    ...options,
    headers
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Terjadi kesalahan sistem');
  }
  return data as T;
}

export const api = {
  // Auth
  login: (username: string, password: string) => 
    fetchApi<{ success: boolean; token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    }),

  getMe: () => 
    fetchApi<{ success: boolean; user: User }>('/api/auth/me'),

  changePassword: (data: { old_password?: string; new_password: string; confirm_password: string }) => 
    fetchApi<{ success: boolean; message: string }>('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  // Users
  getUsers: () => 
    fetchApi<{ success: boolean; users: User[] }>('/api/users'),

  generateCollectiveOperators: () =>
    fetchApi<{ success: boolean; message: string; users: User[] }>('/api/users/generate-collective-operators', {
      method: 'POST'
    }),

  createUser: (userData: Partial<User> & { password: string }) => 
    fetchApi<{ success: boolean; message: string; user: User }>('/api/users', {
      method: 'POST',
      body: JSON.stringify(userData)
    }),

  updateUser: (id: string, userData: Partial<User>) => 
    fetchApi<{ success: boolean; message: string; user: User }>(`/api/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData)
    }),

  resetPassword: (id: string, new_password?: string) => 
    fetchApi<{ success: boolean; message: string }>(`/api/users/${id}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ new_password })
    }),

  toggleUserStatus: (id: string) => 
    fetchApi<{ success: boolean; message: string }>(`/api/users/${id}/toggle-status`, {
      method: 'POST'
    }),

  deleteUser: (id: string) => 
    fetchApi<{ success: boolean; message: string }>(`/api/users/${id}`, {
      method: 'DELETE'
    }),

  // Penerima Bansos
  getPenerimaList: (filter?: Partial<FilterState>) => {
    const params = new URLSearchParams();
    if (filter) {
      if (filter.search) params.append('search', filter.search);
      if (filter.kecamatan_id) params.append('kecamatan_id', filter.kecamatan_id);
      if (filter.desa_id) params.append('desa_id', filter.desa_id);
      if (filter.desil) params.append('desil', filter.desil);
      if (filter.disabilitas) params.append('disabilitas', filter.disabilitas);
      if (filter.jenis_bantuan) params.append('jenis_bantuan', filter.jenis_bantuan);
      if (filter.status_penerima) params.append('status_penerima', filter.status_penerima);
      if (filter.tahun) params.append('tahun', filter.tahun);
    }
    return fetchApi<{ success: boolean; total: number; penerima: PenerimaBansos[] }>(
      `/api/penerima?${params.toString()}`
    );
  },

  getPenerimaDetail: (id: string) => 
    fetchApi<{ success: boolean; penerima: PenerimaBansos }>(`/api/penerima/${id}`),

  createPenerima: (data: Partial<PenerimaBansos>) => 
    fetchApi<{ success: boolean; message: string; penerima: PenerimaBansos }>('/api/penerima', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  updatePenerima: (id: string, data: Partial<PenerimaBansos>) => 
    fetchApi<{ success: boolean; message: string; penerima: PenerimaBansos }>(`/api/penerima/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

  deletePenerima: (id: string) => 
    fetchApi<{ success: boolean; message: string }>(`/api/penerima/${id}`, {
      method: 'DELETE'
    }),

  verifikasiSingle: (id: string, status_verifikasi: string, catatan_verifikasi?: string) => 
    fetchApi<{ success: boolean; message: string; penerima: PenerimaBansos }>(`/api/penerima/${id}/verifikasi`, {
      method: 'PUT',
      body: JSON.stringify({ status_verifikasi, catatan_verifikasi })
    }),

  verifikasiMasal: (ids: string[], status_verifikasi: string, catatan_verifikasi?: string) => 
    fetchApi<{ success: boolean; message: string }>(`/api/penerima/verifikasi-masal`, {
      method: 'POST',
      body: JSON.stringify({ ids, status_verifikasi, catatan_verifikasi })
    }),

  importExcel: (items: any[]) => 
    fetchApi<{ success: boolean; validCount: number; failedCount: number; errors: any[]; message: string }>(
      '/api/penerima/import',
      {
        method: 'POST',
        body: JSON.stringify({ items })
      }
    ),

  // Territory
  getKecamatan: () => 
    fetchApi<{ success: boolean; kecamatan: Kecamatan[] }>('/api/kecamatan'),

  getDesa: (kecamatan_id?: string) => {
    const url = kecamatan_id ? `/api/desa?kecamatan_id=${kecamatan_id}` : '/api/desa';
    return fetchApi<{ success: boolean; desa: Desa[] }>(url);
  },

  createDesa: (data: { kecamatan_id: string; nama: string; kode?: string }) => 
    fetchApi<{ success: boolean; message: string; desa: Desa }>('/api/desa', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  updateDesa: (id: string, data: { nama?: string; status?: 'Aktif' | 'Nonaktif' }) => 
    fetchApi<{ success: boolean; message: string; desa: Desa }>(`/api/desa/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

  // Logs & Settings
  getLogs: () => 
    fetchApi<{ success: boolean; logs: LogAktivitas[] }>('/api/logs'),

  getSettings: () => 
    fetchApi<{ success: boolean; settings: PengaturanSistem }>('/api/settings'),

  updateSettings: (data: Partial<PengaturanSistem>) => 
    fetchApi<{ success: boolean; message: string; settings: PengaturanSistem }>('/api/settings', {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

  // Restore DB
  restoreDB: (data: any) => 
    fetchApi<{ success: boolean; message: string }>('/api/restore', {
      method: 'POST',
      body: JSON.stringify(data)
    })
};
