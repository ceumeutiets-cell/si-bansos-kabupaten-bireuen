import express from 'express';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import { createServer as createViteServer } from 'vite';
import { 
  INITIAL_KECAMATAN, 
  INITIAL_DESA, 
  INITIAL_PENERIMA, 
  INITIAL_PENGATURAN 
} from './src/data/bireuenData';
import { 
  User, 
  Kecamatan, 
  Desa, 
  PenerimaBansos, 
  LogAktivitas, 
  PengaturanSistem 
} from './src/types';

const PORT = 3000;
const DB_PATH = path.join(process.cwd(), '.data', 'db.json');

// Interface for persisted database
interface DB {
  users: User[];
  kecamatan: Kecamatan[];
  desa: Desa[];
  penerima: PenerimaBansos[];
  logs: LogAktivitas[];
  pengaturan: PengaturanSistem;
}

// In-memory DB state
let db: DB = {
  users: [],
  kecamatan: [],
  desa: [],
  penerima: [],
  logs: [],
  pengaturan: INITIAL_PENGATURAN
};

// Initialize DB with seed data & default admin
function initDB() {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (fs.existsSync(DB_PATH)) {
    try {
      const data = fs.readFileSync(DB_PATH, 'utf-8');
      db = JSON.parse(data);

      let needsSave = false;

      if (!db.pengaturan || !db.pengaturan.logo_kabupaten || db.pengaturan.logo_kabupaten.includes('unsplash') || db.pengaturan.logo_kabupaten !== INITIAL_PENGATURAN.logo_kabupaten || !db.pengaturan.logo_dinsos || db.pengaturan.logo_dinsos.includes('unsplash')) {
        db.pengaturan = {
          ...(db.pengaturan || INITIAL_PENGATURAN),
          logo_kabupaten: INITIAL_PENGATURAN.logo_kabupaten,
          logo_dinsos: INITIAL_PENGATURAN.logo_dinsos
        };
        needsSave = true;
      }

      // Merge missing Kecamatan
      if (!Array.isArray(db.kecamatan)) db.kecamatan = [];
      for (const initKec of INITIAL_KECAMATAN) {
        if (!db.kecamatan.some(k => k.id === initKec.id || k.nama.toLowerCase() === initKec.nama.toLowerCase())) {
          db.kecamatan.push(initKec);
          needsSave = true;
        }
      }

      // Merge missing Desa
      if (!Array.isArray(db.desa)) db.desa = [];
      for (const initDesa of INITIAL_DESA) {
        if (!db.desa.some(d => d.id === initDesa.id || (d.nama.toLowerCase() === initDesa.nama.toLowerCase() && d.kecamatan_id === initDesa.kecamatan_id))) {
          db.desa.push(initDesa);
          needsSave = true;
        }
      }

      if (needsSave) {
        saveDB();
      }

      ensureCollectiveOperatorUsers();

      console.log(`Loaded database from ${DB_PATH} (Total desa: ${db.desa.length}, Total users: ${db.users.length})`);
    } catch (e) {
      console.error('Error loading database, resetting seed:', e);
      seedInitialData();
    }
  } else {
    seedInitialData();
  }
}

function ensureCollectiveOperatorUsers() {
  const salt = bcrypt.genSaltSync(10);
  const operatorPasswordHash = bcrypt.hashSync('operator1234', salt);
  let needsSave = false;

  // 1. Global Operator Desa Kolektif
  const existingGlobal = db.users.find(u => u.username === 'operator_desa_kolektif');
  if (!existingGlobal) {
    const globalUser: User = {
      id: 'usr_op_global',
      name: 'Operator Desa Kolektif Seluruh Bireuen',
      username: 'operator_desa_kolektif',
      role: 'petugas_desa',
      status: 'Aktif',
      must_change_password: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    (globalUser as any).password = operatorPasswordHash;
    db.users.push(globalUser);
    needsSave = true;
  } else if (!(existingGlobal as any).password) {
    (existingGlobal as any).password = operatorPasswordHash;
    needsSave = true;
  }

  // 2. Petugas Kabupaten
  const existingKab = db.users.find(u => u.username === 'petugas_kabupaten');
  if (!existingKab) {
    const kabUser: User = {
      id: 'usr_op_kab',
      name: 'Petugas Kabupaten Dinsos Bireuen',
      username: 'petugas_kabupaten',
      role: 'petugas_kabupaten',
      status: 'Aktif',
      must_change_password: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    (kabUser as any).password = operatorPasswordHash;
    db.users.push(kabUser);
    needsSave = true;
  } else if (!(existingKab as any).password) {
    (existingKab as any).password = operatorPasswordHash;
    needsSave = true;
  }

  // 3. Collective Operator for each of 17 Kecamatan
  for (const kec of INITIAL_KECAMATAN) {
    const cleanKecName = kec.nama.replace(/^Kecamatan\s+/i, '');
    const cleanUsername = 'operator_' + cleanKecName.toLowerCase().replace(/[^a-z0-9]/g, '');

    const existingUser = db.users.find(u => u.username === cleanUsername || (u.role === 'petugas_desa' && u.kecamatan_id === kec.id && !u.desa_id));
    if (!existingUser) {
      const kecOpUser: User = {
        id: 'usr_op_' + kec.id,
        name: `Operator Desa Kolektif Kec. ${cleanKecName}`,
        username: cleanUsername,
        role: 'petugas_desa',
        kecamatan_id: kec.id,
        kecamatan_nama: kec.nama,
        status: 'Aktif',
        must_change_password: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      (kecOpUser as any).password = operatorPasswordHash;
      db.users.push(kecOpUser);
      needsSave = true;
    } else {
      if (!(existingUser as any).password) {
        (existingUser as any).password = operatorPasswordHash;
        needsSave = true;
      }
    }
  }

  if (needsSave) {
    saveDB();
  }
}

function seedInitialData() {
  const salt = bcrypt.genSaltSync(10);
  const adminPasswordHash = bcrypt.hashSync('admin1234', salt);

  const adminUser: User = {
    id: 'usr_admin_1',
    name: 'Administrator SI-BANSOS',
    username: 'admin',
    role: 'admin',
    status: 'Aktif',
    must_change_password: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  db = {
    users: [adminUser],
    kecamatan: INITIAL_KECAMATAN,
    desa: INITIAL_DESA,
    penerima: INITIAL_PENERIMA,
    logs: [
      {
        id: 'log_init',
        user_id: 'usr_admin_1',
        user_name: 'Administrator SI-BANSOS',
        username: 'admin',
        role: 'admin',
        aktivitas: 'Inisialisasi Sistem',
        modul: 'Sistem',
        ip_address: '127.0.0.1',
        user_agent: 'Server',
        waktu: new Date().toISOString(),
        keterangan: 'Master data wilayah 17 Kecamatan Kabupaten Bireuen dan user admin berhasil diinisialisasi'
      }
    ],
    pengaturan: INITIAL_PENGATURAN
  };

  (adminUser as any).password = adminPasswordHash;

  saveDB();
  ensureCollectiveOperatorUsers();
}

function saveDB() {
  try {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
  } catch (e) {
    console.error('Failed to save DB:', e);
  }
}

function addLog(
  user: { id: string; name: string; username: string; role: any },
  aktivitas: string,
  modul: string,
  keterangan: string,
  req?: express.Request
) {
  const newLog: LogAktivitas = {
    id: 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
    user_id: user.id,
    user_name: user.name,
    username: user.username,
    role: user.role,
    aktivitas,
    modul,
    ip_address: (req?.headers['x-forwarded-for'] as string) || req?.socket.remoteAddress || '127.0.0.1',
    user_agent: req?.headers['user-agent'] || 'Browser',
    waktu: new Date().toISOString(),
    keterangan
  };
  db.logs.unshift(newLog);
  // Keep max 500 logs
  if (db.logs.length > 500) db.logs = db.logs.slice(0, 500);
  saveDB();
}

async function startServer() {
  initDB();

  const app = express();
  app.use(express.json({ limit: '20mb' }));

  // Helper auth middleware
  function getAuthenticatedUser(req: express.Request): User | null {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
    const userId = authHeader.replace('Bearer ', '');
    const user = db.users.find(u => u.id === userId);
    return user || null;
  }

  // API ROUTES

  // 1. Auth Login
  app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username dan password wajib diisi' });
    }

    const user = db.users.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (!user) {
      return res.status(401).json({ success: false, message: 'Username atau password salah.' });
    }

    if (user.status === 'Nonaktif') {
      return res.status(403).json({ success: false, message: 'Akun Anda sedang dinonaktifkan. Silakan hubungi administrator.' });
    }

    const userPasswordHash = (user as any).password;
    let isValid = false;
    if (userPasswordHash) {
      isValid = bcrypt.compareSync(password, userPasswordHash);
    } else if (password === 'admin1234') {
      isValid = true;
    }

    if (!isValid) {
      addLog(
        { id: user.id || 'unknown', name: user.name || username, username, role: user.role || 'petugas_desa' },
        'Gagal Login',
        'Authentication',
        `Percobaan login gagal untuk username: ${username}`,
        req
      );
      return res.status(401).json({ success: false, message: 'Username atau password salah.' });
    }

    user.last_login = new Date().toISOString();
    saveDB();

    addLog(user, 'Login', 'Authentication', `User ${user.name} (${user.username}) berhasil login`, req);

    // Sanitize user object for client
    const { password: _, ...clientUser } = user as any;
    return res.json({
      success: true,
      token: user.id,
      user: clientUser
    });
  });

  // Auth Me
  app.get('/api/auth/me', (req, res) => {
    const user = getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Unauthenticated' });
    }
    const { password: _, ...clientUser } = user as any;
    return res.json({ success: true, user: clientUser });
  });

  // Auth Change Password
  app.post('/api/auth/change-password', (req, res) => {
    const user = getAuthenticatedUser(req);
    if (!user) return res.status(401).json({ success: false, message: 'Unauthenticated' });

    const { old_password, new_password, confirm_password } = req.body;

    if (!new_password || new_password.length < 8) {
      return res.status(400).json({ success: false, message: 'Password baru minimal 8 karakter.' });
    }

    if (new_password !== confirm_password) {
      return res.status(400).json({ success: false, message: 'Konfirmasi password baru tidak cocok.' });
    }

    const userPasswordHash = (user as any).password;
    if (userPasswordHash && old_password) {
      const isValid = bcrypt.compareSync(old_password, userPasswordHash);
      if (!isValid) {
        return res.status(400).json({ success: false, message: 'Password lama salah.' });
      }
    }

    if (old_password && old_password === new_password) {
      return res.status(400).json({ success: false, message: 'Password baru harus berbeda dari password lama.' });
    }

    const salt = bcrypt.genSaltSync(10);
    (user as any).password = bcrypt.hashSync(new_password, salt);
    user.must_change_password = false;
    user.updated_at = new Date().toISOString();
    saveDB();

    addLog(user, 'Ubah Password', 'Pengguna', `User ${user.username} memperbarui password`, req);

    return res.json({ success: true, message: 'Password berhasil diperbarui.' });
  });

  // 2. User Management
  app.get('/api/users', (req, res) => {
    const user = getAuthenticatedUser(req);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Anda tidak memiliki hak akses untuk membuka data ini.' });
    }

    const safeUsers = db.users.map(u => {
      const { password: _, ...rest } = u as any;
      return rest;
    });

    return res.json({ success: true, users: safeUsers });
  });

  app.post('/api/users', (req, res) => {
    const currentUser = getAuthenticatedUser(req);
    if (!currentUser || currentUser.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Hanya Admin yang dapat membuat user.' });
    }

    const { name, username, password, role, kecamatan_id, desa_id, status } = req.body;

    if (!name || !username || !password || !role) {
      return res.status(400).json({ success: false, message: 'Nama, username, password, dan role wajib diisi.' });
    }

    if (password.length < 8) {
      return res.status(400).json({ success: false, message: 'Password minimal 8 karakter.' });
    }

    const existing = db.users.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (existing) {
      return res.status(400).json({ success: false, message: 'Username sudah digunakan.' });
    }

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);

    const kec = db.kecamatan.find(k => k.id === kecamatan_id);
    const des = db.desa.find(d => d.id === desa_id);

    const newUser: User = {
      id: 'usr_' + Date.now(),
      name,
      username: username.toLowerCase().trim(),
      role,
      kecamatan_id,
      desa_id,
      kecamatan_nama: kec?.nama,
      desa_nama: des?.nama,
      status: status || 'Aktif',
      must_change_password: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    (newUser as any).password = passwordHash;
    db.users.push(newUser);
    saveDB();

    addLog(currentUser, 'Tambah User', 'Manajemen User', `Menambahkan user baru: ${username} (${role})`, req);

    const { password: _, ...clientUser } = newUser as any;
    return res.json({ success: true, message: 'User berhasil ditambahkan.', user: clientUser });
  });

  app.post('/api/users/generate-collective-operators', (req, res) => {
    const currentUser = getAuthenticatedUser(req);
    if (!currentUser || currentUser.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Hanya Admin yang dapat membuat/reset akun kolektif operator.' });
    }

    ensureCollectiveOperatorUsers();

    addLog(currentUser, 'Generate Akun Kolektif', 'Manajemen User', 'Berhasil melakukan reset/generate akun kolektif operator desa seluruh kecamatan', req);

    const safeUsers = db.users.map(u => {
      const { password: _, ...rest } = u as any;
      return rest;
    });

    return res.json({
      success: true,
      message: 'Akun kolektif operator desa untuk 17 kecamatan berhasil diperbarui.',
      users: safeUsers
    });
  });

  app.put('/api/users/:id', (req, res) => {
    const currentUser = getAuthenticatedUser(req);
    if (!currentUser || currentUser.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Hanya Admin yang dapat mengubah user.' });
    }

    const userToEdit = db.users.find(u => u.id === req.params.id);
    if (!userToEdit) {
      return res.status(404).json({ success: false, message: 'User tidak ditemukan.' });
    }

    const { name, role, kecamatan_id, desa_id, status } = req.body;

    if (userToEdit.id === currentUser.id && role !== 'admin') {
      return res.status(400).json({ success: false, message: 'Anda tidak dapat mengubah role Anda sendiri.' });
    }

    const kec = db.kecamatan.find(k => k.id === kecamatan_id);
    const des = db.desa.find(d => d.id === desa_id);

    userToEdit.name = name || userToEdit.name;
    userToEdit.role = role || userToEdit.role;
    userToEdit.kecamatan_id = kecamatan_id;
    userToEdit.desa_id = desa_id;
    userToEdit.kecamatan_nama = kec?.nama;
    userToEdit.desa_nama = des?.nama;
    if (status) userToEdit.status = status;
    userToEdit.updated_at = new Date().toISOString();

    saveDB();

    addLog(currentUser, 'Edit User', 'Manajemen User', `Memperbarui user: ${userToEdit.username}`, req);

    const { password: _, ...clientUser } = userToEdit as any;
    return res.json({ success: true, message: 'Data user berhasil diperbarui.', user: clientUser });
  });

  app.post('/api/users/:id/reset-password', (req, res) => {
    const currentUser = getAuthenticatedUser(req);
    if (!currentUser || currentUser.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Hanya Admin yang dapat reset password.' });
    }

    const userToReset = db.users.find(u => u.id === req.params.id);
    if (!userToReset) return res.status(404).json({ success: false, message: 'User tidak ditemukan.' });

    const newTempPassword = req.body.new_password || 'admin1234';
    const salt = bcrypt.genSaltSync(10);
    (userToReset as any).password = bcrypt.hashSync(newTempPassword, salt);
    userToReset.must_change_password = true;
    userToReset.updated_at = new Date().toISOString();

    saveDB();

    addLog(currentUser, 'Reset Password', 'Manajemen User', `Reset password untuk user ${userToReset.username}`, req);

    return res.json({ 
      success: true, 
      message: `Password user ${userToReset.username} berhasil di-reset menjadi "${newTempPassword}". User wajib mengganti password saat login berikutnya.` 
    });
  });

  app.post('/api/users/:id/toggle-status', (req, res) => {
    const currentUser = getAuthenticatedUser(req);
    if (!currentUser || currentUser.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Hanya Admin yang dapat mengubah status user.' });
    }

    const userToToggle = db.users.find(u => u.id === req.params.id);
    if (!userToToggle) return res.status(404).json({ success: false, message: 'User tidak ditemukan.' });

    if (userToToggle.id === currentUser.id) {
      return res.status(400).json({ success: false, message: 'Anda tidak dapat menonaktifkan akun sendiri.' });
    }

    userToToggle.status = userToToggle.status === 'Aktif' ? 'Nonaktif' : 'Aktif';
    userToToggle.updated_at = new Date().toISOString();
    saveDB();

    addLog(
      currentUser,
      userToToggle.status === 'Aktif' ? 'Aktivasi Akun' : 'Nonaktifkan Akun',
      'Manajemen User',
      `Status akun ${userToToggle.username} diubah menjadi ${userToToggle.status}`,
      req
    );

    return res.json({ success: true, message: `Status akun diubah menjadi ${userToToggle.status}.` });
  });

  app.delete('/api/users/:id', (req, res) => {
    const currentUser = getAuthenticatedUser(req);
    if (!currentUser || currentUser.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Hanya Admin yang dapat menghapus user.' });
    }

    const index = db.users.findIndex(u => u.id === req.params.id);
    if (index === -1) return res.status(404).json({ success: false, message: 'User tidak ditemukan.' });

    const target = db.users[index];
    if (target.id === currentUser.id) {
      return res.status(400).json({ success: false, message: 'Anda tidak dapat menghapus akun sendiri.' });
    }

    db.users.splice(index, 1);
    saveDB();

    addLog(currentUser, 'Hapus User', 'Manajemen User', `Menghapus user: ${target.username}`, req);

    return res.json({ success: true, message: 'User berhasil dihapus.' });
  });

  // 3. Penerima Bansos (CRITICAL ACCESS CONTROL BY ROLE)
  app.get('/api/penerima', (req, res) => {
    const currentUser = getAuthenticatedUser(req);
    if (!currentUser) return res.status(401).json({ success: false, message: 'Unauthenticated' });

    let list = db.penerima.filter(p => !p.deleted_at);

    // STRICT BACKEND ENFORCEMENT FOR PETUGAS DESA
    if (currentUser.role === 'petugas_desa') {
      if (!currentUser.kecamatan_id || !currentUser.desa_id) {
        return res.json({ success: true, penerima: [] });
      }
      list = list.filter(
        p => p.kecamatan_id === currentUser.kecamatan_id && p.desa_id === currentUser.desa_id
      );
    } else {
      // Admin / Petugas Kabupaten query filters
      if (req.query.kecamatan_id) {
        list = list.filter(p => p.kecamatan_id === req.query.kecamatan_id);
      }
      if (req.query.desa_id) {
        list = list.filter(p => p.desa_id === req.query.desa_id);
      }
    }

    // Other filters
    if (req.query.desil) {
      list = list.filter(p => p.desil === req.query.desil);
    }
    if (req.query.disabilitas) {
      list = list.filter(p => p.jenis_disabilitas === req.query.disabilitas);
    }
    if (req.query.jenis_bantuan) {
      list = list.filter(p => p.jenis_bantuan === req.query.jenis_bantuan);
    }
    if (req.query.status_penerima) {
      list = list.filter(p => p.status_penerima === req.query.status_penerima);
    }
    if (req.query.status_verifikasi) {
      list = list.filter(p => (p.status_verifikasi || 'Disetujui') === req.query.status_verifikasi);
    }
    if (req.query.tahun) {
      list = list.filter(p => String(p.tahun_penerimaan) === String(req.query.tahun));
    }

    // Search text across NIK, KK, Nama, Kecamatan, Desa
    if (req.query.search) {
      const q = String(req.query.search).toLowerCase().trim();
      list = list.filter(
        p =>
          p.nik.toLowerCase().includes(q) ||
          p.no_kk.toLowerCase().includes(q) ||
          p.nama.toLowerCase().includes(q) ||
          (p.kecamatan_nama && p.kecamatan_nama.toLowerCase().includes(q)) ||
          (p.desa_nama && p.desa_nama.toLowerCase().includes(q))
      );
    }

    return res.json({ success: true, total: list.length, penerima: list });
  });

  app.get('/api/penerima/:id', (req, res) => {
    const currentUser = getAuthenticatedUser(req);
    if (!currentUser) return res.status(401).json({ success: false, message: 'Unauthenticated' });

    const item = db.penerima.find(p => p.id === req.params.id && !p.deleted_at);
    if (!item) return res.status(404).json({ success: false, message: 'Data penerima tidak ditemukan.' });

    if (
      currentUser.role === 'petugas_desa' &&
      (item.kecamatan_id !== currentUser.kecamatan_id || item.desa_id !== currentUser.desa_id)
    ) {
      return res.status(403).json({ success: false, message: 'Anda tidak memiliki hak akses untuk membuka data ini.' });
    }

    return res.json({ success: true, penerima: item });
  });

  app.post('/api/penerima', (req, res) => {
    const currentUser = getAuthenticatedUser(req);
    if (!currentUser) return res.status(401).json({ success: false, message: 'Unauthenticated' });

    const body = req.body;

    // NIK & KK 16-digit validation
    const nikDigits = String(body.nik || '').replace(/\D/g, '');
    const kkDigits = String(body.no_kk || '').replace(/\D/g, '');

    if (nikDigits.length !== 16) {
      return res.status(400).json({ success: false, message: 'NIK harus terdiri dari 16 digit angka.' });
    }

    if (kkDigits.length !== 16) {
      return res.status(400).json({ success: false, message: 'Nomor KK harus terdiri dari 16 digit angka.' });
    }

    // Check duplicate NIK
    const dup = db.penerima.find(p => p.nik === nikDigits && !p.deleted_at);
    if (dup) {
      return res.status(400).json({ success: false, message: 'NIK sudah terdaftar.' });
    }

    // Strict village assignment for petugas_desa
    let targetKecId = body.kecamatan_id;
    let targetDesaId = body.desa_id;

    if (currentUser.role === 'petugas_desa') {
      if (!currentUser.kecamatan_id || !currentUser.desa_id) {
        return res.status(403).json({ success: false, message: 'Akun petugas desa belum memiliki lokasi penempatan.' });
      }
      targetKecId = currentUser.kecamatan_id;
      targetDesaId = currentUser.desa_id;
    }

    const kec = db.kecamatan.find(k => k.id === targetKecId);
    const des = db.desa.find(d => d.id === targetDesaId);

    const newItem: PenerimaBansos = {
      id: 'pen_' + Date.now(),
      nik: nikDigits,
      no_kk: kkDigits,
      nama: body.nama || '',
      jenis_kelamin: body.jenis_kelamin || 'Laki-laki',
      tempat_lahir: body.tempat_lahir || 'Bireuen',
      tanggal_lahir: body.tanggal_lahir || '1990-01-01',
      nomor_hp: body.nomor_hp || '',
      kecamatan_id: targetKecId,
      kecamatan_nama: kec?.nama,
      desa_id: targetDesaId,
      desa_nama: des?.nama,
      alamat: body.alamat || '',
      keterangan: body.keterangan || '',

      desil: body.desil || 'Desil 1',
      jenis_bantuan: body.jenis_bantuan || 'PKH (Program Keluarga Harapan)',
      status_penerima: body.status_penerima || 'Aktif',
      keterangan_bantuan: body.keterangan_bantuan || '',
      tahun_penerimaan: Number(body.tahun_penerimaan) || 2026,
      sumber_data: body.sumber_data || 'DTKS',

      jenis_disabilitas: body.jenis_disabilitas || 'Tidak ada disabilitas',

      foto_ptks: body.foto_ptks || '',
      foto_rumah: body.foto_rumah || '',
      foto_rumah_kondisi: body.foto_rumah_kondisi || '',
      keterangan_kondisi_rumah: body.keterangan_kondisi_rumah || '',

      latitude: body.latitude ? Number(body.latitude) : undefined,
      longitude: body.longitude ? Number(body.longitude) : undefined,

      // Automatic verification status assignment based on role
      status_verifikasi: currentUser.role === 'petugas_desa' ? 'Menunggu Verifikasi' : (body.status_verifikasi || 'Disetujui'),
      catatan_verifikasi: body.catatan_verifikasi || (currentUser.role === 'petugas_desa' ? 'Menunggu peninjauan & verifikasi oleh Administrator Dinas Sosial' : 'Disetujui secara langsung'),
      diusulkan_oleh: currentUser.role === 'petugas_desa' ? `${currentUser.name}${currentUser.desa_nama ? ' (Gampong ' + currentUser.desa_nama + ')' : ''}` : (body.diusulkan_oleh || currentUser.name),
      tanggal_usulan: new Date().toISOString(),
      verified_by: currentUser.role === 'petugas_desa' ? undefined : currentUser.name,
      tanggal_verifikasi: currentUser.role === 'petugas_desa' ? undefined : new Date().toISOString(),

      created_by: currentUser.name,
      updated_by: currentUser.name,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null
    };

    db.penerima.push(newItem);
    saveDB();

    addLog(currentUser, 'Tambah Data Penerima', 'Penerima Bansos', `Menambahkan penerima: ${newItem.nama} (NIK: ${newItem.nik})`, req);

    return res.json({ success: true, message: 'Data berhasil disimpan.', penerima: newItem });
  });

  app.put('/api/penerima/:id', (req, res) => {
    const currentUser = getAuthenticatedUser(req);
    if (!currentUser) return res.status(401).json({ success: false, message: 'Unauthenticated' });

    const item = db.penerima.find(p => p.id === req.params.id && !p.deleted_at);
    if (!item) return res.status(404).json({ success: false, message: 'Data penerima tidak ditemukan.' });

    if (
      currentUser.role === 'petugas_desa' &&
      (item.kecamatan_id !== currentUser.kecamatan_id || item.desa_id !== currentUser.desa_id)
    ) {
      return res.status(403).json({ success: false, message: 'Anda tidak memiliki hak akses untuk mengubah data ini.' });
    }

    const body = req.body;

    if (body.nik) {
      const nikDigits = String(body.nik).replace(/\D/g, '');
      if (nikDigits.length !== 16) {
        return res.status(400).json({ success: false, message: 'NIK harus terdiri dari 16 digit angka.' });
      }
      const dup = db.penerima.find(p => p.nik === nikDigits && p.id !== item.id && !p.deleted_at);
      if (dup) return res.status(400).json({ success: false, message: 'NIK sudah terdaftar.' });
      item.nik = nikDigits;
    }

    if (body.no_kk) {
      const kkDigits = String(body.no_kk).replace(/\D/g, '');
      if (kkDigits.length !== 16) {
        return res.status(400).json({ success: false, message: 'Nomor KK harus terdiri dari 16 digit angka.' });
      }
      item.no_kk = kkDigits;
    }

    item.nama = body.nama ?? item.nama;
    item.jenis_kelamin = body.jenis_kelamin ?? item.jenis_kelamin;
    item.tempat_lahir = body.tempat_lahir ?? item.tempat_lahir;
    item.tanggal_lahir = body.tanggal_lahir ?? item.tanggal_lahir;
    item.nomor_hp = body.nomor_hp ?? item.nomor_hp;
    item.alamat = body.alamat ?? item.alamat;
    item.keterangan = body.keterangan ?? item.keterangan;

    item.desil = body.desil ?? item.desil;
    item.jenis_bantuan = body.jenis_bantuan ?? item.jenis_bantuan;
    item.status_penerima = body.status_penerima ?? item.status_penerima;
    item.keterangan_bantuan = body.keterangan_bantuan ?? item.keterangan_bantuan;
    if (body.tahun_penerimaan) item.tahun_penerimaan = Number(body.tahun_penerimaan);
    item.sumber_data = body.sumber_data ?? item.sumber_data;

    item.jenis_disabilitas = body.jenis_disabilitas ?? item.jenis_disabilitas;

    if (body.foto_ptks !== undefined) item.foto_ptks = body.foto_ptks;
    if (body.foto_rumah !== undefined) item.foto_rumah = body.foto_rumah;
    if (body.foto_rumah_kondisi !== undefined) item.foto_rumah_kondisi = body.foto_rumah_kondisi;
    if (body.keterangan_kondisi_rumah !== undefined) item.keterangan_kondisi_rumah = body.keterangan_kondisi_rumah;

    if (body.latitude !== undefined) item.latitude = body.latitude ? Number(body.latitude) : undefined;
    if (body.longitude !== undefined) item.longitude = body.longitude ? Number(body.longitude) : undefined;

    if (currentUser.role !== 'petugas_desa') {
      if (body.kecamatan_id) {
        item.kecamatan_id = body.kecamatan_id;
        const kec = db.kecamatan.find(k => k.id === body.kecamatan_id);
        item.kecamatan_nama = kec?.nama;
      }
      if (body.desa_id) {
        item.desa_id = body.desa_id;
        const des = db.desa.find(d => d.id === body.desa_id);
        item.desa_nama = des?.nama;
      }
    }

    if (currentUser.role === 'petugas_desa') {
      // If village operator edits a record that needed revision or was rejected, reset status for review
      if (item.status_verifikasi === 'Perlu Perbaikan' || item.status_verifikasi === 'Ditolak') {
        item.status_verifikasi = 'Menunggu Verifikasi';
        item.status_penerima = 'Usulan Baru';
        item.catatan_verifikasi = 'Data telah diperbaiki oleh operator desa, menunggu verifikasi ulang oleh Admin.';
        item.tanggal_usulan = new Date().toISOString();
      }
    }

    item.updated_by = currentUser.name;
    item.updated_at = new Date().toISOString();

    saveDB();

    addLog(currentUser, 'Edit Data Penerima', 'Penerima Bansos', `Memperbarui data penerima: ${item.nama}`, req);

    return res.json({ success: true, message: 'Data berhasil diperbarui.', penerima: item });
  });

  // 3b. VERIFIKASI DATA USULAN OPERATOR DESA OLEH ADMINISTRATOR
  app.put('/api/penerima/:id/verifikasi', (req, res) => {
    const currentUser = getAuthenticatedUser(req);
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'petugas_kabupaten')) {
      return res.status(403).json({ success: false, message: 'Hanya Administrator atau Petugas Kabupaten yang berhak memverifikasi usulan data.' });
    }

    const item = db.penerima.find(p => p.id === req.params.id && !p.deleted_at);
    if (!item) return res.status(404).json({ success: false, message: 'Data penerima tidak ditemukan.' });

    const { status_verifikasi, catatan_verifikasi } = req.body;
    if (!['Disetujui', 'Ditolak', 'Perlu Perbaikan', 'Menunggu Verifikasi'].includes(status_verifikasi)) {
      return res.status(400).json({ success: false, message: 'Status verifikasi tidak valid.' });
    }

    item.status_verifikasi = status_verifikasi;
    item.catatan_verifikasi = catatan_verifikasi || (
      status_verifikasi === 'Disetujui' ? 'Usulan disetujui dan data diaktifkan sebagai penerima bantuan.' :
      status_verifikasi === 'Ditolak' ? 'Usulan ditolak oleh Administrator.' :
      'Data perlu perbaikan oleh Operator Desa.'
    );
    item.verified_by = currentUser.name;
    item.tanggal_verifikasi = new Date().toISOString();

    if (status_verifikasi === 'Disetujui') {
      item.status_penerima = 'Aktif';
    } else if (status_verifikasi === 'Ditolak') {
      item.status_penerima = 'Nonaktif';
    } else if (status_verifikasi === 'Perlu Perbaikan') {
      item.status_penerima = 'Proses Validasi';
    }

    item.updated_by = currentUser.name;
    item.updated_at = new Date().toISOString();

    saveDB();

    addLog(
      currentUser,
      'Verifikasi Usulan Desa',
      'Penerima Bansos',
      `Memverifikasi usulan desa ${item.nama} (NIK: ${item.nik}) -> Status: ${status_verifikasi}`,
      req
    );

    return res.json({ 
      success: true, 
      message: `Status usulan ${item.nama} berhasil diubah menjadi '${status_verifikasi}'.`, 
      penerima: item 
    });
  });

  app.post('/api/penerima/verifikasi-masal', (req, res) => {
    const currentUser = getAuthenticatedUser(req);
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'petugas_kabupaten')) {
      return res.status(403).json({ success: false, message: 'Hanya Administrator atau Petugas Kabupaten yang berhak memverifikasi usulan data.' });
    }

    const { ids, status_verifikasi, catatan_verifikasi } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'Pilih minimal satu data usulan untuk diverifikasi.' });
    }

    if (!['Disetujui', 'Ditolak', 'Perlu Perbaikan'].includes(status_verifikasi)) {
      return res.status(400).json({ success: false, message: 'Status verifikasi tidak valid.' });
    }

    let updatedCount = 0;
    const now = new Date().toISOString();

    db.penerima.forEach(item => {
      if (ids.includes(item.id) && !item.deleted_at) {
        item.status_verifikasi = status_verifikasi;
        item.catatan_verifikasi = catatan_verifikasi || (
          status_verifikasi === 'Disetujui' ? 'Disetujui secara verifikasi masal oleh Administrator.' :
          status_verifikasi === 'Ditolak' ? 'Ditolak secara verifikasi masal oleh Administrator.' :
          'Diperlukan perbaikan data secara masal.'
        );
        item.verified_by = currentUser.name;
        item.tanggal_verifikasi = now;

        if (status_verifikasi === 'Disetujui') {
          item.status_penerima = 'Aktif';
        } else if (status_verifikasi === 'Ditolak') {
          item.status_penerima = 'Nonaktif';
        } else if (status_verifikasi === 'Perlu Perbaikan') {
          item.status_penerima = 'Proses Validasi';
        }

        item.updated_by = currentUser.name;
        item.updated_at = now;
        updatedCount++;
      }
    });

    saveDB();

    addLog(
      currentUser,
      'Verifikasi Masal Usulan Desa',
      'Penerima Bansos',
      `Memverifikasi masal ${updatedCount} data usulan desa -> Status: ${status_verifikasi}`,
      req
    );

    return res.json({ 
      success: true, 
      message: `${updatedCount} usulan desa berhasil diubah statusnya menjadi '${status_verifikasi}'.` 
    });
  });

  app.delete('/api/penerima/:id', (req, res) => {
    const currentUser = getAuthenticatedUser(req);
    if (!currentUser) return res.status(401).json({ success: false, message: 'Unauthenticated' });

    const item = db.penerima.find(p => p.id === req.params.id && !p.deleted_at);
    if (!item) return res.status(404).json({ success: false, message: 'Data penerima tidak ditemukan.' });

    if (
      currentUser.role === 'petugas_desa' &&
      (item.kecamatan_id !== currentUser.kecamatan_id || item.desa_id !== currentUser.desa_id)
    ) {
      return res.status(403).json({ success: false, message: 'Anda tidak memiliki hak akses untuk menghapus data ini.' });
    }

    // Soft delete
    item.deleted_at = new Date().toISOString();
    saveDB();

    addLog(currentUser, 'Hapus Data Penerima', 'Penerima Bansos', `Soft delete data penerima: ${item.nama} (${item.nik})`, req);

    return res.json({ success: true, message: 'Data berhasil dihapus.' });
  });

  // Import Excel Batch API
  app.post('/api/penerima/import', (req, res) => {
    const currentUser = getAuthenticatedUser(req);
    if (!currentUser) return res.status(401).json({ success: false, message: 'Unauthenticated' });

    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Tidak ada data untuk diimpor.' });
    }

    let validCount = 0;
    let failedCount = 0;
    const errors: { row: number; reason: string; nama?: string }[] = [];

    items.forEach((row, idx) => {
      const rowNum = idx + 1;
      const nik = String(row.nik || '').replace(/\D/g, '');
      const kk = String(row.no_kk || String(row.kk || '')).replace(/\D/g, '');

      if (nik.length !== 16) {
        failedCount++;
        errors.push({ row: rowNum, nama: row.nama, reason: 'NIK harus 16 digit angka.' });
        return;
      }

      if (kk.length !== 16) {
        failedCount++;
        errors.push({ row: rowNum, nama: row.nama, reason: 'Nomor KK harus 16 digit angka.' });
        return;
      }

      const dup = db.penerima.find(p => p.nik === nik && !p.deleted_at);
      if (dup) {
        failedCount++;
        errors.push({ row: rowNum, nama: row.nama, reason: 'NIK sudah terdaftar di sistem.' });
        return;
      }

      // Match Kecamatan & Desa
      let kec = db.kecamatan.find(
        k => k.nama.toLowerCase().includes(String(row.kecamatan || '').toLowerCase()) ||
             k.kode === row.kecamatan
      );
      if (!kec && currentUser.kecamatan_id) {
        kec = db.kecamatan.find(k => k.id === currentUser.kecamatan_id);
      }
      if (!kec) {
        kec = db.kecamatan[0];
      }

      let des = db.desa.find(
        d => d.kecamatan_id === kec?.id &&
            (d.nama.toLowerCase().includes(String(row.desa || '').toLowerCase()) || d.kode === row.desa)
      );
      if (!des && currentUser.desa_id) {
        des = db.desa.find(d => d.id === currentUser.desa_id);
      }
      if (!des) {
        des = db.desa.find(d => d.kecamatan_id === kec?.id) || db.desa[0];
      }

      const newItem: PenerimaBansos = {
        id: 'pen_' + Date.now() + '_' + idx,
        nik,
        no_kk: kk,
        nama: row.nama || `Penerima ${rowNum}`,
        jenis_kelamin: (row.jenis_kelamin === 'P' || row.jenis_kelamin === 'Perempuan') ? 'Perempuan' : 'Laki-laki',
        tempat_lahir: row.tempat_lahir || 'Bireuen',
        tanggal_lahir: row.tanggal_lahir || '1990-01-01',
        nomor_hp: row.nomor_hp || '',
        kecamatan_id: kec.id,
        kecamatan_nama: kec.nama,
        desa_id: des.id,
        desa_nama: des.nama,
        alamat: row.alamat || 'Bireuen',
        keterangan: row.keterangan || '',

        desil: row.desil && row.desil.includes('Desil') ? row.desil : 'Desil 1',
        jenis_bantuan: row.jenis_bantuan || 'PKH (Program Keluarga Harapan)',
        status_penerima: 'Aktif',
        tahun_penerimaan: Number(row.tahun_penerimaan) || 2026,
        sumber_data: 'DTKS',

        jenis_disabilitas: row.jenis_disabilitas || 'Tidak ada disabilitas',

        latitude: row.latitude ? Number(row.latitude) : undefined,
        longitude: row.longitude ? Number(row.longitude) : undefined,

        created_by: currentUser.name,
        updated_by: currentUser.name,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        deleted_at: null
      };

      db.penerima.push(newItem);
      validCount++;
    });

    saveDB();

    addLog(
      currentUser,
      'Import Data Excel',
      'Penerima Bansos',
      `Import Excel selesai: ${validCount} sukses, ${failedCount} gagal.`,
      req
    );

    return res.json({
      success: true,
      validCount,
      failedCount,
      errors,
      message: `Berhasil mengimpor ${validCount} data. ${failedCount > 0 ? failedCount + ' data gagal diimpor.' : ''}`
    });
  });

  // 4. Territory API
  app.get('/api/kecamatan', (req, res) => {
    return res.json({ success: true, kecamatan: db.kecamatan });
  });

  app.get('/api/desa', (req, res) => {
    let list = db.desa;
    if (req.query.kecamatan_id) {
      list = list.filter(d => d.kecamatan_id === req.query.kecamatan_id);
    }
    return res.json({ success: true, desa: list });
  });

  app.post('/api/desa', (req, res) => {
    const currentUser = getAuthenticatedUser(req);
    if (!currentUser || currentUser.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Hanya Admin yang dapat membuat master desa.' });
    }

    const { kecamatan_id, kode, nama } = req.body;
    if (!kecamatan_id || !nama) {
      return res.status(400).json({ success: false, message: 'Kecamatan dan Nama desa wajib diisi.' });
    }

    const newDesa: Desa = {
      id: 'desa_' + Date.now(),
      kecamatan_id,
      kode: kode || `11.11.00.${Date.now().toString().slice(-4)}`,
      nama,
      status: 'Aktif'
    };

    db.desa.push(newDesa);
    saveDB();

    addLog(currentUser, 'Tambah Desa', 'Master Wilayah', `Menambahkan desa ${nama}`, req);

    return res.json({ success: true, message: 'Desa berhasil ditambahkan.', desa: newDesa });
  });

  app.put('/api/desa/:id', (req, res) => {
    const currentUser = getAuthenticatedUser(req);
    if (!currentUser || currentUser.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Hanya Admin yang dapat mengubah master desa.' });
    }

    const des = db.desa.find(d => d.id === req.params.id);
    if (!des) return res.status(404).json({ success: false, message: 'Desa tidak ditemukan.' });

    des.nama = req.body.nama || des.nama;
    if (req.body.status) des.status = req.body.status;
    saveDB();

    addLog(currentUser, 'Edit Desa', 'Master Wilayah', `Memperbarui desa ${des.nama}`, req);

    return res.json({ success: true, message: 'Desa berhasil diperbarui.', desa: des });
  });

  // 5. Activity Logs API
  app.get('/api/logs', (req, res) => {
    const currentUser = getAuthenticatedUser(req);
    if (!currentUser || currentUser.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Hanya Admin yang dapat melihat log aktivitas.' });
    }

    let list = db.logs;
    if (req.query.user_id) list = list.filter(l => l.user_id === req.query.user_id);
    if (req.query.role) list = list.filter(l => l.role === req.query.role);
    if (req.query.modul) list = list.filter(l => l.modul === req.query.modul);

    return res.json({ success: true, logs: list });
  });

  // 6. Settings API
  app.get('/api/settings', (req, res) => {
    return res.json({ success: true, settings: db.pengaturan });
  });

  app.put('/api/settings', (req, res) => {
    const currentUser = getAuthenticatedUser(req);
    if (!currentUser || currentUser.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Hanya Admin yang dapat mengubah pengaturan.' });
    }

    db.pengaturan = {
      ...db.pengaturan,
      ...req.body
    };
    saveDB();

    addLog(currentUser, 'Ubah Pengaturan', 'Pengaturan Sistem', 'Memperbarui identitas instansi dan logo', req);

    return res.json({ success: true, message: 'Pengaturan berhasil disimpan.', settings: db.pengaturan });
  });

  // 7. Backup & Restore API
  app.get('/api/backup', (req, res) => {
    const currentUser = getAuthenticatedUser(req);
    if (!currentUser || currentUser.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Hanya Admin yang dapat backup database.' });
    }

    addLog(currentUser, 'Backup Database', 'Sistem', 'Melakukan backup data keseluruhan', req);

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=SI-BANSOS-Backup-${new Date().toISOString().slice(0, 10)}.json`);
    return res.send(JSON.stringify(db, null, 2));
  });

  app.post('/api/restore', (req, res) => {
    const currentUser = getAuthenticatedUser(req);
    if (!currentUser || currentUser.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Hanya Admin yang dapat restore database.' });
    }

    const backupData = req.body;
    if (!backupData || !Array.isArray(backupData.users) || !Array.isArray(backupData.penerima)) {
      return res.status(400).json({ success: false, message: 'Format file backup tidak valid.' });
    }

    db = backupData;
    saveDB();

    addLog(currentUser, 'Restore Database', 'Sistem', 'Melakukan restore database dari file backup', req);

    return res.json({ success: true, message: 'Database berhasil dipulihkan.' });
  });

  // Vite Integration
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server SI-BANSOS running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
