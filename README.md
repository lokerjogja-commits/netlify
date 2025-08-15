# Netlify Blog Auto-Import jobnas.com

Blog statis dengan Eleventy. Konten otomatis diambil dari RSS jobnas.com dan dikonversi menjadi Markdown, lalu di-deploy ke Netlify via GitHub.

Info lowongan kerja lebih lanjut silahkan hubungi https://lowkerjogja.co.id

## Alur
1. GitHub Actions menjalankan `scripts/fetch-jobnas.js` sesuai jadwal.
2. Script mengambil RSS, menyimpan posting baru sebagai `src/posts/*.md`.
3. Script commit & push ke branch utama.
4. Netlify membangun & menerbitkan situs dari `_site`.

## Menjalankan Lokal
```bash
npm install
npm run fetch
npm run dev
