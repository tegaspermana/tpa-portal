// src/utils/receipt.js
const { db } = require('../db');

function pad(num, size) {
  let s = String(num);
  while (s.length < size) s = '0' + s;
  return s;
}

function nextReceiptNo(date = new Date()) {
  const ym = `${date.getFullYear()}-${pad(date.getMonth() + 1, 2)}`;
  const row = db.prepare('SELECT last_seq FROM receipt_sequence WHERE year_month=?').get(ym);
  let seq = 1;
  if (!row) {
    db.prepare('INSERT INTO receipt_sequence (year_month, last_seq) VALUES (?, ?)').run(ym, 0);
  } else {
    seq = row.last_seq + 1;
  }
  db.prepare('UPDATE receipt_sequence SET last_seq=? WHERE year_month=?').run(seq, ym);
  return `TPA-${ym}-${pad(seq, 5)}`;
}

module.exports = { nextReceiptNo };
