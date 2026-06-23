"use client";

import { ChangeEvent, DragEvent, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

type FormSuratKeluar = {
  nomor_surat: string;
  tanggal_surat: string;
  tujuan_surat: string;
  perihal: string;
};

export default function SuratKeluarPage() {
  const [form, setForm] = useState<FormSuratKeluar>({
    nomor_surat: "",
    tanggal_surat: "",
    tujuan_surat: "",
    perihal: "",
  });

  const [fileSurat, setFileSurat] = useState<File | null>(null);
  const [suratList, setSuratList] = useState<any[]>([]);
  const [cari, setCari] = useState("");
  const [dragAktif, setDragAktif] = useState(false);
  const [menyimpan, setMenyimpan] = useState(false);

  const inputFileRef = useRef<HTMLInputElement>(null);

  const loadSuratKeluar = async () => {
    const { data, error } = await supabase
      .from("surat_keluar")
      .select("*")
      .order("id", { ascending: false });

    if (error) {
      console.error(error.message);
      alert("Gagal memuat surat keluar: " + error.message);
      return;
    }

    setSuratList(data || []);
  };

  useEffect(() => {
    loadSuratKeluar();
  }, []);

  const pilihFile = (file: File) => {
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

    if (!form.perihal) {
      setForm((lama) => ({
        ...lama,
        perihal: file.name
          .replace(/\.(pdf|jpg|jpeg|png)$/i, "")
          .replace(/[_-]/g, " "),
      }));
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) pilihFile(file);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragAktif(false);

    const file = e.dataTransfer.files?.[0];
    if (file) pilihFile(file);
  };

  const simpanSuratKeluar = async () => {
    if (
      !form.nomor_surat.trim() ||
      !form.tanggal_surat ||
      !form.tujuan_surat.trim() ||
      !form.perihal.trim()
    ) {
      alert("Nomor surat, tanggal, tujuan, dan perihal wajib diisi.");
      return;
    }

    try {
      setMenyimpan(true);

      let fileUrl = "";

      if (fileSurat) {
        const namaFile = `${Date.now()}-${fileSurat.name.replace(/\s/g, "-")}`;

        const { error: uploadError } = await supabase.storage
          .from("surat")
          .upload(namaFile, fileSurat);

        if (uploadError) {
          alert("Upload file gagal: " + uploadError.message);
          return;
        }

        const { data: urlData } = supabase.storage
          .from("surat")
          .getPublicUrl(namaFile);

        fileUrl = urlData.publicUrl;
      }

      const { error } = await supabase.from("surat_keluar").insert([
        {
          nomor_surat: form.nomor_surat.trim(),
          tanggal_surat: form.tanggal_surat,
          tujuan_surat: form.tujuan_surat.trim(),
          perihal: form.perihal.trim(),
          file_url: fileUrl,
          tanggal: new Date().toISOString(),
        },
      ]);

      if (error) {
        alert("Gagal menyimpan surat keluar: " + error.message);
        return;
      }

      alert("Surat keluar berhasil disimpan.");

      setForm({
        nomor_surat: "",
        tanggal_surat: "",
        tujuan_surat: "",
        perihal: "",
      });

      setFileSurat(null);

      if (inputFileRef.current) {
        inputFileRef.current.value = "";
      }

      await loadSuratKeluar();
    } catch (error) {
      console.error(error);
      alert("Terjadi kesalahan saat menyimpan surat keluar.");
    } finally {
      setMenyimpan(false);
    }
  };

  const hapusSuratKeluar = async (item: any) => {
    if (!confirm("Yakin ingin menghapus surat keluar ini?")) return;

    const { error } = await supabase
      .from("surat_keluar")
      .delete()
      .eq("id", item.id);

    if (error) {
      alert("Gagal menghapus surat: " + error.message);
      return;
    }

    await loadSuratKeluar();
  };

  const daftarTampil = suratList.filter((item) => {
    const teks = `${item.nomor_surat || ""} ${item.tujuan_surat || ""} ${
      item.perihal || ""
    } ${item.tanggal_surat || ""}`.toLowerCase();

    return teks.includes(cari.toLowerCase());
  });

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "24px",
        background: "#f5f7fb",
      }}
    >
      <div style={{ maxWidth: "1150px", margin: "0 auto" }}>
        <div style={{ marginBottom: "24px" }}>
          <h1
            style={{
              margin: 0,
              color: "#0f172a",
              fontSize: "28px",
              fontWeight: "800",
            }}
          >
            Surat Keluar
          </h1>

          <p style={{ margin: "7px 0 0", color: "#64748b" }}>
            Upload, kelola, dan pantau surat keluar.
          </p>
        </div>

        <section style={cardStyle}>
          <h2 style={judulStyle}>📤 Upload Surat Keluar</h2>

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
              padding: "28px 18px",
              textAlign: "center",
              cursor: "pointer",
              background: dragAktif ? "#eff6ff" : "#f8fafc",
              marginBottom: "28px",
            }}
          >
            <div style={{ fontSize: "32px", marginBottom: "8px" }}>📄</div>

            <div
              style={{
                color: "#0f172a",
                fontSize: "17px",
                fontWeight: "800",
              }}
            >
              Tarik dan lepas file surat keluar di sini
            </div>

            <div
              style={{
                marginTop: "7px",
                color: "#64748b",
                fontSize: "14px",
              }}
            >
              PDF, JPG, JPEG, atau PNG
            </div>

            {fileSurat && (
              <div
                style={{
                  marginTop: "14px",
                  color: "#047857",
                  fontSize: "14px",
                  fontWeight: "800",
                  wordBreak: "break-word",
                }}
              >
                File dipilih: {fileSurat.name}
              </div>
            )}

            <input
              ref={inputFileRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileChange}
              style={{ display: "none" }}
            />
          </div>

          <h2 style={judulStyle}>🧾 Data Surat Keluar</h2>

          <div className="form-surat-keluar-grid">
            <div>
              <label style={labelStyle}>Nomor Surat</label>
              <input
                value={form.nomor_surat}
                onChange={(e) =>
                  setForm({ ...form, nomor_surat: e.target.value })
                }
                placeholder="Masukkan nomor surat"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Tanggal Surat</label>
              <input
                type="date"
                value={form.tanggal_surat}
                onChange={(e) =>
                  setForm({ ...form, tanggal_surat: e.target.value })
                }
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Tujuan Surat</label>
              <input
                value={form.tujuan_surat}
                onChange={(e) =>
                  setForm({ ...form, tujuan_surat: e.target.value })
                }
                placeholder="Contoh: Kantor Wilayah"
                style={inputStyle}
              />
            </div>
          </div>

          <div style={{ marginTop: "16px" }}>
            <label style={labelStyle}>Perihal Surat</label>
            <textarea
              value={form.perihal}
              onChange={(e) => setForm({ ...form, perihal: e.target.value })}
              placeholder="Perihal surat"
              rows={4}
              style={{ ...inputStyle, resize: "vertical" }}
            />
          </div>

          <button
            onClick={simpanSuratKeluar}
            disabled={menyimpan}
            style={buttonBiru}
          >
            {menyimpan ? "Menyimpan..." : "💾 Simpan Surat Keluar"}
          </button>
        </section>

        <section style={{ ...cardStyle, marginTop: "24px", padding: 0 }}>
          <div className="toolbar-surat-keluar">
            <h2
              style={{
                margin: 0,
                color: "#1e3a8a",
                fontSize: "21px",
                fontWeight: "800",
              }}
            >
              Daftar Surat Keluar
            </h2>

            <div className="toolbar-kanan-surat-keluar">
              <input
                value={cari}
                onChange={(e) => setCari(e.target.value)}
                placeholder="🔎 Cari nomor, tujuan, perihal..."
                style={inputStyle}
              />

              <button onClick={loadSuratKeluar} style={buttonPerbarui}>
                🔄 Perbarui
              </button>
            </div>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                minWidth: "850px",
                borderCollapse: "collapse",
              }}
            >
              <thead style={{ background: "#1e3a8a", color: "white" }}>
                <tr>
                  <th style={thStyle}>No</th>
                  <th style={thStyle}>Nomor Surat</th>
                  <th style={thStyle}>Tanggal</th>
                  <th style={thStyle}>Tujuan</th>
                  <th style={thStyle}>Perihal</th>
                  <th style={thStyle}>File</th>
                  <th style={thStyle}>Aksi</th>
                </tr>
              </thead>

              <tbody>
                {daftarTampil.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={emptyStyle}>
                      Belum ada data surat keluar.
                    </td>
                  </tr>
                ) : (
                  daftarTampil.map((item, index) => (
                    <tr
                      key={item.id}
                      style={{ borderBottom: "1px solid #e2e8f0" }}
                    >
                      <td style={tdStyle}>{index + 1}</td>
                      <td style={tdStyle}>{item.nomor_surat || "-"}</td>
                      <td style={tdStyle}>{item.tanggal_surat || "-"}</td>
                      <td style={tdStyle}>{item.tujuan_surat || "-"}</td>
                      <td style={tdStyle}>{item.perihal || "-"}</td>
                      <td style={tdStyle}>
                        {item.file_url ? (
                          <a
                            href={item.file_url}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              color: "#2563eb",
                              fontWeight: "800",
                              textDecoration: "none",
                            }}
                          >
                            👁 Lihat
                          </a>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td style={tdStyle}>
                        <button
                          onClick={() => hapusSuratKeluar(item)}
                          style={buttonHapus}
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
      </div>

      <style jsx>{`
        .form-surat-keluar-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
        }

        .toolbar-surat-keluar {
          padding: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 14px;
          border-bottom: 1px solid #e2e8f0;
        }

        .toolbar-kanan-surat-keluar {
          display: flex;
          align-items: center;
          gap: 10px;
          width: min(100%, 540px);
        }

        @media (max-width: 768px) {
          .form-surat-keluar-grid {
            grid-template-columns: 1fr;
            gap: 16px;
          }

          .toolbar-surat-keluar {
            flex-direction: column;
            align-items: stretch;
          }

          .toolbar-kanan-surat-keluar {
            width: 100%;
            flex-direction: column;
            align-items: stretch;
          }

          .toolbar-kanan-surat-keluar button {
            width: 100%;
          }
        }
      `}</style>
    </main>
  );
}

const cardStyle = {
  background: "white",
  borderRadius: "16px",
  padding: "24px",
  boxShadow: "0 8px 20px rgba(15, 23, 42, 0.07)",
};

const judulStyle = {
  margin: "0 0 18px",
  color: "#1e3a8a",
  fontSize: "21px",
  fontWeight: "800",
};

const labelStyle = {
  display: "block",
  marginBottom: "8px",
  color: "#0f172a",
  fontSize: "14px",
  fontWeight: "800",
};

const inputStyle = {
  width: "100%",
  boxSizing: "border-box" as const,
  padding: "13px 14px",
  border: "1px solid #cbd5e1",
  borderRadius: "10px",
  outline: "none",
  fontSize: "14px",
};

const buttonBiru = {
  marginTop: "20px",
  background: "#2563eb",
  color: "white",
  border: "none",
  padding: "13px 18px",
  borderRadius: "9px",
  fontWeight: "800",
  cursor: "pointer",
};

const buttonPerbarui = {
  background: "#2563eb",
  color: "white",
  border: "none",
  padding: "13px 16px",
  borderRadius: "10px",
  fontWeight: "800",
  cursor: "pointer",
  whiteSpace: "nowrap" as const,
};

const buttonHapus = {
  background: "#dc2626",
  color: "white",
  border: "none",
  padding: "8px 12px",
  borderRadius: "7px",
  fontWeight: "700",
  cursor: "pointer",
  whiteSpace: "nowrap" as const,
};

const thStyle = {
  padding: "14px 16px",
  textAlign: "left" as const,
  fontSize: "13px",
  whiteSpace: "nowrap" as const,
};

const tdStyle = {
  padding: "14px 16px",
  color: "#334155",
  fontSize: "14px",
  verticalAlign: "top" as const,
};

const emptyStyle = {
  textAlign: "center" as const,
  padding: "32px",
  color: "#64748b",
};
