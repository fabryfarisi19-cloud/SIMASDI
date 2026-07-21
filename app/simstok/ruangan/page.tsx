"use client";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
export default function RuanganPage() {
const [ruangan, setRuangan] = useState<any[]>([]);
const [loading, setLoading] = useState(false);   
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
return (
  <div className="p-8">

  <div className="flex items-center justify-between mb-6">

    <div>
      <h1 className="text-3xl font-bold text-slate-800">
        Data Ruangan
      </h1>

      <p className="text-slate-500 mt-1">
        Master Ruangan SIMSTOK BMN
      </p>
    </div>

    <button
      className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg shadow"
    >
      + Tambah Ruangan
    </button>

  </div>
      <h1 className="text-3xl font-bold">
        Data Ruangan
      </h1>
 <table className="w-full mt-6 border">
  <thead className="bg-slate-100">
    <tr>
      <th className="p-3 border">Kode</th>
      <th className="p-3 border">Nama Ruangan</th>
      <th className="p-3 border">Lantai</th>
    </tr>
  </thead>

  <tbody>
    {ruangan.map((item: any) => (
      <tr key={item.id}>
        <td className="p-3 border">{item.kode_ruangan}</td>
        <td className="p-3 border">{item.nama_ruangan}</td>
        <td className="p-3 border">{item.lantai}</td>
      </tr>
    ))}
  </tbody>
</table>
    </div>
  );
}