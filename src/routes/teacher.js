
const router = require('express').Router();
const requireRole = require('../middleware/requireRole');
router.use(requireRole(['teacher']));

router.get('/', (req, res) => {
  res.render('teacher/dashboard');
});

module.exports = router;
