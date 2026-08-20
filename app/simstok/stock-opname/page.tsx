"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Search, ClipboardCheck } from "lucide-react";

export default function StockOpnamePage() {
  const [barang, setBarang] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
const [selectedBarang, setSelectedBarang] = useState<any>(null);
const [hasilOpname, setHasilOpname] = useState<any[]>([]);
const totalBMN = barang.length;

const sudahDiperiksa = barang.filter((item) =>
  hasilOpname.some(
    (opname) => opname.barang_id === item.id
  )
).length;

const belumDiperiksa = totalBMN - sudahDiperiksa;
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
      console.error("ERROR STOCK OPNAME:", error.message);
      setLoading(false);
      return;
    }

    setBarang(data || []);
    const { data: opnameData, error: opnameError } =
  await supabase
    .from("stock_opname_bmn")
    .select("*")
    .order("tanggal_pemeriksaan", {
      ascending: false,
    });

if (opnameError) {
  console.error(
    "ERROR DATA STOCK OPNAME:",
    opnameError.message
  );
} else {
  setHasilOpname(opnameData || []);
}
    setLoading(false);
  }
async function simpanPemeriksaan(
  e: React.FormEvent<HTMLFormElement>
) {
  e.preventDefault();

  if (!selectedBarang) return;

  const form = new FormData(e.currentTarget);

  const kondisiFisik =
    String(form.get("kondisi_fisik") || "");

  const jumlahFisik =
    Number(form.get("jumlah_fisik") || 0);

  const catatan =
    String(form.get("catatan") || "");

  if (!kondisiFisik) {
    alert("Kondisi fisik wajib dipilih.");
    return;
  }

  const { error } = await supabase
    .from("stock_opname_bmn")
    .insert({
      barang_id: selectedBarang.id,
      kondisi_fisik: kondisiFisik,
      jumlah_fisik: jumlahFisik,
      catatan: catatan || null,
    });

  if (error) {
    console.error(
      "ERROR SIMPAN STOCK OPNAME:",
      error.message
    );

    alert(
      "Gagal menyimpan pemeriksaan:\n\n" +
      error.message
    );

    return;
  }

  alert("Hasil Stock Opname berhasil disimpan.");

  setSelectedBarang(null);
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
          Stock Opname BMN
        </h1>

        <p className="text-slate-500 mt-2">
          Pemeriksaan dan pencatatan kondisi Barang Milik Negara
        </p>
      </div>

      {/* INFO */}
    <div className="bg-white rounded-3xl shadow-lg p-6 mb-6">

  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">

    {/* REKAP */}
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 flex-1">

      {/* TOTAL BMN */}
      <div className="flex items-center gap-3 p-4 rounded-2xl bg-blue-50">
        <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center">
          <ClipboardCheck size={24} />
        </div>

        <div>
          <p className="text-sm text-slate-500">
            Total BMN
          </p>

          <p className="text-2xl font-bold text-blue-900">
            {totalBMN}
          </p>
        </div>
      </div>

      {/* SUDAH DIPERIKSA */}
      <div className="flex items-center gap-3 p-4 rounded-2xl bg-green-50">
        <div className="w-12 h-12 rounded-2xl bg-green-100 text-green-600 flex items-center justify-center">
          ✓
        </div>

        <div>
          <p className="text-sm text-slate-500">
            Sudah Diperiksa
          </p>

          <p className="text-2xl font-bold text-green-600">
            {sudahDiperiksa}
          </p>
        </div>
      </div>

      {/* BELUM DIPERIKSA */}
      <div className="flex items-center gap-3 p-4 rounded-2xl bg-yellow-50">
        <div className="w-12 h-12 rounded-2xl bg-yellow-100 text-yellow-600 flex items-center justify-center">
          !
        </div>

        <div>
          <p className="text-sm text-slate-500">
            Belum Diperiksa
          </p>

          <p className="text-2xl font-bold text-yellow-600">
            {belumDiperiksa}
          </p>
        </div>
      </div>

    </div>

    {/* SEARCH */}
    <div className="relative w-full lg:w-96">

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
{/* FORM STOCK OPNAME */}
{selectedBarang && (
  <form
    onSubmit={simpanPemeriksaan}
    className="bg-white rounded-3xl shadow-lg p-6 mb-6"
  >

    <div className="flex items-center justify-between mb-6">

      <div>
        <p className="text-sm text-slate-500">
          Pemeriksaan Stock Opname
        </p>

        <h2 className="text-2xl font-bold text-blue-900">
          {selectedBarang.nama_barang}
        </h2>

        <p className="text-sm text-slate-500 mt-1">
          Kode: {selectedBarang.kode_barang} |
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

      {/* KONDISI FISIK */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          Kondisi Fisik
        </label>

        <select
          className="w-full border border-slate-300 rounded-xl px-4 py-3"
          name="kondisi_fisik"
          defaultValue={selectedBarang.kondisi || "Baik"}
        >
          <option value="Baik">Baik</option>
          <option value="Rusak Ringan">
            Rusak Ringan
          </option>
          <option value="Rusak Berat">
            Rusak Berat
          </option>
        </select>
      </div>

      {/* JUMLAH FISIK */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          Jumlah Fisik
        </label>

        <input
          type="number"
          min="0"
          defaultValue={selectedBarang.jumlah || 0}
          className="w-full border border-slate-300 rounded-xl px-4 py-3"
          name="jumlah_fisik"
        />
      </div>

    </div>

    {/* CATATAN */}
    <div className="mt-5">
      <label className="block text-sm font-semibold text-slate-700 mb-2">
        Catatan Pemeriksaan
      </label>

      <textarea
        rows={4}
        placeholder="Masukkan hasil pemeriksaan..."
        className="w-full border border-slate-300 rounded-xl px-4 py-3"
        name="catatan"
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
        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold"
      >
        Simpan Pemeriksaan
      </button>

    </div>

  </form>
)}
      {/* TABEL */}
      <div className="bg-white rounded-3xl shadow-lg overflow-hidden">

        <div className="p-6 border-b">
          <h2 className="text-xl font-bold text-slate-800">
            Daftar BMN untuk Stock Opname
          </h2>

          <p className="text-sm text-slate-500 mt-1">
            Pilih barang yang akan diperiksa.
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
                  Jumlah
                </th>
<th className="px-4 py-4 text-center">
  Status Opname
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
                    colSpan={8}
                    className="px-4 py-10 text-center text-slate-500"
                  >
                    Memuat data BMN...
                  </td>
                </tr>

              ) : dataFilter.length === 0 ? (

                <tr>
                  <td
                    colSpan={8}
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
                      {item.jumlah || 0}
                    </td>

                    <td className="px-4 py-4 text-center">
                      {hasilOpname.some((opname) => opname.barang_id === item.id) ? (
                        <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                          Sudah Diperiksa
                        </span>
                      ) : (
                        <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-semibold">
                          Belum Diperiksa
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-4 text-center">

                    <button
  type="button"
  onClick={() => setSelectedBarang(item)}
  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-semibold"
>
  Periksa
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