"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Wrench } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function DetailPemeliharaanPage() {
  const params = useParams();
  const id = params.id;

  const [data, setData] = useState<any>(null);
  const [barang, setBarang] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadDetail();
    }
  }, [id]);

  async function loadDetail() {
    setLoading(true);

    const { data: pemeliharaan, error } = await supabase
      .from("pemeliharaan_bmn")
      .select("*")
      .eq("id", Number(id))
      .maybeSingle();

    if (error) {
      console.error(
        "ERROR DETAIL PEMELIHARAAN:",
        error.message
      );
      setLoading(false);
      return;
    }

    if (!pemeliharaan) {
      setLoading(false);
      return;
    }

    setData(pemeliharaan);

    const { data: barangData, error: barangError } =
      await supabase
        .from("barang")
        .select(
          "id, kode_barang, nama_barang, nup, ruangan, kondisi"
        )
        .eq("id", pemeliharaan.barang_id)
        .maybeSingle();

    if (barangError) {
      console.error(
        "ERROR DETAIL BARANG:",
        barangError.message
      );
    } else {
      setBarang(barangData);
    }

    setLoading(false);
  }

  function formatTanggal(tanggal: string) {
    if (!tanggal) return "-";

    return new Date(
      `${tanggal}T00:00:00`
    ).toLocaleDateString("id-ID");
  }

  function formatRupiah(nilai: number) {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(Number(nilai || 0));
  }

  if (loading) {
    return (
      <main className="p-6">
        <div className="bg-white rounded-3xl shadow-lg p-10 text-center text-slate-500">
          Memuat detail pemeliharaan...
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="p-6">
        <div className="bg-white rounded-3xl shadow-lg p-10 text-center">

          <p className="text-slate-500 mb-4">
            Data pemeliharaan tidak ditemukan.
          </p>

          <Link
            href="/simstok/pemeliharaan/riwayat"
            className="inline-flex items-center gap-2 bg-slate-200 px-5 py-3 rounded-xl"
          >
            <ArrowLeft size={18} />
            Kembali
          </Link>

        </div>
      </main>
    );
  }

  return (
    <main>

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">

        <div>
          <h1 className="text-4xl font-bold text-blue-900">
            Detail Pemeliharaan BMN
          </h1>

          <p className="text-slate-500 mt-2">
            Informasi lengkap pemeliharaan Barang Milik Negara
          </p>
        </div>

        <Link
          href="/simstok/pemeliharaan/riwayat"
          className="flex items-center justify-center gap-2 bg-slate-200 hover:bg-slate-300 px-5 py-3 rounded-xl"
        >
          <ArrowLeft size={18} />
          Kembali
        </Link>

      </div>

      {/* DATA BARANG */}
      <div className="bg-white rounded-3xl shadow-lg p-6 mb-6">

        <div className="flex items-center gap-3 mb-6">

          <div className="bg-orange-100 text-orange-600 p-3 rounded-xl">
            <Wrench size={24} />
          </div>

          <div>
            <p className="text-sm text-slate-500">
              Barang Milik Negara
            </p>

            <h2 className="text-2xl font-bold text-blue-900">
              {barang?.nama_barang || "-"}
            </h2>
          </div>

        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          <Info
            label="Kode Barang"
            value={barang?.kode_barang}
          />

          <Info
            label="NUP"
            value={barang?.nup}
          />

          <Info
            label="Ruangan"
            value={barang?.ruangan}
          />

          <Info
            label="Kondisi"
            value={barang?.kondisi}
          />

          <Info
            label="ID Pemeliharaan"
            value={data.id}
          />

          <Info
            label="Tanggal Mulai"
            value={formatTanggal(data.tanggal_mulai)}
          />

        </div>

      </div>

      {/* DETAIL PEMELIHARAAN */}
      <div className="bg-white rounded-3xl shadow-lg p-6">

        <h2 className="text-xl font-bold text-slate-800 mb-6">
          Informasi Pemeliharaan
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

          <Info
            label="Jenis Pemeliharaan"
            value={data.jenis_pemeliharaan}
          />

          <Info
            label="Vendor / Teknisi"
            value={data.vendor}
          />

          <Info
            label="Biaya Pemeliharaan"
            value={formatRupiah(data.biaya)}
          />

          <Info
            label="Status"
            value={data.status}
          />

          <Info
            label="Tanggal Mulai"
            value={formatTanggal(data.tanggal_mulai)}
          />

          <Info
            label="Tanggal Selesai"
            value={
              data.tanggal_selesai
                ? formatTanggal(data.tanggal_selesai)
                : "-"
            }
          />

        </div>

        <div className="mt-5">

          <p className="text-sm text-slate-500 mb-2">
            Keterangan
          </p>

          <div className="bg-slate-50 rounded-xl p-4 text-slate-700">
            {data.keterangan || "-"}
          </div>

        </div>

      </div>

    </main>
  );
}

function Info({
  label,
  value,
}: {
  label: string;
  value: any;
}) {
  return (
    <div className="border border-slate-200 rounded-xl p-4">

      <p className="text-sm text-slate-500">
        {label}
      </p>

      <p className="font-bold text-slate-800 mt-2">
        {value || "-"}
      </p>

    </div>
  );
}