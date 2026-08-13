"use client";
import Link from "next/link";
import Swal from "sweetalert2";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";

export default function RuanganPage() {
const [ruangan, setRuangan] = useState<any[]>([]);
const [loading, setLoading] = useState(false); 
const [search, setSearch] = useState("");  
  useEffect(() => {
    loadRuangan();
  }, []);
  async function loadRuangan() {
  setLoading(true);

  const { data, error } = await supabase
    .from("ruangan")
    .select("*")
    .order("kode_ruangan");
console.log("DATA:", data);
console.log("ERROR:", error);
  if (error) {
    console.error(error);
  } else {
    setRuangan(data ?? []);
  }
  setLoading(false);
}

async function handleDelete(id: number) {
  const result = await Swal.fire({
    title: "Hapus Ruangan?",
    text: "Data yang dihapus tidak dapat dikembalikan.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Ya, Hapus",
    cancelButtonText: "Batal",
    confirmButtonColor: "#dc2626",
  });

  if (!result.isConfirmed) return;

  const { error } = await supabase
    .from("ruangan")
    .delete()
    .eq("id", id);

  if (error) {
    Swal.fire("Gagal", error.message, "error");
    return;
  }

  Swal.fire("Berhasil", "Ruangan berhasil dihapus.", "success");

  loadRuangan();
}

return (
  <div className="mb-6">

 <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-4">
    <div>
      <h1 className="text-3xl font-bold text-slate-800">
        Data Ruangan
      </h1>

      <p className="text-slate-500">
        Master Ruangan SIMSTOK BMN
      </p>
    </div>

    <Link
  href="/simstok/ruangan/tambah"
  className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-lg shadow text-center"
>
      + Tambah Ruangan
    </Link>
  </div>

 <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3">
    <p className="text-sm text-slate-600">
      Total Ruangan : <b>{ruangan.length}</b>
    </p>

    <input
      type="text"
      placeholder="Cari Kode atau Nama Ruangan..."
      value={search}
      onChange={(e) => setSearch(e.target.value)}
     className="border rounded-lg px-4 py-2 w-full md:w-80"
    />
  </div>

 <div className="overflow-x-auto mt-4">
  <table className="min-w-[800px] w-full">

    <thead className="bg-slate-100">
     <tr>
  <th className="p-2 border w-14 text-center">No</th>
<th className="p-2 border w-24 text-center">Kode</th>
<th className="p-2 border min-w-[220px]">Nama Ruangan</th>
<th className="p-2 border w-20 text-center">Lantai</th>
<th className="p-2 border w-40 text-center">Aksi</th>
      </tr>
    </thead>

   <tbody>
    {ruangan
      .filter((item) => {
        return (
          item.kode_ruangan
            .toLowerCase()
            .includes(search.toLowerCase()) ||
          item.nama_ruangan
            .toLowerCase()
            .includes(search.toLowerCase())
        );
      })
     .map((item: any, index: number) => (
        <tr key={item.id}>
        <td className="p-2 border text-center">
  {index + 1}
</td>

<td className="p-2 border text-center font-semibold">
  {item.kode_ruangan}
</td>

<td className="p-2 border">
  {item.nama_ruangan}
</td>

<td className="p-2 border text-center">
  {item.lantai}
</td>
          <td className="p-2 border">
 <div className="flex flex-col gap-2">

  <Link
    href={`/simstok/ruangan/${item.id}`}
    className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm text-center"
  >
    BMN
  </Link>

  <Link
    href={`/simstok/ruangan/edit/${item.id}`}
    className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-2 rounded-lg text-sm text-center"
  >
    Edit
  </Link>

  <button
    onClick={() => handleDelete(item.id)}
    className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm"
  >
    Hapus
  </button>

</div>
  </td>
        </tr>
      ))}
  </tbody>
  </table>
</div>

</div>
  );
}