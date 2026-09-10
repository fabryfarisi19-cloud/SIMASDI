"use client";

import { useState } from "react";
import * as XLSX from "xlsx";
import {
  Upload,
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";

type DataGaji = Record<string, string | number | null>;

type HasilImport = {
  success: boolean;
  message?: string;
  error?: string;
  total?: number;
  berhasilDivalidasi?: number;
  kesalahan?: Array<{
    baris: number;
    nip?: string;
    error: string;
  }>;
};

export default function ImportGajiPage() {
  const [file, setFile] = useState<File | null>(null);
  const [dataExcel, setDataExcel] = useState<DataGaji[]>([]);
  const [pesan, setPesan] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasilImport, setHasilImport] =
    useState<HasilImport | null>(null);

  function handleFileChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const selectedFile = event.target.files?.[0];

    setHasilImport(null);

    if (!selectedFile) {
      setFile(null);
      setDataExcel([]);
      setPesan("");
      return;
    }

    const nama = selectedFile.name.toLowerCase();

    if (!nama.endsWith(".xlsx") && !nama.endsWith(".xls")) {
      setFile(null);
      setDataExcel([]);
      setPesan(
        "File harus berformat Excel (.xlsx atau .xls)."
      );
      return;
    }

    setFile(selectedFile);
    setPesan("");
    setDataExcel([]);

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const buffer = e.target?.result;

        if (!buffer) {
          setPesan("File Excel tidak dapat dibaca.");
          return;
        }

        const workbook = XLSX.read(buffer, {
          type: "array",
        });

        if (workbook.SheetNames.length === 0) {
          setPesan("File Excel tidak memiliki sheet.");
          return;
        }

        const namaSheet = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[namaSheet];

        const hasil = XLSX.utils.sheet_to_json<DataGaji>(
          worksheet,
          {
            defval: "",
          }
        );

        setDataExcel(hasil);

        if (hasil.length === 0) {
          setPesan(
            "File Excel tidak memiliki data."
          );
        } else {
          setPesan(
            `Berhasil membaca ${hasil.length} baris data dari Excel.`
          );
        }
      } catch (error) {
        console.error(
          "Gagal membaca Excel:",
          error
        );

        setPesan(
          "File Excel tidak dapat dibaca. Pastikan formatnya benar."
        );

        setDataExcel([]);
      }
    };

    reader.readAsArrayBuffer(selectedFile);
  }

  async function handleImport() {
    if (!file) {
      setPesan(
        "Silakan pilih file Excel terlebih dahulu."
      );
      return;
    }

    if (dataExcel.length === 0) {
      setPesan(
        "Tidak ada data Excel yang dapat diimport."
      );
      return;
    }

    try {
      setLoading(true);
      setPesan("");
      setHasilImport(null);

      const response = await fetch(
        "/api/import-gaji",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            data: dataExcel,
          }),
        }
      );

      const hasil: HasilImport =
        await response.json();

      setHasilImport(hasil);

      if (!response.ok) {
        setPesan(
          hasil.error ||
            "Validasi import gagal."
        );
        return;
      }

      setPesan(
        hasil.message ||
          "Data berhasil divalidasi."
      );
    } catch (error) {
      console.error(
        "Gagal mengirim data import:",
        error
      );

      setPesan(
        "Tidak dapat terhubung ke server."
      );
    } finally {
      setLoading(false);
    }
  }

  const kolom =
    dataExcel.length > 0
      ? Object.keys(dataExcel[0])
      : [];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          Import Slip Gaji
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Admin dapat mengimpor data rincian gaji
          pegawai melalui file Excel.
        </p>
      </div>

      <div className="max-w-6xl rounded-xl border bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-lg bg-green-100 p-3">
            <FileSpreadsheet className="h-6 w-6 text-green-600" />
          </div>

          <div>
            <h2 className="font-semibold text-gray-800">
              Import Data Excel
            </h2>

            <p className="text-sm text-gray-500">
              Gunakan file Excel berisi data gaji pegawai.
            </p>
          </div>
        </div>

        <label className="mb-2 block text-sm font-medium text-gray-700">
          File Excel
        </label>

        <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 p-10 transition hover:border-green-500 hover:bg-gray-50">
          <Upload className="mb-3 h-10 w-10 text-gray-400" />

          <span className="font-medium text-gray-700">
            Klik untuk memilih file Excel
          </span>

          <span className="mt-1 text-xs text-gray-500">
            Format .xlsx atau .xls
          </span>

          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>

        {file && (
          <div className="mt-4 flex items-center gap-3 rounded-lg bg-green-50 p-4">
            <CheckCircle className="h-5 w-5 text-green-600" />

            <div>
              <p className="text-sm font-medium text-green-800">
                File dipilih
              </p>

              <p className="text-xs text-green-700">
                {file.name}
              </p>
            </div>
          </div>
        )}

        {pesan && (
          <div className="mt-4 flex items-start gap-3 rounded-lg bg-blue-50 p-4">
            <AlertCircle className="mt-0.5 h-5 w-5 text-blue-600" />

            <p className="text-sm text-blue-800">
              {pesan}
            </p>
          </div>
        )}

        {hasilImport?.success && (
          <div className="mt-4 rounded-lg bg-green-50 p-4">
            <p className="font-semibold text-green-800">
              Validasi berhasil
            </p>

            <p className="mt-1 text-sm text-green-700">
              Total data: {hasilImport.total} baris
            </p>

           <p className="text-sm text-green-700">
  Berhasil diproses: {hasilImport.total} baris
</p>

<p className="mt-2 text-xs text-green-600">
  Data gaji berhasil disimpan ke database.
</p>
          </div>
        )}

        {hasilImport?.kesalahan &&
          hasilImport.kesalahan.length > 0 && (
            <div className="mt-4 rounded-lg bg-red-50 p-4">
              <p className="font-semibold text-red-800">
                Data tidak valid
              </p>

              <div className="mt-3 max-h-60 overflow-y-auto">
                {hasilImport.kesalahan.map(
                  (item, index) => (
                    <div
                      key={index}
                      className="border-b border-red-100 py-2 text-sm text-red-700 last:border-b-0"
                    >
                      <strong>
                        Baris {item.baris}
                      </strong>

                      {item.nip && (
                        <> — NIP {item.nip}</>
                      )}

                      {" : "}
                      {item.error}
                    </div>
                  )
                )}
              </div>
            </div>
          )}

        {dataExcel.length > 0 && (
          <div className="mt-6">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-800">
                  Preview Data
                </h3>

                <p className="text-sm text-gray-500">
                  {dataExcel.length} baris terbaca dari Excel
                </p>
              </div>
            </div>

            <div className="overflow-x-auto rounded-lg border">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="border-b px-4 py-3 text-left">
                      No
                    </th>

                    {kolom.map((namaKolom) => (
                      <th
                        key={namaKolom}
                        className="whitespace-nowrap border-b px-4 py-3 text-left"
                      >
                        {namaKolom}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {dataExcel
                    .slice(0, 20)
                    .map((baris, index) => (
                      <tr
                        key={index}
                        className="hover:bg-gray-50"
                      >
                        <td className="border-b px-4 py-3">
                          {index + 1}
                        </td>

                        {kolom.map((namaKolom) => (
                          <td
                            key={namaKolom}
                            className="whitespace-nowrap border-b px-4 py-3"
                          >
                            {String(
                              baris[namaKolom] ?? ""
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            {dataExcel.length > 20 && (
              <p className="mt-3 text-xs text-gray-500">
                Preview menampilkan 20 baris pertama.
                Total data yang terbaca:{" "}
                {dataExcel.length} baris.
              </p>
            )}
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={handleImport}
            disabled={
              !file ||
              dataExcel.length === 0 ||
              loading
            }
            className="flex items-center gap-2 rounded-lg bg-green-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading && (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}

            {loading
              ? "Memvalidasi..."
              : "Import Excel"}
          </button>
        </div>
      </div>
    </div>
  );
}