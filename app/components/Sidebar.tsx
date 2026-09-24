"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import {
  LayoutDashboard,
  Inbox,
  Send,
  FileText,
  Archive,
  Users,
  CalendarDays,
  CalendarRange,
  LogOut,
  Menu,
  X,
  Megaphone,
  Volume2,
  Wallet,
  FileSpreadsheet,
  KeyRound,
  FolderArchive,
  Award,
  Car,
  Ticket,
  Boxes,
  Bell,
  CheckCircle2,
  XCircle,
  Info,
} from "lucide-react";

import { signOut, useSession } from "next-auth/react";

type MenuItem = {
  nama: string;
  href: string;
  icon: any;
  roles?: string[];
};

type Notifikasi = {
  id: string;
  nip_penerima: string;
  judul: string;
  pesan: string;
  tipe: string;
  dibaca: boolean;
  referensi_id?: string | null;
  referensi_kode?: string | null;
  created_at: string;
};

const menu: MenuItem[] = [
  {
    nama: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: [
      "Admin Umum",
      "Kaur Umum",
      "Admin",
      "Kabapas",
      "Petugas",
      "Kasubag TU",
    ],
  },

  {
    nama: "Surat Masuk",
    href: "/surat-masuk",
    icon: Inbox,
    roles: [
      "Admin Umum",
      "Kaur Umum",
      "Admin",
      "Kabapas",
      "Kasubag TU",
    ],
  },

  {
    nama: "Surat Keluar",
    href: "/surat-keluar",
    icon: Send,
    roles: [
      "Admin Umum",
      "Kaur Umum",
      "Admin",
      "Kabapas",
      "Kasubag TU",
    ],
  },

  {
    nama: "Disposisi",
    href: "/disposisi",
    icon: FileText,
    roles: [
      "Admin Umum",
      "Kaur Umum",
      "Admin",
      "Kabapas",
      "Kasubag TU",
    ],
  },

  {
    nama: "Arsip Digital",
    href: "/arsip",
    icon: Archive,
    roles: [
      "Admin Umum",
      "Kaur Umum",
      "Admin",
      "Kabapas",
      "Kasubag TU",
    ],
  },

  {
    nama: "SIMSTOK BMN",
    href: "/simstok/dashboard",
    icon: Boxes,
    roles: [
      "Admin Umum",
      "Kaur Umum",
      "Admin",
      "Kabapas",
      "Kasubag TU",
    ],
  },

  {
    nama: "Pinjam Mobil Dinas",
    href: "/pinjam-mobil",
    icon: Car,
    roles: [
      "Pegawai",
      "Kaur Kepegawaian",
      "Admin Kepegawaian",
      "Pengelola Kepegawaian",
      "Kaur Keuangan",
      "Kasubag TU",
      "Kasi BKA",
      "Kasi BKD",
      "Kasubsi Bimker Anak",
      "Kasubsi Bimker Dewasa",
      "Kasubsi Registrasi Dewasa",
      "Kasubsi Bimkemas Anak",
      "Kasubsi Bimkemas Dewasa",
      "Kasubsi Registrasi Anak",
      "Kaur Umum",
      "Admin Keuangan",
      "Staf",
      "PK Madya",
      "PK Muda",
      "PK Pertama",
      "APK",
      "Arsiparis",
    ],
  },

  {
    nama: "SIAP",
    href: "/siantar",
    icon: Ticket,
    roles: [
      "Kaur Umum",
      "Kabapas",
      "Kasubag TU",
      "Petugas",
    ],
  },

  {
    nama: "Jadwal Petugas Apel",
    href: "/jadwal-apel",
    icon: CalendarDays,
    roles: [
      "Kaur Umum",
      "Kabapas",
      "Kasubag TU",
      "Petugas",
    ],
  },

  {
    nama: "Manajemen Jadwal",
    href: "/manajemen-jadwal",
    icon: CalendarRange,
    roles: ["Admin"],
  },

  {
    nama: "TV Apel",
    href: "/tv-apel",
    icon: Volume2,
    roles: [
      "Kaur Umum",
      "Kabapas",
      "Kasubag TU",
      "Petugas",
    ],
  },

  {
    nama: "Pengguna",
    href: "/pengguna",
    icon: Users,
    roles: ["Admin", "Kaur Umum"],
  },

  {
    nama: "Arsip Kepegawaian",
    href: "/arsip-kepegawaian",
    icon: FolderArchive,
    roles: [
      "Pegawai",
      "Kaur Kepegawaian",
      "Admin Kepegawaian",
      "Pengelola Kepegawaian",
      "Kabapas",
      "Kaur Keuangan",
      "Kasubag TU",
      "Kasi BKA",
      "Kasi BKD",
      "Kasubsi Bimker Anak",
      "Kasubsi Bimker Dewasa",
      "Kasubsi Registrasi Dewasa",
      "Kasubsi Bimkemas Anak",
      "Kasubsi Bimkemas Dewasa",
      "Kasubsi Registrasi Anak",
      "Kaur Umum",
      "Admin Keuangan",
      "Staf",
      "PK Madya",
      "PK Muda",
      "PK Pertama",
      "APK",
      "Arsiparis",
      "PPNPN",
    ],
  },

  {
    nama: "Pegawai Teladan",
    href: "/pegawai-teladan",
    icon: Award,
    roles: [
      "Kabapas",
      "Kasubag TU",
      "Kaur Umum",
      "Kaur Keuangan",
      "Kaur Kepegawaian",
      "Kasi BKA",
      "Kasi BKD",
      "Kasubsi Bimker Anak",
      "Kasubsi Bimker Dewasa",
      "Kasubsi Registrasi Dewasa",
      "Kasubsi Bimkemas Anak",
      "Kasubsi Bimkemas Dewasa",
      "Kasubsi Registrasi Anak",
      "Pengelola Kepegawaian",
    ],
  },

  {
    nama: "Publikasi",
    href: "/publikasi",
    icon: Megaphone,
    roles: [
      "Admin",
      "Admin Umum",
      "Kabapas",
      "Kaur Keuangan",
      "Kasubag TU",
      "Kasi BKA",
      "Kasi BKD",
      "Kasubsi Bimker Anak",
      "Kasubsi Bimker Dewasa",
      "Kasubsi Registrasi Dewasa",
      "Kasubsi Bimkemas Anak",
      "Kasubsi Bimkemas Dewasa",
      "Kasubsi Registrasi Anak",
      "Kaur Kepegawaian",
      "Kaur Umum",
      "Admin Keuangan",
      "Staf",
      "Pegawai",
      "PK Madya",
      "PK Muda",
      "PK Pertama",
      "APK",
      "Arsiparis",
      "Pengelola Kepegawaian",
      "PPNPN",
    ],
  },

  {
    nama: "Agenda Kegiatan",
    href: "/agenda",
    icon: CalendarDays,
    roles: [
      "Admin Umum",
      "Admin",
      "Kaur Umum",
      "Kabapas",
      "Kasubag TU",
    ],
  },

  {
    nama: "Rincian Gaji",
    href: "/rincian-gaji",
    icon: Wallet,
    roles: [
      "Kabapas",
      "Kaur Keuangan",
      "Kasubag TU",
      "Kasi BKA",
      "Kasi BKD",
      "Kasubsi Bimker Anak",
      "Kasubsi Bimker Dewasa",
      "Kasubsi Registrasi Dewasa",
      "Kasubsi Bimkemas Anak",
      "Kasubsi Bimkemas Dewasa",
      "Kasubsi Registrasi Anak",
      "Kaur Kepegawaian",
      "Kaur Umum",
      "Admin Umum",
      "Admin Keuangan",
      "Staf",
      "Pegawai",
      "PK Madya",
      "PK Muda",
      "PK Pertama",
      "APK",
      "Arsiparis",
      "Pengelola Kepegawaian",
      "PPNPN",
    ],
  },

  {
    nama: "Rubah Password",
    href: "/rubah-password",
    icon: KeyRound,
    roles: [
      "Kabapas",
      "Kaur Keuangan",
      "Kasubag TU",
      "Kasi BKA",
      "Kasi BKD",
      "Kasubsi Bimker Anak",
      "Kasubsi Bimker Dewasa",
      "Kasubsi Registrasi Dewasa",
      "Kasubsi Bimkemas Anak",
      "Kasubsi Bimkemas Dewasa",
      "Kasubsi Registrasi Anak",
      "Kaur Kepegawaian",
      "Kaur Umum",
      "Admin Umum",
      "Staf",
      "Pegawai",
      "Admin Keuangan",
      "PK Madya",
      "PK Muda",
      "PK Pertama",
      "APK",
      "Arsiparis",
      "Admin",
      "Pengelola Kepegawaian",
      "PPNPN",
    ],
  },

  {
    nama: "Import Slip Gaji",
    href: "/import-gaji",
    icon: FileSpreadsheet,
    roles: [
      "Admin Keuangan",
      "Kaur Keuangan",
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const { data: session } = useSession();

  const roleRaw =
    (session as any)?.role ||
    (session as any)?.user?.role ||
    (session as any)?.user?.jabatan ||
    "";

  const role = String(roleRaw).trim();

  const username =
    (session as any)?.username ||
    (session as any)?.user?.username ||
    "";

  const [bukaMenu, setBukaMenu] = useState(false);
  const [nama, setNama] = useState("Pengguna");
  const [jabatan, setJabatan] = useState("");

  /* =========================================================
     STATE NOTIFIKASI
     ========================================================= */

  const [notifikasi, setNotifikasi] = useState<Notifikasi[]>([]);
  const [bukaNotifikasi, setBukaNotifikasi] = useState(false);
  const [loadingNotifikasi, setLoadingNotifikasi] =
    useState(false);

  /* =========================================================
     FILTER MENU
     ========================================================= */

  const menuTerfilter = menu.filter((item) => {
    if (!item.roles) {
      return true;
    }

    if (!item.roles.includes(role)) {
      return false;
    }

    if (item.href === "/import-gaji") {
      return username === "199408232017121004";
    }

    return true;
  });

  console.log("SIDEBAR SESSION =", session);
  console.log("SIDEBAR ROLE =", role);
  console.log("SIDEBAR USERNAME =", username);

  console.log(
    "MENU TERFILTER =",
    menuTerfilter.map((item) => item.nama)
  );

  /* =========================================================
     LOAD USER LOCAL STORAGE
     ========================================================= */

  useEffect(() => {
    const user = localStorage.getItem("user");

    console.log("USER =", user);

    if (user) {
      try {
        const u = JSON.parse(user);

        setNama(u.nama || "Pengguna");
        setJabatan(u.jabatan || "");
      } catch (error) {
        console.error(
          "Gagal membaca data user:",
          error
        );
      }
    }
  }, []);

  /* =========================================================
     LOAD NOTIFIKASI
     ========================================================= */

  const loadNotifikasi = async () => {
    try {
      setLoadingNotifikasi(true);

      const response = await fetch(
        "/api/notifikasi",
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        console.error(
          "GAGAL LOAD NOTIFIKASI:",
          result
        );

        return;
      }

      setNotifikasi(result.data || []);
    } catch (error) {
      console.error(
        "ERROR LOAD NOTIFIKASI:",
        error
      );
    } finally {
      setLoadingNotifikasi(false);
    }
  };

  /* =========================================================
     LOAD NOTIFIKASI SAAT LOGIN
     + REFRESH SETIAP 30 DETIK
     ========================================================= */

  useEffect(() => {
    if (!session?.user) {
      return;
    }

    loadNotifikasi();

    const interval = setInterval(() => {
      loadNotifikasi();
    }, 30000);

    return () => {
      clearInterval(interval);
    };
  }, [session]);

  /* =========================================================
     JUMLAH BELUM DIBACA
     ========================================================= */

  const jumlahBelumDibaca =
    notifikasi.filter(
      (item) => !item.dibaca
    ).length;

  /* =========================================================
     FORMAT WAKTU
     ========================================================= */

  const formatWaktu = (
    tanggal: string
  ) => {
    try {
      const waktu = new Date(tanggal);

      const sekarang = new Date();

      const selisih =
        sekarang.getTime() -
        waktu.getTime();

      const menit = Math.floor(
        selisih / 60000
      );

      if (menit < 1) {
        return "Baru saja";
      }

      if (menit < 60) {
        return `${menit} menit yang lalu`;
      }

      const jam = Math.floor(
        menit / 60
      );

      if (jam < 24) {
        return `${jam} jam yang lalu`;
      }

      const hari = Math.floor(
        jam / 24
      );

      if (hari < 7) {
        return `${hari} hari yang lalu`;
      }

      return waktu.toLocaleDateString(
        "id-ID",
        {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }
      );
    } catch {
      return "";
    }
  };

  /* =========================================================
     ICON NOTIFIKASI
     ========================================================= */

  const getIconNotifikasi = (
    tipe: string
  ) => {
    if (tipe === "success") {
      return (
        <CheckCircle2
          size={20}
          className="notif-icon-success"
        />
      );
    }

    if (
      tipe === "error" ||
      tipe === "danger"
    ) {
      return (
        <XCircle
          size={20}
          className="notif-icon-error"
        />
      );
    }

    return (
      <Info
        size={20}
        className="notif-icon-info"
      />
    );
  };

  /* =========================================================
     BACA SATU NOTIFIKASI
     ========================================================= */

  const bacaNotifikasi = async (
    item: Notifikasi
  ) => {
    try {
      if (!item.dibaca) {
        await fetch(
          "/api/notifikasi",
          {
            method: "PATCH",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              id: item.id,
            }),
          }
        );
      }

      setNotifikasi((prev) =>
        prev.map((n) =>
          n.id === item.id
            ? {
                ...n,
                dibaca: true,
              }
            : n
        )
      );

      /*
       * Jika notifikasi berasal dari
       * Pinjam Mobil Dinas, buka halaman
       * Pinjam Mobil Dinas.
       */
      if (
        item.referensi_id &&
        item.referensi_kode
      ) {
        router.push(
          "/pinjam-mobil"
        );
      }

      setBukaNotifikasi(false);
    } catch (error) {
      console.error(
        "ERROR BACA NOTIFIKASI:",
        error
      );
    }
  };

  /* =========================================================
     BACA SEMUA
     ========================================================= */

  const bacaSemuaNotifikasi =
    async () => {
      try {
        const response =
          await fetch(
            "/api/notifikasi",
            {
              method: "PATCH",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body: JSON.stringify({
                semua: true,
              }),
            }
          );

        const result =
          await response.json();

        if (
          !response.ok ||
          !result.success
        ) {
          console.error(
            "GAGAL BACA SEMUA:",
            result
          );

          return;
        }

        setNotifikasi((prev) =>
          prev.map((item) => ({
            ...item,
            dibaca: true,
          }))
        );
      } catch (error) {
        console.error(
          "ERROR BACA SEMUA:",
          error
        );
      }
    };

  /* =========================================================
     LOGOUT
     ========================================================= */

  const logout = async () => {
    localStorage.removeItem("login");
    localStorage.removeItem("user");
    localStorage.removeItem("nama");
    localStorage.removeItem("role");
    localStorage.removeItem("username");

    await signOut({
      redirect: false,
    });

    router.replace("/login");
  };

  return (
    <>
      {/* =====================================================
          HEADER KHUSUS HP
          ===================================================== */}

      <header
        className={`header-mobile ${
          bukaMenu ? "hidden" : ""
        }`}
      >
        <div className="header-brand">
          <Image
            src="/logosimasdi2.png"
            alt="SIMASDI"
            width={120}
            height={35}
          />
        </div>

        <div className="header-actions-mobile">
          {/* NOTIFIKASI HP */}

          <button
            type="button"
            className="tombol-notifikasi-mobile"
            onClick={() =>
              setBukaNotifikasi(
                !bukaNotifikasi
              )
            }
            aria-label="Notifikasi"
          >
            <Bell size={23} />

            {jumlahBelumDibaca > 0 && (
              <span className="badge-notifikasi-mobile">
                {jumlahBelumDibaca > 99
                  ? "99+"
                  : jumlahBelumDibaca}
              </span>
            )}
          </button>

          <button
            onClick={() =>
              setBukaMenu(true)
            }
            className="tombol-hamburger"
            aria-label="Buka Menu"
          >
            <Menu size={26} />
          </button>
        </div>
      </header>

      {/* =====================================================
          PANEL NOTIFIKASI HP
          ===================================================== */}

      {bukaNotifikasi && (
        <div className="panel-notifikasi panel-notifikasi-mobile">
          <div className="notifikasi-header">
            <div>
              <h3>Notifikasi</h3>

              {jumlahBelumDibaca > 0 && (
                <span>
                  {jumlahBelumDibaca} belum dibaca
                </span>
              )}
            </div>

            {jumlahBelumDibaca > 0 && (
              <button
                type="button"
                onClick={
                  bacaSemuaNotifikasi
                }
              >
                Tandai semua
              </button>
            )}
          </div>

          <div className="notifikasi-list">
            {loadingNotifikasi &&
            notifikasi.length === 0 ? (
              <div className="notifikasi-kosong">
                Memuat notifikasi...
              </div>
            ) : notifikasi.length === 0 ? (
              <div className="notifikasi-kosong">
                <Bell size={28} />
                <p>
                  Belum ada notifikasi
                </p>
              </div>
            ) : (
              notifikasi.map(
                (item) => (
                  <button
                    type="button"
                    key={item.id}
                    className={`notifikasi-item ${
                      !item.dibaca
                        ? "belum-dibaca"
                        : ""
                    }`}
                    onClick={() =>
                      bacaNotifikasi(
                        item
                      )
                    }
                  >
                    <div className="notifikasi-icon">
                      {getIconNotifikasi(
                        item.tipe
                      )}
                    </div>

                    <div className="notifikasi-content">
                      <strong>
                        {item.judul}
                      </strong>

                      <p>
                        {item.pesan}
                      </p>

                      <small>
                        {formatWaktu(
                          item.created_at
                        )}
                      </small>
                    </div>

                    {!item.dibaca && (
                      <span className="titik-belum-dibaca" />
                    )}
                  </button>
                )
              )
            )}
          </div>
        </div>
      )}

      {/* =====================================================
          OVERLAY MOBILE
          ===================================================== */}

      {bukaMenu && (
        <div
          className="overlay-mobile"
          onClick={() =>
            setBukaMenu(false)
          }
        />
      )}

      {/* =====================================================
          SIDEBAR
          ===================================================== */}

      <aside
        className={`sidebar ${
          bukaMenu ? "buka" : ""
        }`}
        onClick={(e) =>
          e.stopPropagation()
        }
      >
        <div className="sidebar-judul">
          <div className="sidebar-brand">
            <Image
              src="/logosimasdi1.png"
              alt="SIMASDI"
              width={170}
              height={170}
              priority
              className="sidebar-logo"
            />

            <div className="sidebar-user">
              <h3>{nama}</h3>

              <p>{jabatan}</p>

              <span className="status-online">
                ● Online
              </span>
            </div>
          </div>

          <button
            onClick={() =>
              setBukaMenu(false)
            }
            className="tombol-tutup"
            aria-label="Tutup menu"
          >
            <X size={26} />
          </button>
        </div>

        {/* ===================================================
            NOTIFIKASI SIDEBAR
            =================================================== */}

        <div className="sidebar-notifikasi-wrapper">
          <button
            type="button"
            className={`sidebar-notifikasi ${
              bukaNotifikasi
                ? "notifikasi-aktif"
                : ""
            }`}
            onClick={() =>
              setBukaNotifikasi(
                !bukaNotifikasi
              )
            }
          >
            <div className="sidebar-notifikasi-icon">
              <Bell size={20} />

              {jumlahBelumDibaca > 0 && (
                <span className="badge-notifikasi">
                  {jumlahBelumDibaca > 99
                    ? "99+"
                    : jumlahBelumDibaca}
                </span>
              )}
            </div>

            <div className="sidebar-notifikasi-text">
              <strong>
                Notifikasi
              </strong>

              <span>
                {jumlahBelumDibaca > 0
                  ? `${jumlahBelumDibaca} belum dibaca`
                  : "Tidak ada notifikasi baru"}
              </span>
            </div>
          </button>

          {/* =================================================
              PANEL NOTIFIKASI DESKTOP
              ================================================= */}

          {bukaNotifikasi && (
            <div className="panel-notifikasi">
              <div className="notifikasi-header">
                <div>
                  <h3>Notifikasi</h3>

                  {jumlahBelumDibaca >
                    0 && (
                    <span>
                      {
                        jumlahBelumDibaca
                      }{" "}
                      belum dibaca
                    </span>
                  )}
                </div>

                {jumlahBelumDibaca >
                  0 && (
                  <button
                    type="button"
                    onClick={
                      bacaSemuaNotifikasi
                    }
                  >
                    Tandai semua
                  </button>
                )}
              </div>

              <div className="notifikasi-list">
                {loadingNotifikasi &&
                notifikasi.length ===
                  0 ? (
                  <div className="notifikasi-kosong">
                    Memuat notifikasi...
                  </div>
                ) : notifikasi.length ===
                  0 ? (
                  <div className="notifikasi-kosong">
                    <Bell size={28} />

                    <p>
                      Belum ada notifikasi
                    </p>
                  </div>
                ) : (
                  notifikasi.map(
                    (item) => (
                      <button
                        type="button"
                        key={item.id}
                        className={`notifikasi-item ${
                          !item.dibaca
                            ? "belum-dibaca"
                            : ""
                        }`}
                        onClick={() =>
                          bacaNotifikasi(
                            item
                          )
                        }
                      >
                        <div className="notifikasi-icon">
                          {getIconNotifikasi(
                            item.tipe
                          )}
                        </div>

                        <div className="notifikasi-content">
                          <strong>
                            {
                              item.judul
                            }
                          </strong>

                          <p>
                            {item.pesan}
                          </p>

                          <small>
                            {formatWaktu(
                              item.created_at
                            )}
                          </small>
                        </div>

                        {!item.dibaca && (
                          <span className="titik-belum-dibaca" />
                        )}
                      </button>
                    )
                  )
                )}
              </div>
            </div>
          )}
        </div>

        {/* ===================================================
            MENU
            =================================================== */}

        <nav className="sidebar-menu">
          {menuTerfilter.map(
            (item) => {
              const Icon = item.icon;

              const aktif =
                pathname ===
                  item.href ||
                (item.href !==
                  "/dashboard" &&
                  pathname.startsWith(
                    item.href
                  ));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => {
                    setBukaMenu(
                      false
                    );

                    setBukaNotifikasi(
                      false
                    );
                  }}
                  className={`menu-link ${
                    aktif
                      ? "aktif"
                      : ""
                  }`}
                >
                  <Icon size={19} />

                  <span>
                    {item.nama}
                  </span>
                </Link>
              );
            }
          )}
        </nav>

        {/* ===================================================
            LOGOUT
            =================================================== */}

        <button
          onClick={logout}
          className="tombol-logout"
        >
          <LogOut size={19} />
          Logout
        </button>

        <div className="versi-app">
          SIMASDI v1.0.0
          <br />
          Bapas Kelas I Jakarta Barat
        </div>
      </aside>

      {/* =====================================================
          STYLE
          ===================================================== */}

      <style jsx global>{`
        .header-mobile {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 64px;

          background: linear-gradient(
            90deg,
            #0b2e78,
            #2563eb
          );

          padding: 0 16px;

          align-items: center;
          justify-content: space-between;

          z-index: 9999;

          box-shadow:
            0 3px 15px
              rgba(0, 0, 0, 0.18);
        }

        .header-mobile.hidden {
          display: none !important;
        }

        .header-actions-mobile {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .tombol-notifikasi-mobile {
          position: relative;

          width: 42px;
          height: 42px;

          border: none;
          background: transparent;

          color: white;

          cursor: pointer;

          display: flex;
          align-items: center;
          justify-content: center;

          border-radius: 50%;
        }

        .tombol-notifikasi-mobile:hover {
          background: rgba(
            255,
            255,
            255,
            0.12
          );
        }

        .badge-notifikasi-mobile {
          position: absolute;

          top: 2px;
          right: 1px;

          min-width: 18px;
          height: 18px;

          padding: 0 5px;

          display: flex;
          align-items: center;
          justify-content: center;

          background: #ef4444;
          color: white;

          border-radius: 999px;

          font-size: 9px;
          font-weight: 800;

          border: 2px solid
            #0b2e78;
        }

        .versi-app {
          margin-top: 12px;
          padding-top: 12px;

          border-top: 1px solid
            rgba(255, 255, 255, 0.1);

          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;

          text-align: center;

          color: #cbd5e1;

          font-size: 10px;

          line-height: 1.5;

          letter-spacing: 0.3px;
        }

        .sidebar {
          width: 230px;
          height: 100vh;

          background: linear-gradient(
            180deg,
            #061a48 0%,
            #0b2e78 60%,
            #103b9e 100%
          );

          position: fixed;
          left: 0;
          top: 0;

          z-index: 9999;

          display: flex;
          flex-direction: column;

          overflow-y: auto;
          overflow-x: visible;
        }

        .sidebar::-webkit-scrollbar {
          width: 6px;
        }

        .sidebar::-webkit-scrollbar-track {
          background: transparent;
        }

        .sidebar::-webkit-scrollbar-thumb {
          background: rgba(
            255,
            255,
            255,
            0.3
          );

          border-radius: 999px;
        }

        .sidebar::-webkit-scrollbar-thumb:hover {
          background: rgba(
            255,
            255,
            255,
            0.55
          );
        }

        .sidebar-judul {
          position: relative;

          display: flex;
          justify-content: space-between;
          align-items: center;

          padding: 14px 16px 12px;

          margin-bottom: 10px;

          border-bottom: 1px solid
            rgba(255, 255, 255, 0.15);
        }

        .sidebar-menu {
          flex: 1;

          display: flex;
          flex-direction: column;

          gap: 3px;

          overflow-y: auto;
          overflow-x: hidden;

          min-height: 0;

          padding-right: 4px;
          padding-bottom: 20px;
        }

        .menu-link {
          position: relative;
          overflow: hidden;

          display: flex;
          align-items: center;

          gap: 12px;

          padding: 13px 14px;

          border-radius: 14px;

          color: white;

          text-decoration: none;

          font-size: 15px;

          font-weight: 600;

          transition: 0.25s;
        }

        .menu-link:hover {
          background: rgba(
            255,
            255,
            255,
            0.1
          );

          transform: translateX(6px);
        }

        .menu-link:active {
          transform: scale(0.97);
        }

        .menu-link svg {
          flex-shrink: 0;
        }

        .menu-link.aktif {
          background: linear-gradient(
            90deg,
            #2563eb,
            #3b82f6
          );

          color: white;

          font-weight: 800;

          box-shadow:
            0 10px 25px
              rgba(
                37,
                99,
                235,
                0.35
              );

          transform: translateX(6px);
        }

        .menu-link.aktif::before {
          transform: scaleY(1);
        }

        /* ===================================================
           NOTIFIKASI SIDEBAR
           =================================================== */

        .sidebar-notifikasi-wrapper {
          position: relative;

          margin: 0 8px 10px;

          z-index: 100;
        }

        .sidebar-notifikasi {
          width: 100%;

          border: 1px solid
            rgba(
              255,
              255,
              255,
              0.14
            );

          border-radius: 14px;

          padding: 10px 11px;

          background: rgba(
            255,
            255,
            255,
            0.07
          );

          color: white;

          cursor: pointer;

          display: flex;
          align-items: center;

          gap: 10px;

          text-align: left;

          transition: 0.2s;
        }

        .sidebar-notifikasi:hover,
        .sidebar-notifikasi.notifikasi-aktif {
          background: rgba(
            255,
            255,
            255,
            0.14
          );

          border-color: rgba(
            255,
            255,
            255,
            0.25
          );
        }

        .sidebar-notifikasi-icon {
          position: relative;

          width: 34px;
          height: 34px;

          flex-shrink: 0;

          display: flex;
          align-items: center;
          justify-content: center;

          border-radius: 10px;

          background: rgba(
            255,
            255,
            255,
            0.12
          );
        }

        .sidebar-notifikasi-text {
          min-width: 0;

          display: flex;
          flex-direction: column;

          gap: 2px;
        }

        .sidebar-notifikasi-text strong {
          font-size: 13px;
          font-weight: 800;
        }

        .sidebar-notifikasi-text span {
          font-size: 10px;
          color: #cbd5e1;

          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .badge-notifikasi {
          position: absolute;

          top: -5px;
          right: -5px;

          min-width: 19px;
          height: 19px;

          padding: 0 5px;

          border-radius: 999px;

          display: flex;
          align-items: center;
          justify-content: center;

          background: #ef4444;

          color: white;

          font-size: 9px;
          font-weight: 900;

          border: 2px solid #061a48;

          box-shadow:
            0 2px 8px
              rgba(
                0,
                0,
                0,
                0.25
              );
        }

        /* ===================================================
           PANEL NOTIFIKASI
           =================================================== */

       .panel-notifikasi {
  position: fixed;

  left: 240px;
  top: 80px;

  width: 370px;

  background: white;

  border-radius: 16px;

  overflow: hidden;

  box-shadow:
    0 20px 50px
      rgba(
        15,
        23,
        42,
        0.28
      );

  border: 1px solid
    #e2e8f0;

  color: #0f172a;

  z-index: 100000;
}

          background: white;

          border-radius: 16px;

          overflow: hidden;

          box-shadow:
            0 20px 50px
              rgba(
                15,
                23,
                42,
                0.28
              );

          border: 1px solid
            #e2e8f0;

          color: #0f172a;
        }

        .notifikasi-header {
          display: flex;
          align-items: center;
          justify-content: space-between;

          padding: 14px 16px;

          border-bottom: 1px solid
            #e2e8f0;

          background: #f8fafc;
        }

        .notifikasi-header h3 {
          margin: 0;

          font-size: 15px;
          font-weight: 800;

          color: #0f172a;
        }

        .notifikasi-header span {
          display: block;

          margin-top: 3px;

          font-size: 10px;

          color: #64748b;
        }

        .notifikasi-header button {
          border: none;

          background: transparent;

          color: #2563eb;

          font-size: 11px;

          font-weight: 700;

          cursor: pointer;

          padding: 5px;
        }

        .notifikasi-header button:hover {
          text-decoration: underline;
        }

        .notifikasi-list {
          max-height: 430px;

          overflow-y: auto;
        }

        .notifikasi-list::-webkit-scrollbar {
          width: 5px;
        }

        .notifikasi-list::-webkit-scrollbar-thumb {
          background: #cbd5e1;

          border-radius: 999px;
        }

        .notifikasi-item {
          position: relative;

          width: 100%;

          display: flex;
          align-items: flex-start;

          gap: 11px;

          padding: 13px 14px;

          border: none;

          border-bottom: 1px solid
            #f1f5f9;

          background: white;

          color: #0f172a;

          text-align: left;

          cursor: pointer;

          transition: 0.18s;
        }

        .notifikasi-item:hover {
          background: #f8fafc;
        }

        .notifikasi-item.belum-dibaca {
          background: #eff6ff;
        }

        .notifikasi-item.belum-dibaca:hover {
          background: #dbeafe;
        }

        .notifikasi-icon {
          width: 34px;
          height: 34px;

          flex-shrink: 0;

          display: flex;
          align-items: center;
          justify-content: center;

          border-radius: 10px;

          background: #f1f5f9;
        }

        .notif-icon-success {
          color: #16a34a;
        }

        .notif-icon-error {
          color: #dc2626;
        }

        .notif-icon-info {
          color: #2563eb;
        }

        .notifikasi-content {
          flex: 1;

          min-width: 0;
        }

        .notifikasi-content strong {
          display: block;

          font-size: 12px;

          line-height: 1.35;

          color: #0f172a;

          margin-bottom: 4px;
        }

        .notifikasi-content p {
          margin: 0;

          font-size: 11px;

          line-height: 1.45;

          color: #475569;
        }

        .notifikasi-content small {
          display: block;

          margin-top: 6px;

          font-size: 9px;

          color: #94a3b8;
        }

        .titik-belum-dibaca {
          width: 8px;
          height: 8px;

          flex-shrink: 0;

          margin-top: 5px;

          border-radius: 50%;

          background: #2563eb;
        }

        .notifikasi-kosong {
          min-height: 120px;

          display: flex;
          flex-direction: column;

          align-items: center;
          justify-content: center;

          gap: 7px;

          color: #94a3b8;

          font-size: 11px;
        }

        .notifikasi-kosong p {
          margin: 0;
        }

        /* ===================================================
           LOGOUT
           =================================================== */

        .tombol-logout {
          margin-top: 20px;

          width: 100%;

          border: none;

          border-radius: 12px;

          padding: 14px;

          background: #dc2626;

          color: white;

          font-weight: 700;

          cursor: pointer;

          display: flex;
          justify-content: center;
          align-items: center;

          gap: 10px;

          flex-shrink: 0;
        }

        .tombol-logout:hover {
          background: #b91c1c;
        }

        .tombol-hamburger,
        .tombol-tutup {
          background: transparent;
          border: none;
          color: white;
          cursor: pointer;

          display: flex;
          align-items: center;
        }

        .tombol-tutup {
          display: none;

          position: absolute;

          top: 16px;
          right: 16px;

          width: 42px;
          height: 42px;

          border-radius: 50%;

          background: rgba(
            255,
            255,
            255,
            0.12
          );

          color: white;

          z-index: 10;

          align-items: center;
          justify-content: center;
        }

        .sidebar-brand {
          display: flex;
          flex-direction: column;

          align-items: center;
          justify-content: center;

          width: 100%;
        }

        .sidebar-logo {
          width: 120px;
          height: auto;

          margin: 8px auto 4px;

          display: block;
        }

        .sidebar-user {
          width: 100%;

          text-align: center;

          margin-top: 4px;
          margin-bottom: 12px;
        }

        .sidebar-user h3 {
          margin: 0;

          font-size: 15px;

          font-weight: 800;

          color: #fff;

          line-height: 1.3;

          white-space: nowrap;

          overflow: hidden;

          text-overflow: ellipsis;
        }

        .sidebar-user p {
          margin-top: 6px;

          font-size: 13px;

          color: #cbd5e1;

          text-transform: capitalize;
        }

        .sidebar-user span {
          display: inline-flex;

          align-items: center;
          justify-content: center;

          gap: 6px;

          margin-top: 10px;

          padding: 6px 14px;

          background: #14532d;

          color: #86efac;

          border-radius: 999px;

          font-size: 12px;

          font-weight: 700;
        }

        .sidebar-text {
          display: flex;
          flex-direction: column;
        }

        .sidebar-text h2 {
          margin: 0;

          font-size: 22px;

          font-weight: 800;

          color: #fff;

          line-height: 1;
        }

        .sidebar-text p {
          margin-top: 4px;

          font-size: 10px;

          color: #cbd5e1;

          line-height: 1.3;
        }

        .header-brand {
          display: flex;

          align-items: center;
          justify-content: flex-start;

          flex: 1;
        }

        .status-online {
          display: inline-block;

          margin-top: 10px;

          padding: 6px 14px;

          border-radius: 999px;

          background: #14532d;

          color: #86efac;

          font-size: 12px;

          font-weight: 700;
        }

        /* ===================================================
           MOBILE
           =================================================== */

        .panel-notifikasi-mobile {
          display: none;
        }

        @media (max-width: 768px) {
          .header-mobile {
            display: flex;

            position: fixed;

            top: 0;
            left: 0;
            right: 0;

            z-index: 9990;
          }

          .sidebar {
            transform: translateX(-100%);

            transition:
              transform 0.35s
              cubic-bezier(
                0.22,
                0.61,
                0.36,
                1
              );

            will-change: transform;
          }

          .sidebar.buka {
            transform: translateX(0);

            box-shadow:
              0 0 40px
                rgba(
                  0,
                  0,
                  0,
                  0.35
                );
          }

          .tombol-tutup {
            display: flex;
          }

          .overlay-mobile {
            display: block;

            position: fixed;

            inset: 0;

            background: rgba(
              15,
              23,
              42,
              0.45
            );

            backdrop-filter: blur(3px);

            -webkit-backdrop-filter: blur(
              3px
            );

            z-index: 9998;
          }

          /* Panel notifikasi HP */

          .panel-notifikasi-mobile {
            display: block;

            position: fixed;

            top: 64px;
            left: 10px;
            right: 10px;

            width: auto;

            z-index: 10001;

            border-radius: 16px;
          }

          .sidebar-notifikasi-wrapper {
            display: none;
          }
        }

        @media (min-width: 769px) {
          .tombol-notifikasi-mobile {
            display: none;
          }
        }
      `}</style>
    </>
  );
}