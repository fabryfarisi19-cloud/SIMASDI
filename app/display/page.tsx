"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Image from "next/image";

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
const [blink, setBlink] = useState(false);
 useEffect(() => {
  loadData();

  setJam(
    new Date().toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
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
    .eq("status", "DIPANGGIL")
    .order("called_at", { ascending: false })
    .limit(1)
    .single();

 if (data) {
  setDipanggil(data);

  setBlink(true);

  setTimeout(() => {
    setBlink(false);
  }, 3000);
}
 else {
    setDipanggil(null);
  }

  // Antrean berikutnya
  const { data: waiting } = await supabase
    .from("antrian")
    .select("nomor")
    .eq("status", "MENUNGGU")
    .order("id")
    .limit(5);

  setMenunggu(waiting || []);
}

  return (
    <main className="min-h-screen bg-blue-900 text-white">

<div className="grid grid-cols-1 lg:grid-cols-3 min-h-screen">

        {/* Panel Nomor */}
     <div className="lg:col-span-2 flex flex-col justify-center items-center">

<div className="w-full flex items-center justify-between px-4 md:px-10 py-4">

  <div className="flex items-center gap-4">

   <Image
  src="/logoimipas.png"
  alt="Logo Kemenimipas"
  width={60}
  height={60}
  className="md:w-20 md:h-20"
/>

    <div>
  <h1 className="text-3xl md:text-5xl font-bold">
        SIAP
      </h1>

     <p className="text-sm md:text-xl leading-tight">
        Balai Pemasyarakatan Kelas I Jakarta Barat
      </p>
    </div>

  </div>

  <div className="flex items-center gap-4">

   <Image
  src="/maskot-elbar-2026.png"
  alt="Maskot"
  width={110}
  height={110}
  className="hidden lg:block"
/>
   <div className="text-right">

  <div className="text-4xl font-bold">
    {jam}
  </div>

<div className="text-sm mt-1">
  {new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })}
</div>
</div>

</div>

</div>       
          <p className="text-3xl mt-10">
            NOMOR YANG DIPANGGIL
          </p>

       <div
  key={dipanggil?.nomor}
 className={`
  mt-8
  text-[150px]
  font-black
  transition-all
  duration-300
  animate-call
  ${blink ? "animate-blink text-yellow-300 scale-110" : "text-white"}
`}
>
  {dipanggil?.nomor ?? "---"}
</div>

          <div className="text-5xl">
<div className="mt-6 text-center">
  <div className="text-2xl text-gray-200">
    SILAKAN MENUJU
  </div>

  <div className="text-6xl font-bold text-yellow-300 mt-2">
    LOKET {dipanggil?.loket ?? "-"}
  </div>
</div>
<div className="mt-16 text-center">
  <h2 className="text-3xl font-bold mb-4">
    Antrean Berikutnya
  </h2>

  <div className="flex gap-4 justify-center flex-wrap">
    {menunggu.map((item) => (
      <div
        key={item.nomor}
        className="bg-white text-blue-900 rounded-xl px-6 py-4 text-4xl font-bold shadow"
      >
        {item.nomor}
      </div>
    ))}
  </div>
</div>
          </div>

        </div>

        {/* Panel Video */}
     <div className="hidden lg:flex bg-black items-center justify-center">

          <video
            src="/videobapas.mp4"
            autoPlay
            muted
            loop
            controls={false}
            className="w-full h-full object-cover"
          />

        </div>

      </div>
<div className="bg-yellow-400 overflow-hidden py-4">
  <div className="animate-marquee whitespace-nowrap text-black text-5xl font-extrabold">
    {runningText}
    {"     •     "}
    {runningText}
    {"     •     "}
    {runningText}
    {"     •     "}
    {runningText}
  </div>
</div>
    </main>
  );
}