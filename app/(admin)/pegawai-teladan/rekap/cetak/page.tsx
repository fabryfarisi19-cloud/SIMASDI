
"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

type RekapPegawai = {
  pegawai_username: string;
  pegawai_nama: string;
  pegawai_role: string;
  jumlah_penilai: number;
  nilai_akhir: number | null;
  sudah_dinilai: boolean;

  catatan_penilai?: string | null;
  penilai_nama?: string | null;
  penilai_role?: string | null;
  tanggal_dikirim?: string | null;
};

type Periode = {
  id: string;
  tahun: number;
  bulan: number;
  nama_periode: string;
  status: string;
};

export default function CetakRekapPegawaiTeladan() {
  const searchParams = useSearchParams();

  const periodeId =
    searchParams.get("periode_id") ||
    "fdc3c3b0-c78c-4985-aa88-df6dcb6eb23e";

  const [loading, setLoading] = useState(true);
  const [periode, setPeriode] = useState<Periode | null>(null);
  const [data, setData] = useState<RekapPegawai[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `/api/pegawai-teladan/rekap?periode_id=${encodeURIComponent(
            periodeId
          )}`,
          {
            cache: "no-store",
          }
        );

        const result = await response.json();

        console.log(
          "HASIL API REKAP CETAK:",
          JSON.stringify(result, null, 2)
        );

        if (!response.ok || !result.success) {
          throw new Error(
            result.message || "Gagal mengambil data rekap."
          );
        }

        setPeriode(result.periode || null);

        const sumberData = Array.isArray(result.rekap_pegawai)
          ? result.rekap_pegawai
          : [];

        const dataNormal: RekapPegawai[] = sumberData.map(
          (item: any) => ({
            pegawai_username: item.pegawai_username ?? "",
            pegawai_nama: item.pegawai_nama ?? "",
            pegawai_role: item.pegawai_role ?? "",
            jumlah_penilai: Number(item.jumlah_penilai ?? 0),

            nilai_akhir:
              item.nilai_rata_rata !== null &&
              item.nilai_rata_rata !== undefined
                ? Number(item.nilai_rata_rata)
                : null,

            sudah_dinilai: Boolean(item.sudah_dinilai),
            catatan_penilai: item.catatan_penilai ?? null,
penilai_nama: item.penilai_nama ?? null,
penilai_role: item.penilai_role ?? null,
tanggal_dikirim: item.tanggal_dikirim ?? null,
          })
        );

        console.log(
          "DATA CETAK NORMAL:",
          JSON.stringify(dataNormal, null, 2)
        );

        setData(dataNormal);
      } catch (error: any) {
        console.error("ERROR LOAD DATA CETAK:", error);

        setError(
          error?.message ||
            "Terjadi kesalahan saat mengambil data rekap."
        );
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [periodeId]);

  /*
   * HANYA PEGAWAI YANG SUDAH DINILAI
   *
   * Pegawai dengan sudah_dinilai = false
   * tidak akan muncul pada dokumen cetak.
   */
  const dataDinilai = data
    .filter(
      (item) =>
        item.sudah_dinilai === true &&
        item.nilai_akhir !== null
    )
    .sort((a, b) =>
      a.pegawai_nama.localeCompare(
        b.pegawai_nama,
        "id-ID"
      )
    );

  /*
   * RATA-RATA HANYA DARI PEGAWAI YANG SUDAH DINILAI
   */
  const rataRata =
    dataDinilai.length > 0
      ? dataDinilai.reduce(
          (total, item) =>
            total + Number(item.nilai_akhir ?? 0),
          0
        ) / dataDinilai.length
      : 0;

  /*
   * CETAK OTOMATIS SETELAH DATA SIAP
   */
  useEffect(() => {
    if (!loading && !error && dataDinilai.length > 0) {
      const timer = setTimeout(() => {
        window.print();
      }, 700);

      return () => clearTimeout(timer);
    }
  }, [loading, error, dataDinilai.length]);

  return (
    <>
      <style jsx global>{`
        @page {
          size: A4 portrait;
          margin: 15mm 12mm 15mm 12mm;
        }

        * {
          box-sizing: border-box;
        }

        html,
        body {
          margin: 0;
          padding: 0;
          background: white;
          color: #111827;
          font-family: Arial, Helvetica, sans-serif;
        }

        body {
          width: 100%;
        }

        .print-container {
          width: 100%;
          max-width: 100%;
          margin: 0 auto;
          background: white;
        }

        /* =========================
           TOMBOL CETAK
        ========================= */

        .no-print {
          display: block;
          text-align: center;
          margin-bottom: 15px;
        }

        .no-print button {
          border: none;
          background: #111827;
          color: white;
          padding: 8px 15px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
        }

        /* =========================
           KOP SURAT
        ========================= */

        .kop {
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          min-height: 78px;
          border-bottom: 3px solid #111827;
          padding-bottom: 8px;
          margin-bottom: 12px;
        }

       .kop {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 78px;
  border-bottom: 3px solid #111827;
  padding-bottom: 8px;
  margin-bottom: 12px;
}

.kop-logo-wrapper {
  width: 70px;
  min-width: 70px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
}

.kop-logo {
  width: 58px;
  height: 58px;
  object-fit: contain;
}

.kop-text {
  text-align: center;
  line-height: 1.25;
}

.kop-text .line1 {
  font-size: 14px;
  font-weight: 700;
}

.kop-text .line2 {
  font-size: 17px;
  font-weight: 800;
}

.kop-text .line3 {
  font-size: 11px;
}
        /* =========================
           JUDUL
        ========================= */

        .judul {
          text-align: center;
          margin: 15px 0 3px;
          font-size: 17px;
          font-weight: 800;
          text-transform: uppercase;
        }

        .subjudul {
          text-align: center;
          font-size: 13px;
          font-weight: 700;
          margin-bottom: 15px;
        }

        /* =========================
           INFO
        ========================= */

        .info {
          display: grid;
          grid-template-columns: 140px 1fr;
          width: 100%;
          margin-bottom: 12px;
          font-size: 11px;
        }

        .info div {
          padding: 3px 0;
        }

        .info .label {
          font-weight: 700;
        }

        /* =========================
           SUMMARY
        ========================= */

        .summary {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 7px;
          margin-bottom: 15px;
        }

        .summary-box {
          border: 1px solid #9ca3af;
          padding: 8px;
          text-align: center;
        }

        .summary-label {
          font-size: 9px;
          color: #4b5563;
        }

        .summary-value {
          font-size: 15px;
          font-weight: 800;
          margin-top: 2px;
        }

        /* =========================
           TABLE
        ========================= */

        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 9.5px;
        }

        th,
        td {
          border: 1px solid #4b5563;
          padding: 5px 4px;
          vertical-align: middle;
        }

        th {
          background: #e5e7eb;
          text-align: center;
          font-weight: 800;
        }

        td.center {
          text-align: center;
        }

        td.nilai {
          text-align: center;
          font-weight: 800;
          font-size: 10px;
        }
.catatan-penilai {
  margin-top: 16px;
  page-break-inside: auto;
}

.catatan-penilai-title {
  font-size: 11px;
  font-weight: 700;
  margin-bottom: 8px;
  text-transform: uppercase;
}

.catatan-penilai-item {
  border: 1px solid #d1d5db;
  padding: 8px 10px;
  margin-bottom: 8px;
  page-break-inside: avoid;
}

.catatan-penilai-nama {
  font-size: 10px;
  font-weight: 700;
  margin-bottom: 3px;
}

.catatan-penilai-info {
  font-size: 9px;
  margin-bottom: 4px;
}

.catatan-penilai-text {
  font-size: 9px;
  line-height: 1.5;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
        /* =========================
           CATATAN
        ========================= */

        .catatan {
          margin-top: 10px;
          font-size: 9px;
          color: #4b5563;
          line-height: 1.4;
        }

        /* =========================
           TANDA TANGAN
        ========================= */

        .ttd {
          margin-top: 35px;
          width: 100%;
          display: flex;
          justify-content: flex-end;
        }

        .ttd-box {
          width: 250px;
          text-align: center;
          font-size: 11px;
          line-height: 1.5;
        }

        .ttd-space {
          height: 65px;
        }

        /* =========================
           LOADING / ERROR
        ========================= */

        .loading,
        .error {
          padding: 40px;
          text-align: center;
          font-family: Arial, Helvetica, sans-serif;
        }

        .error {
          color: #b91c1c;
        }

        .kosong {
          border: 1px solid #9ca3af;
          padding: 20px;
          text-align: center;
          font-size: 11px;
          color: #6b7280;
        }

        /* =========================
           PRINT
        ========================= */

        @media print {
          .no-print {
            display: none !important;
          }

          .print-container {
            width: 100%;
          }

          table {
            page-break-inside: auto;
          }

          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
        }
      `}</style>

      {/* =========================
          LOADING
      ========================= */}

      {loading && (
        <div className="loading">
          Menyiapkan dokumen cetak...
        </div>
      )}

      {/* =========================
          ERROR
      ========================= */}

      {!loading && error && (
        <div className="error">
          <strong>Gagal mencetak</strong>
          <br />
          {error}
        </div>
      )}

      {/* =========================
          DOKUMEN
      ========================= */}

      {!loading && !error && (
        <div className="print-container">
          {/* TOMBOL */}
          <div className="no-print">
            <button onClick={() => window.print()}>
              🖨 Cetak
            </button>
          </div>

          {/* =========================
              KOP
          ========================= */}

          <div className="kop">
            <img
              src="/logoimipas.png"
              alt="Logo"
              className="kop-logo"
            />

            <div className="kop-text">
              <div className="line1">
                KEMENTERIAN IMIGRASI DAN PEMASYARAKATAN
                REPUBLIK INDONESIA
              </div>

              <div className="line2">
                BALAI PEMASYARAKATAN KELAS I JAKARTA BARAT
              </div>

              <div className="line3">
                Jl. Palmerah Barat V No. 12, Jakarta Barat
              </div>
            </div>
          </div>

          {/* =========================
              JUDUL
          ========================= */}

          <div className="judul">
            REKAPITULASI PENILAIAN PEGAWAI TELADAN
          </div>

          <div className="subjudul">
            PERIODE{" "}
            {periode?.nama_periode?.toUpperCase() || "-"}
          </div>

          {/* =========================
              INFORMASI
          ========================= */}

          <div className="info">
            <div className="label">Periode</div>
            <div>{periode?.nama_periode || "-"}</div>


            <div className="label">Tanggal Cetak</div>
            <div>
              {new Date().toLocaleDateString("id-ID", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </div>
          </div>

          {/* =========================
              RINGKASAN
              HANYA YANG SUDAH DINILAI
          ========================= */}

          <div className="summary">
            <div className="summary-box">
              <div className="summary-label">
                PEGAWAI SUDAH DINILAI
              </div>

              <div className="summary-value">
                {dataDinilai.length}
              </div>
            </div>

            <div className="summary-box">
              <div className="summary-label">
                RATA-RATA NILAI
              </div>

              <div className="summary-value">
                {dataDinilai.length > 0
                  ? rataRata.toFixed(2)
                  : "-"}
              </div>
            </div>
          </div>

          {/* =========================
              TABEL REKAP
          ========================= */}

          {dataDinilai.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th style={{ width: "32px" }}>
                    No
                  </th>

                  <th>
                    Nama Pegawai
                  </th>

                  <th style={{ width: "130px" }}>
                    NIP
                  </th>

                  <th>
                    Jabatan / Role
                  </th>

                  <th style={{ width: "65px" }}>
                    Penilai
                  </th>

                  <th style={{ width: "80px" }}>
                    Nilai Akhir
                  </th>

                  <th style={{ width: "80px" }}>
                    Status
                  </th>
                </tr>
              </thead>

              <tbody>
                {dataDinilai.map(
                  (item, index) => (
                    <tr
                      key={
                        item.pegawai_username
                      }
                    >
                      <td className="center">
                        {index + 1}
                      </td>

                      <td>
                        {item.pegawai_nama}
                      </td>

                      <td className="center">
                        {item.pegawai_username}
                      </td>

                      <td>
                        {item.pegawai_role}
                      </td>

                      <td className="center">
                        {item.jumlah_penilai}
                      </td>

                      <td className="nilai">
                        {Number(
                          item.nilai_akhir
                        ).toFixed(2)}
                      </td>

                      <td className="center">
                        Sudah Dinilai
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          ) : (
            <div className="kosong">
              Belum ada pegawai yang dinilai
              pada periode ini.
            </div>
          )}
{/* =====================================================
    CATATAN PENILAI
===================================================== */}
<div className="catatan-penilai">
  <div className="catatan-penilai-title">
    CATATAN PENILAI
  </div>

  {dataDinilai.map((item, index) => (
    <div
      key={`${item.pegawai_username}-${index}`}
      className="catatan-penilai-item"
    >
      <div className="catatan-penilai-nama">
        {index + 1}. {item.pegawai_nama}
      </div>

      <div className="catatan-penilai-info">
        Penilai:{" "}
        <strong>
          {item.penilai_nama || "-"}
        </strong>
        {item.penilai_role
          ? ` — ${item.penilai_role}`
          : ""}
      </div>

      <div className="catatan-penilai-text">
        <strong>Catatan:</strong>{" "}
        {item.catatan_penilai?.trim()
          ? item.catatan_penilai
          : "-"}
      </div>
    </div>
  ))}
</div>
          {/* =========================
              CATATAN
          ========================= */}

          <div className="catatan">
            <strong>Catatan:</strong>{" "}
            Rekapitulasi ini hanya menampilkan
            pegawai yang telah menyelesaikan
            penilaian. Nilai akhir merupakan
            hasil perhitungan berdasarkan bobot
            masing-masing kriteria penilaian
            Pegawai Teladan.
          </div>

          {/* =========================
              TANDA TANGAN
          ========================= */}

          {dataDinilai.length > 0 && (
            <div className="ttd">
              <div className="ttd-box">
                Jakarta,{" "}
                {new Date().toLocaleDateString(
                  "id-ID",
                  {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  }
                )}
                <br />

                Kepala Balai Pemasyarakatan

                <div className="ttd-space"></div>

                <strong>
                  ______________________________
                </strong>

                <br />

                NIP.
                {" "}
                ____________________________
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}

