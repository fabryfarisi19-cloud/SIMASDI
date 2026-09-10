"use client";

import { useEffect, useRef, useState } from "react";

const NIP_FABRY = "198402112007031001";

export default function GlobalAudioEngine() {
  const [audioAktif, setAudioAktif] = useState(false);
  const [bolehAudio, setBolehAudio] = useState(false);

  const audioAktifRef = useRef(false);
  const indonesiaRayaRef =
    useRef<HTMLAudioElement | null>(null);

  const sedangDiputarRef = useRef(false);
  const sudahDiputarHariIni =
    useRef(false);

  // =========================================================
  // CEK HAK AKSES AUDIO
  // =========================================================

  const cekHakAudio = () => {
    try {
      const userRaw =
        localStorage.getItem("user");

      if (!userRaw) {
        console.log(
          "🔇 Tidak ada user login"
        );

        setBolehAudio(false);
        return false;
      }

      const user = JSON.parse(userRaw);

      const username =
        String(
          user?.username ??
          user?.nip ??
          ""
        ).trim();

      const role =
        String(
          user?.role ?? ""
        ).trim();

      const isFabry =
        username === NIP_FABRY;

    const usernameLower =
  username.toLowerCase();

const diizinkan =
  username === NIP_FABRY ||
  usernameLower === "admin" ||
  usernameLower === "petugas" ||
  usernameLower === "display";
      console.log(
        "🔐 GLOBAL AUDIO:",
        {
          username,
          role,
          diizinkan,
        }
      );

      setBolehAudio(diizinkan);

      return diizinkan;
    } catch (error) {
      console.error(
        "❌ Gagal membaca user:",
        error
      );

      setBolehAudio(false);

      return false;
    }
  };

  // =========================================================
  // CEK STATUS AUDIO + HAK AKSES
  // =========================================================

  useEffect(() => {
    const diizinkan =
      cekHakAudio();

    if (!diizinkan) {
      audioAktifRef.current =
        false;

      setAudioAktif(false);

      return;
    }

    const status =
      localStorage.getItem(
        "simasdi-global-audio"
      );

    if (status === "aktif") {
      audioAktifRef.current =
        true;

      setAudioAktif(true);

      console.log(
        "🔊 GLOBAL AUDIO SUDAH AKTIF"
      );
    }
  }, []);

  // =========================================================
  // AKTIFKAN AUDIO
  // =========================================================

  const aktifkanAudio = async () => {
    // Pengaman tambahan
    if (!cekHakAudio()) {
      console.log(
        "⛔ Akun ini tidak memiliki akses Global Audio"
      );

      return;
    }

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
      // =====================================================
      // CEK HAK AKSES
      // =====================================================

      if (!cekHakAudio()) {
        console.log(
          "⛔ Akun tidak diizinkan memutar Global Audio"
        );

        return;
      }

      // =====================================================
      // CEK AUDIO GLOBAL
      // =====================================================

      if (!audioAktifRef.current) {
        console.log(
          "🔇 Audio global belum aktif"
        );

        return;
      }

      // =====================================================
      // CEK APAKAH AUDIO SEDANG BERJALAN
      // =====================================================

      if (
        sedangDiputarRef.current
      ) {
        console.log(
          "🇮🇩 Indonesia Raya sedang diputar"
        );

        return;
      }

      // =====================================================
      // CEK LOCK GLOBAL
      // =====================================================

      const lockKey =
        "simasdi-global-indonesia-raya-lock";

      const lockSekarang =
        localStorage.getItem(
          lockKey
        );

      if (lockSekarang) {
        console.log(
          "🔒 Indonesia Raya sudah dikunci oleh instance lain"
        );

        return;
      }

      // =====================================================
      // KUNCI AUDIO
      // =====================================================

      localStorage.setItem(
        lockKey,
        Date.now().toString()
      );

      const audio =
        indonesiaRayaRef.current;

      if (!audio) {
        console.error(
          "❌ Audio Indonesia Raya tidak ditemukan"
        );

        localStorage.removeItem(
          lockKey
        );

        return;
      }

      sedangDiputarRef.current =
        true;

      try {
        // ===================================================
        // 1. TENG TONG
        // ===================================================

        console.log(
          "🔔 MEMUTAR TENG TONG"
        );

        const tengTong =
          new Audio(
            "/sound/call-to-attention.mp3"
          );

        tengTong.preload = "auto";
        tengTong.volume = 1;

        await tengTong.play();

        await new Promise<void>(
          (resolve) => {
            tengTong.onended = () => {
              resolve();
            };

            tengTong.onerror = () => {
              console.error(
                "❌ Teng-tong gagal"
              );

              resolve();
            };
          }
        );

        console.log(
          "🔔 TENG TONG SELESAI"
        );

        // ===================================================
        // 2. PENGUMUMAN TTS
        // ===================================================

        console.log(
          "📢 MEMUTAR PENGUMUMAN INDONESIA RAYA"
        );

        const response =
          await fetch(
            "/api/tts-edge",
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body: JSON.stringify({
                text:
                  "Mohon perhatian. Sesaat lagi akan diperdengarkan Lagu Kebangsaan Indonesia Raya. Dimohon kepada seluruh pegawai dan pengunjung untuk berdiri tegak dan sempurna. Terima kasih.",
              }),
            }
          );

        if (!response.ok) {
          throw new Error(
            "Gagal membuat suara pengumuman"
          );
        }

        const blob =
          await response.blob();

        const url =
          URL.createObjectURL(blob);

        const pengumuman =
          new Audio(url);

        pengumuman.preload = "auto";
        pengumuman.volume = 1;

        await pengumuman.play();

        await new Promise<void>(
          (resolve) => {
            pengumuman.onended = () => {
              resolve();
            };

            pengumuman.onerror = () => {
              console.error(
                "❌ Audio pengumuman gagal"
              );

              resolve();
            };
          }
        );

        URL.revokeObjectURL(url);

        console.log(
          "📢 PENGUMUMAN SELESAI"
        );

        // ===================================================
        // 3. JEDA 1 DETIK
        // ===================================================

        await new Promise<void>(
          (resolve) => {
            setTimeout(
              resolve,
              1000
            );
          }
        );

        // ===================================================
        // 4. INDONESIA RAYA
        // ===================================================

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
          "❌ Pengumuman / Indonesia Raya gagal:",
          error
        );

        sedangDiputarRef.current =
          false;

        localStorage.removeItem(
          lockKey
        );
      }
    };

  // =========================================================
  // JADWAL INDONESIA RAYA 10:00 WIB
  // =========================================================

  useEffect(() => {
    const cekJadwal = () => {
      // =====================================================
      // CEK HAK AKSES
      // =====================================================

      if (!cekHakAudio()) {
        return;
      }

      // =====================================================
      // CEK AUDIO AKTIF
      // =====================================================

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

      localStorage.removeItem(
        "simasdi-global-indonesia-raya-lock"
      );
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

      {bolehAudio &&
        !audioAktif && (
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