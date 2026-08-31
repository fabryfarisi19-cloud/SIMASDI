"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import { supabase } from "@/lib/supabase";

function TambahBMNForm() {
  const searchParams = useSearchParams();
  const ruanganId = searchParams.get("ruangan");

  const [loading, setLoading] = useState(false);
  const [loadingRuangan, setLoadingRuangan] = useState(true);

  const [daftarRuangan, setDaftarRuangan] = useState<any[]>([]);

  const [kodeBarang, setKodeBarang] = useState("");
  const [namaBarang, setNamaBarang] = useState("");
  const [kategori, setKategori] = useState("");
  const [merk, setMerk] = useState("");
  const [nup, setNup] = useState("");
  const [ruangan, setRuangan] = useState("");
  const [penanggungJawab, setPenanggungJawab] = useState("");
  const [kondisi, setKondisi] = useState("");
  const [jumlah, setJumlah] = useState(1);
  const [nilaiPerolehan, setNilaiPerolehan] = useState(0);

  const [tahunPerolehan, setTahunPerolehan] = useState(
    new Date().getFullYear()
  );
const [jenisKendaraan, setJenisKendaraan] = useState("");
const [nomorPolisi, setNomorPolisi] = useState("");
const [nomorBpkb, setNomorBpkb] = useState("");
const [nomorStnk, setNomorStnk] = useState("");
const [nomorRangka, setNomorRangka] = useState("");
const [nomorMesin, setNomorMesin] = useState("");
const [tahunPembuatan, setTahunPembuatan] = useState(
  new Date().getFullYear()
);
const [warna, setWarna] = useState("");
const [statusKendaraan, setStatusKendaraan] = useState("");
  const [foto, setFoto] = useState<File | null>(null);
  const [preview, setPreview] = useState("");

  /*
   * LOAD RUANGAN
   */
  useEffect(() => {
    loadRuangan();
  }, []);

  /*
   * Jika datang dari halaman ruangan:
   * /simstok/data-bmn/tambah?ruangan=5
   *
   * maka otomatis pilih ruangan tersebut.
   */
  useEffect(() => {
    if (
      ruanganId &&
      daftarRuangan.length > 0
    ) {
      const selected = daftarRuangan.find(
        (item) => String(item.id) === String(ruanganId)
      );

      if (selected) {
        setRuangan(selected.nama_ruangan);
      }
    }
  }, [ruanganId, daftarRuangan]);

  async function loadRuangan() {
    setLoadingRuangan(true);

    const { data, error } = await supabase
      .from("ruangan")
      .select("id, kode_ruangan, nama_ruangan, lantai")
      .order("kode_ruangan");

    if (error) {
      console.error("ERROR RUANGAN:", error.message);
      setLoadingRuangan(false);
      return;
    }

    setDaftarRuangan(data || []);
    setLoadingRuangan(false);
  }

  /*
   * PILIH FOTO
   */
  function pilihFoto(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = e.target.files?.[0];

    if (!file) return;

    setFoto(file);
    setPreview(URL.createObjectURL(file));
  }

  /*
   * SIMPAN BMN
   */
async function simpanBarang() {
  if (!namaBarang) {
    alert("Nama Barang wajib diisi.");
    return;
  }

  // Ruangan wajib untuk barang biasa,
  // tetapi TIDAK wajib untuk Kendaraan Dinas
  if (kategori !== "Kendaraan Dinas" && !ruangan) {
    alert("Ruangan wajib dipilih.");
    return;
  }

  if (!kondisi) {
    alert("Kondisi barang wajib dipilih.");
    return;
  }

  setLoading(true);

    try {
      let fotoUrl = "";

      /*
       * UPLOAD FOTO
       */
      if (foto) {
        const namaFile = `${Date.now()}-${foto.name}`;

        const { error: uploadError } =
          await supabase.storage
            .from("barang")
            .upload(namaFile, foto);

        if (uploadError) {
          throw uploadError;
        }

        const { data } = supabase.storage
          .from("barang")
          .getPublicUrl(namaFile);

        fotoUrl = data.publicUrl;
      }

      /*
       * SIMPAN DATABASE
       */
    const { error } = await supabase
  .from("barang")
  .insert({
    kode_barang: kodeBarang,
    nama_barang: namaBarang,
    kategori: kategori,
    merk: merk,
    nup: nup,
    ruangan: ruangan,
    penanggung_jawab: penanggungJawab,
    kondisi: kondisi,
    jumlah: jumlah,
    nilai_perolehan: nilaiPerolehan,
    tahun_perolehan: tahunPerolehan,
    foto: fotoUrl,

    // DATA KENDARAAN DINAS
    jenis_kendaraan: jenisKendaraan,
    nomor_polisi: nomorPolisi,
    nomor_bpkb: nomorBpkb,
    nomor_stnk: nomorStnk,
    nomor_rangka: nomorRangka,
    nomor_mesin: nomorMesin,
    tahun_pembuatan: tahunPembuatan,
    warna: warna,
    status_kendaraan: statusKendaraan,
  });

      if (error) {
        throw error;
      }

      alert(
        "Data BMN berhasil disimpan."
      );

      /*
       * KEMBALI KE DATA BMN
       */
      window.location.href =
        "/simstok/data-bmn";

    } catch (err: any) {
      console.error(err);

      alert(
        err.message ||
          "Terjadi kesalahan saat menyimpan data."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">

        <div>
          <h1 className="text-4xl font-bold text-blue-900">
            Tambah Barang BMN
          </h1>

          <p className="text-slate-500 mt-2">
            Input data Barang Milik Negara
          </p>
        </div>

        <Link
          href="/simstok/data-bmn"
          className="flex items-center gap-2 bg-slate-200 hover:bg-slate-300 px-5 py-3 rounded-xl"
        >
          <ArrowLeft size={18} />
          Kembali
        </Link>

      </div>

      {/* FORM */}
      <div className="bg-white rounded-3xl shadow-lg p-8">

        <div className="grid md:grid-cols-2 gap-6">

          {/* KODE */}
          <div>
            <label className="font-semibold">
              Kode Barang
            </label>

            <input
              value={kodeBarang}
              onChange={(e) =>
                setKodeBarang(e.target.value)
              }
              placeholder="Contoh: 3.10.01.01"
              className="w-full border rounded-xl p-3 mt-2"
            />
          </div>

          {/* NAMA */}
          <div>
            <label className="font-semibold">
              Nama Barang
            </label>

            <input
              value={namaBarang}
              onChange={(e) =>
                setNamaBarang(e.target.value)
              }
              placeholder="Nama barang"
              className="w-full border rounded-xl p-3 mt-2"
            />
          </div>

          {/* KATEGORI */}
          <div>
            <label className="font-semibold">
              Kategori
            </label>

            <select
              value={kategori}
              onChange={(e) =>
                setKategori(e.target.value)
              }
              className="w-full border rounded-xl p-3 mt-2"
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
              value={merk}
              onChange={(e) =>
                setMerk(e.target.value)
              }
              placeholder="Merk / tipe"
              className="w-full border rounded-xl p-3 mt-2"
            />
          </div>
{/* DATA KENDARAAN DINAS */}
{kategori === "Kendaraan Dinas" && (
  <div className="md:col-span-2 border-2 border-blue-100 rounded-2xl p-6 bg-blue-50">

    <h2 className="text-xl font-bold text-blue-900 mb-5">
      Data Kendaraan Dinas
    </h2>

    <div className="grid md:grid-cols-2 gap-6">

      {/* JENIS KENDARAAN */}
      <div>
        <label className="font-semibold">
          Jenis Kendaraan
        </label>

        <select
          value={jenisKendaraan}
          onChange={(e) =>
            setJenisKendaraan(e.target.value)
          }
          className="w-full border rounded-xl p-3 mt-2 bg-white"
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
          value={nomorPolisi}
          onChange={(e) =>
            setNomorPolisi(e.target.value.toUpperCase())
          }
          placeholder="Contoh: B 1234 XYZ"
          className="w-full border rounded-xl p-3 mt-2"
        />
      </div>

      {/* BPKB */}
      <div>
        <label className="font-semibold">
          Nomor BPKB
        </label>

        <input
          value={nomorBpkb}
          onChange={(e) =>
            setNomorBpkb(e.target.value)
          }
          placeholder="Nomor BPKB"
          className="w-full border rounded-xl p-3 mt-2"
        />
      </div>

      {/* STNK */}
      <div>
        <label className="font-semibold">
          Nomor STNK
        </label>

        <input
          value={nomorStnk}
          onChange={(e) =>
            setNomorStnk(e.target.value)
          }
          placeholder="Nomor STNK"
          className="w-full border rounded-xl p-3 mt-2"
        />
      </div>

      {/* NOMOR RANGKA */}
      <div>
        <label className="font-semibold">
          Nomor Rangka
        </label>

        <input
          value={nomorRangka}
          onChange={(e) =>
            setNomorRangka(e.target.value.toUpperCase())
          }
          placeholder="Nomor rangka kendaraan"
          className="w-full border rounded-xl p-3 mt-2"
        />
      </div>

      {/* NOMOR MESIN */}
      <div>
        <label className="font-semibold">
          Nomor Mesin
        </label>

        <input
          value={nomorMesin}
          onChange={(e) =>
            setNomorMesin(e.target.value.toUpperCase())
          }
          placeholder="Nomor mesin kendaraan"
          className="w-full border rounded-xl p-3 mt-2"
        />
      </div>

      {/* TAHUN PEMBUATAN */}
      <div>
        <label className="font-semibold">
          Tahun Pembuatan
        </label>

        <input
          type="number"
          value={tahunPembuatan}
          onChange={(e) =>
            setTahunPembuatan(
              Number(e.target.value)
            )
          }
          className="w-full border rounded-xl p-3 mt-2"
        />
      </div>

      {/* WARNA */}
      <div>
        <label className="font-semibold">
          Warna
        </label>

        <input
          value={warna}
          onChange={(e) =>
            setWarna(e.target.value)
          }
          placeholder="Contoh: Hitam"
          className="w-full border rounded-xl p-3 mt-2"
        />
      </div>

      {/* STATUS KENDARAAN */}
      <div>
        <label className="font-semibold">
          Status Kendaraan
        </label>

        <select
          value={statusKendaraan}
          onChange={(e) =>
            setStatusKendaraan(e.target.value)
          }
          className="w-full border rounded-xl p-3 mt-2 bg-white"
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
              value={nup}
              onChange={(e) =>
                setNup(e.target.value)
              }
              placeholder="Nomor NUP"
              className="w-full border rounded-xl p-3 mt-2"
            />
          </div>

          {/* RUANGAN */}
          <div>
            <label className="font-semibold">
              Ruangan
            </label>

            <select
              value={ruangan}
              onChange={(e) =>
                setRuangan(e.target.value)
              }
              disabled={loadingRuangan}
              className="w-full border rounded-xl p-3 mt-2 bg-white"
            >
              <option value="">
                {loadingRuangan
                  ? "Memuat ruangan..."
                  : "Pilih Ruangan"}
              </option>

              {daftarRuangan.map(
                (item) => (
                  <option
                    key={item.id}
                    value={
                      item.nama_ruangan
                    }
                  >
                    {item.kode_ruangan} -{" "}
                    {item.nama_ruangan}
                  </option>
                )
              )}
            </select>

            {ruanganId && ruangan && (
              <p className="text-xs text-green-600 mt-2">
                ✓ Ruangan otomatis dipilih
              </p>
            )}
          </div>

          {/* PENANGGUNG JAWAB */}
          <div>
            <label className="font-semibold">
              Penanggung Jawab
            </label>

            <input
              value={penanggungJawab}
              onChange={(e) =>
                setPenanggungJawab(
                  e.target.value
                )
              }
              placeholder="Nama penanggung jawab"
              className="w-full border rounded-xl p-3 mt-2"
            />
          </div>

          {/* KONDISI */}
          <div>
            <label className="font-semibold">
              Kondisi
            </label>

            <select
              value={kondisi}
              onChange={(e) =>
                setKondisi(e.target.value)
              }
              className="w-full border rounded-xl p-3 mt-2"
            >
              <option value="">
                Pilih Kondisi
              </option>

              <option>
                Baik
              </option>

              <option>
                Rusak Ringan
              </option>

              <option>
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
              value={jumlah}
              onChange={(e) =>
                setJumlah(
                  Number(e.target.value)
                )
              }
              className="w-full border rounded-xl p-3 mt-2"
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
              value={nilaiPerolehan}
              onChange={(e) =>
                setNilaiPerolehan(
                  Number(e.target.value)
                )
              }
              className="w-full border rounded-xl p-3 mt-2"
            />
          </div>

          {/* TAHUN */}
          <div>
            <label className="font-semibold">
              Tahun Perolehan
            </label>

            <input
              type="number"
              value={tahunPerolehan}
              onChange={(e) =>
                setTahunPerolehan(
                  Number(e.target.value)
                )
              }
              className="w-full border rounded-xl p-3 mt-2"
            />
          </div>

          {/* FOTO */}
          <div>
            <label className="font-semibold">
              Foto Barang
            </label>

            <input
              type="file"
              accept="image/*"
              onChange={pilihFoto}
              className="w-full border rounded-xl p-3 mt-2"
            />

            {preview && (
              <Image
                src={preview}
                alt="Preview"
                width={250}
                height={250}
                className="mt-4 rounded-xl border object-cover"
              />
            )}
          </div>

        </div>

        {/* SIMPAN */}
        <div className="mt-8">

          <button
            onClick={simpanBarang}
            disabled={loading}
            className="bg-blue-700 hover:bg-blue-800 disabled:bg-gray-400 text-white px-8 py-4 rounded-xl flex items-center gap-3"
          >

            <Save size={20} />

            {loading
              ? "Menyimpan..."
              : "Simpan Barang"}

          </button>

        </div>

      </div>

    </main>
  );
}
export default function TambahBMN() {
  return (
    <Suspense
      fallback={
        <main className="p-6">
          <p className="text-slate-500">
            Memuat halaman Tambah BMN...
          </p>
        </main>
      }
    >
      <TambahBMNForm />
    </Suspense>
  );
}