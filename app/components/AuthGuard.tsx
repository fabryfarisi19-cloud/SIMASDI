"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function AuthGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const user = localStorage.getItem("user");

    if (!user) {
      router.push("/login");
      return;
    }

    const data = JSON.parse(user);
console.log("Role:", data.jabatan);
console.log("Path:", pathname);
    // Display hanya boleh ke /display
    if (data.jabatan === "Display" && pathname !== "/display") {
      router.push("/display");
      return;
    }

    // Kiosk hanya boleh ke /siantar/kiosk
    if (
      data.jabatan === "Kiosk" &&
      !pathname.startsWith("/siantar/kiosk")
    ) {
      router.push("/siantar/kiosk");
      return;
    }

    // Petugas hanya boleh ke /siantar/petugas
    if (
      data.jabatan === "Petugas" &&
      !pathname.startsWith("/siantar/petugas")
    ) {
      router.push("/siantar/petugas");
    }
  }, [pathname, router]);

  return <>{children}</>;
}