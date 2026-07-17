"use client";

import type { ReactNode } from "react";
import SidebarSIMSTOK from "@/app/components/SidebarSIMSTOK";

export default function SIMSTOKLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-100 md:flex">
      <SidebarSIMSTOK />

  <main className="flex-1 w-full ml-0 pt-20 px-3 pb-3 md:ml-[270px] md:pt-8 md:p-8 overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}