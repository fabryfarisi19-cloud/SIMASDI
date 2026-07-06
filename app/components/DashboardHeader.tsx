"use client";

import { useEffect, useState } from "react";
import { Sun, CloudSun, MoonStar } from "lucide-react";

export default function DashboardHeader() {
  const [nama, setNama] = useState("Pengguna");

  useEffect(() => {
    const user = localStorage.getItem("user");

    if (user) {
      const u = JSON.parse(user);
      setNama(u.nama || "Pengguna");
    }
  }, []);

  const jam = new Date().getHours();

  let salam = "Selamat Malam";
  let Icon = MoonStar;

  if (jam >= 5 && jam < 11) {
    salam = "Selamat Pagi";
    Icon = Sun;
  } else if (jam >= 11 && jam < 15) {
    salam = "Selamat Siang";
    Icon = Sun;
  } else if (jam >= 15 && jam < 18) {
    salam = "Selamat Sore";
    Icon = CloudSun;
  }

  const tanggal = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div
      style={{
        background:
          "linear-gradient(135deg,#0B2E78,#1D4ED8,#2563EB)",
        borderRadius: 20,
        padding: 24,
        color: "#fff",
        marginBottom: 24,
        boxShadow: "0 10px 25px rgba(0,0,0,.15)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          color: "#dbeafe",
          fontWeight: 700,
        }}
      >
        <Icon size={22} />
        {salam}
      </div>

      <h1
        style={{
          marginTop: 14,
          fontSize: 28,
          fontWeight: 800,
        }}
      >
        {nama}
      </h1>

      <p
        style={{
          marginTop: 8,
          color: "#dbeafe",
        }}
      >
        {tanggal}
      </p>

      <div
       
      >

      </div>
    </div>
  );
}