"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function SuratMasukPage() {
  const [surat, setSurat] = useState<any[]>([]);
  const [showDisposisi, setShowDisposisi] = useState(false);
const [suratDipilih, setSuratDipilih] = useState<any>(null);
const [tujuan, setTujuan] = useState("");
const [isiDisposisi, setIsiDisposisi] = useState(
  "Mohon ditindaklanjuti."
);
const [loadingDisposisi, setLoadingDisposisi] = useState(false);
  const [noAgenda, setNoAgenda] = useState("");
  const [nomorSurat, setNomorSurat] = useState("");
  const [asalSurat, setAsalSurat] = useState("");
  const [perihal, setPerihal] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const loadData = async () => {
    const { data, error } = await supabase
      .from("surat_masuk")
      .select("*")
      .order("id", { ascending: false });

    if (error) {
      console.error(error);
      alert("Gagal memuat data surat masuk.");
      return;
    }

    setSurat(data || []);
  };

  useEffect(() => {
    loadData();
  }, []);

  const simpanSurat = async () => {
    if (!noAgenda || !nomorSurat || !asalSurat || !perihal) {
      return alert("No agenda, nomor surat, asal surat, dan perihal wajib diisi.");
    }

    try {
      setUploading(true);

      let fileUrl = "";

      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("kategori", "Surat Masuk");

        const res = await fetch("/api/upload-drive", {
          method: "POST",
          body: formData,
        });

        const result = await res.json();

        if (!result.success) {
          return alert(
            "Upload file gagal: " +
              (result.error || "Error tidak diketahui")
          );
        }

        fileUrl = result.fileUrl;
      }

      const { error } = await supabase.from("surat_masuk").insert({
        no_agenda: noAgenda,
        nomor_surat: nomorSurat,
        asal_surat: asalSurat,
        perihal,
        file_url: fileUrl,
        created_at: new Date().toISOString(),
      });

      if (error) {
        console.error(error);
        return alert("Data surat masuk gagal disimpan.");
      }

      setNoAgenda("");
      setNomorSurat("");
      setAsalSurat("");
      setPerihal("");
      setFile(null);

      await loadData();
      alert("Surat masuk berhasil disimpan.");
    } catch (error) {
      console.error(error);
      alert("Terjadi kesalahan saat menyimpan surat masuk.");
    } finally {
      setUploading(false);
    }
  };

  const hapusSurat = async (id: number) => {
    if (!confirm("Yakin hapus data surat masuk ini?")) return;

    const { error } = await supabase
      .from("surat_masuk")
      .delete()
      .eq("id", id);

    if (error) {
      return alert("Gagal menghapus surat masuk.");
    }

    await loadData();
  };

 
  
const bukaDisposisi = (item: any) => {
  setSuratDipilih(item);
  setTujuan("");
  setIsiDisposisi("Mohon ditindaklanjuti.");
  setShowDisposisi(true);
};

const simpanDisposisi = async () => {
  if (!suratDipilih) return;

  if (!tujuan.trim()) {
    alert("Tujuan disposisi wajib diisi.");
    return;
  }

  setLoadingDisposisi(true);

  const { error } = await supabase.from("disposisi").insert([
    {
      surat_masuk_id: suratDipilih.id,
      nomor_surat: suratDipilih.nomor_surat,
      asal_surat: suratDipilih.asal_surat,
      perihal: suratDipilih.perihal,
      tujuan: tujuan,
      isi_disposisi: isiDisposisi,
      status: "Menunggu",
    },
  ]);

  setLoadingDisposisi(false);

  if (error) {
    alert("Gagal menyimpan disposisi: " + error.message);
    return;
  }

  alert("Disposisi berhasil disimpan.");
  setShowDisposisi(false);
  setSuratDipilih(null);
};
  return (
    <div style={{ padding: "20px" }}>
      <h2>Surat Masuk</h2>

      <div
        style={{
          background: "white",
          padding: "20px",
          borderRadius: "12px",
          marginBottom: "20px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        }}
      >
        <h3 style={{ marginTop: 0 }}>Tambah Surat Masuk</h3>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "12px",
          }}
        >
          <input
            placeholder="No Agenda"
            value={noAgenda}
            onChange={(e) => setNoAgenda(e.target.value)}
            style={{ padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
          />

          <input
            placeholder="Nomor Surat"
            value={nomorSurat}
            onChange={(e) => setNomorSurat(e.target.value)}
            style={{ padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
          />

          <input
            placeholder="Asal Surat"
            value={asalSurat}
            onChange={(e) => setAsalSurat(e.target.value)}
            style={{ padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
          />

          <input
            placeholder="Perihal Surat"
            value={perihal}
            onChange={(e) => setPerihal(e.target.value)}
            style={{ padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
          />

          <input
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            style={{ padding: "8px" }}
          />
        </div>

        <button
          onClick={simpanSurat}
          disabled={uploading}
          style={{
            marginTop: "15px",
            padding: "10px 18px",
            background: uploading ? "#94a3b8" : "#2563eb",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: uploading ? "not-allowed" : "pointer",
            fontWeight: "bold",
          }}
        >
          {uploading ? "⏳ Sedang menyimpan..." : "💾 Simpan Surat Masuk"}
        </button>
      </div>

      <button
        onClick={loadData}
        style={{
          marginBottom: "15px",
          padding: "8px 12px",
          border: "none",
          borderRadius: "7px",
          cursor: "pointer",
        }}
      >
        🔄 Refresh
      </button>

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
            minWidth: "900px",
            borderCollapse: "collapse",
          }}
        >
          <thead>
            <tr style={{ background: "#1e3a8a", color: "white" }}>
              <th style={{ padding: "12px", textAlign: "left" }}>No Agenda</th>
              <th style={{ padding: "12px", textAlign: "left" }}>Nomor Surat</th>
              <th style={{ padding: "12px", textAlign: "left" }}>Asal Surat</th>
              <th style={{ padding: "12px", textAlign: "left" }}>Perihal</th>
              <th style={{ padding: "12px", textAlign: "center" }}>File</th>
              <th style={{ padding: "12px", textAlign: "center" }}>Aksi</th>
            </tr>
          </thead>

          <tbody>
            {surat.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: "25px", textAlign: "center" }}>
                  Belum ada data surat masuk.
                </td>
              </tr>
            ) : (
              surat.map((item) => (
                <tr key={item.id} style={{ borderBottom: "1px solid #e2e8f0" }}>
                  <td style={{ padding: "12px" }}>{item.no_agenda}</td>
                  <td style={{ padding: "12px" }}>{item.nomor_surat}</td>
                  <td style={{ padding: "12px" }}>{item.asal_surat}</td>
                  <td style={{ padding: "12px" }}>{item.perihal}</td>

                  <td style={{ padding: "12px", textAlign: "center" }}>
                    {item.file_url ? (
                      <a
                        href={item.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          background: "#16a34a",
                          color: "white",
                          padding: "7px 10px",
                          borderRadius: "7px",
                          textDecoration: "none",
                          fontSize: "13px",
                        }}
                      >
                        👁 Lihat
                      </a>
                    ) : (
                      "-"
                    )}
                  </td>

                  <td style={{ padding: "12px", textAlign: "center" }}>
                    <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>

<button
  onClick={() => bukaDisposisi(item)}
  style={{
    background: "#f59e0b",
    color: "white",
    border: "none",
    padding: "7px 10px",
    borderRadius: "7px",
    cursor: "pointer",
  }}
>
  Disposisi
</button>                      

                      <button
                        onClick={() => hapusSurat(item.id)}
                        style={{
                          background: "#dc2626",
                          color: "white",
                          border: "none",
                          padding: "7px 10px",
                          borderRadius: "7px",
                          cursor: "pointer",
                        }}
                      >
                        Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {showDisposisi && suratDipilih && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
            padding: 20,
          }}
        >
          <div
            style={{
              background: "#fff",
              width: "100%",
              maxWidth: 600,
              borderRadius: 12,
              padding: 24,
              boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
            }}
          >
            <h3 style={{ marginTop: 0 }}>Buat Disposisi Surat</h3>

            <p><b>Nomor Surat:</b> {suratDipilih.nomor_surat || "-"}</p>
            <p><b>Asal Surat:</b> {suratDipilih.asal_surat || "-"}</p>
            <p><b>Perihal:</b> {suratDipilih.perihal || "-"}</p>

            <label style={{ display: "block", marginBottom: 6 }}>
              Tujuan Disposisi
            </label>

            <input
              value={tujuan}
              onChange={(e) => setTujuan(e.target.value)}
              placeholder="Contoh: Kasi Bimbingan Klien Dewasa"
              style={{
                width: "100%",
                padding: 10,
                borderRadius: 7,
                border: "1px solid #cbd5e1",
                marginBottom: 15,
                boxSizing: "border-box",
              }}
            />

            <label style={{ display: "block", marginBottom: 6 }}>
              Isi Disposisi
            </label>

            <textarea
              value={isiDisposisi}
              onChange={(e) => setIsiDisposisi(e.target.value)}
              rows={4}
              style={{
                width: "100%",
                padding: 10,
                borderRadius: 7,
                border: "1px solid #cbd5e1",
                boxSizing: "border-box",
              }}
            />

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 10,
                marginTop: 20,
              }}
            >
              <button
                onClick={() => setShowDisposisi(false)}
                disabled={loadingDisposisi}
                style={{
                  padding: "10px 14px",
                  border: "none",
                  borderRadius: 7,
                  cursor: "pointer",
                }}
              >
                Batal
              </button>

              <button
                onClick={simpanDisposisi}
                disabled={loadingDisposisi}
                style={{
                  padding: "10px 14px",
                  border: "none",
                  borderRadius: 7,
                  cursor: "pointer",
                  background: "#2563eb",
                  color: "#fff",
                  fontWeight: "bold",
                }}
              >
                {loadingDisposisi ? "Menyimpan..." : "Simpan Disposisi"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}      
  