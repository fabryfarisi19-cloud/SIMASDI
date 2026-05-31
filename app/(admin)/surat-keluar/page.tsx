"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
export default function SuratKeluarPage() {
    const [form, setForm] = useState({
  nomor: "",
  tujuan: "",
  perihal: "",
});
const [suratKeluarList, setSuratKeluarList] = useState<any[]>([]);
const simpanSuratKeluar = async () => {
  if (!form.nomor || !form.tujuan || !form.perihal) {
    alert("Lengkapi data surat");
    return;
  }

  const { error } = await supabase
    .from("surat_keluar")
    .insert([
      {
        no_agenda: `SK-${Date.now()}`,
        tanggal: new Date(),
        nomor_surat: form.nomor,
        tujuan_surat: form.tujuan,
        perihal: form.perihal,
      },
    ]);

  if (error) {
    alert(error.message);
    return;
  }

  alert("Surat keluar berhasil disimpan");
  loadSuratKeluar();

  setForm({
    nomor: "",
    tujuan: "",
    perihal: "",
  });
};
const loadSuratKeluar = async () => {
  const { data } = await supabase
    .from("surat_keluar")
    .select("*")
    .order("id", { ascending: false });

  setSuratKeluarList(data || []);
};
const hapusSurat = async (id: number) => {
  if (!confirm("Yakin hapus surat ini?")) return;

  await supabase
    .from("surat_keluar")
    .delete()
    .eq("id", id);

  loadSuratKeluar();
};
useEffect(() => {
  loadSuratKeluar();
}, []);
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">
        Surat Keluar
      </h1>

      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <div className="mb-4">
          <label className="block mb-2">Nomor Surat</label>
         <input
  value={form.nomor}
  onChange={(e) =>
    setForm({ ...form, nomor: e.target.value })
  }
  className="w-full border p-2 rounded"
  placeholder="Nomor Surat"
/>
        </div>

        <div className="mb-4">
          <label className="block mb-2">Tujuan Surat</label>
          <input
            value={form.tujuan}
            onChange={(e) =>
              setForm({ ...form, tujuan: e.target.value })
            }
            className="w-full border p-2 rounded"
            placeholder="Tujuan Surat"
            />

        </div>

        <div className="mb-4">
          <label className="block mb-2">Perihal</label>
          <input
            value={form.perihal}
            onChange={(e) =>
              setForm({ ...form, perihal: e.target.value })
            }
            className="w-full border p-2 rounded"
            placeholder="Perihal"
          />
        </div>

        <button
  onClick={simpanSuratKeluar}
  className="bg-blue-600 text-white px-4 py-2 rounded"
>
  Simpan Surat Keluar
</button>
<div className="bg-white p-6 rounded-lg shadow mt-6">
  <h2 className="text-xl font-bold mb-4">
    Daftar Surat Keluar
  </h2>

  <table className="w-full border">
    <thead>
      <tr className="bg-gray-100">
        <th className="border p-2">Nomor Surat</th>
        <th className="border p-2">Tujuan</th>
        <th className="border p-2">Perihal</th>
        <th className="border p-2">Aksi</th>
      </tr>
    </thead>

    <tbody>
      {suratKeluarList.map((item) => (
        <tr key={item.id}>
          <td className="border p-2">
            {item.nomor_surat}
          </td>

          <td className="border p-2">
            {item.tujuan_surat}
          </td>

          <td className="border p-2">
            {item.perihal}
          </td>
          <td className="border p-2">
            <button
  onClick={() => hapusSurat(item.id)}
  className="bg-red-600 text-white px-4 py-2 rounded"
>
  Hapus
</button>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
      </div>
    </div>
  );
}