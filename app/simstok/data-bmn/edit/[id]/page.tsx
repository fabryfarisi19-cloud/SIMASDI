"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useParams, useRouter } from "next/navigation";

export default function EditBMNPage() {
  const { id } = useParams();
  const router = useRouter();

  const [form, setForm] = useState({
    kode_barang: "",
    nama_barang: "",
    ruangan: "",
    kondisi: "",
    jumlah: 1,
  });

  useEffect(() => {
    getData();
  }, []);

  async function getData() {
    const { data } = await supabase
      .from("barang")
      .select("*")
      .eq("id", id)
      .single();

    if (data) {
      setForm(data);
    }
  }

  async function simpan() {
    const { error } = await supabase
      .from("barang")
      .update(form)
      .eq("id", id);

    if (error) {
      alert("Gagal menyimpan perubahan");
      return;
    }

    alert("Data berhasil diperbarui");
    router.push("/simstok/data-bmn");
  }

  return (
    <main className="max-w-3xl mx-auto">

      <h1 className="text-3xl font-bold text-blue-900 mb-6">
        Edit Data BMN
      </h1>
<div className="bg-white rounded-3xl shadow-lg p-8 space-y-6">

  <div>
    <label className="font-semibold">Kode Barang</label>
    <input
      type="text"
      value={form.kode_barang}
      onChange={(e) =>
        setForm({ ...form, kode_barang: e.target.value })
      }
      className="w-full border rounded-xl px-4 py-3 mt-2"
    />
  </div>

  <div>
    <label className="font-semibold">Nama Barang</label>
    <input
      type="text"
      value={form.nama_barang}
      onChange={(e) =>
        setForm({ ...form, nama_barang: e.target.value })
      }
      className="w-full border rounded-xl px-4 py-3 mt-2"
    />
  </div>

  <div className="grid md:grid-cols-3 gap-4">

    <div>
      <label className="font-semibold">Ruangan</label>
      <input
        type="text"
        value={form.ruangan}
        onChange={(e) =>
          setForm({ ...form, ruangan: e.target.value })
        }
        className="w-full border rounded-xl px-4 py-3 mt-2"
      />
    </div>

    <div>
      <label className="font-semibold">Kondisi</label>
      <select
        value={form.kondisi}
        onChange={(e) =>
          setForm({ ...form, kondisi: e.target.value })
        }
        className="w-full border rounded-xl px-4 py-3 mt-2"
      >
        <option value="Baik">Baik</option>
        <option value="Rusak Ringan">Rusak Ringan</option>
        <option value="Rusak Berat">Rusak Berat</option>
      </select>
    </div>

    <div>
      <label className="font-semibold">Jumlah</label>
      <input
        type="number"
        value={form.jumlah}
        onChange={(e) =>
          setForm({
            ...form,
            jumlah: Number(e.target.value),
          })
        }
        className="w-full border rounded-xl px-4 py-3 mt-2"
      />
    </div>

  </div>

  <div className="flex justify-end gap-3">

    <button
      onClick={() => router.push("/simstok/data-bmn")}
      className="px-6 py-3 rounded-xl bg-slate-300 hover:bg-slate-400"
    >
      Batal
    </button>

    <button
      onClick={simpan}
      className="px-6 py-3 rounded-xl bg-blue-700 hover:bg-blue-800 text-white"
    >
      Simpan Perubahan
    </button>

  </div>

</div>
    </main>
  );
}