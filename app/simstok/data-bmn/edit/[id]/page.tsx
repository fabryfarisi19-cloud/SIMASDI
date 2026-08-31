"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, Save } from "lucide-react";

export default function EditBMNPage() {
  const params = useParams();
  const router = useRouter();

  const id = params?.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [daftarRuangan, setDaftarRuangan] = useState<any[]>([]);

const [form, setForm] = useState({
  kode_barang: "",
  nama_barang: "",
  kategori: "",
  merk: "",
  nup: "",
  ruangan: "",
  penanggung_jawab: "",
  kondisi: "",
  jumlah: 1,
  nilai_perolehan: 0,
  tahun_perolehan: new Date().getFullYear(),
  foto: "",

  // DATA KENDARAAN DINAS
  jenis_kendaraan: "",
  nomor_polisi: "",
  nomor_bpkb: "",
  nomor_stnk: "",
  nomor_rangka: "",
  nomor_mesin: "",
  tahun_pembuatan: new Date().getFullYear(),
  warna: "",
  status_kendaraan: "",
});

  const [fotoBaru, setFotoBaru] = useState<File | null>(null);
  const [preview, setPreview] = useState("");

  useEffect(() => {
    if (id) {
      loadData();
      loadRuangan();
    }
  }, [id]);

  async function loadData() {
    setLoading(true);

    const { data, error } = await supabase
      .from("barang")
      .select("*")
      .eq("id", Number(id))
      .single();

    if (error) {
      console.error("ERROR DATA BMN:", error.message);
      alert("Data BMN tidak ditemukan.");
      router.push("/simstok/data-bmn");
      return;
    }

    if (data) {
    setForm({
  kode_barang: data.kode_barang ?? "",
  nama_barang: data.nama_barang ?? "",
  kategori: data.kategori ?? "",
  merk: data.merk ?? "",
  nup: data.nup ?? "",
  ruangan: data.ruangan ?? "",
  penanggung_jawab:
    data.penanggung_jawab ?? "",
  kondisi: data.kondisi ?? "",
  jumlah: data.jumlah ?? 1,
  nilai_perolehan:
    data.nilai_perolehan ?? 0,
  tahun_perolehan:
    data.tahun_perolehan ??
    new Date().getFullYear(),
  foto: data.foto ?? "",

  // DATA KENDARAAN DINAS
  jenis_kendaraan:
    data.jenis_kendaraan ?? "",
  nomor_polisi:
    data.nomor_polisi ?? "",
  nomor_bpkb:
    data.nomor_bpkb ?? "",
  nomor_stnk:
    data.nomor_stnk ?? "",
  nomor_rangka:
    data.nomor_rangka ?? "",
  nomor_mesin:
    data.nomor_mesin ?? "",
  tahun_pembuatan:
    data.tahun_pembuatan ??
    new Date().getFullYear(),
  warna:
    data.warna ?? "",
  status_kendaraan:
    data.status_kendaraan ?? "",
});
    }

    setLoading(false);
  }

  async function loadRuangan() {
    const { data, error } = await supabase
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

  function updateField(
    field: string,
    value: any
  ) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  function pilihFoto(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = e.target.files?.[0];

    if (!file) return;

    setFotoBaru(file);
    setPreview(URL.createObjectURL(file));
  }

  async function simpan() {

    if (!form.nama_barang) {
      alert("Nama Barang wajib diisi.");
      return;
    }

  if (
  form.kategori !== "Kendaraan Dinas" &&
  !form.ruangan
) {
  alert("Ruangan wajib dipilih.");
  return;
}

    if (!form.kondisi) {
      alert("Kondisi barang wajib dipilih.");
      return;
    }

    setSaving(true);

    try {
      let fotoUrl = form.foto;

      /*
       * UPLOAD FOTO BARU
       */
      if (fotoBaru) {
        const namaFile =
          `${Date.now()}-${fotoBaru.name}`;

        const { error: uploadError } =
          await supabase.storage
            .from("barang")
            .upload(namaFile, fotoBaru);

        if (uploadError) {
          throw uploadError;
        }

        const { data } =
          supabase.storage
            .from("barang")
            .getPublicUrl(namaFile);

        fotoUrl = data.publicUrl;
      }

      /*
       * UPDATE DATA BMN
       */
      const { error } = await supabase
        .from("barang")
      .update({
  kode_barang: form.kode_barang,
  nama_barang: form.nama_barang,
  kategori: form.kategori,
  merk: form.merk,
  nup: form.nup,
  ruangan: form.ruangan,
  penanggung_jawab:
    form.penanggung_jawab,
  kondisi: form.kondisi,
  jumlah: form.jumlah,
  nilai_perolehan:
    form.nilai_perolehan,
  tahun_perolehan:
    form.tahun_perolehan,
  foto: fotoUrl,

  // DATA KENDARAAN DINAS
  jenis_kendaraan:
    form.jenis_kendaraan,
  nomor_polisi:
    form.nomor_polisi,
  nomor_bpkb:
    form.nomor_bpkb,
  nomor_stnk:
    form.nomor_stnk,
  nomor_rangka:
    form.nomor_rangka,
  nomor_mesin:
    form.nomor_mesin,
  tahun_pembuatan:
    form.tahun_pembuatan,
  warna:
    form.warna,
  status_kendaraan:
    form.status_kendaraan,
})
        .eq("id", Number(id));

      if (error) {
        throw error;
      }

      alert(
        "Data BMN berhasil diperbarui."
      );

      router.push(
        `/simstok/data-bmn/${id}`
      );

    } catch (error: any) {
      console.error(error);

      alert(
        error.message ||
          "Gagal menyimpan perubahan."
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

  return (
    <main className="max-w-4xl mx-auto">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">

        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-blue-900">
            Edit Data BMN
          </h1>

          <p className="text-slate-500 mt-2">
            Perbarui data Barang Milik Negara
          </p>
        </div>

        <button
          onClick={() =>
            router.push(
              `/simstok/data-bmn/${id}`
            )
          }
          className="flex items-center justify-center gap-2 bg-slate-200 hover:bg-slate-300 px-5 py-3 rounded-xl"
        >
          <ArrowLeft size={18} />
          Kembali
        </button>

      </div>

      <div className="bg-white rounded-3xl shadow-lg p-8">

        <div className="grid md:grid-cols-2 gap-6">

          {/* KODE */}
          <div>
            <label className="font-semibold">
              Kode Barang
            </label>

            <input
              type="text"
              value={form.kode_barang}
              onChange={(e) =>
                updateField(
                  "kode_barang",
                  e.target.value
                )
              }
              className="w-full border rounded-xl px-4 py-3 mt-2"
            />
          </div>

          {/* NAMA */}
          <div>
            <label className="font-semibold">
              Nama Barang
            </label>

            <input
              type="text"
              value={form.nama_barang}
              onChange={(e) =>
                updateField(
                  "nama_barang",
                  e.target.value
                )
              }
              className="w-full border rounded-xl px-4 py-3 mt-2"
            />
          </div>

          {/* KATEGORI */}
          <div>
            <label className="font-semibold">
              Kategori
            </label>

            <select
              value={form.kategori}
              onChange={(e) =>
                updateField(
                  "kategori",
                  e.target.value
                )
              }
              className="w-full border rounded-xl px-4 py-3 mt-2"
            >
              <option value="">
                Pilih Kategori
              </option>

              <option>
                Tanah
              </option>

              <option>
                Gedung dan Bangunan
              </option>

              <option>
                Peralatan dan Mesin
              </option>
<option>
  Kendaraan Dinas
</option>
              <option>
                Jaringan
              </option>

              <option>
                Aset Tetap Lainnya
              </option>
            </select>
          </div>

          {/* MERK */}
          <div>
            <label className="font-semibold">
              Merk / Tipe
            </label>

            <input
              type="text"
              value={form.merk}
              onChange={(e) =>
                updateField(
                  "merk",
                  e.target.value
                )
              }
              className="w-full border rounded-xl px-4 py-3 mt-2"
            />
          </div>
{/* DATA KENDARAAN DINAS */}
{form.kategori === "Kendaraan Dinas" && (
  <div className="md:col-span-2 border-2 border-blue-100 rounded-2xl p-6 bg-blue-50">

    <h2 className="text-xl font-bold text-blue-900 mb-6">
      🚗 Data Kendaraan Dinas
    </h2>

    <div className="grid md:grid-cols-2 gap-6">

      {/* JENIS KENDARAAN */}
      <div>
        <label className="font-semibold">
          Jenis Kendaraan
        </label>

        <select
          value={form.jenis_kendaraan}
          onChange={(e) =>
            updateField(
              "jenis_kendaraan",
              e.target.value
            )
          }
          className="w-full border rounded-xl px-4 py-3 mt-2"
        >
          <option value="">
            Pilih Jenis Kendaraan
          </option>
          <option value="Mobil">
            Mobil
          </option>
          <option value="Sepeda Motor">
            Sepeda Motor
          </option>
          <option value="Bus">
            Bus
          </option>
          <option value="Kendaraan Khusus">
            Kendaraan Khusus
          </option>
        </select>
      </div>

      {/* NOMOR POLISI */}
      <div>
        <label className="font-semibold">
          Nomor Polisi
        </label>

        <input
          value={form.nomor_polisi}
          onChange={(e) =>
            updateField(
              "nomor_polisi",
              e.target.value.toUpperCase()
            )
          }
          placeholder="Contoh: B 1234 XYZ"
          className="w-full border rounded-xl px-4 py-3 mt-2"
        />
      </div>

      {/* BPKB */}
      <div>
        <label className="font-semibold">
          Nomor BPKB
        </label>

        <input
          value={form.nomor_bpkb}
          onChange={(e) =>
            updateField(
              "nomor_bpkb",
              e.target.value
            )
          }
          className="w-full border rounded-xl px-4 py-3 mt-2"
        />
      </div>

      {/* STNK */}
      <div>
        <label className="font-semibold">
          Nomor STNK
        </label>

        <input
          value={form.nomor_stnk}
          onChange={(e) =>
            updateField(
              "nomor_stnk",
              e.target.value
            )
          }
          className="w-full border rounded-xl px-4 py-3 mt-2"
        />
      </div>

      {/* NOMOR RANGKA */}
      <div>
        <label className="font-semibold">
          Nomor Rangka
        </label>

        <input
          value={form.nomor_rangka}
          onChange={(e) =>
            updateField(
              "nomor_rangka",
              e.target.value.toUpperCase()
            )
          }
          className="w-full border rounded-xl px-4 py-3 mt-2"
        />
      </div>

      {/* NOMOR MESIN */}
      <div>
        <label className="font-semibold">
          Nomor Mesin
        </label>

        <input
          value={form.nomor_mesin}
          onChange={(e) =>
            updateField(
              "nomor_mesin",
              e.target.value.toUpperCase()
            )
          }
          className="w-full border rounded-xl px-4 py-3 mt-2"
        />
      </div>

      {/* TAHUN PEMBUATAN */}
      <div>
        <label className="font-semibold">
          Tahun Pembuatan
        </label>

        <input
          type="number"
          value={form.tahun_pembuatan}
          onChange={(e) =>
            updateField(
              "tahun_pembuatan",
              Number(e.target.value)
            )
          }
          className="w-full border rounded-xl px-4 py-3 mt-2"
        />
      </div>

      {/* WARNA */}
      <div>
        <label className="font-semibold">
          Warna
        </label>

        <input
          value={form.warna}
          onChange={(e) =>
            updateField(
              "warna",
              e.target.value
            )
          }
          placeholder="Contoh: Hitam"
          className="w-full border rounded-xl px-4 py-3 mt-2"
        />
      </div>

      {/* STATUS */}
      <div>
        <label className="font-semibold">
          Status Kendaraan
        </label>

        <select
          value={form.status_kendaraan}
          onChange={(e) =>
            updateField(
              "status_kendaraan",
              e.target.value
            )
          }
          className="w-full border rounded-xl px-4 py-3 mt-2"
        >
          <option value="">
            Pilih Status
          </option>
          <option value="Aktif">
            Aktif
          </option>
          <option value="Tidak Aktif">
            Tidak Aktif
          </option>
          <option value="Dalam Pemeliharaan">
            Dalam Pemeliharaan
          </option>
          <option value="Dihapuskan">
            Dihapuskan
          </option>
        </select>
      </div>

    </div>
  </div>
)}
          {/* NUP */}
          <div>
            <label className="font-semibold">
              Nomor Register (NUP)
            </label>

            <input
              type="text"
              value={form.nup}
              onChange={(e) =>
                updateField(
                  "nup",
                  e.target.value
                )
              }
              className="w-full border rounded-xl px-4 py-3 mt-2"
            />
          </div>

          {/* RUANGAN */}
          <div>
            <label className="font-semibold">
              Ruangan
            </label>

            <select
              value={form.ruangan}
              onChange={(e) =>
                updateField(
                  "ruangan",
                  e.target.value
                )
              }
              className="w-full border rounded-xl px-4 py-3 mt-2"
            >
              <option value="">
                Pilih Ruangan
              </option>

              {daftarRuangan.map(
                (item) => (
                  <option
                    key={item.id}
                    value={item.nama_ruangan}
                  >
                    {item.kode_ruangan} -{" "}
                    {item.nama_ruangan}
                  </option>
                )
              )}
            </select>
          </div>

          {/* PENANGGUNG JAWAB */}
          <div>
            <label className="font-semibold">
              Penanggung Jawab
            </label>

            <input
              type="text"
              value={
                form.penanggung_jawab
              }
              onChange={(e) =>
                updateField(
                  "penanggung_jawab",
                  e.target.value
                )
              }
              className="w-full border rounded-xl px-4 py-3 mt-2"
            />
          </div>

          {/* KONDISI */}
          <div>
            <label className="font-semibold">
              Kondisi
            </label>

            <select
              value={form.kondisi}
              onChange={(e) =>
                updateField(
                  "kondisi",
                  e.target.value
                )
              }
              className="w-full border rounded-xl px-4 py-3 mt-2"
            >
              <option value="">
                Pilih Kondisi
              </option>

              <option value="Baik">
                Baik
              </option>

              <option value="Rusak Ringan">
                Rusak Ringan
              </option>

              <option value="Rusak Berat">
                Rusak Berat
              </option>
            </select>
          </div>

          {/* JUMLAH */}
          <div>
            <label className="font-semibold">
              Jumlah
            </label>

            <input
              type="number"
              min="1"
              value={form.jumlah}
              onChange={(e) =>
                updateField(
                  "jumlah",
                  Number(e.target.value)
                )
              }
              className="w-full border rounded-xl px-4 py-3 mt-2"
            />
          </div>

          {/* NILAI */}
          <div>
            <label className="font-semibold">
              Nilai Perolehan
            </label>

            <input
              type="number"
              min="0"
              value={
                form.nilai_perolehan
              }
              onChange={(e) =>
                updateField(
                  "nilai_perolehan",
                  Number(e.target.value)
                )
              }
              className="w-full border rounded-xl px-4 py-3 mt-2"
            />
          </div>

          {/* TAHUN */}
          <div>
            <label className="font-semibold">
              Tahun Perolehan
            </label>

            <input
              type="number"
              value={
                form.tahun_perolehan
              }
              onChange={(e) =>
                updateField(
                  "tahun_perolehan",
                  Number(e.target.value)
                )
              }
              className="w-full border rounded-xl px-4 py-3 mt-2"
            />
          </div>

        </div>

        {/* FOTO LAMA */}
        <div className="mt-8">

          <label className="font-semibold block mb-3">
            Foto Barang Saat Ini
          </label>

          {form.foto ? (
            <Image
              src={form.foto}
              alt="Foto Barang"
              width={300}
              height={300}
              className="rounded-xl border shadow object-cover"
            />
          ) : (
            <div className="w-[300px] h-[250px] border rounded-xl flex items-center justify-center text-gray-400">
              Belum ada foto
            </div>
          )}

        </div>

        {/* GANTI FOTO */}
        <div className="mt-6">

          <label className="font-semibold block mb-3">
            Ganti Foto Barang
          </label>

          <input
            type="file"
            accept="image/*"
            onChange={pilihFoto}
            className="w-full border rounded-xl p-3"
          />

          {preview && (
            <Image
              src={preview}
              alt="Preview Foto Baru"
              width={300}
              height={300}
              className="mt-4 rounded-xl border shadow object-cover"
            />
          )}

        </div>

        {/* BUTTON */}
        <div className="flex justify-end gap-3 mt-8">

          <button
            onClick={() =>
              router.push(
                `/simstok/data-bmn/${id}`
              )
            }
            disabled={saving}
            className="px-6 py-3 rounded-xl bg-slate-300 hover:bg-slate-400 disabled:opacity-50"
          >
            Batal
          </button>

          <button
            onClick={simpan}
            disabled={saving}
            className="px-6 py-3 rounded-xl bg-blue-700 hover:bg-blue-800 disabled:bg-gray-400 text-white px-8 py-3 rounded-xl flex items-center gap-3"
          >
            <Save size={20} />

            {saving
              ? "Menyimpan..."
              : "Simpan Perubahan"}
          </button>

        </div>

      </div>

    </main>
  );
}