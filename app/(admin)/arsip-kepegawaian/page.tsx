"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  FolderArchive,
  User,
  Users,
  Camera,
  CreditCard,
  HeartPulse,
  FileText,
  GraduationCap,
  Award,
  FileCheck,
  CalendarDays,
  Search,
  ChevronRight,
} from "lucide-react";

type ArsipKategori = {
  nama: string;
  deskripsi: string;
  icon: any;
};

const kategoriArsip: ArsipKategori[] = [
  {
    nama: "Data Kepegawaian",
    deskripsi: "Dokumen dan data administrasi kepegawaian",
    icon: User,
  },
  {
    nama: "Pas Foto",
    deskripsi: "Pas foto pegawai",
    icon: Camera,
  },
  {
    nama: "KTP",
    deskripsi: "Kartu Tanda Penduduk",
    icon: CreditCard,
  },
  {
    nama: "KK",
    deskripsi: "Kartu Keluarga",
    icon: Users,
  },
  {
    nama: "BPJS",
    deskripsi: "Dokumen BPJS",
    icon: HeartPulse,
  },
  {
    nama: "NPWP",
    deskripsi: "Dokumen NPWP",
    icon: FileText,
  },
  {
    nama: "Buku Nikah",
    deskripsi: "Dokumen buku nikah",
    icon: FileText,
  },
  {
    nama: "Anak & Istri",
    deskripsi: "Dokumen pasangan dan anak",
    icon: Users,
  },
  {
    nama: "Pendidikan",
    deskripsi: "Ijazah dan dokumen pendidikan",
    icon: GraduationCap,
  },
  {
    nama: "Sertifikat Diklat",
    deskripsi: "Sertifikat pendidikan dan pelatihan",
    icon: Award,
  },
  {
    nama: "SK",
    deskripsi: "Surat keputusan kepegawaian",
    icon: FileCheck,
  },
  {
    nama: "Penghargaan",
    deskripsi: "Dokumen penghargaan pegawai",
    icon: Award,
  },
  {
    nama: "Izin / Sakit / Cuti",
    deskripsi: "Dokumen izin, sakit dan cuti",
    icon: CalendarDays,
  },
];

export default function ArsipKepegawaianPage() {
const { data: session, status } = useSession();
const searchParams = useSearchParams();

const nipDipilih = searchParams.get("nip") || "";

const [nama, setNama] = useState("Pegawai");
const [username, setUsername] = useState("");
const [role, setRole] = useState("");

const [daftarPegawai, setDaftarPegawai] = useState<any[]>([]);
const [pencarian, setPencarian] = useState("");
const [loadingPegawai, setLoadingPegawai] = useState(false);

const [arsipPegawai, setArsipPegawai] = useState<any[]>([]);
const [loadingArsip, setLoadingArsip] = useState(false);

const [kategoriDipilih, setKategoriDipilih] = useState("");
const [showUpload, setShowUpload] = useState(false);

const [uploadFile, setUploadFile] = useState<File | null>(null);
const [namaDokumen, setNamaDokumen] = useState("");
const [nomorDokumen, setNomorDokumen] = useState("");
const [tanggalDokumen, setTanggalDokumen] = useState("");
const [tahunDokumen, setTahunDokumen] = useState("");
const [keteranganDokumen, setKeteranganDokumen] = useState("");
const [uploadLoading, setUploadLoading] = useState(false);

  // ==========================================
  // ROLE KEPEGAWAIAN
  // ==========================================

  const roleNormal = String(role)
    .trim()
    .toLowerCase();

  const isAdminKepegawaian =
    roleNormal === "pengelola kepegawaian" ||
    roleNormal === "admin kepegawaian" ||
    roleNormal === "kaur kepegawaian" ||
    roleNormal === "admin";
const nipAktif = isAdminKepegawaian
  ? nipDipilih
  : username;
  // ==========================================
  // AMBIL DATA SESSION
  // ==========================================

  useEffect(() => {
    const sessionAny = session as any;

    const namaSession =
      sessionAny?.nama ||
      sessionAny?.user?.nama ||
      "";

    const usernameSession =
      sessionAny?.username ||
      sessionAny?.user?.username ||
      "";

    const roleSession =
      sessionAny?.role ||
      sessionAny?.user?.role ||
      sessionAny?.user?.jabatan ||
      "";

    const userLocal =
      localStorage.getItem("user");

    if (userLocal) {
      try {
        const u = JSON.parse(userLocal);

        setNama(
          namaSession ||
            u.nama ||
            "Pegawai"
        );

        setUsername(
          usernameSession ||
            u.username ||
            ""
        );

        setRole(
          roleSession ||
            u.role ||
            u.jabatan ||
            ""
        );

        return;
      } catch {
        // localStorage tidak valid
      }
    }

    setNama(
      namaSession || "Pegawai"
    );

    setUsername(
      usernameSession || ""
    );

    setRole(
      roleSession || ""
    );
  }, [session]);

  // ==========================================
  // AMBIL DAFTAR PEGAWAI
  // KHUSUS PENGELOLA KEPEGAWAIAN
  // ==========================================

  useEffect(() => {
    if (!isAdminKepegawaian) {
      return;
    }

    const ambilDaftarPegawai =
      async () => {
        try {
          setLoadingPegawai(true);

          const response =
            await fetch(
              "/api/arsip-kepegawaian?mode=pegawai"
            );

          const result =
            await response.json();

          if (
            !response.ok ||
            !result.success
          ) {
            console.error(
              "Gagal mengambil daftar pegawai:",
              result.message
            );

            return;
          }

          setDaftarPegawai(
            result.data ?? []
          );
        } catch (error) {
          console.error(
            "ERROR mengambil daftar pegawai:",
            error
          );
        } finally {
          setLoadingPegawai(false);
        }
      };

    ambilDaftarPegawai();
  }, [isAdminKepegawaian]);
useEffect(() => {
  if (status === "loading") return;

  const nipTarget = isAdminKepegawaian
    ? nipDipilih
    : username;

  if (!nipTarget) {
    setArsipPegawai([]);
    return;
  }

  const ambilArsipPegawai = async () => {
    try {
      setLoadingArsip(true);

      const response = await fetch(
        `/api/arsip-kepegawaian?nip=${encodeURIComponent(
          nipTarget
        )}`
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        console.error(
          "Gagal mengambil arsip:",
          result.message
        );

        setArsipPegawai([]);
        return;
      }

      console.log(
        "ARSIP PEGAWAI:",
        result.data
      );

      setArsipPegawai(
        result.data ?? []
      );
    } catch (error) {
      console.error(
        "ERROR mengambil arsip:",
        error
      );

      setArsipPegawai([]);
    } finally {
      setLoadingArsip(false);
    }
  };

  ambilArsipPegawai();
}, [
  status,
  username,
  nipDipilih,
  isAdminKepegawaian,
]);

 
  // ==========================================
  // LOADING SESSION
  // ==========================================

  if (status === "loading") {
    return (
      <main className="arsip-page">
        <div className="loading-box">
          Memuat Arsip Kepegawaian...
        </div>
      </main>
    );
  }

  return (
    <main className="arsip-page">

      {/* HEADER */}
      <section className="arsip-header">

        <div className="arsip-header-icon">
          <FolderArchive size={30} />
        </div>

        <div>
          <h1>Arsip Kepegawaian</h1>

          <p>
            Pengelolaan dokumen dan arsip kepegawaian
            secara digital.
          </p>
        </div>

      </section>

      {/* ============================= */}
      {/* PEGAWAI */}
      {/* ============================= */}

      {!isAdminKepegawaian && (
        <>
          <section className="profil-box">

            <div className="profil-icon">
              <User size={28} />
            </div>

            <div className="profil-info">

              <span className="label">
                Arsip Saya
              </span>

              <h2>{nama}</h2>

              <p>
                NIP / Username: {username || "-"}
              </p>

            </div>

          </section>

          <section className="section-title">
            <h2>Dokumen Saya</h2>

            <p>
              Kelola dan simpan dokumen kepegawaian
              milik Anda sendiri.
            </p>
          </section>

          <div className="kategori-grid">

            {kategoriArsip.map((item) => {
              const Icon = item.icon;

              return (
              <button
  key={item.nama}
  type="button"
  className="kategori-card"
onClick={() => {
  setKategoriDipilih(item.nama);
  setShowUpload(false);
}}
>

                  <div className="kategori-icon">
                    <Icon size={24} />
                  </div>

                  <div className="kategori-text">

                    <h3>{item.nama}</h3>

                    <p>
                      {item.deskripsi}
                    </p>

                  </div>

                  <ChevronRight
                    size={20}
                    className="kategori-arrow"
                  />

                </button>
              );
            })}

          </div>
        
        </>
      )}
{!isAdminKepegawaian && kategoriDipilih && (
  <section className="dokumen-box">

    <div className="section-title">
      <div>
        <h2>{kategoriDipilih}</h2>

        <p>
          Dokumen {kategoriDipilih} milik Anda.
        </p>
      </div>

      <button
        type="button"
        onClick={() => setShowUpload(true)}
        className="upload-button"
      >
        + Upload Dokumen
      </button>
    </div>

    {loadingArsip ? (
      <div className="empty-box">
        Memuat dokumen...
      </div>
    ) : (
      (() => {
        const dokumenKategori = arsipPegawai.filter(
          (item) =>
            String(item.kategori ?? "")
              .trim()
              .toUpperCase() ===
            kategoriDipilih
              .trim()
              .toUpperCase()
        );

        if (dokumenKategori.length === 0) {
          return (
            <div className="empty-box">
              <FolderArchive size={42} />

              <h3>
                Belum ada dokumen
              </h3>

              <p>
                Belum ada dokumen pada kategori{" "}
                {kategoriDipilih}.
              </p>

              <button
                type="button"
                onClick={() => setShowUpload(true)}
                className="upload-empty-button"
              >
                + Upload Dokumen
              </button>
            </div>
          );
        }

        return (
          <div className="dokumen-list">
            {dokumenKategori.map((item) => (
              <div
                key={item.id}
                className="dokumen-card"
              >
                <div className="dokumen-info">

                  <div className="dokumen-nama">
                    📄{" "}
                    {item.nama_dokumen ||
                      item.nama_file}
                  </div>

                  {item.nama_file && (
                    <div>
                      File: {item.nama_file}
                    </div>
                  )}

                  {item.nomor_dokumen && (
                    <div>
                      Nomor: {item.nomor_dokumen}
                    </div>
                  )}

                  {item.tanggal_dokumen && (
                    <div>
                      Tanggal:{" "}
                      {new Date(
                        item.tanggal_dokumen
                      ).toLocaleDateString("id-ID")}
                    </div>
                  )}

                  {item.tahun && (
                    <div>
                      Tahun: {item.tahun}
                    </div>
                  )}

                  {item.keterangan && (
                    <div>
                      Keterangan: {item.keterangan}
                    </div>
                  )}

                </div>

                {item.file_url && (
                  <div className="dokumen-actions">

                    <a
                      href={item.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-lihat"
                    >
                      👁 Lihat
                    </a>

                    <button
                      type="button"
                      onClick={() => {
                        const printWindow =
                          window.open(
                            item.file_url,
                            "_blank"
                          );

                        if (printWindow) {
                          printWindow.onload = () => {
                            printWindow.print();
                          };
                        }
                      }}
                      className="btn-print"
                    >
                      🖨 Print
                    </button>

                    <a
                      href={item.file_url}
                      download={
                        item.nama_file ||
                        "dokumen"
                      }
                      className="btn-download"
                    >
                      ⬇ Download
                    </a>

                  </div>
                )}
              </div>
            ))}
          </div>
        );
      })()
    )}

  </section>
)}
      {/* ============================= */}
      {/* ADMIN / KAUR KEPEGAWAIAN */}
      {/* ============================= */}
{isAdminKepegawaian && nipDipilih && (
  <section className="admin-box">
    <div className="admin-icon">
      <FolderArchive size={30} />
    </div>

    <div>
      <span className="label">
        Arsip Pegawai
      </span>

      <h2>
        {daftarPegawai.find(
          (pegawai) =>
            String(pegawai.username) ===
            String(nipDipilih)
        )?.nama || "Pegawai Terpilih"}
      </h2>

      <p>
        NIP / Username: {nipDipilih}
      </p>
    </div>
  </section>
)}
      {/* KATEGORI ARSIP PEGAWAI YANG DIPILIH */}
      {isAdminKepegawaian && nipDipilih && (
        <>
          <section className="section-title">
            <h2>Dokumen Kepegawaian</h2>

            <p>
              Pilih kategori untuk melihat dan mengelola
              dokumen pegawai tersebut.
            </p>
          </section>

          <div className="kategori-grid">
            {kategoriArsip.map((item) => {
              const Icon = item.icon;

              return (
    <button
  key={item.nama}
  type="button"
  className="kategori-card"
  onClick={() => {
    setKategoriDipilih(item.nama);
  }}
>
                  <div className="kategori-icon">
                    <Icon size={24} />
                  </div>

                  <div className="kategori-text">
                    <h3>{item.nama}</h3>

                    <p>
                      {item.deskripsi}
                    </p>
                  </div>

                  <ChevronRight
                    size={20}
                    className="kategori-arrow"
                  />
                </button>
              );
            })}
          </div>
                    {kategoriDipilih && (
            <section className="dokumen-box">
           <div className="section-title">
  <div>
    <h2>{kategoriDipilih}</h2>

    <p>
      Dokumen {kategoriDipilih} untuk pegawai yang dipilih.
    </p>
  </div>

<button
  type="button"
  onClick={() => {
    setShowUpload(true);
  }}
  className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
>
  + Upload Dokumen
</button>
</div>

             {arsipPegawai.filter(
  (item) =>
    String(item.kategori ?? "").trim().toUpperCase() ===
    kategoriDipilih.trim().toUpperCase()
).length === 0 ? (
  <div className="empty-box">
    Belum ada dokumen pada kategori {kategoriDipilih}.
  </div>
) : (
  <div
    style={{
      marginTop: "20px",
      display: "grid",
      gap: "12px",
    }}
  >
    {arsipPegawai
      .filter(
        (item) =>
          String(item.kategori ?? "").trim().toUpperCase() ===
          kategoriDipilih.trim().toUpperCase()
      )
      .map((item) => (
        <div
          key={item.id}
          style={{
            padding: "16px",
            border: "1px solid #e2e8f0",
            borderRadius: "14px",
            background: "white",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "15px",
            flexWrap: "wrap",
          }}
        >
          <div style={{ flex: 1, minWidth: "250px" }}>
            <div
              style={{
                fontSize: "16px",
                fontWeight: 800,
                color: "#0f172a",
                marginBottom: "5px",
              }}
            >
              📄 {item.nama_dokumen || item.nama_file}
            </div>

            <div
              style={{
                fontSize: "12px",
                color: "#64748b",
                lineHeight: 1.7,
              }}
            >
              {item.nama_file && (
                <div>
                  File: {item.nama_file}
                </div>
              )}

              {item.nomor_dokumen && (
                <div>
                  Nomor: {item.nomor_dokumen}
                </div>
              )}

              {item.tanggal_dokumen && (
                <div>
                  Tanggal:{" "}
                  {new Date(
                    item.tanggal_dokumen
                  ).toLocaleDateString("id-ID")}
                </div>
              )}

              {item.tahun && (
                <div>
                  Tahun: {item.tahun}
                </div>
              )}

              {item.keterangan && (
                <div>
                  Keterangan: {item.keterangan}
                </div>
              )}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: "8px",
              alignItems: "center",
            }}
          >
           {item.file_url && (
  <>
    {/* Tombol Lihat */}
    <a
      href={item.file_url}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "9px 14px",
        borderRadius: "9px",
        background: "#2563eb",
        color: "white",
        textDecoration: "none",
        fontSize: "13px",
        fontWeight: 700,
      }}
    >
      👁 Lihat
    </a>

    {/* Tombol Download */}
    <a
      href={item.file_url}
      download={item.nama_file || "dokumen"}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "9px 14px",
        borderRadius: "9px",
        background: "#16a34a",
        color: "white",
        textDecoration: "none",
        fontSize: "13px",
        fontWeight: 700,
      }}
    >
      ⬇ Download
    </a>
  </>
)}
          </div>
        </div>
      ))}
  </div>
)}
              {showUpload && (
  <div
    style={{
      marginTop: "20px",
      padding: "22px",
      background: "#f8fafc",
      border: "1px solid #e2e8f0",
      borderRadius: "16px",
    }}
  >
    <h3
      style={{
        margin: "0 0 5px",
        fontSize: "18px",
        fontWeight: 800,
        color: "#0f172a",
      }}
    >
      Upload Dokumen
    </h3>

    <p
      style={{
        margin: "0 0 20px",
        fontSize: "13px",
        color: "#64748b",
      }}
    >
   {kategoriDipilih} — {nipAktif}
    </p>

    <div
      style={{
        display: "grid",
        gap: "14px",
      }}
    >
      {/* NAMA DOKUMEN */}
      <div>
        <label
          style={{
            display: "block",
            marginBottom: "6px",
            fontSize: "13px",
            fontWeight: 700,
          }}
        >
          Nama Dokumen *
        </label>

        <input
          type="text"
          value={namaDokumen}
          onChange={(e) =>
            setNamaDokumen(e.target.value)
          }
          placeholder="Contoh: KTP, SK CPNS, Ijazah S1"
          style={{
            width: "100%",
            padding: "11px 12px",
            border: "1px solid #cbd5e1",
            borderRadius: "10px",
            background: "white",
            outline: "none",
          }}
        />
      </div>

      {/* NOMOR DOKUMEN */}
      <div>
        <label
          style={{
            display: "block",
            marginBottom: "6px",
            fontSize: "13px",
            fontWeight: 700,
          }}
        >
          Nomor Dokumen
        </label>

        <input
          type="text"
          value={nomorDokumen}
          onChange={(e) =>
            setNomorDokumen(e.target.value)
          }
          placeholder="Nomor dokumen jika ada"
          style={{
            width: "100%",
            padding: "11px 12px",
            border: "1px solid #cbd5e1",
            borderRadius: "10px",
            background: "white",
            outline: "none",
          }}
        />
      </div>

      {/* TANGGAL */}
      <div>
        <label
          style={{
            display: "block",
            marginBottom: "6px",
            fontSize: "13px",
            fontWeight: 700,
          }}
        >
          Tanggal Dokumen
        </label>

        <input
          type="date"
          value={tanggalDokumen}
          onChange={(e) =>
            setTanggalDokumen(e.target.value)
          }
          style={{
            width: "100%",
            padding: "11px 12px",
            border: "1px solid #cbd5e1",
            borderRadius: "10px",
            background: "white",
            outline: "none",
          }}
        />
      </div>

      {/* TAHUN */}
      <div>
        <label
          style={{
            display: "block",
            marginBottom: "6px",
            fontSize: "13px",
            fontWeight: 700,
          }}
        >
          Tahun
        </label>

        <input
          type="number"
          value={tahunDokumen}
          onChange={(e) =>
            setTahunDokumen(e.target.value)
          }
          placeholder="Contoh: 2026"
          min="1900"
          max="2100"
          style={{
            width: "100%",
            padding: "11px 12px",
            border: "1px solid #cbd5e1",
            borderRadius: "10px",
            background: "white",
            outline: "none",
          }}
        />
      </div>

      {/* KETERANGAN */}
      <div>
        <label
          style={{
            display: "block",
            marginBottom: "6px",
            fontSize: "13px",
            fontWeight: 700,
          }}
        >
          Keterangan
        </label>

        <textarea
          value={keteranganDokumen}
          onChange={(e) =>
            setKeteranganDokumen(e.target.value)
          }
          placeholder="Keterangan tambahan"
          rows={3}
          style={{
            width: "100%",
            padding: "11px 12px",
            border: "1px solid #cbd5e1",
            borderRadius: "10px",
            background: "white",
            outline: "none",
            resize: "vertical",
          }}
        />
      </div>

      {/* FILE */}
      <div>
        <label
          style={{
            display: "block",
            marginBottom: "6px",
            fontSize: "13px",
            fontWeight: 700,
          }}
        >
          File Dokumen *
        </label>

        <input
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.webp"
          onChange={(e) => {
            setUploadFile(
              e.target.files?.[0] ?? null
            );
          }}
          style={{
            width: "100%",
            padding: "10px",
            border: "1px solid #cbd5e1",
            borderRadius: "10px",
            background: "white",
          }}
        />

        <p
          style={{
            margin: "6px 0 0",
            fontSize: "11px",
            color: "#64748b",
          }}
        >
          Format: PDF, JPG, PNG, WEBP. Maksimal 10 MB.
        </p>
      </div>

      {/* TOMBOL */}
      <div
        style={{
          display: "flex",
          gap: "10px",
          justifyContent: "flex-end",
          marginTop: "5px",
        }}
      >
        <button
          type="button"
          onClick={() => {
            setShowUpload(false);
            setUploadFile(null);
            setNamaDokumen("");
            setNomorDokumen("");
            setTanggalDokumen("");
            setTahunDokumen("");
            setKeteranganDokumen("");
          }}
          disabled={uploadLoading}
          style={{
            padding: "10px 16px",
            borderRadius: "10px",
            border: "1px solid #cbd5e1",
            background: "white",
            cursor: "pointer",
          }}
        >
          Batal
        </button>

        <button
          type="button"
          disabled={uploadLoading}
          onClick={async () => {
            if (!uploadFile) {
              alert("Silakan pilih file dokumen.");
              return;
            }

            if (!namaDokumen.trim()) {
              alert("Nama dokumen wajib diisi.");
              return;
            }
const nipUpload = isAdminKepegawaian
  ? nipDipilih
  : username;

if (!nipUpload) {
  alert("NIP / username pegawai belum tersedia.");
  return;
}

            try {
              setUploadLoading(true);

              const formData = new FormData();

              formData.append(
                "file",
                uploadFile
              );

       formData.append(
  "nip",
  nipUpload
);

              formData.append(
                "kategori",
                kategoriDipilih
              );

              formData.append(
                "nama_dokumen",
                namaDokumen.trim()
              );

              formData.append(
                "nomor_dokumen",
                nomorDokumen.trim()
              );

              formData.append(
                "tanggal_dokumen",
                tanggalDokumen
              );

              formData.append(
                "tahun",
                tahunDokumen
              );

              formData.append(
                "keterangan",
                keteranganDokumen.trim()
              );

              const response = await fetch(
                "/api/arsip-kepegawaian/upload",
                {
                  method: "POST",
                  body: formData,
                }
              );

              const result =
                await response.json();

              if (
                !response.ok ||
                !result.success
              ) {
                alert(
                  result.message ||
                    "Upload dokumen gagal."
                );
                return;
              }

              alert(
                "Dokumen berhasil diupload."
              );

              // Bersihkan form
              setShowUpload(false);
              setUploadFile(null);
              setNamaDokumen("");
              setNomorDokumen("");
              setTanggalDokumen("");
              setTahunDokumen("");
              setKeteranganDokumen("");

              // Ambil ulang arsip pegawai
            const arsipResponse =
  await fetch(
    `/api/arsip-kepegawaian?nip=${encodeURIComponent(
      nipUpload
    )}&kategori=${encodeURIComponent(
      kategoriDipilih
    )}`
  );

              const arsipResult =
                await arsipResponse.json();

              if (
                arsipResponse.ok &&
                arsipResult.success
              ) {
                setArsipPegawai(
                  arsipResult.data ?? []
                );
              }
            } catch (error) {
              console.error(
                "ERROR UPLOAD:",
                error
              );

              alert(
                "Terjadi kesalahan saat upload dokumen."
              );
            } finally {
              setUploadLoading(false);
            }
          }}
          style={{
            padding: "10px 18px",
            borderRadius: "10px",
            border: "none",
            background: uploadLoading
              ? "#94a3b8"
              : "#2563eb",
            color: "white",
            fontWeight: 700,
            cursor: uploadLoading
              ? "not-allowed"
              : "pointer",
          }}
        >
          {uploadLoading
            ? "Mengupload..."
            : "Upload Dokumen"}
        </button>
      </div>
    </div>
  </div>
)}
            </section>
          )}
        </>
      )}
      {isAdminKepegawaian && (
        <div>
          <section className="admin-box">

            <div className="admin-icon">
              <Users size={30} />
            </div>

            <div>

              <span className="label">
                Manajemen Arsip
              </span>

              <h2>
                Arsip Seluruh Pegawai
              </h2>

              <p>
                Pilih pegawai untuk melihat,
                mengelola, mencetak, dan menyimpan
                arsip kepegawaiannya.
              </p>

            </div>

          </section>

        {!nipDipilih && (
  <section className="section-title">

    <h2>Daftar Pegawai</h2>

    <p>
      Cari pegawai untuk membuka arsip
      kepegawaiannya.
    </p>

  </section>
)}

        {/* SEARCH */}
{!nipDipilih && (
  <div className="search-box">

            <Search size={20} />

          <input
  type="text"
  placeholder="Cari nama atau NIP pegawai..."
  value={pencarian}
  onChange={(e) =>
    setPencarian(e.target.value)
  }
/>

         </div>
)}
{/* DAFTAR PEGAWAI */}
{!nipDipilih && (
  <div className="pegawai-list">
  {loadingPegawai && (
    <div className="empty-box">
      <p>Memuat daftar pegawai...</p>
    </div>
  )}

  {!loadingPegawai &&
    daftarPegawai
      .filter((pegawai) => {
        const kata =
          pencarian.trim().toLowerCase();

        if (!kata) return true;

        return (
          String(pegawai.nama ?? "")
            .toLowerCase()
            .includes(kata) ||
          String(pegawai.username ?? "")
            .toLowerCase()
            .includes(kata)
        );
      })
      .map((pegawai) => (
       <button
  key={pegawai.id}
  type="button"
  className="pegawai-card"
  onClick={() => {
    window.location.href =
      `/arsip-kepegawaian?nip=${encodeURIComponent(
        pegawai.username
      )}`;
  }}
>
          <div className="pegawai-icon">
            <User size={24} />
          </div>

          <div className="pegawai-info">
            <h3>{pegawai.nama}</h3>

            <p>
              NIP / Username:{" "}
              {pegawai.username || "-"}
            </p>

            <span>
              {pegawai.role || "Pegawai"}
            </span>
          </div>

          <ChevronRight
            size={22}
            className="pegawai-arrow"
          />
        </button>
      ))}

  {!loadingPegawai &&
    daftarPegawai.length === 0 && (
      <div className="empty-box">
        <Users size={42} />

        <h3>
          Belum ada data pegawai
        </h3>

        <p>
          Data pegawai tidak ditemukan
          pada tabel pengguna.
        </p>
      </div>
    )}

  {!loadingPegawai &&
    daftarPegawai.length > 0 &&
    daftarPegawai.filter((pegawai) => {
      const kata =
        pencarian.trim().toLowerCase();

      if (!kata) return true;

      return (
        String(pegawai.nama ?? "")
          .toLowerCase()
          .includes(kata) ||
        String(pegawai.username ?? "")
          .toLowerCase()
          .includes(kata)
      );
    }).length === 0 && (
      <div className="empty-box">
        <Search size={42} />

        <h3>
          Pegawai tidak ditemukan
        </h3>

               <p>
          Coba gunakan nama atau NIP
          yang berbeda.
        </p>
      </div>
    )}
  </div>
)}

        </div>
    )}

      <style jsx>{`
        .arsip-page {
          min-height: 100vh;
          padding: 30px;
          background: #f8fafc;
        }

        .loading-box {
          padding: 40px;
          text-align: center;
          color: #64748b;
        }

        .arsip-header {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 25px;
        }

        .arsip-header-icon {
          width: 58px;
          height: 58px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #dbeafe;
          color: #2563eb;
        }

        .arsip-header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 800;
          color: #0f172a;
        }

        .arsip-header p {
          margin: 5px 0 0;
          color: #64748b;
          font-size: 14px;
        }

        .profil-box,
        .admin-box {
          display: flex;
          align-items: center;
          gap: 18px;
          padding: 22px;
          margin-bottom: 28px;
          border-radius: 18px;
          background: white;
          border: 1px solid #e2e8f0;
          box-shadow: 0 5px 18px rgba(15,23,42,.05);
        }

        .profil-icon,
        .admin-icon {
          width: 56px;
          height: 56px;
          min-width: 56px;
          border-radius: 15px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #eff6ff;
          color: #2563eb;
        }

        .admin-icon {
          background: #ecfeff;
          color: #0891b2;
        }

        .label {
          display: block;
          font-size: 12px;
          color: #64748b;
          margin-bottom: 4px;
        }

        .profil-info h2,
        .admin-box h2 {
          margin: 0;
          font-size: 19px;
          font-weight: 800;
          color: #0f172a;
        }

        .profil-info p,
        .admin-box p {
          margin: 5px 0 0;
          color: #64748b;
          font-size: 13px;
        }

        .section-title {
          margin-bottom: 15px;
        }

        .section-title h2 {
          margin: 0;
          font-size: 20px;
          font-weight: 800;
          color: #0f172a;
        }

        .section-title p {
          margin: 5px 0 0;
          font-size: 13px;
          color: #64748b;
        }

        .kategori-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 15px;
        }

        .kategori-card {
          width: 100%;
          min-height: 105px;
          padding: 18px;
          display: flex;
          align-items: center;
          gap: 14px;
          text-align: left;
          border: 1px solid #e2e8f0;
          border-radius: 17px;
          background: white;
          cursor: pointer;
          transition: .2s;
        }

        .kategori-card:hover {
          transform: translateY(-2px);
          border-color: #93c5fd;
          box-shadow: 0 8px 20px rgba(15,23,42,.08);
        }

        .kategori-icon {
          width: 46px;
          height: 46px;
          min-width: 46px;
          border-radius: 13px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #eff6ff;
          color: #2563eb;
        }

        .kategori-text {
          flex: 1;
        }

        .kategori-text h3 {
          margin: 0;
          font-size: 15px;
          font-weight: 800;
          color: #0f172a;
        }

        .kategori-text p {
          margin: 5px 0 0;
          font-size: 12px;
          line-height: 1.4;
          color: #64748b;
        }

        .kategori-arrow {
          color: #94a3b8;
        }

        .search-box {
          display: flex;
          align-items: center;
          gap: 10px;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          padding: 0 15px;
          max-width: 600px;
          margin-bottom: 20px;
          color: #64748b;
        }

        .search-box input {
          width: 100%;
          border: none;
          outline: none;
          padding: 14px 0;
          font-size: 14px;
          background: transparent;
        }

        .empty-box {
          background: white;
          border: 1px dashed #cbd5e1;
          border-radius: 18px;
          padding: 50px 25px;
          text-align: center;
          color: #64748b;
        }

        .empty-box h3 {
          margin: 12px 0 5px;
          color: #334155;
        }

        .empty-box p {
          margin: 0;
          font-size: 13px;
        }
.pegawai-list {
  display: grid;
  gap: 12px;
}

.pegawai-card {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 17px 18px;
  text-align: left;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  background: white;
  cursor: pointer;
  transition: .2s;
}

.pegawai-card:hover {
  transform: translateY(-2px);
  border-color: #93c5fd;
  box-shadow: 0 7px 18px rgba(15,23,42,.08);
}

.pegawai-icon {
  width: 46px;
  height: 46px;
  min-width: 46px;
  border-radius: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #eff6ff;
  color: #2563eb;
}

.pegawai-info {
  flex: 1;
}

.pegawai-info h3 {
  margin: 0;
  font-size: 15px;
  font-weight: 800;
  color: #0f172a;
}

.pegawai-info p {
  margin: 4px 0;
  font-size: 12px;
  color: #64748b;
}

.pegawai-info span {
  display: inline-block;
  font-size: 11px;
  color: #2563eb;
  background: #eff6ff;
  padding: 3px 8px;
  border-radius: 999px;
}

.pegawai-arrow {
  color: #94a3b8;
}
        @media (max-width: 1000px) {
          .kategori-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 650px) {
          .arsip-page {
            padding: 20px 15px;
          }

          .arsip-header h1 {
            font-size: 22px;
          }

          .kategori-grid {
            grid-template-columns: 1fr;
          }

          .profil-box,
          .admin-box {
            align-items: flex-start;
          }
        }
.dokumen-box {
  margin-top: 25px;
  padding: 22px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 18px;
}

.upload-button {
  border: none;
  background: #2563eb;
  color: white;
  padding: 10px 16px;
  border-radius: 10px;
  font-weight: 700;
  cursor: pointer;
}

.upload-button:hover {
  background: #1d4ed8;
}

.upload-empty-button {
  margin-top: 15px;
  border: none;
  background: #2563eb;
  color: white;
  padding: 10px 16px;
  border-radius: 10px;
  font-weight: 700;
  cursor: pointer;
}

.dokumen-list {
  display: grid;
  gap: 12px;
}

.dokumen-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 15px;
  padding: 16px;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  background: #f8fafc;
}

.dokumen-info {
  flex: 1;
  min-width: 250px;
  font-size: 12px;
  color: #64748b;
  line-height: 1.7;
}

.dokumen-nama {
  font-size: 16px;
  font-weight: 800;
  color: #0f172a;
  margin-bottom: 5px;
}

.dokumen-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.btn-lihat,
.btn-print,
.btn-download {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 9px 14px;
  border-radius: 9px;
  color: white;
  text-decoration: none;
  font-size: 13px;
  font-weight: 700;
  border: none;
  cursor: pointer;
}

.btn-lihat {
  background: #2563eb;
}

.btn-print {
  background: #7c3aed;
}

.btn-download {
  background: #16a34a;
}

.btn-lihat:hover {
  background: #1d4ed8;
}

.btn-print:hover {
  background: #6d28d9;
}

.btn-download:hover {
  background: #15803d;
}

@media (max-width: 700px) {
  .dokumen-card {
    flex-direction: column;
    align-items: flex-start;
  }

  .dokumen-actions {
    width: 100%;
  }
}
      `}</style>

    </main>
  );
}