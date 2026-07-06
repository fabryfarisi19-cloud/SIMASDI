"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import AntrianDisplay from "@/app/components/AntrianDisplay";
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
  useEffect(() => {
    loadData();

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
  const { data: setting } = await supabase
  .from("setting_siantar")
  .select("running_text")
  .eq("id", 1)
  .single();

if (setting) {
  setRunningText(setting.running_text ?? "");
}
}

  return (
    <main className="min-h-screen bg-blue-900 text-white">

      <div className="grid grid-cols-3 h-screen">

       {/* Panel Nomor */}
<div className="col-span-2 p-8 flex flex-col">

  <AntrianDisplay
    nomor={dipanggil?.nomor ?? "---"}
    loket={dipanggil?.loket ?? "-"}
  />

  <div className="mt-10 text-center">
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

        {/* Panel Video */}
        <div className="bg-black flex items-center justify-center">

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

   <div className="bg-yellow-400 overflow-hidden">
  <div className="py-4">
  <div className="running-text text-black text-3xl font-bold">
  {runningText}
</div>
  </div>
</div>

    </main>

  );
}