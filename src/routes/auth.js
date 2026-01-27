
const router = require('express').Router();
const bcrypt = require('bcrypt');
const { db } = require('../db');

router.get('/login', (req, res) => {
  res.render('auth/login', { error: null });
});

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE username = ? AND active = 1').get(username);
  if (!user) return res.render('auth/login', { error: 'User tidak ditemukan atau tidak aktif.' });
  const ok = bcrypt.compareSync(password, user.password_hash);
  if (!ok) return res.render('auth/login', { error: 'Password salah.' });
  req.session.user = { id: user.id, role: user.role, full_name: user.full_name };
  res.redirect('/');
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/auth/login'));
});

module.exports = router;
