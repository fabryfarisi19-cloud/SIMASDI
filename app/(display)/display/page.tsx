
"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import Image from "next/image";

function getHariIni() {
  const now = new Date();

  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(now.getDate()).padStart(2, "0")}`;
}

type Antrian = {
  id?: number;
  nomor: string;
  loket: number | null;
};

type WaitingQueue = {
  nomor: string;
};

export default function DisplayTV() {
  const [dipanggil, setDipanggil] = useState<Antrian | null>(null);
  const [menunggu, setMenunggu] = useState<WaitingQueue[]>([]);
  const [runningText, setRunningText] = useState("");
  const [jam, setJam] = useState("");
  const [tanggal, setTanggal] = useState("");
  const [blink, setBlink] = useState(false);
  const [lastCalled, setLastCalled] = useState("");
  const [audioAktif, setAudioAktif] = useState(false);
 

 
  const videoInfoRef = useRef<HTMLVideoElement | null>(null);


  const audioAktifRef = useRef(false);

  /*
   * Menyimpan nomor panggilan terakhir.
   * Menggunakan REF agar tidak terkena masalah stale state
   * ketika loadData dipanggil dari realtime Supabase.
   */
  const lastCalledRef = useRef("");

  /*
   * Mencegah dua panggilan audio berbunyi bersamaan.
   */
  const sedangPanggilRef = useRef(false);

  /*
   * ID panggilan yang sedang diproses.
   */
  const panggilanSedangDiprosesRef = useRef<string | null>(null);

  const [statistik, setStatistik] = useState({
    total: 0,
    menunggu: 0,
    dipanggil: 0,
    selesai: 0,
  });

  // =========================================================
  // AKTIFKAN AUDIO
  // =========================================================

  const aktifkanAudio = async () => {
    console.log("🔊 AKTIFKAN AUDIO");

    setAudioAktif(true);
    audioAktifRef.current = true;

    /*
     * Unlock audio browser melalui interaksi pengguna.
     */
    try {
      const audio = new Audio();

      audio.volume = 0;

      await audio.play();

      audio.pause();
      audio.currentTime = 0;
      audio.volume = 1;

      console.log("✅ AUDIO BROWSER BERHASIL DIUNLOCK");
    } catch (error) {
      console.log("ℹ️ Unlock audio:", error);
    }

    /*
     * Aktifkan kembali video informasi.
     */
    setTimeout(async () => {
      try {
        await videoInfoRef.current?.play();

        console.log("▶️ Video informasi berjalan");
      } catch (error) {
        console.error(
          "❌ Video informasi gagal diputar:",
          error
        );
      }
    }, 300);
  };

  // =========================================================
  // TING TONG
  // =========================================================

  const putarTingTong = async () => {
    try {
      console.log("🔔 MEMUTAR TING-TONG");

      const audio = new Audio(
        "/sound/call-to-attention.mp3"
      );

      audio.preload = "auto";
      audio.volume = 1;

      await new Promise<void>((resolve) => {
        audio.onended = () => {
          console.log("🔔 Ting-tong selesai");
          resolve();
        };

        audio.onerror = () => {
          console.error(
            "❌ File call-to-attention.mp3 gagal diputar"
          );

          resolve();
        };

        audio
          .play()
          .then(() => {
            console.log("▶️ Ting-tong mulai");
          })
          .catch((error) => {
            console.error(
              "❌ Ting-tong gagal:",
              error
            );

            resolve();
          });
      });
    } catch (error) {
      console.error(
        "❌ Error ting-tong:",
        error
      );
    }
  };

  // =========================================================
  // TTS ANTREAN
  // =========================================================

  const putarTTS = async (text: string) => {
    try {
      console.log("🎤 MEMBUAT TTS:", text);

      const response = await fetch(
        "/api/tts-edge",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text,
          }),
        }
      );

      if (!response.ok) {
        console.error(
          "❌ API TTS gagal:",
          response.status
        );

        return;
      }

      const blob = await response.blob();

      console.log(
        "✅ TTS berhasil dibuat:",
        blob.type,
        blob.size
      );

      const url = URL.createObjectURL(blob);

      const audio = new Audio(url);

      audio.preload = "auto";
      audio.volume = 1;

      await new Promise<void>((resolve) => {
        audio.onended = () => {
          console.log("🎤 TTS selesai");

          URL.revokeObjectURL(url);

          resolve();
        };

        audio.onerror = () => {
          console.error(
            "❌ Audio TTS gagal dimainkan"
          );

          URL.revokeObjectURL(url);

          resolve();
        };

        audio
          .play()
          .then(() => {
            console.log(
              "▶️ TTS mulai berbunyi"
            );
          })
          .catch((error) => {
            console.error(
              "❌ TTS PLAY gagal:",
              error
            );

            URL.revokeObjectURL(url);

            resolve();
          });
      });
    } catch (error) {
      console.error(
        "❌ Error putar TTS:",
        error
      );
    }
  };

  // =========================================================
  // PANGGIL NOMOR ANTREAN
  // =========================================================

  const panggilNomor = async (
    nomor: string,
    loket: number | null
  ) => {
    /*
     * Audio belum diaktifkan.
     */
    if (!audioAktifRef.current) {
      console.log(
        "🔇 Audio belum diaktifkan"
      );

      return;
    }


    /*
     * Ada panggilan lain yang sedang berjalan.
     */
    if (sedangPanggilRef.current) {
      console.log(
        "⏳ Panggilan audio masih berjalan"
      );

      return;
    }

    const idPanggilan =
      `${nomor}-${loket ?? ""}`;

    /*
     * Pengaman tambahan.
     */
    if (
      panggilanSedangDiprosesRef.current ===
      idPanggilan
    ) {
      return;
    }

    panggilanSedangDiprosesRef.current =
      idPanggilan;

    sedangPanggilRef.current = true;

    try {
      console.log(
        "📢 MULAI PANGGILAN:",
        nomor,
        "LOKET:",
        loket
      );

      /*
       * Hentikan video informasi sementara.
       */
      if (videoInfoRef.current) {
        videoInfoRef.current.pause();
      }

      /*
       * 1. Ting-tong
       */
      await putarTingTong();

      /*
       * 2. Jeda 1 detik
       */
      await new Promise<void>((resolve) => {
        setTimeout(resolve, 1000);
      });

      /*
       * 3. Buat kalimat pengumuman.
       */
      let teks =
        `Nomor ${nomor}, `;

      if (loket !== null) {
        teks +=
          `silakan menuju loket ${loket}.`;
      } else {
        teks +=
          `silakan menuju loket.`;
      }

      console.log(
        "🗣️ KALIMAT:",
        teks
      );

      /*
       * 4. Putar TTS
       */
      await putarTTS(teks);

      /*
       * 5. Jalankan kembali video.
       */
    if (videoInfoRef.current) {
        try {
          await videoInfoRef.current.play();

          console.log(
            "▶️ Video informasi dilanjutkan"
          );
        } catch (error) {
          console.error(
            "❌ Video gagal dilanjutkan:",
            error
          );
        }
      }

      console.log(
        "✅ PANGGILAN SELESAI"
      );
    } catch (error) {
      console.error(
        "❌ Error panggilan:",
        error
      );
    } finally {
      sedangPanggilRef.current = false;

      panggilanSedangDiprosesRef.current =
        null;
    }
  };

  // =========================================================
  // LOAD DATA
  // =========================================================

  async function loadData() {
    const hariIni = getHariIni();

    // =======================================================
    // SETTING SIANTAR
    // =======================================================

    const { data: setting } =
      await supabase
        .from("setting_siantar")
        .select("running_text")
        .eq("id", 1)
        .single();

    if (setting) {
      setRunningText(
        setting.running_text
      );
    }

    // =======================================================
    // NOMOR YANG SEDANG DIPANGGIL
    // =======================================================

    const { data } =
      await supabase
        .from("antrian")
        .select(
          "id, nomor, loket"
        )
        .eq("tanggal", hariIni)
        .not(
          "called_at",
          "is",
          null
        )
        .order(
          "called_at",
          {
            ascending: false,
          }
        )
        .limit(1)
        .maybeSingle();

    if (data) {
      setDipanggil(data);

      /*
       * ID unik nomor + loket.
       */
      const nomorPanggilan =
        `${data.nomor}-${data.loket ?? ""}`;

      /*
       * Deteksi panggilan baru.
       */
      if (
        lastCalledRef.current !==
        nomorPanggilan
      ) {
        console.log(
          "🆕 PANGGILAN BARU:",
          data.nomor,
          "LOKET:",
          data.loket
        );

        lastCalledRef.current =
          nomorPanggilan;

        setLastCalled(
          nomorPanggilan
        );

        /*
         * Efek kedip nomor.
         */
        setBlink(true);

        setTimeout(() => {
          setBlink(false);
        }, 3000);

        /*
         * PANGGIL AUDIO.
         *
         * Hanya jika audio sudah diaktifkan
         * oleh pengguna.
         */
        if (
          audioAktifRef.current
        ) {
          panggilNomor(
            data.nomor,
            data.loket
          );
        }
      }
    } else {
      setDipanggil(null);
    }

    // =======================================================
    // ANTREAN BERIKUTNYA
    // =======================================================

    const { data: waiting } =
      await supabase
        .from("antrian")
        .select("nomor")
        .eq(
          "status",
          "MENUNGGU"
        )
        .eq(
          "tanggal",
          hariIni
        )
        .order("id")
        .limit(5);

    setMenunggu(
      waiting || []
    );

    // =======================================================
    // STATISTIK
    // =======================================================

    const [
      total,
      menungguCount,
      dipanggilCount,
      selesaiCount,
    ] = await Promise.all([
      supabase
        .from("antrian")
        .select(
          "*",
          {
            count: "exact",
            head: true,
          }
        )
        .eq(
          "tanggal",
          hariIni
        ),

      supabase
        .from("antrian")
        .select(
          "*",
          {
            count: "exact",
            head: true,
          }
        )
        .eq(
          "tanggal",
          hariIni
        )
        .eq(
          "status",
          "MENUNGGU"
        ),

      supabase
        .from("antrian")
        .select(
          "*",
          {
            count: "exact",
            head: true,
          }
        )
        .eq(
          "tanggal",
          hariIni
        )
        .eq(
          "status",
          "DIPANGGIL"
        ),

      supabase
        .from("antrian")
        .select(
          "*",
          {
            count: "exact",
            head: true,
          }
        )
        .eq(
          "tanggal",
          hariIni
        )
        .eq(
          "status",
          "SELESAI"
        ),
    ]);

    console.log({
      total: total.count,
      menunggu:
        menungguCount.count,
      dipanggil:
        dipanggilCount.count,
      selesai:
        selesaiCount.count,
    });

    setStatistik({
      total:
        total.count ?? 0,

      menunggu:
        menungguCount.count ?? 0,

      dipanggil:
        dipanggilCount.count ?? 0,

      selesai:
        selesaiCount.count ?? 0,
    });
  }

  // =========================================================
  // INITIAL EFFECT
  // =========================================================

  useEffect(() => {
    loadData();

    // =======================================================
    // JAM
    // =======================================================

    setJam(
      new Date().toLocaleTimeString(
        "id-ID",
        {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }
      )
    );

    // =======================================================
    // TANGGAL
    // =======================================================

    setTanggal(
      new Date().toLocaleDateString(
        "id-ID",
        {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        }
      )
    );

    const timer =
      setInterval(() => {
        setJam(
          new Date().toLocaleTimeString(
            "id-ID",
            {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            }
          )
        );

        setTanggal(
          new Date().toLocaleDateString(
            "id-ID",
            {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            }
          )
        );
      }, 1000);

    // =======================================================
    // REALTIME SUPABASE
    // =======================================================

    const channel =
      supabase
        .channel("display-tv")

        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "antrian",
          },
          () => {
            console.log(
              "🔄 REALTIME ANTRIAN"
            );

            loadData();
          }
        )

        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "setting_siantar",
          },
          () => {
            console.log(
              "🔄 SETTING SIANTAR BERUBAH"
            );

            loadData();
          }
        )

        .subscribe();


    return () => {
      clearInterval(timer);


      window.speechSynthesis?.cancel();

      supabase.removeChannel(
        channel
      );
    };
  }, []);

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <main className="h-screen overflow-hidden bg-blue-900 text-white">


      {/* =====================================================
          GRID UTAMA
      ====================================================== */}

      <div className="grid grid-cols-12 h-[calc(100vh-64px)]">

        {/* ===================================================
            PANEL NOMOR
        ==================================================== */}

        <div className="col-span-6 flex flex-col bg-[#14398B]">

          {/* HEADER */}

          <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 rounded-b-[40px] px-10 py-5 shadow-xl border-b border-white/20">

            <div className="flex items-center justify-between">

              {/* KIRI */}

              <div className="flex items-center gap-6">

                <Image
                  src="/logoimipas.png"
                  alt="Logo"
                  width={72}
                  height={72}
                />

                <div>

                  <h1 className="text-2xl font-black tracking-wide text-white">
                    Bapas Kelas I Jakarta Barat
                  </h1>

                  <p className="text-2xl text-blue-100">
                    Melayani Dengan Hati
                  </p>

                </div>

              </div>

              {/* KANAN */}

              <div className="text-right">

                <div className="text-4xl font-black text-white">
                  {jam}
                </div>

                <div className="mt-2 text-xl text-blue-100">
                  {tanggal}
                </div>

              </div>

            </div>

          </div>

          {/* NOMOR */}

          <div className="relative flex justify-center px-8 pt-6">

            <Image
              src="/logoimipas.png"
              alt="Watermark"
              width={150}
              height={150}
              className="absolute opacity-[0.02] w-[380px] h-[380px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            />

            <div className="bg-white rounded-[36px] shadow-[0_20px_60px_rgba(0,0,0,0.18)] w-[88%] max-w-3xl py-6 px-8">

              <div className="text-center">

                <p className="text-3xl tracking-[8px] text-slate-500 font-semibold">
                  NOMOR ANTREAN
                </p>

                <div
                  key={
                    dipanggil?.nomor
                  }
                  className={`
                    mt-6
                    text-[150px]
                    font-black
                    text-blue-700
                    transition-all
                    duration-500
                    ${
                      blink
                        ? "scale-110 text-yellow-500"
                        : ""
                    }
                  `}
                >
                  {dipanggil?.nomor ??
                    "---"}
                </div>

                <div className="mt-6 text-2xl text-slate-600">
                  Silakan menuju
                </div>

                <div className="text-6xl font-black text-blue-700 mt-2">
                  Loket{" "}
                  {dipanggil?.loket ??
                    "-"}
                </div>

              </div>

            </div>

          </div>

          {/* ANTREAN BERIKUTNYA */}

          <div className="pb-6 text-center">

            <h2 className="text-3xl font-bold mb-4">
              Antrean Berikutnya
            </h2>

            <div className="mt-2 flex justify-center gap-4 flex-wrap">

              {menunggu.length ===
              0 ? (
                <div className="text-xl text-blue-100">
                  Tidak ada antrean
                  menunggu
                </div>
              ) : (
                menunggu.map(
                  (item) => (
                    <div
                      key={
                        item.nomor
                      }
                      className="w-32 h-24 rounded-2xl bg-white shadow-xl flex items-center justify-center"
                    >
                      <span className="text-4xl font-black text-blue-700">
                        {item.nomor}
                      </span>
                    </div>
                  )
                )
              )}

            </div>

          </div>

        </div>

        {/* ===================================================
            PANEL VIDEO
        ==================================================== */}

        <div className="col-span-6 flex flex-col bg-[#0B1F4D] border-l-2 border-white/20">

          {/* HEADER VIDEO */}

          <div className="bg-gradient-to-r from-blue-950 via-blue-900 to-blue-800 text-center py-5 border-b border-white/30">

            <h2 className="text-xl font-bold text-white">
              VIDEO INFORMASI
            </h2>

            <p className="text-blue-200 mt-1">
              Balai Pemasyarakatan
              Kelas I Jakarta Barat
            </p>

          </div>

          {/* VIDEO */}

          <div className="flex-1 overflow-hidden px-2 pb-2 pt-2">

            <video
              ref={videoInfoRef}
              src="/videoanak1.mp4"
              autoPlay
              muted={false}
              loop
              playsInline
              controls={true}
              className="w-full h-full object-cover rounded-xl bg-blue-900"
            />

          </div>

          {/* =================================================
              STATISTIK
          ================================================== */}

          <div className="bg-blue-950 px-4 py-3 border-t border-blue-700 -mt-16">

            <h3 className="text-xl font-bold text-center mb-3">
              Statistik Hari Ini
            </h3>

            <div className="grid grid-cols-2 gap-3">

              {/* TOTAL */}

              <div className="bg-blue-500 rounded-2xl p-2 text-center">

                <div className="text-2xl font-black">
                  {
                    statistik.total
                  }
                </div>

                <div className="text-blue-200">
                  Total
                </div>

              </div>

              {/* MENUNGGU */}

              <div className="bg-yellow-500 rounded-2xl p-2 text-center">

                <div className="text-2xl font-black text-black">
                  {
                    statistik.menunggu
                  }
                </div>

                <div className="text-black">
                  Menunggu
                </div>

              </div>

              {/* SELESAI */}

              <div className="bg-green-500 rounded-2xl p-2 text-center">

                <div className="text-2xl font-black">
                  {
                    statistik.selesai
                  }
                </div>

                <div>
                  Selesai
                </div>

              </div>

              {/* DIPANGGIL */}

              <div className="bg-red-500 rounded-2xl p-2 text-center">

                <div className="text-2xl font-black">
                  {
                    statistik.dipanggil
                  }
                </div>

                <div>
                  Dipanggil
                </div>

              </div>

            </div>

          </div>

        </div>

      </div>

      {/* =====================================================
          RUNNING TEXT
      ====================================================== */}

      <div className="mt-4 h-14 bg-yellow-400 overflow-hidden flex items-center relative z-50">

        <div className="animate-marquee whitespace-nowrap text-black text-2xl font-bold leading-none">

          {runningText}

          {" • "}

          {runningText}

          {" • "}

          {runningText}

        </div>

      </div>

    </main>
  );
}
