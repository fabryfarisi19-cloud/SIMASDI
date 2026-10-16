
"use client";

import { useEffect, useState, type FormEvent } from "react";

type StatusJadwal = {
  success: boolean;
  terbuka: boolean;
  waktuWIB: string;
  jadwal: {
    buka: string;
    tutup: string;
    tanggalDitutup: string;
  };
  pesan: string;
};

export default function PengajuanKepegawaianPage() {
  const [jenisPengajuan, setJenisPengajuan] = useState("DINAS_LUAR");
  const [tanggalMulai, setTanggalMulai] = useState("");
  const [tanggalSelesai, setTanggalSelesai] = useState("");
  const [keterangan, setKeterangan] = useState("");

  const [statusJadwal, setStatusJadwal] =
    useState<StatusJadwal | null>(null);
  const [memuatJadwal, setMemuatJadwal] = useState(true);
  const [mengirim, setMengirim] = useState(false);
  const [pesanHasil, setPesanHasil] = useState("");
  const [berhasil, setBerhasil] = useState(false);

  useEffect(() => {
    let aktif = true;

    async function periksaJadwal() {
      try {
        const response = await fetch("/api/pengajuan-kepegawaian", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Jadwal gagal diperiksa.");
        }

        const data: StatusJadwal = await response.json();

        if (aktif) {
          setStatusJadwal(data.success ? data : null);
        }
      } catch (error) {
        console.error("Gagal memeriksa jadwal:", error);

        if (aktif) {
          setStatusJadwal(null);
        }
      } finally {
        if (aktif) {
          setMemuatJadwal(false);
        }
      }
    }

    void periksaJadwal();

    const interval = window.setInterval(() => {
      void periksaJadwal();
    }, 60_000);

    return () => {
      aktif = false;
      window.clearInterval(interval);
    };
  }, []);

  const formulirAktif =
    !memuatJadwal &&
    statusJadwal !== null &&
    statusJadwal.success &&
    statusJadwal.terbuka;

  async function kirimPengajuan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setPesanHasil("");
    setBerhasil(false);

    if (!formulirAktif) {
      setPesanHasil("Pengajuan sedang ditutup atau jadwal belum tersedia.");
      return;
    }

    if (tanggalSelesai < tanggalMulai) {
      setPesanHasil("Tanggal selesai tidak boleh sebelum tanggal mulai.");
      return;
    }

    if (!keterangan.trim()) {
      setPesanHasil("Keterangan pengajuan wajib diisi.");
      return;
    }

    if (keterangan.trim().length > 3000) {
      setPesanHasil("Keterangan maksimal 3000 karakter.");
      return;
    }

    setMengirim(true);

    try {
      const response = await fetch("/api/pengajuan-kepegawaian", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jenisPengajuan,
          tanggalMulai,
          tanggalSelesai,
          keterangan: keterangan.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Pengajuan gagal disimpan.");
      }

      setBerhasil(true);
      setPesanHasil(
        `Pengajuan berhasil disimpan. Nomor pengajuan: ${data.data.id}`
      );

      setJenisPengajuan("DINAS_LUAR");
      setTanggalMulai("");
      setTanggalSelesai("");
      setKeterangan("");
    } catch (error) {
      setPesanHasil(
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat mengirim pengajuan."
      );
    } finally {
      setMengirim(false);
    }
  }

  return (
    <main className="mx-auto max-w-4xl p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          Pengajuan Dinas & Cuti
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Formulir pengajuan Dinas Luar, Lepas Piket, Izin,
          dan Cuti Pegawai ASN Bapas Kelas I Jakarta Barat.
        </p>
      </div>

      <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
        <h2 className="font-semibold text-blue-900">
          Jadwal Pengajuan
        </h2>

        <p className="mt-1 text-sm text-blue-800">
          Dibuka tanggal 16 pukul 09.00 WIB dan ditutup
          tanggal 13 pukul 11.00 WIB setiap bulan.
          Tanggal 14–15 ditutup untuk pengajuan.
        </p>

        <div className="mt-4 rounded-lg border border-blue-200 bg-white p-3">
          {memuatJadwal ? (
            <p className="text-sm text-gray-600">
              Sedang memeriksa jadwal pengajuan...
            </p>
          ) : !statusJadwal ? (
            <p className="text-sm font-medium text-red-700">
              Jadwal tidak dapat diperiksa. Formulir
              dinonaktifkan sementara. Silakan muat ulang halaman.
            </p>
          ) : (
            <>
              <p
                className={`text-sm font-semibold ${
                  formulirAktif ? "text-green-700" : "text-red-700"
                }`}
              >
                {statusJadwal.pesan}
              </p>
              <p className="mt-2 text-xs text-gray-600">
                Waktu server: {statusJadwal.waktuWIB}
              </p>
            </>
          )}
        </div>
      </div>

      <form
        className="space-y-5 rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
        onSubmit={kirimPengajuan}
      >
        <fieldset
          disabled={!formulirAktif || mengirim}
          className="space-y-5 disabled:opacity-60"
        >
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Jenis Pengajuan
            </label>
            <select
              value={jenisPengajuan}
              onChange={(event) => setJenisPengajuan(event.target.value)}
              className="w-full rounded-lg border border-gray-300 p-3 text-sm"
              required
            >
              <option value="DINAS_LUAR">Dinas Luar</option>
              <option value="LEPAS_PIKET">Lepas Piket</option>
              <option value="IZIN">Izin</option>
              <option value="CUTI">Cuti</option>
            </select>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Tanggal Mulai
              </label>
              <input
                type="date"
                value={tanggalMulai}
                onChange={(event) => setTanggalMulai(event.target.value)}
                className="w-full rounded-lg border border-gray-300 p-3 text-sm"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Tanggal Selesai
              </label>
              <input
                type="date"
                value={tanggalSelesai}
                onChange={(event) => setTanggalSelesai(event.target.value)}
                min={tanggalMulai || undefined}
                className="w-full rounded-lg border border-gray-300 p-3 text-sm"
                required
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Keterangan
            </label>
            <textarea
              value={keterangan}
              onChange={(event) => setKeterangan(event.target.value)}
              className="w-full rounded-lg border border-gray-300 p-3 text-sm"
              rows={4}
              maxLength={3000}
              placeholder="Tuliskan keterangan pengajuan..."
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Dokumen Pendukung
            </label>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              disabled
              className="w-full rounded-lg border border-gray-300 p-3 text-sm"
            />
            <p className="mt-1 text-xs text-gray-500">
              Unggah dokumen belum diaktifkan. Dokumen tidak dikirim
              atau disimpan pada tahap ini.
            </p>
          </div>

          <button
            type="submit"
            disabled={!formulirAktif || mengirim}
            className="rounded-lg bg-blue-700 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {mengirim ? "Menyimpan Pengajuan..." : "Kirim Pengajuan"}
          </button>
        </fieldset>

        {pesanHasil && (
          <div
            role="status"
            aria-live="polite"
            className={`rounded-lg border p-3 text-sm ${
              berhasil
                ? "border-green-200 bg-green-50 text-green-800"
                : "border-red-200 bg-red-50 text-red-800"
            }`}
          >
            {pesanHasil}
          </div>
        )}
      </form>
    </main>
  );
}
