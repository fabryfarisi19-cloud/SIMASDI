"use client";

import { ChangeEvent, DragEvent, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import Tesseract from "tesseract.js";


type FormSurat = {
  no_agenda: string;
  nomor_surat: string;
  tanggal_surat: string;
  asal_surat: string;
  perihal: string;
};

export default function SuratMasukPage() {
  const [form, setForm] = useState<FormSurat>({
    no_agenda: "",
    nomor_surat: "",
    tanggal_surat: "",
    asal_surat: "",
    perihal: "",
  });

  const [fileSurat, setFileSurat] = useState<File | null>(null);
  const [suratList, setSuratList] = useState<any[]>([]);
  const [cari, setCari] = useState("");
  const [sedangMembaca, setSedangMembaca] = useState(false);
  const [dragAktif, setDragAktif] = useState(false);

  const inputFileRef = useRef<HTMLInputElement>(null);

  const loadSurat = async () => {
    const { data, error } = await supabase
      .from("surat_masuk")
      .select("*")
      .order("id", { ascending: false });

    if (error) {
      console.error(error.message);
      return;
    }

    setSuratList(data || []);
  };

  useEffect(() => {
    loadSurat();
  }, []);

 const ambilDataDariTeks = (teks: string) => {
  const bersihkan = (nilai: string) =>
    nilai
      .replace(/\s+/g, " ")
      .replace(/[|]/g, "")
      .trim();

  const baris = teks
    .split("\n")
    .map((item) => bersihkan(item))
    .filter(Boolean);

  // Ambil nomor surat dari baris yang mengandung kata Nomor / Nomor Surat
  const barisNomor = baris.find((item) =>
    /^(nomor|nomor surat|no\.?|no surat)\b/i.test(item)
  );

  let nomorSuratBersih = "";

  if (barisNomor) {
    nomorSuratBersih = barisNomor
      .replace(/^(nomor|nomor surat|no\.?|no surat)\s*[:.]?\s*/i, "")
      // buang tanggal jika ikut terbaca setelah nomor
      .replace(
        /\b\d{1,2}\s+(januari|februari|maret|april|mei|juni|juli|agustus|september|oktober|november|desember)\s+\d{4}\b.*$/i,
        ""
      )
      .replace(/\b(?:tanggal|tgl\.?)\s+\d{1,2}\s+(?:januari|februari|maret|april|mei|juni|juli|agustus|september|oktober|november|desember)\b.*$/i, "")
.replace(/\b\d{1,2}\s+(?:januari|februari|maret|april|mei|juni|juli|agustus|september|oktober|november|desember)\s+\d{4}\b.*$/i, "")
.replace(/\b(?:tanggal|tgl\.?)\s+\d{1,2}\s+(?:januari|februari|maret|april|mei|juni|juli|agustus|september|oktober|november|desember)\b.*$/i, "")
.replace(/\b\d{1,2}\s+(?:januari|februari|maret|april|mei|juni|juli|agustus|september|oktober|november|desember)\s+\d{4}\b.*$/i, "")
.replace(/\bjakarta\b.*$/i, "")
      .trim();
  }

  // Cadangan bila format OCR tidak rapi
  if (!nomorSuratBersih) {
    const nomorMatch = teks.match(
      /(?:Nomor\s*Surat|Nomor|No\.?)\s*[:.]?\s*([A-Z0-9][A-Z0-9./\- ]{4,})/i
    );

    nomorSuratBersih = nomorMatch
      ? nomorMatch[1]
          .replace(
            /\b\d{1,2}\s+(januari|februari|maret|april|mei|juni|juli|agustus|september|oktober|november|desember)\s+\d{4}\b.*$/i,
            ""
          )
          .replace(/\bjakarta\b.*$/i, "")
          .trim()
      : "";
  }

  const perihalMatch =
    teks.match(/(?:Perihal|Hal)\s*[:.]?\s*([^\n]+)/i) ||
    teks.match(/(?:Perihal|Hal)\s*\n\s*([^\n]+)/i);

  const tanggalMatch = teks.match(
    /(?:Jakarta|Jakarta Barat|DKI Jakarta)?\s*,?\s*(\d{1,2}\s+(?:Januari|Februari|Maret|April|Mei|Juni|Juli|Agustus|September|Oktober|November|Desember)\s+\d{4})/i
  );

  const asalSurat =
    baris.find(
      (item) =>
        item.toLowerCase().includes("kantor wilayah") ||
        item.toLowerCase().includes("direktorat") ||
        item.toLowerCase().includes("kementerian") ||
        item.toLowerCase().includes("balai") ||
        item.toLowerCase().includes("lapas") ||
        item.toLowerCase().includes("rutan")
    ) || "";

  const bulan: Record<string, string> = {
    Januari: "01",
    Februari: "02",
    Maret: "03",
    April: "04",
    Mei: "05",
    Juni: "06",
    Juli: "07",
    Agustus: "08",
    September: "09",
    Oktober: "10",
    November: "11",
    Desember: "12",
  };

  const tanggalFormat = tanggalMatch
    ? (() => {
        const bagian = tanggalMatch[1].split(" ");
        return `${bagian[2]}-${bulan[bagian[1]]}-${bagian[0].padStart(2, "0")}`;
      })()
    : "";

  setForm((lama) => ({
    ...lama,
    no_agenda: lama.no_agenda || `SM-${Date.now().toString().slice(-6)}`,
    nomor_surat: nomorSuratBersih || lama.nomor_surat,
    tanggal_surat: tanggalFormat || lama.tanggal_surat,
    asal_surat: asalSurat || lama.asal_surat,
    perihal: perihalMatch ? bersihkan(perihalMatch[1]) : lama.perihal,
  }));
};
 const bacaFileOtomatis = async (file: File) => {
  try {
    
    // PDF.js hanya dipanggil saat pengguna memilih file PDF di browser
    const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");

    pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs"; 
      setSedangMembaca(true);

      let sumberGambar: string | HTMLCanvasElement;

      if (file.type === "application/pdf") {
 const dataPdf = new Uint8Array(await file.arrayBuffer());

const pdf = await pdfjsLib.getDocument({
  data: dataPdf,
}).promise;

const halaman = await pdf.getPage(1);

const viewport = halaman.getViewport({
  scale: 2,
});

const canvas = document.createElement("canvas");
const context = canvas.getContext("2d");

if (!context) {
  throw new Error("Canvas tidak dapat dibuat");
}

canvas.width = viewport.width;
canvas.height = viewport.height;

const tugasRender = halaman.render({
  canvasContext: context,
  viewport: viewport,
} as any);

await tugasRender.promise;

sumberGambar = canvas;       
      } else {
        sumberGambar = URL.createObjectURL(file);
      }

      const hasil = await Tesseract.recognize(sumberGambar, "ind");

    ambilDataDariTeks(hasil.data.text);

// Jika perihal belum terbaca dari isi PDF/gambar,
// gunakan nama file sebagai perihal sementara
setForm((lama) => ({
  ...lama,
  perihal:
    lama.perihal ||
    file.name
      .replace(/\.(pdf|jpg|jpeg|png)$/i, "")
      .replace(/[_-]/g, " "),
}));

      if (typeof sumberGambar === "string") {
        URL.revokeObjectURL(sumberGambar);
      }

      alert(
        "Pembacaan selesai. Periksa kembali data surat sebelum disimpan."
      );
    } catch (error) {
      console.error(error);
      alert(
        "PDF berhasil dipilih, tetapi pembacaan otomatis gagal. Isi data surat secara manual lalu simpan."
      );
    } finally {
      setSedangMembaca(false);
    }
  };

  const pilihFile = async (file: File) => {
    const tipeDiizinkan = [
      "application/pdf",
      "image/jpeg",
      "image/jpg",
      "image/png",
    ];

    if (!tipeDiizinkan.includes(file.type)) {
      alert("File harus PDF, JPG, JPEG, atau PNG.");
      return;
    }

    setFileSurat(file);

    setForm((lama) => ({
      ...lama,
      no_agenda: lama.no_agenda || `SM-${Date.now().toString().slice(-6)}`,
    }));

    await bacaFileOtomatis(file);
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await pilihFile(file);
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragAktif(false);

    const file = e.dataTransfer.files?.[0];
    if (file) await pilihFile(file);
  };

  const simpanSurat = async () => {
    if (
      !form.no_agenda ||
      !form.nomor_surat ||
      !form.asal_surat ||
      !form.perihal
    ) {
      alert("Lengkapi No Agenda, Nomor Surat, Asal Surat, dan Perihal.");
      return;
    }

    let fileUrl = "";

    if (fileSurat) {
      const namaFile = `${Date.now()}-${fileSurat.name.replace(/\s/g, "-")}`;

      const { error: uploadError } = await supabase.storage
        .from("surat")
        .upload(namaFile, fileSurat);

      if (uploadError) {
        alert(`Upload file gagal: ${uploadError.message}`);
        return;
      }

      const { data: urlData } = supabase.storage
        .from("surat")
        .getPublicUrl(namaFile);

      fileUrl = urlData.publicUrl;
    }

    const { error } = await supabase.from("surat_masuk").insert([
      {
        no_agenda: form.no_agenda,
        nomor_surat: form.nomor_surat,
        tanggal_surat: form.tanggal_surat || null,
        asal_surat: form.asal_surat,
        perihal: form.perihal,
        file_url: fileUrl,
        tanggal: new Date().toISOString(),
      },
    ]);

    if (error) {
      alert(error.message);
      return;
    }

    alert("Surat masuk berhasil disimpan.");

    setForm({
      no_agenda: "",
      nomor_surat: "",
      tanggal_surat: "",
      asal_surat: "",
      perihal: "",
    });

    setFileSurat(null);

    if (inputFileRef.current) {
      inputFileRef.current.value = "";
    }

    await loadSurat();
  };

  const hapusSurat = async (item: any) => {
    if (!confirm("Yakin ingin menghapus surat ini?")) return;

    const { error } = await supabase
      .from("surat_masuk")
      .delete()
      .eq("id", item.id);

    if (error) {
      alert(error.message);
      return;
    }

    await loadSurat();
  };

  const daftarTampil = suratList.filter((item) => {
    const teks = `${item.no_agenda || ""} ${item.nomor_surat || ""} ${
      item.asal_surat || ""
    } ${item.perihal || ""} ${item.tanggal_surat || ""}`.toLowerCase();

    return teks.includes(cari.toLowerCase());
  });

  return (
    <div style={{ padding: "32px", background: "#f5f7fb", minHeight: "100vh" }}>
      <h1 style={{ margin: "0 0 26px", fontSize: "26px" }}>Surat Masuk</h1>

      <div
        style={{
          background: "white",
          padding: "24px",
          borderRadius: "14px",
          boxShadow: "0 4px 18px rgba(15, 23, 42, 0.08)",
        }}
      >
        <h2 style={{ color: "#123b94", fontSize: "18px", marginTop: 0 }}>
          Upload & Baca Surat Otomatis
        </h2>

        <div
          onClick={() => inputFileRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragAktif(true);
          }}
          onDragLeave={() => setDragAktif(false)}
          onDrop={handleDrop}
          style={{
            border: `2px dashed ${dragAktif ? "#2563eb" : "#94a3b8"}`,
            borderRadius: "12px",
            padding: "32px",
            textAlign: "center",
            cursor: "pointer",
            background: dragAktif ? "#eff6ff" : "#f8fafc",
            marginBottom: "26px",
          }}
        >
          <div style={{ fontSize: "28px" }}>📄</div>
          <b>Tarik dan lepas file surat di sini</b>
          <div style={{ marginTop: "8px", color: "#64748b" }}>
            atau klik untuk mencari file JPG, JPEG, PNG, atau PDF
          </div>

          {fileSurat && (
            <div style={{ marginTop: "14px", color: "#047857", fontWeight: "bold" }}>
              File dipilih: {fileSurat.name}
            </div>
          )}

          {sedangMembaca && (
            <div style={{ marginTop: "14px", color: "#2563eb", fontWeight: "bold" }}>
              Sedang membaca surat otomatis...
            </div>
          )}

          <input
            ref={inputFileRef}
            type="file"
            accept=".jpg,.jpeg,.png,.pdf"
            onChange={handleFileChange}
            style={{ display: "none" }}
          />
        </div>

        <h2 style={{ color: "#123b94", fontSize: "18px" }}>Data Surat Masuk</h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
            gap: "14px",
          }}
        >
          <div>
            <b>No Agenda</b>
            <input
              value={form.no_agenda}
              onChange={(e) => setForm({ ...form, no_agenda: e.target.value })}
              placeholder="Contoh: SM-001"
              style={inputStyle}
            />
          </div>

          <div>
            <b>Nomor Surat</b>
            <input
              value={form.nomor_surat}
              onChange={(e) => setForm({ ...form, nomor_surat: e.target.value })}
              placeholder="Nomor surat"
              style={inputStyle}
            />
          </div>

          <div>
            <b>Tanggal Surat</b>
            <input
              type="date"
              value={form.tanggal_surat}
              onChange={(e) => setForm({ ...form, tanggal_surat: e.target.value })}
              style={inputStyle}
            />
          </div>

          <div>
            <b>Asal Surat</b>
            <input
              value={form.asal_surat}
              onChange={(e) => setForm({ ...form, asal_surat: e.target.value })}
              placeholder="Asal surat"
              style={inputStyle}
            />
          </div>
        </div>

        <div style={{ marginTop: "14px" }}>
          <b>Perihal Surat</b>
          <textarea
            value={form.perihal}
            onChange={(e) => setForm({ ...form, perihal: e.target.value })}
            placeholder="Perihal surat"
            rows={4}
            style={{ ...inputStyle, resize: "vertical" }}
          />
        </div>

        <button onClick={simpanSurat} style={buttonBiru}>
          💾 Simpan Surat Masuk
        </button>
      </div>

      <div
        style={{
          marginTop: "24px",
          display: "flex",
          justifyContent: "space-between",
          gap: "16px",
        }}
      >
        <input
          value={cari}
          onChange={(e) => setCari(e.target.value)}
          placeholder="🔎 Cari nomor surat, asal surat, perihal, tanggal, atau no agenda..."
          style={{ ...inputStyle, maxWidth: "560px", margin: 0 }}
        />

        <button onClick={loadSurat} style={buttonPutih}>
          🔄 Perbarui Data
        </button>
      </div>

      <div style={{ overflowX: "auto", marginTop: "16px" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            background: "white",
            borderRadius: "12px",
            overflow: "hidden",
          }}
        >
          <thead style={{ background: "#243f96", color: "white" }}>
            <tr>
              <th style={thStyle}>No Agenda</th>
              <th style={thStyle}>Tanggal</th>
              <th style={thStyle}>Nomor Surat</th>
              <th style={thStyle}>Asal Surat</th>
              <th style={thStyle}>Perihal</th>
              <th style={thStyle}>File</th>
              <th style={thStyle}>Aksi</th>
            </tr>
          </thead>

          <tbody>
            {daftarTampil.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", padding: "28px" }}>
                  Belum ada data surat masuk.
                </td>
              </tr>
            ) : (
              daftarTampil.map((item) => (
                <tr key={item.id}>
                  <td style={tdStyle}>{item.no_agenda}</td>
                  <td style={tdStyle}>{item.tanggal_surat || "-"}</td>
                  <td style={tdStyle}>{item.nomor_surat}</td>
                  <td style={tdStyle}>{item.asal_surat}</td>
                  <td style={tdStyle}>{item.perihal}</td>
                  <td style={tdStyle}>
                    {item.file_url ? (
                      <a href={item.file_url} target="_blank">
                        Lihat File
                      </a>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td style={tdStyle}>
                    <button
                      onClick={() => hapusSurat(item)}
                      style={{
                        background: "#dc2626",
                        color: "white",
                        border: "none",
                        padding: "8px 12px",
                        borderRadius: "6px",
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
    </div>
  );
}

const inputStyle = {
  width: "100%",
  boxSizing: "border-box" as const,
  marginTop: "8px",
  padding: "12px",
  border: "1px solid #cbd5e1",
  borderRadius: "8px",
  fontSize: "14px",
};

const buttonBiru = {
  marginTop: "18px",
  background: "#2563eb",
  color: "white",
  border: "none",
  padding: "12px 18px",
  borderRadius: "8px",
  fontWeight: "bold",
  cursor: "pointer",
};

const buttonPutih = {
  background: "white",
  color: "#1d4ed8",
  border: "1px solid #cbd5e1",
  padding: "10px 16px",
  borderRadius: "8px",
  fontWeight: "bold",
  cursor: "pointer",
};

const thStyle = {
  padding: "14px",
  textAlign: "left" as const,
};

const tdStyle = {
  padding: "13px",
  borderBottom: "1px solid #e2e8f0",
  verticalAlign: "top" as const,
};