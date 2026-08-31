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
  aktif: boolean;
};

export default function AnnouncerApel() {
  const [audioAktif, setAudioAktif] = useState(false);
  const [jadwalHariIni, setJadwalHariIni] = useState<JadwalApel[]>([]);

  const sudahAnnounce = useRef(false);
  const sudahIndonesiaRaya = useRef(false);
const indonesiaRayaRef = useRef<HTMLAudioElement | null>(null);
  // ================================
  // AKTIFKAN AUDIO
  // ================================
 async function aktifkanAudio() {
  try {
    const response = await fetch("/api/tts-edge", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: "Audio SIMASDI telah diaktifkan.",
      }),
    });

    if (!response.ok) {
      throw new Error(
        `TTS gagal: ${response.status}`
      );
    }

    const blob = await response.blob();

    const url = URL.createObjectURL(blob);

    const audio = new Audio(url);

    audio.volume = 1;

    await audio.play();

    audio.onended = () => {
      URL.revokeObjectURL(url);
    };

    setAudioAktif(true);
  } catch (error) {
    console.error(
      "Gagal mengaktifkan audio SIMASDI:",
      error
    );
  }
}
  // ================================
  // AMBIL JADWAL APEL HARI INI
  // ================================
  async function loadJadwal() {
    const sekarang = new Date();

    const tanggalHariIni =
      `${sekarang.getFullYear()}-${String(
        sekarang.getMonth() + 1
      ).padStart(2, "0")}-${String(
        sekarang.getDate()
      ).padStart(2, "0")}`;

    const { data, error } = await supabase
      .from("jadwal_apel")
      .select("*")
      .eq("tanggal", tanggalHariIni)
      .eq("aktif", true)
      .order("jam_apel", {
        ascending: true,
      });

    if (error) {
      console.error(
        "Gagal mengambil jadwal apel:",
        error
      );
      return;
    }

    setJadwalHariIni(data || []);
  }

  // ================================
  // LOAD PERTAMA
  // ================================
  useEffect(() => {
    loadJadwal();

    const interval = setInterval(() => {
      loadJadwal();
    }, 60 * 1000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  // ================================
  // CEK JAM APEL
  // ================================
  useEffect(() => {
    if (!audioAktif) return;
    if (jadwalHariIni.length === 0) return;

    const cekJadwal = () => {
      const sekarang = new Date();

      const jamSekarang = String(
        sekarang.getHours()
      ).padStart(2, "0");

      const menitSekarang = String(
        sekarang.getMinutes()
      ).padStart(2, "0");

      const waktuSekarang =
        `${jamSekarang}:${menitSekarang}`;

      const jadwal = jadwalHariIni.find(
        (item) =>
          item.jam_apel?.slice(0, 5) ===
          waktuSekarang
      );

      if (!jadwal) return;

      if (sudahAnnounce.current) return;

      sudahAnnounce.current = true;

      announceApel();

      setTimeout(() => {
        sudahAnnounce.current = false;
      }, 60 * 1000);
    };

    const interval = setInterval(
      cekJadwal,
      1000
    );

    return () => {
      clearInterval(interval);
    };
  }, [audioAktif, jadwalHariIni]);
// ================================
// INDONESIA RAYA OTOMATIS JAM 10.00
// ================================
useEffect(() => {
  if (!audioAktif) return;

  const cekIndonesiaRaya = () => {
    const sekarang = new Date();

    const jam = sekarang.getHours();
    const menit = sekarang.getMinutes();

    if (jam !== 10 || menit !== 0) return;

    if (sudahIndonesiaRaya.current) return;

    sudahIndonesiaRaya.current = true;

    putarIndonesiaRaya();

    setTimeout(() => {
      sudahIndonesiaRaya.current = false;
    }, 60 * 1000);
  };

  const interval = setInterval(
    cekIndonesiaRaya,
    1000
  );

  return () => {
    clearInterval(interval);
  };
}, [audioAktif]);
  // ================================
  // ANNOUNCE APEL
  // ================================
  function announceApel() {
    const teksAwal =
      "Mohon perhatian. " +
      "Kepada seluruh pegawai Bapas Kelas Satu Jakarta Barat. " +
      "Apel pegawai akan segera dimulai. " +
      "Mohon seluruh pegawai segera berkumpul di " +
      `${jadwalHariIni[0]?.lokasi || "lokasi apel"}.`;

    bicara(teksAwal);

  setTimeout(() => {
  const petugas = jadwalHariIni
    .map(
      (item) =>
        `${item.tugas}, ${item.nama_petugas}` +
        `${
          item.jabatan
            ? `, ${item.jabatan}`
            : ""
        }`
    )
    .join(". ");

  if (!petugas) {
    putarIndonesiaRaya();
    return;
  }

  const suaraPetugas =
    "Adapun petugas apel hari ini adalah. " +
    petugas +
    ".";

bicara(suaraPetugas, () => {
  putarIndonesiaRaya();
});
}, 9000);
  }

  // ================================
  // TEXT TO SPEECH
  // ================================
function bicara(
  teks: string,
  setelahSelesai?: () => void
) {
  if (!audioAktif) return;

  window.speechSynthesis.cancel();

  const suara =
    new SpeechSynthesisUtterance(teks);

  suara.lang = "id-ID";
  suara.rate = 0.88;
  suara.pitch = 1;
  suara.volume = 1;

  suara.onend = () => {
    setelahSelesai?.();
  };

  suara.onerror = () => {
    setelahSelesai?.();
  };

  window.speechSynthesis.speak(suara);
}
function putarIndonesiaRaya() {
  const audio = indonesiaRayaRef.current;

  if (!audio) return;

  audio.currentTime = 0;
  audio.volume = 1;

  audio.play().catch((error) => {
    console.error(
      "Gagal memutar Indonesia Raya:",
      error
    );
  });
}
  // ================================
  // TAMPILAN
  // ================================
if (audioAktif) {
  return (
    <>
      <audio
        ref={indonesiaRayaRef}
        src="/audio/indonesia-raya.mp3"
        preload="auto"
      />

      <div className="fixed bottom-4 right-4 z-[9999]">
        <div className="rounded-xl bg-green-600 px-4 py-3 text-sm font-semibold text-white shadow-lg">
          🔊 Announcer SIMASDI Aktif
        </div>
      </div>
    </>
  );
}

  return (
    <div className="fixed bottom-4 right-4 z-[9999]">
      <button
        onClick={aktifkanAudio}
        className="rounded-xl bg-orange-500 px-5 py-3 font-semibold text-white shadow-lg hover:bg-orange-600"
      >
        🔊 Aktifkan Audio SIMASDI
      </button>
    </div>
  );
}