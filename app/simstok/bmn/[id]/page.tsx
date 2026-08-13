"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Image from "next/image";
import QRCode from "react-qr-code";
import { ArrowLeft, Pencil, Package, MapPin, User, ArrowRightLeft } from "lucide-react";
import Link from "next/link";

export default function DetailBMNPage() {
  const params = useParams();
  const router = useRouter();

  const [bmn, setBmn] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params?.id) {
      loadBMN();
    }
  }, [params?.id]);

  async function loadBMN() {
    console.log("ID =", params.id);

    const { data, error } = await supabase
      .from("barang")
      .select("*")
      .eq("id", Number(params.id))
      .maybeSingle();

    console.log("DATA =", data);
    console.log("ERROR =", error);

    if (error) {
      console.error("ERROR DETAIL BMN:", error.message);
      setLoading(false);
      return;
    }

    setBmn(data);
    setLoading(false);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow p-8 text-center">
          <p className="text-gray-600">Memuat data BMN...</p>
        </div>
      </main>
    );
  }

  if (!bmn) {
    return (
      <main className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow p-8 text-center max-w-md">
          <Package className="mx-auto mb-4 text-gray-400" size={48} />

          <h1 className="text-xl font-bold text-gray-800 mb-2">
            Data BMN Tidak Ditemukan
          </h1>

          <p className="text-gray-500 mb-6">
            Data barang dengan ID tersebut tidak tersedia.
          </p>

          <button
            onClick={() => router.back()}
            className="bg-slate-700 hover:bg-slate-800 text-white px-5 py-3 rounded-xl"
          >
            ← Kembali
          </button>
        </div>
      </main>
    );
  }

  const qrUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/simstok/bmn/${bmn.id}`
      : "";

  return (
    <main className="min-h-screen bg-slate-100 p-4 md:p-8">

      <div className="max-w-5xl mx-auto">

        {/* HEADER */}
        <div className="flex flex-wrap justify-between items-center gap-3 mb-6">

          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 px-4 py-3 rounded-xl shadow-sm border"
          >
            <ArrowLeft size={18} />
            Kembali
          </button>

       <div className="flex flex-wrap gap-2">

  <Link
    href={`/simstok/mutasi/tambah?barang=${bmn.id}`}
    className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-5 py-3 rounded-xl shadow-sm"
  >
    <ArrowRightLeft size={18} />
    Mutasi BMN
  </Link>

  <button
    onClick={() =>
      router.push(`/simstok/data-bmn/edit/${bmn.id}`)
    }
    className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-5 py-3 rounded-xl shadow-sm"
  >
    <Pencil size={18} />
    Edit BMN
  </button>

</div>
        </div>

        {/* JUDUL */}
        <div className="bg-white rounded-3xl shadow-sm p-6 mb-6">

          <div className="flex items-center gap-3">

            <div className="bg-slate-800 text-white p-3 rounded-xl">
              <Package size={26} />
            </div>

            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-800">
                Detail BMN
              </h1>

              <p className="text-gray-500">
                Sistem Informasi Stok BMN
              </p>
            </div>

          </div>

        </div>

        {/* DATA UTAMA */}
        <div className="grid lg:grid-cols-3 gap-6">

          {/* FOTO */}
          <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm p-6">

            <h2 className="text-lg font-bold text-slate-800 mb-4">
              Foto Barang
            </h2>

            {bmn.foto ? (
              <div className="flex justify-center">

                <Image
                  src={bmn.foto}
                  alt={bmn.nama_barang || "Foto BMN"}
                  width={600}
                  height={600}
                  className="rounded-2xl border object-contain max-h-[500px] w-auto"
                />

              </div>
            ) : (
              <div className="h-80 rounded-2xl border-2 border-dashed flex items-center justify-center text-gray-400">
                Tidak ada foto barang
              </div>
            )}

          </div>

          {/* QR CODE */}
          <div className="bg-white rounded-3xl shadow-sm p-6 flex flex-col items-center justify-center">

            <h2 className="text-lg font-bold text-slate-800 mb-4">
              QR Code BMN
            </h2>

            <div className="bg-white p-5 rounded-2xl border shadow-sm">

              {qrUrl && (
                <QRCode
                  value={qrUrl}
                  size={200}
                />
              )}

            </div>

            <p className="text-sm text-gray-500 text-center mt-4">
              Scan QR Code untuk melihat
              <br />
              data BMN ini
            </p>

            <p className="text-xs text-gray-400 mt-3 text-center break-all">
              BMN ID: {bmn.id}
            </p>

          </div>

        </div>

        {/* INFORMASI BMN */}
        <div className="bg-white rounded-3xl shadow-sm p-6 mt-6">

          <h2 className="text-xl font-bold text-slate-800 mb-6">
            Informasi Barang
          </h2>

          <div className="grid md:grid-cols-2 gap-x-8 gap-y-5">

            <Info
              label="Kode Barang"
              value={bmn.kode_barang}
            />

            <Info
              label="NUP"
              value={bmn.nup}
            />

            <Info
              label="Nama Barang"
              value={bmn.nama_barang}
            />

            <Info
              label="Kategori"
              value={bmn.kategori}
            />

            <Info
              label="Merk"
              value={bmn.merk}
            />

            <Info
              label="Tipe"
              value={bmn.tipe}
            />

            <Info
              label="Kondisi"
              value={bmn.kondisi}
            />

            <Info
              label="Jumlah"
              value={bmn.jumlah}
            />

            <Info
              label="Tahun Perolehan"
              value={bmn.tahun_perolehan}
            />

            <Info
              label="Nilai Perolehan"
              value={
                bmn.nilai_perolehan != null
                  ? `Rp ${Number(
                      bmn.nilai_perolehan
                    ).toLocaleString("id-ID")}`
                  : "-"
              }
            />

            <div className="md:col-span-2">
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                <MapPin size={16} />
                Ruangan
              </div>

              <p className="text-lg font-semibold text-slate-800">
                {bmn.ruangan || "-"}
              </p>
            </div>

            <div className="md:col-span-2">
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                <User size={16} />
                Penanggung Jawab
              </div>

              <p className="text-lg font-semibold text-slate-800">
                {bmn.penanggung_jawab || "-"}
              </p>
            </div>

          </div>

        </div>

        {/* FOOTER */}
        <div className="text-center text-sm text-gray-400 mt-8">
          SIMSTOKBMN • Sistem Informasi Stok BMN
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