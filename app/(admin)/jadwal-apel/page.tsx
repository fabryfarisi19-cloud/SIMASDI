"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  Plus,
  Pencil,
  Trash2,
  CalendarDays,
  Users,
  Search,
  Volume2,
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

    const { data, error } = await supabase
      .from("jadwal_apel")
      .select("*")
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
  }, []);

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
    </div>
  );
}