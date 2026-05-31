"use client";

import { supabase } from "@/lib/supabase";
import { useState, useEffect } from "react";

export default function AgendaPage() {
    
  const [tanggal, setTanggal] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [catatan, setCatatan] = useState("");
  const [agendaList, setAgendaList] = useState<any[]>([]);

const loadAgenda = async () => {
  const { data } = await supabase
    .from("agenda")
    .select("*")
    .order("tanggal", { ascending: true });

  setAgendaList(data || []);
};

useEffect(() => {
  loadAgenda();
}, []);

 
  const simpanAgenda = async () => {
  const { error } = await supabase
    .from("agenda")
    .insert([
      {
        tanggal: tanggal,
        judul: "Agenda Kegiatan",
        keterangan: catatan,
      },
    ]);

  if (error) {
    console.log("ERROR:" + error.message);
    alert(error.message);
  } else {
    alert("Agenda berhasil disimpan");
    setCatatan("");
    loadAgenda(); // Reload the agenda list
  }
};
  return (
    <div style={{ padding: "20px" }}>
      <h1>Agenda Kegiatan</h1>

      <input
        type="date"
        value={tanggal}
        onChange={(e) => setTanggal(e.target.value)}
      />

      <br /><br />

      <textarea
        value={catatan}
        onChange={(e) => setCatatan(e.target.value)}
        placeholder="Tulis agenda kegiatan..."
        rows={5}
        style={{
          width: "100%",
          padding: "10px",
        }}
      />

      <br /><br />

     <button
  onClick={simpanAgenda}
  style={{
    padding: "10px 20px",
    background: "#25eb53",
    color: "white",
    border: "none",
    cursor: "pointer",
  }}
>
  Simpan Agenda
</button>
<hr style={{ margin: "20px 0" }} />

<h2>Daftar Agenda</h2>

{agendaList.map((item) => (
  <div
    key={item.id}
    style={{
      border: "1px solid #ddd",
      padding: "10px",
      marginTop: "10px",
      borderRadius: "5px",
    }}
  >
    <strong>{item.tanggal}</strong>
    <br />
    {item.keterangan}
    <br /><br />

<button
  onClick={async () => {
  if (!confirm("Yakin ingin menghapus agenda ini?")) {
  return;
}
    const { error } = await supabase
  .from("agenda")
  .delete()
  .eq("id", item.id);

if (error) {
  alert(error.message);
} else {
  alert("✅ Agenda berhasil dihapus");
  loadAgenda();
}
  }}
  style={{
    background: "#dc2626",
    color: "white",
    border: "none",
    padding: "5px 10px",
    cursor: "pointer",
  }}
>
  Hapus
</button>
  </div>
))}
     </div> 
    );   
}