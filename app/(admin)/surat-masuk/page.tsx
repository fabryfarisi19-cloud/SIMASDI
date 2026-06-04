
"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Tesseract from "tesseract.js";

export default function SuratMasukPage() {
  const [file, setFile] = useState<File | null>(null);
  const [suratList, setSuratList] = useState<any[]>([]);

  const [form, setForm] = useState({
    nomor: "",
    asal: "",
    perihal: "",
  });

  useEffect(() => {
    loadSurat();
  }, []);

  const loadSurat = async () => {
    const { data, error } = await supabase
      .from("surat_masuk")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error) {
      setSuratList(data || []);
    }
  };

  const hapusSurat = async (noAgenda: string) => {
    if (!confirm("Yakin hapus surat ini?")) return;

    const { error } = await supabase
      .from("surat_masuk")
      .delete()
      .eq("no_agenda", noAgenda);

    if (error) {
      alert(error.message);
      return;
    }

    await loadSurat();
    alert("Surat berhasil dihapus");
  };

  const simpanSurat = async () => {
    alert(
  "URL: " +
  process.env.NEXT_PUBLIC_SUPABASE_URL
);

alert(
  "KEY: " +
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0,20)
);
    if (!file) {
      alert("Pilih file surat");
      return;
    }

    let fileUrl = "";

    const namaFile = `${Date.now()}-${file.name}`;

  const { error: uploadError } = await supabase
  .storage
  .from("surat")
  .upload(namaFile, file);


if (uploadError) {
    console.log(uploadError);
      alert(JSON.stringify(uploadError));
        return;
        }
}

    fileUrl = namaFile;

    const { error } = await supabase
      .from("surat_masuk")
      .insert([
        {
          no_agenda: `AGD-${Date.now()}`,
          tanggal: new Date(),
          nomor_surat: form.nomor,
          asal_surat: form.asal,
          perihal: form.perihal,
          file_url: fileUrl,
        },
      ]);

    if (error) {
        console.log(error);
          alert(JSON.stringify(error));
            return;
            }
    }

    setForm({
      nomor: "",
      asal: "",
      perihal: "",
    });

    setFile(null);

    await loadSurat();

    alert("Surat berhasil disimpan");
  };

  const getFileUrl = (fileName: string) => {
    return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/surat/${fileName}`;
  };

  const bacaSuratAI = async () => {
    if (!file) {
      alert("Pilih file terlebih dahulu");
      return;
    }

    if (!file.type.startsWith("image/")) {
      alert("AI gratis hanya mendukung JPG dan PNG");
      return;
    }

    const result = await Tesseract.recognize(file, "eng");

    const text = result.data.text;

    const lines = text
      .split("\n")
      .map((x) => x.trim())
      .filter((x) => x !== "");

    let nomor = "";
    let perihal = "";

    lines.forEach((line) => {
      if (
        line.toLowerCase().includes("nomor") &&
        nomor === ""
      ) {
        nomor = line;
      }

      if (
        line.toLowerCase().includes("perihal") &&
        perihal === ""
      ) {
        perihal = line;
      }
    });

    setForm({
      nomor,
      asal: "",
      perihal,
    });

    alert("AI berhasil membaca surat");
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">
        Surat Masuk
      </h1>

      <div className="bg-white p-6 rounded-lg shadow">
        <div className="mb-4">
          <label className="block mb-2">
            Nomor Surat
          </label>

          <input
            type="text"
            value={form.nomor}
            onChange={(e) =>
              setForm({
                ...form,
                nomor: e.target.value,
              })
            }
            className="border p-2 w-full"
          />
        </div>

        <div className="mb-4">
          <label className="block mb-2">
            Asal Surat
          </label>

          <input
            type="text"
            value={form.asal}
            onChange={(e) =>
              setForm({
                ...form,
                asal: e.target.value,
              })
            }
            className="border p-2 w-full"
          />
        </div>

        <div className="mb-4">
          <label className="block mb-2">
            Perihal
          </label>

          <input
            type="text"
            value={form.perihal}
            onChange={(e) =>
              setForm({
                ...form,
                perihal: e.target.value,
              })
            }
            className="border p-2 w-full"
          />
        </div>

        <div className="mb-4">
          <label className="block mb-2">
            Upload Dokumen
          </label>

          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();

              if (e.dataTransfer.files?.[0]) {
                setFile(e.dataTransfer.files[0]);
              }
            }}
            style={{
              border: "2px dashed #2563eb",
              borderRadius: "12px",
              padding: "30px",
              textAlign: "center",
              background: "#f8fafc",
            }}
          >
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) =>
                setFile(
                  e.target.files?.[0] || null
                )
              }
            />

            <p className="mt-3">
              📄 Tarik file surat ke sini atau
              klik untuk memilih file
            </p>

            {file && (
              <p style={{ color: "green" }}>
                ✅ {file.name}
              </p>
            )}
          </div>
        </div>

        <button
          onClick={simpanSurat}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Simpan Surat
        </button>

        <button
          onClick={bacaSuratAI}
          className="bg-purple-600 text-white px-4 py-2 rounded ml-2"
        >
          Baca Surat AI
        </button>
      </div>

      <h2 className="text-2xl font-bold mt-8 mb-4">
        Daftar Surat Masuk
      </h2>

      <div className="overflow-x-auto">
        <table className="w-full border">
          <thead>
            <tr className="bg-gray-200">
              <th className="border p-2">
                No Agenda
              </th>
              <th className="border p-2">
                Nomor Surat
              </th>
              <th className="border p-2">
                Asal Surat
              </th>
              <th className="border p-2">
                Perihal
              </th>
              <th className="border p-2">
                File
              </th>
              <th className="border p-2">
                Aksi
              </th>
            </tr>
          </thead>

          <tbody>
            {suratList.map((surat, index) => (
              <tr key={index}>
                <td className="border p-2">
                  {surat.no_agenda}
                </td>

                <td className="border p-2">
                  {surat.nomor_surat}
                </td>

                <td className="border p-2">
                  {surat.asal_surat}
                </td>

                <td className="border p-2">
                  {surat.perihal}
                </td>

                <td className="border p-2">
                  {surat.file_url}
                </td>

                <td className="border p-2 flex gap-2">
                  <button
                    onClick={() =>
                      window.open(
                        getFileUrl(
                          surat.file_url
                        ),
                        "_blank"
                      )
                    }
                    className="bg-green-600 text-white px-3 py-1 rounded"
                  >
                    Lihat
                  </button>

                  <a
                    href={getFileUrl(
                      surat.file_url
                    )}
                    target="_blank"
                    className="bg-blue-600 text-white px-3 py-1 rounded"
                  >
                    Download
                  </a>

                  <button
                    onClick={() =>
                      window.open(
                        `https://wa.me/6282113349937?text=DISPOSISI SURAT MASUK%0A%0ANomor Surat : ${surat.nomor_surat}%0AAsal Surat : ${surat.asal_surat}%0APerihal : ${surat.perihal}`,
                        "_blank"
                      )
                    }
                    className="bg-orange-500 text-white px-3 py-1 rounded"
                  >
                    Disposisi
                  </button>

                  <button
                    onClick={() =>
                      hapusSurat(
                        surat.no_agenda
                      )
                    }
                    className="bg-red-600 text-white px-3 py-1 rounded"
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
  );
                  }
