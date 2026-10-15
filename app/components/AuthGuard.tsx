"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

export default function AuthGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const { data: session, status } = useSession();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (status === "loading") {
      return;
    }

    // Belum login
    if (!session?.user) {
      setAuthorized(false);
      router.replace("/login");
      return;
    }

    // Ambil role dari NextAuth
    const role = (session as any)?.role;
    const username = (session as any)?.username || "";

    console.log("=== AUTH GUARD ===");
    console.log("Path:", pathname);
    console.log("Role:", role);
    console.log("==================");

    // KHUSUS RIO ANDARA
    if (username === "199408232017121004") {
      const aksesRio = [
        "/dashboard",
        "/rubah-password",
        "/rincian-gaji",
        "/publikasi",
      ];

      const bolehAkses = aksesRio.some(
        (path) =>
          pathname === path ||
          pathname.startsWith(path + "/")
      );

      if (!bolehAkses) {
        setAuthorized(false);
        router.replace("/rincian-gaji");
        return;
      }
    }
// Rekap Kehadiran hanya untuk Pengelola Kepegawaian
if (
  pathname === "/rekap-kehadiran" &&
  role !== "Pengelola Kepegawaian"
) {
  setAuthorized(false);
  router.replace("/dashboard");
  return;
}
    // Petugas tidak boleh membuka halaman Pengguna
    if (
      pathname === "/pengguna" &&
      role === "Petugas"
    ) {
      setAuthorized(false);
      router.replace("/dashboard");
      return;
    }

    // Kaur Keuangan boleh membuka halaman sesuai menu yang diberikan
    if (
      role === "Kaur Keuangan" &&
      ![
        "/dashboard",
        "/publikasi",
        "/rincian-gaji",
        "/rubah-password",
        "/import-gaji",
        "/nomor-surat",
        "/pinjam-mobil",
        "/pengaduan-sarpras",
        "/arsip-kepegawaian",
        "/pegawai-teladan",
      ].some(
        (path) =>
          pathname === path ||
          pathname.startsWith(path + "/")
      )
    ) {
      setAuthorized(false);
      router.replace("/dashboard");
      return;
    }


    setAuthorized(true);
  }, [pathname, router, session, status]);

  if (status === "loading" || !authorized) {
    return null;
  }

  return <>{children}</>;
}