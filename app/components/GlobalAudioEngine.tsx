"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

type JadwalApel = {
  id: string;
  tanggal: string;
  nama_petugas: string;
  jabatan: string | null;
  tugas: string;
  jam_apel: string;
  lokasi: string | null;
};

const AUDIO_STORAGE_KEY = "simasdi-global-audio";

const ALLOWED_USERNAMES = [
  "admin",
  "petugas",
  "display",
];

const ALLOWED_NIP = [
  "198402112007031001",
];

export default function GlobalAudioEngine() {
  const [mounted, setMounted] = useState(false);
  const [hakAudio, setHakAudio] = useState(false);
  const [audioAktif, setAudioAktif] = useState(false);
  const [siap, setSiap] = useState(false);

  const tengTongRef = useRef<HTMLAudioElement | null>(null);
  const ttsRef = useRef<HTMLAudioElement | null>(null);
  const indonesiaRayaRef =
    useRef<HTMLAudioElement | null>(null);

  const sedangBicaraRef = useRef(false);

  // Mencegah pengumuman yang sama diputar berulang kali
  const sudahDiputarRef =
    useRef<Record<string, string>>({});

  // =========================================================
  // CEK HAK AKSES
  // HANYA DIPANGGIL DI BROWSER
  // =========================================================
  function cekHakAudio(): boolean {
    if (typeof window === "undefined") {
      return false;
    }

    try {
      const rawUser =
        window.localStorage.getItem("user");

      if (!rawUser) {
        return false;
      }

      const user = JSON.parse(rawUser);

      const username = String(
        user?.username || ""
      )
        .trim()
        .toLowerCase();

      const nip = String(
        user?.nip || ""
      ).trim();

      return (
        ALLOWED_USERNAMES.includes(username) ||
        ALLOWED_NIP.includes(nip)
      );
    } catch (error) {
      console.error(
        "Gagal membaca user:",
        error
      );

      return false;
    }
  }

  // =========================================================
  // FORMAT TANGGAL HARI INI
  // =========================================================
  function tanggalHariIni() {
    const sekarang = new Date();

    const tahun = sekarang.getFullYear();

    const bulan = String(
      sekarang.getMonth() + 1
    ).padStart(2, "0");

    const tanggal = String(
      sekarang.getDate()
    ).padStart(2, "0");

    return `${tahun}-${bulan}-${tanggal}`;
  }

  // =========================================================
  // AMBIL JADWAL APEL HARI INI
  // =========================================================
  async function ambilJadwalApel(): Promise<
    JadwalApel[]
  > {
    try {
      const today = tanggalHariIni();

      const { data, error } = await supabase
        .from("jadwal_apel")
        .select(
          "id,tanggal,nama_petugas,jabatan,tugas,jam_apel,lokasi"
        )
        .eq("tanggal", today)
        .eq("aktif", true)
        .order("created_at", {
          ascending: true,
        });

      if (error) {
        console.error(
          "Gagal mengambil jadwal apel:",
          error
        );

        return [];
      }

      return (data || []) as JadwalApel[];
    } catch (error) {
      console.error(
        "Error jadwal apel:",
        error
      );

      return [];
    }
  }

  // =========================================================
  // PUTAR TENG TONG
  // =========================================================
  async function putarTengTong() {
    if (!tengTongRef.current) return;

    try {
      tengTongRef.current.currentTime = 0;

      await tengTongRef.current.play();
    } catch (error) {
      console.error(
        "Gagal memutar teng tong:",
        error
      );
    }
  }

  // =========================================================
  // PUTAR TTS
  // =========================================================
  async function putarTTS(teks: string) {
    if (!teks) return;

    if (sedangBicaraRef.current) {
      console.log(
        "Audio sedang berbicara, dilewati."
      );

      return;
    }

    sedangBicaraRef.current = true;

    try {
      const response = await fetch(
        "/api/tts-edge",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            text: teks,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          "TTS API gagal"
        );
      }

      const blob =
        await response.blob();

      const url =
        URL.createObjectURL(blob);

      const audio = ttsRef.current;

      if (!audio) {
        URL.revokeObjectURL(url);
        return;
      }

      audio.src = url;
      audio.currentTime = 0;

      await audio.play();

      await new Promise<void>(
        (resolve) => {
          const selesai = () => {
            audio.removeEventListener(
              "ended",
              selesai
            );

            resolve();
          };

          audio.addEventListener(
            "ended",
            selesai
          );
        }
      );

      URL.revokeObjectURL(url);

      audio.removeAttribute("src");
      audio.load();
    } catch (error) {
      console.error(
        "Gagal memutar TTS:",
        error
      );
    } finally {
      sedangBicaraRef.current = false;
    }
  }

  // =========================================================
  // SUSUN NAMA PETUGAS
  // =========================================================
  function susunNamaPetugas(
    jadwal: JadwalApel[]
  ) {
    if (jadwal.length === 0) {
      return (
        "Mohon Perhatian. " +
        "Belum terdapat data petugas apel pada jadwal hari ini."
      );
    }

    const bagian: string[] = [];

    jadwal.forEach((item) => {
      const nama =
        item.nama_petugas?.trim();

      const tugas =
        item.tugas?.trim();

      if (!nama) return;

      if (tugas) {
        bagian.push(
          `${tugas}, ${nama}`
        );
      } else {
        bagian.push(nama);
      }
    });

    return (
      "Mohon Perhatian. " +
      "Diberitahukan susunan petugas apel pagi Bapas Kelas Satu Jakarta Barat hari ini. " +
      bagian.join(". ") +
      ". Terimakasih."
    );
  }

  // =========================================================
  // PENGUMUMAN 07:50
  // =========================================================
  async function pengumuman0750() {
    const jadwal =
      await ambilJadwalApel();

    console.log(
      "Jadwal apel hari ini:",
      jadwal
    );

    const teks =
      susunNamaPetugas(jadwal);

    await putarTengTong();

    await new Promise((resolve) =>
      setTimeout(resolve, 1200)
    );

    await putarTTS(teks);
  }

  // =========================================================
  // PENGUMUMAN 07:55
  // =========================================================
  async function pengumuman0755() {
    const jadwal =
      await ambilJadwalApel();

    const lokasi =
      jadwal.find(
        (item) => item.lokasi
      )?.lokasi ||
      "Halaman Griya Abhipraya Bapas Kelas I Jakarta Barat";

    const teks =
      "Mohon Perhatian. " +
      "Lima menit lagi apel pagi akan dimulai. " +
      `Pelaksanaan apel bertempat di ${lokasi}. ` +
      "Kepada seluruh pegawai dan petugas apel agar segera menuju tempat pelaksanaan apel " +
      "dan menempati posisi masing-masing, terimakasih.";

    await putarTengTong();

    await new Promise((resolve) =>
      setTimeout(resolve, 1200)
    );

    await putarTTS(teks);
  }

  // =========================================================
  // PENGUMUMAN 08:00
  // =========================================================
  async function pengumuman0800() {
    const jadwal =
      await ambilJadwalApel();

    const pembina =
      jadwal.find(
        (item) =>
          item.tugas
            ?.trim()
            .toLowerCase() ===
          "pembina apel"
      );

    // Variabel tetap dipertahankan
    // untuk kompatibilitas jadwal yang ada.
    void pembina;

    let teks =
      "Mohon Perhatian. " +
      "Apel pagi Bapas Kelas Satu Jakarta Barat segera dimulai. ";

    teks +=
      "Kepada seluruh peserta apel dimohon untuk mengikuti apel dengan tertib, terimakasih.";

    await putarTengTong();

    await new Promise((resolve) =>
      setTimeout(resolve, 1200)
    );

    await putarTTS(teks);
  }

  // =========================================================
  // INDONESIA RAYA 10:00
  // =========================================================
  async function putarIndonesiaRaya() {
    if (!indonesiaRayaRef.current) {
      return;
    }

    const teks =
      "Mohon Perhatian. " +
      "Sesaat lagi akan diperdengarkan Lagu Kebangsaan Indonesia Raya. " +
      "Dimohon kepada seluruh pegawai dan pengunjung untuk berdiri tegak sempurna.";

    await putarTengTong();

    await new Promise((resolve) =>
      setTimeout(resolve, 1200)
    );

    await putarTTS(teks);

    // Tunggu sebentar setelah pengumuman
    await new Promise((resolve) =>
      setTimeout(resolve, 1500)
    );

    try {
      if (!indonesiaRayaRef.current) {
        return;
      }

      indonesiaRayaRef.current.currentTime = 0;

      await indonesiaRayaRef.current.play();
    } catch (error) {
      console.error(
        "Gagal memutar Indonesia Raya:",
        error
      );
    }
  }

  // =========================================================
  // CEK JADWAL OTOMATIS
  // =========================================================
  async function cekJadwalAudio() {
    if (!audioAktif) return;

    if (
      typeof window ===
      "undefined"
    ) {
      return;
    }

    const sekarang = new Date();

    const jam = String(
      sekarang.getHours()
    ).padStart(2, "0");

    const menit = String(
      sekarang.getMinutes()
    ).padStart(2, "0");

    const waktuSekarang =
      `${jam}:${menit}`;

    const tanggal =
      tanggalHariIni();

    const kunci0750 =
      `${tanggal}-07:50`;

    const kunci0755 =
      `${tanggal}-07:55`;

    const kunci0800 =
      `${tanggal}-08:00`;
const kunci0700 =
  `${tanggal}-07:00`;

    // =======================================================
    // 07:50 - NAMA PETUGAS
    // =======================================================
    if (
      waktuSekarang === "07:50" &&
      sudahDiputarRef.current.p0750 !==
        kunci0750
    ) {
      sudahDiputarRef.current.p0750 =
        kunci0750;

      console.log(
        "🔊 Menjalankan pengumuman 07:50"
      );

      await pengumuman0750();
    }

    // =======================================================
    // 07:55
    // =======================================================
    if (
      waktuSekarang === "07:55" &&
      sudahDiputarRef.current.p0755 !==
        kunci0755
    ) {
      sudahDiputarRef.current.p0755 =
        kunci0755;

      console.log(
        "🔊 Menjalankan pengumuman 07:55"
      );

      await pengumuman0755();
    }

    // =======================================================
    // 08:00
    // =======================================================
    if (
      waktuSekarang === "08:00" &&
      sudahDiputarRef.current.p0800 !==
        kunci0800
    ) {
      sudahDiputarRef.current.p0800 =
        kunci0800;

      console.log(
        "🔊 Menjalankan pengumuman 08:00"
      );

      await pengumuman0800();
    }

 // =======================================================
// 07:00 - INDONESIA RAYA
// =======================================================
if (
  waktuSekarang === "07:00" &&
  sudahDiputarRef.current.p0700 !==
    kunci0700
) {
  sudahDiputarRef.current.p0700 =
    kunci0700;

  console.log(
    "🇮🇩 Menjalankan Indonesia Raya 07:00"
  );

  await putarIndonesiaRaya();
}
}
  // =========================================================
  // AKTIFKAN AUDIO
  // =========================================================
  async function aktifkanAudio() {
    if (!hakAudio) {
      alert(
        "Akun ini tidak memiliki hak untuk mengaktifkan audio."
      );

      return;
    }

    try {
      // Unlock audio browser dengan gesture pengguna
      if (tengTongRef.current) {
        tengTongRef.current.currentTime = 0;

        await tengTongRef.current.play();

        tengTongRef.current.pause();
        tengTongRef.current.currentTime = 0;
      }

      if (indonesiaRayaRef.current) {
        indonesiaRayaRef.current.currentTime = 0;

        await indonesiaRayaRef.current.play();

        indonesiaRayaRef.current.pause();
        indonesiaRayaRef.current.currentTime = 0;
      }

      window.localStorage.setItem(
        AUDIO_STORAGE_KEY,
        "aktif"
      );

      window.localStorage.setItem(
        "simasdi-global-audio-lock",
        "aktif"
      );

      setAudioAktif(true);
      setSiap(true);

      console.log(
        "🔊 GLOBAL AUDIO AKTIF"
      );
    } catch (error) {
      console.error(
        "Browser belum mengizinkan audio:",
        error
      );

      alert(
        "Audio belum berhasil diaktifkan. Silakan tekan tombol sekali lagi."
      );
    }
  }

  // =========================================================
  // MATIKAN AUDIO
  // =========================================================
  function matikanAudio() {
    if (
      typeof window !==
      "undefined"
    ) {
      window.localStorage.removeItem(
        AUDIO_STORAGE_KEY
      );

      window.localStorage.removeItem(
        "simasdi-global-audio-lock"
      );
    }

    setAudioAktif(false);
    setSiap(false);

    if (tengTongRef.current) {
      tengTongRef.current.pause();
      tengTongRef.current.currentTime = 0;
    }

    if (ttsRef.current) {
      ttsRef.current.pause();
      ttsRef.current.currentTime = 0;
    }

    if (indonesiaRayaRef.current) {
      indonesiaRayaRef.current.pause();
      indonesiaRayaRef.current.currentTime = 0;
    }

    console.log(
      "🔇 GLOBAL AUDIO DIMATIKAN"
    );
  }

  // =========================================================
  // INITIAL
  // SEMUA AKSES localStorage HANYA DI SINI
  // =========================================================
  useEffect(() => {
    setMounted(true);

    const punyaHak =
      cekHakAudio();

    setHakAudio(punyaHak);

    if (!punyaHak) {
      return;
    }

    const status =
      window.localStorage.getItem(
        AUDIO_STORAGE_KEY
      );

    if (status === "aktif") {
      setAudioAktif(true);
      setSiap(true);
    }
  }, []);

  // =========================================================
  // TIMER GLOBAL
  // =========================================================
  useEffect(() => {
    if (!audioAktif) {
      return;
    }

    console.log(
      "⏰ Global Audio Engine berjalan"
    );

    // Cek langsung
    cekJadwalAudio();

    const interval =
      setInterval(() => {
        cekJadwalAudio();
      }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [audioAktif]);

  // =========================================================
  // TAMPILAN
  // =========================================================

  // Jangan render sebelum browser siap
  if (!mounted) {
    return null;
  }

  // User tidak memiliki hak audio
  if (!hakAudio) {
    return null;
  }

  return (
    <>
      <audio
        ref={tengTongRef}
        src="/sound/call-to-attention.mp3"
        preload="auto"
      />

      <audio
        ref={ttsRef}
        preload="auto"
      />

      <audio
        ref={indonesiaRayaRef}
        src="/audio/indonesia-raya.mp3"
        preload="auto"
      />

      <div
        style={{
          position: "fixed",
          right: 20,
          bottom: 20,
          zIndex: 99999,
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        {!audioAktif ? (
          <button
            onClick={aktifkanAudio}
            style={{
              background: "#dc2626",
              color: "white",
              border: "none",
              padding: "12px 18px",
              borderRadius: 10,
              fontWeight: 700,
              cursor: "pointer",
              boxShadow:
                "0 4px 12px rgba(0,0,0,.25)",
            }}
          >
            🔊 AKTIFKAN AUDIO
          </button>
        ) : (
          <>
            <div
              style={{
                background: "#16a34a",
                color: "white",
                padding: "10px 14px",
                borderRadius: 10,
                fontWeight: 700,
                boxShadow:
                  "0 4px 12px rgba(0,0,0,.25)",
              }}
            >
              🟢 AUDIO AKTIF
            </div>

            <button
              onClick={matikanAudio}
              style={{
                background: "#374151",
                color: "white",
                border: "none",
                padding: "10px 14px",
                borderRadius: 10,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Matikan
            </button>
          </>
        )}
      </div>
    </>
  );
}