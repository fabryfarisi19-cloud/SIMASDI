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

export default function SuratKeluarPage() {
  const [dataSurat, setDataSurat] = useState<SuratKeluar[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cari, setCari] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    nomor_surat: "",
    tanggal_surat: "",
    tujuan_surat: "",
    perihal: "",
  });

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
      return;
    }

    setDataSurat(data || []);
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

  const ambilDataSuratKeluar = (teks: string) => {
    const bersih = teks.replace(/\s+/g, " ").trim();

    const nomorMatch =
      bersih.match(
        /Nomor\s*(Surat)?\s*[:.]?\s*([A-Z0-9./\-\s]{5,}?)(?=\s*(Lampiran|Perihal|Kepada|Yth|Tanggal|$))/i
      ) || bersih.match(/\b[A-Z]{1,6}[A-Z0-9./-]{5,}\b/);

    const tanggalMatch =
      bersih.match(
        /\b\d{1,2}\s+(Januari|Februari|Maret|April|Mei|Juni|Juli|Agustus|September|Oktober|November|Desember)\s+\d{4}\b/i
      ) || bersih.match(/\b\d{1,2}[/-]\d{1,2}[/-]\d{4}\b/);

    const tujuanMatch = bersih.match(
      /(?:Kepada Yth\.?|Yth\.?)\s*[:.]?\s*(.*?)(?=(?:Perihal|Nomor|Lampiran|Dengan hormat|$))/i
    );

    const perihalMatch = bersih.match(
      /Perihal\s*[:.]?\s*(.*?)(?=(?:Kepada|Yth|Dengan hormat|Nomor|Lampiran|$))/i
    );

    setForm((lama) => ({
      ...lama,
      nomor_surat: nomorMatch
        ? (nomorMatch[2] || nomorMatch[0]).trim()
        : lama.nomor_surat,
      tanggal_surat: tanggalMatch
        ? ubahTanggalKeInput(tanggalMatch[0])
        : lama.tanggal_surat,
      tujuan_surat: tujuanMatch
        ? tujuanMatch[1].trim()
        : lama.tujuan_surat,
      perihal: perihalMatch ? perihalMatch[1].trim() : lama.perihal,
    }));
  };

  const bacaFileSuratKeluar = async (file: File) => {
    setSelectedFile(file);

    if (
      file.type !== "application/pdf" &&
      !file.type.startsWith("image/")
    ) {
      alert("Format file harus PDF, JPG, JPEG, atau PNG.");
      return;
    }

    try {
      setLoading(true);

      let sumberGambar: File | string = file;

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

const tugasRender = halaman.render({
  canvasContext: context,
  viewport: viewport,
} as any);

await tugasRender.promise;      

        sumberGambar = canvas.toDataURL("image/png");
      }

      const hasil = await Tesseract.recognize(sumberGambar, "ind");

      ambilDataSuratKeluar(hasil.data.text);

      alert("Data surat berhasil dibaca. Silakan cek kembali sebelum disimpan.");
    } catch (error) {
      console.error(error);

      alert(
        "File belum dapat dibaca otomatis. Pastikan PDF tidak terkunci dan halaman pertama berisi surat."
      );
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

  const simpanSuratKeluar = async () => {
    if (!form.nomor_surat || !form.tujuan_surat || !form.perihal) {
      alert("Nomor surat, tujuan surat, dan perihal wajib diisi.");
      return;
    }

    try {
      setLoading(true);

      let fileUrl = "";

      if (selectedFile) {
        const namaFile = `surat-keluar/${Date.now()}-${selectedFile.name}`;

        const { error: uploadError } = await supabase.storage
          .from("surat")
          .upload(namaFile, selectedFile);

        if (uploadError) throw uploadError;

        const { data: publicUrl } = supabase.storage
          .from("surat")
          .getPublicUrl(namaFile);

        fileUrl = publicUrl.publicUrl;
      }

      const { error } = await supabase.from("surat_keluar").insert([
        {
          nomor_surat: form.nomor_surat,
          tanggal_surat: form.tanggal_surat || null,
          tujuan_surat: form.tujuan_surat,
          perihal: form.perihal,
          file_url: fileUrl || null,
        },
      ]);

      if (error) throw error;

      alert("Surat keluar berhasil disimpan.");

      setForm({
        nomor_surat: "",
        tanggal_surat: "",
        tujuan_surat: "",
        perihal: "",
      });

      setSelectedFile(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      ambilData();
    } catch (error: any) {
      console.error(error);
      alert(error.message || "Gagal menyimpan surat keluar.");
    } finally {
      setLoading(false);
    }
  };

  const hapusSuratKeluar = async (id: number) => {
    if (!confirm("Hapus data surat keluar ini?")) return;

    const { error } = await supabase
      .from("surat_keluar")
      .delete()
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    ambilData();
  };

  const dataTampil = dataSurat.filter((item) => {
    const gabung =
      `${item.nomor_surat} ${item.tanggal_surat || ""} ${item.tujuan_surat} ${item.perihal}`.toLowerCase();

    return gabung.includes(cari.toLowerCase());
  });

  return (
    <main style={{ padding: "32px", background: "#f5f7fb", minHeight: "100vh" }}>
      <h1 style={{ marginBottom: "24px" }}>Surat Keluar</h1>

      <section
        style={{
          background: "white",
          borderRadius: "16px",
          padding: "26px",
          boxShadow: "0 8px 20px rgba(15, 23, 42, 0.08)",
          marginBottom: "26px",
        }}
      >
        <h2 style={{ fontSize: "20px", color: "#0f3d91", marginBottom: "18px" }}>
          Upload & Data Surat Keluar
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
          <b>Tarik dan lepas file surat keluar di sini</b>

          <p style={{ color: "#64748b", marginTop: "8px" }}>
            atau klik untuk mencari file PDF, JPG, JPEG, atau PNG
          </p>

          {selectedFile && (
            <p style={{ color: "#008b5b", fontWeight: "bold", marginTop: "10px" }}>
              File dipilih: {selectedFile.name}
            </p>
          )}

          {loading && (
            <p style={{ color: "#2563eb", fontWeight: "bold", marginTop: "10px" }}>
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
            placeholder="Masukkan perihal surat"
            rows={4}
            style={{ ...inputStyle, resize: "vertical" }}
          />
        </label>

        <button
          onClick={simpanSuratKeluar}
          disabled={loading}
          style={{
            marginTop: "20px",
            background: "#2563eb",
            color: "white",
            border: "none",
            padding: "13px 22px",
            borderRadius: "8px",
            fontWeight: "bold",
            cursor: "pointer",
            opacity: loading ? 0.7 : 1,
          }}
        >
          💾 {loading ? "Memproses..." : "Simpan Surat Keluar"}
        </button>
      </section>

      <section>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: "16px",
            marginBottom: "16px",
          }}
        >
          <h2>Daftar Surat Keluar</h2>

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
                    style={{ textAlign: "center", padding: "28px", color: "#64748b" }}
                  >
                    Belum ada data surat keluar.
                  </td>
                </tr>
              ) : (
                dataTampil.map((item) => (
                  <tr key={item.id} style={{ borderBottom: "1px solid #e2e8f0" }}>
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
                      <button
                        onClick={() => hapusSuratKeluar(item.id)}
                        style={{
                          background: "#dc2626",
                          color: "white",
                          border: "none",
                          padding: "9px 12px",
                          borderRadius: "7px",
                          cursor: "pointer",
                        }}
                      >
                        🗑 Hapus
                      </button>
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