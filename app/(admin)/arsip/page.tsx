"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

type Arsip = {
  id: number;
  nomor_surat: string | null;
  dokumen: string | null;
  jenis: string | null;
  asal_tujuan: string | null;
  tanggal: string | null;
  file_url: string | null;
  sumber: string | null;
};

const formatTanggal = (tanggal: string | null) => {
  if (!tanggal) return "-";

  return new Date(tanggal).toLocaleDateString("id-ID");
};

export default function ArsipDigitalPage() {
  const [arsipList, setArsipList] = useState<Arsip[]>([]);
  const [loading, setLoading] = useState(true);
  const [kataKunci, setKataKunci] = useState("");
  const [filterJenis, setFilterJenis] = useState("Semua Jenis");
  const [filterTahun, setFilterTahun] = useState("Semua Tahun");
  const [file, setFile] = useState<File | null>(null);
  const [jenisUpload, setJenisUpload] = useState("Arsip Lainnya");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadArsip();
  }, []);

  const loadArsip = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("arsip_digital")
        .select("*")
        .order("id", { ascending: false });

      if (error) {
        alert("Gagal memuat arsip: " + error.message);
        return;
      }

      setArsipList((data || []) as Arsip[]);
    } catch (error) {
      console.error(error);
      alert("Terjadi kesalahan saat memuat arsip.");
    } finally {
      setLoading(false);
    }
  };

  const daftarTahun = useMemo(() => {
    const tahun = arsipList
      .map((item) => {
        if (!item.tanggal) return null;
        return new Date(item.tanggal).getFullYear().toString();
      })
      .filter(Boolean);

    return [...new Set(tahun)].sort((a, b) => Number(b) - Number(a));
  }, [arsipList]);

  const arsipTampil = useMemo(() => {
    return arsipList.filter((item) => {
      const teks =
        `${item.nomor_surat || ""} ${item.dokumen || ""} ${
          item.asal_tujuan || ""
        } ${item.jenis || ""}`.toLowerCase();

      const cocokKataKunci = teks.includes(kataKunci.toLowerCase());

      const cocokJenis =
        filterJenis === "Semua Jenis" || item.jenis === filterJenis;

      const tahunItem = item.tanggal
        ? new Date(item.tanggal).getFullYear().toString()
        : "";

      const cocokTahun =
        filterTahun === "Semua Tahun" || tahunItem === filterTahun;

      return cocokKataKunci && cocokJenis && cocokTahun;
    });
  }, [arsipList, kataKunci, filterJenis, filterTahun]);

  const uploadArsip = async () => {
    if (!file) {
      alert("Pilih file arsip terlebih dahulu.");
      return;
    }

    try {
      setUploading(true);

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload-drive", {
        method: "POST",
        body: formData,
      });

      const hasil = await response.json();

      if (!response.ok || !hasil.success) {
        alert(hasil.message || "Gagal upload file.");
        return;
      }

      const { error } = await supabase.from("arsip_digital").insert([
        {
          nomor_surat: "-",
          dokumen: file.name,
          jenis: jenisUpload,
          asal_tujuan: "-",
          tanggal: new Date().toISOString().slice(0, 10),
          file_url: hasil.url,
          sumber: "Arsip Lainnya",
        },
      ]);

      if (error) {
        alert("File berhasil diupload, tetapi gagal menyimpan data: " + error.message);
        return;
      }

      alert("Arsip berhasil diupload.");

      setFile(null);
      setJenisUpload("Arsip Lainnya");

      const inputFile = document.getElementById(
        "fileArsip"
      ) as HTMLInputElement;

      if (inputFile) inputFile.value = "";

      await loadArsip();
    } catch (error) {
      console.error(error);
      alert("Terjadi kesalahan saat upload arsip.");
    } finally {
      setUploading(false);
    }
  };

  const hapusArsip = async (item: Arsip) => {
    if (item.sumber !== "Arsip Lainnya") {
      alert("Arsip Surat Masuk dan Surat Keluar dikelola dari menu asal.");
      return;
    }

    const yakin = confirm(`Hapus arsip "${item.dokumen || "-"}"?`);
    if (!yakin) return;

    try {
      const { error } = await supabase
        .from("arsip_digital")
        .delete()
        .eq("id", item.id);

      if (error) {
        alert("Gagal menghapus arsip: " + error.message);
        return;
      }

      alert("Arsip berhasil dihapus.");
      await loadArsip();
    } catch (error) {
      console.error(error);
      alert("Terjadi kesalahan saat menghapus arsip.");
    }
  };

  const cetakPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text("Laporan Arsip Digital SIMASDI", 14, 16);

    doc.setFontSize(10);
    doc.text(
      `Dicetak pada: ${new Date().toLocaleDateString("id-ID")}`,
      14,
      23
    );

    autoTable(doc, {
      startY: 30,
      head: [
        [
          "No",
          "Nomor Surat",
          "Dokumen / Perihal",
          "Jenis",
          "Asal / Tujuan",
          "Tanggal",
        ],
      ],
      body: arsipTampil.map((item, index) => [
        index + 1,
        item.nomor_surat || "-",
        item.dokumen || "-",
        item.jenis || "-",
        item.asal_tujuan || "-",
        formatTanggal(item.tanggal),
      ]),
      styles: {
        fontSize: 8,
        cellPadding: 2,
      },
      headStyles: {
        fillColor: [30, 58, 138],
      },
    });

    doc.save(
      `Laporan-Arsip-SIMASDI-${new Date().toISOString().slice(0, 10)}.pdf`
    );
  };

  return (
    <main className="halaman-arsip">
      <div className="judul-halaman">
        <h1>Arsip Digital</h1>
        <p>Pusat arsip Surat Masuk, Surat Keluar, dan dokumen lainnya.</p>
      </div>

      <div className="stat-grid">
        <StatBox judul="Total Arsip" nilai={arsipList.length} warna="#2563eb" />
        <StatBox
          judul="Surat Masuk"
          nilai={arsipList.filter((item) => item.jenis === "Surat Masuk").length}
          warna="#16a34a"
        />
        <StatBox
          judul="Surat Keluar"
          nilai={arsipList.filter((item) => item.jenis === "Surat Keluar").length}
          warna="#ea580c"
        />
        <StatBox
          judul="Arsip Lainnya"
          nilai={arsipList.filter((item) => item.jenis === "Arsip Lainnya").length}
          warna="#64748b"
        />
      </div>

      <section className="kartu upload-card">
        <h2>Upload Arsip Lainnya</h2>
        <p>Surat Masuk dan Surat Keluar sudah otomatis masuk ke halaman ini.</p>

        <input
          id="fileArsip"
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />

        <div className="upload-actions">
          <select
            value={jenisUpload}
            onChange={(e) => setJenisUpload(e.target.value)}
          >
            <option value="Arsip Lainnya">Arsip Lainnya</option>
            <option value="Dokumen Keuangan">Dokumen Keuangan</option>
            <option value="Dokumen Kepegawaian">Dokumen Kepegawaian</option>
            <option value="Dokumen Umum">Dokumen Umum</option>
          </select>

          <button onClick={uploadArsip} disabled={uploading}>
            {uploading ? "Mengupload..." : "⬆ Upload Arsip"}
          </button>
        </div>
      </section>

      <section className="kartu daftar-card">
        <div className="header-daftar">
          <h2>Daftar Arsip</h2>
          <button onClick={cetakPDF} className="tombol-pdf">
            🖨 Cetak PDF
          </button>
        </div>

        <div className="filter-arsip">
          <input
            type="text"
            placeholder="Cari nomor, perihal, asal, tujuan..."
            value={kataKunci}
            onChange={(e) => setKataKunci(e.target.value)}
          />

          <select
            value={filterJenis}
            onChange={(e) => setFilterJenis(e.target.value)}
          >
            <option value="Semua Jenis">Semua Jenis</option>
            <option value="Surat Masuk">Surat Masuk</option>
            <option value="Surat Keluar">Surat Keluar</option>
            <option value="Arsip Lainnya">Arsip Lainnya</option>
            <option value="Dokumen Keuangan">Dokumen Keuangan</option>
            <option value="Dokumen Kepegawaian">Dokumen Kepegawaian</option>
            <option value="Dokumen Umum">Dokumen Umum</option>
          </select>

          <select
            value={filterTahun}
            onChange={(e) => setFilterTahun(e.target.value)}
          >
            <option value="Semua Tahun">Semua Tahun</option>
            {daftarTahun.map((tahun) => (
              <option key={tahun} value={tahun}>
                {tahun}
              </option>
            ))}
          </select>
        </div>

        <div className="tabel-wrapper">
          <table>
            <thead>
              <tr>
                <th>No</th>
                <th>Nomor Surat</th>
                <th>Dokumen / Perihal</th>
                <th>Jenis</th>
                <th>Asal / Tujuan</th>
                <th>Tanggal</th>
                <th>File</th>
                <th>Aksi</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="kosong">
                    Memuat arsip...
                  </td>
                </tr>
              ) : arsipTampil.length === 0 ? (
                <tr>
                  <td colSpan={8} className="kosong">
                    Arsip tidak ditemukan.
                  </td>
                </tr>
              ) : (
                arsipTampil.map((item, index) => (
                  <tr key={item.id}>
                    <td>{index + 1}</td>
                    <td>{item.nomor_surat || "-"}</td>
                    <td>{item.dokumen || "-"}</td>
                    <td>
                      <span className={`badge ${item.jenis?.replaceAll(" ", "-")}`}>
                        {item.jenis || "-"}
                      </span>
                    </td>
                    <td>{item.asal_tujuan || "-"}</td>
                    <td>{formatTanggal(item.tanggal)}</td>
                    <td>
                      {item.file_url ? (
                        <a href={item.file_url} target="_blank">
                          👁 Lihat
                        </a>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td>
                      {item.file_url && (
                        <a
                          href={item.file_url}
                          target="_blank"
                          className="tombol-unduh"
                        >
                          Unduh
                        </a>
                      )}

                      {item.sumber === "Arsip Lainnya" ? (
                        <button
                          onClick={() => hapusArsip(item)}
                          className="tombol-hapus"
                        >
                          Hapus
                        </button>
                      ) : (
                        <span className="kelola-asal">Kelola di menu asal</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <style jsx>{`
        .halaman-arsip {
          min-height: 100vh;
          padding: 32px;
          background: #f5f7fb;
        }

        .judul-halaman {
          margin-bottom: 22px;
        }

        .judul-halaman h1 {
          margin: 0;
          color: #0f172a;
          font-size: 29px;
          font-weight: 800;
        }

        .judul-halaman p {
          margin: 7px 0 0;
          color: #64748b;
          max-width: 520px;
        }

        .stat-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }

        .kartu {
          background: white;
          border-radius: 16px;
          padding: 26px;
          margin-bottom: 26px;
          box-shadow: 0 8px 20px rgba(15, 23, 42, 0.06);
        }

        .kartu h2 {
          margin: 0;
          color: #0f172a;
          font-size: 21px;
          font-weight: 800;
        }

        .upload-card p {
          color: #64748b;
          margin: 12px 0 16px;
        }

        input,
        select {
          box-sizing: border-box;
          width: 100%;
          border: 1px solid #cbd5e1;
          border-radius: 9px;
          padding: 12px;
          background: white;
          color: #334155;
          font-size: 14px;
        }

        .upload-actions {
          display: flex;
          gap: 12px;
          margin-top: 12px;
          max-width: 500px;
        }

        .upload-actions select {
          flex: 1;
        }

        button {
          border: none;
          border-radius: 9px;
          padding: 12px 15px;
          color: white;
          background: #2563eb;
          font-weight: 800;
          cursor: pointer;
          white-space: nowrap;
        }

        button:disabled {
          background: #93c5fd;
          cursor: not-allowed;
        }

        .header-daftar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 14px;
          margin-bottom: 18px;
        }

        .tombol-pdf {
          background: #dc2626;
        }

        .filter-arsip {
          display: grid;
          grid-template-columns: minmax(250px, 1fr) 190px 150px;
          gap: 12px;
          margin-bottom: 16px;
        }

        .tabel-wrapper {
          overflow-x: auto;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
        }

        table {
          width: 100%;
          min-width: 1100px;
          border-collapse: collapse;
        }

        th {
          padding: 14px 13px;
          background: #1e3a8a;
          color: white;
          font-size: 13px;
          text-align: left;
          white-space: nowrap;
        }

        td {
          padding: 14px 13px;
          border-top: 1px solid #e2e8f0;
          color: #334155;
          font-size: 14px;
          vertical-align: top;
        }

        td a {
          color: #2563eb;
          font-weight: 700;
          text-decoration: none;
        }

        .badge {
          display: inline-block;
          border-radius: 999px;
          padding: 6px 9px;
          color: white;
          font-size: 11px;
          font-weight: 800;
          white-space: nowrap;
          background: #64748b;
        }

        .badge.Surat-Masuk {
          background: #16a34a;
        }

        .badge.Surat-Keluar {
          background: #ea580c;
        }

        .tombol-unduh,
        .tombol-hapus {
          display: inline-block;
          border-radius: 7px;
          padding: 8px 10px;
          margin-right: 6px;
          color: white !important;
          font-size: 12px;
          font-weight: 800;
          text-decoration: none;
        }

        .tombol-unduh {
          background: #0f766e;
        }

        .tombol-hapus {
          background: #dc2626;
        }

        .kelola-asal {
          color: #64748b;
          font-size: 12px;
        }

        .kosong {
          padding: 32px;
          text-align: center;
          color: #64748b;
        }

        @media (max-width: 768px) {
          .halaman-arsip {
            padding: 26px 18px;
          }

          .judul-halaman h1 {
            font-size: 27px;
          }

          .stat-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 12px;
          }

          .kartu {
            padding: 22px 18px;
          }

          .upload-actions {
            flex-direction: column;
          }

          .upload-actions button {
            width: 100%;
          }

          .header-daftar {
            align-items: flex-start;
            flex-direction: column;
          }

          .tombol-pdf {
            width: 100%;
          }

          .filter-arsip {
            grid-template-columns: 1fr;
            gap: 10px;
          }

          .filter-arsip input,
          .filter-arsip select {
            width: 100%;
          }

          .tabel-wrapper {
            margin-top: 14px;
          }
        }
      `}</style>
    </main>
  );
}

function StatBox({
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
        boxShadow: "0 8px 16px rgba(15, 23, 42, 0.12)",
      }}
    >
      <div style={{ fontSize: "30px", fontWeight: 800 }}>{nilai}</div>
      <div style={{ marginTop: "5px", fontSize: "13px", fontWeight: 700 }}>
        {judul}
      </div>
    </div>
  );
}
