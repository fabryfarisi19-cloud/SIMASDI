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
  padding: "13px 14px",
  border: "1px solid #cbd5e1",
  borderRadius: "10px",
  outline: "none",
  fontSize: "14px",
  boxSizing: "border-box" as const,
  background: "white",
};

export default function DisposisiPage() {
  const [suratList, setSuratList] = useState<SuratMasuk[]>([]);
  const [riwayat, setRiwayat] = useState<Disposisi[]>([]);
  const [suratId, setSuratId] = useState("");
  const [tujuan, setTujuan] = useState("");
  const [isiDisposisi, setIsiDisposisi] = useState("");
  const [loading, setLoading] = useState(true);
  const [menyimpan, setMenyimpan] = useState(false);
  const [lihatData, setLihatData] = useState<Disposisi | null>(null);

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
        alert("Gagal memuat surat masuk: " + suratRes.error.message);
        return;
      }

      if (disposisiRes.error) {
        alert("Gagal memuat riwayat disposisi: " + disposisiRes.error.message);
        return;
      }

      setSuratList((suratRes.data || []) as SuratMasuk[]);
      setRiwayat((disposisiRes.data || []) as Disposisi[]);
    } catch (error) {
      console.error(error);
      alert("Terjadi kesalahan saat memuat data.");
    } finally {
      setLoading(false);
    }
  };

  const suratDipilih = suratList.find((item) => item.id === Number(suratId));
  useEffect(() => {
  if (!suratDipilih || !tujuan) return;

  if (isiDisposisi.trim() !== "") return;

  let instruksi = "";

  switch (tujuan) {
    case "Kepala Bapas":
      instruksi = "Mohon arahan dan petunjuk.";
      break;

    case "Kaur Umum":
      instruksi = "Mohon ditindaklanjuti sesuai tugas dan fungsi.";
      break;

    case "Kasi Bimbingan Klien Dewasa":
      instruksi = "Mohon dipelajari dan segera ditindaklanjuti.";
      break;

    case "Kasi Bimbingan Klien Anak":
      instruksi = "Mohon dipelajari dan segera ditindaklanjuti.";
      break;

    case "PK Pertama":
      instruksi = "Mohon diproses sesuai ketentuan yang berlaku.";
      break;

    case "PK Muda":
      instruksi = "Mohon diproses sesuai ketentuan yang berlaku.";
      break;

    case "PK Madya":
      instruksi = "Mohon diproses sesuai ketentuan yang berlaku.";
      break;

    case "Staf Tata Usaha":
      instruksi = "Mohon diproses administrasinya.";
      break;

    default:
      instruksi = "Mohon ditindaklanjuti.";
  }

  setIsiDisposisi(`Kepada Yth.
${tujuan}

${instruksi}

Nomor Surat : ${suratDipilih.nomor_surat || "-"}

Asal Surat : ${suratDipilih.asal_surat || "-"}

Perihal : ${suratDipilih.perihal || "-"}

Terima kasih.`);
}, [suratDipilih, tujuan]);
  const simpanDisposisi = async () => {
    if (!suratDipilih) {
      alert("Pilih surat terlebih dahulu.");
      return;
    }

    if (!tujuan) {
      alert("Pilih tujuan disposisi.");
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
          isi_disposisi: isiDisposisi.trim(),
          status: "Menunggu",
        },
      ]);

      if (error) {
        alert("Gagal menyimpan disposisi: " + error.message);
        return;
      }

      alert("Disposisi berhasil disimpan.");

      setSuratId("");
      setTujuan("");
      setIsiDisposisi("");

      await loadData();
    } catch (error) {
      console.error(error);
      alert("Terjadi kesalahan saat menyimpan disposisi.");
    } finally {
      setMenyimpan(false);
    }
  };

  const kirimWhatsApp = () => {
 let nomorWA = "";

switch (tujuan) {
  case "Kepala Bapas":
    nomorWA = "6281234567890";
    break;

  case "Kaur Umum":
    nomorWA = "628179888792";
    break;

  case "Kasi Bimbingan Klien Dewasa":
    nomorWA = "6281234567891";
    break;

  case "Kasi Bimbingan Klien Anak":
    nomorWA = "6281234567892";
    break;

  case "PK Pertama":
    nomorWA = "6281234567893";
    break;

  case "PK Muda":
    nomorWA = "6281234567894";
    break;

  case "PK Madya":
    nomorWA = "6281234567895";
    break;

  case "Staf Tata Usaha":
    nomorWA = "6281234567896";
    break;

  default:
    alert("Nomor WhatsApp tujuan belum diatur.");
    return;
}   
    if (!suratDipilih) {
      alert("Pilih surat terlebih dahulu.");
      return;
    }

    if (!tujuan) {
      alert("Pilih tujuan disposisi.");
      return;
    }

    if (!isiDisposisi.trim()) {
      alert("Isi disposisi masih kosong.");
      return;
    }

    const pesan = `*DISPOSISI SIMASDI*

Kepada Yth.
${tujuan}

Nomor Surat: ${suratDipilih.nomor_surat || "-"}
Asal Surat: ${suratDipilih.asal_surat || "-"}
Perihal: ${suratDipilih.perihal || "-"}

Isi Disposisi:
${isiDisposisi}`;

    window.open(
  `https://wa.me/${nomorWA}?text=${encodeURIComponent(pesan)}`,
  "_blank"
);
  };

  const ubahStatus = async (id: number) => {
  try {
    const { error } = await supabase
      .from("disposisi")
      .update({
        status: "Selesai",
      })
      .eq("id", id);

    if (error) {
      alert("Gagal mengubah status: " + error.message);
      return;
    }

    alert("Status berhasil diubah menjadi Selesai.");

    await loadData();
  } catch (err) {
    console.error(err);
    alert("Terjadi kesalahan.");
  }
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
        alert("Gagal menghapus disposisi: " + error.message);
        return;
      }

      alert("Disposisi berhasil dihapus.");
      await loadData();
    } catch (error) {
      console.error(error);
      alert("Terjadi kesalahan saat menghapus disposisi.");
    }
  };

  return (
    <main className="halaman-disposisi">
      <div className="judul-halaman">
        <h1>Disposisi Surat</h1>
        <p>Buat dan kelola disposisi surat masuk.</p>
      </div>

      <section className="kartu-form">
        <div className="form-dua-kolom">
          <div>
            <label>Pilih Surat</label>
            <select
              value={suratId}
              onChange={(e) => setSuratId(e.target.value)}
              style={inputStyle}
            >
              <option value="">Pilih Surat Masuk</option>
              {suratList.map((surat) => (
                <option key={surat.id} value={surat.id}>
                  {surat.nomor_surat || "-"} — {surat.perihal || "Tanpa perihal"}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label>Tujuan Disposisi</label>
            <select
              value={tujuan}
              onChange={(e) => setTujuan(e.target.value)}
              style={inputStyle}
            >
              <option value="">Pilih Tujuan Disposisi</option>
              <option value="Kepala Bapas">Kepala Bapas</option>
              <option value="Kaur Umum">Kaur Umum</option>
              <option value="Kasi Bimbingan Klien Dewasa">Kasi Bimbingan Klien Dewasa</option>
              <option value="Kasi Bimbingan Klien Anak">Kasi Bimbingan Klien Anak</option>
              <option value="PK Pertama">PK Pertama</option>
              <option value="PK Muda">PK Muda</option>
              <option value="PK Madya">PK Madya</option>
              <option value="Staf Tata Usaha">Staf Tata Usaha</option>
            </select>
          </div>
        </div>

        <div>
          <label>Isi Disposisi</label>
          <textarea
            value={isiDisposisi}
            onChange={(e) => setIsiDisposisi(e.target.value)}
            placeholder="Tuliskan isi disposisi..."
            rows={7}
            style={{
              ...inputStyle,
              resize: "vertical",
              marginTop: "8px",
              lineHeight: 1.6,
            }}
          />
        </div>

        <div className="tombol-disposisi">
          <button
            type="button"
            onClick={kirimWhatsApp}
            className="tombol-wa"
          >
            Kirim Disposisi WA
          </button>

          <button
            type="button"
            onClick={simpanDisposisi}
            disabled={menyimpan}
            className="tombol-simpan"
          >
            {menyimpan ? "Menyimpan..." : "Simpan Disposisi"}
          </button>
        </div>
      </section>

      <section className="kartu-riwayat">
        <div className="header-riwayat">
          <h2>Riwayat Disposisi</h2>
          <button onClick={loadData} className="tombol-refresh">
            ↻ Perbarui
          </button>
        </div>

        <div className="tabel-wrapper">
          <table>
            <thead>
              <tr>
                <th>Nomor Surat</th>
                <th>Tujuan</th>
                <th>Isi Disposisi</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="kosong">
                    Memuat data...
                  </td>
                </tr>
              ) : riwayat.length === 0 ? (
                <tr>
                  <td colSpan={5} className="kosong">
                    Belum ada riwayat disposisi.
                  </td>
                </tr>
              ) : (
                riwayat.map((item) => (
                  <tr key={item.id}>
                    <td>{item.nomor_surat || "-"}</td>
                    <td>{item.tujuan || "-"}</td>
                    <td className="isi-tabel">{item.isi_disposisi || "-"}</td>
                    <td>
                      <span
                        className={
                          item.status === "Selesai"
                            ? "badge selesai"
                            : "badge menunggu"
                        }
                      >
                        {item.status || "Menunggu"}
                      </span>
                    </td>
                
<td>
  <div
    style={{
      display: "flex",
      gap: "8px",
      flexWrap: "wrap",
    }}
  >
<button
  onClick={() => setLihatData(item)}
  style={{
    border: "none",
    borderRadius: "7px",
    padding: "8px 11px",
    background: "#2563eb",
    color: "white",
    fontWeight: 700,
    cursor: "pointer",
  }}
>
  👁 Lihat
</button>     
    {item.status !== "Selesai" && (
      <button
        onClick={() => ubahStatus(item.id)}
        style={{
          border: "none",
          borderRadius: "7px",
          padding: "8px 11px",
          background: "#16a34a",
          color: "white",
          fontWeight: 700,
          cursor: "pointer",
        }}
      >
        ✓ Selesai
      </button>
    )}

    <button
      onClick={() => hapusDisposisi(item.id)}
      className="tombol-hapus"
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
 {lihatData && (
  <div className="modal-overlay">
    <div className="modal-box">

      <h2>Detail Disposisi</h2>

      <p><strong>Nomor Surat</strong></p>
      <p>{lihatData.nomor_surat}</p>

      <p><strong>Tujuan</strong></p>
      <p>{lihatData.tujuan}</p>

      <p><strong>Status</strong></p>
      <p>{lihatData.status}</p>

      <p><strong>Isi Disposisi</strong></p>

      <textarea
        readOnly
        value={lihatData.isi_disposisi || ""}
        style={{
          width:"100%",
          minHeight:"220px",
          padding:"12px",
          border:"1px solid #ddd",
          borderRadius:"10px"
        }}
      />

<button
  onClick={() => setLihatData(null)}
  style={{
    marginTop: "20px",
    width: "100%",
    padding: "12px",
    background: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    fontWeight: 700,
    cursor: "pointer",
  }}
>
  Tutup
</button>
    </div>
  </div>
)}        
      
      <style jsx>{`
        .halaman-disposisi {
          min-height: 100vh;
          padding: 32px;
          background: #f5f7fb;
        }

        .judul-halaman {
          margin-bottom: 24px;
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
        }

        .kartu-form,
        .kartu-riwayat {
          background: white;
          border-radius: 16px;
          padding: 26px;
          box-shadow: 0 8px 20px rgba(15, 23, 42, 0.06);
          margin-bottom: 26px;
        }

        label {
          display: block;
          margin-bottom: 8px;
          color: #334155;
          font-size: 14px;
          font-weight: 800;
        }

        .form-dua-kolom {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
          margin-bottom: 18px;
        }

        .tombol-disposisi {
          display: flex;
          gap: 12px;
          margin-top: 20px;
        }

        .tombol-disposisi button {
          flex: 1;
          border: none;
          border-radius: 10px;
          padding: 14px;
          color: white;
          font-size: 15px;
          font-weight: 800;
          cursor: pointer;
        }

        .tombol-wa {
          background: #16a34a;
        }

        .tombol-simpan {
          background: #2563eb;
        }

        .tombol-simpan:disabled {
          background: #93c5fd;
          cursor: not-allowed;
        }

        .header-riwayat {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          margin-bottom: 18px;
        }

        .header-riwayat h2 {
          margin: 0;
          color: #1e3a8a;
          font-size: 22px;
          font-weight: 800;
        }

        .tombol-refresh {
          border: none;
          border-radius: 8px;
          padding: 10px 13px;
          background: #2563eb;
          color: white;
          font-weight: 700;
          cursor: pointer;
        }

        .tabel-wrapper {
          overflow-x: auto;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
        }

        table {
          width: 100%;
          min-width: 900px;
          border-collapse: collapse;
        }

        th {
          padding: 14px 16px;
          background: #f8fafc;
          color: #0f172a;
          text-align: left;
          font-size: 13px;
          font-weight: 800;
          white-space: nowrap;
        }

        td {
          padding: 15px 16px;
          color: #334155;
          font-size: 14px;
          vertical-align: top;
          border-top: 1px solid #e2e8f0;
        }

        .isi-tabel {
          min-width: 280px;
          line-height: 1.6;
        }

        .kosong {
          padding: 32px;
          text-align: center;
          color: #64748b;
        }

        .badge {
          display: inline-block;
          padding: 6px 10px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 800;
          white-space: nowrap;
        }

        .badge.menunggu {
          background: #fef3c7;
          color: #92400e;
        }

        .badge.selesai {
          background: #dcfce7;
          color: #15803d;
        }

        .tombol-hapus {
          border: none;
          border-radius: 7px;
          padding: 8px 11px;
          background: #dc2626;
          color: white;
          font-weight: 700;
          cursor: pointer;
        }
 .modal-overlay{
position:fixed;
inset:0;
background:rgba(0,0,0,.45);
display:flex;
align-items:center;
justify-content:center;
z-index:9999;
padding:20px;
}

.modal-box{
  background:#fff;
  width:100%;
  max-width:650px;
  max-height:85vh;
  overflow:auto;
  border-radius:16px;
  padding:24px;
  box-shadow:0 20px 40px rgba(0,0,0,.2);
}
        @media (max-width: 768px) {
          .halaman-disposisi {
            padding: 26px 18px;
          }

          .judul-halaman h1 {
            font-size: 27px;
          }

          .kartu-form,
          .kartu-riwayat {
            padding: 22px 18px;
          }

          .form-dua-kolom {
            grid-template-columns: 1fr;
          }

          .tombol-disposisi {
            flex-direction: column;
          }

          .tombol-disposisi button {
            width: 100%;
          }

          .header-riwayat {
            align-items: flex-start;
            flex-direction: column;
          }
           
        }
      `}</style>
    </main>
  );
}