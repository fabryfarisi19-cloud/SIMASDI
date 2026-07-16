"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Eye } from "lucide-react";
import { supabase } from "@/lib/supabase";
import {
  Bell,
  CalendarDays,
  Clock3,
  RefreshCcw,
  Printer,
  Inbox,
  Send,
  FileText,
  Archive,
  Sun,
  Users,
  FileClock,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Area,
  AreaChart,
} from "recharts";
import StatCard from "@/app/components/StatCard";
import { useRouter } from "next/navigation";
export default function DashboardPage() {
  const [jam, setJam] = useState("");
  const [tanggal, setTanggal] = useState("");
const [dataGrafik, setDataGrafik] = useState<
  { hari: string; layanan: number }[]
>([]);
const [totalSuratMasuk, setTotalSuratMasuk] = useState(0);
const [totalSuratKeluar, setTotalSuratKeluar] = useState(0);
const [totalDisposisi, setTotalDisposisi] = useState(0);
const [totalArsip, setTotalArsip] = useState(0);
const [agendaHariIni, setAgendaHariIni] = useState<any[]>([]);
const [agendaBesok, setAgendaBesok] = useState<any[]>([]);
const [suratTerbaru, setSuratTerbaru] = useState<any[]>([]);
const [detailSurat, setDetailSurat] = useState<any>(null);
const [showDetail, setShowDetail] = useState(false);
const [showPreview, setShowPreview] = useState(false);
const router = useRouter();
const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const loadGrafik = async () => {
      const { data, error } = await supabase
        .from("surat_masuk")
        .select("created_at");

      if (error) {
        console.error(error);
        return;
      }

      const hariMap: Record<string, number> = {
        Sen: 0,
        Sel: 0,
        Rab: 0,
        Kam: 0,
        Jum: 0,
        Sab: 0,
        Min: 0,
      };

      data.forEach((item) => {
        const hari = new Date(item.created_at).toLocaleDateString("id-ID", {
          weekday: "short",
        });

        if (hariMap[hari] !== undefined) {
          hariMap[hari]++;
        }
      });

      setDataGrafik(
        Object.entries(hariMap).map(([hari, layanan]) => ({
          hari,
          layanan,
        }))
      );
    };
const channel = supabase
  .channel("grafik-surat-masuk")
  .on(
    "postgres_changes",
    {
      event: "*",
      schema: "public",
      table: "surat_masuk",
    },
    () => {
      loadGrafik();
      loadDashboard();
      loadAgenda();
      const interval = setInterval(updateJam, 1000);
    }
  )
  .subscribe();
    const updateJam = () => {
      const now = new Date();

      setJam(
        now.toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );

      setTanggal(
        now.toLocaleDateString("id-ID", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      );
    };
const loadDashboard = async () => {

  const suratMasuk = await supabase
    .from("surat_masuk")
    .select("*", { count: "exact", head: true });

  setTotalSuratMasuk(suratMasuk.count ?? 0);

  const suratKeluar = await supabase
    .from("surat_keluar")
    .select("*", { count: "exact", head: true });

  setTotalSuratKeluar(suratKeluar.count ?? 0);

  const disposisi = await supabase
    .from("surat")
    .select("*", { count: "exact", head: true });

  setTotalDisposisi(disposisi.count ?? 0);

  const arsip = await supabase
    .from("surat_masuk")
    .select("*", { count: "exact", head: true });

  setTotalArsip(arsip.count ?? 0);

};
const loadAgenda = async () => {

  const hariIni = new Date().toISOString().split("T")[0];

  const besokDate = new Date();
  besokDate.setDate(besokDate.getDate() + 1);

  const besok = besokDate.toISOString().split("T")[0];

  const { data: hariIniData } = await supabase
    .from("agenda")
    .select("*")
    .eq("tanggal", hariIni)
    .order("jam");

  const { data: besokData } = await supabase
    .from("agenda")
    .select("*")
    .eq("tanggal", besok)
    .order("jam");

  setAgendaHariIni(hariIniData || []);
  setAgendaBesok(besokData || []);

};
const loadSuratTerbaru = async () => {

  const { data, error } = await supabase
    .from("surat_masuk")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(5);

  if (error) {
    console.error(error);
    return;
  }

  setSuratTerbaru(data || []);

};
const loadUser = () => {
  const user = localStorage.getItem("user");

  if (user) {
    setUser(JSON.parse(user));
  }
};
    updateJam();
    loadGrafik();
    loadDashboard();
    loadAgenda();
    loadSuratTerbaru();
    loadUser();
    const interval = setInterval(updateJam, 1000);
   return () => {
  clearInterval(interval);
  supabase.removeChannel(channel);
};
  }, []);

 return (
<div className="space-y-6">
  

{/* ================= HEADER ================= */}

<div className="bg-white rounded-3xl shadow-lg overflow-hidden">

<div className="bg-gradient-to-r from-[#0B2E78] via-[#1D4ED8] to-[#3B82F6] px-8 py-5 text-white">

<div className="flex justify-between items-center">

<div className="flex items-center gap-4">

<Image
  src="/logoimipas.png"
  alt="Logo"
  width={75}
  height={80}
  
/>

<div>

<h1 className="text-3xl xl:text-4xl font-black tracking-wide">
SIMASDI
</h1>

<p className="text-blue-100 text-sm xl:text-base">
Sistem Manajemen Arsip Digital
</p>

<p className="text-blue-100 text-sm">
Balai Pemasyarakatan Kelas I Jakarta Barat
</p>

</div>

</div>

<div className="hidden md:flex items-center gap-4">

<button className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center">

<Bell size={20}/>

</button>

<div className="w-12 h-12 rounded-full bg-white flex items-center justify-center font-bold text-blue-700">

F

</div>

</div>

</div>

</div>
<div className="px-8 py-5">
<div className="flex flex-col xl:flex-row justify-between gap-8">

<div>

<h2 className="text-2xl font-bold text-slate-700">
Selamat Datang
</h2>

<h1 className="text-3xl font-black text-blue-700 mt-2">
  {user?.nama || "Pengguna"}
</h1>

<p className="text-slate-500 mt-3">
  {user?.jabatan || "-"}
</p>

<p className="text-slate-500">
  {user?.unit_kerja || "Balai Pemasyarakatan Kelas I Jakarta Barat"}
</p>

</div>

<div className="text-center xl:text-right">

<div className="flex items-center justify-center xl:justify-end gap-2 text-blue-700">

<Clock3 size={16}/>

<span className="font-semibold">
Waktu Sekarang
</span>

</div>

<h2 className="text-5xl xl:text-6xl font-black mt-2">

{jam}

</h2>

<div className="flex items-center justify-center xl:justify-end gap-2 mt-3 text-slate-500">

<CalendarDays size={18}/>

<span>{tanggal}</span>

</div>

</div>

</div>

</div>

</div>

      {/* Tombol */}
     {/* ACTION */}
{/* ================= ACTION ================= */}

<div className="flex flex-col md:flex-row justify-between items-center gap-5">

  <div>

    <h2 className="text-2xl font-black text-slate-800">
      Dashboard SIMASDI
    </h2>

    <p className="text-slate-500">
      Ringkasan aktivitas hari ini
    </p>

  </div>

  <div className="flex gap-3">

  <button
  className="
    flex items-center gap-2
    bg-blue-600
    hover:bg-blue-700
    text-white
    rounded-xl
    px-4
    py-2.5
    shadow-lg
    transition"
>
    <RefreshCcw size={18} />
      Perbarui Data
    </button>

    <button
      className="
      flex items-center gap-2
      bg-red-600
      hover:bg-red-700
      text-white
      rounded-xl
    px-4
py-2.5
      shadow-lg
      transition"
    >
      <Printer size={18}/>
      Cetak PDF
    </button>

  </div>

</div>

{/* ================= STATISTIK ================= */}

<div className="grid grid-cols-2 xl:grid-cols-4 gap-5 mt-6">

  <StatCard
    title="Surat Masuk"
   value={totalSuratMasuk.toString()}
    subtitle="Hari ini"
    color="blue"
    icon={<Inbox size={28}/>}
  />

  <StatCard
    title="Surat Keluar"
    value={totalSuratKeluar.toString()}
    subtitle="Hari ini"
    color="purple"
    icon={<Send size={28}/>}
  />

  <StatCard
    title="Disposisi"
    value={totalDisposisi.toString()}
    subtitle="Menunggu"
    color="orange"
    icon={<FileText size={28}/>}
  />

  <StatCard
    title="Arsip Digital"
    value={totalArsip.toString()}
    subtitle="Dokumen"
    color="green"
    icon={<Archive size={28}/>}
  />

</div>
{/* ===========================
    GRAFIK + AGENDA
=========================== */}

{/* ================= GRAFIK + AGENDA ================= */}

<div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mt-8">

  {/* Grafik */}
  <div className="xl:col-span-2 bg-white rounded-3xl shadow-lg p-6">

    <div className="flex justify-between items-center mb-6">

      <div>
        <h2 className="text-2xl font-bold text-slate-800">
          Statistik SIAP
        </h2>

        <p className="text-slate-500 text-sm">
          Statistik pelayanan hari ini
        </p>
      </div>

      <button className="text-blue-600 font-semibold hover:underline">
        Detail →
      </button>

    </div>

  <div className="h-[380px]">

  <ResponsiveContainer width="100%" height="100%">

<AreaChart data={dataGrafik}>

   <CartesianGrid
  stroke="#E2E8F0"
  strokeDasharray="5 5"
/>

      <XAxis dataKey="hari" />

    <YAxis hide />

   <Tooltip
  contentStyle={{
    borderRadius: 12,
    border: "none",
    boxShadow: "0 6px 20px rgba(0,0,0,.15)",
  }}
/>
<Area
  type="monotone"
  dataKey="layanan"
  stroke="#2563EB"
  strokeWidth={4}
  fill="#3B82F6"
  fillOpacity={0.18}
 dot={{
    r: 4,
    fill: "#2563EB",
    stroke: "#ffffff",
    strokeWidth: 2,
  }}
  activeDot={{
    r: 7,
  }}
/>
    </AreaChart>

  </ResponsiveContainer>

</div>
  </div>

  {/* Agenda */}

  <div className="flex flex-col gap-6">

    {/* Hari Ini */}

    <div className="bg-white rounded-3xl shadow-lg p-6 flex-1">

      <div className="flex items-center gap-3 mb-5">

        <CalendarDays className="text-blue-600"/>

        <h2 className="font-bold text-xl text-blue-800">
          Agenda Hari Ini
        </h2>

      </div>
<div className="mt-5 space-y-4">

  {agendaHariIni.length === 0 ? (

    <p className="text-slate-400 text-sm">
      Tidak ada agenda hari ini
    </p>

  ) : (

    agendaHariIni.map((item) => (

      <div
        key={item.id}
        className="rounded-2xl bg-blue-50 p-4"
      >

        <p className="font-bold">
          {item.judul}
        </p>

        <p className="text-sm text-slate-500">
          {item.jam}
        </p>

        <p className="text-xs text-slate-400 mt-1">
          {item.lokasi}
        </p>

      </div>

    ))

  )}

</div>

    </div>

    {/* Besok */}

    <div className="bg-white rounded-3xl shadow-lg p-6 flex-1">

      <div className="flex items-center gap-3 mb-5">

        <CalendarDays className="text-orange-600"/>

        <h2 className="font-bold text-xl text-orange-700">
          Agenda Besok
        </h2>

      </div>

   <div className="mt-5 space-y-4">

  {agendaBesok.length === 0 ? (

    <p className="text-slate-400 text-sm">
      Tidak ada agenda besok
    </p>

  ) : (

    agendaBesok.map((item) => (

      <div
        key={item.id}
        className="rounded-2xl bg-orange-50 p-4"
      >

        <p className="font-bold">
          {item.judul}
        </p>

        <p className="text-sm text-slate-500">
          {item.jam}
        </p>

        <p className="text-xs text-slate-400 mt-1">
          {item.lokasi}
        </p>

      </div>

    ))

  )}

</div>

    </div>

  </div>

</div>

{/* ================= SURAT MASUK TERBARU ================= */}

<div className="bg-white rounded-3xl shadow-lg p-6 mt-8">

  <div className="flex items-center justify-between mb-5">

    <h2 className="text-2xl font-bold text-slate-800">
      Surat Masuk Terbaru
    </h2>

    <span className="text-sm text-slate-500">
      5 Data Terakhir
    </span>

  </div>

  <div className="overflow-x-auto">

    <table className="w-full">

     <thead>
  <tr className="border-b bg-slate-100">

    <th className="text-left py-3 px-2 w-12">
      No
    </th>

    <th className="text-left py-3 px-2">
      Nomor Surat
    </th>

    <th className="text-left py-3 px-2">
      Pengirim
    </th>

    <th className="text-left py-3 px-2">
      Perihal
    </th>

    <th className="text-left py-3 px-2">
      Tanggal
    </th>

  </tr>
</thead>

     <tbody>

  {suratTerbaru.map((item, index) => (

    <tr
      key={item.id}
      className="border-b hover:bg-slate-50"
    >

      <td className="py-3">
        {index + 1}
      </td>

      <td className="py-3">
        {item.nomor_surat}
      </td>

    <td className="py-3">
  {item.asal_surat}
</td>

<td className="py-3 max-w-[380px]">

  <button
   onClick={() => {
  setDetailSurat(item);
  setShowDetail(true);
}}
    className="truncate text-left text-blue-700 hover:underline w-full"
    title={item.perihal}
  >
    {item.perihal}
  </button>

</td>
      <td className="py-3">
      {new Date(item.tanggal).toLocaleDateString("id-ID", {
  day: "2-digit",
  month: "short",
  year: "numeric",
})}
      </td>

    </tr>

  ))}

</tbody>
    </table>

  </div>

</div>
{/* ================= DETAIL PERIHAL ================= */}

{showDetail && (

  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">

    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl">

      <div className="flex items-center justify-between border-b px-6 py-4">

        <h2 className="text-xl font-bold text-blue-800">
          Detail Perihal Surat
        </h2>

        <button
          onClick={() => setShowDetail(false)}
          className="text-2xl text-slate-500 hover:text-red-600"
        >
          ×
        </button>

      </div>

      <div className="p-6">

      <div className="space-y-5">

  <div>
    
    <p className="text-sm text-slate-500">
      Nomor Surat
    </p>

    <p className="font-semibold text-slate-800">
      {detailSurat?.nomor_surat}
    </p>
  </div>

  <div>
    <p className="text-sm text-slate-500">
      Pengirim
    </p>

    <p className="font-semibold text-slate-800">
      {detailSurat?.asal_surat}
    </p>
  </div>

  <div>
    <p className="text-sm text-slate-500">
      Tanggal
    </p>

    <p className="font-semibold text-slate-800">
      {detailSurat?.tanggal}
    </p>
  </div>

  <div>
    <p className="text-sm text-slate-500">
      Perihal
    </p>

    <p className="leading-7 text-slate-800">
      {detailSurat?.perihal}
    </p>
  </div>

</div>
<div className="mt-8 flex justify-end gap-3">

  <button
    onClick={() => setShowDetail(false)}
    className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300"
  >
    Tutup
  </button>

  {detailSurat?.file_url && (
    <button
 onClick={() => {
  setShowDetail(false);
  router.push(`/surat-masuk/preview/${detailSurat.id}`);
}}
  className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2"
>
  <Eye size={18} />
  <span>Preview</span>
</button>
  )}
{showPreview && detailSurat?.file_url && (

  <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">

    <div className="bg-white rounded-3xl w-full max-w-6xl h-[90vh] flex flex-col shadow-2xl">

      <div className="flex items-center justify-between px-6 py-4 border-b">

        <h2 className="text-xl font-bold text-blue-800">
          Preview Surat
        </h2>

        <button
          onClick={() => setShowPreview(false)}
          className="text-2xl hover:text-red-600"
        >
          ✕
        </button>

      </div>
<p className="px-6 py-2 text-xs text-slate-500 break-all">
  {detailSurat?.file_url}
</p>
  <object
  data={detailSurat?.file_url}
  type="application/pdf"
  className="flex-1 w-full rounded-b-3xl"
>

  <div className="flex flex-col items-center justify-center h-full gap-4">

    <p className="text-slate-600">
      Browser tidak dapat menampilkan preview PDF.
    </p>

    <a
      href={detailSurat?.file_url}
      target="_blank"
      rel="noopener noreferrer"
      className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700"
    >
      📄 Buka PDF
    </a>

  </div>

</object>
    </div>

  </div>

)}
</div>
      </div>

    </div>

  </div>

)}
</div>
  );
}