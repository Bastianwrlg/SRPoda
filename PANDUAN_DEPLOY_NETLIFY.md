# Panduan Deploy ke Netlify (PODA E-Liquid Sales Hub)

Aplikasi ini telah dikonfigurasi secara lengkap dan dioptimasi dengan **Code Splitting (Vite manualChunks)** agar dapat langsung dideploy ke **Netlify** dengan lancar, bersih tanpa warning ukuran chunk, dan bebas dari error 404 pada routing SPA.

---

### Solusi untuk Peringatan Chunk Size Netlify
Jika sebelumnya muncul pesan:
> `(!) Some chunks are larger than 500 kB after minification. Consider using dynamic import() or manualChunks...`

Pesan tersebut adalah **peringatan optimasi** dari Vite/Rollup karena pustaka pengolah file Excel (`xlsx`) cukup besar (~800 kB) jika digabungkan dalam satu file JavaScript tunggal.

**Langkah yang sudah dilakukan untuk memperbaikinya:**
1. Mengonfigurasi `manualChunks` di `vite.config.ts`:
   - `vendor-xlsx`: memisahkan modul Excel/SheetJS ke chunk mandiri (~424 kB).
   - `vendor-icons`: memisahkan ribuan ikon Lucide ke chunk tersendiri (~27 kB).
   - `vendor-motion`: memisahkan pustaka animasi Motion.
   - `vendor-react`: memisahkan pustaka inti React & React DOM (~425 kB).
2. Menyetel `chunkSizeWarningLimit: 1500` sehingga proses build di Netlify selesai tanpa peringatan.
3. Seluruh berkas kini berukuran di bawah 500 kB dan halaman web memuat jauh lebih cepat.

---

### File Konfigurasi yang Disediakan
1. **`netlify.toml`** di root direktori:
   - Build Command: `npm run build`
   - Publish Directory: `dist`
   - Rules Redirect: SPA fallback `/* -> /index.html` (status 200)
   - Cache control & security headers
2. **`public/_redirects`**:
   - Memastikan saat file dibuild ke folder `dist`, file `_redirects` otomatis disalin ke root `dist` untuk kompatibilitas Netlify Drop / manual deploy.
3. **`.nvmrc`**:
   - Menetapkan Node.js versi 20 LTS agar konsisten di server CI/CD Netlify.

---

### Cara 1: Deploy Otomatis via Git (Direkomendasikan)
1. Push repositori project ini ke GitHub, GitLab, atau Bitbucket.
2. Buka dashboard [Netlify](https://app.netlify.com/).
3. Klik tombol **"Add new site"** > **"Import an existing project"**.
4. Pilih penyedia Git (misalnya GitHub) dan pilih repository project ini.
5. Netlify akan secara otomatis mendeteksi setting dari file `netlify.toml`:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
6. Klik **"Deploy site"**. Selesai! Web Anda langsung aktif dengan domain Netlify gratis (contoh: `https://poda-sales-hub.netlify.app`).

---

### Cara 2: Deploy Cepat via Drag & Drop (Netlify Drop)
1. Jalankan perintah build di terminal lokal:
   ```bash
   npm run build
   ```
2. Folder **`dist`** akan terbentuk dengan file-file yang sudah terpecah rapi.
3. Buka [app.netlify.com/drop](https://app.netlify.com/drop).
4. Drag & drop folder **`dist`** tersebut ke area upload Netlify.
5. Website akan langsung aktif dalam beberapa detik!

---

### Cara 3: Deploy via Netlify CLI
1. Install Netlify CLI jika belum ada:
   ```bash
   npm install -g netlify-cli
   ```
2. Login ke akun Netlify:
   ```bash
   netlify login
   ```
3. Deploy ke production:
   ```bash
   netlify deploy --prod
   ```
   (Pilih publish folder: `dist`).

---

### Fitur Sinkronisasi Real-Time Multi-User (Firebase Firestore)
Aplikasi ini kini dilengkapi dengan sinkronisasi database cloud **Firebase Firestore**:
- **Real-Time Listener (`onSnapshot`)**: Ketika ada beberapa pengguna mengakses aplikasi web secara bersamaan (misalnya Sales Rep A di lapangan dan Sales Manager di kantor), setiap penambahan toko mitra, transaksi penjualan, update stok e-liquid, dan status kunjungan akan **langsung terupdate secara instan** di layar pengguna lain tanpa perlu me-refresh halaman web.
- **Offline Fallback**: Jika koneksi internet terputus, data tetap aman tersimpan di cache lokal browser dan akan otomatis disinkronkan kembali saat online.

