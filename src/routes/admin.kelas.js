
// src/routes/admin.kelas.js
const router = require('express').Router();
const { db } = require('../db');
const requireRole = require('../middleware/requireRole');

router.use(requireRole(['admin']));

// List kelas
router.get('/', (req, res) => {
  const rows = db.prepare(`SELECT * FROM classes ORDER BY id DESC`).all();
  res.render('admin/kelas/index', { rows });
});

// Form tambah
router.get('/new', (req, res) => {
  res.render('admin/kelas/form', { item: null, action: 'create' });
});

// Create
router.post('/', (req, res) => {
  const { name, program, active } = req.body;
  db.prepare(`INSERT INTO classes (name, program, active) VALUES (?, ?, ?)`)
    .run(name?.trim(), program || null, active ? 1 : 0);
  res.redirect('/admin/kelas');
});

// Form edit
router.get('/:id/edit', (req, res) => {
  const item = db.prepare('SELECT * FROM classes WHERE id = ?').get(req.params.id);
  if (!item) return res.status(404).send('Kelas tidak ditemukan');
  res.render('admin/kelas/form', { item, action: 'update' });
});

// Update
router.post('/:id', (req, res) => {
  const { name, program, active } = req.body;
  db.prepare(`UPDATE classes SET name=?, program=?, active=? WHERE id=?`)
    .run(name?.trim(), program || null, active ? 1 : 0, req.params.id);
  res.redirect('/admin/kelas');
});

// Delete
router.post('/:id/delete', (req, res) => {
  db.prepare('DELETE FROM classes WHERE id = ?').run(req.params.id);
  res.redirect('/admin/kelas');
});

// --- Anggota kelas ---

// Halaman anggota (aktif)
router.get('/:id/anggota', (req, res) => {
  const kelas = db.prepare('SELECT * FROM classes WHERE id=?').get(req.params.id);
  if (!kelas) return res.status(404).send('Kelas tidak ditemukan');

  const anggota = db.prepare(`
    SELECT s.id, s.nis, s.name, m.start_date
    FROM santri_class_membership m
    JOIN santri s ON s.id = m.santri_id
    WHERE m.class_id = ? AND (m.end_date IS NULL)
    ORDER BY s.name
  `).all(req.params.id);

  const already = new Set(anggota.map(a => a.id));
  const kandidat = db.prepare('SELECT id, nis, name FROM santri WHERE active=1 ORDER BY name').all()
    .filter(s => !already.has(s.id));

  res.render('admin/kelas/anggota', { kelas, anggota, kandidat });
});

// Tambah anggota (mulai aktif per tanggal)
router.post('/:id/anggota', (req, res) => {
  const { santri_id, start_date } = req.body;
  const exists = db.prepare(
    'SELECT 1 FROM santri_class_membership WHERE santri_id=? AND class_id=? AND end_date IS NULL'
  ).get(santri_id, req.params.id);
  if (!exists) {
    db.prepare(
      'INSERT INTO santri_class_membership (santri_id, class_id, start_date) VALUES (?, ?, ?)'
    ).run(santri_id, req.params.id, start_date || new Date().toISOString().slice(0,10));
  }
  res.redirect(`/admin/kelas/${req.params.id}/anggota`);
});

// Akhiri keanggotaan aktif (set end_date = today)
router.post('/:id/anggota/:santri_id/remove', (req, res) => {
  const today = new Date().toISOString().slice(0,10);
  db.prepare(
    'UPDATE santri_class_membership SET end_date=? WHERE class_id=? AND santri_id=? AND end_date IS NULL'
  ).run(today, req.params.id, req.params.santri_id);
  res.redirect(`/admin/kelas/${req.params.id}/anggota`);
});

module.exports = router;
