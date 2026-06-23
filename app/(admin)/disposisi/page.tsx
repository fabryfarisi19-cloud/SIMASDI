"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function DisposisiPage() {
  const [suratList, setSuratList] = useState<any[]>([]);
  const [disposisiList, setDisposisiList] = useState<any[]>([]);
  const [suratDipilih, setSuratDipilih] = useState("");
  const [tujuan, setTujuan] = useState("");
  const [isiDisposisi, setIsiDisposisi] = useState("");

  const loadSurat = async () => {
    const { data } = await supabase
      .from("surat_masuk")
      .select("*")
      .order("tanggal", { ascending: false });

    setSuratList(data || []);
  };

  const loadDisposisi = async () => {
    const { data } = await supabase
      .from("disposisi")
      .select("*")
      .order("tanggal", { ascending: false });

    setDisposisiList(data || []);
  };

  useEffect(() => {
    loadSurat();
    loadDisposisi();
  }, []);

  const buatIsiDisposisi = (noAgenda: string, tujuanBaru: string) => {
    const surat = suratList.find((item) => item.no_agenda === noAgenda);

    if (!surat) {
      setIsiDisposisi("");
      return;
    }

    setIsiDisposisi(`Kepada Yth.
${tujuanBaru || "................................"}

Mohon ditindaklanjuti.

Nomor Surat : ${surat.nomor_surat || "-"}
Asal Surat  : ${surat.asal_surat || "-"}
Perihal     : ${surat.perihal || "-"}`);
  };

  const simpanDisposisi = async () => {
    const surat = suratList.find((item) => item.no_agenda === suratDipilih);

    if (!suratDipilih || !surat) {
      alert("Pilih surat masuk terlebih dahulu");
      return;
    }

    if (!tujuan) {
      alert("Pilih tujuan disposisi terlebih dahulu");
      return;
    }

    if (!isiDisposisi.trim()) {
      alert("Isi disposisi belum tersedia");
      return;
    }

    const { error } = await supabase.from("disposisi").insert([
      {
        nomor_surat: surat.nomor_surat || "-",
        asal_surat: surat.asal_surat || "-",
        perihal: surat.perihal || "-",
        tujuan: tujuan,
        isi_disposisi: isiDisposisi,
        status: "Menunggu",
        tanggal: new Date().toISOString(),
      },
    ]);

    if (error) {
      alert(error.message);
      return;
    }

    alert("Disposisi berhasil disimpan");

    setSuratDipilih("");
    setTujuan("");
    setIsiDisposisi("");

    await loadDisposisi();
  };

  const kirimWA = () => {
    if (!isiDisposisi.trim()) {
      alert("Pilih surat dan tujuan disposisi terlebih dahulu");
      return;
    }

    const pesan = encodeURIComponent(isiDisposisi);

    window.open(
      `https://wa.me/628179888792?text=${pesan}`,
      "_blank"
    );
  };

 const hapusDisposisi = async (id: number) => {
  const yakin = confirm("Yakin ingin menghapus disposisi ini?");

  if (!yakin) return;

  try {
    const { error } = await supabase
      .from("disposisi")
      .delete()
      .eq("id", id);

    if (error) {
      console.error(error);
      alert("Gagal menghapus disposisi: " + error.message);
      return;
    }

    alert("Disposisi berhasil dihapus.");
    await loadDisposisi();
  } catch (error) {
    console.error(error);
    alert("Terjadi kesalahan saat menghapus disposisi.");
  }
};

  const selesaikanDisposisi = async (id: number) => {
    const { error } = await supabase
      .from("disposisi")
      .update({ status: "Selesai" })
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    alert("Status disposisi sudah menjadi Selesai");
    await loadDisposisi();
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
          fontSize: "26px",
          color: "#0f172a",
        }}
      >
        Disposisi Surat
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
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "18px",
            marginBottom: "18px",
          }}
        >
          <div>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontWeight: "600",
                color: "#334155",
              }}
            >
              Pilih Surat
            </label>

            <select
              value={suratDipilih}
              onChange={(e) => {
     const noAgenda = e.target.value;
                setSuratDipilih(noAgenda);
                buatIsiDisposisi(noAgenda, tujuan);
              }}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                background: "white",
              }}
            >
              <option value="">Pilih Surat Masuk</option>

              {suratList.map((surat) => (
                <option key={surat.no_agenda} value={surat.no_agenda}>
                  {surat.nomor_surat || "-"} - {surat.perihal || "-"}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontWeight: "600",
                color: "#334155",
              }}
            >
              Tujuan Disposisi
            </label>

            <select
              value={tujuan}
              onChange={(e) => {
      const tujuanBaru = e.target.value;
                setTujuan(tujuanBaru);
                buatIsiDisposisi(suratDipilih, tujuanBaru);
              }}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                background: "white",
              }}
            >
              <option value="">Pilih Tujuan Disposisi</option>
              <option value="Kasubbag Tata Usaha">Kasubbag Tata Usaha</option>
              <option value="Kasi BKD">Kasi BKD</option>
              <option value="Kasi BKA">Kasi BKA</option>
              <option value="Kaur Umum">Kaur Umum</option>
              <option value="Bendahara">Bendahara</option>
              <option value="Pengelola BMN">Pengelola BMN</option>
              <option value="PK Bapas">PK Bapas</option>
              <option value="Arsiparis">Arsiparis</option>
            </select>
          </div>
        </div>

        <label
          style={{
            display: "block",
            marginBottom: "8px",
            fontWeight: "600",
            color: "#334155",
          }}
        >
          Isi Disposisi
        </label>

        <textarea
          value={isiDisposisi}
          onChange={(e) => setIsiDisposisi(e.target.value)}
          placeholder="Tuliskan isi disposisi..."
          rows={7}
          style={{
            width: "100%",
            padding: "12px",
            borderRadius: "8px",
            border: "1px solid #cbd5e1",
            resize: "vertical",
            fontFamily: "inherit",
            lineHeight: "1.6",
          }}
        />

        <div
          style={{
            display: "flex",
            gap: "12px",
            marginTop: "18px",
          }}
        >
          <button
            onClick={kirimWA}
            style={{
              background: "#16a34a",
              color: "white",
              border: "none",
              padding: "12px 18px",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "600",
            }}
          >
            Kirim Disposisi WA
          </button>

          <button
            onClick={simpanDisposisi}
            style={{
              background: "#2563eb",
              color: "white",
              border: "none",
              padding: "12px 18px",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "600",
            }}
          >
            Simpan Disposisi
          </button>
        </div>
      </div>

      <h2
        style={{
          fontSize: "21px",
          color: "#1e3a8a",
          marginBottom: "14px",
        }}
      >
        Riwayat Disposisi
      </h2>

      <div
        style={{
          background: "white",
          borderRadius: "14px",
          border: "1px solid #e2e8f0",
          overflowX: "auto",
          boxShadow: "0 4px 18px rgba(15, 23, 42, 0.05)",
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
              <th style={{ padding: "14px", textAlign: "center" }}>
                Aksi
              </th>
            </tr>
          </thead>

          <tbody>
            {disposisiList.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  style={{
                    padding: "28px",
                    textAlign: "center",
                    color: "#64748b",
                  }}
                >
                  Belum ada riwayat disposisi.
                </td>
              </tr>
            ) : (
              disposisiList.map((item) => (
                <tr key={item.id} style={{ borderTop: "1px solid #e2e8f0" }}>
                  <td style={{ padding: "14px", verticalAlign: "top" }}>
                    {item.nomor_surat || "-"}
                  </td>

                  <td style={{ padding: "14px", verticalAlign: "top" }}>
                    {item.tujuan || "-"}
                  </td>

                  <td
                    style={{
                      padding: "14px",
                      whiteSpace: "pre-line",
                      lineHeight: "1.55",
                      maxWidth: "420px",
                    }}
                  >
                    {item.isi_disposisi || "-"}
                  </td>

                  <td style={{ padding: "14px", textAlign: "center" }}>
                    <span
                      style={{
                        display: "inline-block",
                        padding: "6px 10px",
                        borderRadius: "999px",
                        fontSize: "12px",
                        fontWeight: "700",
                        background:
                          item.status === "Selesai" ? "#16a34a" : "#f59e0b",
                        color: "white",
                      }}
                    >
                      {item.status || "Menunggu"}
                    </span>
                  </td>

                  <td
                    style={{
                      padding: "14px",
                      textAlign: "center",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {item.status !== "Selesai" && (
                      <button
                        onClick={() => selesaikanDisposisi(item.id)}
                        style={{
                          background: "#16a34a",
                          color: "white",
                          border: "none",
                          padding: "8px 10px",
                          borderRadius: "6px",
                          cursor: "pointer",
                          marginRight: "8px",
                        }}
                      >
                        ✓ Selesaikan
                      </button>
                    )}

<button
  type="button"
  onClick={() => hapusDisposisi(item.id)}
  style={{
    border: "none",
    borderRadius: "7px",
    background: "#dc2626",
    color: "white",
    padding: "8px 12px",
    fontWeight: "700",
    cursor: "pointer",
  }}
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
    </div>
  );
}