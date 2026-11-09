DRIP CLIENT STORE — PAKET WEBSITE

ISI
- site/: website katalog untuk GitHub Pages
- worker/: backend Cloudflare Worker untuk login admin dan API rahasia

PENTING
GitHub Pages hanya hosting statis. Karena Drip API key dapat membelanjakan saldo, jangan pernah menaruh key di site/app.js, HTML, atau repository GitHub. Backend Worker menyimpan key sebagai secret.

LANGKAH 1 — SIAPKAN BACKEND AMAN
1. Buat akun Cloudflare dan pasang Wrangler (npm install -g wrangler).
2. Masuk folder worker.
3. Jalankan: wrangler deploy
4. Atur secrets:
   wrangler secret put ADMIN_USER       (isi: kiacantik)
   wrangler secret put ADMIN_PASSWORD   (isi password admin yang Anda tentukan)
   wrangler secret put SESSION_SECRET   (isi string acak panjang, minimal 32 karakter)
   wrangler secret put DRIP_API_KEY     (isi API key Drip Anda)
5. Di worker/wrangler.toml, ganti ALLOWED_ORIGIN dengan alamat GitHub Pages Anda, misalnya https://username.github.io atau https://username.github.io/nama-repo.
6. Deploy ulang: wrangler deploy
7. Salin URL Worker yang diberikan Cloudflare.

LANGKAH 2 — GITHUB PAGES
1. Edit site/app.js, ganti https://YOUR-WORKER.workers.dev dengan URL Worker Anda.
2. Buat repository GitHub baru.
3. Upload seluruh isi folder site ke root repository (index.html harus di root).
4. Settings → Pages → Deploy from a branch → pilih main dan /(root) → Save.
5. Buka alamat GitHub Pages.

LOGIN ADMIN
Username default yang diminta: kiacantik
Password tidak ditanam dalam file. Masukkan password yang sama saat menjalankan `wrangler secret put ADMIN_PASSWORD`. Dengan cara ini password tidak tampil di source publik.

FITUR
- Katalog produk live dari GET /api/v1/products.
- Login admin diproses di backend.
- Admin dapat melihat saldo dan membuat pesanan API.
- Pemesanan admin langsung memotong saldo Drip + biaya API. Pastikan uang pelanggan sudah diterima terlebih dahulu.
- Website ini belum mengintegrasikan payment gateway atau checkout pelanggan otomatis. Jangan tampilkan tombol beli publik sebelum sistem pembayaran Anda disiapkan.

CATATAN
- API key hanya berada di Cloudflare Worker secret.
- Gunakan API key sandbox untuk pengujian pertama.
- Harga dari endpoint publik adalah harga retail. Untuk harga akun seller, backend meneruskan API key saat mengambil katalog.
- Bila ingin checkout otomatis, perlu menambahkan payment gateway dan webhook/verifikasi pembayaran.
- Tidak ada jaminan bebas error pada semua akun/konfigurasi; uji dengan sandbox sebelum transaksi live.

Dokumentasi API: https://www.dripclientofficial.dev/developers
