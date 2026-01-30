
const router = require('express').Router();
const requireRole = require('../middleware/requireRole');
router.use(requireRole(['admin']));

router.get('/', (req, res) => {
  res.render('admin/dashboard');
});

// Tambahkan route untuk manajemen santri dan kelas
const santriRoutes = require('./admin.santri');
const kelasRoutes = require('./admin.kelas');

router.use('/santri', santriRoutes);
router.use('/kelas', kelasRoutes);

// Tambahkan route untuk billing dan payments
const billingRoutes = require('./admin.billing');
const paymentRoutes = require('./admin.payments');
router.use('/billing', billingRoutes);
router.use('/payments', paymentRoutes);

// Tambahkan route untuk user admin
const userAdminRoutes = require('./admin.users');
router.use('/users', userAdminRoutes);

// Tambahkan route untuk user guru 
const teacherUserRoutes = require('./admin.teachers');
router.use('/users/teachers', teacherUserRoutes);




module.exports = router;
