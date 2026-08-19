"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Wrench, Search } from "lucide-react";

export default function PemeliharaanPage() {
  const [barang, setBarang] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
const [selectedBarang, setSelectedBarang] = useState<any>(null);
const [saving, setSaving] = useState(false);
  useEffect(() => {
    loadBarang();
  }, []);

  async function loadBarang() {
    setLoading(true);

    const { data, error } = await supabase
      .from("barang")
      .select(`
        id,
        kode_barang,
        nama_barang,
        nup,
        ruangan,
        kondisi,
        jumlah
      `)
      .order("nama_barang", {
        ascending: true,
      });

    if (error) {
      console.error("ERROR DATA BARANG:", error.message);
      setLoading(false);
      return;
    }

    setBarang(data || []);
    setLoading(false);
  }
async function simpanPemeliharaan(
  e: React.FormEvent<HTMLFormElement>
) {
  e.preventDefault();

  console.log("SUBMIT PEMELIHARAAN TERPANGGIL");

  if (!selectedBarang) {
    alert("Silakan pilih BMN terlebih dahulu.");
    return;
  }

  // Cegah submit ganda
  if (saving) {
    return;
  }

  setSaving(true);

  try {
    console.log("SELECTED BARANG:", selectedBarang);

    const form = new FormData(e.currentTarget);

    const tanggalMulai =
      String(form.get("tanggal_mulai") || "");

    const jenisPemeliharaan =
      String(form.get("jenis_pemeliharaan") || "");

    const vendor =
      String(form.get("vendor") || "");

    const biaya =
      Number(form.get("biaya") || 0);

    const status =
      String(form.get("status") || "Dalam Proses");

    const tanggalSelesai =
      String(form.get("tanggal_selesai") || "");

    const keterangan =
      String(form.get("keterangan") || "");

    // Validasi
    if (!tanggalMulai || !jenisPemeliharaan) {
      alert(
        "Tanggal mulai dan jenis pemeliharaan wajib diisi."
      );
      return;
    }

    /*
     * CEK DATA YANG SAMA
     * Supaya tidak tersimpan berkali-kali
     */
    const { data: existing, error: checkError } =
      await supabase
        .from("pemeliharaan_bmn")
        .select("id")
        .eq("barang_id", selectedBarang.id)
        .eq("tanggal_mulai", tanggalMulai)
        .eq("jenis_pemeliharaan", jenisPemeliharaan)
      .ilike("vendor", vendor || "")
        .eq("biaya", biaya)
        .limit(1);

    if (checkError) {
      console.error(
        "ERROR CEK PEMELIHARAAN:",
        checkError.message
      );

      alert(
        "Gagal memeriksa data pemeliharaan: " +
        checkError.message
      );

      return;
    }

    if (existing && existing.length > 0) {
      alert(
        "Data pemeliharaan yang sama sudah ada.\n\n" +
        "Data tidak disimpan lagi agar tidak terjadi duplikasi."
      );

      return;
    }

    console.log("DATA BARU AKAN DISIMPAN");

    const { error } = await supabase
      .from("pemeliharaan_bmn")
      .insert({
        barang_id: selectedBarang.id,
        tanggal_mulai: tanggalMulai,
        tanggal_selesai:
          tanggalSelesai || null,
        jenis_pemeliharaan:
          jenisPemeliharaan,
        vendor:
          vendor || null,
        biaya,
        status,
        keterangan:
          keterangan || null,
      });

    console.log("HASIL INSERT:", error);

    if (error) {
      console.error(
        "ERROR SIMPAN PEMELIHARAAN:",
        error.message
      );

      alert(
        "Gagal menyimpan pemeliharaan:\n\n" +
        error.message
      );

      return;
    }

    alert(
      "Data pemeliharaan berhasil disimpan."
    );

    // Tutup form
    setSelectedBarang(null);

  } catch (err: any) {

    console.error(
      "ERROR PEMELIHARAAN:",
      err
    );

    alert(
      "Terjadi kesalahan:\n\n" +
      (err?.message || "Tidak diketahui")
    );

  } finally {

    setSaving(false);

  }
}
  const dataFilter = barang.filter((item) => {
    const teks = search.toLowerCase();

    return (
      String(item.kode_barang || "")
        .toLowerCase()
        .includes(teks) ||
      String(item.nama_barang || "")
        .toLowerCase()
        .includes(teks) ||
      String(item.nup || "")
        .toLowerCase()
        .includes(teks) ||
      String(item.ruangan || "")
        .toLowerCase()
        .includes(teks)
    );
  });

  return (
    <main>

      {/* HEADER */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-blue-900">
          Pemeliharaan BMN
        </h1>

        <p className="text-slate-500 mt-2">
          Pengelolaan pemeliharaan Barang Milik Negara
        </p>
      </div>
{/* FORM PEMELIHARAAN */}
{selectedBarang && (
  <form
    onSubmit={simpanPemeliharaan}
    className="bg-white rounded-3xl shadow-lg p-6 mb-6"
  >

    <div className="flex items-center justify-between mb-6">

      <div>
        <p className="text-sm text-slate-500">
          Pemeliharaan BMN
        </p>

        <h2 className="text-2xl font-bold text-blue-900">
          {selectedBarang.nama_barang}
        </h2>

        <p className="text-sm text-slate-500 mt-1">
          Kode Barang: {selectedBarang.kode_barang} |
          NUP: {selectedBarang.nup || "-"}
        </p>
      </div>

      <button
        type="button"
        onClick={() => setSelectedBarang(null)}
        className="bg-slate-200 hover:bg-slate-300 px-4 py-2 rounded-xl"
      >
        Tutup
      </button>

    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

      {/* TANGGAL MULAI */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          Tanggal Mulai
        </label>

       <input
  type="date"
  name="tanggal_mulai"
  defaultValue={
    new Date().toISOString().split("T")[0]
  }
          className="w-full border border-slate-300 rounded-xl px-4 py-3"
        />
      </div>

      {/* JENIS PEMELIHARAAN */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          Jenis Pemeliharaan
        </label>

        <select
          name="jenis_pemeliharaan"
          className="w-full border border-slate-300 rounded-xl px-4 py-3"
          defaultValue=""
        >
          <option value="" disabled>
            Pilih jenis pemeliharaan
          </option>

          <option value="Perbaikan">
            Perbaikan
          </option>

          <option value="Servis">
            Servis
          </option>

          <option value="Pengecekan">
            Pengecekan
          </option>

          <option value="Penggantian Komponen">
            Penggantian Komponen
          </option>

          <option value="Pemeliharaan Rutin">
            Pemeliharaan Rutin
          </option>
        </select>
      </div>

      {/* VENDOR */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          Vendor / Teknisi
        </label>

        <input
          type="text"
          name="vendor"
          placeholder="Nama vendor atau teknisi"
          className="w-full border border-slate-300 rounded-xl px-4 py-3"
        />
      </div>

      {/* BIAYA */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          Biaya Pemeliharaan
        </label>

       <input
  type="number"
  name="biaya"
  placeholder="0"
  min="0"
  className="w-full border border-slate-300 rounded-xl px-4 py-3"
/>
      </div>

      {/* STATUS */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          Status
        </label>

        <select
          name="status"
          className="w-full border border-slate-300 rounded-xl px-4 py-3"
          defaultValue="Dalam Proses"
        >
          <option value="Dalam Proses">
            Dalam Proses
          </option>

          <option value="Selesai">
            Selesai
          </option>
        </select>
      </div>

      {/* TANGGAL SELESAI */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          Tanggal Selesai
        </label>

        <input
          type="date"
          name="tanggal_selesai"
          className="w-full border border-slate-300 rounded-xl px-4 py-3"
        />
      </div>

    </div>

    {/* KETERANGAN */}
    <div className="mt-5">

      <label className="block text-sm font-semibold text-slate-700 mb-2">
        Keterangan
      </label>

     <textarea
  name="keterangan"
  rows={4}
  placeholder="Masukkan keterangan pemeliharaan..."
        className="w-full border border-slate-300 rounded-xl px-4 py-3"
      />

    </div>

    {/* TOMBOL */}
    <div className="flex justify-end gap-3 mt-6">

      <button
        type="button"
        onClick={() => setSelectedBarang(null)}
        className="bg-slate-200 hover:bg-slate-300 px-5 py-3 rounded-xl font-semibold"
      >
        Batal
      </button>

      <button
        type="submit"
        disabled={saving}
        className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-semibold"
      >
        {saving ? "Menyimpan..." : "Simpan Pemeliharaan"}
      </button>

    </div>

  </form>
)}
      {/* INFO */}
      <div className="bg-white rounded-3xl shadow-lg p-6 mb-6">

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

          <div className="flex items-center gap-3">

            <div className="bg-orange-100 text-orange-600 p-3 rounded-xl">
              <Wrench size={24} />
            </div>

            <div>
              <p className="text-sm text-slate-500">
                Total BMN
              </p>

              <p className="text-2xl font-bold text-slate-800">
                {barang.length}
              </p>
            </div>

          </div>

          {/* SEARCH */}
          <div className="relative w-full md:w-96">

            <Search
              size={19}
              className="absolute left-4 top-3.5 text-slate-400"
            />

            <input
              type="text"
              placeholder="Cari kode, nama, NUP..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border border-slate-300 rounded-xl pl-11 pr-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
            />

          </div>

        </div>

      </div>

      {/* DAFTAR BMN */}
      <div className="bg-white rounded-3xl shadow-lg overflow-hidden">

        <div className="p-6 border-b">

          <h2 className="text-xl font-bold text-slate-800">
            Pilih BMN untuk Pemeliharaan
          </h2>

          <p className="text-sm text-slate-500 mt-1">
            Pilih barang yang akan dicatat pemeliharaannya.
          </p>

        </div>

        <div className="overflow-x-auto">

          <table className="w-full min-w-[900px]">

            <thead className="bg-blue-600 text-white">

              <tr>

                <th className="px-4 py-4 text-center">
                  No
                </th>

                <th className="px-4 py-4 text-left">
                  Kode Barang
                </th>

                <th className="px-4 py-4 text-left">
                  Nama Barang
                </th>

                <th className="px-4 py-4 text-left">
                  NUP
                </th>

                <th className="px-4 py-4 text-left">
                  Ruangan
                </th>

                <th className="px-4 py-4 text-left">
                  Kondisi
                </th>

                <th className="px-4 py-4 text-center">
                  Aksi
                </th>

              </tr>

            </thead>

            <tbody>

              {loading ? (

                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-10 text-center text-slate-500"
                  >
                    Memuat data BMN...
                  </td>
                </tr>

              ) : dataFilter.length === 0 ? (

                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-10 text-center text-slate-500"
                  >
                    Data BMN tidak ditemukan.
                  </td>
                </tr>

              ) : (

                dataFilter.map((item, index) => (

                  <tr
                    key={item.id}
                    className="border-b hover:bg-slate-50"
                  >

                    <td className="px-4 py-4 text-center">
                      {index + 1}
                    </td>

                    <td className="px-4 py-4 font-semibold">
                      {item.kode_barang || "-"}
                    </td>

                    <td className="px-4 py-4">
                      {item.nama_barang || "-"}
                    </td>

                    <td className="px-4 py-4">
                      {item.nup || "-"}
                    </td>

                    <td className="px-4 py-4">
                      {item.ruangan || "-"}
                    </td>

                    <td className="px-4 py-4">
                      {item.kondisi || "-"}
                    </td>

                    <td className="px-4 py-4 text-center">

                     <button
  type="button"
  onClick={() => setSelectedBarang(item)}
  className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl font-semibold"
>
                        <span className="flex items-center gap-2">
                          <Wrench size={17} />
                          Pelihara
                        </span>
                      </button>

                    </td>

                  </tr>

                ))

              )}

            </tbody>

          </table>

        </div>

      </div>

    </main>
  );
}