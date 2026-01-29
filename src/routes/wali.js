
const router = require('express').Router();
const requireRole = require('../middleware/requireRole');
const { db } = require('../db');

router.use(requireRole(['wali']));

// Ambil daftar santri milik wali yang login
function getChildren(userId) {
  return db.prepare(`
    SELECT s.id, s.nis, s.name
    FROM user_santri us
    JOIN santri s ON s.id = us.santri_id
    WHERE us.user_id=?
    ORDER BY s.name
  `).all(userId);
}

// Halaman pemilihan anak (jika >1)
router.get('/', (req, res) => {
  const kids = getChildren(req.session.user.id);
  if (kids.length === 0) {
    return res.status(403).send('Akun wali ini belum ditautkan ke santri manapun.');
  }
  if (kids.length === 1) {
    return res.redirect(`/wali/santri/${kids[0].id}`);
  }
  res.render('wali/pilih-anak', { kids });
});

// Dashboard anak tertentu
router.get('/santri/:id', (req, res) => {
  const santriId = parseInt(req.params.id, 10);
  const kids = getChildren(req.session.user.id);
  const allowed = kids.find(k => k.id === santriId);
  if (!allowed) return res.status(403).send('Santri tidak terdaftar pada akun ini.');

  // Ringkasan tagihan outstanding
  const summary = db.prepare(`
    SELECT 
      COUNT(*) AS cnt,
      COALESCE(SUM(amount_due - amount_paid), 0) AS total_sisa
    FROM bills
    WHERE santri_id=? AND status IN ('unpaid','partial')
  `).get(santriId);

  // Daftar tagihan outstanding
  const outstanding = db.prepare(`
    SELECT id, period_year, period_month, name, amount_due, amount_paid
    FROM bills
    WHERE santri_id=? AND status IN ('unpaid','partial')
    ORDER BY period_year ASC, period_month ASC
  `).all(santriId);

  // Riwayat pembayaran (terbaru dulu)
  const payments = db.prepare(`
    SELECT id, payment_date, method, total_amount, receipt_no
    FROM payments
    WHERE santri_id=?
    ORDER BY datetime(payment_date) DESC
  `).all(santriId);

  res.render('wali/dashboard-anak', {
    child: allowed,
    summary,
    outstanding,
    payments
  });
});

// Cetak bukti pembayaran (gunakan view admin/print yang sama)
router.get('/pembayaran/:id/print', (req, res) => {
  // Validasi bahwa bukti pembayaran adalah milik anak wali
  const pay = db.prepare(`
    SELECT p.id, p.santri_id
    FROM payments p
    WHERE p.id=?
  `).get(req.params.id);
  if (!pay) return res.status(404).send('Bukti tidak ditemukan.');

  const kids = getChildren(req.session.user.id);
  const owns = kids.find(k => k.id === pay.santri_id);
  if (!owns) return res.status(403).send('Tidak berhak mengakses bukti ini.');

  // Ambil data lengkap lalu render halaman print (re-use)
  const p = db.prepare(`
    SELECT p.*, s.nis, s.name AS santri_name
    FROM payments p JOIN santri s ON s.id = p.santri_id
    WHERE p.id=?
  `).get(req.params.id);
  const details = db.prepare(`
    SELECT b.period_year, b.period_month, b.name, a.amount_applied
    FROM payment_allocations a JOIN bills b ON b.id = a.bill_id
    WHERE a.payment_id=?
    ORDER BY b.period_year, b.period_month
  `).all(req.params.id);
  res.render('admin/payments/print', { p, details }); // reuse view
});

module.exports = router;
