"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Agenda = {
  id: number;
  judul: string;
  tanggal: string;
  jam: string | null;
  lokasi: string | null;
  penanggung_jawab: string | null;
  status: string | null;
};

const inputStyle = {
  width: "100%",
  padding: "13px 14px",
  border: "1px solid #cbd5e1",
  borderRadius: "10px",
  outline: "none",
  fontSize: "14px",
  boxSizing: "border-box" as const,
  minHeight: "48px",
};

export default function AgendaPage() {
  const [agendaList, setAgendaList] = useState<Agenda[]>([]);
  const [judul, setJudul] = useState("");
  const [tanggal, setTanggal] = useState("");
  const [jam, setJam] = useState("");
  const [lokasi, setLokasi] = useState("");
  const [penanggungJawab, setPenanggungJawab] = useState("");
  const [status, setStatus] = useState("Belum Dilaksanakan");
  const [loading, setLoading] = useState(true);
  const [menyimpan, setMenyimpan] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [cari, setCari] = useState("");

  useEffect(() => {
    loadAgenda();
  }, []);

  const loadAgenda = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("agenda")
        .select("*")
        .order("tanggal", { ascending: true })
        .order("jam", { ascending: true });

      if (error) {
        alert("Gagal memuat agenda: " + error.message);
        return;
      }

      setAgendaList((data || []) as Agenda[]);
    } catch {
      alert("Terjadi kesalahan saat memuat agenda.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setJudul("");
    setTanggal("");
    setJam("");
    setLokasi("");
    setPenanggungJawab("");
    setStatus("Belum Dilaksanakan");
    setEditId(null);
  };

  const simpanAgenda = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!judul.trim() || !tanggal) {
      alert("Judul kegiatan dan tanggal wajib diisi.");
      return;
    }

    try {
      setMenyimpan(true);

      const dataAgenda = {
        judul: judul.trim(),
        tanggal,
        jam: jam || null,
        lokasi: lokasi.trim() || null,
        penanggung_jawab: penanggungJawab.trim() || null,
        status,
      };

      const { error } = editId
        ? await supabase.from("agenda").update(dataAgenda).eq("id", editId)
        : await supabase.from("agenda").insert([dataAgenda]);

      if (error) {
        alert(
          `${editId ? "Gagal mengubah" : "Gagal menyimpan"} agenda: ${
            error.message
          }`
        );
        return;
      }

      alert(editId ? "Agenda berhasil diubah." : "Agenda berhasil disimpan.");
      resetForm();
      await loadAgenda();
    } catch {
      alert("Terjadi kesalahan saat menyimpan agenda.");
    } finally {
      setMenyimpan(false);
    }
  };

  const editAgenda = (item: Agenda) => {
    setEditId(item.id);
    setJudul(item.judul || "");
    setTanggal(item.tanggal || "");
    setJam(item.jam || "");
    setLokasi(item.lokasi || "");
    setPenanggungJawab(item.penanggung_jawab || "");
    setStatus(item.status || "Belum Dilaksanakan");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const hapusAgenda = async (id: number) => {
    if (!confirm("Yakin ingin menghapus agenda ini?")) return;

    const { error } = await supabase.from("agenda").delete().eq("id", id);

    if (error) {
      alert("Gagal menghapus agenda: " + error.message);
      return;
    }

    alert("Agenda berhasil dihapus.");
    await loadAgenda();
  };

  const formatTanggal = (value: string) => {
    if (!value) return "-";
    const [tahun, bulan, hari] = value.split("-");
    return `${hari}/${bulan}/${tahun}`;
  };

  const agendaTampil = agendaList.filter((item) => {
    const kataKunci = cari.toLowerCase();

    return (
      item.judul?.toLowerCase().includes(kataKunci) ||
      item.lokasi?.toLowerCase().includes(kataKunci) ||
      item.penanggung_jawab?.toLowerCase().includes(kataKunci) ||
      item.tanggal?.includes(kataKunci)
    );
  });

  const hariIni = new Date().toISOString().split("T")[0];

  const totalHariIni = agendaList.filter(
    (item) => item.tanggal === hariIni
  ).length;

  const akanDatang = agendaList.filter(
    (item) => item.tanggal > hariIni && item.status !== "Selesai"
  ).length;

  return (
    <main className="agenda-page">
      <div className="agenda-header">
        <h1>Agenda Kegiatan</h1>
        <p>Kelola jadwal kegiatan Bapas Kelas I Jakarta Barat.</p>
      </div>

      <div className="agenda-stat-grid">
        <StatAgenda judul="Total Agenda" nilai={agendaList.length} warna="#2563eb" />
        <StatAgenda judul="Agenda Hari Ini" nilai={totalHariIni} warna="#dc2626" />
        <StatAgenda judul="Akan Datang" nilai={akanDatang} warna="#f59e0b" />
      </div>

      <section className="agenda-card">
        <h2 className={editId ? "judul-edit" : "judul-tambah"}>
          {editId ? "Edit Agenda Kegiatan" : "Tambah Agenda Kegiatan"}
        </h2>

        <form onSubmit={simpanAgenda}>
          <div className="form-group">
            <label style={labelStyle}>Judul Kegiatan</label>
            <input
              value={judul}
              onChange={(e) => setJudul(e.target.value)}
              placeholder="Contoh: Rapat Koordinasi"
              style={inputStyle}
            />
          </div>

          <div className="form-grid-3">
            <div className="form-group">
              <label style={labelStyle}>Tanggal</label>
              <input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} style={inputStyle} />
            </div>

            <div className="form-group">
              <label style={labelStyle}>Jam Kegiatan</label>
              <input type="time" value={jam} onChange={(e) => setJam(e.target.value)} style={inputStyle} />
            </div>

            <div className="form-group">
              <label style={labelStyle}>Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} style={inputStyle}>
                <option value="Belum Dilaksanakan">Belum Dilaksanakan</option>
                <option value="Berlangsung">Berlangsung</option>
                <option value="Selesai">Selesai</option>
              </select>
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label style={labelStyle}>Lokasi</label>
              <input
                value={lokasi}
                onChange={(e) => setLokasi(e.target.value)}
                placeholder="Contoh: Aula Yusuf Lt. 1"
                style={inputStyle}
              />
            </div>

            <div className="form-group">
              <label style={labelStyle}>Penanggung Jawab</label>
              <input
                value={penanggungJawab}
                onChange={(e) => setPenanggungJawab(e.target.value)}
                placeholder="Contoh: Kaur Umum"
                style={inputStyle}
              />
            </div>
          </div>

          <div className="agenda-button-wrap">
            <button type="submit" disabled={menyimpan} className={editId ? "btn-update" : "btn-simpan"}>
              {menyimpan ? "Menyimpan..." : editId ? "💾 Update Agenda" : "💾 Simpan Agenda"}
            </button>

            {editId && (
              <button type="button" onClick={resetForm} className="btn-batal">
                Batal Edit
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="agenda-card agenda-list-card">
        <div className="agenda-list-header">
          <h2>Daftar Agenda</h2>
          <input
            value={cari}
            onChange={(e) => setCari(e.target.value)}
            placeholder="🔎 Cari kegiatan, lokasi, atau tanggal..."
            className="input-cari-agenda"
          />
        </div>

        <div className="table-wrapper">
          <table className="agenda-table">
            <thead>
              <tr>
                <th>No</th>
                <th>Judul Kegiatan</th>
                <th>Tanggal</th>
                <th>Jam</th>
                <th>Lokasi</th>
                <th>Penanggung Jawab</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="empty-cell">Memuat agenda...</td></tr>
              ) : agendaTampil.length === 0 ? (
                <tr><td colSpan={8} className="empty-cell">Belum ada agenda kegiatan.</td></tr>
              ) : (
                agendaTampil.map((item, index) => (
                  <tr key={item.id}>
                    <td>{index + 1}</td>
                    <td className="judul-cell">{item.judul}</td>
                    <td>{formatTanggal(item.tanggal)}</td>
                    <td>{item.jam ? `${item.jam} WIB` : "-"}</td>
                    <td>{item.lokasi || "-"}</td>
                    <td>{item.penanggung_jawab || "-"}</td>
                    <td><StatusBadge status={item.status || "Belum Dilaksanakan"} /></td>
                    <td>
                      <div className="aksi-wrap">
                        <button onClick={() => editAgenda(item)} className="btn-edit">Edit</button>
                        <button onClick={() => hapusAgenda(item.id)} className="btn-hapus">Hapus</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <style jsx>{`
        .agenda-page {
          min-height: 100vh;
          padding: 32px;
          background: #f5f7fb;
        }

        .agenda-header {
          margin-bottom: 24px;
        }

        .agenda-header h1 {
          margin: 0;
          color: #0f172a;
          font-size: 29px;
          font-weight: 800;
        }

        .agenda-header p {
          margin: 7px 0 0;
          color: #64748b;
        }

        .agenda-stat-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }

        .agenda-card {
          background: white;
          border-radius: 16px;
          padding: 26px;
          box-shadow: 0 8px 20px rgba(15, 23, 42, 0.06);
          margin-bottom: 26px;
        }

        .agenda-list-card {
          padding: 0;
          overflow: hidden;
        }

        .judul-tambah,
        .judul-edit {
          margin: 0 0 20px;
          font-size: 21px;
          font-weight: 800;
        }

        .judul-tambah {
          color: #1e3a8a;
        }

        .judul-edit {
          color: #d97706;
        }

        .form-group {
          min-width: 0;
          margin-bottom: 16px;
        }

        .form-grid-3 {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
        }

        .form-grid-2 {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
        }

        .agenda-button-wrap {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .btn-simpan,
        .btn-update,
        .btn-batal,
        .btn-edit,
        .btn-hapus {
          border: none;
          border-radius: 9px;
          color: white;
          font-weight: 800;
          cursor: pointer;
        }

        .btn-simpan,
        .btn-update,
        .btn-batal {
          padding: 12px 18px;
        }

        .btn-simpan {
          background: #2563eb;
        }

        .btn-update,
        .btn-edit {
          background: #d97706;
        }

        .btn-batal {
          background: #64748b;
        }

        .agenda-list-header {
          padding: 20px;
          border-bottom: 1px solid #e2e8f0;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 14px;
          flex-wrap: wrap;
        }

        .agenda-list-header h2 {
          margin: 0;
          color: #1e3a8a;
          font-size: 21px;
          font-weight: 800;
        }

        .input-cari-agenda {
          width: 330px;
          max-width: 100%;
          padding: 13px 14px;
          border: 1px solid #cbd5e1;
          border-radius: 10px;
          font-size: 14px;
          box-sizing: border-box;
        }

        .table-wrapper {
          overflow-x: auto;
        }

        .agenda-table {
          width: 100%;
          min-width: 950px;
          border-collapse: collapse;
        }

        .agenda-table th {
          padding: 14px 16px;
          text-align: left;
          color: #0f172a;
          background: #f8fafc;
          font-size: 13px;
          font-weight: 800;
          white-space: nowrap;
        }

        .agenda-table td {
          padding: 14px 16px;
          color: #334155;
          font-size: 14px;
          vertical-align: top;
          border-top: 1px solid #e2e8f0;
        }

        .judul-cell {
          font-weight: 700;
        }

        .empty-cell {
          padding: 32px !important;
          text-align: center;
          color: #64748b !important;
        }

        .aksi-wrap {
          display: flex;
          gap: 8px;
        }

        .btn-edit,
        .btn-hapus {
          padding: 8px 11px;
          border-radius: 7px;
        }

        .btn-hapus {
          background: #dc2626;
        }

        @media (max-width: 768px) {
          .agenda-page {
            padding: 22px 18px 40px;
          }

          .agenda-header h1 {
            font-size: 27px;
          }

          .agenda-stat-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 10px;
          }

          .agenda-card {
            padding: 20px;
            border-radius: 16px;
          }

          .agenda-list-card {
            padding: 0;
          }

          .form-grid-3,
          .form-grid-2 {
            grid-template-columns: 1fr;
            gap: 0;
          }

          .agenda-button-wrap {
            display: grid;
            grid-template-columns: 1fr;
          }

          .btn-simpan,
          .btn-update,
          .btn-batal {
            width: 100%;
            min-height: 52px;
          }

          .agenda-list-header {
            align-items: stretch;
          }

          .input-cari-agenda {
            width: 100%;
            max-width: none;
          }
        }
      `}</style>
    </main>
  );
}

function StatAgenda({
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
        background: "white",
        borderRadius: "14px",
        padding: "18px",
        borderLeft: `6px solid ${warna}`,
        boxShadow: "0 6px 16px rgba(15, 23, 42, 0.07)",
      }}
    >
      <div style={{ color: "#64748b", fontSize: "14px", fontWeight: "700" }}>
        {judul}
      </div>
      <div
        style={{
          marginTop: "9px",
          color: warna,
          fontSize: "32px",
          fontWeight: "800",
        }}
      >
        {nilai}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const warna =
    status === "Selesai"
      ? { bg: "#dcfce7", text: "#15803d" }
      : status === "Berlangsung"
      ? { bg: "#dbeafe", text: "#1d4ed8" }
      : { bg: "#fef3c7", text: "#92400e" };

  return (
    <span
      style={{
        display: "inline-block",
        padding: "6px 10px",
        borderRadius: "999px",
        background: warna.bg,
        color: warna.text,
        fontSize: "12px",
        fontWeight: "800",
        whiteSpace: "nowrap",
      }}
    >
      {status}
    </span>
  );
}

const labelStyle = {
  display: "block",
  marginBottom: "8px",
  color: "#0f172a",
  fontSize: "14px",
  fontWeight: "800",
};
