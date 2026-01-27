
const bcrypt = require('bcrypt');
const { db, initDb } = require('../src/db');

initDb();

const username = process.argv[2] || 'admin';
const password = process.argv[3] || 'admin12345';
const fullName = process.argv[4] || 'Administrator';

const hash = bcrypt.hashSync(password, 10);

try {
  db.prepare('INSERT INTO users (username, password_hash, role, full_name) VALUES (?, ?, ?, ?)')
    .run(username, hash, 'admin', fullName);
  console.log('Admin dibuat:', username);
} catch (e) {
  if (e.message.includes('UNIQUE')) {
    console.log('Username sudah ada. Tidak membuat duplikat.');
  } else {
    console.error(e);
  }
}
