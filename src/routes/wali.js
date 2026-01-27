
const router = require('express').Router();
const requireRole = require('../middleware/requireRole');
router.use(requireRole(['wali']));

router.get('/', (req, res) => {
  res.render('wali/dashboard');
});

module.exports = router;
