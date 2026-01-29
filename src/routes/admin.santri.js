
// src/routes/admin.santri.js
const router = require('express').Router();
const { db } = require('../db');
const requireRole = require('../middleware/requireRole');

router.use(requireRole(['admin']));

// List santri + pencarian
router.get('/', (req, res) => {
  const q = (req.query.q || '').trim();
  let rows;
  if (q) {
    rows = db.prepare(
      `SELECT * FROM santri WHERE nis LIKE ? OR name LIKE ? ORDER BY created_at DESC`
    ).all(`%${q}%`, `%${q}%`);
  } else {
    rows = db.prepare(`SELECT * FROM santri ORDER BY created_at DESC`).all();
  }
  res.render('admin/santri/index', { rows, q });
});

// Form tambah
router.get('/new', (req, res) => {
  res.render('admin/santri/form', { item: null, action: 'create' });
});

// Create
router.post('/', (req, res) => {
  const { nis, name, birth_date, guardian_name, phone, active } = req.body;
  try {
    db.prepare(
      `INSERT INTO santri (nis, name, birth_date, guardian_name, phone, active)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(nis?.trim(), name?.trim(), birth_date || null, guardian_name || null, phone || null, active ? 1 : 0);
    res.redirect('/admin/santri');
  } catch (e) {
    let msg = 'Gagal menyimpan data.';
    if (String(e.message).includes('UNIQUE') && String(e.message).includes('nis')) msg = 'NIS sudah digunakan.';
    res.status(400).send(msg);
  }
});

// Form edit
router.get('/:id/edit', (req, res) => {
  const item = db.prepare('SELECT * FROM santri WHERE id = ?').get(req.params.id);
  if (!item) return res.status(404).send('Santri tidak ditemukan');
  res.render('admin/santri/form', { item, action: 'update' });
});

// Update
router.post('/:id', (req, res) => {
  const { nis, name, birth_date, guardian_name, phone, active } = req.body;
  try {
    db.prepare(
      `UPDATE santri
       SET nis=?, name=?, birth_date=?, guardian_name=?, phone=?, active=?, updated_at=datetime('now')
       WHERE id=?`
    ).run(nis?.trim(), name?.trim(), birth_date || null, guardian_name || null, phone || null, active ? 1 : 0, req.params.id);
    res.redirect('/admin/santri');
  } catch (e) {
    let msg = 'Gagal memperbarui data.';
    if (String(e.message).includes('UNIQUE') && String(e.message).includes('nis')) msg = 'NIS sudah digunakan.';
    res.status(400).send(msg);
  }
});

// Delete
router.post('/:id/delete', (req, res) => {
  db.prepare('DELETE FROM santri WHERE id = ?').run(req.params.id);
  res.redirect('/admin/santri');
});

module.exports = router;