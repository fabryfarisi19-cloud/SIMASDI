"use client";

import { useEffect, useState } from "react";
import {
  FileText,
  Plus,
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  User,
  Send,
} from "lucide-react";

type MasterKode = {
  id: string;
  kode_unit: string;
  klasifikasi: string;
  kode_angka_1: string;
  kode_angka_2: string;
  aktif: boolean;
  keterangan?: string | null;
};

type PermintaanNomor = {
  id: string;

  pengguna_id?: string | null;
  username?: string | null;
  nip?: string | null;
  nama_pengguna?: string | null;
  jabatan?: string | null;

  no_reg_litmas?: string | null;
  tanggal_surat: string;

  sifat_surat?: string | null;
  perihal: string;
  dari_pemilik_surat: string;
  kepada: string;
  keterangan?: string | null;

  kode_unit: string;
  klasifikasi: string;
  kode_angka_1: string;
  kode_angka_2: string;

  no_urut?: number | null;
  nomor_surat?: string | null;

  operator?: string | null;
  status_srikandi?: string | null;

  status: "MENUNGGU" | "DIBERIKAN" | "DITOLAK";

  catatan_admin?: string | null;

  diberikan_oleh_nama?: string | null;
  diberikan_at?: string | null;

  created_at: string;
  updated_at: string;
};

type UserData = {
  id?: string;
  penggunaId?: string;

  username?: string;
  nip?: string;

  nama?: string;
  jabatan?: string;
  role?: string;
};

const ROLE_ADMIN_NOMOR = [
  "admin",
  "kaur umum",
  "pimpinan",
];

export default function NomorSuratPage() {
  const [user, setUser] =
    useState<UserData | null>(null);

  const [masterKode, setMasterKode] =
    useState<MasterKode[]>([]);

  const [permintaan, setPermintaan] =
    useState<PermintaanNomor[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [loadingMaster, setLoadingMaster] =
    useState(false);

  const [showForm, setShowForm] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [processingId, setProcessingId] =
    useState<string | null>(null);

  const [noUrut, setNoUrut] =
    useState<Record<string, string>>({});

  const [catatan, setCatatan] =
    useState<Record<string, string>>({});
const [loadingNoUrut, setLoadingNoUrut] =
  useState<Record<string, boolean>>({});
  const [form, setForm] = useState({
    tanggal_surat: "",
    kode_id: "",
    sifat_surat: "BIASA",
    perihal: "",
    dari_pemilik_surat: "",
    kepada: "Internal",
    no_reg_litmas: "",
    keterangan: "",
  });

  /* =========================================================
     ROLE
     ========================================================= */

  const normalizedRole =
    String(user?.role || "")
      .trim()
      .toLowerCase();

  const isAdminNomor =
    ROLE_ADMIN_NOMOR.includes(
      normalizedRole
    );

  /* =========================================================
     AMBIL USER DARI NEXTAUTH
     ========================================================= */

  useEffect(() => {
    let mounted = true;

    const loadUser = async () => {
      try {
        /*
         * Kita tidak lagi memakai localStorage
         * sebagai sumber autentikasi.
         *
         * Identitas utama berasal dari session
         * NextAuth.
         */

        const response = await fetch(
          "/api/auth/session",
          {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          }
        );

        const session =
          await response.json();

        console.log(
          "SESSION NOMOR SURAT =",
          session
        );

        if (!mounted) return;

        if (
          !session ||
          !session.user
        ) {
          setError(
            "Sesi login tidak ditemukan. Silakan login kembali."
          );

          setLoading(false);
          return;
        }

        const sessionUser =
          session.user || {};

        const userData: UserData = {
          id:
            session.penggunaId ||
            sessionUser.id ||
            "",

          penggunaId:
            session.penggunaId ||
            sessionUser.id ||
            "",

          username:
            session.username ||
            sessionUser.username ||
            "",

          nip:
            sessionUser.nip ||
            session.username ||
            sessionUser.username ||
            "",

          nama:
            sessionUser.name ||
            "",

          jabatan:
            sessionUser.jabatan ||
            "",

          role:
            session.role ||
            sessionUser.role ||
            "",
        };

        console.log(
          "USER NOMOR SURAT =",
          userData
        );

        setUser(userData);
      } catch (err) {
        console.error(
          "Gagal membaca session:",
          err
        );

        if (!mounted) return;

        setError(
          "Data pengguna tidak dapat dibaca."
        );

        setLoading(false);
      }
    };

    loadUser();

    return () => {
      mounted = false;
    };
  }, []);

  /* =========================================================
     LOAD MASTER KODE
     ========================================================= */

  const loadMasterKode = async () => {
    try {
      setLoadingMaster(true);

      const response = await fetch(
        "/api/nomor-surat?master=true",
        {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        }
      );

      const result =
        await response.json();

      console.log(
        "HASIL MASTER KODE =",
        result
      );

      if (
        !response.ok ||
        !result.success
      ) {
        console.error(
          "Gagal mengambil master kode:",
          result
        );

        return;
      }

    setMasterKode(
  result.data || []
);
    } catch (err) {
      console.error(
        "ERROR LOAD MASTER:",
        err
      );
    } finally {
      setLoadingMaster(false);
    }
  };

  /* =========================================================
     LOAD PERMINTAAN
     ========================================================= */

  const loadPermintaan = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "/api/nomor-surat",
        {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        }
      );

      const result =
        await response.json();

      console.log(
        "HASIL GET NOMOR SURAT =",
        result
      );

      if (
        !response.ok ||
        !result.success
      ) {
        setError(
          result.message ||
            "Gagal mengambil data nomor surat."
        );

        return;
      }

      setPermintaan(
        result.data || []
      );
    } catch (err) {
      console.error(
        "ERROR LOAD NOMOR SURAT:",
        err
      );

      setError(
        "Terjadi kesalahan saat mengambil data."
      );
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     LOAD AWAL
     ========================================================= */
  useEffect(() => {
    if (!user) return;

    loadPermintaan();

    /*
     * Master hanya diperlukan untuk
     * form pegawai.
     */

    if (!isAdminNomor) {
      loadMasterKode();
    }
  }, [user, isAdminNomor]);

  /* =========================================================
     OTOMATIS ISI NOMOR REGISTER BERIKUTNYA
     ========================================================= */

  useEffect(() => {
    if (
      !isAdminNomor ||
      permintaan.length === 0
    ) {
      return;
    }

    const daftarMenunggu =
      permintaan.filter(
        (item) =>
          item.status === "MENUNGGU"
      );

    daftarMenunggu.forEach(
      (item) => {
        loadNextNumber(item);
      }
    );
  }, [
    isAdminNomor,
    permintaan,
  ]);
  /* =========================================================
     PILIH KODE
     ========================================================= */

  const getKodeTerpilih = () => {
    return masterKode.find(
      (item) =>
        item.id === form.kode_id
    );
  };

  /* =========================================================
     SUBMIT PERMINTAAN PEGAWAI
     ========================================================= */

  const submitPermintaan = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!user) {
      setError(
        "Identitas pengguna tidak ditemukan."
      );

      return;
    }

    /*
     * Admin tidak boleh menggunakan
     * endpoint POST permintaan pegawai.
     */

    if (isAdminNomor) {
      setError(
        "Admin tidak mengajukan nomor surat melalui form ini."
      );

      return;
    }

    const kode =
      getKodeTerpilih();

    if (!kode) {
      setError(
        "Silakan pilih klasifikasi/kode surat."
      );

      return;
    }

    if (!form.tanggal_surat) {
      setError(
        "Tanggal surat wajib diisi."
      );

      return;
    }

    if (!form.perihal.trim()) {
      setError(
        "Perihal wajib diisi."
      );

      return;
    }

    if (
      !form.dari_pemilik_surat.trim()
    ) {
      setError(
        "Dari/Pemilik Surat wajib diisi."
      );

      return;
    }

    if (!form.kepada.trim()) {
      setError(
        "Kepada wajib diisi."
      );

      return;
    }

    try {
      const response = await fetch(
        "/api/nomor-surat",
        {
          method: "POST",

          credentials: "include",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            tanggal_surat:
              form.tanggal_surat,

            kode_unit:
              kode.kode_unit,

            klasifikasi:
              kode.klasifikasi,

            kode_angka_1:
              kode.kode_angka_1,

            kode_angka_2:
              kode.kode_angka_2,

            sifat_surat:
              form.sifat_surat,

            perihal:
              form.perihal,

            dari_pemilik_surat:
              form.dari_pemilik_surat,

            kepada:
              form.kepada,

            no_reg_litmas:
              form.no_reg_litmas,

            keterangan:
              form.keterangan,
          }),
        }
      );

      const result =
        await response.json();

      console.log(
        "HASIL POST NOMOR SURAT =",
        result
      );

      if (
        !response.ok ||
        !result.success
      ) {
        setError(
          result.message ||
            "Gagal mengajukan nomor surat."
        );

        return;
      }

      setSuccess(
        "Permintaan nomor surat berhasil dikirim ke Admin."
      );

      setForm({
        tanggal_surat: "",
        kode_id: "",
        sifat_surat: "BIASA",
        perihal: "",
        dari_pemilik_surat: "",
        kepada: "Internal",
        no_reg_litmas: "",
        keterangan: "",
      });

      setShowForm(false);

      await loadPermintaan();
    } catch (err) {
      console.error(
        "ERROR SUBMIT NOMOR SURAT:",
        err
      );

      setError(
        "Terjadi kesalahan saat mengirim permintaan."
      );
    }
  };
  /* =========================================================
     AMBIL NOMOR REGISTER BERIKUTNYA
     ========================================================= */

  const loadNextNumber = async (
    item: PermintaanNomor
  ) => {
    try {
      setLoadingNoUrut((prev) => ({
        ...prev,
        [item.id]: true,
      }));

      const params =
        new URLSearchParams({
          kode_unit:
            item.kode_unit,

          klasifikasi:
            item.klasifikasi,

          kode_angka_1:
            item.kode_angka_1,

          kode_angka_2:
            item.kode_angka_2,
        });

      const response =
        await fetch(
          `/api/nomor-surat/next-number?${params.toString()}`,
          {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          }
        );

      const result =
        await response.json();

      console.log(
        "NOMOR REGISTER BERIKUTNYA =",
        result
      );

      if (
        !response.ok ||
        !result.success
      ) {
        console.error(
          "Gagal mengambil nomor berikutnya:",
          result
        );

        return;
      }

      const nomorBerikutnya =
        result.data?.nomor_berikutnya;

      if (
        nomorBerikutnya ===
        undefined ||
        nomorBerikutnya === null
      ) {
        return;
      }

      /*
       * Hanya isi otomatis jika
       * Admin belum mengetik nomor sendiri.
       */

      setNoUrut((prev) => {
        if (
          prev[item.id] &&
          String(prev[item.id]).trim()
        ) {
          return prev;
        }

        return {
          ...prev,
          [item.id]:
            String(nomorBerikutnya),
        };
      });
    } catch (error) {
      console.error(
        "ERROR LOAD NOMOR BERIKUTNYA:",
        error
      );
    } finally {
      setLoadingNoUrut((prev) => ({
        ...prev,
        [item.id]: false,
      }));
    }
  };
  /* =========================================================
     BERIKAN NOMOR
     ========================================================= */

  const berikanNomor = async (
    item: PermintaanNomor
  ) => {
    const nilaiNoUrut =
      String(
        noUrut[item.id] || ""
      ).trim();

    if (!nilaiNoUrut) {
      setError(
        "Masukkan No. Urut dari register nomor surat resmi."
      );

      return;
    }

    const angka =
      Number(nilaiNoUrut);

    if (
      !Number.isInteger(angka) ||
      angka <= 0
    ) {
      setError(
        "No. Urut harus berupa angka bulat lebih dari 0."
      );

      return;
    }

    if (
      !window.confirm(
        `Berikan nomor urut ${angka} untuk permintaan dari ${
          item.nama_pengguna ||
          item.username ||
          "-"
        }?`
      )
    ) {
      return;
    }

    try {
      setProcessingId(item.id);
      setError("");
      setSuccess("");

      const response = await fetch(
        `/api/nomor-surat/${item.id}`,
        {
          method: "PATCH",

          credentials: "include",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            action: "BERIKAN",

            no_urut: angka,

            catatan:
              catatan[item.id] || "",
          }),
        }
      );

      const result =
        await response.json();

      console.log(
        "HASIL BERIKAN NOMOR =",
        result
      );

      if (
        !response.ok ||
        !result.success
      ) {
        setError(
          result.message ||
            "Gagal memberikan nomor surat."
        );

        return;
      }

      setSuccess(
        result.message ||
          "Nomor surat berhasil diberikan."
      );

      setNoUrut((prev) => {
        const next = {
          ...prev,
        };

        delete next[item.id];

        return next;
      });

      setCatatan((prev) => {
        const next = {
          ...prev,
        };

        delete next[item.id];

        return next;
      });

      await loadPermintaan();
    } catch (err) {
      console.error(
        "ERROR BERIKAN NOMOR:",
        err
      );

      setError(
        "Terjadi kesalahan saat memberikan nomor surat."
      );
    } finally {
      setProcessingId(null);
    }
  };

  /* =========================================================
     TOLAK PERMINTAAN
     ========================================================= */

  const tolakPermintaan = async (
    item: PermintaanNomor
  ) => {
    const alasan =
      String(
        catatan[item.id] || ""
      ).trim();

    if (!alasan) {
      setError(
        "Isi catatan/alasan penolakan terlebih dahulu."
      );

      return;
    }

    if (
      !window.confirm(
        `Tolak permintaan nomor surat dari ${
          item.nama_pengguna ||
          item.username ||
          "-"
        }?`
      )
    ) {
      return;
    }

    try {
      setProcessingId(item.id);
      setError("");
      setSuccess("");

      const response = await fetch(
        `/api/nomor-surat/${item.id}`,
        {
          method: "PATCH",

          credentials: "include",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            action: "TOLAK",

            catatan: alasan,
          }),
        }
      );

      const result =
        await response.json();

      console.log(
        "HASIL TOLAK NOMOR =",
        result
      );

      if (
        !response.ok ||
        !result.success
      ) {
        setError(
          result.message ||
            "Gagal menolak permintaan."
        );

        return;
      }

      setSuccess(
        result.message ||
          "Permintaan berhasil ditolak."
      );

      setCatatan((prev) => {
        const next = {
          ...prev,
        };

        delete next[item.id];

        return next;
      });

      await loadPermintaan();
    } catch (err) {
      console.error(
        "ERROR TOLAK NOMOR:",
        err
      );

      setError(
        "Terjadi kesalahan saat menolak permintaan."
      );
    } finally {
      setProcessingId(null);
    }
  };

  /* =========================================================
     FORMAT TANGGAL
     ========================================================= */

  const formatTanggal = (
    tanggal?: string | null
  ) => {
    if (!tanggal) return "-";

    try {
      return new Date(
        tanggal
      ).toLocaleDateString(
        "id-ID",
        {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        }
      );
    } catch {
      return tanggal;
    }
  };

  /* =========================================================
     FORMAT WAKTU
     ========================================================= */

  const formatTanggalWaktu = (
    tanggal?: string | null
  ) => {
    if (!tanggal) return "-";

    try {
      return new Date(
        tanggal
      ).toLocaleString(
        "id-ID",
        {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }
      );
    } catch {
      return tanggal;
    }
  };

  /* =========================================================
     KODE LENGKAP
     ========================================================= */

  const formatKode = (
    item: PermintaanNomor
  ) => {
    return (
      `${item.kode_unit}` +
      `${item.klasifikasi}` +
      `${item.kode_angka_1}` +
      `${item.kode_angka_2}`
    );
  };

  /* =========================================================
     STATUS
     ========================================================= */

  const renderStatus = (
    status: PermintaanNomor["status"]
  ) => {
    if (status === "DIBERIKAN") {
      return (
        <span className="status diberikan">
          <CheckCircle2 size={15} />
          Diberikan
        </span>
      );
    }

    if (status === "DITOLAK") {
      return (
        <span className="status ditolak">
          <XCircle size={15} />
          Ditolak
        </span>
      );
    }

    return (
      <span className="status menunggu">
        <Clock size={15} />
        Menunggu Admin
      </span>
    );
  };

  /* =========================================================
     LOADING
     ========================================================= */

  if (loading && !user) {
    return (
      <div className="halaman">
        <div className="loading">
          Memuat data pengguna...
        </div>
      </div>
    );
  }

  /* =========================================================
     RENDER
     ========================================================= */

  return (
    <div className="halaman">
      <div className="container">

        {/* HEADER */}

        <div className="header">
          <div>
            <div className="judul-wrapper">
              <div className="icon-judul">
                <FileText size={25} />
              </div>

              <div>
                <h1>
                  Nomor Surat Keluar
                </h1>

                <p>
                  Pengajuan nomor surat
                  keluar Bapas Kelas I
                  Jakarta Barat
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            className="tombol-refresh"
            onClick={() =>
              loadPermintaan()
            }
          >
            <RefreshCw size={17} />
            Refresh
          </button>
        </div>

        {/* USER */}

        {user && (
          <div className="kartu-user">
            <div>
              <strong>
                {user.nama ||
                  "Pengguna"}
              </strong>

              <span>
                {user.jabatan ||
                  user.role ||
                  "-"}
              </span>
            </div>

            <div className="user-kanan">
              <small>
                NIP / USERNAME
              </small>

              <strong>
                {user.nip ||
                  user.username ||
                  "-"}
              </strong>
            </div>
          </div>
        )}

        {/* ADMIN INFO */}

        {isAdminNomor && (
          <div className="admin-info">
            <ShieldCheck size={21} />

            <div>
              <strong>
                Mode Pengelolaan Nomor Surat
              </strong>

              <span>
                Anda dapat memproses permintaan
                pegawai dan memasukkan No. Urut
                berdasarkan register nomor surat
                resmi.
              </span>
            </div>
          </div>
        )}

        {/* ERROR */}

        {error && (
          <div className="error-box">
            <XCircle size={18} />

            <span>
              {error}
            </span>

            <button
              type="button"
              onClick={() =>
                setError("")
              }
            >
              ×
            </button>
          </div>
        )}

        {/* SUCCESS */}

        {success && (
          <div className="success-box">
            <CheckCircle2 size={18} />

            <span>
              {success}
            </span>

            <button
              type="button"
              onClick={() =>
                setSuccess("")
              }
            >
              ×
            </button>
          </div>
        )}

        {/* =====================================================
            PEGAWAI
            ===================================================== */}

        {!isAdminNomor && (
          <>
            {/* TOMBOL TAMBAH */}

            <div className="aksi">
              <button
                type="button"
                className="tombol-tambah"
                onClick={() =>
                  setShowForm(
                    !showForm
                  )
                }
              >
                <Plus size={19} />

                {showForm
                  ? "Tutup Form"
                  : "Ajukan Nomor Surat"}
              </button>
            </div>

            {/* FORM */}

            {showForm && (
              <form
                className="kartu-form"
                onSubmit={
                  submitPermintaan
                }
              >
                <div className="form-header">
                  <div>
                    <h2>
                      Pengajuan Nomor Surat
                    </h2>

                    <p>
                      Nomor urut akan diberikan
                      oleh Admin berdasarkan
                      register nomor surat resmi.
                    </p>
                  </div>
                </div>

                <div className="grid-form">

                  {/* TANGGAL */}

                  <div className="field">
                    <label>
                      Tanggal Surat
                      <span>*</span>
                    </label>

                    <input
                      type="date"
                      value={
                        form.tanggal_surat
                      }
                      onChange={(e) =>
                        setForm({
                          ...form,
                          tanggal_surat:
                            e.target.value,
                        })
                      }
                    />
                  </div>

                  {/* KODE */}

                  <div className="field">
                    <label>
                      Klasifikasi / Kode Surat
                      <span>*</span>
                    </label>

                    <select
                      value={
                        form.kode_id
                      }
                      onChange={(e) =>
                        setForm({
                          ...form,
                          kode_id:
                            e.target.value,
                        })
                      }
                    >
                      <option value="">
                        -- Pilih Kode Surat --
                      </option>

                      {loadingMaster ? (
                        <option disabled>
                          Memuat kode...
                        </option>
                      ) : (
                        masterKode.map(
                          (kode) => (
                            <option
                              key={
                                kode.id
                              }
                              value={
                                kode.id
                              }
                            >
                              {kode.kode_unit}
                              {
                                kode.klasifikasi
                              }
                              {
                                kode.kode_angka_1
                              }
                              {
                                kode.kode_angka_2
                              }

                              {kode.keterangan
                                ? ` — ${kode.keterangan}`
                                : ""}
                            </option>
                          )
                        )
                      )}
                    </select>

                    {getKodeTerpilih() && (
                      <small className="preview-kode">
                        Kode:
                        {" "}
                        {
                          getKodeTerpilih()
                            ?.kode_unit
                        }
                        {
                          getKodeTerpilih()
                            ?.klasifikasi
                        }
                        {
                          getKodeTerpilih()
                            ?.kode_angka_1
                        }
                        {
                          getKodeTerpilih()
                            ?.kode_angka_2
                        }

                        <strong>
                          [Nomor urut dari Admin]
                        </strong>
                      </small>
                    )}
                  </div>

                  {/* SIFAT */}

                  <div className="field">
                    <label>
                      Sifat Surat
                    </label>

                    <select
                      value={
                        form.sifat_surat
                      }
                      onChange={(e) =>
                        setForm({
                          ...form,
                          sifat_surat:
                            e.target.value,
                        })
                      }
                    >
                      <option value="BIASA">
                        BIASA
                      </option>

                      <option value="SEGERA">
                        SEGERA
                      </option>

                      <option value="PENTING">
                        PENTING
                      </option>

                      <option value="RAHASIA">
                        RAHASIA
                      </option>
                    </select>
                  </div>

                  {/* KEPADA */}

                  <div className="field">
                    <label>
                      Kepada
                      <span>*</span>
                    </label>

                    <input
                      type="text"
                      placeholder="Contoh: Internal"
                      value={
                        form.kepada
                      }
                      onChange={(e) =>
                        setForm({
                          ...form,
                          kepada:
                            e.target.value,
                        })
                      }
                    />
                  </div>

                  {/* NO REG */}

                  <div className="field">
                    <label>
                      No. Reg Litmas
                    </label>

                    <input
                      type="text"
                      placeholder="Opsional"
                      value={
                        form.no_reg_litmas
                      }
                      onChange={(e) =>
                        setForm({
                          ...form,
                          no_reg_litmas:
                            e.target.value,
                        })
                      }
                    />
                  </div>

                  {/* DARI */}

                  <div className="field">
                    <label>
                      Dari / Pemilik Surat
                      <span>*</span>
                    </label>

                    <input
                      type="text"
                      placeholder="Nama pemilik surat"
                      value={
                        form.dari_pemilik_surat
                      }
                      onChange={(e) =>
                        setForm({
                          ...form,
                          dari_pemilik_surat:
                            e.target.value,
                        })
                      }
                    />
                  </div>

                  {/* PERIHAL */}

                  <div className="field full">
                    <label>
                      Perihal
                      <span>*</span>
                    </label>

                    <textarea
                      rows={4}
                      placeholder="Masukkan perihal surat..."
                      value={
                        form.perihal
                      }
                      onChange={(e) =>
                        setForm({
                          ...form,
                          perihal:
                            e.target.value,
                        })
                      }
                    />
                  </div>

                  {/* KETERANGAN */}

                  <div className="field full">
                    <label>
                      Keterangan
                    </label>

                    <textarea
                      rows={3}
                      placeholder="Keterangan tambahan jika ada..."
                      value={
                        form.keterangan
                      }
                      onChange={(e) =>
                        setForm({
                          ...form,
                          keterangan:
                            e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="form-footer">
                  <button
                    type="button"
                    className="tombol-batal"
                    onClick={() =>
                      setShowForm(false)
                    }
                  >
                    Batal
                  </button>

                  <button
                    type="submit"
                    className="tombol-kirim"
                  >
                    <Send size={17} />
                    Kirim Permintaan
                  </button>
                </div>
              </form>
            )}
          </>
        )}

        {/* =====================================================
            DAFTAR
            ===================================================== */}

        <div className="kartu-daftar">

          <div className="daftar-header">
            <div>
              <h2>
                {isAdminNomor
                  ? "Daftar Permintaan Nomor Surat"
                  : "Riwayat Permintaan"}
              </h2>

              <p>
                {isAdminNomor
                  ? "Kelola permintaan nomor surat dari pegawai"
                  : "Daftar pengajuan nomor surat Anda"}
              </p>
            </div>

            <span className="jumlah">
              {permintaan.length}
            </span>
          </div>

          {loading ? (
            <div className="kosong">
              Memuat data...
            </div>
          ) : permintaan.length === 0 ? (
            <div className="kosong">
              <FileText size={38} />

              <strong>
                {isAdminNomor
                  ? "Belum ada permintaan nomor surat"
                  : "Belum ada permintaan"}
              </strong>

              <span>
                {isAdminNomor
                  ? "Permintaan dari pegawai akan muncul di sini."
                  : "Silakan ajukan nomor surat baru."}
              </span>
            </div>
          ) : (
            <div className="tabel-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>
                      Tanggal
                    </th>

                    {isAdminNomor && (
                      <th>
                        Pemohon
                      </th>
                    )}

                    <th>
                      Kode
                    </th>

                    <th>
                      Sifat
                    </th>

                    <th>
                      Perihal
                    </th>

                    <th>
                      Kepada
                    </th>

                    <th>
                      Nomor Surat
                    </th>

                    <th>
                      Status
                    </th>

                    {isAdminNomor && (
                      <th>
                        Proses
                      </th>
                    )}
                  </tr>
                </thead>

                <tbody>
                  {permintaan.map(
                    (item) => (
                      <tr
                        key={
                          item.id
                        }
                      >
                        {/* TANGGAL */}

                        <td>
                          {formatTanggal(
                            item.tanggal_surat
                          )}
                        </td>

                        {/* PEMOHON */}

                        {isAdminNomor && (
                          <td>
                            <div className="pemohon">
                              <strong>
                                {
                                  item.nama_pengguna ||
                                  item.username ||
                                  "-"
                                }
                              </strong>

                              <span>
                                {item.nip ||
                                  item.username ||
                                  "-"}
                              </span>

                              {item.jabatan && (
                                <small>
                                  {
                                    item.jabatan
                                  }
                                </small>
                              )}
                            </div>
                          </td>
                        )}

                        {/* KODE */}

                        <td>
                          <span className="kode-badge">
                            {formatKode(
                              item
                            )}
                          </span>
                        </td>

                        {/* SIFAT */}

                        <td>
                          <span className="sifat-badge">
                            {item.sifat_surat ||
                              "BIASA"}
                          </span>
                        </td>

                        {/* PERIHAL */}

                        <td>
                          <strong className="perihal">
                            {
                              item.perihal
                            }
                          </strong>

                          {item.no_reg_litmas && (
                            <small className="reg">
                              Reg:
                              {" "}
                              {
                                item.no_reg_litmas
                              }
                            </small>
                          )}
                        </td>

                        {/* KEPADA */}

                        <td>
                          {
                            item.kepada ||
                            "-"
                          }
                        </td>

                        {/* NOMOR */}

                        <td>
                          {item.nomor_surat ? (
                            <span className="nomor-jadi">
                              {
                                item.nomor_surat
                              }
                            </span>
                          ) : (
                            <span className="belum-nomor">
                              Menunggu nomor
                            </span>
                          )}
                        </td>

                        {/* STATUS */}

                        <td>
                          {renderStatus(
                            item.status
                          )}

                          {item.status ===
                            "DITOLAK" &&
                            item.catatan_admin && (
                              <small className="catatan">
                                {
                                  item.catatan_admin
                                }
                              </small>
                            )}

                          {item.status ===
                            "DIBERIKAN" &&
                            item.diberikan_oleh_nama && (
                              <small className="admin-pemberi">
                                Oleh:
                                {" "}
                                {
                                  item.diberikan_oleh_nama
                                }

                                {item.diberikan_at && (
                                  <>
                                    <br />
                                    {
                                      formatTanggalWaktu(
                                        item.diberikan_at
                                      )
                                    }
                                  </>
                                )}
                              </small>
                            )}
                        </td>

                        {/* PROSES ADMIN */}

                        {isAdminNomor && (
                          <td>
                            {item.status ===
                            "MENUNGGU" ? (
                              <div className="proses-box">

                                <label>
                                  No. Urut Register
                                </label>

                              <input
  type="number"
  min="1"
  placeholder="Nomor register"
  value={
    noUrut[item.id] || ""
  }
  onChange={(e) =>
    setNoUrut((prev) => ({
      ...prev,
      [item.id]:
        e.target.value,
    }))
  }
/>

<small>
  {loadingNoUrut[item.id]
    ? "Memeriksa nomor register terakhir..."
    : noUrut[item.id]
      ? `Saran nomor berikutnya: ${noUrut[item.id]}. Silakan sesuaikan dengan register resmi jika diperlukan.`
      : "Masukkan nomor yang benar-benar diambil dari register resmi."}
</small>
                                <label>
                                  Catatan
                                </label>

                                <textarea
                                  rows={2}
                                  placeholder="Opsional"
                                  value={
                                    catatan[
                                      item.id
                                    ] || ""
                                  }
                                  onChange={(
                                    e
                                  ) =>
                                    setCatatan(
                                      (
                                        prev
                                      ) => ({
                                        ...prev,
                                        [item.id]:
                                          e
                                            .target
                                            .value,
                                      })
                                    )
                                  }
                                />

                                <button
                                  type="button"
                                  className="tombol-berikan"
                                  disabled={
                                    processingId ===
                                    item.id
                                  }
                                  onClick={() =>
                                    berikanNomor(
                                      item
                                    )
                                  }
                                >
                                  <CheckCircle2
                                    size={15}
                                  />

                                  {processingId ===
                                  item.id
                                    ? "Memproses..."
                                    : "Berikan Nomor"}
                                </button>

                                <button
                                  type="button"
                                  className="tombol-tolak"
                                  disabled={
                                    processingId ===
                                    item.id
                                  }
                                  onClick={() =>
                                    tolakPermintaan(
                                      item
                                    )
                                  }
                                >
                                  <XCircle
                                    size={15}
                                  />
                                  Tolak
                                </button>
                              </div>
                            ) : (
                              <span className="selesai">
                                <CheckCircle2
                                  size={15}
                                />
                                Sudah diproses
                              </span>
                            )}
                          </td>
                        )}
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .halaman {
          min-height: 100vh;
          padding: 28px;
          background: #f1f5f9;
        }

        .container {
          max-width: 1600px;
          margin: 0 auto;
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .judul-wrapper {
          display: flex;
          align-items: center;
          gap: 13px;
        }

        .icon-judul {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #2563eb;
          color: white;
          box-shadow: 0 8px 20px
            rgba(37, 99, 235, 0.25);
        }

        h1 {
          margin: 0;
          font-size: 25px;
          color: #0f172a;
        }

        .header p {
          margin: 4px 0 0;
          color: #64748b;
          font-size: 13px;
        }

        .tombol-refresh,
        .tombol-tambah,
        .tombol-kirim,
        .tombol-batal,
        .tombol-berikan,
        .tombol-tolak {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          border-radius: 10px;
          cursor: pointer;
          font-weight: 700;
        }

        .tombol-refresh {
          padding: 10px 14px;
          background: white;
          color: #334155;
          border: 1px solid #e2e8f0;
        }

        .kartu-user {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 15px 18px;
          margin-bottom: 18px;
          border-radius: 14px;
          background: white;
          border: 1px solid #e2e8f0;
        }

        .kartu-user strong {
          display: block;
          color: #0f172a;
        }

        .kartu-user span {
          display: block;
          margin-top: 3px;
          color: #64748b;
          font-size: 12px;
        }

        .user-kanan {
          text-align: right;
        }

        .user-kanan small {
          display: block;
          color: #94a3b8;
          font-size: 10px;
        }

        .user-kanan strong {
          font-size: 13px;
        }

        .admin-info {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 17px;
          margin-bottom: 18px;
          background: #eff6ff;
          color: #1e40af;
          border: 1px solid #bfdbfe;
          border-radius: 12px;
        }

        .admin-info strong,
        .admin-info span {
          display: block;
        }

        .admin-info strong {
          font-size: 13px;
        }

        .admin-info span {
          margin-top: 3px;
          color: #475569;
          font-size: 11px;
        }

        .error-box,
        .success-box {
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 13px 15px;
          margin-bottom: 18px;
          border-radius: 11px;
          font-size: 13px;
        }

        .error-box {
          background: #fef2f2;
          color: #b91c1c;
          border: 1px solid #fecaca;
        }

        .success-box {
          background: #ecfdf5;
          color: #047857;
          border: 1px solid #a7f3d0;
        }

        .error-box span,
        .success-box span {
          flex: 1;
        }

        .error-box button,
        .success-box button {
          border: none;
          background: transparent;
          cursor: pointer;
          font-size: 20px;
          color: inherit;
        }

        .aksi {
          margin-bottom: 18px;
        }

        .tombol-tambah {
          padding: 12px 17px;
          background: #2563eb;
          color: white;
          border: none;
          box-shadow: 0 7px 18px
            rgba(37, 99, 235, 0.22);
        }

        .kartu-form,
        .kartu-daftar {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          overflow: hidden;
          margin-bottom: 20px;
        }

        .form-header,
        .daftar-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 18px 20px;
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
        }

        .form-header h2,
        .daftar-header h2 {
          margin: 0;
          font-size: 17px;
          color: #0f172a;
        }

        .form-header p,
        .daftar-header p {
          margin: 5px 0 0;
          color: #64748b;
          font-size: 12px;
        }

        .grid-form {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 17px;
          padding: 20px;
        }

        .field {
          display: flex;
          flex-direction: column;
          gap: 7px;
        }

        .field.full {
          grid-column: 1 / -1;
        }

        .field label {
          font-size: 12px;
          font-weight: 700;
          color: #334155;
        }

        .field label span {
          color: #dc2626;
          margin-left: 3px;
        }

        .field input,
        .field select,
        .field textarea {
          width: 100%;
          box-sizing: border-box;
          border: 1px solid #cbd5e1;
          border-radius: 9px;
          padding: 11px 12px;
          font-size: 13px;
          outline: none;
          background: white;
          color: #0f172a;
        }

        .field input:focus,
        .field select:focus,
        .field textarea:focus {
          border-color: #2563eb;
          box-shadow: 0 0 0 3px
            rgba(37, 99, 235, 0.1);
        }

        .preview-kode {
          color: #64748b;
          font-size: 11px;
        }

        .preview-kode strong {
          margin-left: 5px;
          color: #2563eb;
        }

        .form-footer {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          padding: 15px 20px;
          border-top: 1px solid #e2e8f0;
          background: #f8fafc;
        }

        .tombol-batal {
          padding: 10px 17px;
          background: white;
          color: #475569;
          border: 1px solid #cbd5e1;
        }

        .tombol-kirim {
          padding: 10px 17px;
          background: #16a34a;
          color: white;
          border: none;
        }

        .jumlah {
          min-width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 999px;
          background: #dbeafe;
          color: #1d4ed8;
          font-weight: 800;
          font-size: 12px;
        }

        .tabel-wrapper {
          width: 100%;
          overflow-x: auto;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          min-width: 1250px;
        }

        th {
          padding: 12px 14px;
          text-align: left;
          background: #f8fafc;
          color: #475569;
          font-size: 11px;
          border-bottom: 1px solid #e2e8f0;
          white-space: nowrap;
        }

        td {
          padding: 13px 14px;
          border-bottom: 1px solid #f1f5f9;
          color: #334155;
          font-size: 12px;
          vertical-align: top;
        }

        tr:hover td {
          background: #f8fafc;
        }

        .pemohon strong {
          display: block;
          color: #0f172a;
        }

        .pemohon span {
          display: block;
          margin-top: 3px;
          color: #64748b;
          font-size: 10px;
        }

        .pemohon small {
          display: block;
          margin-top: 3px;
          color: #94a3b8;
          font-size: 10px;
        }

        .kode-badge {
          display: inline-block;
          padding: 5px 8px;
          border-radius: 7px;
          background: #eff6ff;
          color: #1d4ed8;
          font-size: 10px;
          font-weight: 800;
          white-space: nowrap;
        }

        .sifat-badge {
          display: inline-block;
          padding: 5px 8px;
          border-radius: 7px;
          background: #f1f5f9;
          color: #475569;
          font-size: 9px;
          font-weight: 800;
          white-space: nowrap;
        }

        .perihal {
          display: block;
          max-width: 300px;
          line-height: 1.45;
        }

        .reg {
          display: block;
          margin-top: 5px;
          color: #94a3b8;
          font-size: 10px;
        }

        .nomor-jadi {
          display: inline-block;
          padding: 7px 9px;
          border-radius: 7px;
          background: #ecfdf5;
          color: #047857;
          font-weight: 800;
          white-space: nowrap;
        }

        .belum-nomor {
          color: #94a3b8;
          font-style: italic;
          white-space: nowrap;
        }

        .status {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 5px 8px;
          border-radius: 999px;
          font-size: 10px;
          font-weight: 800;
          white-space: nowrap;
        }

        .status.menunggu {
          background: #fef3c7;
          color: #92400e;
        }

        .status.diberikan {
          background: #dcfce7;
          color: #166534;
        }

        .status.ditolak {
          background: #fee2e2;
          color: #991b1b;
        }

        .catatan,
        .admin-pemberi {
          display: block;
          margin-top: 6px;
          max-width: 180px;
          font-size: 10px;
        }

        .catatan {
          color: #b91c1c;
        }

        .admin-pemberi {
          color: #64748b;
        }

        .proses-box {
          width: 230px;
          display: flex;
          flex-direction: column;
          gap: 7px;
        }

        .proses-box label {
          color: #334155;
          font-size: 10px;
          font-weight: 800;
        }

        .proses-box input,
        .proses-box textarea {
          box-sizing: border-box;
          width: 100%;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          padding: 9px 10px;
          font-size: 12px;
          outline: none;
          resize: vertical;
        }

        .proses-box input:focus,
        .proses-box textarea:focus {
          border-color: #2563eb;
          box-shadow: 0 0 0 3px
            rgba(37, 99, 235, 0.1);
        }

        .proses-box small {
          color: #94a3b8;
          font-size: 9px;
          line-height: 1.35;
        }

        .tombol-berikan,
        .tombol-tolak {
          border: none;
          padding: 9px 10px;
          color: white;
          font-size: 11px;
        }

        .tombol-berikan {
          background: #16a34a;
        }

        .tombol-tolak {
          background: #dc2626;
        }

        .tombol-berikan:disabled,
        .tombol-tolak:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .selesai {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          color: #64748b;
          font-size: 10px;
          font-weight: 700;
        }

        .kosong,
        .loading {
          min-height: 180px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          color: #94a3b8;
          font-size: 12px;
        }

        .kosong strong {
          color: #64748b;
        }

        @media (max-width: 768px) {
          .halaman {
            padding: 18px 12px;
            padding-top: 82px;
          }

          .header {
            align-items: flex-start;
            gap: 10px;
          }

          .header h1 {
            font-size: 20px;
          }

          .tombol-refresh {
            padding: 9px;
            font-size: 0;
          }

          .grid-form {
            grid-template-columns: 1fr;
          }

          .field.full {
            grid-column: auto;
          }

          .kartu-user {
            align-items: flex-start;
            gap: 10px;
          }

          .user-kanan {
            text-align: right;
          }

          .admin-info {
            align-items: flex-start;
          }
        }
      `}</style>
    </div>
  );
}