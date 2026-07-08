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

const fullscreen =
  pathname === "/siantar/display";
 return (
  <div className="min-h-screen bg-slate-100">

    {!fullscreen && <SidebarSIAP />}

    <main
      className={
        fullscreen
          ? "min-h-screen"
          : "md:ml-72 min-h-screen p-8 pt-20 md:pt-8"
      }
    >
      {children}
    </main>

  </div>
);
}