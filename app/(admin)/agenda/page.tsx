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
        console.error(error);
        alert("Gagal memuat agenda: " + error.message);
        return;
      }

      setAgendaList((data || []) as Agenda[]);
    } catch (error) {
      console.error(error);
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

      if (editId) {
        const { error } = await supabase
          .from("agenda")
          .update(dataAgenda)
          .eq("id", editId);

        if (error) {
          alert("Gagal mengubah agenda: " + error.message);
          return;
        }

        alert("Agenda berhasil diubah.");
      } else {
        const { error } = await supabase.from("agenda").insert([dataAgenda]);

        if (error) {
          alert("Gagal menyimpan agenda: " + error.message);
          return;
        }

        alert("Agenda berhasil disimpan.");
      }

      resetForm();
      await loadAgenda();
    } catch (error) {
      console.error(error);
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
    const yakin = confirm("Yakin ingin menghapus agenda ini?");
    if (!yakin) return;

    try {
      const { error } = await supabase.from("agenda").delete().eq("id", id);

      if (error) {
        alert("Gagal menghapus agenda: " + error.message);
        return;
      }

      alert("Agenda berhasil dihapus.");
      await loadAgenda();
    } catch (error) {
      console.error(error);
      alert("Terjadi kesalahan saat menghapus agenda.");
    }
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
          Agenda Kegiatan
        </h1>

        <p style={{ margin: "7px 0 0", color: "#64748b" }}>
          Kelola jadwal kegiatan Bapas Kelas I Jakarta Barat.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          gap: "16px",
          marginBottom: "24px",
        }}
      >
        <StatAgenda judul="Total Agenda" nilai={agendaList.length} warna="#2563eb" />
        <StatAgenda judul="Agenda Hari Ini" nilai={totalHariIni} warna="#dc2626" />
        <StatAgenda judul="Akan Datang" nilai={akanDatang} warna="#f59e0b" />
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
        <h2
          style={{
            margin: "0 0 20px",
            color: editId ? "#d97706" : "#1e3a8a",
            fontSize: "21px",
            fontWeight: "800",
          }}
        >
          {editId ? "Edit Agenda Kegiatan" : "Tambah Agenda Kegiatan"}
        </h2>

        <form onSubmit={simpanAgenda}>
          <div style={{ marginBottom: "16px" }}>
            <label style={labelStyle}>Judul Kegiatan</label>
            <input
              value={judul}
              onChange={(e) => setJudul(e.target.value)}
              placeholder="Contoh: Rapat Koordinasi"
              style={inputStyle}
            />
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
              gap: "16px",
              marginBottom: "16px",
            }}
          >
            <div>
              <label style={labelStyle}>Tanggal</label>
              <input
                type="date"
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Jam Kegiatan</label>
              <input
                type="time"
                value={jam}
                onChange={(e) => setJam(e.target.value)}
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                style={inputStyle}
              >
                <option value="Belum Dilaksanakan">Belum Dilaksanakan</option>
                <option value="Berlangsung">Berlangsung</option>
                <option value="Selesai">Selesai</option>
              </select>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 2fr",
              gap: "16px",
              marginBottom: "20px",
            }}
          >
            <div>
              <label style={labelStyle}>Lokasi</label>
              <input
                value={lokasi}
                onChange={(e) => setLokasi(e.target.value)}
                placeholder="Contoh: Aula Yusuf Lt. 1"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Penanggung Jawab</label>
              <input
                value={penanggungJawab}
                onChange={(e) => setPenanggungJawab(e.target.value)}
                placeholder="Contoh: Kaur Umum"
                style={inputStyle}
              />
            </div>
          </div>

          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <button
              type="submit"
              disabled={menyimpan}
              style={{
                border: "none",
                borderRadius: "9px",
                padding: "12px 18px",
                background: editId ? "#d97706" : "#2563eb",
                color: "white",
                fontWeight: "800",
                cursor: "pointer",
              }}
            >
              {menyimpan
                ? "Menyimpan..."
                : editId
                ? "💾 Update Agenda"
                : "💾 Simpan Agenda"}
            </button>

            {editId && (
              <button
                type="button"
                onClick={resetForm}
                style={{
                  border: "none",
                  borderRadius: "9px",
                  padding: "12px 18px",
                  background: "#64748b",
                  color: "white",
                  fontWeight: "800",
                  cursor: "pointer",
                }}
              >
                Batal Edit
              </button>
            )}
          </div>
        </form>
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
            gap: "14px",
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
            Daftar Agenda
          </h2>

          <input
            value={cari}
            onChange={(e) => setCari(e.target.value)}
            placeholder="🔎 Cari kegiatan, lokasi, atau tanggal..."
            style={{
              ...inputStyle,
              width: "330px",
              maxWidth: "100%",
            }}
          />
        </div>

        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              minWidth: "950px",
              borderCollapse: "collapse",
            }}
          >
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                <th style={thStyle}>No</th>
                <th style={thStyle}>Judul Kegiatan</th>
                <th style={thStyle}>Tanggal</th>
                <th style={thStyle}>Jam</th>
                <th style={thStyle}>Lokasi</th>
                <th style={thStyle}>Penanggung Jawab</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Aksi</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={emptyStyle}>
                    Memuat agenda...
                  </td>
                </tr>
              ) : agendaTampil.length === 0 ? (
                <tr>
                  <td colSpan={8} style={emptyStyle}>
                    Belum ada agenda kegiatan.
                  </td>
                </tr>
              ) : (
                agendaTampil.map((item, index) => (
                  <tr
                    key={item.id}
                    style={{ borderTop: "1px solid #e2e8f0" }}
                  >
                    <td style={tdStyle}>{index + 1}</td>
                    <td style={{ ...tdStyle, fontWeight: "700" }}>
                      {item.judul}
                    </td>
                    <td style={tdStyle}>{formatTanggal(item.tanggal)}</td>
                    <td style={tdStyle}>
                      {item.jam ? `${item.jam} WIB` : "-"}
                    </td>
                    <td style={tdStyle}>{item.lokasi || "-"}</td>
                    <td style={tdStyle}>{item.penanggung_jawab || "-"}</td>
                    <td style={tdStyle}>
                      <StatusBadge status={item.status || "Belum Dilaksanakan"} />
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button
                          onClick={() => editAgenda(item)}
                          style={{
                            border: "none",
                            borderRadius: "7px",
                            padding: "8px 11px",
                            background: "#d97706",
                            color: "white",
                            fontWeight: "700",
                            cursor: "pointer",
                          }}
                        >
                          Edit
                        </button>

                        <button
                          onClick={() => hapusAgenda(item.id)}
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
                      </div>
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
