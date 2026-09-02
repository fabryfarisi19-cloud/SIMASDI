"use client";

import { useEffect, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
pdfjsLib.GlobalWorkerOptions.workerSrc =
  `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
import { supabase } from "@/lib/supabase";
import {
  Plus,
  Pencil,
  Trash2,
  CalendarDays,
  Users,
  Search,
  Volume2,
  FileText,
} from "lucide-react";

type JadwalApel = {
  id: string;
  tanggal: string;
  nama_petugas: string;
  jabatan: string | null;
  tugas: string;
  jam_apel: string;
  lokasi: string | null;
  aktif: boolean;
};
type JadwalApelBulanan = {
  id: number;
  bulan: number;
  tahun: number;
  nama_file: string | null;
  file_pdf: string | null;
};
const daftarTugas = [
  "Pembina Apel",
  "Komandan Apel",
  "Pembaca Doa",
  "Pengucap Tri Dharma PAS",
  "Pengucap Ikrar Petugas",
  "Operator Lagu Apel",
  "Laporan Atensi",
  "Cadangan Petugas",
  "Humas",
];

export default function JadwalApelPage() {
  const [data, setData] = useState<JadwalApel[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [pdfBulanan, setPdfBulanan] =
    useState<JadwalApelBulanan | null>(null);
  const [bulanPdf, setBulanPdf] =
    useState(new Date().getMonth() + 1);
  const [tahunPdf, setTahunPdf] =
    useState(new Date().getFullYear());
    const [uploadingPdf, setUploadingPdf] =
  useState(false);
  const [hasilBacaPdf, setHasilBacaPdf] = useState("");
  async function bacaTeksPdf(file: File) {
  const arrayBuffer = await file.arrayBuffer();

  const pdf = await pdfjsLib.getDocument({
    data: arrayBuffer,
  }).promise;

  let teksLengkap = "";

  for (let i = 1; i <= pdf.numPages; i++) {
    const halaman = await pdf.getPage(i);
    const content = await halaman.getTextContent();

    let baris: {
      y: number;
      teks: string;
    }[] = [];

    content.items.forEach((item: any) => {
      if (!item.str || !item.str.trim()) return;

      const y = item.transform?.[5] ?? 0;

      const terakhir = baris[baris.length - 1];

      if (terakhir && Math.abs(terakhir.y - y) < 3) {
        terakhir.teks += " " + item.str.trim();
      } else {
        baris.push({
          y,
          teks: item.str.trim(),
        });
      }
    });

    // PDF biasanya dibaca dari atas ke bawah
    baris.sort((a, b) => b.y - a.y);

    teksLengkap +=
      baris.map((item) => item.teks).join("\n") + "\n";
  }

  return teksLengkap;
}
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<JadwalApel | null>(null);

  const [form, setForm] = useState({
    tanggal: "",
    nama_petugas: "",
    jabatan: "",
    tugas: "",
    jam_apel: "08:00",
    lokasi:
      "Halaman Ghriya Abhipraya Bapas Kelas I Jakarta Barat",
  });
async function loadData() {
  setLoading(true);

  const tanggalAwal = `${tahunPdf}-${String(bulanPdf).padStart(2, "0")}-01`;

  const tanggalAkhir = new Date(
    tahunPdf,
    bulanPdf,
    1
  ).toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("jadwal_apel")
    .select("*")
    .gte("tanggal", tanggalAwal)
    .lt("tanggal", tanggalAkhir)
    .order("tanggal", { ascending: true });

    if (error) {
      console.error(error);
      alert("Gagal mengambil data jadwal apel");
    } else {
      setData(data || []);
    }

    setLoading(false);
  }

useEffect(() => {
  loadData();
  loadPdfBulanan();
}, []);
async function loadPdfBulanan() {
  const { data, error } = await supabase
    .from("jadwal_apel_bulanan")
    .select("*")
    .eq("bulan", bulanPdf)
    .eq("tahun", tahunPdf)
    .maybeSingle();

  if (error) {
    console.error("Gagal mengambil PDF:", error);
    return;
  }

  setPdfBulanan(data);
}
useEffect(() => {
  loadPdfBulanan();
}, [bulanPdf, tahunPdf]);
async function uploadPdfBulanan(
  e: React.ChangeEvent<HTMLInputElement>
) {
  const file = e.target.files?.[0];
  console.log("FILE DIPILIH:", file);
  if (!file) return;
const teksPdf = await bacaTeksPdf(file);
setHasilBacaPdf(teksPdf);
console.log("=== HASIL BACA PDF ===");
console.log(teksPdf);
alert(teksPdf.slice(0, 3000));
const responseImport = await fetch(
  "/api/jadwal-apel/import-pdf",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text: teksPdf,
    }),
  }
);

const hasilImport = await responseImport.json();

if (responseImport.ok) {
  alert(
    `✅ Berhasil mengimpor ${hasilImport.jumlah} data jadwal apel dari PDF.`
  );
}

if (!responseImport.ok) {
  alert(
    hasilImport.message ||
      "Gagal mengimpor jadwal dari PDF."
  );
  return;
}

await loadData();
  if (file.type !== "application/pdf") {
    alert("File harus berupa PDF.");
    return;
  }

  setUploadingPdf(true);

  try {
    const namaFile = `jadwal-apel-${tahunPdf}-${String(
      bulanPdf
    ).padStart(2, "0")}.pdf`;

    const path = `${tahunPdf}/${String(bulanPdf).padStart(
      2,
      "0"
    )}/${namaFile}`;

    const { error } = await supabase.storage
      .from("jadwal-apel")
      .upload(path, file, {
        upsert: true,
        contentType: "application/pdf",
      });

    if (error) {
      console.error("UPLOAD PDF ERROR:", error);
      alert("Gagal upload PDF.");
      return;
    }

    const { data: urlData } = supabase.storage
      .from("jadwal-apel")
      .getPublicUrl(path);

    const fileUrl = urlData.publicUrl;

    const { error: dbError } = await supabase
      .from("jadwal_apel_bulanan")
      .upsert(
        {
          bulan: bulanPdf,
          tahun: tahunPdf,
          nama_file: file.name,
          file_pdf: fileUrl,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "bulan,tahun",
        }
      );

    if (dbError) {
      console.error("DATABASE PDF ERROR:", dbError);
      alert("PDF terupload tetapi gagal menyimpan data.");
      return;
    }

    alert("PDF jadwal apel berhasil diupload.");

    await loadPdfBulanan();
  } finally {
    setUploadingPdf(false);
    e.target.value = "";
  }
}
  function resetForm() {
    setForm({
      tanggal: "",
      nama_petugas: "",
      jabatan: "",
      tugas: "",
      jam_apel: "08:00",
      lokasi:
        "Halaman Ghriya Abhipraya Bapas Kelas I Jakarta Barat",
    });

    setEditing(null);
  }

  function bukaTambah() {
    resetForm();
    setShowForm(true);
  }

  function bukaEdit(item: JadwalApel) {
    setEditing(item);

    setForm({
      tanggal: item.tanggal,
      nama_petugas: item.nama_petugas,
      jabatan: item.jabatan || "",
      tugas: item.tugas,
      jam_apel: item.jam_apel?.slice(0, 5) || "08:00",
      lokasi: item.lokasi || "",
    });

    setShowForm(true);
  }
async function hapusPdfBulanan() {
  if (!pdfBulanan?.file_pdf) return;

  const yakin = confirm(
    `Yakin ingin menghapus PDF "${pdfBulanan.nama_file}" beserta data jadwal bulan tersebut?`
  );

  if (!yakin) return;

  try {
    // 1. Ambil path file dari URL Storage
    const marker = "/storage/v1/object/public/jadwal-apel/";
    const index = pdfBulanan.file_pdf.indexOf(marker);

    if (index === -1) {
      alert("Lokasi file PDF tidak valid.");
      return;
    }

    const path = decodeURIComponent(
      pdfBulanan.file_pdf.substring(index + marker.length)
    );

    console.log("PATH HAPUS PDF:", path);

    // 2. Hapus file PDF dari Storage
    const { data: removedFiles, error: storageError } =
      await supabase.storage
        .from("jadwal-apel")
        .remove([path]);

    console.log("HASIL HAPUS STORAGE:", removedFiles);

    if (storageError) {
      console.error("HAPUS STORAGE ERROR:", storageError);

      alert(
        `Gagal menghapus file Storage: ${storageError.message}`
      );

      return;
    }

    // 3. Hapus data jadwal pada bulan dan tahun yang dipilih
    const tanggalAwal = `${tahunPdf}-${String(
      bulanPdf
    ).padStart(2, "0")}-01`;

    const tanggalAkhirDate = new Date(
      tahunPdf,
      bulanPdf,
      1
    );

    const tanggalAkhir = `${tanggalAkhirDate.getFullYear()}-${String(
      tanggalAkhirDate.getMonth() + 1
    ).padStart(2, "0")}-01`;

    const { error: jadwalError } = await supabase
      .from("jadwal_apel")
      .delete()
      .gte("tanggal", tanggalAwal)
      .lt("tanggal", tanggalAkhir);

    if (jadwalError) {
      console.error(
        "HAPUS DATA JADWAL ERROR:",
        jadwalError
      );

      alert(
        `PDF sudah dihapus, tetapi data jadwal gagal dihapus: ${jadwalError.message}`
      );

      return;
    }

    // 4. Hapus metadata PDF dari database
    const { error: dbError } = await supabase
      .from("jadwal_apel_bulanan")
      .delete()
      .eq("id", pdfBulanan.id);

    if (dbError) {
      console.error(
        "HAPUS DATABASE ERROR:",
        dbError
      );

      alert(
        "File PDF dan jadwal sudah dihapus, tetapi data metadata PDF gagal dihapus."
      );

      return;
    }

    // 5. Bersihkan tampilan
    setPdfBulanan(null);
    setData([]);

    alert(
      `PDF dan seluruh jadwal apel ${bulanPdf}/${tahunPdf} berhasil dihapus.`
    );

  } catch (error) {
    console.error(
      "HAPUS PDF ERROR:",
      error
    );

    alert("Terjadi kesalahan saat menghapus PDF.");
  }
}
  async function simpanData(e: React.FormEvent) {
    e.preventDefault();

    if (
      !form.tanggal ||
      !form.nama_petugas ||
      !form.tugas
    ) {
      alert("Tanggal, nama petugas dan tugas wajib diisi.");
      return;
    }

    if (editing) {
      const { error } = await supabase
        .from("jadwal_apel")
        .update({
          tanggal: form.tanggal,
          nama_petugas: form.nama_petugas,
          jabatan: form.jabatan,
          tugas: form.tugas,
          jam_apel: form.jam_apel,
          lokasi: form.lokasi,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editing.id);

      if (error) {
        console.error(error);
        alert("Gagal mengubah jadwal.");
        return;
      }
    } else {
      const { error } = await supabase
        .from("jadwal_apel")
        .insert({
          tanggal: form.tanggal,
          nama_petugas: form.nama_petugas,
          jabatan: form.jabatan,
          tugas: form.tugas,
          jam_apel: form.jam_apel,
          lokasi: form.lokasi,
          aktif: true,
        });

      if (error) {
     console.error(
  "ERROR SIMPAN JADWAL:",
  JSON.stringify(error, null, 2)
);
        alert("Gagal menambahkan jadwal.");
        return;
      }
    }

    setShowForm(false);
    resetForm();
    loadData();
  }

  async function hapusData(id: string) {
    const yakin = confirm(
      "Yakin ingin menghapus jadwal petugas ini?"
    );

    if (!yakin) return;

    const { error } = await supabase
      .from("jadwal_apel")
      .delete()
      .eq("id", id);

    if (error) {
      console.error(error);
      alert("Gagal menghapus data.");
      return;
    }

    loadData();
  }

  const filteredData = data.filter((item) => {
    const keyword = search.toLowerCase();

    return (
      item.nama_petugas
        .toLowerCase()
        .includes(keyword) ||
      (item.jabatan || "")
        .toLowerCase()
        .includes(keyword) ||
      item.tugas
        .toLowerCase()
        .includes(keyword)
    );
  });

  const groupedData = filteredData.reduce(
    (acc: Record<string, JadwalApel[]>, item) => {
      if (!acc[item.tanggal]) {
        acc[item.tanggal] = [];
      }

      acc[item.tanggal].push(item);

      return acc;
    },
    {}
  );

  function formatTanggal(tanggal: string) {
    return new Date(
      `${tanggal}T00:00:00`
    ).toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  return (
    <div className="p-4 md:p-6 space-y-6">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

        <div>
          <h1 className="text-2xl font-bold">
            Jadwal Petugas Apel
          </h1>

          <p className="text-sm text-gray-500 mt-1">
            Pengelolaan jadwal dan petugas apel Bapas
            Kelas I Jakarta Barat
          </p>
        </div>

        <button
          onClick={bukaTambah}
          className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-white hover:bg-blue-700"
        >
          <Plus size={18} />
          Tambah Jadwal
        </button>
      </div>
{/* PDF JADWAL APEL BULANAN */}
{/* PDF JADWAL APEL BULANAN */}
<div className="rounded-2xl bg-white border shadow-sm p-5">

  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

    <div>
      <h2 className="text-lg font-bold">
        PDF Jadwal Apel Bulanan
      </h2>
<div className="flex flex-wrap gap-2 mt-2">
  <select
    value={bulanPdf}
    onChange={(e) => setBulanPdf(Number(e.target.value))}
    className="rounded-lg border px-3 py-2 text-sm"
  >
    {[
      "Januari",
      "Februari",
      "Maret",
      "April",
      "Mei",
      "Juni",
      "Juli",
      "Agustus",
      "September",
      "Oktober",
      "November",
      "Desember",
    ].map((nama, index) => (
      <option key={index + 1} value={index + 1}>
        {nama}
      </option>
    ))}
  </select>

  <select
    value={tahunPdf}
    onChange={(e) => setTahunPdf(Number(e.target.value))}
    className="rounded-lg border px-3 py-2 text-sm"
  >
    {Array.from(
      { length: 5 },
      (_, i) => new Date().getFullYear() - 2 + i
    ).map((tahun) => (
      <option key={tahun} value={tahun}>
        {tahun}
      </option>
    ))}
  </select>
</div>

      {pdfBulanan && (
        <p className="text-sm text-green-600 mt-2">
          ✓ {pdfBulanan.nama_file}
        </p>
      )}
    </div>

    <div className="flex flex-wrap gap-2">

      {pdfBulanan?.file_pdf && (
        <a
          href={pdfBulanan.file_pdf}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-white hover:bg-blue-700"
        >
          <FileText size={18} />
          Lihat PDF
        </a>
      )}
{pdfBulanan?.file_pdf && (
  <button
    type="button"
    onClick={hapusPdfBulanan}
    className="flex items-center gap-2 rounded-xl bg-gray-700 px-4 py-3 text-white hover:bg-gray-800"
  >
    <Trash2 size={18} />
    Hapus PDF
  </button>
)}
      <label className="flex items-center justify-center gap-2 cursor-pointer rounded-xl bg-red-600 px-4 py-3 text-white hover:bg-red-700">

        <FileText size={18} />

        {uploadingPdf
          ? "Mengupload..."
          : pdfBulanan
          ? "Ganti PDF"
          : "Upload PDF"}

        <input
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={uploadPdfBulanan}
          disabled={uploadingPdf}
        />

      </label>

    </div>

  </div>

</div>
      {/* STATISTIK */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

        <div className="rounded-2xl bg-white p-5 shadow-sm border">
          <div className="flex items-center gap-3">
            <CalendarDays className="text-blue-600" />
            <div>
              <p className="text-sm text-gray-500">
                Jadwal
              </p>
              <p className="text-2xl font-bold">
                {Object.keys(groupedData).length}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm border">
          <div className="flex items-center gap-3">
            <Users className="text-green-600" />
            <div>
              <p className="text-sm text-gray-500">
                Petugas
              </p>
              <p className="text-2xl font-bold">
                {data.length}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm border">
          <div className="flex items-center gap-3">
            <Volume2 className="text-orange-600" />
            <div>
              <p className="text-sm text-gray-500">
                Status
              </p>
              <p className="text-lg font-bold">
                Otomatis
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* SEARCH */}
      <div className="relative">
        <Search
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />

        <input
          type="text"
          placeholder="Cari nama petugas, jabatan atau tugas..."
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
          className="w-full rounded-xl border bg-white py-3 pl-10 pr-4 outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* DATA */}
      {loading ? (
        <div className="text-center py-10 text-gray-500">
          Memuat jadwal...
        </div>
      ) : Object.keys(groupedData).length === 0 ? (
        <div className="rounded-2xl bg-white border p-10 text-center">
          <CalendarDays
            className="mx-auto text-gray-400"
            size={40}
          />

          <p className="mt-3 text-gray-500">
            Belum ada jadwal apel.
          </p>
        </div>
      ) : (
        Object.entries(groupedData).map(
          ([tanggal, petugas]) => (
            <div
              key={tanggal}
              className="rounded-2xl bg-white border shadow-sm overflow-hidden"
            >

              {/* TANGGAL */}
              <div className="bg-gray-100 px-5 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2">

                <div>
                  <h2 className="font-bold text-lg">
                    {formatTanggal(tanggal)}
                  </h2>

                  <p className="text-sm text-gray-500">
                    {petugas[0]?.jam_apel?.slice(
                      0,
                      5
                    )} WIB
                  </p>
                </div>

                <span className="text-sm text-gray-600">
                  {petugas.length} petugas
                </span>

              </div>

              {/* LIST PETUGAS */}
              <div className="divide-y">

                {petugas.map((item, index) => (
                  <div
                    key={item.id}
                    className="p-4 flex flex-col md:flex-row md:items-center gap-4"
                  >

                    <div className="w-8 text-gray-400 font-medium">
                      {index + 1}
                    </div>

                    <div className="flex-1">
                      <p className="font-semibold">
                        {item.nama_petugas}
                      </p>

                      <p className="text-sm text-gray-500">
                        {item.jabatan || "-"}
                      </p>
                    </div>

                    <div className="md:w-56">
                      <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-sm text-blue-700">
                        {item.tugas}
                      </span>
                    </div>

                    <div className="flex gap-2">

                      <button
                        onClick={() =>
                          bukaEdit(item)
                        }
                        className="rounded-lg border p-2 hover:bg-gray-100"
                        title="Edit"
                      >
                        <Pencil size={17} />
                      </button>

                      <button
                        onClick={() =>
                          hapusData(item.id)
                        }
                        className="rounded-lg border p-2 text-red-600 hover:bg-red-50"
                        title="Hapus"
                      >
                        <Trash2 size={17} />
                      </button>

                    </div>

                  </div>
                ))}

              </div>
            </div>
          )
        )
      )}

      {/* MODAL FORM */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">

            <div className="border-b p-5">
              <h2 className="text-xl font-bold">
                {editing
                  ? "Edit Jadwal Apel"
                  : "Tambah Jadwal Apel"}
              </h2>
            </div>

            <form
              onSubmit={simpanData}
              className="space-y-4 p-5"
            >

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Tanggal
                </label>

                <input
                  type="date"
                  value={form.tanggal}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      tanggal: e.target.value,
                    })
                  }
                  className="w-full rounded-xl border px-3 py-3"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Nama Petugas
                </label>

                <input
                  type="text"
                  value={form.nama_petugas}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      nama_petugas: e.target.value,
                    })
                  }
                  placeholder="Nama lengkap"
                  className="w-full rounded-xl border px-3 py-3"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Jabatan
                </label>

                <input
                  type="text"
                  value={form.jabatan}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      jabatan: e.target.value,
                    })
                  }
                  placeholder="Jabatan"
                  className="w-full rounded-xl border px-3 py-3"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Tugas
                </label>

                <select
                  value={form.tugas}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      tugas: e.target.value,
                    })
                  }
                  className="w-full rounded-xl border px-3 py-3"
                >
                  <option value="">
                    Pilih tugas
                  </option>

                  {daftarTugas.map((tugas) => (
                    <option
                      key={tugas}
                      value={tugas}
                    >
                      {tugas}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Jam Apel
                </label>

                <input
                  type="time"
                  value={form.jam_apel}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      jam_apel: e.target.value,
                    })
                  }
                  className="w-full rounded-xl border px-3 py-3"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Lokasi
                </label>

                <input
                  type="text"
                  value={form.lokasi}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      lokasi: e.target.value,
                    })
                  }
                  className="w-full rounded-xl border px-3 py-3"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">

                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                  className="rounded-xl border px-4 py-3"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-5 py-3 text-white hover:bg-blue-700"
                >
                  {editing
                    ? "Simpan Perubahan"
                    : "Simpan Jadwal"}
                </button>

              </div>

            </form>
          </div>
        </div>
      )}
      {hasilBacaPdf && (
  <div className="bg-white border rounded-xl p-4">
    <h3 className="font-semibold mb-2">
      Hasil Baca PDF
    </h3>

    <textarea
      value={hasilBacaPdf}
      readOnly
      className="w-full h-96 border rounded-lg p-3 text-sm font-mono"
    />
  </div>
)}
    </div>
  );
}