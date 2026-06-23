"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type SuratMasuk = {
  id: number;
  nomor_surat: string | null;
  tanggal_surat: string | null;
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

type Agenda = {
  id: number;
  judul: string;
  tanggal: string;
  jam: string | null;
  lokasi: string | null;
  status: string | null;
};

export default function DashboardPage() {
  const [suratMasuk, setSuratMasuk] = useState<SuratMasuk[]>([]);
  const [disposisiMenunggu, setDisposisiMenunggu] = useState<Disposisi[]>([]);
  const [jumlahSuratKeluar, setJumlahSuratKeluar] = useState(0);
  const [jumlahArsip, setJumlahArsip] = useState(0);
  const [jumlahAgendaHariIni, setJumlahAgendaHariIni] = useState(0);
  const [agendaHariIniList, setAgendaHariIniList] = useState<Agenda[]>([]);
  const [agendaBesokList, setAgendaBesokList] = useState<Agenda[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const formatTanggal = (tanggal: Date) => {
    const tahun = tanggal.getFullYear();
    const bulan = String(tanggal.getMonth() + 1).padStart(2, "0");
    const hari = String(tanggal.getDate()).padStart(2, "0");

    return `${tahun}-${bulan}-${hari}`;
  };

  const loadDashboard = async () => {
    try {
      setLoading(true);

      const [masukRes, keluarRes, disposisiRes, arsipRes, agendaRes] =
        await Promise.all([
          supabase
            .from("surat_masuk")
            .select("*")
            .order("id", { ascending: false }),

          supabase.from("surat_keluar").select("id"),

          supabase
            .from("disposisi")
            .select("*")
            .order("id", { ascending: false }),

          supabase.from("arsip_digital").select("id"),

          supabase
            .from("agenda")
            .select("*")
            .order("tanggal", { ascending: true })
            .order("jam", { ascending: true }),
        ]);

      if (masukRes.error) console.error("Surat masuk:", masukRes.error);
      if (keluarRes.error) console.error("Surat keluar:", keluarRes.error);
      if (disposisiRes.error) console.error("Disposisi:", disposisiRes.error);
      if (arsipRes.error) console.error("Arsip:", arsipRes.error);
      if (agendaRes.error) console.error("Agenda:", agendaRes.error);

      const dataMasuk = masukRes.data || [];
      const dataKeluar = keluarRes.data || [];
      const dataDisposisi = disposisiRes.data || [];
      const dataArsip = arsipRes.data || [];
      const semuaAgenda = (agendaRes.data || []) as Agenda[];

      const sekarang = new Date();
      const hariIni = formatTanggal(sekarang);

      const besok = new Date(sekarang);
      besok.setDate(sekarang.getDate() + 1);
      const tanggalBesok = formatTanggal(besok);

      const agendaHariIni = semuaAgenda.filter(
        (item) => item.tanggal === hariIni
      );

      const agendaBesok = semuaAgenda.filter(
        (item) => item.tanggal === tanggalBesok
      );

      const disposisiBelumSelesai = dataDisposisi.filter(
        (item) => item.status !== "Selesai"
      );

      setSuratMasuk(dataMasuk.slice(0, 5));
      setJumlahSuratKeluar(dataKeluar.length);
      setJumlahArsip(dataArsip.length);
      setDisposisiMenunggu(disposisiBelumSelesai.slice(0, 5));

      setJumlahAgendaHariIni(agendaHariIni.length);
      setAgendaHariIniList(agendaHariIni);
      setAgendaBesokList(agendaBesok);
    } catch (error) {
      console.error("Gagal memuat dashboard:", error);
      alert("Gagal memuat data dashboard.");
    } finally {
      setLoading(false);
    }
  };

  const cetakLaporanDashboard = () => {
    const doc = new jsPDF();
    const tanggalCetak = new Date().toLocaleDateString("id-ID");

    doc.setFontSize(16);
    doc.text("LAPORAN RINGKAS DASHBOARD SIMASDI", 14, 18);

    doc.setFontSize(10);
    doc.text("Bapas Kelas I Jakarta Barat", 14, 25);
    doc.text(`Tanggal Cetak: ${tanggalCetak}`, 14, 31);

    autoTable(doc, {
      startY: 38,
      head: [["Kategori", "Jumlah", "Keterangan"]],
      body: [
        ["Surat Masuk", String(suratMasuk.length), "Data surat masuk terbaru"],
        ["Surat Keluar", String(jumlahSuratKeluar), "Total surat keluar"],
        [
          "Disposisi Menunggu",
          String(disposisiMenunggu.length),
          "Perlu ditindaklanjuti",
        ],
        ["Arsip Digital", String(jumlahArsip), "Dokumen tersimpan"],
        [
          "Agenda Hari Ini",
          String(jumlahAgendaHariIni),
          "Kegiatan hari ini",
        ],
      ],
      styles: {
        fontSize: 9,
      },
    });

    let posisiY = (doc as any).lastAutoTable.finalY + 12;

    doc.setFontSize(13);
    doc.text("Agenda Hari Ini", 14, posisiY);

    autoTable(doc, {
      startY: posisiY + 5,
      head: [["Judul Kegiatan", "Jam", "Lokasi"]],
      body:
        agendaHariIniList.length > 0
          ? agendaHariIniList.map((item) => [
              item.judul || "-",
              item.jam ? `${item.jam} WIB` : "-",
              item.lokasi || "-",
            ])
          : [["Tidak ada agenda hari ini", "-", "-"]],
      styles: {
        fontSize: 9,
      },
    });

    posisiY = (doc as any).lastAutoTable.finalY + 12;

    doc.setFontSize(13);
    doc.text("Agenda Besok", 14, posisiY);

    autoTable(doc, {
      startY: posisiY + 5,
      head: [["Judul Kegiatan", "Jam", "Lokasi"]],
      body:
        agendaBesokList.length > 0
          ? agendaBesokList.map((item) => [
              item.judul || "-",
              item.jam ? `${item.jam} WIB` : "-",
              item.lokasi || "-",
            ])
          : [["Tidak ada agenda besok", "-", "-"]],
      styles: {
        fontSize: 9,
      },
    });

    const namaFile = `Laporan-Dashboard-SIMASDI-${formatTanggal(
      new Date()
    )}.pdf`;

    doc.save(namaFile);
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "32px",
        background: "#f5f7fb",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "16px",
          marginBottom: "26px",
          flexWrap: "wrap",
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              color: "#0f172a",
              fontSize: "28px",
              fontWeight: "800",
            }}
          >
            Dashboard SIMASDI
          </h1>

          <p style={{ margin: "7px 0 0", color: "#64748b" }}>
            Ringkasan administrasi surat dan agenda kegiatan.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <button
            onClick={loadDashboard}
            style={{
              border: "none",
              borderRadius: "8px",
              padding: "11px 16px",
              background: "#2563eb",
              color: "white",
              fontWeight: "700",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            ↻ Perbarui Data
          </button>

          <button
            onClick={cetakLaporanDashboard}
            style={{
              border: "none",
              borderRadius: "8px",
              padding: "11px 16px",
              background: "#dc2626",
              color: "white",
              fontWeight: "700",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            🖨 Cetak PDF
          </button>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
          gap: "16px",
          marginBottom: "26px",
        }}
      >
        <StatCard
          judul="Surat Masuk"
          nilai={suratMasuk.length}
          keterangan="Data terbaru"
          warna="#2563eb"
        />
        <StatCard
          judul="Surat Keluar"
          nilai={jumlahSuratKeluar}
          keterangan="Total surat keluar"
          warna="#7c3aed"
        />
        <StatCard
          judul="Disposisi Menunggu"
          nilai={disposisiMenunggu.length}
          keterangan="Perlu ditindaklanjuti"
          warna="#f59e0b"
        />
        <StatCard
          judul="Arsip Digital"
          nilai={jumlahArsip}
          keterangan="Dokumen tersimpan"
          warna="#16a34a"
        />
        <StatCard
          judul="Agenda Hari Ini"
          nilai={jumlahAgendaHariIni}
          keterangan="Kegiatan hari ini"
          warna="#dc2626"
        />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: "18px",
          marginBottom: "26px",
        }}
      >
        <AgendaCard
          judul="Agenda Hari Ini"
          label="Hari Ini"
          warna="#dc2626"
          warnaLatar="#fef2f2"
          agenda={agendaHariIniList}
          kosong="Tidak ada agenda untuk hari ini."
        />

        <AgendaCard
          judul="Agenda Besok"
          label="Besok"
          warna="#2563eb"
          warnaLatar="#eff6ff"
          agenda={agendaBesokList}
          kosong="Tidak ada agenda untuk besok."
        />
      </div>

      <section style={cardStyle}>
        <h2 style={judulStyle}>Surat Masuk Terbaru</h2>

        <div style={tableWrapperStyle}>
          <table style={tableStyle}>
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                <th style={thStyle}>Tanggal</th>
                <th style={thStyle}>Nomor Surat</th>
                <th style={thStyle}>Asal Surat</th>
                <th style={thStyle}>Perihal</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} style={emptyStyle}>
                    Memuat data...
                  </td>
                </tr>
              ) : suratMasuk.length === 0 ? (
                <tr>
                  <td colSpan={4} style={emptyStyle}>
                    Belum ada surat masuk.
                  </td>
                </tr>
              ) : (
                suratMasuk.map((item) => (
                  <tr key={item.id} style={{ borderTop: "1px solid #e2e8f0" }}>
                    <td style={tdStyle}>
                      {item.tanggal_surat
                        ? new Date(item.tanggal_surat).toLocaleDateString(
                            "id-ID"
                          )
                        : "-"}
                    </td>
                    <td style={tdStyle}>{item.nomor_surat || "-"}</td>
                    <td style={tdStyle}>{item.asal_surat || "-"}</td>
                    <td style={tdStyle}>{item.perihal || "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section style={cardStyle}>
        <div
          style={{
            padding: "18px 20px",
            borderBottom: "1px solid #fde68a",
            background: "#fffbeb",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h2
            style={{
              margin: 0,
              color: "#c2410c",
              fontSize: "20px",
              fontWeight: "800",
            }}
          >
            Disposisi Menunggu
          </h2>

          <span
            style={{
              background: "#fef3c7",
              color: "#92400e",
              borderRadius: "999px",
              padding: "6px 11px",
              fontSize: "12px",
              fontWeight: "800",
            }}
          >
            {disposisiMenunggu.length} Menunggu
          </span>
        </div>

        <div style={tableWrapperStyle}>
          <table style={tableStyle}>
            <thead>
              <tr style={{ background: "#fffbeb" }}>
                <th style={thStyle}>Nomor Surat</th>
                <th style={thStyle}>Tujuan</th>
                <th style={thStyle}>Isi Disposisi</th>
                <th style={thStyle}>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} style={emptyStyle}>
                    Memuat data...
                  </td>
                </tr>
              ) : disposisiMenunggu.length === 0 ? (
                <tr>
                  <td colSpan={4} style={emptyStyle}>
                    Tidak ada disposisi yang menunggu.
                  </td>
                </tr>
              ) : (
                disposisiMenunggu.map((item) => (
                  <tr key={item.id} style={{ borderTop: "1px solid #fde68a" }}>
                    <td style={tdStyle}>{item.nomor_surat || "-"}</td>
                    <td style={tdStyle}>{item.tujuan || "-"}</td>
                    <td style={tdStyle}>{item.isi_disposisi || "-"}</td>
                    <td style={tdStyle}>
                      <span
                        style={{
                          background: "#facc15",
                          color: "#713f12",
                          borderRadius: "999px",
                          padding: "6px 10px",
                          fontSize: "12px",
                          fontWeight: "800",
                        }}
                      >
                        {item.status || "Menunggu"}
                      </span>
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

function StatCard({
  judul,
  nilai,
  keterangan,
  warna,
}: {
  judul: string;
  nilai: number;
  keterangan: string;
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
      <div style={{ color: "#334155", fontSize: "14px", fontWeight: "700" }}>
        {judul}
      </div>

      <div
        style={{
          marginTop: "10px",
          color: warna,
          fontSize: "34px",
          fontWeight: "800",
        }}
      >
        {nilai}
      </div>

      <div style={{ marginTop: "5px", color: "#94a3b8", fontSize: "13px" }}>
        {keterangan}
      </div>
    </div>
  );
}

function AgendaCard({
  judul,
  label,
  warna,
  warnaLatar,
  agenda,
  kosong,
}: {
  judul: string;
  label: string;
  warna: string;
  warnaLatar: string;
  agenda: Agenda[];
  kosong: string;
}) {
  return (
    <section
      style={{
        background: "white",
        borderRadius: "16px",
        border: "1px solid #e2e8f0",
        overflow: "hidden",
        boxShadow: "0 8px 18px rgba(15, 23, 42, 0.06)",
      }}
    >
      <div
        style={{
          padding: "16px 18px",
          background: warnaLatar,
          borderBottom: `1px solid ${warna}`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <div style={{ color: warna, fontSize: "17px", fontWeight: "800" }}>
            {judul}
          </div>

          <div style={{ color: warna, fontSize: "12px", marginTop: "4px" }}>
            {agenda.length} kegiatan terjadwal
          </div>
        </div>

        <span
          style={{
            background: warna,
            color: "white",
            padding: "6px 10px",
            borderRadius: "999px",
            fontSize: "12px",
            fontWeight: "800",
          }}
        >
          {label}
        </span>
      </div>

      <div style={{ padding: "8px 18px 18px" }}>
        {agenda.length === 0 ? (
          <p style={{ color: "#64748b", fontSize: "14px" }}>{kosong}</p>
        ) : (
          agenda.map((item) => (
            <div
              key={item.id}
              style={{
                padding: "14px 0",
                borderBottom: "1px solid #f1f5f9",
              }}
            >
              <div
                style={{
                  color: "#0f172a",
                  fontSize: "14px",
                  fontWeight: "800",
                }}
              >
                {item.judul}
              </div>

              <div
                style={{
                  marginTop: "6px",
                  color: "#64748b",
                  fontSize: "13px",
                }}
              >
                🕒 {item.jam ? `${item.jam} WIB` : "Jam belum diisi"}
              </div>

              <div
                style={{
                  marginTop: "4px",
                  color: "#64748b",
                  fontSize: "13px",
                }}
              >
                📍 {item.lokasi || "Lokasi belum diisi"}
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

const cardStyle = {
  background: "white",
  borderRadius: "16px",
  border: "1px solid #e2e8f0",
  overflow: "hidden",
  boxShadow: "0 8px 20px rgba(15, 23, 42, 0.06)",
  marginBottom: "26px",
};

const judulStyle = {
  margin: 0,
  padding: "20px",
  color: "#1e3a8a",
  fontSize: "20px",
  fontWeight: "800",
  borderBottom: "1px solid #e2e8f0",
};

const tableWrapperStyle = {
  overflowX: "auto" as const,
};

const tableStyle = {
  width: "100%",
  minWidth: "850px",
  borderCollapse: "collapse" as const,
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
  padding: "30px",
  textAlign: "center" as const,
  color: "#64748b",
};