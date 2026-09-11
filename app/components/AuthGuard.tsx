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
if (username === "199408232017121004") {
  const aksesRio = [
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
// Petugas tidak boleh membuka halaman Pengguna
if (pathname === "/pengguna" && role === "Petugas") {
  setAuthorized(false);
  router.replace("/dashboard");
  return;
}

// Kaur Keuangan hanya boleh membuka Publikasi, Rincian Gaji, dan Rubah Password
if (
  role === "Kaur Keuangan" &&
  !pathname.startsWith("/publikasi") &&
  !pathname.startsWith("/rincian-gaji") &&
  !pathname.startsWith("/rubah-password")
) {
  setAuthorized(false);
  router.replace("/publikasi");
  return;
}

setAuthorized(true); 


  }, [pathname, router, session, status]);

  if (status === "loading" || !authorized) {
    return null;
  }

  return <>{children}</>;
}