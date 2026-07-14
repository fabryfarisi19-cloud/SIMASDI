"use client";
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

export default function DashboardSIMSTOK() {
  return (
    <main>

      {/* Judul */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-blue-900">
          Dashboard SIMSTOK BMN
        </h1>

        <p className="text-slate-600 mt-2">
          Sistem Informasi Manajemen Stok Barang Milik Negara
        </p>
      </div>

      {/* Statistik */}
    {/* Statistik */}
<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6">

  <Card
    title="TOTAL BMN"
    value="1.256"
    subtitle="Unit Barang"
    color="blue"
    icon={<Boxes size={36} />}
  />

  <Card
    title="BARANG BAIK"
    value="1.180"
    subtitle="93,95%"
    color="green"
    icon={<CheckCircle2 size={36} />}
  />

  <Card
    title="RUSAK RINGAN"
    value="54"
    subtitle="4,30%"
    color="yellow"
    icon={<AlertTriangle size={36} />}
  />

  <Card
    title="RUSAK BERAT"
    value="22"
    subtitle="1,75%"
    color="red"
    icon={<XCircle size={36} />}
  />

  <Card
    title="NILAI BMN"
    value="Rp 8,25 M"
    subtitle="Total Nilai"
    color="purple"
    icon={<Wallet size={36} />}
  />

</div>

{/* Grafik */}
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
  <ChartBMN />
  <ChartRuangan />
</div>

{/* Tabel */}
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
        className={`${colors[color as keyof typeof colors]} w-20 h-20 rounded-full flex items-center justify-center text-white`}
      >
        {icon}
      </div>

    </div>
  );
}