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

 <main className="flex-1 bg-slate-100 min-h-screen p-4 md:p-8 md:ml-[270px]">
    {children}
  </main>
</div>
  );
}