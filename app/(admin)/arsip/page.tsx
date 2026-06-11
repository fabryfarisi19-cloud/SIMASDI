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
    if (!file) return alert("Pilih file");

    const fileName = Date.now() + "-" + file.name;

    const { error } = await supabase.storage
      .from("arsip")
      .upload(fileName, file);

    if (error) return alert(error.message);

    const { data } = supabase.storage
      .from("arsip")
      .getPublicUrl(fileName);

    await supabase.from("arsip_digital").insert({
      nama_dokumen: file.name,
      kategori,
      file_url: data.publicUrl,
      created_at: new Date().toISOString(),
    });

    setFile(null);
    loadArsip();
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
      <div style={{ marginBottom: 20 }}>
        <input
          type="file"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />

        <select
          value={kategori}
          onChange={(e) => setKategori(e.target.value)}
          style={{ marginLeft: 10 }}
        >
          <option value="Surat Masuk">Surat Masuk</option>
          <option value="Surat Keluar">Surat Keluar</option>
        </select>

        <button onClick={uploadFile} style={{ marginLeft: 10 }}>
          Upload
        </button>
      </div>

      {/* TABLE */}
      <table width="100%" border={1} cellPadding={8}>
        <thead>
          <tr>
            <th>Dokumen</th>
            <th>Kategori</th>
            <th>Tanggal</th>
            <th>File</th>
            <th>Aksi</th>
          </tr>
        </thead>

        <tbody>
          {paginatedData.map((item) => (
            <tr key={item.id}>
              <td>{item.nama_dokumen}</td>

              <td>
                <span
                  style={{
                    padding: "4px 8px",
                    borderRadius: 5,
                    color: "#fff",
                    background:
                      item.kategori?.toLowerCase() === "surat masuk"
                        ? "#16a34a"
                        : "#ea580c",
                  }}
                >
                  {item.kategori}
                </span>
              </td>

              <td>
                {item.created_at
                  ? new Date(item.created_at).toLocaleDateString("id-ID")
                  : "-"}
              </td>

              <td>
                <a href={item.file_url} target="_blank">
                  Lihat
                </a>
              </td>

              <td>
                <button onClick={() => hapusFile(item)}>Hapus</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

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