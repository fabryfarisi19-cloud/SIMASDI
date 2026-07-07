"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";


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
const [jam, setJam] = useState("");

  useEffect(() => {
    loadData();
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
      .subscribe();

   return () => {
  clearInterval(timer);
  supabase.removeChannel(channel);
};

  }, []);

  async function loadData() {
  // Nomor yang sedang dipanggil
  const { data } = await supabase
    .from("antrian")
    .select("id,nomor,loket")
    .eq("status", "DIPANGGIL")
    .order("called_at", { ascending: false })
    .limit(1)
    .single();

  if (data) {
    setDipanggil(data);
  } else {
    setDipanggil(null);
  }

  // 5 antrean berikutnya
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

      <div className="grid grid-cols-3 h-screen">

        {/* Panel Nomor */}
        <div className="col-span-2 flex flex-col justify-center items-center">

          <div className="w-full flex justify-between items-center px-10">

  <div>
    <h1 className="text-5xl font-bold">
      SIANTAR
    </h1>

    <p className="text-xl mt-2">
      Balai Pemasyarakatan Kelas I Jakarta Barat
    </p>
  </div>

  <div className="text-right">
    <div className="text-5xl font-bold">
      {jam}
    </div>

    <div className="text-xl">
      WIB
    </div>
  </div>

</div>

          <p className="text-3xl mt-10">
            NOMOR YANG DIPANGGIL
          </p>

          <div className="text-[140px] font-black mt-8">
            {dipanggil?.nomor ?? "---"}
          </div>

          <div className="text-5xl">
       <div className="text-5xl">
  LOKET {dipanggil?.loket ?? "-"}
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
        <div className="bg-black flex items-center justify-center">

          <video
            src="/video-5s.mp4"
            autoPlay
            muted
            loop
            controls={false}
            className="w-full h-full object-cover"
          />

        </div>

      </div>

      <div className="bg-yellow-400 text-black text-3xl py-4 px-8 font-bold overflow-hidden whitespaceS-nowrap">
        Selamat Datang di Balai Pemasyarakatan Kelas I Jakarta Barat • Harap menunggu hingga nomor Anda dipanggil.
      </div>

    </main>
  );
}