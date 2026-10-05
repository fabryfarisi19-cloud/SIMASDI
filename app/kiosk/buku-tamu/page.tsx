"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

type JenisPengunjung =
  | "KLIEN_DEWASA"
  | "KLIEN_ANAK"
  | "TAMU_DINAS"
  | "";

type Pegawai = {
  id: number;
  nama: string;
  username: string;
  role: string;
};

type FormData = {
  jenis_pengunjung: JenisPengunjung;
  nama: string;
  nama_klien: string;
  nik: string;
  no_hp: string;
  alamat: string;
  jenis_kelamin: string;
  tanggal_lahir: string;
  status_program: string;
  pasal: string;
  asal_instansi: string;
  tanggal_lapor: string;
  tanggal_kembali: string;
  instansi: string;
  jabatan: string;
  jenis_keperluan: string;
  keperluan: string;
  pengguna_tujuan_id: string;
  tanda_tangan: string;
  keterangan: string;
};

const initialForm: FormData = {
  jenis_pengunjung: "",
  nama: "",
  nama_klien: "",
  nik: "",
  no_hp: "",
  alamat: "",
  jenis_kelamin: "",
  tanggal_lahir: "",
  status_program: "",
  pasal: "",
  asal_instansi: "",
  tanggal_lapor: "",
  tanggal_kembali: "",
  instansi: "",
  jabatan: "",
  jenis_keperluan: "",
  keperluan: "",
  pengguna_tujuan_id: "",
  tanda_tangan: "",
  keterangan: "",
};

export default function BukuTamuKioskPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const sessionData = session as any;
  const user = sessionData?.user as any;

  const roleAsli =
    sessionData?.role ||
    user?.role ||
    user?.jabatan ||
    "";

  const role = String(roleAsli)
    .trim()
    .toLowerCase();

  const bolehAkses = role === "buku tamu";

  const [step, setStep] = useState<"pilih" | "form" | "sukses">("pilih");

  const [form, setForm] = useState<FormData>(initialForm);
  const [pegawai, setPegawai] = useState<Pegawai[]>([]);
  const [loadingPegawai, setLoadingPegawai] = useState(false);
  const [saving, setSaving] = useState(false);

  const [nomorKunjungan, setNomorKunjungan] = useState("");
  const [error, setError] = useState("");

  const [pegawaiSearch, setPegawaiSearch] = useState("");
  const [showPegawai, setShowPegawai] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const drawingRef = useRef(false);
  const hasSignatureRef = useRef(false);
  /* =========================================================
     PENGAMAN AKSES
     HANYA AKUN BUKU TAMU
  ========================================================= */

  useEffect(() => {
    if (status === "loading") {
      return;
    }

    if (!session) {
      router.replace("/login");
      return;
    }

    if (!bolehAkses) {
      router.replace("/dashboard");
    }
  }, [status, session, bolehAkses, router]);
  /* =========================================================
     LOAD PEGAWAI
  ========================================================= */

 useEffect(() => {
  if (!bolehAkses) {
    return;
  }

  loadPegawai();
}, [bolehAkses]);

  async function loadPegawai() {
    try {
      setLoadingPegawai(true);

      const response = await fetch("/api/buku-tamu/pegawai");

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Gagal mengambil daftar pegawai"
        );
      }

      setPegawai(result.data || []);
    } catch (err) {
      console.error("LOAD PEGAWAI:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Gagal mengambil daftar pegawai"
      );
    } finally {
      setLoadingPegawai(false);
    }
  }

  /* =========================================================
     PILIH JENIS PENGUNJUNG
  ========================================================= */

  function pilihJenis(jenis: JenisPengunjung) {
    setError("");

    setForm({
      ...initialForm,
      jenis_pengunjung: jenis,
    });

    setPegawaiSearch("");
    setShowPegawai(false);

    setStep("form");

    setTimeout(() => {
      setupCanvas();
    }, 100);
  }

  /* =========================================================
     FORM HANDLER
  ========================================================= */

  function updateForm<K extends keyof FormData>(
    field: K,
    value: FormData[K]
  ) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  /* =========================================================
     PEGAWAI TERPILIH
  ========================================================= */

  const pegawaiTerpilih = useMemo(() => {
    if (!form.pengguna_tujuan_id) {
      return null;
    }

    return (
      pegawai.find(
        (item) =>
          String(item.id) ===
          form.pengguna_tujuan_id
      ) || null
    );
  }, [form.pengguna_tujuan_id, pegawai]);

  const filteredPegawai = useMemo(() => {
    const keyword = pegawaiSearch
      .trim()
      .toLowerCase();

    if (!keyword) {
      return pegawai;
    }

    return pegawai.filter((item) => {
      const nama = item.nama?.toLowerCase() || "";
      const role = item.role?.toLowerCase() || "";

      return (
        nama.includes(keyword) ||
        role.includes(keyword)
      );
    });
  }, [pegawai, pegawaiSearch]);

  function pilihPegawai(item: Pegawai) {
    updateForm(
      "pengguna_tujuan_id",
      String(item.id)
    );

    setPegawaiSearch(item.nama);
    setShowPegawai(false);
  }

  /* =========================================================
     CANVAS TANDA TANGAN
  ========================================================= */

  function setupCanvas() {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const rect = canvas.getBoundingClientRect();

    const dpr =
      window.devicePixelRatio || 1;

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    const ctx = canvas.getContext("2d");

    if (!ctx) {
      return;
    }

    ctx.scale(dpr, dpr);

    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#111827";

    hasSignatureRef.current = false;

    ctx.clearRect(
      0,
      0,
      rect.width,
      rect.height
    );

    setForm((prev) => ({
      ...prev,
      tanda_tangan: "",
    }));
  }

  useEffect(() => {
    if (step !== "form") {
      return;
    }

    const timer = setTimeout(() => {
      setupCanvas();
    }, 200);

    return () => clearTimeout(timer);
  }, [step]);

  function getCanvasPosition(
    event: PointerEvent
  ) {
    const canvas = canvasRef.current;

    if (!canvas) {
      return {
        x: 0,
        y: 0,
      };
    }

    const rect =
      canvas.getBoundingClientRect();

    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  }

  function startDrawing(
    event: React.PointerEvent<HTMLCanvasElement>
  ) {
    event.preventDefault();

    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    canvas.setPointerCapture(event.pointerId);

    const ctx = canvas.getContext("2d");

    if (!ctx) {
      return;
    }

    const { x, y } =
      getCanvasPosition(event.nativeEvent);

    drawingRef.current = true;

    ctx.beginPath();
    ctx.moveTo(x, y);
  }

  function draw(
    event: React.PointerEvent<HTMLCanvasElement>
  ) {
    event.preventDefault();

    if (!drawingRef.current) {
      return;
    }

    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext("2d");

    if (!ctx) {
      return;
    }

    const { x, y } =
      getCanvasPosition(event.nativeEvent);

    ctx.lineTo(x, y);
    ctx.stroke();

    hasSignatureRef.current = true;
  }

  function stopDrawing(
    event?: React.PointerEvent<HTMLCanvasElement>
  ) {
    if (event) {
      event.preventDefault();
    }

    drawingRef.current = false;

    if (hasSignatureRef.current) {
      const canvas = canvasRef.current;

      if (canvas) {
        const data =
          canvas.toDataURL("image/png");

        updateForm(
          "tanda_tangan",
          data
        );
      }
    }
  }

  function clearSignature() {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext("2d");

    if (!ctx) {
      return;
    }

    const rect =
      canvas.getBoundingClientRect();

    ctx.clearRect(
      0,
      0,
      rect.width,
      rect.height
    );

    hasSignatureRef.current = false;

    updateForm(
      "tanda_tangan",
      ""
    );
  }

  /* =========================================================
     VALIDASI
  ========================================================= */

  function validateForm() {
  const isKlien =
    form.jenis_pengunjung === "KLIEN_DEWASA" ||
    form.jenis_pengunjung === "KLIEN_ANAK";

  // ==========================================
  // VALIDASI KLIEN
  // ==========================================

  if (isKlien) {
    if (!form.nama_klien.trim()) {
      return "Nama klien wajib diisi.";
    }

    if (!form.jenis_kelamin) {
      return "Jenis kelamin wajib dipilih.";
    }

    if (!form.tanggal_lahir) {
      return "Tanggal lahir wajib diisi.";
    }

    if (!form.status_program) {
      return "Status program wajib dipilih.";
    }

    if (!form.pasal.trim()) {
      return "PASAL wajib diisi.";
    }

    if (!form.asal_instansi.trim()) {
      return "Asal instansi wajib diisi.";
    }

    if (!form.tanggal_lapor) {
      return "Tanggal lapor wajib diisi.";
    }

    if (!form.tanggal_kembali) {
      return "Tanggal kembali wajib diisi.";
    }
  }

  // ==========================================
  // VALIDASI TAMU DINAS
  // ==========================================

  if (
    form.jenis_pengunjung === "TAMU_DINAS" &&
    !form.nama.trim()
  ) {
    return "Nama pengunjung wajib diisi.";
  }

  if (
    form.jenis_pengunjung === "TAMU_DINAS" &&
    !form.instansi.trim()
  ) {
    return "Instansi wajib diisi untuk Tamu Dinas.";
  }

  // ==========================================
  // VALIDASI UMUM
  // ==========================================

  if (!form.jenis_keperluan) {
    return "Jenis keperluan wajib dipilih.";
  }

  if (!form.keperluan.trim()) {
    return "Keperluan wajib diisi.";
  }

  if (!form.pengguna_tujuan_id) {
    return "Pegawai yang dituju wajib dipilih.";
  }

  if (!form.tanda_tangan) {
    return "Tanda tangan wajib diisi.";
  }

  return "";
}

  /* =========================================================
     SIMPAN
  ========================================================= */

  async function simpanKunjungan() {
  // =========================================================
  // CEGAH DOUBLE SUBMIT
  // =========================================================
  if (saving) {
    return;
  }

  setError("");

  // =========================================================
  // VALIDASI
  // =========================================================
  const validation = validateForm();

  if (validation) {
    setError(validation);
    return;
  }

  // =========================================================
  // MULAI SIMPAN
  // =========================================================
  setSaving(true);

  try {
    const response = await fetch(
      "/api/buku-tamu",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      }
    );

    const result = await response.json();

    if (
      !response.ok ||
      !result.success
    ) {
      throw new Error(
        result.message ||
          "Gagal menyimpan kunjungan"
      );
    }

    // =======================================================
    // BERHASIL
    // =======================================================

    setNomorKunjungan(
      result.nomor_kunjungan || ""
    );

    setStep("sukses");

    // =======================================================
    // OTOMATIS KEMBALI KE AWAL SETELAH 10 DETIK
    // =======================================================

    setTimeout(() => {
      resetKiosk();
    }, 10000);
  } catch (err) {
    console.error(
      "SIMPAN BUKU TAMU:",
      err
    );

    setError(
      err instanceof Error
        ? err.message
        : "Gagal menyimpan kunjungan"
    );
  } finally {
    setSaving(false);
  }
}

  /* =========================================================
     RESET
  ========================================================= */

  function resetKiosk() {
    setForm(initialForm);
    setNomorKunjungan("");
    setError("");
    setPegawaiSearch("");
    setShowPegawai(false);
    hasSignatureRef.current = false;
    drawingRef.current = false;

    setStep("pilih");
  }

  /* =========================================================
     PRINT
  ========================================================= */

  function printBukti() {
    window.print();
  }

  /* =========================================================
     RENDER
  ========================================================= */
  if (status === "loading") {
    return null;
  }

  if (!session || !bolehAkses) {
    return null;
  }
  return (
    <>
      <style jsx global>{`
        * {
          box-sizing: border-box;
        }

        html,
        body {
          margin: 0;
          padding: 0;
          background: #f1f5f9;
        }

        body {
          font-family:
            Arial,
            Helvetica,
            sans-serif;
        }

        button,
        input,
        textarea,
        select {
          font-family: inherit;
        }

        button {
          -webkit-tap-highlight-color: transparent;
        }

        @media print {
          body * {
            visibility: hidden;
          }

          .print-area,
          .print-area * {
            visibility: visible;
          }

          .print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>

      <main
        style={{
          minHeight: "100vh",
          padding: "20px",
        }}
      >
        <div
          style={{
            maxWidth: "1100px",
            margin: "0 auto",
          }}
        >
          {/* =================================================
              HEADER
          ================================================= */}

          <header
            style={{
              background:
                "linear-gradient(135deg, #0f172a, #1e3a8a)",
              color: "white",
              borderRadius: "24px",
              padding: "28px",
              marginBottom: "20px",
              boxShadow:
                "0 10px 30px rgba(0,0,0,.12)",
            }}
          >
            <div
              style={{
                fontSize: "14px",
                opacity: 0.85,
                marginBottom: "8px",
                letterSpacing: "1px",
              }}
            >
              BAPAS KELAS I JAKARTA BARAT
            </div>

            <h1
              style={{
                margin: 0,
                fontSize:
                  "clamp(28px, 5vw, 42px)",
              }}
            >
              Buku Tamu Digital
            </h1>

            <div
              style={{
                marginTop: "8px",
                fontSize: "17px",
                opacity: 0.9,
              }}
            >
              Silakan isi data kunjungan
              dengan lengkap
            </div>
          </header>

          {/* =================================================
              ERROR
          ================================================= */}

          {error && (
            <div
              style={{
                background: "#fee2e2",
                border:
                  "1px solid #ef4444",
                color: "#991b1b",
                borderRadius: "16px",
                padding: "16px 18px",
                marginBottom: "20px",
                fontSize: "16px",
                fontWeight: 600,
              }}
            >
              ⚠️ {error}
            </div>
          )}

          {/* =================================================
              STEP PILIH
          ================================================= */}

          {step === "pilih" && (
            <section>
              <div
                style={{
                  textAlign: "center",
                  margin:
                    "25px 0 20px",
                }}
              >
                <h2
                  style={{
                    margin: 0,
                    fontSize:
                      "clamp(25px, 4vw, 34px)",
                    color: "#0f172a",
                  }}
                >
                  Selamat Datang
                </h2>

                <p
                  style={{
                    color: "#64748b",
                    fontSize: "18px",
                    marginTop: "10px",
                  }}
                >
                  Silakan pilih jenis
                  kunjungan Anda
                </p>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(280px, 1fr))",
                  gap: "20px",
                }}
              >
                {/* DEWASA */}

                <button
                  type="button"
                  onClick={() =>
                    pilihJenis(
                      "KLIEN_DEWASA"
                    )
                  }
                  style={{
                    minHeight: "240px",
                    border: "none",
                    borderRadius: "24px",
                    background:
                      "white",
                    boxShadow:
                      "0 8px 25px rgba(15,23,42,.10)",
                    cursor: "pointer",
                    padding: "30px",
                    color: "#0f172a",
                  }}
                >
                  <div
                    style={{
                      fontSize: "65px",
                      marginBottom: "15px",
                    }}
                  >
                    🧑
                  </div>

                  <div
                    style={{
                      fontSize: "25px",
                      fontWeight: 800,
                    }}
                  >
                    KLIEN DEWASA
                  </div>

                  <div
                    style={{
                      marginTop: "8px",
                      color: "#64748b",
                      fontSize: "16px",
                    }}
                  >
                    Untuk klien dewasa
                  </div>
                </button>

                {/* ANAK */}

                <button
                  type="button"
                  onClick={() =>
                    pilihJenis(
                      "KLIEN_ANAK"
                    )
                  }
                  style={{
                    minHeight: "240px",
                    border: "none",
                    borderRadius: "24px",
                    background:
                      "white",
                    boxShadow:
                      "0 8px 25px rgba(15,23,42,.10)",
                    cursor: "pointer",
                    padding: "30px",
                    color: "#0f172a",
                  }}
                >
                  <div
                    style={{
                      fontSize: "65px",
                      marginBottom: "15px",
                    }}
                  >
                    👦
                  </div>

                  <div
                    style={{
                      fontSize: "25px",
                      fontWeight: 800,
                    }}
                  >
                    KLIEN ANAK
                  </div>

                  <div
                    style={{
                      marginTop: "8px",
                      color: "#64748b",
                      fontSize: "16px",
                    }}
                  >
                    Untuk klien anak
                  </div>
                </button>

                {/* TAMU DINAS */}

                <button
                  type="button"
                  onClick={() =>
                    pilihJenis(
                      "TAMU_DINAS"
                    )
                  }
                  style={{
                    minHeight: "240px",
                    border: "none",
                    borderRadius: "24px",
                    background:
                      "white",
                    boxShadow:
                      "0 8px 25px rgba(15,23,42,.10)",
                    cursor: "pointer",
                    padding: "30px",
                    color: "#0f172a",
                  }}
                >
                  <div
                    style={{
                      fontSize: "65px",
                      marginBottom: "15px",
                    }}
                  >
                    🏢
                  </div>

                  <div
                    style={{
                      fontSize: "25px",
                      fontWeight: 800,
                    }}
                  >
                    TAMU DINAS
                  </div>

                  <div
                    style={{
                      marginTop: "8px",
                      color: "#64748b",
                      fontSize: "16px",
                    }}
                  >
                    Untuk tamu dari instansi
                  </div>
                </button>
              </div>
            </section>
          )}

          {/* =================================================
              FORM
          ================================================= */}

          {step === "form" && (
            <section
              style={{
                background: "white",
                borderRadius: "24px",
                padding:
                  "clamp(20px, 4vw, 35px)",
                boxShadow:
                  "0 8px 25px rgba(15,23,42,.10)",
              }}
            >
              {/* JUDUL */}

              <div
                style={{
                  display: "flex",
                  justifyContent:
                    "space-between",
                  alignItems: "center",
                  gap: "15px",
                  flexWrap: "wrap",
                  marginBottom: "25px",
                }}
              >
                <div>
                  <div
                    style={{
                      color: "#64748b",
                      fontSize: "14px",
                    }}
                  >
                    JENIS PENGUNJUNG
                  </div>

                  <h2
                    style={{
                      margin:
                        "5px 0 0",
                      fontSize: "28px",
                      color:
                        "#0f172a",
                    }}
                  >
                    {form.jenis_pengunjung ===
                      "KLIEN_DEWASA" &&
                      "🧑 Klien Dewasa"}

                    {form.jenis_pengunjung ===
                      "KLIEN_ANAK" &&
                      "👦 Klien Anak"}

                    {form.jenis_pengunjung ===
                      "TAMU_DINAS" &&
                      "🏢 Tamu Dinas"}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setStep("pilih")
                  }
                  style={{
                    border: "none",
                    background:
                      "#e2e8f0",
                    color: "#334155",
                    padding:
                      "13px 20px",
                    borderRadius: "12px",
                    fontWeight: 700,
                    cursor: "pointer",
                    fontSize: "16px",
                  }}
                >
                  ← Kembali
                </button>
              </div>

              {/* FORM GRID */}

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(280px, 1fr))",
                  gap: "20px",
                }}
              >
                {/* =================================================
    DATA KLIEN
================================================= */}

{(
  form.jenis_pengunjung === "KLIEN_DEWASA" ||
  form.jenis_pengunjung === "KLIEN_ANAK"
) && (
  <>
    {/* NAMA KLIEN */}

    <div
      style={{
        gridColumn: "1 / -1",
      }}
    >
      <label style={labelStyle}>
        Nama Klien *
      </label>

      <input
        value={form.nama_klien}
        onChange={(e) => {
          updateForm(
            "nama_klien",
            e.target.value
          );

          updateForm(
            "nama",
            e.target.value
          );
        }}
        placeholder="Masukkan nama lengkap klien"
        style={inputStyle}
      />
    </div>

    {/* JENIS KELAMIN */}

    <div>
      <label style={labelStyle}>
        Jenis Kelamin *
      </label>

      <select
        value={form.jenis_kelamin}
        onChange={(e) =>
          updateForm(
            "jenis_kelamin",
            e.target.value
          )
        }
        style={inputStyle}
      >
        <option value="">
          Pilih jenis kelamin
        </option>

        <option value="Laki-laki">
          Laki-laki
        </option>

        <option value="Perempuan">
          Perempuan
        </option>
      </select>
    </div>

    {/* TANGGAL LAHIR */}

    <div>
      <label style={labelStyle}>
        Tanggal Lahir *
      </label>

      <input
        type="date"
        value={form.tanggal_lahir}
        onChange={(e) =>
          updateForm(
            "tanggal_lahir",
            e.target.value
          )
        }
        style={inputStyle}
      />
    </div>

    {/* STATUS PROGRAM */}

    <div>
      <label style={labelStyle}>
        Status Program *
      </label>

      <select
        value={form.status_program}
        onChange={(e) =>
          updateForm(
            "status_program",
            e.target.value
          )
        }
        style={inputStyle}
      >
        <option value="">
          Pilih status program
        </option>

        <option value="PB">
          PB
        </option>

        <option value="DIVERSI">
          Diversi
        </option>

        <option value="CB">
          CB
        </option>

        <option value="CMB">
          CMB
        </option>
     
  <option value="PERINTIS">PERINTIS</option>
   </select>
    </div>
    {/* PASAL */}

    <div>
      <label style={labelStyle}>
        PASAL *
      </label>

      <input
        value={form.pasal}
        onChange={(e) =>
          updateForm(
            "pasal",
            e.target.value
          )
        }
        placeholder="Contoh: Pasal 351 KUHP"
        style={inputStyle}
      />
    </div>

    {/* ASAL INSTANSI */}

    <div
      style={{
        gridColumn: "1 / -1",
      }}
    >
      <label style={labelStyle}>
        Asal Instansi *
      </label>

      <input
        value={form.asal_instansi}
        onChange={(e) =>
          updateForm(
            "asal_instansi",
            e.target.value
          )
        }
        placeholder="Contoh: Bapas / Lapas / Kepolisian / Kejaksaan"
        style={inputStyle}
      />
    </div>

    {/* TANGGAL LAPOR */}

    <div>
      <label style={labelStyle}>
        Tanggal Lapor *
      </label>

      <input
        type="date"
        value={form.tanggal_lapor}
        onChange={(e) =>
          updateForm(
            "tanggal_lapor",
            e.target.value
          )
        }
        style={inputStyle}
      />
    </div>

    {/* TANGGAL KEMBALI */}

    <div>
      <label style={labelStyle}>
        Tanggal Kembali *
      </label>

      <input
        type="date"
        value={form.tanggal_kembali}
        onChange={(e) =>
          updateForm(
            "tanggal_kembali",
            e.target.value
          )
        }
        style={inputStyle}
      />
    </div>
  </>
)}

{/* =================================================
    DATA TAMU DINAS
================================================= */}

{form.jenis_pengunjung === "TAMU_DINAS" && (
  <div
    style={{
      gridColumn: "1 / -1",
    }}
  >
    <label style={labelStyle}>
      Nama Pengunjung *
    </label>

    <input
      value={form.nama}
      onChange={(e) =>
        updateForm(
          "nama",
          e.target.value
        )
      }
      placeholder="Masukkan nama lengkap"
      style={inputStyle}
    />
  </div>
)}

{/* NIK HANYA TIDAK DITAMPILKAN LAGI */}

                {/* HP */}

                <div>
                  <label style={labelStyle}>
                    No. HP
                  </label>

                  <input
                    value={form.no_hp}
                    onChange={(e) =>
                      updateForm(
                        "no_hp",
                        e.target.value
                      )
                    }
                    placeholder="08xxxxxxxxxx"
                    inputMode="tel"
                    style={inputStyle}
                  />
                </div>

                {/* ALAMAT */}

                <div
                  style={{
                    gridColumn:
                      "1 / -1",
                  }}
                >
                  <label style={labelStyle}>
                    Alamat
                  </label>

                  <textarea
                    value={form.alamat}
                    onChange={(e) =>
                      updateForm(
                        "alamat",
                        e.target.value
                      )
                    }
                    placeholder="Alamat pengunjung"
                    rows={3}
                    style={{
                      ...inputStyle,
                      resize: "vertical",
                    }}
                  />
                </div>

                {/* TAMU DINAS */}

                {form.jenis_pengunjung ===
                  "TAMU_DINAS" && (
                  <>
                    <div>
                      <label
                        style={labelStyle}
                      >
                        Instansi *
                      </label>

                      <input
                        value={
                          form.instansi
                        }
                        onChange={(e) =>
                          updateForm(
                            "instansi",
                            e.target
                              .value
                          )
                        }
                        placeholder="Nama instansi"
                        style={
                          inputStyle
                        }
                      />
                    </div>

                    <div>
                      <label
                        style={labelStyle}
                      >
                        Jabatan
                      </label>

                      <input
                        value={
                          form.jabatan
                        }
                        onChange={(e) =>
                          updateForm(
                            "jabatan",
                            e.target
                              .value
                          )
                        }
                        placeholder="Jabatan"
                        style={
                          inputStyle
                        }
                      />
                    </div>
                  </>
                )}

                {/* JENIS KEPERLUAN */}

                <div>
                  <label style={labelStyle}>
                    Jenis Keperluan *
                  </label>

                  <select
                    value={
                      form.jenis_keperluan
                    }
                    onChange={(e) =>
                      updateForm(
                        "jenis_keperluan",
                        e.target.value
                      )
                    }
                    style={inputStyle}
                  >
                    <option value="">
                      Pilih jenis keperluan
                    </option>

                    <option value="Konsultasi">
                      Konsultasi
                    </option>

                    <option value="Koordinasi">
                      Koordinasi
                    </option>

                    <option value="Pembimbingan">
                      Pembimbingan
                    </option>

                    <option value="Penelitian">
                      Penelitian
                    </option>

                    <option value="Dinas">
                      Dinas
                    </option>

                    <option value="Pelayanan">
                      Pelayanan
                    </option>

                    <option value="Lainnya">
                      Lainnya
                    </option>
                  </select>
                </div>

                {/* PEGAWAI TUJUAN */}

                <div
                  style={{
                    position: "relative",
                  }}
                >
                  <label style={labelStyle}>
                    Pegawai yang Dituju *
                  </label>

                  <input
                    value={
                      pegawaiSearch
                    }
                    onFocus={() =>
                      setShowPegawai(
                        true
                      )
                    }
                    onChange={(e) => {
                      setPegawaiSearch(
                        e.target.value
                      );

                      setShowPegawai(
                        true
                      );

                      updateForm(
                        "pengguna_tujuan_id",
                        ""
                      );
                    }}
                    placeholder={
                      loadingPegawai
                        ? "Memuat pegawai..."
                        : "Cari nama pegawai..."
                    }
                    disabled={
                      loadingPegawai
                    }
                    style={inputStyle}
                  />

                  {showPegawai && (
                    <div
                      style={{
                        position:
                          "absolute",
                        left: 0,
                        right: 0,
                        top: "100%",
                        zIndex: 20,
                        background:
                          "white",
                        border:
                          "1px solid #cbd5e1",
                        borderRadius:
                          "12px",
                        marginTop:
                          "5px",
                        maxHeight:
                          "280px",
                        overflowY:
                          "auto",
                        boxShadow:
                          "0 12px 30px rgba(0,0,0,.15)",
                      }}
                    >
                      {filteredPegawai.length ===
                      0 ? (
                        <div
                          style={{
                            padding:
                              "15px",
                            color:
                              "#64748b",
                          }}
                        >
                          Pegawai tidak
                          ditemukan.
                        </div>
                      ) : (
                        filteredPegawai.map(
                          (item) => (
                            <button
                              key={
                                item.id
                              }
                              type="button"
                              onClick={() =>
                                pilihPegawai(
                                  item
                                )
                              }
                              style={{
                                display:
                                  "block",
                                width:
                                  "100%",
                                textAlign:
                                  "left",
                                border:
                                  "none",
                                borderBottom:
                                  "1px solid #e2e8f0",
                                background:
                                  "white",
                                padding:
                                  "14px",
                                cursor:
                                  "pointer",
                              }}
                            >
                              <div
                                style={{
                                  fontWeight:
                                    700,
                                  color:
                                    "#0f172a",
                                }}
                              >
                                {
                                  item.nama
                                }
                              </div>

                              <div
                                style={{
                                  marginTop:
                                    "3px",
                                  fontSize:
                                    "13px",
                                  color:
                                    "#64748b",
                                }}
                              >
                                {
                                  item.role
                                }
                              </div>
                            </button>
                          )
                        )
                      )}
                    </div>
                  )}
                </div>

                {/* KEPELUAN */}

                <div
                  style={{
                    gridColumn:
                      "1 / -1",
                  }}
                >
                  <label style={labelStyle}>
                    Keperluan *
                  </label>

                  <textarea
                    value={
                      form.keperluan
                    }
                    onChange={(e) =>
                      updateForm(
                        "keperluan",
                        e.target.value
                      )
                    }
                    placeholder="Jelaskan keperluan kunjungan"
                    rows={4}
                    style={{
                      ...inputStyle,
                      resize: "vertical",
                    }}
                  />
                </div>

                {/* PEGAWAI TERPILIH */}

                {pegawaiTerpilih && (
                  <div
                    style={{
                      gridColumn:
                        "1 / -1",
                      background:
                        "#eff6ff",
                      border:
                        "1px solid #bfdbfe",
                      borderRadius:
                        "14px",
                      padding: "15px",
                    }}
                  >
                    <div
                      style={{
                        fontSize:
                          "13px",
                        color:
                          "#64748b",
                      }}
                    >
                      PEGAWAI YANG DITUJU
                    </div>

                    <div
                      style={{
                        marginTop:
                          "4px",
                        fontSize:
                          "18px",
                        fontWeight: 800,
                        color:
                          "#1e3a8a",
                      }}
                    >
                      {
                        pegawaiTerpilih.nama
                      }
                    </div>

                    <div
                      style={{
                        marginTop:
                          "3px",
                        color:
                          "#475569",
                      }}
                    >
                      {
                        pegawaiTerpilih.role
                      }
                    </div>
                  </div>
                )}

                {/* KETERANGAN */}

                <div
                  style={{
                    gridColumn:
                      "1 / -1",
                  }}
                >
                  <label style={labelStyle}>
                    Keterangan
                  </label>

                  <textarea
                    value={
                      form.keterangan
                    }
                    onChange={(e) =>
                      updateForm(
                        "keterangan",
                        e.target.value
                      )
                    }
                    placeholder="Keterangan tambahan jika diperlukan"
                    rows={3}
                    style={{
                      ...inputStyle,
                      resize: "vertical",
                    }}
                  />
                </div>
              </div>

              {/* =================================================
                  TANDA TANGAN
              ================================================= */}

              <div
                style={{
                  marginTop: "30px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent:
                      "space-between",
                    alignItems:
                      "center",
                    gap: "10px",
                    marginBottom:
                      "10px",
                  }}
                >
                  <label
                    style={{
                      ...labelStyle,
                      marginBottom: 0,
                    }}
                  >
                    Tanda Tangan *
                  </label>

                  <button
                    type="button"
                    onClick={
                      clearSignature
                    }
                    style={{
                      border: "none",
                      background:
                        "#fee2e2",
                      color:
                        "#991b1b",
                      padding:
                        "8px 14px",
                      borderRadius:
                        "9px",
                      fontWeight: 700,
                      cursor:
                        "pointer",
                    }}
                  >
                    Hapus Tanda Tangan
                  </button>
                </div>

                <div
                  style={{
                    border:
                      "2px dashed #94a3b8",
                    borderRadius:
                      "16px",
                    overflow:
                      "hidden",
                    background:
                      "#f8fafc",
                  }}
                >
                  <canvas
                    ref={canvasRef}
                    onPointerDown={
                      startDrawing
                    }
                    onPointerMove={
                      draw
                    }
                    onPointerUp={
                      stopDrawing
                    }
                    onPointerCancel={
                      stopDrawing
                    }
                    onPointerLeave={
                      stopDrawing
                    }
                    style={{
                      display:
                        "block",
                      width:
                        "100%",
                      height:
                        "220px",
                      touchAction:
                        "none",
                      cursor:
                        "crosshair",
                    }}
                  />
                </div>

                <div
                  style={{
                    textAlign:
                      "center",
                    color:
                      "#94a3b8",
                    fontSize:
                      "14px",
                    marginTop:
                      "8px",
                  }}
                >
                  Bubuhkan tanda tangan
                  menggunakan jari atau
                  stylus
                </div>
              </div>

              {/* =================================================
                  SIMPAN
              ================================================= */}

              <button
                type="button"
                onClick={
                  simpanKunjungan
                }
                disabled={saving}
                style={{
                  width: "100%",
                  marginTop: "30px",
                  border: "none",
                  borderRadius: "16px",
                  padding:
                    "20px",
                  background:
                    saving
                      ? "#94a3b8"
                      : "#1d4ed8",
                  color: "white",
                  fontSize: "21px",
                  fontWeight: 800,
                  cursor: saving
                    ? "not-allowed"
                    : "pointer",
                  boxShadow:
                    "0 8px 20px rgba(29,78,216,.25)",
                }}
              >
                {saving
                  ? "⏳ MENYIMPAN..."
                  : "✓ SIMPAN KUNJUNGAN"}
              </button>
            </section>
          )}

          {/* =================================================
              SUKSES
          ================================================= */}

    
{step === "sukses" && (
  <section
    className="print-area"
    style={{
      background: "white",
      borderRadius: "24px",
      padding: "clamp(25px, 5vw, 55px)",
      textAlign: "center",
      boxShadow:
        "0 8px 30px rgba(15,23,42,.12)",
    }}
  >
    {/* ================================
        HEADER CETAK
    ================================= */}

    <div
      style={{
        borderBottom:
          "3px solid #1e3a8a",
        paddingBottom: "18px",
        marginBottom: "25px",
      }}
    >
      <div
        style={{
          fontSize: "14px",
          fontWeight: 700,
          letterSpacing: "1px",
          color: "#334155",
        }}
      >
        KEMENTERIAN IMIGRASI DAN PEMASYARAKATAN
      </div>

      <div
        style={{
          fontSize: "22px",
          fontWeight: 900,
          color: "#0f172a",
          marginTop: "5px",
        }}
      >
        BAPAS KELAS I JAKARTA BARAT
      </div>

      <div
        style={{
          fontSize: "14px",
          color: "#64748b",
          marginTop: "5px",
        }}
      >
        SISTEM BUKU TAMU DIGITAL
      </div>
    </div>

    {/* ================================
        STATUS
    ================================= */}

    <div
      style={{
        width: "75px",
        height: "75px",
        borderRadius: "50%",
        background: "#dcfce7",
        color: "#15803d",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        margin: "0 auto 15px",
        fontSize: "42px",
        fontWeight: 900,
      }}
    >
      ✓
    </div>

    <div
      style={{
        color: "#15803d",
        fontWeight: 900,
        fontSize: "17px",
        letterSpacing: "1px",
      }}
    >
      KUNJUNGAN BERHASIL
    </div>

    <p
      style={{
        color: "#64748b",
        fontSize: "14px",
        marginTop: "7px",
      }}
    >
      Data kunjungan telah berhasil
      dicatat dalam sistem.
    </p>

    {/* ================================
        NOMOR KUNJUNGAN
    ================================= */}

    <div
      style={{
        margin: "25px auto",
        maxWidth: "500px",
        border: "2px dashed #64748b",
        borderRadius: "15px",
        padding: "20px",
      }}
    >
      <div
        style={{
          fontSize: "12px",
          fontWeight: 700,
          color: "#64748b",
          letterSpacing: "1px",
        }}
      >
        NOMOR KUNJUNGAN
      </div>

      <div
        style={{
          marginTop: "7px",
          fontSize:
            "clamp(28px, 6vw, 44px)",
          fontWeight: 900,
          color: "#1d4ed8",
          letterSpacing: "2px",
        }}
      >
        {nomorKunjungan}
      </div>
    </div>

    {/* ================================
        DETAIL KUNJUNGAN
    ================================= */}

    <div
      style={{
        maxWidth: "650px",
        margin: "0 auto 25px",
        textAlign: "left",
        border:
          "1px solid #e2e8f0",
        borderRadius: "15px",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          background: "#f8fafc",
          padding: "12px 16px",
          fontWeight: 800,
          color: "#334155",
          borderBottom:
            "1px solid #e2e8f0",
        }}
      >
        DETAIL KUNJUNGAN
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "160px 1fr",
          fontSize: "14px",
        }}
      >
      <div style={printLabelStyle}>
  {form.jenis_pengunjung === "TAMU_DINAS"
    ? "Nama Pengunjung"
    : "Nama Klien"}
</div>

<div style={printValueStyle}>
  {form.jenis_pengunjung === "TAMU_DINAS"
    ? form.nama || "-"
    : form.nama_klien || "-"}
</div>

        <div style={printLabelStyle}>
          Jenis Pengunjung
        </div>

        <div style={printValueStyle}>
          {form.jenis_pengunjung ===
            "KLIEN_DEWASA" &&
            "Klien Dewasa"}

          {form.jenis_pengunjung ===
            "KLIEN_ANAK" &&
            "Klien Anak"}

          {form.jenis_pengunjung ===
            "TAMU_DINAS" &&
            "Tamu Dinas"}
        </div>
{(
  form.jenis_pengunjung === "KLIEN_DEWASA" ||
  form.jenis_pengunjung === "KLIEN_ANAK"
) && (
  <>
    <div style={printLabelStyle}>
      Jenis Kelamin
    </div>

    <div style={printValueStyle}>
      {form.jenis_kelamin || "-"}
    </div>

    <div style={printLabelStyle}>
      Tanggal Lahir
    </div>

    <div style={printValueStyle}>
      {form.tanggal_lahir || "-"}
    </div>

    <div style={printLabelStyle}>
      Status Program
    </div>

    <div style={printValueStyle}>
      {form.status_program || "-"}
    </div>

    <div style={printLabelStyle}>
      PASAL
    </div>

    <div style={printValueStyle}>
      {form.pasal || "-"}
    </div>

    <div style={printLabelStyle}>
      Asal Instansi
    </div>

    <div style={printValueStyle}>
      {form.asal_instansi || "-"}
    </div>

    <div style={printLabelStyle}>
      Tanggal Lapor
    </div>

    <div style={printValueStyle}>
      {form.tanggal_lapor || "-"}
    </div>

    <div style={printLabelStyle}>
      Tanggal Kembali
    </div>

    <div style={printValueStyle}>
      {form.tanggal_kembali || "-"}
    </div>
  </>
)}
        {form.instansi && (
          <>
            <div style={printLabelStyle}>
              Instansi
            </div>

            <div style={printValueStyle}>
              {form.instansi}
            </div>
          </>
        )}

        {form.jabatan && (
          <>
            <div style={printLabelStyle}>
              Jabatan
            </div>

            <div style={printValueStyle}>
              {form.jabatan}
            </div>
          </>
        )}

        <div style={printLabelStyle}>
          Jenis Keperluan
        </div>

        <div style={printValueStyle}>
          {form.jenis_keperluan || "-"}
        </div>

        <div style={printLabelStyle}>
          Keperluan
        </div>

        <div style={printValueStyle}>
          {form.keperluan || "-"}
        </div>

        <div style={printLabelStyle}>
          Bertemu Dengan
        </div>

        <div style={printValueStyle}>
          {pegawaiTerpilih?.nama || "-"}
        </div>

        <div style={printLabelStyle}>
          Jabatan Tujuan
        </div>

        <div style={printValueStyle}>
          {pegawaiTerpilih?.role || "-"}
        </div>
      </div>
    </div>

    {/* ================================
        INFORMASI WAKTU
    ================================= */}

    <div
      style={{
        marginBottom: "25px",
        color: "#64748b",
        fontSize: "13px",
      }}
    >
      Dicatat pada{" "}
      {new Date().toLocaleDateString(
        "id-ID",
        {
          day: "2-digit",
          month: "long",
          year: "numeric",
        }
      )}{" "}
      pukul{" "}
      {new Date().toLocaleTimeString(
        "id-ID",
        {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        }
      )}{" "}
      WIB
    </div>

    {/* ================================
        TOMBOL
    ================================= */}

    <div
      className="print-hidden"
      style={{
        display: "flex",
        justifyContent: "center",
        gap: "12px",
        flexWrap: "wrap",
      }}
    >
      <button
        type="button"
        onClick={printBukti}
        style={{
          border: "none",
          background: "#0f172a",
          color: "white",
          padding: "14px 24px",
          borderRadius: "12px",
          fontWeight: 700,
          fontSize: "16px",
          cursor: "pointer",
        }}
      >
        🖨️ Cetak Bukti
      </button>

      <button
        type="button"
        onClick={resetKiosk}
        style={{
          border: "none",
          background: "#1d4ed8",
          color: "white",
          padding: "14px 24px",
          borderRadius: "12px",
          fontWeight: 700,
          fontSize: "16px",
          cursor: "pointer",
        }}
      >
        Kembali ke Awal
      </button>
    </div>

    {/* ================================
        CATATAN
    ================================= */}

    <div
      className="print-hidden"
      style={{
        marginTop: "25px",
        color: "#94a3b8",
        fontSize: "13px",
      }}
    >
      Halaman akan kembali ke menu
      utama secara otomatis.
    </div>
  </section>
)}


          {/* FOOTER */}

          {step !== "sukses" && (
            <footer
              style={{
                textAlign:
                  "center",
                padding:
                  "25px 10px",
                color:
                  "#94a3b8",
                fontSize:
                  "13px",
              }}
            >
              SIMASDI • Buku Tamu
              Digital
            </footer>
          )}
        </div>
      </main>
    </>
  );
}

/* =========================================================
   STYLE
========================================================= */

const labelStyle: React.CSSProperties = {
  display: "block",
  marginBottom: "8px",
  fontWeight: 700,
  color: "#334155",
  fontSize: "15px",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  border: "1px solid #cbd5e1",
  borderRadius: "12px",
  padding: "14px 15px",
  fontSize: "16px",
  color: "#0f172a",
  background: "#fff",
  outline: "none",
};

/* =========================================================
   STYLE CETAK BUKTI BUKU TAMU
   ========================================================= */

const printLabelStyle: React.CSSProperties = {
  width: "150px",
  fontSize: "12px",
  fontWeight: 700,
  color: "#475569",
  verticalAlign: "top",
  padding: "5px 0",
};

const printValueStyle: React.CSSProperties = {
  fontSize: "13px",
  fontWeight: 600,
  color: "#0f172a",
  padding: "5px 0",
  verticalAlign: "top",
};