"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Image from "next/image";
function getHariIni() {
  const now = new Date();

  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}
type Antrian = {
  id?: number;
  nomor: string;
  loket: number | null;
};

type WaitingQueue = {
  nomor: string;
};

export default function DisplayTV() {
  const [dipanggil, setDipanggil] = useState<Antrian | null>(null);
const [menunggu, setMenunggu] = useState<WaitingQueue[]>([]);
const [runningText, setRunningText] = useState("");
const [jam, setJam] = useState("");
const [tanggal, setTanggal] = useState("");
const [blink, setBlink] = useState(false);
const [lastCalled, setLastCalled] = useState("");
const [statistik, setStatistik] = useState({
  total: 0,
  menunggu: 0,
  dipanggil: 0,
  selesai: 0,
});
 useEffect(() => {
  loadData();

  setJam(
    new Date().toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  );
  setTanggal(
  new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })
);

  const timer = setInterval(() => {
    setJam(
      new Date().toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    );
setTanggal(
  new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })
);

  }, 1000);

 const channel = supabase
  .channel("display-tv")

  .on(
    "postgres_changes",
    {
      event: "*",
      schema: "public",
      table: "antrian",
    },
    () => {
      loadData();
    }
  )

  .on(
    "postgres_changes",
    {
      event: "*",
      schema: "public",
      table: "setting_siantar",
    },
    () => {
      loadData();
    }
  )

  .subscribe();

  return () => {
    clearInterval(timer);
    supabase.removeChannel(channel);
  };
}, []);

async function loadData() {
const hariIni = getHariIni();
  // Ambil setting SIANTAR
  const { data: setting } = await supabase
    .from("setting_siantar")
    .select("running_text")
    .eq("id", 1)
    .single();

  if (setting) {
    setRunningText(setting.running_text);
  }

  // Nomor yang sedang dipanggil
  const { data } = await supabase
    .from("antrian")
    .select("id, nomor, loket")
    .eq("tanggal", hariIni)
    .not("called_at", "is", null)
    .order("called_at", { ascending: false })
    .limit(1)
   .maybeSingle();

 if (data) {
  setDipanggil(data);

  if (lastCalled !== data.nomor) {
    setLastCalled(data.nomor);

    setBlink(true);

    setTimeout(() => {
      setBlink(false);
    }, 3000);

  }
}
 else {
    setDipanggil(null);
  }

  // Antrean berikutnya
  const { data: waiting } = await supabase
    .from("antrian")
    .select("nomor")
    .eq("status", "MENUNGGU")
    .eq("tanggal", hariIni)
    .order("id")
    .limit(5);

  setMenunggu(waiting || []);
  const [total, menungguCount, dipanggilCount, selesaiCount] =
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
console.log({
  total: total.count,
  menunggu: menungguCount.count,
  dipanggil: dipanggilCount.count,
  selesai: selesaiCount.count,
});
setStatistik({
  total: total.count ?? 0,
  menunggu: menungguCount.count ?? 0,
  dipanggil: dipanggilCount.count ?? 0,
  selesai: selesaiCount.count ?? 0,
});
}

  return (
   <main className="h-screen overflow-hidden bg-blue-900 text-white">

<div className="grid grid-cols-12 h-[calc(100vh-64px)]">

        {/* Panel Nomor */}
<div className="col-span-6 flex flex-col bg-[#14398B]">

<div className="bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 rounded-b-[40px] px-10 py-5 shadow-xl border-b border-white/20">

  <div className="flex items-center justify-between">

    {/* Kiri */}
    <div className="flex items-center gap-6">

      <Image
        src="/logoimipas.png"
        alt="Logo"
        width={72}
        height={72}
      />

      <div>

        <h1 className="text-5xl font-black tracking-wide text-white">
          SIAP
        </h1>

        <p className="text-2xl text-blue-100">
          Sistem Informasi Antrean Pelayanan
        </p>

      </div>

    </div>

    {/* Kanan */}
    <div className="text-right">

      <div className="text-4xl font-black text-white">
        {jam}
      </div>

     <div className="mt-2 text-xl text-blue-100">
  {tanggal}
</div>

    </div>

  </div>

</div>   
        
<div className="relative flex justify-center px-8 pt-6">
<Image
  src="/logoimipas.png"
  alt="Watermark"
  width={150}
  height={150}
className="absolute opacity-[0.02] w-[380px] h-[380px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
/>  
<div className="bg-white rounded-[36px] shadow-[0_20px_60px_rgba(0,0,0,0.18)] w-[88%] max-w-3xl py-6 px-8">

    <div className="text-center">

      <p className="text-3xl tracking-[8px] text-slate-500 font-semibold">
        NOMOR ANTREAN
      </p>

     <div
  key={dipanggil?.nomor}
  className={`
    mt-6
    text-[150px]
          font-black
          text-blue-700
          transition-all
          duration-500
          ${blink ? "scale-110 text-yellow-500" : ""}
        `}
      >
        {dipanggil?.nomor ?? "---"}
      </div>

    <div className="mt-6 text-2xl text-slate-600">
        Silakan menuju
      </div>

    <div className="text-6xl font-black text-blue-700 mt-2">
        Loket {dipanggil?.loket ?? "-"}
      </div>

    </div>

  </div>

</div>
<div className="pb-6 text-center">
  <h2 className="text-3xl font-bold mb-4">
    Antrean Berikutnya
  </h2>

<div className="mt-2 flex justify-center gap-4 flex-wrap">

  {menunggu.length === 0 ? (

    <div className="text-xl text-blue-100">
      Tidak ada antrean menunggu
    </div>

  ) : (

    menunggu.map((item) => (
      <div
        key={item.nomor}
        className="w-32 h-24 rounded-2xl bg-white shadow-xl flex items-center justify-center"
      >
        <span className="text-4xl font-black text-blue-700">
          {item.nomor}
        </span>
      </div>
    ))

  )}

</div>
</div>

</div>

{/* Panel Video */}
<div className="col-span-6 flex flex-col bg-[#0B1F4D] border-l-2 border-white/20">

  {/* Header */}
<div className="bg-gradient-to-r from-blue-950 via-blue-900 to-blue-800 text-center py-2 border-b border-white/30">
    <h2 className="text-xl font-bold text-white">
      VIDEO INFORMASI
    </h2>

    <p className="text-blue-200 mt-1">
      Balai Pemasyarakatan Kelas I Jakarta Barat
    </p>
  </div>


 {/* Video */}
<div className="h-[820px] overflow-hidden px-2 pb-2 pt-0">
  <video
    src="/videobansos.mp4"
    autoPlay
    muted
    loop
    playsInline
    controls={false}
   className="w-full h-full object-co rounded-3xl bg-black"
  />
</div>
{/* Statistik */}
<div className="bg-blue-950 px-4 py-3 border-t border-blue-700 -mt-16">

  <h3 className="text-xl font-bold text-center mb-3">
    Statistik Hari Ini
  </h3>

 <div className="grid grid-cols-2 gap-3">

    <div className="bg-blue-500 rounded-2xl p-2 text-center">
      <div className="text-2xl font-black">
        {statistik.total}
      </div>
      <div className="text-blue-200">
        Total
      </div>
    </div>

    <div className="bg-yellow-500 rounded-2xl p-2 text-center">
      <div className="text-2xl font-black text-black">
        {statistik.menunggu}
      </div>
      <div className="text-black">
        Menunggu
      </div>
    </div>

    <div className="bg-green-500 rounded-2xl p-2 text-center">
      <div className="text-2xl font-black">
        {statistik.selesai}
      </div>
      <div>
        Selesai
      </div>
    </div>

    <div className="bg-red-500 rounded-2xl p-2 text-center">
      <div className="text-2xl font-black">
        {statistik.dipanggil}
      </div>
      <div>
        Dipanggil
      </div>
    </div>

  </div>

</div>

</div>

      </div>
<div className="mt-4 h-14 bg-yellow-400 overflow-hidden flex items-center relative z-50">
  <div className="animate-marquee whitespace-nowrap text-black text-2xl font-bold leading-none">
    {runningText}
    {" • "}
    {runningText}
    {" • "}
    {runningText}
  </div>
</div>
    </main>
  );
}