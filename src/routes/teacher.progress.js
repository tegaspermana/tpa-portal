
// src/routes/teacher.progress.js
const router = require('express').Router();
const { db } = require('../db');
const requireRole = require('../middleware/requireRole');

router.use(requireRole(['teacher']));

// Ambil semua santri aktif (opsional: nanti filter by kelas yang diajar)
function getAllSantri() {
  return db.prepare(`SELECT id, nis, name FROM santri WHERE active=1 ORDER BY name`).all();
}

// List + form input progres
router.get('/', (req, res) => {
  const santri_id = parseInt(req.query.santri_id || 0, 10);
  const santriAll = getAllSantri();
  let selected = null;
  let records = [];
  if (santri_id) {
    selected = db.prepare('SELECT id, nis, name FROM santri WHERE id=?').get(santri_id);
    records = db.prepare(`
      SELECT id, date, category, value, note
      FROM progress_records
      WHERE santri_id=?
      ORDER BY date DESC, id DESC
      LIMIT 50
    `).all(santri_id);
  }
  res.render('teacher/progress/index', { santriAll, santri_id, selected, records });
});

// Tambah progres
router.post('/', (req, res) => {
  const { santri_id, date, category, value, note } = req.body;
  const teacher_id = req.session.user.id;
  db.prepare(`
    INSERT INTO progress_records (santri_id, date, teacher_user_id, category, value, note)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(parseInt(santri_id,10), date || new Date().toISOString().slice(0,10), teacher_id, category, value.trim(), note || null);
  res.redirect(`/teacher/progress?santri_id=${santri_id}`);
});

// Hapus progres (opsional)
router.post('/:id/delete', (req, res) => {
  // keamanan minimal: pastikan yang menghapus adalah teacher (sudah via middleware).
  const row = db.prepare('SELECT santri_id FROM progress_records WHERE id=?').get(req.params.id);
  if (row) {
    db.prepare('DELETE FROM progress_records WHERE id=?').run(req.params.id);
    return res.redirect(`/teacher/progress?santri_id=${row.santri_id}`);
  }
  res.redirect('/teacher/progress');
});

module.exports = router;
