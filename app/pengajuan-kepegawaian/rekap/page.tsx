
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
type Pengajuan = {
  id: string;
  pengguna_id: string;
  nama_pegawai: string;
  nip: string | null;
  jenis_pengajuan: string;
  tanggal_mulai: string;
  tanggal_selesai: string;
  keterangan: string;
  dokumen_url: string | null;
  dibuat_pada: string;
};

const labelJenis: Record<string, string> = {
  DINAS_LUAR: "Dinas Luar",
  LEPAS_PIKET: "Lepas Piket",
  IZIN: "Izin",
  CUTI: "Cuti",
};

function formatTanggal(value: string) {
  if (!value) return "-";
  const tanggal = new Date(`${value.slice(0, 10)}T00:00:00`);
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(tanggal);
}

function formatWaktu(value: string) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}


export default function RekapPengajuanPage() {
  const [data, setData] = useState<Pengajuan[]>([]);
  const [memuat, setMemuat] = useState(true);
  const [kataKunci, setKataKunci] = useState("");
  const [jenis, setJenis] = useState("SEMUA");
  const [tanggalDari, setTanggalDari] = useState("");
  const [tanggalSampai, setTanggalSampai] = useState("");
  const [pesan, setPesan] = useState("");
  const [aksesDitolak, setAksesDitolak] = useState(false);

  const muatData = useCallback(async () => {
    setMemuat(true);
    setPesan("");
    setAksesDitolak(false);

    try {
      const response = await fetch("/api/pengajuan-kepegawaian/rekap", {
        cache: "no-store",
      });

      const hasil = await response.json();

      if (response.status === 401 || response.status === 403) {
        setAksesDitolak(true);
        setPesan(hasil.error || "Anda tidak memiliki akses ke halaman ini.");
        setData([]);
        return;
      }

      if (!response.ok || !hasil.success) {
        throw new Error(hasil.error || "Rekap gagal dimuat.");
      }

      setData(Array.isArray(hasil.data) ? hasil.data : []);
      
    } catch (error) {
      setPesan(
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat memuat rekap."
      );
    } finally {
      setMemuat(false);
    }
  }, []);

  useEffect(() => {
    void muatData();
  }, [muatData]);

  const dataFilter = useMemo(() => {
    const kata = kataKunci.trim().toLowerCase();

    return data.filter((item) => {
      const cocokKata =
        !kata ||
        item.nama_pegawai.toLowerCase().includes(kata) ||
        String(item.nip ?? "").toLowerCase().includes(kata);

      const cocokJenis = jenis === "SEMUA" || item.jenis_pengajuan === jenis;
      const tanggalMulai = item.tanggal_mulai.slice(0, 10);
      const cocokDari = !tanggalDari || tanggalMulai >= tanggalDari;
      const cocokSampai = !tanggalSampai || tanggalMulai <= tanggalSampai;

      return cocokKata && cocokJenis && cocokDari && cocokSampai;
    });
  }, [data, kataKunci, jenis, tanggalDari, tanggalSampai]);

  
function eksporExcel() {
  const header = [
    "Nama Pegawai",
    "NIP",
    "Jenis Pengajuan",
    "Tanggal Mulai",
    "Tanggal Selesai",
    "Keterangan",
    "Tanggal Pengajuan",
  ];

  const baris = dataFilter.map((item) => [
    item.nama_pegawai,
    String(item.nip ?? ""),
    labelJenis[item.jenis_pengajuan] ?? item.jenis_pengajuan,
    formatTanggal(item.tanggal_mulai),
    formatTanggal(item.tanggal_selesai),
    item.keterangan,
    formatWaktu(item.dibuat_pada),
  ]);

  const worksheet = XLSX.utils.aoa_to_sheet([header, ...baris]);

  // Pastikan seluruh NIP disimpan sebagai teks.
  for (let nomorBaris = 2; nomorBaris <= baris.length + 1; nomorBaris++) {
    const alamat = `B${nomorBaris}`;
    const sel = worksheet[alamat];

    if (sel) {
      sel.t = "s";
      sel.v = String(sel.v ?? "");
      delete sel.w;
    }
  }

  // Atur lebar kolom agar isi mudah dibaca.
  worksheet["!cols"] = [
    { wch: 28 },
    { wch: 22 },
    { wch: 20 },
    { wch: 22 },
    { wch: 22 },
    { wch: 35 },
    { wch: 25 },
  ];

  worksheet["!autofilter"] = {
    ref: XLSX.utils.encode_range({
      s: { r: 0, c: 0 },
      e: { r: baris.length, c: header.length - 1 },
    }),
  };

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Rekap Dinas Cuti");

  XLSX.writeFile(workbook, "rekap-dinas-dan-cuti.xlsx");
}


  return (
    <main className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Rekap Dinas & Cuti
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Rekap pengajuan pegawai Bapas Kelas I Jakarta Barat.
          </p>
        </div>

        <a
          href="/pengajuan-kepegawaian"
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          ← Kembali ke Pengajuan
        </a>
      </div>

      {pesan && (
        <div
          role="alert"
          className={`rounded-lg border p-4 text-sm ${
            aksesDitolak
              ? "border-red-200 bg-red-50 text-red-800"
              : "border-amber-200 bg-amber-50 text-amber-800"
          }`}
        >
          {pesan}
          {aksesDitolak && (
            <p className="mt-2">
              Halaman ini khusus untuk role Pengelola Kepegawaian.
            </p>
          )}
        </div>
      )}

      {!aksesDitolak && (
        <>
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <p className="text-sm text-gray-500">Total pengajuan dimuat</p>
              <p className="mt-2 text-3xl font-bold text-gray-800">
                {data.length}
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <p className="text-sm text-gray-500">Hasil setelah filter</p>
              <p className="mt-2 text-3xl font-bold text-gray-800">
                {dataFilter.length}
              </p>
            </div>
          </section>

          <section className="space-y-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <h2 className="font-semibold text-gray-800">Pencarian dan Filter</h2>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              <input
                type="search"
                value={kataKunci}
                onChange={(event) => setKataKunci(event.target.value)}
                placeholder="Cari nama atau NIP..."
                className="rounded-lg border border-gray-300 p-3 text-sm"
              />

              <select
                value={jenis}
                onChange={(event) => setJenis(event.target.value)}
                className="rounded-lg border border-gray-300 p-3 text-sm"
              >
                <option value="SEMUA">Semua jenis pengajuan</option>
                <option value="DINAS_LUAR">Dinas Luar</option>
                <option value="LEPAS_PIKET">Lepas Piket</option>
                <option value="IZIN">Izin</option>
                <option value="CUTI">Cuti</option>
              </select>

              <div>
                <label className="mb-1 block text-xs text-gray-600">
                  Tanggal mulai dari
                </label>
                <input
                  type="date"
                  value={tanggalDari}
                  onChange={(event) => setTanggalDari(event.target.value)}
                  className="w-full rounded-lg border border-gray-300 p-3 text-sm"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs text-gray-600">
                  Tanggal mulai sampai
                </label>
                <input
                  type="date"
                  value={tanggalSampai}
                  min={tanggalDari || undefined}
                  onChange={(event) => setTanggalSampai(event.target.value)}
                  className="w-full rounded-lg border border-gray-300 p-3 text-sm"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void muatData()}
                disabled={memuat}
                className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50"
              >
                {memuat ? "Memuat..." : "Muat Ulang"}
              </button>
             <button
  type="button"
  onClick={eksporExcel}
  disabled={memuat || dataFilter.length === 0}
  className="rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800 disabled:opacity-50"
>
  Ekspor Excel (.xlsx)
</button>
              <button
                type="button"
                onClick={() => window.print()}
                disabled={memuat || dataFilter.length === 0}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cetak Rekap
              </button>
            </div>
          </section>

          <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] table-fixed border-collapse text-left text-sm">
               <thead className="bg-gray-100 text-gray-700">
  <tr>
    <th className="w-12 border-b p-3">No.</th>
    <th className="w-56 border-b p-3">Nama Pegawai / NIP</th>
    <th className="w-32 border-b p-3">Jenis</th>
    <th className="w-36 border-b p-3">Tanggal Mulai</th>
    <th className="w-36 border-b p-3">Tanggal Selesai</th>
    <th className="w-56 border-b p-3">Keterangan</th>
    <th className="w-44 border-b p-3">Tanggal Pengajuan</th>
  </tr>
</thead>
                <tbody>
                  {memuat ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-gray-500">
                        Memuat data pengajuan...
                      </td>
                    </tr>
                  ) : dataFilter.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-gray-500">
                        Tidak ada data yang sesuai dengan filter.
                      </td>
                    </tr>
                  ) : (
                    dataFilter.map((item, index) => (
                      <tr key={item.id} className="align-top hover:bg-gray-50">
                        <td className="border-b p-3">{index + 1}</td>
                        <td className="border-b p-3">
                          <div className="font-medium text-gray-800">
                            {item.nama_pegawai}
                          </div>
                          <div className="mt-1 text-xs text-gray-500">
                            {item.nip || "-"}
                          </div>
                        </td>
                        <td className="border-b p-3">
                          {labelJenis[item.jenis_pengajuan] ??
                            item.jenis_pengajuan}
                        </td>
                        <td className="border-b p-3">
                          {formatTanggal(item.tanggal_mulai)}
                        </td>
                        <td className="border-b p-3">
                          {formatTanggal(item.tanggal_selesai)}
                        </td>
                        <td className="max-w-xs whitespace-pre-wrap border-b p-3">
                          {item.keterangan}
                        </td>
                        <td className="border-b p-3">
                          {formatWaktu(item.dibuat_pada)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <p className="border-t p-3 text-xs text-gray-500">
              Data yang ditampilkan mengikuti hasil API rekap. API saat ini
              membatasi hasil hingga 1.000 pengajuan terbaru.
            </p>
          </section>
        </>
      )}

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          main,
          main * {
            visibility: visible;
          }
          main {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            max-width: none;
            padding: 0;
          }
          button,
          input,
          select,
          a {
            display: none !important;
          }
          section {
            break-inside: avoid;
          }
          table {
            font-size: 10px !important;
          }
        }
      `}</style>
    </main>
  );
}
