"use client";

import { useEffect, useState } from "react";

type Absensi = {
  id: string;
  tanggal: string;
  jam_masuk: string | null;
  jam_pulang: string | null;
  status: string;
  jarak_masuk: number | null;
  jarak_pulang: number | null;
};

type Lokasi = {
  latitude: number;
  longitude: number;
  accuracy: number;
  jarak: number;
  dalamArea: boolean;
};

export default function AbsensiFingerPage() {
  const [absensi, setAbsensi] = useState<Absensi | null>(null);
  const [lokasi, setLokasi] = useState<Lokasi | null>(null);

  const [loading, setLoading] = useState(true);
  const [proses, setProses] = useState(false);

  const [pesan, setPesan] = useState("");
  const [error, setError] = useState("");
const [aksesAbsensi, setAksesAbsensi] = useState(true);
  // ==========================================
  // Ambil status absensi hari ini
  // ==========================================
  async function loadAbsensi() {
    try {
      const response = await fetch("/api/absensi-finger", {
        cache: "no-store",
      });

      const result = await response.json();

if (!response.ok || !result.success) {
  setAbsensi(null);

  if (result.code === "ABSENSI_NOT_ALLOWED") {
    setAksesAbsensi(false);
  }

  setError(result.message || "Gagal membaca absensi.");
  return;
}

setAksesAbsensi(true);
setAbsensi(result.data || null);

    } catch (err) {
      console.error(err);
      setError("Gagal terhubung ke server.");
    }
  }

  // ==========================================
  // Ambil GPS
  // ==========================================
  function ambilLokasi() {
    setLoading(true);
    setError("");
    setPesan("");

    if (!navigator.geolocation) {
      setError("Perangkat Anda tidak mendukung GPS.");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        const accuracy = position.coords.accuracy;

        /*
         * Jarak sebenarnya akan dihitung oleh API.
         * Di halaman kita tampilkan koordinat dan akurasi
         * terlebih dahulu.
         */
        setLokasi({
          latitude,
          longitude,
          accuracy,
          jarak: 0,
          dalamArea: true,
        });

        setLoading(false);
      },
      (err) => {
        console.error("GPS ERROR:", err);

        let message = "Lokasi tidak dapat diperoleh.";

        if (err.code === 1) {
          message =
            "Izin lokasi ditolak. Silakan aktifkan izin lokasi untuk SIMASDI.";
        } else if (err.code === 2) {
          message =
            "Lokasi tidak tersedia. Pastikan GPS perangkat aktif.";
        } else if (err.code === 3) {
          message =
            "Waktu mengambil lokasi habis. Silakan coba kembali.";
        }

        setError(message);
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  }

  // ==========================================
  // Absen
  // ==========================================
  async function lakukanAbsen(tipe: "masuk" | "pulang") {
    setError("");
    setPesan("");

    if (!lokasi) {
      setError("Silakan ambil lokasi terlebih dahulu.");
      ambilLokasi();
      return;
    }

    setProses(true);

    try {
      const response = await fetch("/api/absensi-finger", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tipe,
          latitude: lokasi.latitude,
          longitude: lokasi.longitude,
          accuracy: lokasi.accuracy,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        if (result.code === "OUTSIDE_RADIUS") {
          setError(
            `${result.message} Jarak Anda ${result.data?.jarak_meter ?? "-"} meter dari kantor.`
          );
        } else {
          setError(result.message || "Absensi gagal.");
        }

        return;
      }

      setPesan(result.message || "Absensi berhasil.");

      await loadAbsensi();

      // Ambil GPS lagi setelah berhasil
      ambilLokasi();
    } catch (err) {
      console.error(err);
      setError("Terjadi kesalahan saat melakukan absensi.");
    } finally {
      setProses(false);
    }
  }

  // ==========================================
  // Saat halaman dibuka
  // ==========================================
  useEffect(() => {
    async function init() {
      await loadAbsensi();
      ambilLokasi();
    }

    init();
  }, []);

  // ==========================================
  // Format jam
  // ==========================================
  function formatJam(value: string | null) {
    if (!value) return "-";

    const date = new Date(value);

    return date.toLocaleTimeString("id-ID", {
      timeZone: "Asia/Jakarta",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800">
            Absensi Finger
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Absensi hanya dapat dilakukan di area kantor.
          </p>
        </div>

        {/* Status lokasi */}
        <div className="mb-6 rounded-2xl bg-white p-6 shadow-sm border">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="font-semibold text-slate-800">
                Lokasi Perangkat
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Bapas Kelas I Jakarta Barat
              </p>

              <p className="text-sm text-slate-500">
                Jl. Palmerah Barat V No. 12
              </p>
            </div>

            <div className="text-3xl">
              📍
            </div>
          </div>

          <div className="mt-5 rounded-xl bg-slate-50 p-4">
            {loading ? (
              <p className="text-sm text-slate-500">
                Memeriksa lokasi GPS...
              </p>
            ) : lokasi ? (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-slate-500">
                    Latitude
                  </span>

                  <span className="font-medium">
                    {lokasi.latitude.toFixed(6)}
                  </span>
                </div>

                <div className="flex justify-between gap-4">
                  <span className="text-slate-500">
                    Longitude
                  </span>

                  <span className="font-medium">
                    {lokasi.longitude.toFixed(6)}
                  </span>
                </div>

                <div className="flex justify-between gap-4">
                  <span className="text-slate-500">
                    Akurasi GPS
                  </span>

                  <span className="font-medium">
                    ± {Math.round(lokasi.accuracy)} meter
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-red-600">
                Lokasi belum diperoleh.
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={ambilLokasi}
            disabled={loading}
            className="mt-4 w-full rounded-xl bg-slate-800 px-4 py-3 font-medium text-white transition hover:bg-slate-700 disabled:opacity-50"
          >
            📍 Perbarui Lokasi
          </button>
        </div>

        {/* Pesan */}
        {pesan && (
          <div className="mb-6 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
            ✅ {pesan}
          </div>
        )}

      {error && (
  <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
    {aksesAbsensi ? "❌" : "🔒"} {error}
  </div>
)}

        {/* Absensi hari ini */}
        <div className="mb-6 rounded-2xl bg-white p-6 shadow-sm border">
          <h2 className="mb-4 font-semibold text-slate-800">
            Absensi Hari Ini
          </h2>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-xl bg-green-50 p-5">
              <p className="text-sm text-green-700">
                Absen Masuk
              </p>

              <p className="mt-2 text-2xl font-bold text-green-800">
                {formatJam(absensi?.jam_masuk || null)}
              </p>

              {absensi?.jarak_masuk !== null &&
                absensi?.jarak_masuk !== undefined && (
                  <p className="mt-1 text-xs text-green-700">
                    Jarak {absensi.jarak_masuk} meter
                  </p>
                )}
            </div>

            <div className="rounded-xl bg-blue-50 p-5">
              <p className="text-sm text-blue-700">
                Absen Pulang
              </p>

              <p className="mt-2 text-2xl font-bold text-blue-800">
                {formatJam(absensi?.jam_pulang || null)}
              </p>

              {absensi?.jarak_pulang !== null &&
                absensi?.jarak_pulang !== undefined && (
                  <p className="mt-1 text-xs text-blue-700">
                    Jarak {absensi.jarak_pulang} meter
                  </p>
                )}
            </div>
          </div>
        </div>

      {/* Tombol */}
{aksesAbsensi && (
  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <button
            type="button"
            onClick={() => lakukanAbsen("masuk")}
            disabled={
              proses ||
              loading ||
              !lokasi ||
              !!absensi?.jam_masuk
            }
            className="rounded-2xl bg-green-600 px-6 py-5 text-lg font-bold text-white shadow-sm transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {proses
              ? "Memproses..."
              : absensi?.jam_masuk
              ? "✓ Sudah Absen Masuk"
              : "🟢 ABSEN MASUK"}
          </button>

          <button
            type="button"
            onClick={() => lakukanAbsen("pulang")}
            disabled={
              proses ||
              loading ||
              !lokasi ||
              !absensi?.jam_masuk ||
              !!absensi?.jam_pulang
            }
            className="rounded-2xl bg-blue-600 px-6 py-5 text-lg font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {proses
              ? "Memproses..."
              : absensi?.jam_pulang
              ? "✓ Sudah Absen Pulang"
              : "🔵 ABSEN PULANG"}
          </button>
        
  </div>
)}
        {/* Informasi */}
        <div className="mt-6 rounded-xl border bg-white p-4 text-xs text-slate-500">
          <p>
            <strong>Catatan:</strong> SIMASDI menggunakan lokasi GPS
            perangkat untuk memastikan absensi dilakukan di area kantor.
          </p>

          <p className="mt-1">
            Pastikan GPS aktif dan izin lokasi untuk browser diberikan.
          </p>
        </div>
      </div>
    </div>
  );
}