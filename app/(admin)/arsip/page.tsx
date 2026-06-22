"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type ArsipItem = {
  id: number;
  nama_dokumen: string;
  kategori: string;
  file_url: string;
  created_at: string | null;
};

export default function ArsipPage() {
  const [file, setFile] = useState<File | null>(null);
  const [kategori, setKategori] = useState("Surat Masuk");
  const [arsip, setArsip] = useState<ArsipItem[]>([]);
  const [cari, setCari] = useState("");
  const [filterKategori, setFilterKategori] = useState("Semua");
const [uploading, setUploading] = useState(false);
  const [page, setPage] = useState(1);
  const limit = 10;

  // LOAD DATA
  useEffect(() => {
    loadArsip();
  }, []);

  const loadArsip = async () => {
    const { data } = await supabase
      .from("arsip_digital")
      .select("*")
      .order("id", { ascending: false });

    setArsip(data || []);
  };

  // RESET PAGE SAAT FILTER / SEARCH
  useEffect(() => {
    setPage(1);
  }, [cari, filterKategori]);

  // UPLOAD
 const uploadFile = async () => {
  if (!file) return alert("Pilih file dulu");

  try {
    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("kategori", kategori);

    const res = await fetch("/api/upload-drive", {
      method: "POST",
      body: formData,
    });

    const result = await res.json();

    if (!result.success) {
      return alert(
        "Upload gagal ke Google Drive: " +
          (result.error || "Error tidak diketahui")
      );
    }

    const { error } = await supabase.from("arsip_digital").insert({
      nama_dokumen: file.name,
      kategori,
      file_url: result.fileUrl,
      created_at: new Date().toISOString(),
    });

    if (error) {
      return alert("File masuk Drive, tetapi data arsip gagal disimpan.");
    }

    setFile(null);
    setKategori("Surat Masuk");
    await loadArsip();

    alert("Upload berhasil 🚀");
  } catch (error) {
    console.error(error);
    alert("Terjadi kesalahan saat upload.");
  } finally {
    setUploading(false);
  }
};

  // HAPUS
  const hapusFile = async (item: ArsipItem) => {
    if (!confirm("Yakin hapus?")) return;

    await supabase
      .from("arsip_digital")
      .delete()
      .eq("id", item.id);

    loadArsip();
  };

  // PDF
  const exportPDF = () => {
    const doc = new jsPDF();

    doc.text("Laporan Arsip SIMASDI", 14, 15);

    autoTable(doc, {
      head: [["Dokumen", "Kategori"]],
      body: arsip.map((a) => [a.nama_dokumen, a.kategori]),
    });

    doc.save("arsip.pdf");
  };

  // FILTER DATA
  const filteredData = arsip.filter((item) => {
    const cocokCari =
      item.nama_dokumen?.toLowerCase().includes(cari.toLowerCase()) ||
      item.kategori?.toLowerCase().includes(cari.toLowerCase());

    const cocokKategori =
      filterKategori === "Semua" ||
      item.kategori?.toLowerCase() === filterKategori.toLowerCase();

    return cocokCari && cocokKategori;
  });

  // PAGINATION
  const startIndex = (page - 1) * limit;
  const paginatedData = filteredData.slice(startIndex, startIndex + limit);

  return (
    <div style={{ padding: "20px" }}>
      <h2>Arsip Digital SIMASDI</h2>

      {/* DASHBOARD */}
      <div style={{ display: "flex", gap: 15, marginBottom: 20 }}>
        <div style={{ background: "#2563eb", color: "#fff", padding: 15, borderRadius: 10 }}>
          <h3>{arsip.length}</h3>
          <p>Total</p>
        </div>

        <div style={{ background: "#16a34a", color: "#fff", padding: 15, borderRadius: 10 }}>
          <h3>{arsip.filter(a => a.kategori?.toLowerCase() === "surat masuk").length}</h3>
          <p>Masuk</p>
        </div>

        <div style={{ background: "#ea580c", color: "#fff", padding: 15, borderRadius: 10 }}>
          <h3>{arsip.filter(a => a.kategori?.toLowerCase() === "surat keluar").length}</h3>
          <p>Keluar</p>
        </div>
      </div>

      {/* FILTER */}
      <input
        placeholder="Cari..."
        value={cari}
        onChange={(e) => setCari(e.target.value)}
        style={{ padding: 8, width: "100%", marginBottom: 10 }}
      />

      <div style={{ marginBottom: 15 }}>
        <select
          value={filterKategori}
          onChange={(e) => setFilterKategori(e.target.value)}
          style={{ padding: 8, marginRight: 10 }}
        >
          <option value="Semua">Semua</option>
          <option value="Surat Masuk">Surat Masuk</option>
          <option value="Surat Keluar">Surat Keluar</option>
        </select>

        <button onClick={exportPDF}>Cetak PDF</button>
      </div>

      {/* UPLOAD */}
<div
  style={{
    background: "white",
    padding: "20px",
    borderRadius: "12px",
    marginBottom: "20px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
  }}
>
  <h3 style={{ marginTop: 0, marginBottom: "15px" }}>
    Upload Arsip Baru
  </h3>

  <div
    style={{
      display: "flex",
      gap: "12px",
      flexWrap: "wrap",
      alignItems: "center",
    }}
  >
    <input
      type="file"
      onChange={(e) => setFile(e.target.files?.[0] ?? null)}
      style={{
        border: "1px solid #cbd5e1",
        padding: "10px",
        borderRadius: "8px",
        background: "#f8fafc",
        maxWidth: "100%",
      }}
    />

    <select
      value={kategori}
      onChange={(e) => setKategori(e.target.value)}
      style={{
        padding: "10px",
        borderRadius: "8px",
        border: "1px solid #cbd5e1",
        background: "white",
      }}
    >
      <option value="Surat Masuk">Surat Masuk</option>
      <option value="Surat Keluar">Surat Keluar</option>
      <option value="Arsip Lainnya">Arsip Lainnya</option>
    </select>

   <button
  onClick={uploadFile}
  disabled={uploading}
  style={{
    padding: "10px 18px",
    background: uploading ? "#94a3b8" : "#2563eb",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: uploading ? "not-allowed" : "pointer",
    fontWeight: "bold",
  }}
>
  {uploading ? "⏳ Sedang upload..." : "⬆ Upload ke Google Drive"}
</button>
  </div>

  {file && (
    <p style={{ marginTop: "12px", color: "#475569", fontSize: "14px" }}>
      File dipilih: <b>{file.name}</b>
    </p>
  )}
</div>

    {/* TABLE */}
<div
  style={{
    overflowX: "auto",
    background: "white",
    borderRadius: "12px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
  }}
>
  <table
    style={{
      width: "100%",
      minWidth: "760px",
      borderCollapse: "collapse",
    }}
  >
    <thead>
      <tr style={{ background: "#1e3a8a", color: "white" }}>
        <th style={{ padding: "12px", textAlign: "left" }}>No</th>
        <th style={{ padding: "12px", textAlign: "left" }}>Dokumen</th>
        <th style={{ padding: "12px", textAlign: "center" }}>Kategori</th>
        <th style={{ padding: "12px", textAlign: "center" }}>Tanggal</th>
        <th style={{ padding: "12px", textAlign: "center" }}>File</th>
        <th style={{ padding: "12px", textAlign: "center" }}>Aksi</th>
      </tr>
    </thead>

    <tbody>
      {paginatedData.length === 0 ? (
        <tr>
          <td
            colSpan={6}
            style={{
              padding: "25px",
              textAlign: "center",
              color: "#64748b",
            }}
          >
            Belum ada data arsip.
          </td>
        </tr>
      ) : (
        paginatedData.map((item, index) => (
          <tr
            key={item.id}
            style={{
              borderBottom: "1px solid #e2e8f0",
            }}
          >
            <td style={{ padding: "12px" }}>
              {startIndex + index + 1}
            </td>

            <td
              style={{
                padding: "12px",
                maxWidth: "330px",
                wordBreak: "break-word",
              }}
            >
              {item.nama_dokumen}
            </td>

            <td style={{ padding: "12px", textAlign: "center" }}>
              <span
                style={{
                  display: "inline-block",
                  padding: "5px 9px",
                  borderRadius: "999px",
                  color: "#fff",
                  fontSize: "12px",
                  fontWeight: "bold",
                  background:
                    item.kategori?.toLowerCase() === "surat masuk"
                      ? "#16a34a"
                      : item.kategori?.toLowerCase() === "surat keluar"
                      ? "#ea580c"
                      : "#64748b",
                }}
              >
              {item.kategori || "Arsip Lainnya"}
              </span>
            </td>

            <td style={{ padding: "12px", textAlign: "center" }}>
              {item.created_at
                ? new Date(item.created_at).toLocaleDateString("id-ID")
                : "-"}
            </td>

            <td style={{ padding: "12px", textAlign: "center" }}>
              <a
                href={item.file_url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-block",
                  background: "#16a34a",
                  color: "white",
                  padding: "7px 10px",
                  borderRadius: "7px",
                  textDecoration: "none",
                  fontSize: "13px",
                  fontWeight: "bold",
                }}
              >
                👁 Lihat
              </a>
            </td>

            <td style={{ padding: "12px", textAlign: "center" }}>
              <button
                onClick={() => hapusFile(item)}
                style={{
                  background: "#dc2626",
                  color: "white",
                  border: "none",
                  padding: "7px 10px",
                  borderRadius: "7px",
                  cursor: "pointer",
                  fontSize: "13px",
                  fontWeight: "bold",
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

      {/* PAGINATION */}
      <div style={{ marginTop: 15 }}>
        <button
          onClick={() => setPage(page - 1)}
          disabled={page === 1}
        >
          Prev
        </button>

        <span style={{ margin: "0 10px" }}>Page {page}</span>

        <button
          onClick={() => setPage(page + 1)}
          disabled={startIndex + limit >= filteredData.length}
        >
          Next
        </button>
      </div>
    </div>
  );
}