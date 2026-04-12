# cPanel Git Deploy (Beta)

Folder ini menyediakan alur deploy frontend Vue yang kompatibel dengan cPanel.

## Fungsi setup ini

- Menjalankan `npm ci` + `npm run build` pada setiap deploy cPanel.
- Mem-publish hasil build ke `public_html/beta` (bisa dikonfigurasi).
- Menyalin `.htaccess` production dengan proxy API + fallback SPA.

## Prasyarat

- Akun cPanel dengan Git Version Control aktif.
- Akses terminal di cPanel.
- Node.js dan npm tersedia (`node -v`, `npm -v`).

## Setup server sekali saja

1. Clone repository di cPanel Git Version Control.
2. Pastikan branch mengarah ke branch beta Anda.
3. Jadikan script deploy executable:

```bash
chmod +x deploy/cpanel/deploy.sh
```

4. Deploy dari cPanel Git UI dengan **Deploy HEAD Commit**.

## Override environment opsional

- `CPANEL_FRONTEND_PUBLISH_DIR` (default: `$HOME/public_html/beta`)

## Routing API

File `.htaccess` yang disalin akan mem-proxy `/api/*` dan `/uploads/*` ke `127.0.0.1:18080`.

Jika host Anda tidak mengizinkan aturan proxy di `.htaccess`, gunakan subdomain `api-beta` yang langsung mengarah ke hosting backend lalu sesuaikan strategi base API frontend.

## URL Beta

Setelah deploy, frontend seharusnya dilayani dari:

- `https://domain-anda.com/beta`

Pastikan CORS backend (`CORS_ORIGINS`) mencakup URL beta tersebut.
