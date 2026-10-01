
"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import SidebarSIAP from "../components/SidebarSIAP";

export default function SiantarLayout({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();

  // Halaman tiket khusus untuk cetak,
  // sehingga tidak menggunakan SidebarSIAP.
  const hideSidebar = pathname === "/siantar/tiket";

  return (
    <div className="min-h-screen bg-slate-100">

      {/* Sidebar SIAP tampil di seluruh halaman SIAP,
          kecuali halaman tiket */}
      {!hideSidebar && <SidebarSIAP />}

      {/* Konten utama */}
      <main
        className={
          hideSidebar
            ? "min-h-screen"
            : "min-h-screen ml-64"
        }
      >
        {children}
      </main>

    </div>
  );
}

