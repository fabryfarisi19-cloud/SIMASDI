
"use client";

import { useEffect, useRef, useState } from "react";

export default function GlobalAudioEngine() {
  const [audioAktif, setAudioAktif] = useState(false);

  const audioAktifRef = useRef(false);
  const indonesiaRayaRef = useRef<HTMLAudioElement | null>(null);
  const sedangDiputarRef = useRef(false);
  const sudahDiputarHariIni = useRef(false);

  // =========================================================
  // AKTIFKAN AUDIO
  // =========================================================
  const aktifkanAudio = async () => {
    try {
      audioAktifRef.current = true;
      setAudioAktif(true);

      const audio = indonesiaRayaRef.current;

      if (audio) {
        audio.muted = false;
        audio.volume = 1;

        // Play sebentar untuk mendapatkan izin browser
        await audio.play();

        audio.pause();
        audio.currentTime = 0;
      }

      localStorage.setItem(
        "simasdi-global-audio",
        "aktif"
      );

      console.log("🔊 GLOBAL AUDIO AKTIF");
    } catch (error) {
      console.error(
        "❌ Gagal mengaktifkan audio:",
        error
      );
    }
  };

  // =========================================================
  // PENGUMUMAN EDGE TTS
  // =========================================================
  const putarPengumuman = async () => {
    try {
      const text =
        "Mohon perhatian. Sesaat lagi akan diperdengarkan Lagu Kebangsaan Indonesia Raya. Dimohon kepada seluruh pegawai dan pengunjung untuk berdiri tegak dan sempurna. Terima kasih.";

      const response = await fetch("/api/tts-edge", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
        }),
      });

      if (!response.ok) {
        throw new Error(
          "Gagal mengambil audio Edge TTS"
        );
      }

      const blob = await response.blob();

      const url = URL.createObjectURL(blob);

      const audio = new Audio(url);

      audio.volume = 1;

      await audio.play();

      await new Promise<void>((resolve) => {
        audio.onended = () => {
          URL.revokeObjectURL(url);
          resolve();
        };
      });

    } catch (error) {
      console.error(
        "❌ Pengumuman Edge TTS gagal:",
        error
      );
    }
  };

  // =========================================================
  // INDONESIA RAYA
  // =========================================================
  const putarIndonesiaRaya = async () => {
    if (sedangDiputarRef.current) return;

    if (!audioAktifRef.current) {
      console.log(
        "⚠️ Audio global belum diaktifkan"
      );
      return;
    }

    const audio = indonesiaRayaRef.current;

    if (!audio) {
      console.error(
        "❌ Audio Indonesia Raya tidak ditemukan"
      );
      return;
    }

    try {
      sedangDiputarRef.current = true;

      console.log(
        "📢 Memulai pengumuman Indonesia Raya"
      );

      // Pengumuman Edge TTS
      await putarPengumuman();

      // Jeda 1 detik
      await new Promise((resolve) =>
        setTimeout(resolve, 1000)
      );

      // Lagu Indonesia Raya
      audio.pause();
      audio.currentTime = 0;
      audio.muted = false;
      audio.volume = 1;

      await audio.play();

      console.log(
        "🇮🇩 Indonesia Raya sedang diputar"
      );

    } catch (error) {
      console.error(
        "❌ Indonesia Raya gagal diputar:",
        error
      );

      sedangDiputarRef.current = false;
    }
  };

  // =========================================================
  // CEK JAM 10.00 WIB
  // =========================================================
  useEffect(() => {
    const audioStatus =
      localStorage.getItem(
        "simasdi-global-audio"
      );

    if (audioStatus === "aktif") {
      audioAktifRef.current = true;
      setAudioAktif(true);
    }

    const cekIndonesiaRaya = () => {
      const sekarang = new Date();

      const waktuWIB =
        new Intl.DateTimeFormat("id-ID", {
          timeZone: "Asia/Jakarta",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        }).formatToParts(sekarang);

      const jam =
        waktuWIB.find(
          (item) => item.type === "hour"
        )?.value;

      const menit =
        waktuWIB.find(
          (item) => item.type === "minute"
        )?.value;

      const detik =
        waktuWIB.find(
          (item) => item.type === "second"
        )?.value;

      const tanggalWIB =
        new Intl.DateTimeFormat("en-CA", {
          timeZone: "Asia/Jakarta",
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }).format(sekarang);

      const sudahDiputar =
        localStorage.getItem(
          "simasdi-indonesia-raya"
        );

      if (
        jam === "10" &&
        menit === "00" &&
        detik === "00" &&
        sudahDiputar !== tanggalWIB &&
        !sudahDiputarHariIni.current
      ) {
        sudahDiputarHariIni.current = true;

        localStorage.setItem(
          "simasdi-indonesia-raya",
          tanggalWIB
        );

        putarIndonesiaRaya();
      }
    };

    const timer = setInterval(
      cekIndonesiaRaya,
      1000
    );

    return () => {
      clearInterval(timer);
    };
  }, []);

  return (
    <>
   
      <audio
        ref={indonesiaRayaRef}
        src="/audio/indonesia-raya.mp3"
        preload="auto"
        muted={false}
      />

      {!audioAktif && (
        <button
          type="button"
          onClick={aktifkanAudio}
          className="fixed bottom-6 right-6 z-[2147483647] rounded-xl bg-yellow-400 px-6 py-4 text-xl font-bold text-black shadow-2xl"
        >
          🔊 AKTIFKAN AUDIO
        </button>
      )}
    </>
  );
}
