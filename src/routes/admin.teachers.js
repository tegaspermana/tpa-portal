
const router = require('express').Router();
const bcrypt = require('bcrypt');
const { db } = require('../db');
const requireRole = require('../middleware/requireRole');

router.use(requireRole(['admin']));

// List semua teacher
router.get('/', (req, res) => {
  const rows = db.prepare(`
    SELECT id, username, full_name, phone, active
    FROM users
    WHERE role='teacher'
    ORDER BY full_name
  `).all();
  res.render('admin/users/teacher/index', { rows });
});

// Form tambah teacher
router.get('/new', (req, res) => {
  res.render('admin/users/teacher/form', { item: null });
});

// Simpan teacher
router.post('/', (req, res) => {
  const { username, password, full_name, phone, active } = req.body;
  const hash = bcrypt.hashSync(password, 10);

  try {
    db.prepare(`
      INSERT INTO users (username, password_hash, role, full_name, phone, active)
      VALUES (?, ?, 'teacher', ?, ?, ?)
    `).run(username.trim(), hash, full_name.trim(), phone || null, active ? 1 : 0);

    res.redirect('/admin/users/teachers');
  } catch (e) {
    let msg = 'Gagal menyimpan.';
    if (String(e.message).includes('UNIQUE')) msg = 'Username sudah terpakai.';
    res.status(400).send(msg);
  }
});

// Edit teacher
router.get('/:id/edit', (req, res) => {
  const item = db.prepare(`
    SELECT id, username, full_name, phone, active
    FROM users WHERE id=? AND role='teacher'
  `).get(req.params.id);

  if (!item) return res.status(404).send('Guru tidak ditemukan');
  res.render('admin/users/teacher/form', { item });
});

// Update teacher
router.post('/:id', (req, res) => {
  const { full_name, phone, active } = req.body;
  db.prepare(`
    UPDATE users SET full_name=?, phone=?, active=?, updated_at=datetime('now')
    WHERE id=? AND role='teacher'
  `).run(full_name.trim(), phone || null, active ? 1 : 0, req.params.id);

  res.redirect('/admin/users/teachers');
});

// Reset password teacher
router.post('/:id/reset-password', (req, res) => {
  const { new_password } = req.body;
  const hash = bcrypt.hashSync(new_password, 10);
  db.prepare(`UPDATE users SET password_hash=? WHERE id=? AND role='teacher'`)
    .run(hash, req.params.id);
  res.redirect('/admin/users/teachers');
});

module.exports = router;