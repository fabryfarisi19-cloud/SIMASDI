import type { ReactNode } from "react";
import SidebarSIAP from "@/app/components/SidebarSIAP";

export default function SiantarLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-100">

      <SidebarSIAP />

    <main className="md:ml-72 min-h-screen p-4 md:p-8">
        {children}
      </main>

    </div>
  );
}