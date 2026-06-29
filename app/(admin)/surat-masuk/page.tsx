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
      alert("Gagal memuat data surat: " + error.message);
      return;
    }

    setSuratList(data || []);
  };

  useEffect(() => {
    loadSurat();
  }, []);

  const ambilDataDariTeks = (teks: string) => {
    const bersihkan = (nilai: string) =>
      nilai.replace(/\s+/g, " ").replace(/[|]/g, "").trim();

    const baris = teks
      .split("\n")
      .map((item) => bersihkan(item))
      .filter(Boolean);

    const barisNomor = baris.find((item) =>
      /^(nomor|nomor surat|no\.?|no surat)\b/i.test(item)
    );

    let nomorSuratBersih = "";

    if (barisNomor) {
      nomorSuratBersih = barisNomor
        .replace(/^(nomor|nomor surat|no\.?|no surat)\s*[:.]?\s*/i, "")
        .replace(
          /\b\d{1,2}\s+(januari|februari|maret|april|mei|juni|juli|agustus|september|oktober|november|desember)\s+\d{4}\b.*$/i,
          ""
        )
        .replace(/\bjakarta\b.*$/i, "")
        .trim();
    }

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
      setSedangMembaca(true);

      let sumberGambar: string | HTMLCanvasElement;

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
          throw new Error("Canvas tidak dapat dibuat");
        }

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await halaman.render({
          canvasContext: context,
          viewport: viewport,
        } as any).promise;

        sumberGambar = canvas;
      } else {
        sumberGambar = URL.createObjectURL(file);
      }

      const hasil = await Tesseract.recognize(sumberGambar, "ind");

      ambilDataDariTeks(hasil.data.text);

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

      alert("Pembacaan selesai. Periksa kembali data surat sebelum disimpan.");
    } catch (error) {
      console.error(error);
      alert(
        "File berhasil dipilih, tetapi pembacaan otomatis gagal. Isi data surat secara manual lalu simpan."
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

// Otomatis buat arsip digital dari surat masuk
const { error: arsipError } = await supabase
  .from("arsip_digital")
  .insert([
    {
      nama_dokumen: `${form.nomor_surat} - ${form.perihal}`,
      kategori: "Surat Masuk",
      file_url: fileUrl,
      drive_file_id: null,
    },
  ]);
if (arsipError) {
  console.error("Gagal membuat arsip otomatis:", arsipError.message);
  alert(
    "Surat masuk berhasil disimpan, tetapi arsip digital belum berhasil dibuat."
  );
} else {
  alert("Surat masuk berhasil disimpan dan otomatis masuk Arsip Digital.");
}

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
    <main
      style={{
        minHeight: "100vh",
        padding: "24px",
        background: "#f5f7fb",
      }}
    >
      <div style={{ maxWidth: "1150px", margin: "0 auto" }}>
        <h1
          style={{
            margin: "0 0 24px",
            color: "#0f172a",
            fontSize: "28px",
            fontWeight: "800",
          }}
        >
          Surat Masuk
        </h1>

        <section style={cardStyle}>
          <h2 style={judulStyle}>Upload & Baca Surat Otomatis</h2>

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
              Tarik dan lepas file surat di sini
            </div>

            <div
              style={{
                marginTop: "7px",
                color: "#64748b",
                fontSize: "14px",
              }}
            >
              atau klik untuk mencari file JPG, JPEG, PNG, atau PDF
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

            {sedangMembaca && (
              <div
                style={{
                  marginTop: "14px",
                  color: "#2563eb",
                  fontSize: "14px",
                  fontWeight: "800",
                }}
              >
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

          <h2 style={judulStyle}>Data Surat Masuk</h2>

          <div className="form-surat-grid">
            <div>
              <label style={labelStyle}>No Agenda</label>
              <input
                value={form.no_agenda}
                onChange={(e) =>
                  setForm({ ...form, no_agenda: e.target.value })
                }
                placeholder="Contoh: SM-001"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Nomor Surat</label>
              <input
                value={form.nomor_surat}
                onChange={(e) =>
                  setForm({ ...form, nomor_surat: e.target.value })
                }
                placeholder="Nomor surat"
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
              <label style={labelStyle}>Asal Surat</label>
              <input
                value={form.asal_surat}
                onChange={(e) =>
                  setForm({ ...form, asal_surat: e.target.value })
                }
                placeholder="Asal surat"
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

          <button onClick={simpanSurat} style={buttonBiru}>
            💾 Simpan Surat Masuk
          </button>
        </section>

        <section style={{ ...cardStyle, marginTop: "24px", padding: 0 }}>
          <div className="toolbar-surat">
            <h2
              style={{
                margin: 0,
                color: "#1e3a8a",
                fontSize: "21px",
                fontWeight: "800",
              }}
            >
              Daftar Surat Masuk
            </h2>

            <div className="toolbar-kanan">
              <input
                value={cari}
                onChange={(e) => setCari(e.target.value)}
                placeholder="🔎 Cari surat..."
                style={{ ...inputStyle, margin: 0 }}
              />

              <button onClick={loadSurat} style={buttonPutih}>
                🔄 Perbarui
              </button>
            </div>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                minWidth: "930px",
                borderCollapse: "collapse",
              }}
            >
              <thead style={{ background: "#1e3a8a", color: "white" }}>
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
                    <td colSpan={7} style={emptyStyle}>
                      Belum ada data surat masuk.
                    </td>
                  </tr>
                ) : (
                  daftarTampil.map((item) => (
                    <tr
                      key={item.id}
                      style={{ borderBottom: "1px solid #e2e8f0" }}
                    >
                      <td style={tdStyle}>{item.no_agenda || "-"}</td>
                      <td style={tdStyle}>{item.tanggal_surat || "-"}</td>
                      <td style={tdStyle}>{item.nomor_surat || "-"}</td>
                      <td style={tdStyle}>{item.asal_surat || "-"}</td>
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
                          onClick={() => hapusSurat(item)}
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
        .form-surat-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 14px;
        }

        .toolbar-surat {
          padding: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 14px;
          border-bottom: 1px solid #e2e8f0;
        }

        .toolbar-kanan {
          display: flex;
          align-items: center;
          gap: 10px;
          width: min(100%, 520px);
        }

        @media (max-width: 768px) {
          .form-surat-grid {
            grid-template-columns: 1fr;
            gap: 16px;
          }

          .toolbar-surat {
            align-items: stretch;
            flex-direction: column;
          }

          .toolbar-kanan {
            width: 100%;
            flex-direction: column;
            align-items: stretch;
          }

          .toolbar-kanan button {
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

const buttonPutih = {
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
