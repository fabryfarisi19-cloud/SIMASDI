"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { UploadCloud, FileText, Trash2 } from "lucide-react";

type Arsip = {
  id: number;
  created_at: string;
  nama_dokumen: string;
  kategori: string;
  file_url: string | null;
  drive_file_id: string | null;
};

export default function ArsipPage() {
  const [arsipList, setArsipList] = useState<Arsip[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [kategori, setKategori] = useState("Dokumen Umum");
  const [cari, setCari] = useState("");
  const [loading, setLoading] = useState(true);
  const [mengupload, setMengupload] = useState(false);
const [dragAktif, setDragAktif] = useState(false);
  const loadArsip = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("arsip_digital")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      alert("Gagal memuat arsip: " + error.message);
    } else {
      setArsipList((data || []) as Arsip[]);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadArsip();
  }, []);

  const uploadArsip = async () => {
    if (!file) {
      alert("Pilih file terlebih dahulu.");
      return;
    }

    try {
      setMengupload(true);

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload-drive", {
        method: "POST",
        body: formData,
      });

      const hasil = await response.json();

      if (!response.ok || !hasil?.url) {
        throw new Error(hasil?.error || "Upload ke Google Drive gagal.");
      }

      const { error } = await supabase.from("arsip_digital").insert([
        {
          nama_dokumen: file.name,
          kategori,
          file_url: hasil.url,
          drive_file_id: hasil.fileId || null,
        },
      ]);

      if (error) {
        throw new Error(error.message);
      }

      alert("Arsip berhasil diupload dan tersimpan di Google Drive.");
      setFile(null);
      setKategori("Dokumen Umum");

      const input = document.getElementById("file-arsip") as HTMLInputElement;
      if (input) input.value = "";

      await loadArsip();
    } catch (error: any) {
      console.error(error);
      alert("Gagal upload file: " + (error.message || "Terjadi kesalahan."));
    } finally {
      setMengupload(false);
    }
  };

  const hapusArsip = async (item: Arsip) => {
    if (!confirm(`Hapus arsip "${item.nama_dokumen}"?`)) return;

    try {
      if (item.drive_file_id) {
        await fetch("/api/delete-drive", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileId: item.drive_file_id }),
        });
      }

      const { error } = await supabase
        .from("arsip_digital")
        .delete()
        .eq("id", item.id);

      if (error) throw new Error(error.message);

      alert("Arsip berhasil dihapus.");
      await loadArsip();
    } catch (error: any) {
      alert("Gagal menghapus arsip: " + error.message);
    }
  };

  const daftarTampil = useMemo(() => {
    const kata = cari.toLowerCase();

    return arsipList.filter((item) =>
      `${item.nama_dokumen} ${item.kategori}`
        .toLowerCase()
        .includes(kata)
    );
  }, [arsipList, cari]);

  return (
    <main style={{ minHeight: "100vh", padding: "32px", background: "#f5f7fb" }}>
      <h1 style={{ margin: 0, fontSize: "28px", color: "#0f172a" }}>
        Arsip Digital
      </h1>

      <p style={{ color: "#64748b", marginTop: "8px" }}>
        Pusat arsip Surat Masuk, Surat Keluar, dan dokumen lainnya.
      </p>

      <section style={cardStyle}>
        <h2 style={judulStyle}>Upload Arsip Lainnya</h2>

  <div style={{ marginBottom: "16px" }}>
 

 <div
 onDragOver={(e) => {
  e.preventDefault();
  setDragAktif(true);
}}
  onDragLeave={() => {
  setDragAktif(false);
}}
 onDrop={(e) => {
  e.preventDefault();

  setDragAktif(false);

  if (e.dataTransfer.files.length > 0) {
    setFile(e.dataTransfer.files[0]);
  }
}}
 style={{
  border: dragAktif
    ? "2px dashed #2563eb"
    : "2px dashed #94a3b8",

  background: dragAktif
    ? "#eff6ff"
    : "#ffffff",

  borderRadius: "16px",
  padding: "30px",
  minHeight: "250px",
  textAlign: "center",

  transition: "all .25s ease",

  transform: dragAktif
    ? "scale(1.01)"
    : "scale(1)",
}}
>

<div
  style={{
    marginBottom: "20px",
    display: "flex",
    justifyContent: "center",
  }}
>
  <UploadCloud
    size={80}
    color="#2563eb"
    strokeWidth={1.8}
  />
</div>
  
   <h3
    style={{
      margin: 0,
      color: "#0f172a",
    }}
  >
   {dragAktif
  ? "Lepaskan file di sini"
  : "Drag & Drop File"}
  </h3>

   <p
    style={{
      color: "#64748b",
      marginTop: "10px",
      marginBottom: "20px",
    }}
  >
    Seret file ke sini atau pilih dari komputer
  </p>

  <input
    id="file-arsip"
    type="file"
    onChange={(e: ChangeEvent<HTMLInputElement>) =>
      setFile(e.target.files?.[0] || null)
    }
    style={{ display: "none" }}
  />

  <label
    htmlFor="file-arsip"
    style={{
      display: "inline-block",
      padding: "12px 24px",
      background: "#2563eb",
      color: "white",
      borderRadius: "10px",
      fontWeight: 700,
      cursor: "pointer",
    }}
  >
    📂 Pilih File
  </label>

{!file && (
  <p
    style={{
      marginTop: "15px",
      color: "#64748b",
      fontSize: "15px",
    }}
  >
    Belum ada file dipilih
  </p>
)}
  <small style={{ color: "#94a3b8" }}>
    Format: PDF, Word, Excel, JPG, PNG
  </small>
  {file && (
 <div
  style={{
    marginTop: "24px",
    background: "#ffffff",
    border: "1px solid #dbeafe",
    borderRadius: "14px",
    padding: "18px 20px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    boxShadow: "0 4px 12px rgba(37,99,235,.08)",
  }}
>
<div
  style={{
    display: "flex",
    alignItems: "center",
    gap: "16px",
    flex: 1,
  }}
>
  <FileText
    size={32}
    color="#2563eb"
    strokeWidth={1.8}
  />

  <div>
    <div
      style={{
        fontWeight: 700,
        color: "#0f172a",
        fontSize: "15px",
      }}
    >
      {file.name}
    </div>

    <div
      style={{
        color: "#64748b",
        fontSize: "13px",
        marginTop: "3px",
      }}
    >
     <div
  style={{
    marginTop: "4px",
    color: "#64748b",
    fontSize: "13px",
  }}
>
  PDF • {(file.size / 1024 / 1024).toFixed(2)} MB • Siap diupload
</div>
    </div>
  </div>
</div>

    <button
      type="button"
      onClick={() => setFile(null)}
      style={{
        background: "#ef4444",
        color: "white",
        border: "none",
        borderRadius: "8px",
        padding: "8px 14px",
        cursor: "pointer",
        fontWeight: 700,
      }}
    >
      Hapus
    </button>
  </div>
)}
</div>

<div
  style={{
    display: "flex",
    gap: "15px",
    flexWrap: "wrap",
    alignItems: "center",
  }}
></div>


</div>

        <div style={{ display:"flex",
justifyContent:"center",
alignItems:"center",
gap:"15px",
flexWrap:"wrap",
marginTop:"20px", }}>
          <select
            value={kategori}
            onChange={(e) => setKategori(e.target.value)}
style={{
  ...inputStyle,
  width: "280px",
  height: "52px",
}}
          >
            <option>Dokumen Umum</option>
            <option>Surat Masuk</option>
            <option>Surat Keluar</option>
            <option>Dokumen Kepegawaian</option>
            <option>Laporan</option>
          </select>

          <button
  onClick={uploadArsip}
  disabled={mengupload}
  style={buttonBiru}
>
  {mengupload ? (
    <>⏳ Mengupload...</>
  ) : (
    <>
      <UploadCloud size={18} />
      Upload Arsip
    </>
  )}
</button>
        </div>
      </section>

      <section style={cardStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
          <h2 style={judulStyle}>Daftar Arsip</h2>

          <input
            value={cari}
            onChange={(e) => setCari(e.target.value)}
            placeholder="Cari nama dokumen atau kategori..."
style={{
  ...inputStyle,
  width: "340px",
  height: "46px",
  borderRadius: "12px",
}}
          />
        </div>

        <div style={{ overflowX: "auto", marginTop: "18px" }}>
          <table style={{ width: "100%", minWidth: "850px", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background:"#0B2E78", color: "white" }}>
                <th style={thStyle}>No</th>
                <th style={thStyle}>Nama Dokumen</th>
                <th style={thStyle}>Kategori</th>
                <th style={thStyle}>Tanggal Upload</th>
                <th style={thStyle}>File</th>
                <th style={thStyle}>Aksi</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={emptyStyle}>Memuat arsip...</td>
                </tr>
              ) : daftarTampil.length === 0 ? (
                <tr>
                  <td colSpan={6} style={emptyStyle}>Arsip tidak ditemukan.</td>
                </tr>
              ) : (
                daftarTampil.map((item, index) => (
               <tr
  key={item.id}
  style={{
    background:
      index % 2 === 0
        ? "#ffffff"
        : "#f8fafc",
    borderBottom:"1px solid #e5e7eb",
  }}
>

                   <td
  style={{
    ...tdStyle,
    fontWeight:700,
    color:"#2563eb",
  }}
>
  {index+1}
</td>
<td
  style={{
    ...tdStyle,
    fontWeight:700,
  }}
>
  📄 {item.nama_dokumen}
</td>
                    <td style={tdStyle}>{item.kategori}</td>
                    <td style={tdStyle}>
                      {new Date(item.created_at).toLocaleDateString("id-ID")}
                    </td>
                    <td style={tdStyle}>
                      {item.file_url ? (
<a
  href={item.file_url ?? "#"}
  target="_blank"
  rel="noreferrer"
  style={{
    background: "#2563eb",
    color: "white",
    padding: "8px 14px",
    borderRadius: "8px",
    textDecoration: "none",
    fontWeight: 700,
    display: "inline-block",
  }}
>
  📄 Lihat
</a>

                      ) : "-"}
                    </td>
                    <td style={tdStyle}>

<button
  onClick={() => hapusArsip(item)}
  style={{
    ...buttonHapus,
    background: "#dc2626",
    padding: "8px 14px",
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

const cardStyle = {
  background: "white",
  borderRadius: "16px",
  padding: "24px",
  marginTop: "24px",
  boxShadow: "0 6px 18px rgba(15, 23, 42, 0.07)",
};

const judulStyle = {
  margin: "0 0 16px",
  color: "#102a63",
  fontSize: "20px",
  fontWeight: "800",
};

const inputStyle = {
  padding: "12px",
  border: "1px solid #cbd5e1",
  borderRadius: "8px",
  fontSize: "14px",
  boxSizing: "border-box" as const,
};

const buttonBiru = {
  border: "none",
  borderRadius: "10px",
  padding: "14px 30px",
  background: "#2563eb",
  color: "white",
  fontWeight: 700,
  fontSize: "16px",
  cursor: "pointer",
  boxShadow: "0 6px 18px rgba(37,99,235,.25)",

  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "8px",

  minWidth: "170px",
};

const buttonHapus = {
  border: "none",
  borderRadius: "7px",
  padding: "8px 12px",
  background: "#dc2626",
  color: "white",
  fontWeight: "700",
  cursor: "pointer",
};

const thStyle = {
  padding: "14px",
  textAlign: "left" as const,
  fontSize: "13px",
};

const tdStyle = {
  padding: "14px",
  color: "#334155",
  fontSize: "14px",
};

const emptyStyle = {
  padding: "30px",
  textAlign: "center" as const,
  color: "#64748b",
};