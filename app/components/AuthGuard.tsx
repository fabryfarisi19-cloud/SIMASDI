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
   const user = localStorage.getItem("user");

// Jika masih mengecek session Google
if (status === "loading") return;

// Tidak ada login lokal DAN tidak ada session Google
if (!user && !session) {
  setAuthorized(false);
  router.replace("/login");
  return;
}

// Kalau login memakai Google, biarkan lanjut
if (!user && session) {
  setAuthorized(true);
  return;
}
    const data: any | null = user ? JSON.parse(user) : null;
    setAuthorized(true);
    console.log("Role:", data?.jabatan);
    console.log("Path:", pathname);
    // Display hanya boleh ke /display
    if (data?.jabatan === "Display" && pathname !== "/display") {
      router.push("/display");
      return;
    }

    // Kiosk hanya boleh ke /siantar/kiosk
    if (data?.jabatan === "Kiosk" && !pathname.startsWith("/siantar/kiosk")) {
      router.push("/siantar/kiosk");
      return;
    }

    // Petugas hanya boleh ke /siantar/petugas
  if (data?.jabatan === "Petugas" && !pathname.startsWith("/siantar/petugas")) {
  router.replace("/siantar/petugas");
  return;
}
  }, [pathname, router, session, status]);
if (!authorized) {
  return null; // atau bisa diganti spinner/loading nanti
}

return <>{children}</>;
}