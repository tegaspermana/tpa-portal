
const router = require('express').Router();
const requireRole = require('../middleware/requireRole');
router.use(requireRole(['admin']));

router.get('/', (req, res) => {
  res.render('admin/dashboard');
});

// ⬇️ Tambahkan baris-baris ini:
const santriRoutes = require('./admin.santri');
const kelasRoutes = require('./admin.kelas');

router.use('/santri', santriRoutes);
router.use('/kelas', kelasRoutes);

const billingRoutes = require('./admin.billing');
const paymentRoutes = require('./admin.payments');
router.use('/billing', billingRoutes);
router.use('/payments', paymentRoutes);

const userAdminRoutes = require('./admin.users');
router.use('/users', userAdminRoutes);



module.exports = router;
