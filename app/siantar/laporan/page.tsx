"use client";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import * as XLSX from "xlsx";
import StatisticsCard from "@/app/components/StatisticsCard";
import ChartPelayanan from "@/app/components/ChartPelayanan";
import RiwayatTable from "@/app/components/RiwayatTable";
import HeaderLaporan from "@/app/components/HeaderLaporan";
import {
  Users,
  Clock3,
  BellRing,
  CheckCircle2,
} from "lucide-react";
export default function LaporanPage() {
  const [data, setData] = useState({
    total: 0,
    menunggu: 0,
    dipanggil: 0,
    selesai: 0,
  });
 const [riwayat, setRiwayat] = useState<any[]>([]); 
 const [search, setSearch] = useState("");
 const [tanggalAwal, setTanggalAwal] = useState("");
const [tanggalAkhir, setTanggalAkhir] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
 const hariIni = new Date().toISOString().split("T")[0];   
    const [total, menunggu, dipanggil, selesai] =
      await Promise.all([
        supabase
          .from("antrian")
          .select("*", { count: "exact", head: true })
          .eq("tanggal", hariIni),

        supabase
          .from("antrian")
          .select("*", { count: "exact", head: true })
          .eq("tanggal", hariIni)
          .eq("status", "MENUNGGU"),

        supabase
          .from("antrian")
          .select("*", { count: "exact", head: true })
          .eq("tanggal", hariIni)
          .eq("status", "DIPANGGIL"),

        supabase
          .from("antrian")
          .select("*", { count: "exact", head: true })
          .eq("tanggal", hariIni)
          .eq("status", "SELESAI"),
      ]);

    setData({
      total: total.count ?? 0,
      menunggu: menunggu.count ?? 0,
      dipanggil: dipanggil.count ?? 0,
      selesai: selesai.count ?? 0,
    });
  const { data: history, error } = await supabase
  .from("antrian")
  .select("*")
  .eq("tanggal", hariIni)
  .order("created_at", { ascending: false })
  .limit(20);

if (!error) {
  setRiwayat(history || []);
}  
  }
 function exportPDF() {
  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.text("LAPORAN SIAP", 14, 18);

  doc.setFontSize(11);
  doc.text(
    "Balai Pemasyarakatan Kelas I Jakarta Barat",
    14,
    26
  );
doc.setFontSize(10);

doc.text(
  `Tanggal Cetak : ${new Date().toLocaleString("id-ID")}`,
  14,
  32
);
doc.text(`Total Antrean : ${data.total}`, 14, 38);
doc.text(`Menunggu      : ${data.menunggu}`, 70, 38);
doc.text(`Dipanggil     : ${data.dipanggil}`, 120, 38);
doc.text(`Selesai       : ${data.selesai}`, 170, 38);
  autoTable(doc, {
    startY: 46,
    head: [["Nomor", "Layanan", "Status", "Loket"]],
    body: riwayat.map((item) => [
      item.nomor,
      item.layanan,
      item.status,
      item.loket ?? "-",
    ]),
  });

  doc.save("Laporan-SIAP.pdf");
}   
function exportExcel() {
  const worksheet = XLSX.utils.json_to_sheet(
    riwayat.map((item) => ({
      Nomor: item.nomor,
      Layanan: item.layanan,
      Status: item.status,
      Loket: item.loket ?? "-",
      Waktu: new Date(item.created_at).toLocaleString("id-ID"),
    }))
  );

  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    "Laporan SIAP"
  );

  XLSX.writeFile(
    workbook,
    `Laporan-SIAP-${new Date().toISOString().slice(0,10)}.xlsx`
  );
}

  return (
    <main className="p-8">
     <HeaderLaporan title="Laporan SIAP" />
      <div className="grid md:grid-cols-4 gap-6">
  
  <StatisticsCard
  title="Total"
  value={data.total}
  color="bg-blue-600"
  icon={<Users />}
/>

<StatisticsCard
  title="Menunggu"
  value={data.menunggu}
  color="bg-yellow-500"
  icon={<Clock3 />}
/>

<StatisticsCard
  title="Dipanggil"
  value={data.dipanggil}
  color="bg-green-600"
  icon={<BellRing />}
/>

<StatisticsCard
  title="Selesai"
  value={data.selesai}
  color="bg-purple-600"
  icon={<CheckCircle2 />}
/>

      </div>
     <ChartPelayanan
  menunggu={data.menunggu}
  dipanggil={data.dipanggil}
  selesai={data.selesai}
/>

<RiwayatTable>
<div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 mb-6">
  <h2 className="text-2xl font-bold">
    Riwayat Antrean
  </h2>

<div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full lg:w-auto">
    <button
      onClick={loadData}
      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold"
    >
      🔄 Refresh
    </button>

    <button
      onClick={exportPDF}
      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold"
    >
      📄 Export PDF
    </button>
 <button
  onClick={exportExcel}
  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold"
>
  📊 Export Excel
</button>   
  </div>
</div>
<div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">

  <input
    type="text"
    placeholder="Cari nomor antrean..."
    value={search}
    onChange={(e) => setSearch(e.target.value)}
  className="border rounded-lg p-3 w-full"
  />

  <input
    type="date"
    value={tanggalAwal}
    onChange={(e) => setTanggalAwal(e.target.value)}
    className="border rounded-lg p-3"
  />

  <input
    type="date"
    value={tanggalAkhir}
    onChange={(e) => setTanggalAkhir(e.target.value)}
    className="border rounded-lg p-3"
  />
<button
  onClick={() => {
    setSearch("");
    setTanggalAwal("");
    setTanggalAkhir("");
  }}
 className="bg-red-600 hover:bg-red-700 text-white w-full md:w-auto px-4 py-3 rounded-lg font-semibold"
>
 Reset
</button>
</div>
 <div className="overflow-x-auto rounded-xl border">
 <table className="min-w-[800px] w-full border-collapse">
      <thead>
       <tr className="bg-slate-100 text-slate-700">
       <th className="p-3 text-left whitespace-nowrap">
          Nomor
        </th>
        <th className="p-3 text-left whitespace-nowrap">
          Layanan
        </th>
        <th className="p-3 text-left whitespace-nowrap">
          Status
        </th>
        <th className="p-3 text-left whitespace-nowrap">
          Loket
        </th>
        <th className="p-3 text-left whitespace-nowrap">
          Waktu
        </th>
        </tr>
      </thead>

      <tbody>
     {riwayat
  .filter((item) => {
    const cocokNomor = item.nomor
      ?.toLowerCase()
      .includes(search.toLowerCase());

    const tanggal = item.created_at.split("T")[0];

    const cocokTanggalAwal =
      !tanggalAwal || tanggal >= tanggalAwal;

    const cocokTanggalAkhir =
      !tanggalAkhir || tanggal <= tanggalAkhir;

    return (
      cocokNomor &&
      cocokTanggalAwal &&
      cocokTanggalAkhir
    );
  })
  .map((item) => (
          <tr key={item.id} className="border-b">
            <td className="p-3 font-semibold">
              {item.nomor}
            </td>

            <td className="p-3">
              {item.layanan}
            </td>

          <td className="p-3">
  <span
    className={`px-3 py-1 rounded-full text-white text-sm font-semibold
      ${
        item.status === "MENUNGGU"
          ? "bg-yellow-500"
          : item.status === "DIPANGGIL"
          ? "bg-blue-600"
          : "bg-green-600"
      }`}
  >
    {item.status}
  </span>
</td>
 <td className="p-3">
  {item.loket ?? "-"}
</td>

<td className="p-3">
  {new Date(item.created_at).toLocaleString("id-ID")}
</td>           
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</RiwayatTable>     
    </main>
  );
}