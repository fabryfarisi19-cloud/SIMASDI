"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AgendaPage() {
  const [form, setForm] = useState({
    tanggal: "",
    waktu: "",
    kegiatan: "",
    lokasi: "",
    keterangan: "",
  });

  const [agendaList, setAgendaList] = useState<any[]>([]);

  const loadAgenda = async () => {
    const { data, error } = await supabase
      .from("agenda")
      .select("*")
      .order("tanggal", { ascending: true });

    if (error) {
      console.log(error.message);
      return;
    }

    setAgendaList(data || []);
  };

  useEffect(() => {
    loadAgenda();
  }, []);

  const simpanAgenda = async () => {
    if (
      !form.tanggal ||
      !form.waktu ||
      !form.kegiatan ||
      !form.lokasi
    ) {
      alert("Lengkapi tanggal, waktu, kegiatan, dan lokasi terlebih dahulu");
      return;
    }

    const { error } = await supabase.from("agenda").insert([
      {
        tanggal: form.tanggal,
        waktu: form.waktu,
        kegiatan: form.kegiatan,
        lokasi: form.lokasi,
        keterangan: form.keterangan,
      },
    ]);

    if (error) {
      alert(error.message);
      return;
    }

    alert("✅ Agenda kegiatan berhasil disimpan");

    setForm({
      tanggal: "",
      waktu: "",
      kegiatan: "",
      lokasi: "",
      keterangan: "",
    });

    await loadAgenda();
  };

  const hapusAgenda = async (id: number) => {
    const yakin = confirm("Yakin ingin menghapus agenda kegiatan ini?");
    if (!yakin) return;

    const { error } = await supabase
      .from("agenda")
      .delete()
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    alert("Agenda kegiatan berhasil dihapus");
    await loadAgenda();
  };

  return (
    <div
      style={{
        padding: "32px",
        background: "#f5f7fb",
        minHeight: "100vh",
      }}
    >
      <h1
        style={{
          margin: "0 0 24px",
          fontSize: "24px",
          color: "#0f172a",
        }}
      >
        Agenda Kegiatan
      </h1>

      <div
        style={{
          background: "white",
          padding: "24px",
          borderRadius: "14px",
          boxShadow: "0 4px 18px rgba(15, 23, 42, 0.08)",
          border: "1px solid #e2e8f0",
          marginBottom: "28px",
        }}
      >
        <h2
          style={{
            margin: "0 0 18px",
            fontSize: "18px",
            color: "#1e3a8a",
          }}
        >
          Tambah Agenda Kegiatan
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "18px",
          }}
        >
          <div>
            <label style={labelStyle}>Tanggal</label>
            <input
              type="date"
              value={form.tanggal}
              onChange={(e) =>
                setForm({ ...form, tanggal: e.target.value })
              }
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Waktu</label>
            <input
              type="time"
              value={form.waktu}
              onChange={(e) =>
                setForm({ ...form, waktu: e.target.value })
              }
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Lokasi</label>
            <input
              value={form.lokasi}
              onChange={(e) =>
                setForm({ ...form, lokasi: e.target.value })
              }
              placeholder="Contoh: Aula Bapas Jakarta Barat"
              style={inputStyle}
            />
          </div>
        </div>

        <div style={{ marginTop: "18px" }}>
          <label style={labelStyle}>Nama Kegiatan</label>
          <input
            value={form.kegiatan}
            onChange={(e) =>
              setForm({ ...form, kegiatan: e.target.value })
            }
            placeholder="Contoh: Rapat koordinasi bulanan"
            style={inputStyle}
          />
        </div>

        <div style={{ marginTop: "18px" }}>
          <label style={labelStyle}>Keterangan</label>
          <textarea
            value={form.keterangan}
            onChange={(e) =>
              setForm({ ...form, keterangan: e.target.value })
            }
            placeholder="Tambahkan keterangan jika diperlukan"
            rows={4}
            style={{
              ...inputStyle,
              resize: "vertical",
              minHeight: "105px",
              boxSizing: "border-box",
            }}
          />
        </div>

        <button
          onClick={simpanAgenda}
          style={{
            marginTop: "18px",
            background: "#2563eb",
            color: "white",
            border: "none",
            padding: "12px 18px",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "600",
          }}
        >
          Simpan Agenda
        </button>
      </div>

      <h2
        style={{
          margin: "0 0 14px",
          fontSize: "20px",
          color: "#1e3a8a",
        }}
      >
        Daftar Agenda Kegiatan
      </h2>

      <div
        style={{
          background: "white",
          borderRadius: "12px",
          border: "1px solid #e2e8f0",
          overflowX: "auto",
          boxShadow: "0 2px 10px rgba(15, 23, 42, 0.05)",
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
            <tr style={{ background: "#f8fafc" }}>
              <th style={headerStyle}>Tanggal</th>
              <th style={headerStyle}>Waktu</th>
              <th style={headerStyle}>Kegiatan</th>
              <th style={headerStyle}>Lokasi</th>
              <th style={headerStyle}>Keterangan</th>
              <th style={headerStyle}>Aksi</th>
            </tr>
          </thead>

          <tbody>
            {agendaList.map((item) => (
              <tr key={item.id}>
                <td style={{ ...cellStyle, textAlign: "center" }}>
                  {item.tanggal
                    ? new Date(item.tanggal).toLocaleDateString("id-ID")
                    : "-"}
                </td>
                <td style={{ ...cellStyle, textAlign: "center" }}>
                  {item.waktu || "-"}
                </td>
                <td style={cellStyle}>{item.kegiatan}</td>
                <td style={cellStyle}>{item.lokasi}</td>
                <td style={cellStyle}>{item.keterangan || "-"}</td>
                <td style={{ ...cellStyle, textAlign: "center" }}>
                  <button
                    onClick={() => hapusAgenda(item.id)}
                    style={{
                      background: "#dc2626",
                      color: "white",
                      border: "none",
                      padding: "8px 12px",
                      borderRadius: "6px",
                      cursor: "pointer",
                    }}
                  >
                    🗑 Hapus
                  </button>
                </td>
              </tr>
            ))}

            {agendaList.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  style={{
                    padding: "24px",
                    textAlign: "center",
                    color: "#64748b",
                  }}
                >
                  Belum ada agenda kegiatan.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const labelStyle = {
  display: "block",
  marginBottom: "8px",
  fontWeight: "600",
  color: "#334155",
};

const inputStyle = {
  width: "100%",
  padding: "12px",
  border: "1px solid #cbd5e1",
  borderRadius: "8px",
  fontSize: "14px",
  color: "#0f172a",
  background: "white",
  boxSizing: "border-box" as const,
};

const headerStyle = {
  borderBottom: "1px solid #e2e8f0",
  padding: "14px",
  textAlign: "center" as const,
  color: "#334155",
  fontSize: "14px",
};

const cellStyle = {
  borderBottom: "1px solid #e2e8f0",
  padding: "14px",
  color: "#1e293b",
  fontSize: "14px",
};