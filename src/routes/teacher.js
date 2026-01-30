
const router = require('express').Router();
const requireRole = require('../middleware/requireRole');
router.use(requireRole(['teacher']));

router.get('/', (req, res) => {
  res.render('teacher/dashboard');
});

// Routes guru - progres santri
const progressRoutes = require('./teacher.progress');
router.use('/progress', progressRoutes);

// Routes guru - kehadiran
const attendanceRoutes = require('./teacher.attendance');
router.use('/attendance', attendanceRoutes);


module.exports = router;
