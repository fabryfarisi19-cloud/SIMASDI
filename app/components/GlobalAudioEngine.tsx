"use client";

import { useEffect, useRef, useState } from "react";

export default function GlobalAudioEngine() {
  const [audioAktif, setAudioAktif] = useState(false);

  const audioAktifRef = useRef(false);
  const indonesiaRayaRef =
    useRef<HTMLAudioElement | null>(null);

  const sedangDiputarRef = useRef(false);
  const sudahDiputarHariIni =
    useRef(false);

  // =========================================================
  // CEK STATUS AUDIO
  // =========================================================

  useEffect(() => {
    const status =
      localStorage.getItem(
        "simasdi-global-audio"
      );

    if (status === "aktif") {
      audioAktifRef.current = true;
      setAudioAktif(true);
    }
  }, []);

  // =========================================================
  // AKTIFKAN AUDIO
  // =========================================================

  const aktifkanAudio = async () => {
    console.log(
      "🔊 AKTIFKAN AUDIO GLOBAL"
    );

    try {
      const audio =
        indonesiaRayaRef.current;

      if (audio) {
        audio.muted = false;
        audio.volume = 1;

        try {
          await audio.play();

          audio.pause();
          audio.currentTime = 0;

          console.log(
            "✅ AUDIO BROWSER BERHASIL DI-UNLOCK"
          );
        } catch (error) {
          console.log(
            "ℹ️ Audio unlock:",
            error
          );
        }
      }

      audioAktifRef.current = true;

      setAudioAktif(true);

      localStorage.setItem(
        "simasdi-global-audio",
        "aktif"
      );

      console.log(
        "✅ GLOBAL AUDIO AKTIF"
      );
    } catch (error) {
      console.error(
        "❌ Gagal mengaktifkan audio global:",
        error
      );
    }
  };

  // =========================================================
  // PUTAR INDONESIA RAYA
  // =========================================================

  const putarIndonesiaRaya =
    async () => {
      if (!audioAktifRef.current) {
        console.log(
          "🔇 Audio global belum aktif"
        );
        return;
      }

      if (sedangDiputarRef.current) {
        console.log(
          "🇮🇩 Indonesia Raya sedang diputar"
        );
        return;
      }

      const audio =
        indonesiaRayaRef.current;

      if (!audio) {
        console.error(
          "❌ Audio Indonesia Raya tidak ditemukan"
        );
        return;
      }

      sedangDiputarRef.current =
        true;

      try {
        console.log(
          "🇮🇩 MEMUTAR INDONESIA RAYA"
        );

        audio.pause();
        audio.currentTime = 0;
        audio.muted = false;
        audio.volume = 1;

        await audio.play();

        console.log(
          "🇮🇩 INDONESIA RAYA BERHASIL DIPUTAR"
        );
      } catch (error) {
        console.error(
          "❌ Indonesia Raya gagal diputar:",
          error
        );

        sedangDiputarRef.current =
          false;
      }
    };

  // =========================================================
  // JADWAL INDONESIA RAYA 10:00 WIB
  // =========================================================

  useEffect(() => {
    const cekJadwal = () => {
      if (!audioAktifRef.current) {
        return;
      }

      const sekarang =
        new Date();

      const waktuWIB =
        new Intl.DateTimeFormat(
          "en-GB",
          {
            timeZone:
              "Asia/Jakarta",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false,
          }
        ).formatToParts(
          sekarang
        );

      const jam =
        waktuWIB.find(
          (item) =>
            item.type === "hour"
        )?.value;

      const menit =
        waktuWIB.find(
          (item) =>
            item.type === "minute"
        )?.value;

      const detik =
        waktuWIB.find(
          (item) =>
            item.type === "second"
        )?.value;

      const tanggal =
        new Intl.DateTimeFormat(
          "en-CA",
          {
            timeZone:
              "Asia/Jakarta",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          }
        ).format(sekarang);

      const sudahDiputar =
        localStorage.getItem(
          "simasdi-global-indonesia-raya"
        );

      if (
        sudahDiputar === tanggal
      ) {
        sudahDiputarHariIni.current =
          true;
      } else {
        sudahDiputarHariIni.current =
          false;
      }

      if (
        jam === "10" &&
        menit === "00" &&
        detik === "00" &&
        !sudahDiputarHariIni.current
      ) {
        console.log(
          "🇮🇩 JADWAL INDONESIA RAYA 10:00 WIB"
        );

        sudahDiputarHariIni.current =
          true;

        localStorage.setItem(
          "simasdi-global-indonesia-raya",
          tanggal
        );

        putarIndonesiaRaya();
      }
    };

    cekJadwal();

    const timer =
      setInterval(
        cekJadwal,
        1000
      );

    return () => {
      clearInterval(timer);
    };
  }, []);

  // =========================================================
  // RESET SETELAH INDONESIA RAYA SELESAI
  // =========================================================

  useEffect(() => {
    const audio =
      indonesiaRayaRef.current;

    if (!audio) {
      return;
    }

    const selesai = () => {
      console.log(
        "🇮🇩 INDONESIA RAYA SELESAI"
      );

      sedangDiputarRef.current =
        false;
    };

    audio.addEventListener(
      "ended",
      selesai
    );

    return () => {
      audio.removeEventListener(
        "ended",
        selesai
      );
    };
  }, []);

  // =========================================================
  // RENDER
  // =========================================================

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
          style={{
            position: "fixed",
            bottom: "90px",
            right: "20px",
            zIndex: 2147483647,
          }}
          className="px-6 py-4 rounded-xl bg-yellow-400 text-black text-xl font-black shadow-2xl cursor-pointer"
        >
          🔊 AKTIFKAN AUDIO
        </button>
      )}
    </>
  );
}