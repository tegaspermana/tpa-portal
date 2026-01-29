
const router = require('express').Router();
const bcrypt = require('bcrypt');
const { db } = require('../db');
const requireRole = require('../middleware/requireRole');

router.use(requireRole(['admin']));

// List semua Wali
router.get('/wali', (req, res) => {
  const rows = db.prepare(`SELECT id, username, full_name, phone, active FROM users WHERE role='wali' ORDER BY full_name`).all();
  res.render('admin/users/wali/index', { rows });
});

// Form tambah Wali
router.get('/wali/new', (req, res) => {
  res.render('admin/users/wali/form', { item: null });
});

router.post('/wali', (req, res) => {
  const { username, password, full_name, phone, active } = req.body;
  const hash = bcrypt.hashSync(password, 10);
  try {
    db.prepare(`INSERT INTO users (username, password_hash, role, full_name, phone, active) VALUES (?, ?, 'wali', ?, ?, ?)`)
      .run(username.trim(), hash, full_name.trim(), phone || null, active ? 1 : 0);
    res.redirect('/admin/users/wali');
  } catch (e) {
    let msg = 'Gagal menyimpan.';
    if (String(e.message).includes('UNIQUE') && String(e.message).includes('username')) msg = 'Username sudah dipakai.';
    res.status(400).send(msg);
  }
});

// Edit Wali
router.get('/wali/:id/edit', (req, res) => {
  const item = db.prepare(`SELECT id, username, full_name, phone, active FROM users WHERE id=? AND role='wali'`).get(req.params.id);
  if (!item) return res.status(404).send('Wali tidak ditemukan');
  res.render('admin/users/wali/form', { item });
});

router.post('/wali/:id', (req, res) => {
  const { full_name, phone, active } = req.body;
  db.prepare(`UPDATE users SET full_name=?, phone=?, active=?, updated_at=datetime('now') WHERE id=? AND role='wali'`)
    .run(full_name.trim(), phone || null, active ? 1 : 0, req.params.id);
  res.redirect('/admin/users/wali');
});

// Reset Password Wali
router.post('/wali/:id/reset-password', (req, res) => {
  const { new_password } = req.body; // wajib diisi oleh admin
  const hash = bcrypt.hashSync(new_password, 10);
  db.prepare(`UPDATE users SET password_hash=? WHERE id=? AND role='wali'`).run(hash, req.params.id);
  res.redirect('/admin/users/wali');
});

// === Link Wali ↔ Santri ===
router.get('/wali/:id/link', (req, res) => {
  const wali = db.prepare(`SELECT id, username, full_name FROM users WHERE id=? AND role='wali'`).get(req.params.id);
  if (!wali) return res.status(404).send('Wali tidak ditemukan');

  // santri yang sudah tertaut
  const linked = db.prepare(`
    SELECT s.id, s.nis, s.name
    FROM user_santri us JOIN santri s ON s.id = us.santri_id
    WHERE us.user_id=?
    ORDER BY s.name
  `).all(req.params.id);

  const linkedIds = new Set(linked.map(s => s.id));

  // kandidat santri aktif yang belum tertaut ke wali ini
  const candidates = db.prepare(`SELECT id, nis, name FROM santri WHERE active=1 ORDER BY name`).all()
    .filter(s => !linkedIds.has(s.id));

  res.render('admin/users/wali/link', { wali, linked, candidates });
});

router.post('/wali/:id/link', (req, res) => {
  const { santri_id } = req.body;
  try {
    db.prepare(`INSERT INTO user_santri (user_id, santri_id) VALUES (?, ?)`).run(req.params.id, parseInt(santri_id,10));
  } catch {}
  res.redirect(`/admin/users/wali/${req.params.id}/link`);
});

router.post('/wali/:id/unlink/:santri_id', (req, res) => {
  db.prepare(`DELETE FROM user_santri WHERE user_id=? AND santri_id=?`).run(req.params.id, req.params.santri_id);
  res.redirect(`/admin/users/wali/${req.params.id}/link`);
});

module.exports = router;
