"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type SuratMasuk = {
  id: number;
  nomor_surat: string | null;
  asal_surat: string | null;
  perihal: string | null;
};

type Disposisi = {
  id: number;
  nomor_surat: string | null;
  tujuan: string | null;
  isi_disposisi: string | null;
  status: string | null;
};

const inputStyle = {
  width: "100%",
  boxSizing: "border-box" as const,
  padding: "13px 14px",
  border: "1px solid #cbd5e1",
  borderRadius: "10px",
  outline: "none",
  fontSize: "15px",
  background: "white",
};

const labelStyle = {
  display: "block",
  marginBottom: "8px",
  color: "#0f172a",
  fontWeight: "800",
  fontSize: "15px",
};

export default function DisposisiPage() {
  const [suratList, setSuratList] = useState<SuratMasuk[]>([]);
  const [riwayat, setRiwayat] = useState<Disposisi[]>([]);
  const [suratId, setSuratId] = useState("");
  const [tujuan, setTujuan] = useState("");
  const [isiDisposisi, setIsiDisposisi] = useState("");
  const [loading, setLoading] = useState(true);
  const [menyimpan, setMenyimpan] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      const [suratRes, disposisiRes] = await Promise.all([
        supabase
          .from("surat_masuk")
          .select("id, nomor_surat, asal_surat, perihal")
          .order("id", { ascending: false }),

        supabase
          .from("disposisi")
          .select("*")
          .order("id", { ascending: false }),
      ]);

      if (suratRes.error) {
        alert("Gagal memuat surat: " + suratRes.error.message);
      } else {
        setSuratList((suratRes.data || []) as SuratMasuk[]);
      }

      if (disposisiRes.error) {
        alert("Gagal memuat riwayat disposisi: " + disposisiRes.error.message);
      } else {
        setRiwayat((disposisiRes.data || []) as Disposisi[]);
      }
    } catch (error) {
      console.error(error);
      alert("Terjadi kesalahan saat memuat data.");
    } finally {
      setLoading(false);
    }
  };

  const suratDipilih = suratList.find(
    (item) => String(item.id) === suratId
  );

  // Otomatis isi disposisi ketika surat atau tujuan dipilih
  useEffect(() => {
    if (!suratDipilih || !tujuan) return;

    const isiOtomatis =
      `Mohon ${tujuan} untuk menindaklanjuti surat berikut.\n\n` +
      `Nomor Surat: ${suratDipilih.nomor_surat || "-"}\n` +
      `Asal Surat: ${suratDipilih.asal_surat || "-"}\n` +
      `Perihal: ${suratDipilih.perihal || "-"}\n\n` +
      `Harap diproses sesuai ketentuan yang berlaku.`;

    setIsiDisposisi(isiOtomatis);
  }, [suratId, tujuan]);

  const resetForm = () => {
    setSuratId("");
    setTujuan("");
    setIsiDisposisi("");
  };

  const simpanDisposisi = async () => {
    if (!suratDipilih) {
      alert("Pilih surat terlebih dahulu.");
      return;
    }

    if (!tujuan) {
      alert("Pilih tujuan disposisi terlebih dahulu.");
      return;
    }

    if (!isiDisposisi.trim()) {
      alert("Isi disposisi masih kosong.");
      return;
    }

    try {
      setMenyimpan(true);

      const { error } = await supabase.from("disposisi").insert([
        {
          nomor_surat: suratDipilih.nomor_surat || "-",
          tujuan,
          isi_disposisi: isiDisposisi,
          status: "Menunggu",
        },
      ]);

      if (error) {
        alert("Gagal menyimpan disposisi: " + error.message);
        return;
      }

      alert("Disposisi berhasil disimpan.");
      resetForm();
      await loadData();
    } catch (error) {
      console.error(error);
      alert("Terjadi kesalahan saat menyimpan disposisi.");
    } finally {
      setMenyimpan(false);
    }
  };

  const kirimWhatsApp = () => {
    if (!suratDipilih) {
      alert("Pilih surat terlebih dahulu.");
      return;
    }

    if (!tujuan) {
      alert("Pilih tujuan disposisi terlebih dahulu.");
      return;
    }

    const isiOtomatis =
      isiDisposisi.trim() ||
      `Mohon ${tujuan} untuk menindaklanjuti surat berikut.\n\n` +
        `Nomor Surat: ${suratDipilih.nomor_surat || "-"}\n` +
        `Asal Surat: ${suratDipilih.asal_surat || "-"}\n` +
        `Perihal: ${suratDipilih.perihal || "-"}.`;

    setIsiDisposisi(isiOtomatis);

    const pesan =
      `*DISPOSISI SURAT - SIMASDI*\n\n` +
      `Tujuan: ${tujuan}\n` +
      `Nomor Surat: ${suratDipilih.nomor_surat || "-"}\n` +
      `Asal Surat: ${suratDipilih.asal_surat || "-"}\n` +
      `Perihal: ${suratDipilih.perihal || "-"}\n\n` +
      `*Isi Disposisi:*\n${isiOtomatis}`;

    // Ganti jika nomor WhatsApp tujuan berbeda
    const nomorWhatsApp = "6285113680385";

    window.open(
      `https://wa.me/${nomorWhatsApp}?text=${encodeURIComponent(pesan)}`,
      "_blank"
    );
  };

  const hapusDisposisi = async (id: number) => {
    const yakin = confirm("Yakin ingin menghapus riwayat disposisi ini?");
    if (!yakin) return;

    const { error } = await supabase
      .from("disposisi")
      .delete()
      .eq("id", id);

    if (error) {
      alert("Gagal menghapus disposisi: " + error.message);
      return;
    }

    alert("Riwayat disposisi berhasil dihapus.");
    await loadData();
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "32px",
        background: "#f5f7fb",
      }}
    >
      <div style={{ marginBottom: "24px" }}>
        <h1
          style={{
            margin: 0,
            color: "#0f172a",
            fontSize: "29px",
            fontWeight: "800",
          }}
        >
          Disposisi Surat
        </h1>

        <p style={{ margin: "7px 0 0", color: "#64748b" }}>
          Kirim dan catat disposisi surat secara digital.
        </p>
      </div>

      <section
        style={{
          background: "white",
          borderRadius: "16px",
          padding: "26px",
          boxShadow: "0 8px 20px rgba(15, 23, 42, 0.06)",
          marginBottom: "26px",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: "16px",
            marginBottom: "18px",
          }}
        >
          <div>
            <label style={labelStyle}>Pilih Surat</label>
            <select
              value={suratId}
              onChange={(e) => setSuratId(e.target.value)}
              style={inputStyle}
            >
              <option value="">-- Pilih Surat Masuk --</option>
              {suratList.map((surat) => (
                <option key={surat.id} value={surat.id}>
                  {surat.nomor_surat || "Tanpa Nomor"} —{" "}
                  {surat.perihal || "Tanpa Perihal"}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Tujuan Disposisi</label>
            <select
              value={tujuan}
              onChange={(e) => setTujuan(e.target.value)}
              style={inputStyle}
            >
              <option value="">-- Pilih Tujuan Disposisi --</option>
              <option value="Kepala Bapas">Kepala Bapas</option>
              <option value="Kaur Umum">Kaur Umum</option>
              <option value="Kasi Bimbingan Klien Dewasa">
                Kasi Bimbingan Klien Dewasa
              </option>
              <option value="Kasi Bimbingan Klien Anak">
                Kasi Bimbingan Klien Anak
              </option>
              <option value="Pembimbing Kemasyarakatan">
                Pembimbing Kemasyarakatan
              </option>
              <option value="Staf Tata Usaha">Staf Tata Usaha</option>
            </select>
          </div>
        </div>

        <div style={{ marginBottom: "18px" }}>
          <label style={labelStyle}>Isi Disposisi</label>
          <textarea
            value={isiDisposisi}
            onChange={(e) => setIsiDisposisi(e.target.value)}
            placeholder="Isi disposisi akan terisi otomatis setelah surat dan tujuan dipilih."
            rows={7}
            style={{
              ...inputStyle,
              resize: "vertical",
              lineHeight: "1.5",
            }}
          />
        </div>

        <div
          style={{
            display: "flex",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >
          <button
            type="button"
            onClick={kirimWhatsApp}
            style={{
              border: "none",
              borderRadius: "9px",
              padding: "13px 18px",
              background: "#16a34a",
              color: "white",
              fontWeight: "800",
              cursor: "pointer",
            }}
          >
            Kirim Disposisi WA
          </button>

          <button
            type="button"
            onClick={simpanDisposisi}
            disabled={menyimpan}
            style={{
              border: "none",
              borderRadius: "9px",
              padding: "13px 18px",
              background: "#2563eb",
              color: "white",
              fontWeight: "800",
              cursor: "pointer",
            }}
          >
            {menyimpan ? "Menyimpan..." : "Simpan Disposisi"}
          </button>

          <button
            type="button"
            onClick={resetForm}
            style={{
              border: "none",
              borderRadius: "9px",
              padding: "13px 18px",
              background: "#64748b",
              color: "white",
              fontWeight: "800",
              cursor: "pointer",
            }}
          >
            Reset
          </button>
        </div>
      </section>

      <section
        style={{
          background: "white",
          borderRadius: "16px",
          overflow: "hidden",
          boxShadow: "0 8px 20px rgba(15, 23, 42, 0.06)",
        }}
      >
        <div
          style={{
            padding: "20px",
            borderBottom: "1px solid #e2e8f0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >
          <h2
            style={{
              margin: 0,
              color: "#1e3a8a",
              fontSize: "21px",
              fontWeight: "800",
            }}
          >
            Riwayat Disposisi
          </h2>

          <button
            onClick={loadData}
            style={{
              border: "1px solid #cbd5e1",
              borderRadius: "8px",
              padding: "9px 13px",
              background: "white",
              color: "#1d4ed8",
              fontWeight: "800",
              cursor: "pointer",
            }}
          >
            Perbarui
          </button>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              minWidth: "850px",
              borderCollapse: "collapse",
            }}
          >
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                <th style={thStyle}>No</th>
                <th style={thStyle}>Nomor Surat</th>
                <th style={thStyle}>Tujuan</th>
                <th style={thStyle}>Isi Disposisi</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Aksi</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={emptyStyle}>
                    Memuat data...
                  </td>
                </tr>
              ) : riwayat.length === 0 ? (
                <tr>
                  <td colSpan={6} style={emptyStyle}>
                    Belum ada riwayat disposisi.
                  </td>
                </tr>
              ) : (
                riwayat.map((item, index) => (
                  <tr
                    key={item.id}
                    style={{ borderTop: "1px solid #e2e8f0" }}
                  >
                    <td style={tdStyle}>{index + 1}</td>
                    <td style={tdStyle}>{item.nomor_surat || "-"}</td>
                    <td style={tdStyle}>{item.tujuan || "-"}</td>
                    <td style={{ ...tdStyle, whiteSpace: "pre-line" }}>
                      {item.isi_disposisi || "-"}
                    </td>
                    <td style={tdStyle}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "6px 10px",
                          borderRadius: "999px",
                          background:
                            item.status === "Selesai" ? "#dcfce7" : "#fef3c7",
                          color:
                            item.status === "Selesai" ? "#15803d" : "#92400e",
                          fontSize: "12px",
                          fontWeight: "800",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {item.status || "Menunggu"}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <button
                        onClick={() => hapusDisposisi(item.id)}
                        style={{
                          border: "none",
                          borderRadius: "7px",
                          padding: "8px 11px",
                          background: "#dc2626",
                          color: "white",
                          fontWeight: "700",
                          cursor: "pointer",
                        }}
                      >
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <style jsx>{`
        @media (max-width: 700px) {
          main {
            padding: 22px 18px !important;
          }

          section {
            padding: 20px !important;
          }

          main > section:first-of-type > div:first-of-type {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </main>
  );
}

const thStyle = {
  padding: "14px 16px",
  textAlign: "left" as const,
  color: "#0f172a",
  fontSize: "13px",
  fontWeight: "800",
  whiteSpace: "nowrap" as const,
};

const tdStyle = {
  padding: "14px 16px",
  color: "#334155",
  fontSize: "14px",
  verticalAlign: "top" as const,
};

const emptyStyle = {
  padding: "32px",
  textAlign: "center" as const,
  color: "#64748b",
};
