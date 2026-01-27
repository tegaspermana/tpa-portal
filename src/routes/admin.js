
const router = require('express').Router();
const requireRole = require('../middleware/requireRole');
router.use(requireRole(['admin']));

router.get('/', (req, res) => {
  res.render('admin/dashboard');
});

module.exports = router;
