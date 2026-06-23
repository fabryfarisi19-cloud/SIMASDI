"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import Tesseract from "tesseract.js";

type SuratKeluar = {
  id: number;
  nomor_surat: string;
  tanggal_surat: string | null;
  tujuan_surat: string;
  perihal: string;
  file_url: string | null;
};

type FormSuratKeluar = {
  nomor_surat: string;
  tanggal_surat: string;
  tujuan_surat: string;
  perihal: string;
};

const formKosong: FormSuratKeluar = {
  nomor_surat: "",
  tanggal_surat: "",
  tujuan_surat: "",
  perihal: "",
};

export default function SuratKeluarPage() {
  const [dataSurat, setDataSurat] = useState<SuratKeluar[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cari, setCari] = useState("");
  const [editId, setEditId] = useState<number | null>(null);
  const [fileLama, setFileLama] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<FormSuratKeluar>(formKosong);

  useEffect(() => {
    ambilData();
  }, []);

  const ambilData = async () => {
    const { data, error } = await supabase
      .from("surat_keluar")
      .select("*")
      .order("id", { ascending: false });

    if (error) {
      console.error(error);
      alert("Gagal mengambil data: " + error.message);
      return;
    }

    setDataSurat(data || []);
  };

  const resetForm = () => {
    setForm(formKosong);
    setSelectedFile(null);
    setEditId(null);
    setFileLama(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const ubahTanggalKeInput = (tanggal: string) => {
    const bulan: Record<string, string> = {
      januari: "01",
      februari: "02",
      maret: "03",
      april: "04",
      mei: "05",
      juni: "06",
      juli: "07",
      agustus: "08",
      september: "09",
      oktober: "10",
      november: "11",
      desember: "12",
    };

    const cocokIndonesia = tanggal.match(
      /(\d{1,2})\s+(Januari|Februari|Maret|April|Mei|Juni|Juli|Agustus|September|Oktober|November|Desember)\s+(\d{4})/i
    );

    if (cocokIndonesia) {
      const hari = cocokIndonesia[1].padStart(2, "0");
      const bulanAngka = bulan[cocokIndonesia[2].toLowerCase()];
      const tahun = cocokIndonesia[3];

      return `${tahun}-${bulanAngka}-${hari}`;
    }

    const cocokSlash = tanggal.match(/(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);

    if (cocokSlash) {
      return `${cocokSlash[3]}-${cocokSlash[2].padStart(
        2,
        "0"
      )}-${cocokSlash[1].padStart(2, "0")}`;
    }

    return "";
  };

  const namaFileMenjadiPerihal = (namaFile: string) => {
    return namaFile
      .replace(/\.(pdf|jpg|jpeg|png)$/i, "")
      .replace(/[_-]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  };

  const bersihkanPerihal = (teks: string) => {
    return teks
      .replace(/\s+/g, " ")
      .replace(/^(perihal|hal)\s*[:.\-]?\s*/i, "")
      .replace(/^(kepada|yth)\.?\s*/i, "")
      .trim();
  };

  const ambilDataSuratKeluar = (teks: string, namaFile: string) => {
    const teksBaris = teks.replace(/\r/g, "");
    const bersih = teksBaris.replace(/\s+/g, " ").trim();

    const nomorMatch =
      bersih.match(
        /Nomor\s*(Surat)?\s*[:.]?\s*([A-Z0-9./\-\s]{5,}?)(?=\s*(Lampiran|Perihal|Hal\.?|Kepada|Yth|Tanggal|$))/i
      ) || bersih.match(/\b[A-Z]{1,6}[A-Z0-9./-]{5,}\b/);

    const tanggalMatch =
      bersih.match(
        /\b\d{1,2}\s+(Januari|Februari|Maret|April|Mei|Juni|Juli|Agustus|September|Oktober|November|Desember)\s+\d{4}\b/i
      ) || bersih.match(/\b\d{1,2}[/-]\d{1,2}[/-]\d{4}\b/);

    const tujuanMatch =
      teksBaris.match(
        /(?:Kepada\s+Yth\.?|Yth\.?)\s*[:.]?\s*([\s\S]{3,250}?)(?=\n\s*(?:Perihal|Hal\.?|Nomor|Lampiran|Dengan hormat)|$)/i
      ) ||
      bersih.match(
        /(?:Kepada\s+Yth\.?|Yth\.?)\s*[:.]?\s*(.*?)(?=(?:Perihal|Hal\.?|Nomor|Lampiran|Dengan hormat|$))/i
      );

    const perihalMatch =
      teksBaris.match(
        /(?:Perihal|Hal\.?)\s*[:.\-]?\s*([\s\S]{4,300}?)(?=\n\s*(?:Kepada|Yth\.?|Dengan hormat|Nomor|Lampiran)|$)/i
      ) ||
      bersih.match(
        /(?:Perihal|Hal\.?)\s*[:.\-]?\s*(.*?)(?=(?:Kepada|Yth\.?|Dengan hormat|Nomor|Lampiran|$))/i
      );

    const perihalOtomatis = perihalMatch?.[1]
      ? bersihkanPerihal(perihalMatch[1])
      : namaFileMenjadiPerihal(namaFile);

    setForm((lama) => ({
      ...lama,
      nomor_surat: nomorMatch
        ? (nomorMatch[2] || nomorMatch[0]).replace(/\s+/g, " ").trim()
        : lama.nomor_surat,
      tanggal_surat: tanggalMatch
        ? ubahTanggalKeInput(tanggalMatch[0])
        : lama.tanggal_surat,
      tujuan_surat: tujuanMatch?.[1]
        ? tujuanMatch[1].replace(/\s+/g, " ").trim()
        : lama.tujuan_surat,
      perihal: perihalOtomatis || lama.perihal,
    }));
  };

  const bacaFileSuratKeluar = async (file: File) => {
    if (
      file.type !== "application/pdf" &&
      !file.type.startsWith("image/")
    ) {
      alert("Format file harus PDF, JPG, JPEG, atau PNG.");
      return;
    }

    setSelectedFile(file);

    try {
      setLoading(true);

      let sumberGambar: string | File = file;

      if (file.type === "application/pdf") {
        const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");

        pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

        const dataPdf = new Uint8Array(await file.arrayBuffer());

        const pdf = await pdfjsLib.getDocument({
          data: dataPdf,
        }).promise;

        const halaman = await pdf.getPage(1);
        const viewport = halaman.getViewport({ scale: 2 });

        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");

        if (!context) {
          throw new Error("Canvas tidak dapat dibuat.");
        }

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await halaman.render({
          canvasContext: context,
          viewport,
        } as any).promise;

        sumberGambar = canvas.toDataURL("image/png");
      }

      const hasil = await Tesseract.recognize(sumberGambar, "ind");

      ambilDataSuratKeluar(hasil.data.text, file.name);

      alert("Data surat berhasil dibaca. Silakan periksa kembali sebelum disimpan.");
    } catch (error) {
      console.error(error);

      setForm((lama) => ({
        ...lama,
        perihal: lama.perihal || namaFileMenjadiPerihal(file.name),
      }));

      alert("OCR belum membaca seluruh isi file. Perihal diisi dari nama file.");
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];

    if (file) {
      bacaFileSuratKeluar(file);
    }
  };

  const uploadFile = async () => {
    if (!selectedFile) return fileLama || null;

    const namaFile = `surat-keluar/${Date.now()}-${selectedFile.name}`;

    const { error: uploadError } = await supabase.storage
      .from("surat")
      .upload(namaFile, selectedFile);

    if (uploadError) throw uploadError;

    const { data: publicUrl } = supabase.storage
      .from("surat")
      .getPublicUrl(namaFile);

    return publicUrl.publicUrl;
  };

  const simpanAtauUpdateSuratKeluar = async () => {
    if (!form.nomor_surat || !form.tujuan_surat || !form.perihal) {
      alert("Nomor surat, tujuan surat, dan perihal wajib diisi.");
      return;
    }

    try {
      setLoading(true);

      const fileUrl = await uploadFile();

      const payload = {
        nomor_surat: form.nomor_surat,
        tanggal_surat: form.tanggal_surat || null,
        tujuan_surat: form.tujuan_surat,
        perihal: form.perihal,
        file_url: fileUrl,
      };

      let error;

      if (editId) {
        const hasil = await supabase
          .from("surat_keluar")
          .update(payload)
          .eq("id", editId);

        error = hasil.error;
      } else {
        const hasil = await supabase.from("surat_keluar").insert([payload]);

        error = hasil.error;
      }

      if (error) throw error;

      alert(
        editId
          ? "Surat keluar berhasil diperbarui."
          : "Surat keluar berhasil disimpan."
      );

      resetForm();
      await ambilData();
    } catch (error: any) {
      console.error(error);
      alert(error.message || "Gagal menyimpan surat keluar.");
    } finally {
      setLoading(false);
    }
  };

  const mulaiEdit = (item: SuratKeluar) => {
    setEditId(item.id);
    setFileLama(item.file_url);

    setForm({
      nomor_surat: item.nomor_surat || "",
      tanggal_surat: item.tanggal_surat || "",
      tujuan_surat: item.tujuan_surat || "",
      perihal: item.perihal || "",
    });

    setSelectedFile(null);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const hapusSuratKeluar = async (id: number) => {
    if (!confirm("Hapus data surat keluar ini?")) return;

    const { error } = await supabase
      .from("surat_keluar")
      .delete()
      .eq("id", id);

    if (error) {
      alert("Gagal menghapus: " + error.message);
      return;
    }

    alert("Surat keluar berhasil dihapus.");

    if (editId === id) {
      resetForm();
    }

    await ambilData();
  };

  const dataTampil = dataSurat.filter((item) => {
    const gabung =
      `${item.nomor_surat} ${item.tanggal_surat || ""} ${item.tujuan_surat} ${item.perihal}`.toLowerCase();

    return gabung.includes(cari.toLowerCase());
  });

  return (
    <main
      style={{
        padding: "32px",
        background: "#f5f7fb",
        minHeight: "100vh",
      }}
    >
      <h1 style={{ marginBottom: "24px", color: "#0f172a" }}>
        Surat Keluar
      </h1>

      <section
        style={{
          background: "white",
          borderRadius: "16px",
          padding: "26px",
          boxShadow: "0 8px 20px rgba(15, 23, 42, 0.08)",
          marginBottom: "26px",
        }}
      >
        <h2
          style={{
            fontSize: "20px",
            color: editId ? "#d97706" : "#0f3d91",
            marginBottom: "18px",
          }}
        >
          {editId ? "Edit Surat Keluar" : "Upload & Data Surat Keluar"}
        </h2>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: `2px dashed ${isDragging ? "#2563eb" : "#94a3b8"}`,
            borderRadius: "12px",
            padding: "36px",
            textAlign: "center",
            cursor: "pointer",
            background: isDragging ? "#eff6ff" : "#f8fafc",
            marginBottom: "24px",
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            style={{ display: "none" }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) bacaFileSuratKeluar(file);
            }}
          />

          <div style={{ fontSize: "32px", marginBottom: "8px" }}>📄</div>
          <b>
            {editId
              ? "Klik untuk mengganti file surat keluar"
              : "Tarik dan lepas file surat keluar di sini"}
          </b>

          <p style={{ color: "#64748b", marginTop: "8px" }}>
            PDF, JPG, JPEG, atau PNG
          </p>

          {selectedFile && (
            <p style={{ color: "#008b5b", fontWeight: "bold" }}>
              File baru: {selectedFile.name}
            </p>
          )}

          {!selectedFile && fileLama && (
            <p style={{ color: "#2563eb", fontWeight: "bold" }}>
              File lama tetap digunakan
            </p>
          )}

          {loading && (
            <p style={{ color: "#2563eb", fontWeight: "bold" }}>
              Sedang membaca / menyimpan data...
            </p>
          )}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gap: "18px",
          }}
        >
          <label>
            <b>Nomor Surat</b>
            <input
              value={form.nomor_surat}
              onChange={(e) =>
                setForm({ ...form, nomor_surat: e.target.value })
              }
              placeholder="Masukkan nomor surat"
              style={inputStyle}
            />
          </label>

          <label>
            <b>Tanggal Surat</b>
            <input
              type="date"
              value={form.tanggal_surat}
              onChange={(e) =>
                setForm({ ...form, tanggal_surat: e.target.value })
              }
              style={inputStyle}
            />
          </label>

          <label>
            <b>Tujuan Surat</b>
            <input
              value={form.tujuan_surat}
              onChange={(e) =>
                setForm({ ...form, tujuan_surat: e.target.value })
              }
              placeholder="Contoh: Kantor Wilayah Ditjenpas DKI Jakarta"
              style={inputStyle}
            />
          </label>
        </div>

        <label style={{ display: "block", marginTop: "18px" }}>
          <b>Perihal Surat</b>
          <textarea
            value={form.perihal}
            onChange={(e) => setForm({ ...form, perihal: e.target.value })}
            placeholder="Perihal akan dibaca otomatis dari surat"
            rows={4}
            style={{ ...inputStyle, resize: "vertical" }}
          />
        </label>

        <div style={{ display: "flex", gap: "12px", marginTop: "20px" }}>
          <button
            onClick={simpanAtauUpdateSuratKeluar}
            disabled={loading}
            style={{
              background: editId ? "#d97706" : "#2563eb",
              color: "white",
              border: "none",
              padding: "13px 22px",
              borderRadius: "8px",
              fontWeight: "bold",
              cursor: "pointer",
              opacity: loading ? 0.7 : 1,
            }}
          >
            💾{" "}
            {loading
              ? "Memproses..."
              : editId
                ? "Update Surat Keluar"
                : "Simpan Surat Keluar"}
          </button>

          {editId && (
            <button
              onClick={resetForm}
              disabled={loading}
              style={{
                background: "#64748b",
                color: "white",
                border: "none",
                padding: "13px 22px",
                borderRadius: "8px",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              Batal Edit
            </button>
          )}
        </div>
      </section>

      <section>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: "16px",
            marginBottom: "16px",
            alignItems: "center",
          }}
        >
          <h2 style={{ color: "#0f172a" }}>Daftar Surat Keluar</h2>

          <input
            value={cari}
            onChange={(e) => setCari(e.target.value)}
            placeholder="🔎 Cari nomor, tujuan, perihal, atau tanggal..."
            style={{ ...inputStyle, width: "420px", margin: 0 }}
          />
        </div>

        <div
          style={{
            background: "white",
            borderRadius: "14px",
            overflowX: "auto",
            boxShadow: "0 6px 16px rgba(15, 23, 42, 0.06)",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead style={{ background: "#1e3a8a", color: "white" }}>
              <tr>
                <th style={thStyle}>Nomor Surat</th>
                <th style={thStyle}>Tanggal</th>
                <th style={thStyle}>Tujuan Surat</th>
                <th style={thStyle}>Perihal</th>
                <th style={thStyle}>File</th>
                <th style={thStyle}>Aksi</th>
              </tr>
            </thead>

            <tbody>
              {dataTampil.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    style={{
                      textAlign: "center",
                      padding: "28px",
                      color: "#64748b",
                    }}
                  >
                    Belum ada data surat keluar.
                  </td>
                </tr>
              ) : (
                dataTampil.map((item) => (
                  <tr
                    key={item.id}
                    style={{ borderBottom: "1px solid #e2e8f0" }}
                  >
                    <td style={tdStyle}>{item.nomor_surat}</td>
                    <td style={tdStyle}>{item.tanggal_surat || "-"}</td>
                    <td style={tdStyle}>{item.tujuan_surat}</td>
                    <td style={tdStyle}>{item.perihal}</td>
                    <td style={tdStyle}>
                      {item.file_url ? (
                        <a
                          href={item.file_url}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: "#2563eb", fontWeight: "bold" }}
                        >
                          Lihat File
                        </a>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button
                          onClick={() => mulaiEdit(item)}
                          style={{
                            background: "#d97706",
                            color: "white",
                            border: "none",
                            padding: "9px 12px",
                            borderRadius: "7px",
                            cursor: "pointer",
                            fontWeight: "bold",
                          }}
                        >
                          ✏ Edit
                        </button>

                        <button
                          onClick={() => hapusSuratKeluar(item.id)}
                          style={{
                            background: "#dc2626",
                            color: "white",
                            border: "none",
                            padding: "9px 12px",
                            borderRadius: "7px",
                            cursor: "pointer",
                            fontWeight: "bold",
                          }}
                        >
                          🗑 Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

const inputStyle = {
  width: "100%",
  boxSizing: "border-box" as const,
  marginTop: "8px",
  padding: "12px 14px",
  border: "1px solid #cbd5e1",
  borderRadius: "8px",
  fontSize: "15px",
  outline: "none",
};

const thStyle = {
  padding: "15px",
  textAlign: "left" as const,
  fontWeight: "bold",
};

const tdStyle = {
  padding: "14px",
  verticalAlign: "top" as const,
};