
# Portal Pembayaran Santri TPA — Boilerplate

Stack: **Express.js + EJS + TailwindCSS + SQLite (better-sqlite3)**

## Prasyarat
- Node.js 18/20
- Git
- VS Code (disarankan) + ekstensi: Tailwind, Prettier

## Setup Lokal (Windows 11 / VS Code)
```bash
cd tpa-payment-portal
copy .env.example .env   # Windows PowerShell: copy
npm install
npm run dev              # jalankan server + tailwind watch
# Di terminal lain, buat admin pertama:
npm run db:seed:admin -- admin admin12345 "Administrator"
```
Akses: http://localhost:3000 → login dengan admin/admin12345 lalu ubah di produksi.

## Struktur Penting
- `src/db/schema.sql` — skema database
- `src/db/index.js` — inisialisasi DB (WAL)
- `src/routes/*` — route dasar: auth, admin, wali, teacher
- `src/views/*` — tampilan EJS
- `public/css/output.css` — hasil build Tailwind

## Perintah Tailwind
- Dev: `npm run dev` (otomatis watch)
- Build: `npm run css:build`

## Docker (Produksi)
```bash
# build image
docker compose build
# jalankan
docker compose up -d
# lihat log
docker logs -f tpa-portal
```
Pastikan file `.env` ada berisi `SESSION_SECRET` & `APP_BASE_URL`. Data SQLite dipersist di folder `data/`.

## Deploy ke Ubuntu Server (ringkas)
1. Instal Docker & Compose
2. Clone/push repo ke server
3. `cp .env.example .env` lalu set `SESSION_SECRET`
4. `docker compose up -d --build`
5. (Opsional) Pasang reverse proxy (Caddy/Nginx) untuk HTTPS

## Git & GitHub
```bash
# inisialisasi repo lokal
git init
git add .
git commit -m "init: tpa portal boilerplate"
# buat repo GitHub lalu push
# opsi 1 (manual): buat repo di GitHub, lalu:
git remote add origin https://github.com/<user>/<repo>.git
git branch -M main
git push -u origin main
# opsi 2 (GH CLI):
# gh repo create <repo> --source . --public --push
```

## Catatan Windows
- `better-sqlite3` biasanya punya prebuilt. Jika gagal, install build tools (Visual Studio Build Tools) atau gunakan WSL.

## Lisensi
Internal/Private
