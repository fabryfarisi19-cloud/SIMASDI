"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { ArrowLeft, PackagePlus } from "lucide-react";

export default function BarangMasukPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    kode_barang: "",
    nama_barang: "",
    kategori: "",
    merk: "",
    nup: "",
    ruangan: "",
    penanggung_jawab: "",
    kondisi: "Baik",
    jumlah: 1,
    nilai_perolehan: "",
    tahun_perolehan: new Date().getFullYear(),
  });

  const [saving, setSaving] = useState(false);

  function ubah(
    field: string,
    value: string | number
  ) {
    setForm({
      ...form,
      [field]: value,
    });
  }

  async function simpan() {
    if (!form.kode_barang || !form.nama_barang) {
      alert("Kode Barang dan Nama Barang wajib diisi.");
      return;
    }

    setSaving(true);

    const { error } = await supabase
      .from("barang")
      .insert({
        kode_barang: form.kode_barang,
        nama_barang: form.nama_barang,
        kategori: form.kategori || null,
        merk: form.merk || null,
        nup: form.nup || null,
        ruangan: form.ruangan || null,
        penanggung_jawab:
          form.penanggung_jawab || null,
        kondisi: form.kondisi,
        jumlah: Number(form.jumlah),
        nilai_perolehan:
          Number(form.nilai_perolehan) || 0,
        tahun_perolehan:
          Number(form.tahun_perolehan),
      });

    if (error) {
      console.error("ERROR BARANG MASUK:", error);
      alert(error.message);
      setSaving(false);
      return;
    }

    alert("Barang berhasil ditambahkan.");

    router.push("/simstok/data-bmn");
    router.refresh();
  }

  return (
    <main className="max-w-5xl mx-auto">

      <div className="flex justify-between items-center mb-6">

        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 bg-white border px-5 py-3 rounded-xl"
        >
          <ArrowLeft size={18} />
          Kembali
        </button>

        <div className="flex items-center gap-3">

          <PackagePlus
            className="text-blue-700"
            size={30}
          />

          <h1 className="text-3xl font-bold text-blue-900">
            Barang Masuk
          </h1>

        </div>

      </div>

      <div className="bg-white rounded-3xl shadow-lg p-8">

        <h2 className="text-xl font-bold text-slate-800 mb-6">
          Input Barang Masuk
        </h2>

        <div className="grid md:grid-cols-2 gap-5">

          <Input
            label="Kode Barang"
            value={form.kode_barang}
            onChange={(v) =>
              ubah("kode_barang", v)
            }
          />

          <Input
            label="Nama Barang"
            value={form.nama_barang}
            onChange={(v) =>
              ubah("nama_barang", v)
            }
          />

          <Input
            label="Kategori"
            value={form.kategori}
            onChange={(v) =>
              ubah("kategori", v)
            }
          />

          <Input
            label="Merk"
            value={form.merk}
            onChange={(v) =>
              ubah("merk", v)
            }
          />

          <Input
            label="NUP"
            value={form.nup}
            onChange={(v) =>
              ubah("nup", v)
            }
          />

          <Input
            label="Ruangan"
            value={form.ruangan}
            onChange={(v) =>
              ubah("ruangan", v)
            }
          />

          <Input
            label="Penanggung Jawab"
            value={form.penanggung_jawab}
            onChange={(v) =>
              ubah("penanggung_jawab", v)
            }
          />

          <div>
            <label className="font-semibold block mb-2">
              Kondisi
            </label>

            <select
              value={form.kondisi}
              onChange={(e) =>
                ubah("kondisi", e.target.value)
              }
              className="w-full border rounded-xl px-4 py-3"
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

          <Input
            label="Jumlah"
            type="number"
            value={form.jumlah}
            onChange={(v) =>
              ubah("jumlah", Number(v))
            }
          />

          <Input
            label="Nilai Perolehan"
            type="number"
            value={form.nilai_perolehan}
            onChange={(v) =>
              ubah("nilai_perolehan", v)
            }
          />

          <Input
            label="Tahun Perolehan"
            type="number"
            value={form.tahun_perolehan}
            onChange={(v) =>
              ubah(
                "tahun_perolehan",
                Number(v)
              )
            }
          />

        </div>

        <div className="flex justify-end gap-3 mt-8">

          <button
            onClick={() =>
              router.push("/simstok/data-bmn")
            }
            className="px-6 py-3 rounded-xl bg-slate-200"
          >
            Batal
          </button>

          <button
            onClick={simpan}
            disabled={saving}
            className="px-6 py-3 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-semibold disabled:opacity-50"
          >
            {saving ? "Menyimpan..." : "Simpan Barang"}
          </button>

        </div>

      </div>

    </main>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="font-semibold block mb-2">
        {label}
      </label>

      <input
        type={type}
        value={value}
        onChange={(e) =>
          onChange(e.target.value)
        }
        className="w-full border rounded-xl px-4 py-3"
      />
    </div>
  );
}