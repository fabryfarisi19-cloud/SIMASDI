"use client";

import { useEffect, useState } from "react";

import ChartBMN from "@/app/components/ChartBMN";
import ChartRuangan from "@/app/components/ChartRuangan";
import TableBMN from "@/app/components/TableBMN";

import {
  Boxes,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Wallet,
} from "lucide-react";

import { supabase } from "@/lib/supabase";

export default function DashboardSIMSTOK() {
  const [loading, setLoading] = useState(true);

  const [totalBMN, setTotalBMN] = useState(0);
  const [barangBaik, setBarangBaik] = useState(0);
  const [rusakRingan, setRusakRingan] = useState(0);
  const [rusakBerat, setRusakBerat] = useState(0);
  const [nilaiBMN, setNilaiBMN] = useState(0);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    setLoading(true);

    const { data, error } = await supabase
      .from("barang")
   .select("jumlah, kondisi, nilai_perolehan");

    if (error) {
      console.error("ERROR DASHBOARD BMN:", error.message);
      setLoading(false);
      return;
    }

    const dataBarang = data || [];
console.log("DATA DASHBOARD BMN =", dataBarang);
    let total = 0;
    let baik = 0;
    let ringan = 0;
    let berat = 0;
    let nilai = 0;

    dataBarang.forEach((item) => {
      const jumlah = Number(item.jumlah || 0);
 const nilaiPerolehan = Number(item.nilai_perolehan || 0);
      total += jumlah;
      nilai += nilaiPerolehan;

    const kondisi = String(item.kondisi || "").toLowerCase();

if (kondisi === "baik") {
  baik += jumlah;
}

if (kondisi === "rusak ringan") {
  ringan += jumlah;
}

if (kondisi === "rusak berat") {
  berat += jumlah;
}
    });

    setTotalBMN(total);
    setBarangBaik(baik);
    setRusakRingan(ringan);
    setRusakBerat(berat);
    setNilaiBMN(nilai);

    setLoading(false);
  }

  const persenBaik =
    totalBMN > 0
      ? ((barangBaik / totalBMN) * 100).toFixed(2)
      : "0.00";

  const persenRingan =
    totalBMN > 0
      ? ((rusakRingan / totalBMN) * 100).toFixed(2)
      : "0.00";

  const persenBerat =
    totalBMN > 0
      ? ((rusakBerat / totalBMN) * 100).toFixed(2)
      : "0.00";

  function formatRupiahSingkat(nilai: number) {
    if (nilai >= 1_000_000_000) {
      return `Rp ${(nilai / 1_000_000_000).toFixed(2)} M`;
    }

    if (nilai >= 1_000_000) {
      return `Rp ${(nilai / 1_000_000).toFixed(2)} Jt`;
    }

    if (nilai >= 1_000) {
      return `Rp ${(nilai / 1_000).toFixed(2)} Rb`;
    }

    return `Rp ${nilai.toLocaleString("id-ID")}`;
  }

  return (
    <main>

      {/* JUDUL */}
      <div className="mb-8">

        <h1 className="text-4xl font-bold text-blue-900">
          Dashboard SIMSTOK BMN
        </h1>

        <p className="text-slate-600 mt-2">
          Sistem Informasi Manajemen Stok Barang Milik Negara
        </p>

      </div>

      {/* STATISTIK */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6">

        <Card
          title="TOTAL BMN"
          value={loading ? "..." : totalBMN.toLocaleString("id-ID")}
          subtitle="Unit Barang"
          color="blue"
          icon={<Boxes size={36} />}
        />

        <Card
          title="BARANG BAIK"
          value={loading ? "..." : barangBaik.toLocaleString("id-ID")}
          subtitle={`${persenBaik}%`}
          color="green"
          icon={<CheckCircle2 size={36} />}
        />

        <Card
          title="RUSAK RINGAN"
          value={loading ? "..." : rusakRingan.toLocaleString("id-ID")}
          subtitle={`${persenRingan}%`}
          color="yellow"
          icon={<AlertTriangle size={36} />}
        />

        <Card
          title="RUSAK BERAT"
          value={loading ? "..." : rusakBerat.toLocaleString("id-ID")}
          subtitle={`${persenBerat}%`}
          color="red"
          icon={<XCircle size={36} />}
        />

        <Card
          title="NILAI BMN"
          value={loading ? "..." : formatRupiahSingkat(nilaiBMN)}
          subtitle="Total Nilai"
          color="purple"
          icon={<Wallet size={36} />}
        />

      </div>

      {/* GRAFIK */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">

        <ChartBMN />

        <ChartRuangan />

      </div>

      {/* TABEL */}
      <div className="mt-8">

        <TableBMN />

      </div>

    </main>
  );
}

function Card({
  title,
  value,
  subtitle,
  icon,
  color,
}: any) {

  const colors = {
    blue: "bg-blue-600",
    green: "bg-green-600",
    yellow: "bg-yellow-500",
    red: "bg-red-600",
    purple: "bg-purple-600",
  };

  return (
    <div className="bg-white rounded-3xl shadow-lg p-6 h-40 flex justify-between items-center">

      <div>

        <p className="font-bold text-slate-500">
          {title}
        </p>

        <h2 className="text-4xl font-black mt-2">
          {value}
        </h2>

        <p className="text-slate-500 mt-2">
          {subtitle}
        </p>

      </div>

      <div
        className={`
          ${colors[color as keyof typeof colors]}
          w-20 h-20
          rounded-full
          flex
          items-center
          justify-center
          text-white
        `}
      >
        {icon}
      </div>

    </div>
  );
}