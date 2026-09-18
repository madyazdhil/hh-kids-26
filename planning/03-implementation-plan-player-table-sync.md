# Perbaikan sinkronisasi Pos — 2026-09-18

Status: dalam implementasi; memperbarui rencana Pos yang sama.

## Hasil yang harus dicapai

- Slide 8 + timer aktif: instruksi berbeda sesuai Pos 1–4, tanpa permainan. Timer habis/reset atau pindah slide: terkunci.
- Slide 14/16/18/20: semua Pos membuka babak yang sama sesudah 3–2–1. Memory tetap observasi di proyektor dahulu, lalu kuis serentak.
- Pos yang refresh/terlambat tersambung memulihkan slide, timer, fase battle dari satu snapshot lengkap, tanpa menunggu event yang sudah lewat.
- Spectator memakai ID receiver aktif dan tidak membuang kamera hanya karena screen share gagal.

## Langkah

1. Perbaiki pengiriman/pemulihan snapshot lengkap dan urutan pesan; tampilkan kegagalan relay secara nyata.
2. Perbaiki fase scouting dan battle serta lifecycle stream kamera/screen.
3. Uji browser terisolasi (tanpa BroadcastChannel lintas Pos), late join, timer expired, semua babak, reconnect dan stream; bandingkan root/src.
4. Simpan hasil pengujian dan Git checkpoint. Publikasikan perbaikan ke repository acara yang telah diotorisasi dalam riwayat proyek.
