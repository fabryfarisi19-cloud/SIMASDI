import type { ReactNode } from "react";
import SidebarSIMSTOK from "@/app/components/SidebarSIMSTOK";

export default function SIMSTOKLayout({

  children,
}: {
  children: ReactNode;
}) {
  return (
  <div className="flex">
  <SidebarSIMSTOK />

  <main className="flex-1 ml-[270px] p-8 bg-slate-100 min-h-screen">
    {children}
  </main>
</div>
  );
}