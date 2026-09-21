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
  const NIP_FABRY = "198402112007031001";

  const [audioAktif, setAudioAktif] = useState(false);
  const [bolehAudio, setBolehAudio] = useState(false);
  const [jadwalHariIni, setJadwalHariIni] = useState<JadwalApel[]>([]);
const sudahAnnounce = useRef(false);


  // ================================
  // CEK HAK AKSES AUDIO SIMASDI
  // ================================
  useEffect(() => {
    try {
      const userData = localStorage.getItem("user");

      if (!userData) {
        setBolehAudio(false);
        return;
      }

      const user = JSON.parse(userData);

      const username = String(
        user?.username ?? user?.nip ?? ""
      ).trim();

      const usernameLower = username.toLowerCase();

      const diizinkan =
        username === NIP_FABRY ||
        usernameLower === "admin" ||
        usernameLower === "petugas" ||
        usernameLower === "display";

      setBolehAudio(diizinkan);

      if (!diizinkan) {
        setAudioAktif(false);
      }
    } catch (error) {
      console.error("Gagal mengecek hak akses audio:", error);
      setBolehAudio(false);
      setAudioAktif(false);
    }
  }, []);
  // ================================
  // AKTIFKAN AUDIO
  // ================================
async function aktifkanAudio() {
  if (!bolehAudio) return;
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
      `${item.tugas}, ${item.nama_petugas}`
  )
  .join(". ");

 if (!petugas) {
  return;
}

  const suaraPetugas =
    "Adapun petugas apel hari ini adalah. " +
    petugas +
    ".";

bicara(suaraPetugas);
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

    // ================================
  // TAMPILAN
  // ================================

  // Akun yang tidak diizinkan tidak mendapatkan
  // tombol maupun status audio SIMASDI.
  if (!bolehAudio) {
    return null;
  }

  if (audioAktif) {
  return (
    <>


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