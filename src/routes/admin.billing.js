
// src/routes/admin.billing.js
const router = require('express').Router();
const { db } = require('../db');
const requireRole = require('../middleware/requireRole');

router.use(requireRole(['admin']));

/** ===== Templates per santri ===== **/
router.get('/templates', (req, res) => {
  // Pilih santri dulu
  const q = (req.query.q || '').trim();
  const santriList = q
    ? db.prepare('SELECT id, nis, name FROM santri WHERE nis LIKE ? OR name LIKE ? ORDER BY name')
        .all(`%${q}%`, `%${q}%`)
    : [];
  const santri_id = req.query.santri_id || (santriList[0]?.id ?? null);

  let templates = [];
  if (santri_id) {
    templates = db.prepare('SELECT * FROM bill_templates WHERE santri_id=? ORDER BY id DESC').all(santri_id);
  }

  res.render('admin/billing/templates', { q, santriList, santri_id, templates });
});

router.post('/templates/:santri_id', (req, res) => {
  const { name, amount, recurrence, start_month, end_month, active } = req.body;
  db.prepare(`
    INSERT INTO bill_templates (santri_id, name, amount, recurrence, start_month, end_month, active)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(req.params.santri_id, name.trim(), parseInt(amount, 10), recurrence, start_month, end_month || null, active ? 1 : 0);
  res.redirect(`/admin/billing/templates?santri_id=${req.params.santri_id}`);
});

router.post('/templates/:id/update', (req, res) => {
  const { name, amount, recurrence, start_month, end_month, active, santri_id } = req.body;
  db.prepare(`
    UPDATE bill_templates
    SET name=?, amount=?, recurrence=?, start_month=?, end_month=?, active=?
    WHERE id=?
  `).run(name.trim(), parseInt(amount, 10), recurrence, start_month, end_month || null, active ? 1 : 0, req.params.id);
  res.redirect(`/admin/billing/templates?santri_id=${santri_id}`);
});

router.post('/templates/:id/delete', (req, res) => {
  const { santri_id } = req.body;
  db.prepare('DELETE FROM bill_templates WHERE id=?').run(req.params.id);
  res.redirect(`/admin/billing/templates?santri_id=${santri_id}`);
});

/** ===== Generate tagihan bulanan ===== **/
router.get('/generate', (req, res) => {
  res.render('admin/billing/generate', { info: null });
});

router.post('/generate', (req, res) => {
  const year = parseInt(req.body.year, 10);
  const month = parseInt(req.body.month, 10);

  const santriAll = db.prepare('SELECT id FROM santri WHERE active=1').all();
  let created = 0;

  for (const s of santriAll) {
    const tmpls = db.prepare(`
      SELECT * FROM bill_templates
      WHERE santri_id=? AND active=1
        AND start_month <= printf('%04d-%02d', ?, ?)
        AND (end_month IS NULL OR end_month >= printf('%04d-%02d', ?, ?))
        AND recurrence='monthly'
    `).all(s.id, year, month, year, month);

    for (const t of tmpls) {
      // Cek duplikat
      const exists = db.prepare(`
        SELECT 1 FROM bills
        WHERE santri_id=? AND period_year=? AND period_month=? AND template_id=?
      `).get(s.id, year, month, t.id);

      if (!exists) {
        db.prepare(`
          INSERT INTO bills
            (santri_id, period_year, period_month, template_id, name, amount_due, amount_paid, status)
          VALUES (?, ?, ?, ?, ?, ?, 0, 'unpaid')
        `).run(s.id, year, month, t.id, t.name, t.amount);
        created++;
      }
    }
  }

  res.render('admin/billing/generate', { info: `Berhasil generate ${created} tagihan untuk ${year}-${String(month).padStart(2, '0')}.` });
});

/** ===== Daftar tagihan & manual add ===== **/
router.get('/bills', (req, res) => {
  const { year, month, status } = req.query;
  let where = '1=1';
  const params = [];
  if (year) { where += ' AND period_year=?'; params.push(parseInt(year,10)); }
  if (month) { where += ' AND period_month=?'; params.push(parseInt(month,10)); }
  if (status) { where += ' AND status=?'; params.push(status); }

  const bills = db.prepare(`
    SELECT b.*, s.nis, s.name AS santri_name
    FROM bills b
    JOIN santri s ON s.id = b.santri_id
    WHERE ${where}
    ORDER BY b.period_year DESC, b.period_month DESC, s.name ASC
  `).all(...params);

  const santriAll = db.prepare('SELECT id, nis, name FROM santri WHERE active=1 ORDER BY name').all();

  res.render('admin/billing/bills', { bills, santriAll, filters: { year, month, status } });
});

router.post('/bills/manual', (req, res) => {
  const { santri_id, name, year, month, amount_due } = req.body;
  db.prepare(`
    INSERT INTO bills (santri_id, period_year, period_month, template_id, name, amount_due, amount_paid, status)
    VALUES (?, ?, ?, NULL, ?, ?, 0, 'unpaid')
  `).run(parseInt(santri_id,10), parseInt(year,10), parseInt(month,10), name.trim(), parseInt(amount_due,10));
  res.redirect(`/admin/billing/bills?year=${year}&month=${month}`);
});

module.exports = router;
