
"use client";

import { useState } from "react";

export default function PengajuanKepegawaianPage() {
  const [jenisPengajuan, setJenisPengajuan] = useState("DINAS_LUAR");
  const [tanggalMulai, setTanggalMulai] = useState("");
  const [tanggalSelesai, setTanggalSelesai] = useState("");
  const [keterangan, setKeterangan] = useState("");

  return (
    <main className="mx-auto max-w-4xl p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          Pengajuan Dinas & Cuti
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Formulir pengajuan Dinas Luar, Lepas Piket, Izin, dan Cuti Pegawai
          ASN Bapas Kelas I Jakarta Barat.
        </p>
      </div>

      <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
        <h2 className="font-semibold text-blue-900">
          Jadwal Pengajuan
        </h2>
        <p className="mt-1 text-sm text-blue-800">
          Dibuka tanggal 16 pukul 09.00 WIB dan ditutup tanggal 13 pukul
          11.00 WIB setiap bulan. Tanggal 14–15 ditutup untuk pengajuan.
        </p>
        <p className="mt-2 text-xs text-blue-700">
          Jadwal ini masih berupa informasi tampilan. Penguncian otomatis
          akan dibuat pada langkah berikutnya.
        </p>
      </div>

      <form
        className="space-y-5 rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
        onSubmit={(event) => {
          event.preventDefault();
          alert("Formulir tampilan berhasil diuji. Pengiriman data belum diaktifkan.");
        }}
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
            className="w-full rounded-lg border border-gray-300 p-3 text-sm"
          />
          <p className="mt-1 text-xs text-gray-500">
            PDF, JPG, atau PNG. Fitur unggah dokumen akan diaktifkan pada
            langkah berikutnya.
          </p>
        </div>

        <button
          type="submit"
          className="rounded-lg bg-blue-700 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-800"
        >
          Uji Tampilan Formulir
        </button>
      </form>
    </main>
  );
}
