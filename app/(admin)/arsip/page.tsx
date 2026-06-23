"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type ArsipManual = {
  id: number;
  nama_dokumen: string;
  kategori: string;
  file_url: string | null;
  drive_file_id: string | null;
  created_at: string | null;
};

type SuratMasuk = {
  id: number;
  nomor_surat: string | null;
  tanggal_surat: string | null;
  asal_surat: string | null;
  perihal: string | null;
  file_url: string | null;
  created_at: string | null;
};

type SuratKeluar = {
  id: number;
  nomor_surat: string | null;
  tanggal_surat: string | null;
  tujuan_surat: string | null;
  perihal: string | null;
  file_url: string | null;
  created_at: string | null;
};

type ArsipGabungan = {
  id: number;
  sumber: "manual" | "masuk" | "keluar";
  nomor_surat: string;
  nama_dokumen: string;
  kategori: "Surat Masuk" | "Surat Keluar" | "Arsip Lainnya";
  asal_tujuan: string;
  tanggal: string | null;
  file_url: string | null;
  drive_file_id: string | null;
};

export default function ArsipPage() {
  const [arsipManual, setArsipManual] = useState<ArsipManual[]>([]);
  const [suratMasuk, setSuratMasuk] = useState<SuratMasuk[]>([]);
  const [suratKeluar, setSuratKeluar] = useState<SuratKeluar[]>([]);

  const [file, setFile] = useState<File | null>(null);
  const [kategori, setKategori] = useState("Arsip Lainnya");
  const [cari, setCari] = useState("");
  const [filterKategori, setFilterKategori] = useState("Semua");
  const [filterTahun, setFilterTahun] = useState("Semua");
  const [uploading, setUploading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [page, setPage] = useState(1);

  const limit = 10;

  useEffect(() => {
    loadSemuaData();
  }, []);

  const loadSemuaData = async () => {
    try {
      setLoadingData(true);

      const [manualRes, masukRes, keluarRes] = await Promise.all([
        supabase.from("arsip_digital").select("*").order("id", { ascending: false }),
        supabase.from("surat_masuk").select("*").order("id", { ascending: false }),
        supabase.from("surat_keluar").select("*").order("id", { ascending: false }),
      ]);

      if (manualRes.error) console.error(manualRes.error);
      if (masukRes.error) console.error(masukRes.error);
      if (keluarRes.error) console.error(keluarRes.error);

      setArsipManual(manualRes.data || []);
      setSuratMasuk(masukRes.data || []);
      setSuratKeluar(keluarRes.data || []);
    } catch (error) {
      console.error(error);
      alert("Gagal memuat data arsip.");
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    setPage(1);
  }, [cari, filterKategori, filterTahun]);

  const semuaArsip = useMemo<ArsipGabungan[]>(() => {
    const normalizeKategori = (
      kategori: string
    ): ArsipGabungan["kategori"] =>
      kategori === "Surat Masuk" || kategori === "Surat Keluar"
        ? kategori
        : "Arsip Lainnya";

    const manual = arsipManual.map((item) => ({
      id: item.id,
      sumber: "manual" as const,
      nomor_surat: "-",
      nama_dokumen: item.nama_dokumen || "Arsip Tanpa Nama",
      kategori: normalizeKategori(item.kategori),
      asal_tujuan: "-",
      tanggal: item.created_at,
      file_url: item.file_url,
      drive_file_id: item.drive_file_id,
    }));

    const masuk = suratMasuk.map((item) => ({
      id: item.id,
      sumber: "masuk" as const,
      nomor_surat: item.nomor_surat || "-",
      nama_dokumen: item.perihal || "Surat Masuk",
      kategori: "Surat Masuk" as const,
      asal_tujuan: item.asal_surat || "-",
      tanggal: item.tanggal_surat || item.created_at,
      file_url: item.file_url,
      drive_file_id: null,
    }));

    const keluar = suratKeluar.map((item) => ({
      id: item.id,
      sumber: "keluar" as const,
      nomor_surat: item.nomor_surat || "-",
      nama_dokumen: item.perihal || "Surat Keluar",
      kategori: "Surat Keluar" as const,
      asal_tujuan: item.tujuan_surat || "-",
      tanggal: item.tanggal_surat || item.created_at,
      file_url: item.file_url,
      drive_file_id: null,
    }));

    return [...manual, ...masuk, ...keluar].sort((a, b) => {
      const aTanggal = a.tanggal ? new Date(a.tanggal).getTime() : 0;
      const bTanggal = b.tanggal ? new Date(b.tanggal).getTime() : 0;
      return bTanggal - aTanggal;
    });
  }, [arsipManual, suratMasuk, suratKeluar]);

  const daftarTahun = useMemo(() => {
    const tahun = semuaArsip
      .map((item) =>
        item.tanggal ? new Date(item.tanggal).getFullYear().toString() : ""
      )
      .filter(Boolean);

    return Array.from(new Set(tahun)).sort((a, b) => Number(b) - Number(a));
  }, [semuaArsip]);

  const dataFilter = useMemo(() => {
    return semuaArsip.filter((item) => {
      const teks =
        `${item.nomor_surat} ${item.nama_dokumen} ${item.kategori} ${item.asal_tujuan}`.toLowerCase();

      const cocokCari = teks.includes(cari.toLowerCase());

      const cocokKategori =
        filterKategori === "Semua" || item.kategori === filterKategori;

      const tahunItem = item.tanggal
        ? new Date(item.tanggal).getFullYear().toString()
        : "";

      const cocokTahun =
        filterTahun === "Semua" || tahunItem === filterTahun;

      return cocokCari && cocokKategori && cocokTahun;
    });
  }, [semuaArsip, cari, filterKategori, filterTahun]);

  const totalHalaman = Math.max(1, Math.ceil(dataFilter.length / limit));
  const startIndex = (page - 1) * limit;
  const dataHalaman = dataFilter.slice(startIndex, startIndex + limit);

  const uploadFile = async () => {
    if (!file) {
      alert("Pilih file terlebih dahulu.");
      return;
    }

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
        alert("Upload gagal: " + (result.error || "Error tidak diketahui"));
        return;
      }

      const { error } = await supabase.from("arsip_digital").insert({
        nama_dokumen: file.name,
        kategori,
        file_url: result.fileUrl,
        drive_file_id: result.fileId,
        created_at: new Date().toISOString(),
      });

      if (error) {
        alert("File masuk Google Drive, tetapi data arsip gagal disimpan.");
        return;
      }

      setFile(null);
      setKategori("Arsip Lainnya");
      await loadSemuaData();
      alert("Arsip berhasil diupload.");
    } catch (error) {
      console.error(error);
      alert("Terjadi kesalahan saat upload.");
    } finally {
      setUploading(false);
    }
  };

  const hapusArsipManual = async (item: ArsipGabungan) => {
    if (item.sumber !== "manual") {
      alert("Surat Masuk dan Surat Keluar dihapus dari menu asalnya.");
      return;
    }

    if (!confirm(`Hapus arsip "${item.nama_dokumen}"?`)) return;

    try {
      if (item.drive_file_id) {
        const res = await fetch("/api/delete-drive", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileId: item.drive_file_id }),
        });

        const result = await res.json();

        if (!result.success) {
          alert("File Google Drive gagal dihapus.");
          return;
        }
      }

      const { error } = await supabase
        .from("arsip_digital")
        .delete()
        .eq("id", item.id);

      if (error) {
        alert("Data arsip gagal dihapus.");
        return;
      }

      await loadSemuaData();
      alert("Arsip berhasil dihapus.");
    } catch (error) {
      console.error(error);
      alert("Terjadi kesalahan saat menghapus arsip.");
    }
  };

  const exportPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text("Laporan Arsip Digital SIMASDI", 14, 15);

    doc.setFontSize(10);
    doc.text(`Filter: ${filterKategori} | Tahun: ${filterTahun}`, 14, 22);

    autoTable(doc, {
      startY: 28,
      head: [[
        "No",
        "Nomor Surat",
        "Dokumen / Perihal",
        "Jenis",
        "Asal / Tujuan",
        "Tanggal",
      ]],
      body: dataFilter.map((item, index) => [
        index + 1,
        item.nomor_surat,
        item.nama_dokumen,
        item.kategori,
        item.asal_tujuan,
        item.tanggal
          ? new Date(item.tanggal).toLocaleDateString("id-ID")
          : "-",
      ]),
      styles: { fontSize: 8 },
    });

    doc.save("laporan-arsip-simasdi.pdf");
  };

  const totalMasuk = semuaArsip.filter(
    (item) => item.kategori === "Surat Masuk"
  ).length;

  const totalKeluar = semuaArsip.filter(
    (item) => item.kategori === "Surat Keluar"
  ).length;

  const totalLainnya = semuaArsip.filter(
    (item) => item.kategori === "Arsip Lainnya"
  ).length;

  return (
    <main
      style={{
        padding: "32px",
        background: "#f5f7fb",
        minHeight: "100vh",
      }}
    >
      <div style={{ marginBottom: "24px" }}>
        <h1
          style={{
            margin: 0,
            color: "#0f172a",
            fontSize: "28px",
            fontWeight: "800",
          }}
        >
          Arsip Digital
        </h1>

        <p style={{ margin: "8px 0 0", color: "#64748b" }}>
          Pusat arsip Surat Masuk, Surat Keluar, dan dokumen lainnya.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
          gap: "16px",
          marginBottom: "24px",
        }}
      >
        <CardStat judul="Total Arsip" nilai={semuaArsip.length} warna="#2563eb" />
        <CardStat judul="Surat Masuk" nilai={totalMasuk} warna="#16a34a" />
        <CardStat judul="Surat Keluar" nilai={totalKeluar} warna="#ea580c" />
        <CardStat judul="Arsip Lainnya" nilai={totalLainnya} warna="#64748b" />
      </div>

      <section style={cardStyle}>
        <h2 style={judulBagianStyle}>Upload Arsip Lainnya</h2>

        <p style={{ marginTop: 0, color: "#64748b", fontSize: "14px" }}>
          Surat Masuk dan Surat Keluar sudah otomatis masuk ke halaman ini.
        </p>

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
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            style={{ ...inputStyle, flex: "1 1 300px" }}
          />

          <select
            value={kategori}
            onChange={(e) => setKategori(e.target.value)}
            style={{ ...inputStyle, width: "190px" }}
          >
            <option value="Arsip Lainnya">Arsip Lainnya</option>
            <option value="Surat Masuk">Surat Masuk</option>
            <option value="Surat Keluar">Surat Keluar</option>
          </select>

          <button
            onClick={uploadFile}
            disabled={uploading}
            style={{
              ...buttonStyle,
              background: uploading ? "#94a3b8" : "#2563eb",
              cursor: uploading ? "not-allowed" : "pointer",
              whiteSpace: "nowrap",
            }}
          >
            {uploading ? "Mengupload..." : "⬆ Upload Arsip"}
          </button>
        </div>
      </section>

      <section style={cardStyle}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: "16px",
            flexWrap: "wrap",
            alignItems: "center",
            marginBottom: "18px",
          }}
        >
          <h2 style={{ ...judulBagianStyle, margin: 0 }}>Daftar Arsip</h2>

          <button
            onClick={exportPDF}
            style={{
              ...buttonStyle,
              background: "#dc2626",
              whiteSpace: "nowrap",
            }}
          >
            🖨 Cetak PDF
          </button>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(260px, 1fr) 190px 150px",
            gap: "12px",
            marginBottom: "18px",
          }}
        >
          <input
            value={cari}
            onChange={(e) => setCari(e.target.value)}
            placeholder="Cari nomor, perihal, asal, tujuan..."
            style={inputStyle}
          />

          <select
            value={filterKategori}
            onChange={(e) => setFilterKategori(e.target.value)}
            style={inputStyle}
          >
            <option value="Semua">Semua Jenis</option>
            <option value="Surat Masuk">Surat Masuk</option>
            <option value="Surat Keluar">Surat Keluar</option>
            <option value="Arsip Lainnya">Arsip Lainnya</option>
          </select>

          <select
            value={filterTahun}
            onChange={(e) => setFilterTahun(e.target.value)}
            style={inputStyle}
          >
            <option value="Semua">Semua Tahun</option>
            {daftarTahun.map((tahun) => (
              <option key={tahun} value={tahun}>
                {tahun}
              </option>
            ))}
          </select>
        </div>

        <div
          style={{
            overflowX: "auto",
            border: "1px solid #e2e8f0",
            borderRadius: "12px",
          }}
        >
          <table
            style={{
              width: "100%",
              minWidth: "1250px",
              borderCollapse: "collapse",
              tableLayout: "fixed",
            }}
          >
            <thead>
              <tr style={{ background: "#1e3a8a", color: "white" }}>
                <th style={{ ...thStyle, width: "45px" }}>No</th>
                <th style={{ ...thStyle, width: "145px" }}>Nomor Surat</th>
                <th style={{ ...thStyle, width: "240px" }}>Dokumen / Perihal</th>
                <th style={{ ...thStyle, width: "120px" }}>Jenis</th>
                <th style={{ ...thStyle, width: "235px" }}>Asal / Tujuan</th>
                <th style={{ ...thStyle, width: "100px" }}>Tanggal</th>
                <th style={{ ...thStyle, width: "75px" }}>File</th>
                <th style={{ ...thStyle, width: "190px" }}>Aksi</th>
              </tr>
            </thead>

            <tbody>
              {loadingData ? (
                <tr>
                  <td colSpan={8} style={emptyStyle}>
                    Memuat data arsip...
                  </td>
                </tr>
              ) : dataHalaman.length === 0 ? (
                <tr>
                  <td colSpan={8} style={emptyStyle}>
                    Belum ada data arsip.
                  </td>
                </tr>
              ) : (
                dataHalaman.map((item, index) => (
                  <tr
                    key={`${item.sumber}-${item.id}`}
                    style={{ borderBottom: "1px solid #e2e8f0" }}
                  >
                    <td style={tdStyle}>{startIndex + index + 1}</td>
                    <td style={tdStyle}>{item.nomor_surat}</td>
                    <td style={tdStyle}>{item.nama_dokumen}</td>
                    <td style={tdStyle}>
                      <BadgeKategori kategori={item.kategori} />
                    </td>
                    <td style={tdStyle}>{item.asal_tujuan}</td>
                    <td style={{ ...tdStyle, whiteSpace: "nowrap" }}>
                      {item.tanggal
                        ? new Date(item.tanggal).toLocaleDateString("id-ID")
                        : "-"}
                    </td>
                    <td style={tdStyle}>
                      {item.file_url ? (
                        <a
                          href={item.file_url}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            color: "#2563eb",
                            fontWeight: "700",
                            textDecoration: "none",
                            whiteSpace: "nowrap",
                          }}
                        >
                          👁 Lihat
                        </a>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td style={tdStyle}>
                      <div
                        style={{
                          display: "flex",
                          gap: "8px",
                          alignItems: "center",
                          flexWrap: "nowrap",
                        }}
                      >
                        {item.file_url && (
                          <a
                            href={item.file_url}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              ...buttonKecilStyle,
                              background: "#0f766e",
                              textDecoration: "none",
                              display: "inline-block",
                            }}
                          >
                            Unduh
                          </a>
                        )}

                        {item.sumber === "manual" ? (
                          <button
                            onClick={() => hapusArsipManual(item)}
                            style={{
                              ...buttonKecilStyle,
                              background: "#dc2626",
                            }}
                          >
                            Hapus
                          </button>
                        ) : (
                          <span
                            style={{
                              color: "#64748b",
                              fontSize: "12px",
                              lineHeight: "18px",
                            }}
                          >
                            Kelola di menu asal
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div
          style={{
            marginTop: "18px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <span style={{ color: "#64748b", fontSize: "14px" }}>
            Menampilkan {dataFilter.length === 0 ? 0 : startIndex + 1}–
            {Math.min(startIndex + limit, dataFilter.length)} dari{" "}
            {dataFilter.length} arsip
          </span>

          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <button
              onClick={() => setPage((lama) => Math.max(1, lama - 1))}
              disabled={page === 1}
              style={{
                ...buttonKecilStyle,
                background: page === 1 ? "#cbd5e1" : "#2563eb",
                cursor: page === 1 ? "not-allowed" : "pointer",
              }}
            >
              Sebelumnya
            </button>

            <span style={{ color: "#475569", fontWeight: "700" }}>
              {page} / {totalHalaman}
            </span>

            <button
              onClick={() =>
                setPage((lama) => Math.min(totalHalaman, lama + 1))
              }
              disabled={page === totalHalaman}
              style={{
                ...buttonKecilStyle,
                background: page === totalHalaman ? "#cbd5e1" : "#2563eb",
                cursor: page === totalHalaman ? "not-allowed" : "pointer",
              }}
            >
              Berikutnya
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}

function CardStat({
  judul,
  nilai,
  warna,
}: {
  judul: string;
  nilai: number;
  warna: string;
}) {
  return (
    <div
      style={{
        background: warna,
        color: "white",
        borderRadius: "14px",
        padding: "18px",
        boxShadow: "0 6px 16px rgba(15, 23, 42, 0.12)",
      }}
    >
      <div style={{ fontSize: "28px", fontWeight: "800" }}>{nilai}</div>
      <div style={{ marginTop: "5px", fontSize: "14px" }}>{judul}</div>
    </div>
  );
}

function BadgeKategori({
  kategori,
}: {
  kategori: "Surat Masuk" | "Surat Keluar" | "Arsip Lainnya";
}) {
  const warna =
    kategori === "Surat Masuk"
      ? "#16a34a"
      : kategori === "Surat Keluar"
        ? "#ea580c"
        : "#64748b";

  return (
    <span
      style={{
        display: "inline-block",
        background: warna,
        color: "white",
        borderRadius: "999px",
        padding: "5px 9px",
        fontSize: "12px",
        fontWeight: "700",
        whiteSpace: "nowrap",
      }}
    >
      {kategori}
    </span>
  );
}

const cardStyle = {
  background: "white",
  borderRadius: "16px",
  padding: "24px",
  marginBottom: "24px",
  boxShadow: "0 8px 20px rgba(15, 23, 42, 0.07)",
  border: "1px solid #e2e8f0",
};

const judulBagianStyle = {
  margin: "0 0 14px",
  color: "#0f172a",
  fontSize: "20px",
  fontWeight: "800",
};

const inputStyle = {
  width: "100%",
  boxSizing: "border-box" as const,
  border: "1px solid #cbd5e1",
  borderRadius: "8px",
  padding: "11px 12px",
  fontSize: "14px",
  background: "white",
};

const buttonStyle = {
  border: "none",
  borderRadius: "8px",
  color: "white",
  padding: "11px 16px",
  fontWeight: "700",
};

const buttonKecilStyle = {
  border: "none",
  borderRadius: "7px",
  color: "white",
  padding: "7px 10px",
  fontSize: "12px",
  fontWeight: "700",
  cursor: "pointer",
  whiteSpace: "nowrap" as const,
};

const thStyle = {
  padding: "14px",
  textAlign: "left" as const,
  fontSize: "13px",
  fontWeight: "800",
  whiteSpace: "nowrap" as const,
};

const tdStyle = {
  padding: "13px 14px",
  verticalAlign: "top" as const,
  color: "#334155",
  fontSize: "14px",
  wordBreak: "break-word" as const,
};

const emptyStyle = {
  padding: "32px",
  textAlign: "center" as const,
  color: "#64748b",
};