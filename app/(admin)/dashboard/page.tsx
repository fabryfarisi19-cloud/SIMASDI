"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function DashboardPage() {
  const [totalSuratMasuk, setTotalSuratMasuk] = useState(0);
  const [totalSuratKeluar, setTotalSuratKeluar] = useState(0);
  const [totalDisposisi, setTotalDisposisi] = useState(0);
  const [totalArsip, setTotalArsip] = useState(0);
  const [agendaHariIni, setAgendaHariIni] = useState(0);

  const [suratTerbaru, setSuratTerbaru] = useState<any[]>([]);
  const [disposisiMenunggu, setDisposisiMenunggu] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDashboard = async () => {
    setLoading(true);

    const hariIni = new Date().toISOString().split("T")[0];

    const [
      suratMasukResult,
      suratKeluarResult,
      disposisiResult,
      arsipResult,
      agendaResult,
      suratTerbaruResult,
      disposisiMenungguResult,
    ] = await Promise.all([
      supabase.from("surat_masuk").select("*", { count: "exact", head: true }),

      supabase.from("surat_keluar").select("*", { count: "exact", head: true }),

      supabase
        .from("disposisi")
        .select("*", { count: "exact", head: true })
        .eq("status", "Menunggu"),

      supabase.from("arsip_digital").select("*", { count: "exact", head: true }),

      supabase
        .from("agenda")
        .select("*", { count: "exact", head: true })
        .eq("tanggal", hariIni),

      supabase
        .from("surat_masuk")
        .select("id, nomor_surat, asal_surat, perihal, tanggal")
        .order("tanggal", { ascending: false })
        .limit(5),

      supabase
        .from("disposisi")
        .select("id, nomor_surat, tujuan, isi_disposisi, status, tanggal")
        .eq("status", "Menunggu")
        .order("id", { ascending: false })
        .limit(5),
    ]);

    setTotalSuratMasuk(suratMasukResult.count || 0);
    setTotalSuratKeluar(suratKeluarResult.count || 0);
    setTotalDisposisi(disposisiResult.count || 0);
    setTotalArsip(arsipResult.count || 0);
    setAgendaHariIni(agendaResult.count || 0);

    setSuratTerbaru(suratTerbaruResult.data || []);
    setDisposisiMenunggu(disposisiMenungguResult.data || []);

    setLoading(false);
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const cards = [
    {
      judul: "Surat Masuk",
      jumlah: totalSuratMasuk,
      warna: "#2563eb",
      keterangan: "Total surat masuk",
    },
    {
      judul: "Surat Keluar",
      jumlah: totalSuratKeluar,
      warna: "#7c3aed",
      keterangan: "Total surat keluar",
    },
    {
      judul: "Disposisi Menunggu",
      jumlah: totalDisposisi,
      warna: "#f59e0b",
      keterangan: "Perlu ditindaklanjuti",
    },
    {
      judul: "Arsip Digital",
      jumlah: totalArsip,
      warna: "#16a34a",
      keterangan: "Dokumen tersimpan",
    },
    {
      judul: "Agenda Hari Ini",
      jumlah: agendaHariIni,
      warna: "#dc2626",
      keterangan: "Kegiatan hari ini",
    },
  ];

  return (
    <div
      style={{
        padding: "32px",
        background: "#f5f7fb",
        minHeight: "100vh",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: "26px",
              color: "#0f172a",
            }}
          >
            Dashboard SIMASDI
          </h1>

          <p
            style={{
              margin: "6px 0 0",
              color: "#64748b",
            }}
          >
            Ringkasan administrasi surat dan agenda kegiatan.
          </p>
        </div>

        <button
          onClick={loadDashboard}
          style={{
            background: "#2563eb",
            color: "white",
            border: "none",
            borderRadius: "8px",
            padding: "10px 16px",
            cursor: "pointer",
            fontWeight: "600",
          }}
        >
          ↻ Perbarui Data
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
          gap: "18px",
        }}
      >
        {cards.map((card) => (
          <div
            key={card.judul}
            style={{
              background: "white",
              borderRadius: "14px",
              padding: "20px",
              border: "1px solid #e2e8f0",
              boxShadow: "0 4px 18px rgba(15, 23, 42, 0.06)",
              borderLeft: `6px solid ${card.warna}`,
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: "14px",
                fontWeight: "600",
                color: "#475569",
              }}
            >
              {card.judul}
            </p>

            <div
              style={{
                margin: "10px 0 6px",
                fontSize: "34px",
                fontWeight: "bold",
                color: card.warna,
              }}
            >
              {loading ? "..." : card.jumlah}
            </div>

            <p
              style={{
                margin: 0,
                fontSize: "13px",
                color: "#94a3b8",
              }}
            >
              {card.keterangan}
            </p>
          </div>
        ))}
      </div>

      <div
        style={{
          marginTop: "26px",
          background: "white",
          borderRadius: "14px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 4px 18px rgba(15, 23, 42, 0.06)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "18px 22px",
            borderBottom: "1px solid #e2e8f0",
          }}
        >
          <h2
            style={{
              margin: 0,
              color: "#1e3a8a",
              fontSize: "19px",
            }}
          >
            Surat Masuk Terbaru
          </h2>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              minWidth: "700px",
              borderCollapse: "collapse",
            }}
          >
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                <th style={{ padding: "14px", textAlign: "left" }}>
                  Tanggal
                </th>
                <th style={{ padding: "14px", textAlign: "left" }}>
                  Nomor Surat
                </th>
                <th style={{ padding: "14px", textAlign: "left" }}>
                  Asal Surat
                </th>
                <th style={{ padding: "14px", textAlign: "left" }}>
                  Perihal
                </th>
              </tr>
            </thead>

            <tbody>
              {suratTerbaru.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    style={{
                      padding: "22px",
                      textAlign: "center",
                      color: "#64748b",
                    }}
                  >
                    Belum ada surat masuk.
                  </td>
                </tr>
              ) : (
                suratTerbaru.map((surat) => (
                  <tr
                    key={surat.id}
                    style={{ borderTop: "1px solid #e2e8f0" }}
                  >
                    <td style={{ padding: "14px" }}>
                      {surat.tanggal
                        ? new Date(surat.tanggal).toLocaleDateString("id-ID")
                        : "-"}
                    </td>
                    <td style={{ padding: "14px" }}>
                      {surat.nomor_surat || "-"}
                    </td>
                    <td style={{ padding: "14px" }}>
                      {surat.asal_surat || "-"}
                    </td>
                    <td style={{ padding: "14px" }}>
                      {surat.perihal || "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div
        style={{
          marginTop: "26px",
          background: "white",
          borderRadius: "14px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 4px 18px rgba(15, 23, 42, 0.06)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "18px 22px",
            borderBottom: "1px solid #e2e8f0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h2
            style={{
              margin: 0,
              color: "#b45309",
              fontSize: "19px",
            }}
          >
            Disposisi Menunggu
          </h2>

          <span
            style={{
              background: "#fef3c7",
              color: "#92400e",
              padding: "5px 10px",
              borderRadius: "999px",
              fontSize: "12px",
              fontWeight: "bold",
            }}
          >
            {totalDisposisi} Menunggu
          </span>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              minWidth: "700px",
              borderCollapse: "collapse",
            }}
          >
            <thead>
              <tr style={{ background: "#fffbeb" }}>
                <th style={{ padding: "14px", textAlign: "left" }}>
                  Nomor Surat
                </th>
                <th style={{ padding: "14px", textAlign: "left" }}>
                  Tujuan
                </th>
                <th style={{ padding: "14px", textAlign: "left" }}>
                  Isi Disposisi
                </th>
                <th style={{ padding: "14px", textAlign: "center" }}>
                  Status
                </th>
              </tr>
            </thead>

            <tbody>
              {disposisiMenunggu.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    style={{
                      padding: "22px",
                      textAlign: "center",
                      color: "#64748b",
                    }}
                  >
                    Tidak ada disposisi yang menunggu.
                  </td>
                </tr>
              ) : (
                disposisiMenunggu.map((item) => (
                  <tr
                    key={item.id}
                    style={{ borderTop: "1px solid #fde68a" }}
                  >
                    <td style={{ padding: "14px" }}>
                      {item.nomor_surat || "-"}
                    </td>

                    <td style={{ padding: "14px" }}>
                      {item.tujuan || "-"}
                    </td>

<td style={{ padding: "14px 16px", maxWidth: "360px" }}>
  <div
    style={{
      display: "-webkit-box",
      WebkitLineClamp: 2,
      WebkitBoxOrient: "vertical",
      overflow: "hidden",
      lineHeight: "1.5",
    }}
  >
    {item.isi_disposisi}
  </div>

  <button
    onClick={() => {
      alert(item.isi_disposisi);
    }}
    style={{
      marginTop: "8px",
      background: "#2563eb",
      color: "white",
      border: "none",
      borderRadius: "6px",
      padding: "6px 10px",
      cursor: "pointer",
      fontSize: "12px",
      fontWeight: "bold",
    }}
  >
    Lihat Detail
  </button>
</td>                  

                    <td style={{ padding: "14px", textAlign: "center" }}>
                      <span
                        style={{
                          display: "inline-block",
                          background: "#facc15",
                          color: "#713f12",
                          padding: "5px 10px",
                          borderRadius: "999px",
                          fontSize: "12px",
                          fontWeight: "bold",
                        }}
                      >
                        Menunggu
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div
        style={{
          marginTop: "26px",
          background: "white",
          borderRadius: "14px",
          padding: "22px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 4px 18px rgba(15, 23, 42, 0.06)",
        }}
      >
        <h2
          style={{
            margin: "0 0 10px",
            color: "#1e3a8a",
            fontSize: "19px",
          }}
        >
          Informasi SIMASDI
        </h2>

        <p
          style={{
            margin: 0,
            color: "#475569",
            lineHeight: "1.7",
          }}
        >
          SIMASDI membantu pengelolaan surat masuk, surat keluar, disposisi,
          arsip digital, agenda kegiatan, dan pengguna secara terintegrasi.
        </p>
      </div>
    </div>
  );
}