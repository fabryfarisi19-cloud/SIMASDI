
"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

import { supabase } from "@/lib/supabase";

import {
  Wallet,
  TrendingUp,
  TrendingDown,
  CalendarDays,
  User,
  RefreshCw,
  Printer,
} from "lucide-react";

type Gaji = {
  id: number;
  pengguna_id: number;
  bulan: number;
  tahun: number;

  gaji_pokok: number;

  tunjangan_keluarga: number;
  tunjangan_jabatan: number;
  tunjangan_lainnya: number;

  potongan_pajak: number;
  potongan_bpjs: number;
  potongan_pensiun: number;
  potongan_koperasi: number;
  potongan_arisan_dw: number;
  potongan_lainnya: number;

  total_pendapatan: number;
  total_potongan: number;
  gaji_bersih: number;

  keterangan: string | null;

  // Field tambahan slip gaji baru
  tunjangan_istri_suami?: number;
  tunjangan_anak?: number;
  tunjangan_umum?: number;
  tunjangan_papua?: number;
  tunjangan_terpencil?: number;
  tunjangan_struktural?: number;
  tunjangan_fungsional?: number;
  lain_lain?: number;
  pembulatan?: number;
  tunjangan_beras?: number;
  tunjangan_pajak?: number;

  pada_aplikasi_gaji?: number;
  pot_beras?: number;
  iwp?: number;
  sewa_rumah?: number;
  tunggakan?: number;
  utang_lebih?: number;
  taperum?: number;

  // Potongan BAPAS
  iuran_dansos?: number;
  iuran_dw?: number;
  koperasi?: number;
  ipkemindo?: number;
  bri?: number;
  bjb?: number;
  bapor?: number;
  arisan_bapas?: number;
  perpisahan_aziz?: number;
  anak_asuh?: number;
  iuran_dw_pipas?: number;
  arisan_pipas?: number;
  inkopasnido?: number;
  jahit_baju_pipas_1?: number;
  kacamata_ke_2?: number;
};

type UserData = {
  id: number;
  nama?: string;
  username?: string;
  golongan?: string;
  pangkat_golongan?: string;
  jabatan?: string;
};

const namaBulan = [
  "",
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

function angka(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function rupiah(value: unknown) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(angka(value));
}

function formatAngka(value: unknown) {
  return new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(angka(value));
}
function PrintRow({
  label,
  value,
}: {
  label: string;
  value?: number | null;
}) {
  return (
    <div className="print-row">
      <span>{label}</span>
      <strong>{formatAngka(value)}</strong>
    </div>
  );
}
export default function RincianGajiPage() {
  const { data: session, status: sessionStatus } = useSession();
  const [gaji, setGaji] = useState<Gaji | null>(null);
  const [riwayat, setRiwayat] = useState<Gaji[]>([]);
  const [nama, setNama] = useState("");
  const [golongan, setGolongan] = useState("");
  const [jabatan, setJabatan] = useState("");
  const [jumlahPegawai, setJumlahPegawai] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
const tanggalCetak = new Date().toLocaleDateString("id-ID", {
  day: "2-digit",
  month: "long",
  year: "numeric",
});
  async function loadData() {
    try {
      setLoading(true);
      setError("");
if (sessionStatus === "loading") {
  return;
}

if (sessionStatus !== "authenticated" || !session?.penggunaId) {
  setError("Sesi pengguna tidak ditemukan. Silakan login kembali.");
  return;
}

const penggunaId = Number(session.penggunaId);

if (!penggunaId) {
  setError("ID pengguna tidak ditemukan.");
  return;
}
setNama(session.user?.name || "");

      // Ambil jumlah pegawai
      const { count, error: countError } = await supabase
        .from("pengguna")
        .select("id", { count: "exact", head: true });

      if (!countError) {
        setJumlahPegawai(count || 0);
      }

      // Ambil rincian gaji
     // Ambil rincian gaji melalui API server
const response = await fetch("/api/rincian-gaji", {
  method: "GET",
  cache: "no-store",
});

const result = await response.json();

if (!response.ok) {
  console.error(result);
  setError(result.error || "Gagal mengambil data rincian gaji.");
  return;
}

const dataGaji = (result.data || []) as Gaji[];

      setRiwayat(dataGaji);
      setGaji(dataGaji.length > 0 ? dataGaji[0] : null);
    } catch (err) {
      console.error(err);
      setError("Terjadi kesalahan saat mengambil data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

function cetakSlip(e?: React.MouseEvent<HTMLButtonElement>) {
  e?.preventDefault();
  e?.stopPropagation();

  setTimeout(() => {
    window.print();
  }, 100);
}

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-600">
          <RefreshCw className="animate-spin" size={22} />
          Memuat rincian gaji...
        </div>
      </div>
    );
  }

  const periode =
    gaji
      ? `${namaBulan[gaji.bulan] || ""} ${gaji.tahun}`
      : "";

  const penghasilanBersih = angka(gaji?.gaji_bersih);

  const potonganBapas =
    angka(gaji?.iuran_dansos) +
    angka(gaji?.iuran_dw) +
    angka(gaji?.koperasi) +
    angka(gaji?.ipkemindo) +
    angka(gaji?.bri) +
    angka(gaji?.bjb) +
    angka(gaji?.bapor) +
    angka(gaji?.arisan_bapas) +
    angka(gaji?.perpisahan_aziz) +
    angka(gaji?.anak_asuh) +
    angka(gaji?.iuran_dw_pipas) +
    angka(gaji?.arisan_pipas) +
    angka(gaji?.inkopasnido) +
    angka(gaji?.jahit_baju_pipas_1) +
    angka(gaji?.kacamata_ke_2);

  const sisaGaji = penghasilanBersih - potonganBapas;

  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-8 print:bg-white print:p-0">
      <div className="mx-auto max-w-6xl print:max-w-none">

        {/* =========================
            TAMPILAN WEB
        ========================== */}
        <div className="screen-only">

          {/* HEADER */}
          <div className="mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

              <div>
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-blue-100 p-3 text-blue-700">
                    <Wallet size={28} />
                  </div>

                  <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
                      Rincian Gaji Saya
                    </h1>

                    <p className="text-slate-500 mt-1">
                      Informasi penghasilan dan potongan gaji pegawai
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">

                <button
                  onClick={loadData}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-white border border-slate-200 px-4 py-3 font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                >
                  <RefreshCw size={18} />
                  Refresh
                </button>

                {gaji && (
                  <button
  type="button"
  onClick={cetakSlip}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-3 font-semibold text-white shadow-sm hover:bg-blue-800"
                  >
                    <Printer size={18} />
                    Cetak Slip Gaji
                  </button>
                )}

              </div>

            </div>
          </div>

          {/* USER */}
          <div className="mb-6 rounded-2xl bg-white border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-blue-100 p-3 text-blue-700">
                <User size={24} />
              </div>

              <div>
                <p className="text-sm text-slate-500">
                  Pegawai
                </p>

                <p className="text-lg font-bold text-slate-900">
                  {nama || "Pegawai"}
                </p>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
              {error}
            </div>
          )}

          {!error && !gaji && (
            <div className="rounded-2xl bg-white border border-slate-200 p-10 text-center shadow-sm">
              <Wallet
                size={48}
                className="mx-auto mb-4 text-slate-300"
              />

              <h2 className="text-xl font-bold text-slate-800">
                Data gaji belum tersedia
              </h2>

              <p className="mt-2 text-slate-500">
                Belum ada rincian gaji yang terhubung dengan akun Anda.
              </p>
            </div>
          )}

          {gaji && (
            <>
              {/* PERIODE */}
              <div className="mb-6 flex items-center gap-2 text-slate-600">
                <CalendarDays size={20} />

                <span>
                  Periode gaji:
                  <strong className="ml-1 text-slate-900">
                    {periode}
                  </strong>
                </span>
              </div>

              {/* RINGKASAN */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">

                <SummaryCard
                  icon={<TrendingUp size={22} />}
                  title="Total Pendapatan"
                  value={gaji.total_pendapatan}
                  color="green"
                />

                <SummaryCard
                  icon={<TrendingDown size={22} />}
                  title="Total Potongan"
                  value={gaji.total_potongan}
                  color="red"
                />

                <div className="rounded-2xl bg-blue-700 p-6 shadow-lg text-white">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="rounded-xl bg-white/20 p-3">
                      <Wallet size={22} />
                    </div>

                    <span className="font-semibold">
                      Gaji Bersih
                    </span>
                  </div>

                  <p className="text-2xl font-bold">
                    {rupiah(gaji.gaji_bersih)}
                  </p>
                </div>

              </div>

              {/* DETAIL LAMA */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                <section className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">

                  <div className="border-b border-slate-200 px-6 py-5">
                    <h2 className="text-lg font-bold text-slate-900">
                      Pendapatan
                    </h2>
                  </div>

                  <div className="p-6 space-y-4">

                    <Row label="Gaji Pokok" value={gaji.gaji_pokok} />

                    <Row
                      label="Tunjangan Keluarga"
                      value={gaji.tunjangan_keluarga}
                    />

                    <Row
                      label="Tunjangan Jabatan"
                      value={gaji.tunjangan_jabatan}
                    />

                    <Row
                      label="Tunjangan Lainnya"
                      value={gaji.tunjangan_lainnya}
                    />

                    <div className="border-t border-slate-200 pt-4">
                      <Row
                        label="Total Pendapatan"
                        value={gaji.total_pendapatan}
                        bold
                      />
                    </div>

                  </div>
                </section>

                <section className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">

                  <div className="border-b border-slate-200 px-6 py-5">
                    <h2 className="text-lg font-bold text-slate-900">
                      Potongan
                    </h2>
                  </div>

                  <div className="p-6 space-y-4">

                    <Row
                      label="Pajak"
                      value={gaji.potongan_pajak}
                    />

                    <Row
                      label="BPJS"
                      value={gaji.potongan_bpjs}
                    />

                    <Row
                      label="Pensiun"
                      value={gaji.potongan_pensiun}
                    />

                    <Row
                      label="Koperasi"
                      value={gaji.potongan_koperasi}
                    />

                    <Row
                      label="Arisan DW"
                      value={gaji.potongan_arisan_dw}
                    />

                    <Row
                      label="Potongan Lainnya"
                      value={gaji.potongan_lainnya}
                    />

                    <div className="border-t border-slate-200 pt-4">
                      <Row
                        label="Total Potongan"
                        value={gaji.total_potongan}
                        bold
                      />
                    </div>

                  </div>
                </section>

              </div>

              {/* KETERANGAN */}
              {gaji.keterangan && (
                <div className="mt-6 rounded-2xl bg-blue-50 border border-blue-100 p-5">
                  <p className="text-sm font-semibold text-blue-900 mb-1">
                    Keterangan
                  </p>

                  <p className="text-blue-800">
                    {gaji.keterangan}
                  </p>
                </div>
              )}

              {/* RIWAYAT */}
              <section className="mt-8 rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">

                <div className="border-b border-slate-200 px-6 py-5">
                  <h2 className="text-lg font-bold text-slate-900">
                    Riwayat Gaji
                  </h2>

                  <p className="text-sm text-slate-500 mt-1">
                    Riwayat rincian gaji Anda
                  </p>
                </div>

                <div className="overflow-x-auto">

                  <table className="w-full text-sm">

                    <thead className="bg-slate-50">
                      <tr>
                        <th className="text-left px-6 py-4 font-semibold text-slate-600">
                          Periode
                        </th>

                        <th className="text-right px-6 py-4 font-semibold text-slate-600">
                          Pendapatan
                        </th>

                        <th className="text-right px-6 py-4 font-semibold text-slate-600">
                          Potongan
                        </th>

                        <th className="text-right px-6 py-4 font-semibold text-slate-600">
                          Gaji Bersih
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {riwayat.map((item) => (
                        <tr
                          key={item.id}
                          className="border-t border-slate-100 hover:bg-slate-50"
                        >
                          <td className="px-6 py-4 font-semibold text-slate-800">
                            {namaBulan[item.bulan]} {item.tahun}
                          </td>

                          <td className="px-6 py-4 text-right text-green-700">
                            {rupiah(item.total_pendapatan)}
                          </td>

                          <td className="px-6 py-4 text-right text-red-700">
                            {rupiah(item.total_potongan)}
                          </td>

                          <td className="px-6 py-4 text-right font-bold text-blue-700">
                            {rupiah(item.gaji_bersih)}
                          </td>
                        </tr>
                      ))}
                    </tbody>

                  </table>

                </div>
              </section>
            </>
          )}
        </div>


       <div className="print-only">
  <div className="slip-header">
  <div className="slip-title">
  SLIP GAJI BULAN {namaBulan[gaji?.bulan || 0]?.toUpperCase()} {gaji?.tahun}
</div>
    <div className="slip-subtitle">BAPAS KELAS I JAKARTA BARAT</div>
  </div>

  <div className="identitas-slip">
    <div>
      <span>Jumlah Pegawai</span>
      <b>: {jumlahPegawai}</b>
    </div>
    <div>
      <span>Nama Pegawai</span>
      <b>: {nama || "-"}</b>
    </div>
    <div>
      <span>Golongan</span>
      <b>: {golongan || "-"}</b>
    </div>
    <div>
      <span>Jabatan</span>
      <b>: {jabatan || "-"}</b>
    </div>
  </div>

  <div className="slip-columns">

    {/* ================= PENGHASILAN ================= */}
    <div className="slip-box">
      <div className="slip-box-title">PENGHASILAN</div>

      <PrintRow label="Gaji Pokok" value={gaji?.gaji_pokok} />
      <PrintRow
        label="T. Istri/Suami"
        value={gaji?.tunjangan_istri_suami ?? gaji?.tunjangan_keluarga}
      />
      <PrintRow label="T. Anak" value={gaji?.tunjangan_anak} />
      <PrintRow label="T. Umum" value={gaji?.tunjangan_umum} />
      <PrintRow label="T. Papua" value={gaji?.tunjangan_papua} />
      <PrintRow label="T. Terpencil" value={gaji?.tunjangan_terpencil} />
      <PrintRow
        label="T. Struktural"
        value={gaji?.tunjangan_struktural ?? gaji?.tunjangan_jabatan}
      />
      <PrintRow label="T. Fungsional" value={gaji?.tunjangan_fungsional} />
      <PrintRow
        label="Lain-Lain"
        value={gaji?.lain_lain ?? gaji?.tunjangan_lainnya}
      />
      <PrintRow label="Pembulatan" value={gaji?.pembulatan} />
      <PrintRow label="T. Beras" value={gaji?.tunjangan_beras} />
      <PrintRow
        label="T. Pajak"
        value={gaji?.tunjangan_pajak ?? gaji?.potongan_pajak}
      />

      <div className="print-total">
        <span>Jml Penghasilan</span>
        <strong>{rupiah(gaji?.total_pendapatan)}</strong>
      </div>
    </div>

    {/* ================= POTONGAN ================= */}
    <div className="slip-box">
      <div className="slip-box-title">POTONGAN</div>

      <PrintRow label="Pada Aplikasi Gaji" value={gaji?.pada_aplikasi_gaji} />
      <PrintRow label="Pot. Beras" value={gaji?.pot_beras} />
      <PrintRow
        label="IWP"
        value={gaji?.iwp ?? gaji?.potongan_pensiun}
      />
      <PrintRow label="BPJS" value={gaji?.potongan_bpjs} />
      <PrintRow label="Pot. PPh" value={gaji?.potongan_pajak} />
      <PrintRow label="Sewa Rumah" value={gaji?.sewa_rumah} />
      <PrintRow label="Tunggakan" value={gaji?.tunggakan} />
      <PrintRow label="Utang Lebih" value={gaji?.utang_lebih} />
      <PrintRow label="Potongan Lain" value={gaji?.potongan_lainnya} />
      <PrintRow label="Taperum" value={gaji?.taperum} />

      <div className="print-total">
        <span>Jml Potongan</span>
        <strong>{rupiah(gaji?.total_potongan)}</strong>
      </div>
    </div>

  </div>

  {/* ================= PENGHASILAN BERSIH ================= */}
  <div className="bersih-box">
    <span>PENGHASILAN BERSIH</span>
    <strong>{rupiah(penghasilanBersih)}</strong>
  </div>

  {/* ================= POTONGAN BAPAS ================= */}
  <div className="bapas-section">
    <div className="bapas-title">POTONGAN BAPAS</div>

    <div className="bapas-grid">

      <div className="bapas-column">
        <PrintRow label="IURAN DANSOS" value={gaji?.iuran_dansos} />
        <PrintRow label="IURAN DW" value={gaji?.iuran_dw} />
        <PrintRow
          label="KOPERASI"
          value={gaji?.koperasi ?? gaji?.potongan_koperasi}
        />
        <PrintRow label="IPKEMINDO" value={gaji?.ipkemindo} />
        <PrintRow label="BRI" value={gaji?.bri} />
        <PrintRow label="BJB" value={gaji?.bjb} />
        <PrintRow label="BAPOR" value={gaji?.bapor} />
        <PrintRow label="ARISAN BAPAS" value={gaji?.arisan_bapas} />
      </div>

      <div className="bapas-column">
        <PrintRow label="PERPISAHAN AZIZ" value={gaji?.perpisahan_aziz} />
        <PrintRow label="ANAK ASUH" value={gaji?.anak_asuh} />
        <PrintRow label="IURAN DW PIPAS" value={gaji?.iuran_dw_pipas} />
        <PrintRow label="ARISAN PIPAS" value={gaji?.arisan_pipas} />
        <PrintRow label="INKOPASNIDO" value={gaji?.inkopasnido} />
        <PrintRow label="JAHIT BAJU PIPAS 1" value={gaji?.jahit_baju_pipas_1} />
        <PrintRow label="KACAMATA KE 2" value={gaji?.kacamata_ke_2} />

        <div className="print-total">
          <span>Jml Potongan</span>
          <strong>{rupiah(potonganBapas)}</strong>
        </div>
      </div>

    </div>
  </div>

  {/* ================= SISA GAJI ================= */}
  <div className="sisa-box">
    <div>SISA GAJI (GAJI YANG DITERIMA)</div>
    <strong>{rupiah(sisaGaji)}</strong>
  </div>

  <div className="tanggal-slip">
    Jakarta Barat, {tanggalCetak}
  </div>

  <div className="ttd-slip">
    <div>
      Mengetahui,<br />
      Pejabat Penanggung Jawab
      <br /><br /><br /><br />
      <b>____________________________</b>
    </div>

    <div>
      Pegawai yang Bersangkutan
      <br /><br /><br /><br /><br />
      <b>{nama || "-"}</b>
    </div>
  </div>
</div>


  </div>

     {/* PRINT STYLE */}
<style jsx global>{`

  .print-only {
    display: none;
  }

  @media print {

    @page {
      size: A4 portrait;
      margin: 10mm;
    }

    html,
    body {
      background: #fff !important;
      margin: 0 !important;
      padding: 0 !important;
    }

    /* Sembunyikan tampilan web */
    .screen-only {
      display: none !important;
    }

    /* Tampilkan slip */
    .print-only {
      display: block !important;
      width: 100% !important;
      font-family: Arial, Helvetica, sans-serif;
      color: #000 !important;
      font-size: 10px;
    }

    .print-only * {
      color: #000 !important;
      box-sizing: border-box;
    }

    /* =========================
       HEADER
    ========================== */

    .slip-header {
      border: 1px solid #000;
      padding: 8px;
      margin-bottom: 8px;
      text-align: center;
    }

    .slip-title {
      font-size: 16px;
      font-weight: 700;
      margin-bottom: 4px;
    }

    .slip-subtitle {
      font-size: 11px;
      font-weight: 700;
    }

    /* =========================
       IDENTITAS
    ========================== */

    .identitas-slip {
      border: 1px solid #000;
      margin-bottom: 8px;
      padding: 6px 8px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      column-gap: 20px;
      row-gap: 3px;
    }

    .identitas-slip > div {
      display: grid;
      grid-template-columns: 105px 1fr;
      font-size: 10px;
    }

    .identitas-slip span {
      font-weight: 600;
    }

    .identitas-slip b {
      font-weight: 700;
    }

    /* =========================
       DUA KOLOM
    ========================== */

    .slip-columns {
      display: grid !important;
      grid-template-columns: 1fr 1fr !important;
      gap: 8px !important;
      align-items: start;
    }

    .slip-box {
      border: 1px solid #000;
      width: 100%;
    }

    .slip-box-title {
      text-align: center;
      font-weight: 700;
      font-size: 12px;
      padding: 6px;
      border-bottom: 1px solid #000;
      background: #f3f3f3 !important;
    }

    /* =========================
       BARIS
    ========================== */

    .print-row {
      display: grid;
      grid-template-columns: 1fr 105px;
      min-height: 20px;
      border-bottom: 1px solid #ddd;
    }

    .print-row span {
      padding: 3px 6px;
    }

    .print-row strong {
      padding: 3px 6px;
      text-align: right;
      white-space: nowrap;
      font-weight: 600;
    }

    .print-row:last-child {
      border-bottom: none;
    }

    /* =========================
       TOTAL
    ========================== */

    .print-total {
      display: grid;
      grid-template-columns: 1fr 105px;
      border-top: 1px solid #000;
      padding: 5px 6px;
      font-weight: 700;
      background: #f3f3f3 !important;
    }

    .print-total strong {
      text-align: right;
      white-space: nowrap;
    }

    /* =========================
       PENGHASILAN BERSIH
    ========================== */

    .bersih-box {
      border: 1px solid #000;
      margin-top: 8px;
      padding: 7px 10px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-weight: 700;
    }

    .bersih-box span {
      font-size: 12px;
    }

    .bersih-box strong {
      font-size: 14px;
    }

    /* =========================
       POTONGAN BAPAS
    ========================== */

    .bapas-section {
      border: 1px solid #000;
      margin-top: 8px;
    }

    .bapas-title {
      text-align: center;
      font-weight: 700;
      font-size: 12px;
      padding: 6px;
      border-bottom: 1px solid #000;
      background: #f3f3f3 !important;
    }

    .bapas-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      column-gap: 20px;
    }

    .bapas-column {
      width: 100%;
    }

    .bapas-column .print-row {
      grid-template-columns: 1fr 90px;
    }

    /* =========================
       SISA GAJI
    ========================== */

    .sisa-box {
      border: 2px solid #000;
      margin-top: 10px;
      padding: 10px;
      text-align: center;
      font-weight: 700;
    }

    .sisa-box div {
      font-size: 13px;
      margin-bottom: 5px;
    }

    .sisa-box strong {
      font-size: 18px;
    }

    /* =========================
       TANGGAL & TTD
    ========================== */

    .tanggal-slip {
      margin-top: 12px;
      text-align: right;
      font-size: 10px;
    }

    .ttd-slip {
      display: grid;
      grid-template-columns: 1fr 1fr;
      margin-top: 10px;
      text-align: center;
      font-size: 10px;
    }

    .ttd-slip > div {
      min-height: 100px;
    }

    /* Hindari pemotongan slip */
    .slip-header,
    .identitas-slip,
    .slip-columns,
    .bersih-box,
    .bapas-section,
    .sisa-box,
    .ttd-slip {
      break-inside: avoid;
      page-break-inside: avoid;
    }

  }

`}</style>
    </main>
  );
}


/* =========================================
   COMPONENT
========================================= */

function SummaryCard({
  icon,
  title,
  value,
  color,
}: {
  icon: React.ReactNode;
  title: string;
  value: number;
  color: "green" | "red";
}) {
  const classes =
    color === "green"
      ? "bg-green-100 text-green-700"
      : "bg-red-100 text-red-700";

  const valueClass =
    color === "green"
      ? "text-green-700"
      : "text-red-700";

  return (
    <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm">

      <div className="flex items-center gap-3 mb-4">

        <div className={`rounded-xl p-3 ${classes}`}>
          {icon}
        </div>

        <span className="font-semibold text-slate-600">
          {title}
        </span>

      </div>

      <p className={`text-2xl font-bold ${valueClass}`}>
        {rupiah(value)}
      </p>

    </div>
  );
}


function Row({
  label,
  value,
  bold = false,
}: {
  label: string;
  value: number;
  bold?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">

      <span
        className={
          bold
            ? "font-bold text-slate-900"
            : "text-slate-600"
        }
      >
        {label}
      </span>

      <span
        className={
          bold
            ? "font-bold text-slate-900"
            : "font-medium text-slate-800"
        }
      >
        {rupiah(value)}
      </span>

    </div>
  );
}


function SlipRow({
  label,
  value,
}: {
  label: string;
  value?: number;
}) {
  return (
    <div className="slip-row">

      <span className="slip-row-label">
        {label}
      </span>

      <span className="slip-row-value">
        {formatAngka(value)}
      </span>

    </div>
  );
}


function SlipTotal({
  label,
  value,
}: {
  label: string;
  value?: number;
}) {
  return (
    <div className="slip-total">

      <span>
        {label}
      </span>

      <span className="slip-total-value">
        {formatAngka(value)}
      </span>

    </div>
  );
}

