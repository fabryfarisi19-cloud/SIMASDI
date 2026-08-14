"use client";

import { Suspense, useEffect, useState, ReactNode } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Save,
  Package,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

function TambahMutasiForm() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const barangId = searchParams.get("barang");

  const [barang, setBarang] = useState<any>(null);
  const [daftarRuangan, setDaftarRuangan] = useState<any[]>(
    []
  );

  const [keRuangan, setKeRuangan] = useState("");
  const [tanggalMutasi, setTanggalMutasi] =
    useState(
      new Date().toISOString().split("T")[0]
    );

  const [alasan, setAlasan] = useState("");
  const [keterangan, setKeterangan] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  useEffect(() => {
    if (barangId) {
      loadBarang();
      loadRuangan();
    }
  }, [barangId]);

  async function loadBarang() {
    const { data, error } =
      await supabase
        .from("barang")
        .select(
          "id, kode_barang, nama_barang, nup, ruangan, kondisi, jumlah"
        )
        .eq("id", Number(barangId))
        .single();

    if (error) {
      console.error(
        "ERROR BARANG:",
        error.message
      );

      alert(
        "Data BMN tidak ditemukan."
      );

      router.push(
        "/simstok/data-bmn"
      );

      return;
    }

    setBarang(data);
    setLoading(false);
  }

  async function loadRuangan() {
    const { data, error } =
      await supabase
        .from("ruangan")
        .select(
          "id, kode_ruangan, nama_ruangan, lantai"
        )
        .order("kode_ruangan");

    if (error) {
      console.error(
        "ERROR RUANGAN:",
        error.message
      );

      return;
    }

    setDaftarRuangan(data || []);
  }

  async function simpanMutasi() {
    if (!barang) {
      alert(
        "Data BMN belum tersedia."
      );
      return;
    }

    if (!keRuangan) {
      alert(
        "Ruangan tujuan wajib dipilih."
      );
      return;
    }

    if (
      keRuangan === barang.ruangan
    ) {
      alert(
        "Ruangan tujuan sama dengan ruangan asal."
      );
      return;
    }

    setSaving(true);

    try {
      /*
       * 1. SIMPAN RIWAYAT MUTASI
       */
      const { error: mutasiError } =
        await supabase
          .from("mutasi_bmn")
          .insert({
            barang_id: barang.id,
            dari_ruangan:
              barang.ruangan,
            ke_ruangan:
              keRuangan,
            tanggal_mutasi:
              tanggalMutasi,
            alasan: alasan,
            keterangan:
              keterangan,
          });

      if (mutasiError) {
        throw mutasiError;
      }

      /*
       * 2. UPDATE RUANGAN BMN
       */
      const { error: updateError } =
        await supabase
          .from("barang")
          .update({
            ruangan: keRuangan,
          })
          .eq("id", barang.id);

      if (updateError) {
        throw updateError;
      }

      alert(
        "Mutasi BMN berhasil disimpan."
      );

      /*
       * KEMBALI KE DETAIL BMN
       */
      router.push(
        `/simstok/bmn/${barang.id}`
      );

    } catch (error: any) {
      console.error(
        "ERROR MUTASI:",
        error
      );

      alert(
        error.message ||
          "Gagal menyimpan mutasi BMN."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-3xl shadow p-8 text-center">
          Memuat data BMN...
        </div>
      </main>
    );
  }

  if (!barang) {
    return (
      <main className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-3xl shadow p-8 text-center">
          Data BMN tidak ditemukan.
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-4xl mx-auto">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">

        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-blue-900">
            Mutasi BMN
          </h1>

          <p className="text-slate-500 mt-2">
            Pindahkan BMN ke ruangan lain
          </p>
        </div>

        <button
          onClick={() =>
            router.push(
              `/simstok/bmn/${barang.id}`
            )
          }
          className="flex items-center justify-center gap-2 bg-slate-200 hover:bg-slate-300 px-5 py-3 rounded-xl"
        >
          <ArrowLeft size={18} />
          Kembali
        </button>

      </div>

      {/* INFORMASI BMN */}
      <div className="bg-white rounded-3xl shadow-lg p-6 mb-6">

        <div className="flex items-center gap-4 mb-5">

          <div className="bg-blue-100 text-blue-700 p-3 rounded-xl">
            <Package size={28} />
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-800">
              {barang.nama_barang}
            </h2>

            <p className="text-slate-500">
              Kode:{" "}
              {barang.kode_barang ||
                "-"}
            </p>
          </div>

        </div>

        <div className="grid md:grid-cols-2 gap-5">

          <div>
            <p className="text-sm text-gray-500">
              NUP
            </p>

            <p className="font-semibold">
              {barang.nup || "-"}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">
              Kondisi
            </p>

            <p className="font-semibold">
              {barang.kondisi ||
                "-"}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">
              Jumlah
            </p>

            <p className="font-semibold">
              {barang.jumlah || 0}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">
              Ruangan Asal
            </p>

            <p className="font-semibold text-blue-700">
              {barang.ruangan ||
                "-"}
            </p>
          </div>

        </div>

      </div>

      {/* FORM MUTASI */}
      <div className="bg-white rounded-3xl shadow-lg p-8">

        <h2 className="text-xl font-bold text-slate-800 mb-6">
          Informasi Mutasi
        </h2>

        <div className="space-y-6">

          {/* RUANGAN ASAL */}
          <div>
            <label className="font-semibold block mb-2">
              Ruangan Asal
            </label>

            <input
              value={
                barang.ruangan || ""
              }
              disabled
              className="w-full border rounded-xl px-4 py-3 bg-slate-100 text-slate-600"
            />
          </div>

          {/* RUANGAN TUJUAN */}
          <div>
            <label className="font-semibold block mb-2">
              Ruangan Tujuan
            </label>

            <select
              value={keRuangan}
              onChange={(e) =>
                setKeRuangan(
                  e.target.value
                )
              }
              className="w-full border rounded-xl px-4 py-3 bg-white"
            >
              <option value="">
                Pilih Ruangan Tujuan
              </option>

              {daftarRuangan
                .filter(
                  (item) =>
                    item.nama_ruangan !==
                    barang.ruangan
                )
                .map((item) => (
                  <option
                    key={item.id}
                    value={
                      item.nama_ruangan
                    }
                  >
                    {item.kode_ruangan} -{" "}
                    {item.nama_ruangan}
                  </option>
                ))}
            </select>
          </div>

          {/* TANGGAL */}
          <div>
            <label className="font-semibold block mb-2">
              Tanggal Mutasi
            </label>

            <input
              type="date"
              value={
                tanggalMutasi
              }
              onChange={(e) =>
                setTanggalMutasi(
                  e.target.value
                )
              }
              className="w-full border rounded-xl px-4 py-3"
            />
          </div>

          {/* ALASAN */}
          <div>
            <label className="font-semibold block mb-2">
              Alasan Mutasi
            </label>

            <select
              value={alasan}
              onChange={(e) =>
                setAlasan(
                  e.target.value
                )
              }
              className="w-full border rounded-xl px-4 py-3"
            >
              <option value="">
                Pilih Alasan
              </option>

              <option value="Penataan Inventaris">
                Penataan Inventaris
              </option>

              <option value="Kebutuhan Operasional">
                Kebutuhan Operasional
              </option>

              <option value="Pergantian Ruangan">
                Pergantian Ruangan
              </option>

              <option value="Pemeliharaan">
                Pemeliharaan
              </option>

              <option value="Lainnya">
                Lainnya
              </option>
            </select>
          </div>

          {/* KETERANGAN */}
          <div>
            <label className="font-semibold block mb-2">
              Keterangan
            </label>

            <textarea
              value={keterangan}
              onChange={(e) =>
                setKeterangan(
                  e.target.value
                )
              }
              rows={4}
              placeholder="Keterangan tambahan..."
              className="w-full border rounded-xl px-4 py-3"
            />
          </div>

        </div>

        {/* BUTTON */}
        <div className="flex justify-end gap-3 mt-8">

          <button
            onClick={() =>
              router.push(
                `/simstok/bmn/${barang.id}`
              )
            }
            disabled={saving}
            className="px-6 py-3 rounded-xl bg-slate-300 hover:bg-slate-400 disabled:opacity-50"
          >
            Batal
          </button>

          <button
            onClick={simpanMutasi}
            disabled={saving}
            className="bg-blue-700 hover:bg-blue-800 disabled:bg-gray-400 text-white px-7 py-3 rounded-xl flex items-center gap-2"
          >
            <Save size={19} />

            {saving
              ? "Menyimpan..."
              : "Simpan Mutasi"}
          </button>

        </div>

      </div>

    </main>
  );
}
export default function TambahMutasiPage() {
  return (
    <Suspense
      fallback={
        <main className="max-w-4xl mx-auto p-6">
          <div className="bg-white rounded-3xl shadow p-8 text-center">
            Memuat halaman Mutasi BMN...
          </div>
        </main>
      }
    >
      <TambahMutasiForm />
    </Suspense>
  );
}