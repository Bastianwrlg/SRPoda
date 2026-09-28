# Panduan Deploy ke Netlify (PODA E-Liquid Sales Hub)

Aplikasi ini telah dikonfigurasi secara lengkap agar dapat langsung dideploy ke **Netlify** dengan lancar tanpa error 404 pada routing SPA.

---

### File Konfigurasi yang Telah Disediakan
1. **`netlify.toml`** di root direktori:
   - Build Command: `npm run build`
   - Publish Directory: `dist`
   - Rules Redirect: SPA fallback `/* -> /index.html` (status 200)
   - Cache control & security headers
2. **`public/_redirects`**:
   - Memastikan saat file dibuild ke folder `dist`, file `_redirects` tetap tersedia untuk Netlify Drop/manual deploy.
3. **`.nvmrc`**:
   - Menetapkan Node.js versi 20 LTS agar kompatibel penuh dengan Vite 6.

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
1. Jalankan perintah build di komputer/terminal Anda:
   ```bash
   npm run build
   ```
2. Folder **`dist`** akan terbentuk.
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
