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

  <div className="flex justify-between items-center mb-4">
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
      className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg shadow"
    >
      + Tambah Ruangan
    </Link>
  </div>

  <div className="flex justify-between items-center">
    <p className="text-sm text-slate-600">
      Total Ruangan : <b>{ruangan.length}</b>
    </p>

    <input
      type="text"
      placeholder="Cari Kode atau Nama Ruangan..."
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      className="border rounded-lg px-4 py-2 w-80"
    />
  </div>

  <table className="w-full mt-4">

    <thead className="bg-slate-100">
     <tr>
    <th className="p-3 border w-16">No</th>
    <th className="p-3 border">Kode</th>
        <th className="p-3 border">Nama Ruangan</th>
        <th className="p-3 border">Lantai</th>
        <th className="p-3 border w-52">Aksi</th>
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
          <td className="p-3 border text-center">
    {index + 1}
  </td>
          <td className="p-3 border">{item.kode_ruangan}</td>
          <td className="p-3 border">{item.nama_ruangan}</td>
          <td className="p-3 border">{item.lantai}</td>
          <td className="p-3 border">
    <div className="flex gap-2 justify-center">
      <Link
        href={`/simstok/ruangan/edit/${item.id}`}
        className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded"
      >
        Edit
      </Link>

      <button
        onClick={() => handleDelete(item.id)}
        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
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
  );
}