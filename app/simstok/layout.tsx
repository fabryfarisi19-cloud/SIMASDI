import type { ReactNode } from "react";
import SidebarSIMSTOK from "@/app/components/SidebarSIMSTOK";

export default function SIMSTOKLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-100 flex">

      <SidebarSIMSTOK />

      <main className="flex-1 ml-72 p-8">
        {children}
      </main>

    </div>
  );
}