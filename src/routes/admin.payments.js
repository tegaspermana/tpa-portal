// src/routes/admin.payments.js
const router = require('express').Router();
const { db } = require('../db');
const requireRole = require('../middleware/requireRole');
const { nextReceiptNo } = require('../utils/receipt');

router.use(requireRole(['admin']));

// Form pilih santri dan tampilkan tagihan outstanding
router.get('/new', (req, res) => {
  const santri_id = parseInt(req.query.santri_id || 0, 10);
  const santriAll = db.prepare('SELECT id, nis, name FROM santri WHERE active=1 ORDER BY name').all();
  let bills = [];
  if (santri_id) {
    bills = db.prepare(`
      SELECT id, period_year, period_month, name, amount_due, amount_paid,
             (amount_due - amount_paid) AS remain
      FROM bills
      WHERE santri_id=? AND status IN ('unpaid','partial')
      ORDER BY period_year ASC, period_month ASC
    `).all(santri_id);
  }
  res.render('admin/payments/new', { santriAll, santri_id, bills });
});

// Simpan pembayaran + alokasi
router.post('/', (req, res) => {
  const { santri_id, method, total_amount, notes } = req.body;
  const allocations = Array.isArray(req.body.bill_id) ? req.body.bill_id.map((id, idx) => ({
    bill_id: parseInt(id,10),
    amount: parseInt(req.body.allocate[idx] || 0, 10) || 0
  })) : [];
  const total = parseInt(total_amount, 10) || 0;

  // Validasi: sum allocation == total
  const sumAlloc = allocations.reduce((a,b)=>a+(b.amount||0),0);
  if (sumAlloc !== total) {
    return res.status(400).send(`Total alokasi (${sumAlloc}) tidak sama dengan total pembayaran (${total}).`);
  }

  // Buat payment
  const receipt = nextReceiptNo(new Date());
  const info = db.prepare(`
    INSERT INTO payments (santri_id, payer_user_id, payment_date, method, total_amount, receipt_no, notes)
    VALUES (?, NULL, datetime('now'), ?, ?, ?, ?)
  `).run(parseInt(santri_id,10), method, total, receipt, notes || null);

  const payment_id = info.lastInsertRowid;

  // Simpan allocation + update bill
  const getBill = db.prepare('SELECT amount_due, amount_paid FROM bills WHERE id=?');
  const updBill = db.prepare(`
    UPDATE bills
    SET amount_paid=?, status=?
    WHERE id=?
  `);
  const insAlloc = db.prepare(`
    INSERT INTO payment_allocations (payment_id, bill_id, amount_applied)
    VALUES (?, ?, ?)
  `);

  for (const a of allocations) {
    if (a.amount <= 0) continue;
    const bill = getBill.get(a.bill_id);
    if (!bill) continue;
    const newPaid = (bill.amount_paid || 0) + a.amount;
    const status = newPaid >= bill.amount_due ? 'paid' : (newPaid > 0 ? 'partial' : 'unpaid');
    updBill.run(newPaid, status, a.bill_id);
    insAlloc.run(payment_id, a.bill_id, a.amount);
  }

  res.redirect(`/admin/payments/${payment_id}/print`);
});

// Cetak bukti
router.get('/:id/print', (req, res) => {
  const p = db.prepare(`
    SELECT p.*, s.nis, s.name AS santri_name
    FROM payments p
    JOIN santri s ON s.id = p.santri_id
    WHERE p.id=?
  `).get(req.params.id);
  if (!p) return res.status(404).send('Pembayaran tidak ditemukan');

  const details = db.prepare(`
    SELECT b.period_year, b.period_month, b.name, a.amount_applied
    FROM payment_allocations a
    JOIN bills b ON b.id = a.bill_id
    WHERE a.payment_id=?
    ORDER BY b.period_year, b.period_month
  `).all(req.params.id);

  res.render('admin/payments/print', { p, details });
});

module.exports = router;
