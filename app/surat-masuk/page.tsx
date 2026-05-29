"use client";

import { useState } from "react";

export default function SuratMasukPage() {
  const [file, setFile] = useState<File | null>(null);

  const [suratList, setSuratList] = useState<any[]>([
    {
      agenda: "AGD-2026-0001",
      tanggal: "29/05/2026",
      nomor: "001/BPS/2026",
      asal: "Pengadilan Negeri",
      perihal: "Permintaan Litmas",
      file: "contoh.pdf",
    },
  ]);

  const [form, setForm] = useState({
    nomor: "",
    asal: "",
    perihal: "",
  });

  const simpanSurat = () => {
    if (!form.nomor || !form.asal || !form.perihal) {
      alert("Lengkapi data surat");
      return;
    }

    const dataBaru = {
      agenda: `AGD-${Date.now()}`,
      tanggal: new Date().toLocaleDateString("id-ID"),
      nomor: form.nomor,
      asal: form.asal,
      perihal: form.perihal,
      file: file?.name || "-",
    };

    setSuratList([...suratList, dataBaru]);

    setForm({
      nomor: "",
      asal: "",
      perihal: "",
    });

    setFile(null);

    alert("Surat berhasil disimpan");
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">
        Surat Masuk
      </h1>

      <div className="bg-white p-6 rounded-lg shadow">
        <div className="mb-4">
          <label className="block mb-2">Nomor Surat</label>
          <input
            type="text"
            value={form.nomor}
            onChange={(e) =>
              setForm({ ...form, nomor: e.target.value })
            }
            className="border p-2 w-full"
          />
        </div>

        <div className="mb-4">
          <label className="block mb-2">Asal Surat</label>
          <input
            type="text"
            value={form.asal}
            onChange={(e) =>
              setForm({ ...form, asal: e.target.value })
            }
            className="border p-2 w-full"
          />
        </div>

        <div className="mb-4">
          <label className="block mb-2">Perihal</label>
          <input
            type="text"
            value={form.perihal}
            onChange={(e) =>
              setForm({ ...form, perihal: e.target.value })
            }
            className="border p-2 w-full"
          />
        </div>

        <div className="mb-4">
          <label className="block mb-2">Upload Dokumen</label>
          <input
            type="file"
            onChange={(e) =>
              setFile(e.target.files?.[0] || null)
            }
          />
        </div>

        <button
          onClick={simpanSurat}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Simpan Surat
        </button>
      </div>

      <h2 className="text-2xl font-bold mt-8 mb-4">
        Daftar Surat Masuk
      </h2>

      <div className="overflow-x-auto">
        <table className="w-full border">
          <thead>
            <tr className="bg-gray-200">
              <th className="border p-2">No Agenda</th>
              <th className="border p-2">Tanggal</th>
              <th className="border p-2">Nomor Surat</th>
              <th className="border p-2">Asal Surat</th>
              <th className="border p-2">Perihal</th>
              <th className="border p-2">File</th>
              <th className="border p-2">Aksi</th>
            </tr>
          </thead>

          <tbody>
            {suratList.map((surat, index) => (
              <tr key={index}>
                <td className="border p-2">{surat.agenda}</td>
                <td className="border p-2">{surat.tanggal}</td>
                <td className="border p-2">{surat.nomor}</td>
                <td className="border p-2">{surat.asal}</td>
                <td className="border p-2">{surat.perihal}</td>
                <td className="border p-2">{surat.file}</td>

                <td className="border p-2">
                  <button className="bg-green-600 text-white px-3 py-1 rounded mr-2">
                    Lihat
                  </button>

                  <button className="bg-blue-600 text-white px-3 py-1 rounded mr-2">
                    Download
                  </button>

                  <button
                    className="bg-orange-500 text-white px-3 py-1 rounded"
                    onClick={() =>
                      window.open(
                        `https://wa.me/6282113349937?text=DISPOSISI SURAT MASUK%0A%0ANomor Surat : ${surat.nomor}%0AAsal Surat : ${surat.asal}%0APerihal : ${surat.perihal}`,
                        "_blank"
                      )
                    }
                  >
                    Disposisi
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