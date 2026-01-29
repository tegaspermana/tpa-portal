
require('dotenv').config();
const express = require('express');
const path = require('path');
const session = require('express-session');
const morgan = require('morgan');

const { initDb } = require('./db');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const waliRoutes = require('./routes/wali');
const teacherRoutes = require('./routes/teacher');

initDb();

const app = express();
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(morgan('dev'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use('/public', express.static(path.join(__dirname, '../public')));

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'dev-secret',
    resave: false,
    saveUninitialized: false,
  })
);

// Expose user to templates
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

app.get('/', (req, res) => {
  if (!req.session.user) return res.redirect('/auth/login');
  const role = req.session.user.role;
  if (role === 'admin') return res.redirect('/admin');
  if (role === 'teacher') return res.redirect('/teacher');
  return res.redirect('/wali');
});

app.use('/auth', authRoutes);
app.use('/admin', adminRoutes);
app.use('/wali', waliRoutes);
app.use('/teacher', teacherRoutes);

const port = process.env.PORT || 3131;
app.listen(port, () => console.log(`Running: http://localhost:${port}`));
