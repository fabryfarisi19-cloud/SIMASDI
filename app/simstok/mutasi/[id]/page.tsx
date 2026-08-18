"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  ArrowLeft,
  ArrowRightLeft,
  Package,
  MapPin,
  Calendar,
  FileText,
} from "lucide-react";

export default function DetailMutasiPage() {
  const params = useParams();
  const router = useRouter();

  const [mutasi, setMutasi] = useState<any>(null);
  const [barang, setBarang] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params?.id) {
      loadData();
    }
  }, [params?.id]);

  async function loadData() {
    setLoading(true);

    const { data: mutasiData, error: mutasiError } =
      await supabase
        .from("mutasi_bmn")
        .select("*")
        .eq("id", Number(params.id))
        .maybeSingle();

    if (mutasiError) {
      console.error(
        "ERROR MUTASI:",
        mutasiError.message
      );
      setLoading(false);
      return;
    }

    if (!mutasiData) {
      setLoading(false);
      return;
    }

    setMutasi(mutasiData);

    const { data: barangData, error: barangError } =
      await supabase
        .from("barang")
        .select("*")
        .eq("id", Number(mutasiData.barang_id))
        .maybeSingle();

    if (barangError) {
      console.error(
        "ERROR BARANG:",
        barangError.message
      );
    }

    setBarang(barangData);
    setLoading(false);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow p-8">
          Memuat detail mutasi...
        </div>
      </main>
    );
  }

  if (!mutasi) {
    return (
      <main className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow p-8 text-center">
          <h1 className="text-xl font-bold mb-4">
            Data Mutasi Tidak Ditemukan
          </h1>

          <button
            onClick={() => router.back()}
            className="bg-slate-700 text-white px-5 py-3 rounded-xl"
          >
            Kembali
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 p-4 md:p-8">

      <div className="max-w-5xl mx-auto">

        {/* HEADER */}

        <div className="flex justify-between items-center mb-6">

          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 bg-white hover:bg-slate-50 border px-5 py-3 rounded-xl"
          >
            <ArrowLeft size={18} />
            Kembali
          </button>

        </div>

        {/* JUDUL */}

        <div className="bg-white rounded-3xl shadow-sm p-6 mb-6">

          <div className="flex items-center gap-4">

            <div className="bg-purple-600 text-white p-4 rounded-2xl">
              <ArrowRightLeft size={28} />
            </div>

            <div>

              <h1 className="text-2xl md:text-3xl font-bold text-slate-800">
                Detail Mutasi BMN
              </h1>

              <p className="text-gray-500">
                Riwayat perpindahan Barang Milik Negara
              </p>

            </div>

          </div>

        </div>

        {/* INFORMASI BARANG */}

        <div className="bg-white rounded-3xl shadow-sm p-6 mb-6">

          <h2 className="text-xl font-bold text-slate-800 mb-6">
            Informasi Barang
          </h2>

          <div className="grid md:grid-cols-2 gap-6">

            <Info
              label="Kode Barang"
              value={barang?.kode_barang}
            />

            <Info
              label="NUP"
              value={barang?.nup}
            />

            <Info
              label="Nama Barang"
              value={barang?.nama_barang}
            />

            <Info
              label="Kondisi"
              value={barang?.kondisi}
            />

            <Info
              label="Jumlah"
              value={barang?.jumlah}
            />

            <Info
              label="ID BMN"
              value={mutasi.barang_id}
            />

          </div>

        </div>

        {/* INFORMASI MUTASI */}

        <div className="bg-white rounded-3xl shadow-sm p-6">

          <h2 className="text-xl font-bold text-slate-800 mb-6">
            Informasi Mutasi
          </h2>

          <div className="grid md:grid-cols-2 gap-6">

            <div>

              <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                <MapPin size={17} />
                Ruangan Asal
              </div>

              <div className="bg-slate-100 rounded-xl px-4 py-3 font-semibold">
                {mutasi.dari_ruangan || "-"}
              </div>

            </div>

            <div>

              <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                <MapPin size={17} />
                Ruangan Tujuan
              </div>

              <div className="bg-blue-50 text-blue-700 rounded-xl px-4 py-3 font-semibold">
                {mutasi.ke_ruangan || "-"}
              </div>

            </div>

            <div>

              <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                <Calendar size={17} />
                Tanggal Mutasi
              </div>

              <div className="bg-slate-100 rounded-xl px-4 py-3 font-semibold">
                {mutasi.tanggal_mutasi
                  ? new Date(
                      mutasi.tanggal_mutasi
                    ).toLocaleDateString("id-ID")
                  : "-"}
              </div>

            </div>

            <div>

              <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                <FileText size={17} />
                Alasan Mutasi
              </div>

              <div className="bg-slate-100 rounded-xl px-4 py-3 font-semibold">
                {mutasi.alasan || "-"}
              </div>

            </div>

            <div className="md:col-span-2">

              <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                <FileText size={17} />
                Keterangan
              </div>

              <div className="bg-slate-100 rounded-xl px-4 py-4 min-h-[100px]">
                {mutasi.keterangan || "-"}
              </div>

            </div>

          </div>

        </div>

        {/* ALUR */}

        <div className="bg-white rounded-3xl shadow-sm p-6 mt-6">

          <h2 className="text-xl font-bold text-slate-800 mb-6">
            Alur Mutasi
          </h2>

          <div className="flex flex-col md:flex-row items-center justify-center gap-4">

            <div className="bg-slate-100 rounded-2xl px-6 py-4 text-center min-w-[200px]">

              <p className="text-sm text-gray-500">
                Ruangan Asal
              </p>

              <p className="font-bold text-lg">
                {mutasi.dari_ruangan || "-"}
              </p>

            </div>

            <ArrowRightLeft
              className="text-purple-600"
              size={28}
            />

            <div className="bg-blue-50 rounded-2xl px-6 py-4 text-center min-w-[200px]">

              <p className="text-sm text-blue-500">
                Ruangan Tujuan
              </p>

              <p className="font-bold text-lg text-blue-700">
                {mutasi.ke_ruangan || "-"}
              </p>

            </div>

          </div>

        </div>

        <div className="text-center text-sm text-gray-400 mt-8">
          SIMSTOKBMN • Riwayat Mutasi BMN
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
    <div>
      <p className="text-sm text-gray-500 mb-1">
        {label}
      </p>

      <p className="text-lg font-semibold text-slate-800">
        {value || "-"}
      </p>
    </div>
  );
}