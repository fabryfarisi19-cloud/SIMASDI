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
const AUDIO_PLAYED_STORAGE_KEY =
  "simasdi-global-audio-played";
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
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
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

  // =========================================================
  // SUSUN NAMA PETUGAS - KOREKSI PELAFALAN TTS
  // =========================================================
  function susunNamaPetugas(
    jadwal: JadwalApel[]
  ) {
    if (jadwal.length === 0) {
      return (
        "Mohon perhatian. " +
        "Belum terdapat data petugas a-pel pagi pada jadwal hari ini."
      );
    }

    const koreksiPelafalan: Record<string, string> = {
      "lulu od'hiyani, s.h.": "Lulu Odiyani",
      "adhityo sandjaya": "Adityo Sanjaya",
      "nicky chairani isa chamidi, s.sos.": "Niki Kairani Isa Kamidi",
      "adidthya faragita yuniar, s.i.kom.": "Aditya Faragita Yuniar",
      "achmad nurhadi rachmatadhani": "Ahmad Nurhadi Rahmatadani",
    };

    const bagian: string[] = [];

    jadwal.forEach((item) => {
      const namaAsli = item.nama_petugas?.trim();
      const tugas = item.tugas?.trim();

      if (!namaAsli) return;

      const kunciNama = namaAsli
        .toLowerCase()
        .replace(/\s+/g, " ");

      const namaTTS =
        koreksiPelafalan[kunciNama] ?? namaAsli;

      if (tugas) {
        bagian.push(`${tugas}, ${namaTTS}`);
      } else {
        bagian.push(namaTTS);
      }
    });

    return (
      "Mohon perhatian. " +
      "Diberitahukan susunan petugas a-pel pagi Bapas Kelas Satu Jakarta Barat hari ini. " +
      bagian.join(". ") +
      ". Terima kasih."
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
  "Mohon perhatian kepada seluruh pegawai Bapas Kelas I Jakarta Barat. " +
  "A-pel pagi akan dimulai lima menit lagi. " +
  "Seluruh pegawai dimohon segera bersiap. " +
"A-pel pagi dilaksanakan di halaman Griya Abipraya. " +
  "Terima kasih.";

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

const teks =
  "Mohon perhatian kepada seluruh pegawai Bapas Kelas I Jakarta Barat. " +
  "A-pel pagi segera dimulai. " +
  "Seluruh pegawai dimohon menempati posisi masing-masing " +
  "dan mengikuti apel dengan tertib. " +
  "Terima kasih.";
    await putarTengTong();

    await new Promise((resolve) =>
      setTimeout(resolve, 1200)
    );

    await putarTTS(teks);
  }

  // =========================================================
  // INDONESIA RAYA 06:00
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

  if (typeof window === "undefined") return;

  const sekarang = new Date();

  const waktuSekarang =
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Jakarta",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).format(sekarang);

  const tanggal = tanggalHariIni();

  const jadwal = [
    {
      id: "p0750",
      waktu: "07:50",
      kunci: `${tanggal}-07:50`,
      jalankan: pengumuman0750,
    },
    {
      id: "p0755",
      waktu: "07:55",
      kunci: `${tanggal}-07:55`,
      jalankan: pengumuman0755,
    },
    {
      id: "p0800",
      waktu: "08:00",
      kunci: `${tanggal}-08:00`,
      jalankan: pengumuman0800,
    },
    {
      id: "p0600",
      waktu: "06:00",
      kunci: `${tanggal}-06:00`,
      jalankan: putarIndonesiaRaya,
    },
  ];

  let statusTersimpan: Record<string, string> = {};

  try {
    const raw = window.localStorage.getItem(
      AUDIO_PLAYED_STORAGE_KEY
    );

    if (raw) {
      const parsed = JSON.parse(raw);

      if (
        parsed &&
        typeof parsed === "object" &&
        !Array.isArray(parsed)
      ) {
        statusTersimpan = parsed;
      }
    }
  } catch (error) {
    console.error(
      "Gagal membaca penanda jadwal audio:",
      error
    );
  }

  const target = jadwal.find(
    (item) => item.waktu === waktuSekarang
  );

  if (!target) return;

  if (
    statusTersimpan[target.id] === target.kunci
  ) {
    return;
  }

// Tandai jadwal sebelum audio diputar
statusTersimpan[target.id] = target.kunci;
  try {
    window.localStorage.setItem(
      AUDIO_PLAYED_STORAGE_KEY,
      JSON.stringify(statusTersimpan)
    );
  } catch (error) {
    console.error(
      "Gagal menyimpan penanda jadwal audio:",
      error
    );

    return;
  }

  console.log(
    `Menjalankan jadwal audio ${target.waktu}`
  );

  await target.jalankan();
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
        "ðŸ”Š GLOBAL AUDIO AKTIF"
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
      "ðŸ”‡ GLOBAL AUDIO DIMATIKAN"
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
      "â° Global Audio Engine berjalan"
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
            ðŸ”Š AKTIFKAN AUDIO
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
              ðŸŸ¢ AUDIO AKTIF
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
