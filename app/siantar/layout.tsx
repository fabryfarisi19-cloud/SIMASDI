"use client";
import type { ReactNode } from "react";
import SidebarSIAP from "@/app/components/SidebarSIAP";
import { usePathname } from "next/navigation";

export default function SiantarLayout({
  children,
}: {
  children: ReactNode;
}) {

  const pathname = usePathname();

const hideSidebar =
  pathname === "/siantar/display" ||
  pathname === "/siantar/petugas" ||
  pathname === "/siantar/kiosk";
 return (
  <div className="min-h-screen bg-slate-100">

  {!hideSidebar && <SidebarSIAP />}

   <main
  className={
    hideSidebar
      ? "min-h-screen"
      : "md:ml-72 min-h-screen p-8 pt-20 md:pt-8"
  }
>
      {children}
    </main>

  </div>
);
}