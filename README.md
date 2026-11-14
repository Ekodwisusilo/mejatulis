# Meja Tulis

Aplikasi untuk mencatat tulisan (puisi, fiksi mini, cerpen, novel, esai), mengikuti empat tahap (Persiapan → Menulis → Editorial → Terkirim), dan melacak tenggat lomba menulis.

- **Tanpa akun, tanpa server.** Semua data tersimpan di perangkatmu sendiri.
- **Bisa dipasang** seperti aplikasi di HP dan laptop, dan **tetap jalan tanpa internet**.
- **Ada riwayat versi** untuk setiap draf, dan **tiga cara mencadangkan** data.

---

## 1. Menaruh aplikasi di internet (GitHub Pages)

Kamu tidak perlu memakai terminal. Semua dilakukan lewat situs GitHub.

1. Buat akun gratis di [github.com](https://github.com) lalu masuk.
2. Klik tanda **+** di kanan atas, pilih **New repository**.
3. Isi **Repository name** (misalnya `meja-tulis`). Pilih **Public**. Klik **Create repository**.
4. Di halaman repositori yang baru, klik tautan **uploading an existing file**.
5. Buka folder Meja Tulis di komputermu. **Pilih semua isinya** (`index.html`, `sw.js`, `manifest.webmanifest`, folder `css`, `js`, `icons`) lalu seret ke halaman GitHub.
   - Seret *isi* folder, bukan folder induknya, supaya `index.html` berada paling atas.
   - Folder `_asal` dan berkas `README.md` boleh ikut, boleh tidak.
6. Tunggu sampai semua berkas muncul, lalu klik **Commit changes**.
7. Klik **Settings** → **Pages** (menu kiri).
8. Di bagian **Build and deployment**, pada **Source** pilih **Deploy from a branch**. Pada **Branch** pilih `main` dan folder `/ (root)`, lalu klik **Save**.
9. Tunggu 1–2 menit, lalu muat ulang halaman Settings → Pages. Alamat aplikasimu muncul di bagian atas, bentuknya `https://namamu.github.io/meja-tulis/`.

Bagikan alamat itu ke siapa pun. Tiap orang punya data sendiri di perangkatnya.

### Alternatif: Cloudflare Pages

1. Buat akun gratis di [dash.cloudflare.com](https://dash.cloudflare.com).
2. Buka **Workers & Pages** → **Create** → tab **Pages** → **Upload assets** (unggah langsung).
3. Beri nama proyek, klik **Create project**.
4. Seret isi folder Meja Tulis (seperti langkah 5 di atas) lalu klik **Deploy**.
5. Alamatnya berbentuk `https://nama-proyek.pages.dev`.

### Memperbarui aplikasi nanti

Unggah berkas yang berubah ke repositori yang sama (**Add file** → **Upload files**). Sebelum itu, ubah angka versi di baris ketiga `sw.js`, misalnya `const VERSION='v2'` menjadi `'v3'`. Tanpa itu, pengguna lama tetap melihat versi lama. Setelah angka dinaikkan, pengguna melihat pesan **Versi baru tersedia** dan tinggal menekan **Muat ulang**.

---

## 2. Memasang di HP dan laptop

Buka alamat aplikasi, lalu:

| Perangkat | Cara |
|---|---|
| **Android (Chrome)** | Buka tab **Data** → tekan **Pasang aplikasi**. Atau menu ⋮ → **Pasang aplikasi**. |
| **iPhone / iPad (Safari)** | Ketuk **Bagikan** → **Tambah ke Layar Utama**. Harus lewat Safari. |
| **Laptop (Chrome atau Edge)** | Klik ikon pasang di ujung bilah alamat, atau tab **Data** → **Pasang aplikasi**. |

Setelah dibuka sekali dengan internet, aplikasi bisa dipakai tanpa internet.

---

## 3. Data tersimpan di mana?

Data tersimpan **di peramban pada perangkat yang kamu pakai**, tidak di internet dan tidak dikirim ke siapa pun. Artinya:

- HP dan laptop punya data **terpisah**. Menulis di HP tidak otomatis muncul di laptop.
- Jika kamu membersihkan data peramban, atau perangkat rusak atau hilang, data ikut hilang. **Buat cadangan secara rutin.**
- Menyimpan di mode pribadi/incognito tidak bertahan setelah jendela ditutup.

### Tiga cara mencadangkan (tab **Data**)

1. **Berkas cadangan**: tekan **Unduh cadangan** untuk menyimpan satu berkas `meja-tulis-cadangan-TANGGAL.json` (berisi tulisan, lomba, dan riwayat versi). Simpan di Google Drive, flashdisk, atau email ke diri sendiri.
2. **Bagikan cadangan** (hanya di HP yang mendukung): kirim berkas langsung ke Google Drive, iCloud/Berkas, atau WhatsApp.
3. **Cadangan otomatis ke folder** (hanya Chrome/Edge di laptop): pilih satu folder, misalnya yang disinkronkan Google Drive atau OneDrive. Aplikasi menulis satu berkas per hari saat ada perubahan dan menyimpan 14 berkas terakhir. Setelah aplikasi dibuka kembali, peramban kadang meminta izin lagi: tekan **Izinkan lagi**.

Aplikasi juga memunculkan banner pengingat bila ada perubahan dan cadangan terakhir sudah lebih dari 7 hari. Interval ini bisa diatur (3, 7, 14 hari, atau mati).

### Memindahkan data ke perangkat lain

1. Di perangkat lama: tab **Data** → **Unduh cadangan** (atau **Bagikan cadangan** di HP).
2. Kirim berkas `.json` itu ke perangkat baru (Google Drive, WhatsApp, email, kabel).
3. Di perangkat baru: buka Meja Tulis → tab **Data** → **Impor cadangan** → pilih berkasnya.
4. Cek ringkasan (jumlah tulisan dan lomba), lalu tekan **Ganti dengan cadangan**.

Impor **mengganti** seluruh data di perangkat tujuan. Sebelumnya aplikasi menyimpan salinan otomatis, dan tombol **Batalkan impor terakhir** muncul di tab Data bila kamu berubah pikiran.

---

## 4. Untuk pengembang

Vanilla HTML/CSS/JS (modul ES), tanpa build step, tanpa library, tanpa CDN. Semua path relatif, jadi bisa di-host di subpath.

```
index.html  sw.js  manifest.webmanifest
css/app.css
js/   main  db  state  migrate  history  router  views  data-view  backup  guide  docx  pwa  config  util
icons/
_asal/meja-tulis.html   versi satu-berkas asli, sebagai acuan
```

Jalankan lokal (service worker dan modul butuh `http://`, tidak jalan lewat `file://`):

```bash
python -m http.server 8000
```

Lalu buka `http://localhost:8000`. Penyimpanan memakai IndexedDB (`meja-tulis`: store `data`, `snapshots`, `meta`). Ingat menaikkan `VERSION` di `sw.js` dan menambahkan berkas baru ke daftar `SHELL` setiap kali ada perubahan.
