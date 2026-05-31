"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "../components/Sidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  useEffect(() => {
    const login = localStorage.getItem("login");

    if (login !== "true") {
      router.push("/login");
    }
  }, []);

  return (
    <div style={{ display: "flex" }}>
      <Sidebar />

      <main style={{ flex: 1 }}>
        {children}
      </main>
    </div>
  );
}