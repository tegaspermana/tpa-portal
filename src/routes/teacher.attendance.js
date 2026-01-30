
// src/routes/teacher.attendance.js
const router = require('express').Router();
const { db } = require('../db');
const requireRole = require('../middleware/requireRole');

router.use(requireRole(['teacher']));

function todayStr() { return new Date().toISOString().slice(0,10); }

// Halaman utama: status hari ini + riwayat
router.get('/', (req, res) => {
  const uid = req.session.user.id;
  const today = todayStr();

  const todayRow = db.prepare(`
    SELECT id, date, status, note
    FROM teacher_attendance
    WHERE teacher_user_id=? AND date=?
  `).get(uid, today);

  const history = db.prepare(`
    SELECT date, status, note
    FROM teacher_attendance
    WHERE teacher_user_id=?
    ORDER BY date DESC
    LIMIT 60
  `).all(uid);

  res.render('teacher/attendance/index', { today, todayRow, history });
});

// Tandai kehadiran hari ini (create or update)
router.post('/', (req, res) => {
  const uid = req.session.user.id;
  const { status, note } = req.body;
  const today = todayStr();

  // Upsert: jika sudah ada, update; jika belum, insert
  const exists = db.prepare(`
    SELECT id FROM teacher_attendance WHERE teacher_user_id=? AND date=?
  `).get(uid, today);

  if (exists) {
    db.prepare(`
      UPDATE teacher_attendance SET status=?, note=?, created_at=datetime('now') WHERE id=?
    `).run(status, note || null, exists.id);
  } else {
    db.prepare(`
      INSERT INTO teacher_attendance (teacher_user_id, date, status, note)
      VALUES (?, ?, ?, ?)
    `).run(uid, today, status, note || null);
  }

  res.redirect('/teacher/attendance');
});

module.exports = router;
