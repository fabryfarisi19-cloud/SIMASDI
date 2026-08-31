"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";

type Petugas = {
  id: string;
  nama_petugas: string;
  jabatan: string | null;
  tugas: string;
  jam_apel: string;
  lokasi: string | null;
};

export default function TvApelPage() {
  const [petugas, setPetugas] = useState<Petugas[]>([]);
  const [tanggal, setTanggal] = useState("");
  const [jamSekarang, setJamSekarang] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
   const audioLockRef = useRef(false);
const bellAudioRef = useRef<HTMLAudioElement | null>(null);
const indonesiaRayaLockRef = useRef(false);
  const [statusApel, setStatusApel] = useState<
  "belum" | "persiapan" | "berlangsung" | "selesai"
>("belum");

const [autoAnnouncement, setAutoAnnouncement] = useState(false);
const [audioAktif, setAudioAktif] = useState(false);
const [pengumumanTerakhir, setPengumumanTerakhir] =
  useState("");
  async function loadJadwal() {
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Jakarta",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });

    const today = formatter.format(new Date());

    setTanggal(today);

    const { data, error } = await supabase
      .from("jadwal_apel")
      .select("*")
      .eq("tanggal", today)
      .eq("aktif", true)
     .order("jam_apel", { ascending: true });

    if (error) {
      console.error(error);
      setPetugas([]);
    } else {
      setPetugas(data || []);
    }

    setLoading(false);
  }
useEffect(() => {
  if (typeof window === "undefined") return;

  const tampilkanVoice = () => {
    const voices =
      window.speechSynthesis.getVoices();

    console.table(
      voices.map((v) => ({
        nama: v.name,
        bahasa: v.lang,
        default: v.default,
      }))
    );
  };

  tampilkanVoice();

  window.speechSynthesis.addEventListener(
    "voiceschanged",
    tampilkanVoice
  );

  return () => {
    window.speechSynthesis.removeEventListener(
      "voiceschanged",
      tampilkanVoice
    );
  };
}, []);
  useEffect(() => {
    loadJadwal();

const interval = setInterval(() => {
  loadJadwal();
}, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setJamSekarang(
        new Date().toLocaleTimeString("id-ID", {
          timeZone: "Asia/Jakarta",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    }, 1000);

    return () => clearInterval(timer);
  }, []);
// ================================
// INDONESIA RAYA OTOMATIS 10.00 WIB
// ================================
// ================================
// 🇮🇩 INDONESIA RAYA OTOMATIS 10.00 WIB
// ================================
useEffect(() => {
  if (!audioAktif) return;

  const cekIndonesiaRaya = () => {
    const sekarang = new Date();

    const waktuJakarta = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Jakarta",
      hour: "2-digit",
      minute: "2-digit",
    }).format(sekarang);

    if (waktuJakarta === "10:00") {
      putarIndonesiaRaya();
    }
  };

  const timer = setInterval(cekIndonesiaRaya, 1000);

  return () => clearInterval(timer);
}, [audioAktif]);
  function formatTanggal(tgl: string) {
    if (!tgl) return "";

    return new Date(`${tgl}T00:00:00`).toLocaleDateString(
      "id-ID",
      {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }
    );
  }

function getPetugas(tugas: string) {
  const kataKunci = tugas.toLowerCase().trim();

  const hasil = petugas.filter((item) => {
    const namaTugas = item.tugas.toLowerCase().trim();

    return namaTugas.includes(kataKunci);
  });

  if (hasil.length === 0) return undefined;

  // Jika ada data lama dan data baru,
  // gunakan jadwal dengan jam apel paling pagi
  return hasil.sort((a, b) =>
    a.jam_apel.localeCompare(b.jam_apel)
  )[0];
}
// ================================
// INDONESIA RAYA
// ================================
async function putarIndonesiaRaya() {
  if (typeof window === "undefined") return;
  if (!audioAktif) return;
  if (indonesiaRayaLockRef.current) return;

  indonesiaRayaLockRef.current = true;

  try {
    // ================================
    // PENGUMUMAN SEBELUM INDONESIA RAYA
    // ================================
    const teks =
      "Mohon perhatian. " +
      "Lagu Kebangsaan Indonesia Raya akan segera diputar. " +
      "Kepada seluruh pegawai, dimohon berdiri tegak dan sempurna.";

    const response = await fetch("/api/tts-edge", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: teks,
      }),
    });

    if (!response.ok) {
      throw new Error(
        `TTS gagal: ${response.status}`
      );
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);

    // ================================
    // PUTAR SUARA PEREMPUAN
    // ================================
    await new Promise<void>((resolve, reject) => {
      const pengumuman = new Audio(url);

      pengumuman.volume = 1;

      pengumuman.onended = () => {
        URL.revokeObjectURL(url);
        resolve();
      };

      pengumuman.onerror = () => {
        URL.revokeObjectURL(url);
        reject(
          new Error(
            "Audio pengumuman gagal diputar"
          )
        );
      };

      pengumuman.play().catch(reject);
    });

    // ================================
    // JEDA SEBELUM INDONESIA RAYA
    // ================================
    await new Promise((resolve) =>
      setTimeout(resolve, 1000)
    );

    // ================================
    // INDONESIA RAYA
    // ================================
    const audio = new Audio(
      "/audio/indonesia-raya.mp3"
    );

    audio.volume = 1;

    audio.onended = () => {
      indonesiaRayaLockRef.current = false;
    };

    audio.onerror = (error) => {
      console.error(
        "INDONESIA RAYA ERROR:",
        error
      );

      indonesiaRayaLockRef.current = false;
    };

    await audio.play();

  } catch (error) {
    console.error(
      "❌ INDONESIA RAYA ERROR:",
      error
    );

    indonesiaRayaLockRef.current = false;
  }
}
function bicaraPengumuman() {
  if (typeof window === "undefined") return;

  const audio = new Audio("/sound/pengumuman-apel.mp3");

  audio.volume = 1;

  setIsSpeaking(true);

  audio.onended = () => {
    setIsSpeaking(false);
  };

  audio.onerror = (error) => {
    console.error("Audio error:", error);
    setIsSpeaking(false);
    alert("Suara pengumuman gagal diputar.");
  };

  audio.play().catch((error) => {
    console.error("Gagal memutar audio:", error);
    setIsSpeaking(false);
  });
}
async function putarTingTong() {
  try {
  const bell =
  bellAudioRef.current ||
  new Audio("/sound/call-to-attention.mp3");

bell.volume = 1;
bell.currentTime = 0;
    await new Promise<void>((resolve, reject) => {
      bell.onended = () => resolve();
      bell.onerror = () => reject(new Error("Ting-tong gagal diputar"));

      bell.play().catch(reject);
    });

    // Jeda 1 detik setelah ting-tong benar-benar selesai
    await new Promise((resolve) =>
      setTimeout(resolve, 1000)
    );

  } catch (error) {
    console.error("TING-TONG GAGAL:", error);
  }
}
function bicara(teks: string, voice?: SpeechSynthesisVoice) {
  if (typeof window === "undefined") return;

  const synth = window.speechSynthesis;
  const suara = new SpeechSynthesisUtterance(teks);

  suara.voice = voice || null;
  suara.lang = "id-ID";
  suara.rate = 0.82;
  suara.pitch = 1.08;
  suara.volume = 1;

  suara.onstart = () => {
    setIsSpeaking(true);
  };

  suara.onend = () => {
    setIsSpeaking(false);
  };

  suara.onerror = (error) => {
    console.error(
      "Speech error:",
      error
    );
    setIsSpeaking(false);
  };

  synth.speak(suara);
}
function cekDaftarVoice() {
  if (typeof window === "undefined") return;

  const voices = window.speechSynthesis.getVoices();

  console.table(
    voices.map((v) => ({
      nama: v.name,
      bahasa: v.lang,
      default: v.default,
    }))
  );
}
  useEffect(() => {
    const timer = setInterval(() => {
      const sekarang = new Date();

      const waktuSekarang =
        sekarang.getHours() * 60 +
        sekarang.getMinutes();

      const pembina = getPetugas("pembina");
      if (!pembina) return;

      const [jam, menit] = pembina.jam_apel
        .slice(0, 5)
        .split(":")
        .map(Number);

      const waktuApel = jam * 60 + menit;

      if (waktuSekarang < waktuApel - 10) {
        setStatusApel("belum");
      } else if (
        waktuSekarang >= waktuApel - 10 &&
        waktuSekarang < waktuApel
      ) {
        setStatusApel("persiapan");
      } else if (
        waktuSekarang >= waktuApel &&
        waktuSekarang <= waktuApel + 60
      ) {
        setStatusApel("berlangsung");
      } else {
        setStatusApel("selesai");
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [petugas]);

  const pembina = getPetugas("pembina");
  const komandan = getPetugas("komandan apel");
  const doa = getPetugas("pembaca doa");
  const triDharma = getPetugas("tri dharma pas");
  const ikrar = getPetugas("pengucap ikrar");
  const operator = getPetugas("operator lagu");
  const laporan = getPetugas("laporan atensi");
  const humas = getPetugas("humas");
 const cadangan =
  petugas.find((item) =>
    item.tugas.toLowerCase().includes("cadangan")
  );
const teksSusunanPetugas = [
  "Selamat pagi. Mohon perhatian.",
  "Berikut susunan petugas apel pagi hari ini.",

  `Pembina Apel, ${
    pembina?.nama_petugas || "belum ditentukan"
  }.`,
  
  `Komandan Apel, ${
    komandan?.nama_petugas || "belum ditentukan"
  }.`,
  
  `Pembaca Doa, ${
    doa?.nama_petugas || "belum ditentukan"
  }.`,
  
  `Tri Dharma PAS, ${
    triDharma?.nama_petugas || "belum ditentukan"
  }.`,
  
  `Pengucap Ikrar, ${
    ikrar?.nama_petugas || "belum ditentukan"
  }.`,
  
  `Operator Lagu, ${
    operator?.nama_petugas || "belum ditentukan"
  }.`,
  
  `Laporan Atensi, ${
    laporan?.nama_petugas || "belum ditentukan"
  }.`,
  
  `Humas, ${
    humas?.nama_petugas || "belum ditentukan"
  }.`,

  `Cadangan Petugas, ${
  cadangan?.nama_petugas || "belum ditentukan"
}.`,
  
  `Apel pagi akan dilaksanakan pada pukul ${
    pembina?.jam_apel?.slice(0, 5) || "08.00"
  } WIB.`,

  "Demikian susunan petugas apel pagi. Terima kasih.",
].join(" ");
useEffect(() => {
  if (!pembina) return;

  const timer = setInterval(async () => {
    const sekarang = new Date();

    const waktuSekarang =
      sekarang.getHours() * 60 +
      sekarang.getMinutes();

    const [jam, menit] = pembina.jam_apel
      .slice(0, 5)
      .split(":")
      .map(Number);

    const waktuApel = jam * 60 + menit;

    // 10 menit sebelum apel
    const waktuPengumuman = waktuApel - 10;

    const keyHariIni =
      `${tanggal}-${waktuPengumuman}`;

 if (
  waktuSekarang === waktuPengumuman &&
  pengumumanTerakhir !== keyHariIni &&
  !audioLockRef.current
) {
  audioLockRef.current = true;
  try {
    console.log("🔊 MEMBUAT PENGUMUMAN OTOMATIS...");

    const response = await fetch("/api/tts-edge", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: teksSusunanPetugas,
      }),
    });

    if (!response.ok) {
      const error = await response.text();

      console.error(
        "TTS OTOMATIS GAGAL:",
        error
      );

      return;
    }

    const blob = await response.blob();

    const url = URL.createObjectURL(blob);
await putarTingTong();
const audio = new Audio(url);

audio.volume = 1;

   audio.onended = () => {
  URL.revokeObjectURL(url);
  setIsSpeaking(false);
  audioLockRef.current = false;
};

    setIsSpeaking(true);

    await audio.play();

    setPengumumanTerakhir(keyHariIni);

    console.log(
      "✅ PENGUMUMAN OTOMATIS BERHASIL DIPUTAR"
    );

  } catch (error) {
    console.error(
      "❌ PENGUMUMAN OTOMATIS ERROR:",
      error
    );

    setIsSpeaking(false);
  }
}
  }, 1000);

  return () => clearInterval(timer);
}, [
  pembina,
  tanggal,
  pengumumanTerakhir,
]);
// PENGINGAT 5 MENIT SEBELUM APEL
useEffect(() => {
  
  if (!pembina) return;

  const timer = setInterval(async () => {
    const sekarang = new Date();

    const waktuSekarang =
      sekarang.getHours() * 60 +
      sekarang.getMinutes();

    const [jam, menit] = pembina.jam_apel
      .slice(0, 5)
      .split(":")
      .map(Number);

    const waktuApel = jam * 60 + menit;

    // 5 menit sebelum apel
    const waktuPengingat = waktuApel - 5;

    const keyPengingat =
      `${tanggal}-pengingat-5-${waktuApel}`;

   if (
  waktuSekarang === waktuPengingat &&
  pengumumanTerakhir !== keyPengingat &&
  !audioLockRef.current
) {
  audioLockRef.current = true;
      try {
        console.log(
          "🔔 PENGINGAT 5 MENIT SEBELUM APEL"
        );

        const teksPengingat =
          "Mohon perhatian. Apel pagi akan segera dimulai dalam waktu lima menit. Kepada seluruh petugas apel, dipersilakan mempersiapkan diri dan menempati posisi masing-masing.";

        const response = await fetch(
          "/api/tts-edge",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              text: teksPengingat,
            }),
          }
        );

        if (!response.ok) {
          const error = await response.text();

          console.error(
            "TTS PENGINGAT GAGAL:",
            error
          );

          return;
        }

        const blob = await response.blob();

        const url =
          URL.createObjectURL(blob);

     await putarTingTong();

const audio = new Audio(url);

audio.volume = 1;

       audio.onended = () => {
  URL.revokeObjectURL(url);
  setIsSpeaking(false);
  audioLockRef.current = false;
};

        setIsSpeaking(true);

        await audio.play();

        setPengumumanTerakhir(
          keyPengingat
        );

        console.log(
          "✅ PENGINGAT 5 MENIT BERHASIL"
        );

      } catch (error) {
        console.error(
          "❌ ERROR PENGINGAT:",
          error
        );

        setIsSpeaking(false);
      }
    }
  }, 1000);

  return () => clearInterval(timer);
}, [
  pembina,
  tanggal,
  pengumumanTerakhir,
]);
// PENGUMUMAN OTOMATIS SAAT APEL DIMULAI
useEffect(() => {
  if (!pembina) return;

  const timer = setInterval(async () => {
    const sekarang = new Date();

    const waktuSekarang =
      sekarang.getHours() * 60 +
      sekarang.getMinutes();

    const [jam, menit] = pembina.jam_apel
      .slice(0, 5)
      .split(":")
      .map(Number);

    const waktuApel = jam * 60 + menit;

    const keyMulaiApel =
      `${tanggal}-mulai-apel-${waktuApel}`;

    if (
      waktuSekarang === waktuApel &&
      pengumumanTerakhir !== keyMulaiApel &&
      !audioLockRef.current
    ) {
      audioLockRef.current = true;

      try {
        const teksMulaiApel =
          "Perhatian. Apel pagi Bapas Kelas Satu Jakarta Barat akan segera dimulai. Kepada seluruh petugas apel, dipersilakan menempati posisi masing-masing. Kepada seluruh pegawai, dimohon mengikuti apel dengan tertib.";

        console.log(
          "🔔 PENGUMUMAN APEL DIMULAI"
        );

        const response = await fetch(
          "/api/tts-edge",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              text: teksMulaiApel,
            }),
          }
        );

        if (!response.ok) {
          const error = await response.text();

          console.error(
            "TTS MULAI APEL GAGAL:",
            error
          );

          audioLockRef.current = false;
          return;
        }

        const blob = await response.blob();

        const url =
          URL.createObjectURL(blob);

     await putarTingTong();
const audio = new Audio(url);

audio.volume = 1;

        audio.onended = () => {
          URL.revokeObjectURL(url);
          setIsSpeaking(false);
          audioLockRef.current = false;
        };

        setIsSpeaking(true);

        await audio.play();

        setPengumumanTerakhir(
          keyMulaiApel
        );

        console.log(
          "✅ PENGUMUMAN APEL BERHASIL"
        );

      } catch (error) {
        console.error(
          "❌ ERROR PENGUMUMAN APEL:",
          error
        );

        setIsSpeaking(false);
        audioLockRef.current = false;
      }
    }
  }, 1000);

  return () => clearInterval(timer);
}, [
  pembina,
  tanggal,
  pengumumanTerakhir,
]);
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      {/* HEADER */}
      <header className="border-b border-white/10 bg-slate-900 px-8 py-5">

        <div className="flex items-center justify-between">

          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-blue-400">
              SIMASDI
            </p>

            <h1 className="mt-1 text-2xl font-bold">
              BALAI PEMASYARAKATAN KELAS I
              JAKARTA BARAT
            </h1>
          </div>

          <div className="text-right">
            <div className="text-4xl font-bold">
              {jamSekarang}
            </div>

            <div className="text-sm text-slate-400">
              WIB
            </div>
          </div>

        </div>

      </header>

      {/* CONTENT */}
      <section className="px-8 py-8">

        <div className="text-center">

          <p className="text-xl font-medium text-blue-400">
            {formatTanggal(tanggal)}
          </p>

          <h2 className="mt-3 text-5xl font-black tracking-wide">
            PETUGAS APEL HARI INI
          </h2>

        </div>

        {/* PEMBINA */}
        {pembina ? (
        <div className="mx-auto mt-8 max-w-5xl rounded-3xl border border-blue-400/30 bg-blue-500/10 p-8 text-center">

          <p className="text-lg font-semibold uppercase tracking-[0.3em] text-blue-400">
            PEMBINA APEL
          </p>

          <h3 className="mt-3 text-5xl font-black">
            {pembina?.nama_petugas}
          </h3>

          <p className="mt-2 text-xl text-slate-300">
            {pembina?.jabatan}
          </p>

        </div>
        ) : null}

        {/* WAKTU */}
        {pembina ? (
        <div className="mt-6 flex justify-center">

          <div className="rounded-2xl bg-white px-8 py-4 text-center text-slate-900 shadow-lg">

            <p className="text-sm font-semibold">
              WAKTU APEL
            </p>

            <p className="text-4xl font-black">
              {pembina?.jam_apel.slice(0, 5)} WIB
            </p>

          </div>

        </div>
       ) : null}

        {/* PETUGAS */}
        <div className="mx-auto mt-8 grid max-w-7xl grid-cols-2 gap-4 lg:grid-cols-4">

          {[
            ["Komandan Apel", komandan],
            ["Pembaca Doa", doa],
            ["Tri Dharma PAS", triDharma],
            ["Pengucap Ikrar", ikrar],
            ["Operator Lagu", operator],
            ["Laporan Atensi", laporan],
            ["Humas", humas],
             ["Cadangan Petugas", cadangan],
          ].map(([label, item]) => (
            <div
              key={label as string}
              className="rounded-2xl border border-white/10 bg-white/5 p-5"
            >

              <p className="text-sm font-semibold text-blue-400">
                {label as string}
              </p>

              <p className="mt-2 text-xl font-bold">
                {(item as Petugas | undefined)
                  ?.nama_petugas || "-"}
              </p>

              <p className="mt-1 text-sm text-slate-400">
                {(item as Petugas | undefined)
                  ?.jabatan || ""}
              </p>

            </div>
          ))}

        </div>

        {/* LOKASI */}
        <div className="mt-8 text-center">

          <p className="text-lg text-slate-300">
            📍 {pembina?.lokasi || "-"}
          </p>

        </div>

        {/* SUARA */}
     <div className="mt-8 flex flex-wrap justify-center gap-3 px-4">
<button
  onClick={() => {
    const audio = new Audio("/sound/pengumuman-apel.mp3");

    audio.volume = 0;

    audio.play()
     .then(async () => {
        audio.pause();
        audio.currentTime = 0;
        const bell = new Audio("/sound/call-to-attention.mp3");

bell.volume = 0;

await bell.play();
bell.pause();
bell.currentTime = 0;
bellAudioRef.current = bell;
        setAudioAktif(true);
      })
      .catch((error) => {
        console.error("Audio belum diizinkan:", error);
        alert("Silakan klik tombol ini untuk mengaktifkan suara otomatis.");
      });
  }}
  className={`rounded-2xl px-6 py-4 font-bold text-white ${
    audioAktif
      ? "bg-green-600"
      : "bg-yellow-500 hover:bg-yellow-400"
  }`}
>
  {audioAktif
    ? "✅ AUDIO OTOMATIS AKTIF"
    : "🔊 AKTIFKAN AUDIO OTOMATIS"}
</button>
          <button
           onClick={() => bicaraPengumuman()}
            disabled={isSpeaking}className="w-full max-w-sm rounded-2xl bg-blue-600 px-6 py-4 text-lg font-bold hover:bg-blue-500 disabled:opacity-50"
          >
            🔊{" "}
            {isSpeaking
              ? "PENGUMUMAN SEDANG BERLANGSUNG..."
              : "PUTAR PENGUMUMAN"}
          </button>

<button
  onClick={() => {
    const audio = new Audio("/sound/pengumuman-apel.mp3");
    audio.volume = 1;
    audio.play().catch((error) => {
      console.error("Tes otomatis gagal:", error);
    });
  }}
 className="w-full max-w-sm rounded-2xl bg-orange-500 px-6 py-4 font-bold text-white hover:bg-orange-400"
>
  🧪 TES OTOMATIS
</button>
<button
  type="button"
className="relative z-50 w-full max-w-sm cursor-pointer rounded-2xl bg-purple-600 px-6 py-4 font-bold text-white hover:bg-purple-500"
onClick={async () => {
  try {
    await putarTingTong();
    const response = await fetch("/api/tts-edge", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
     body: JSON.stringify({
  text: teksSusunanPetugas,
}),
    });

    console.log("TTS STATUS:", response.status);

    if (!response.ok) {
      const error = await response.text();
      console.error("TTS ERROR:", error);
      alert("TTS gagal: " + error);
      return;
    }

    const blob = await response.blob();

    console.log(
      "TTS AUDIO:",
      blob.type,
      blob.size
    );

    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);

    audio.volume = 1;

    audio.onended = () => {
      URL.revokeObjectURL(url);
    };

    await audio.play();

  } catch (error) {
    console.error("TTS TEST ERROR:", error);
    alert("Gagal menjalankan TTS.");
  }
}}
       
>

  🎙️ TES SUARA PEREMPUAN
</button>
        </div>
<div className="mx-auto mt-6 max-w-4xl rounded-2xl border border-white/10 bg-white/5 p-6">
  <p className="mb-2 text-sm font-semibold text-blue-400">
    PREVIEW PENGUMUMAN
  </p>

  <p className="text-lg leading-relaxed text-slate-200">
    {teksSusunanPetugas}
  </p>
</div>
      </section>

      {/* FOOTER */}
      <footer className="mt-4 border-t border-white/10 py-5 text-center text-sm text-slate-500">
        SIMASDI — Sistem Informasi Manajemen Arsip Digital 
      </footer>
    </main>
  );
}