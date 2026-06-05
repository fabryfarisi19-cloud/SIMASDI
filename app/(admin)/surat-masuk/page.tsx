"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function SuratMasukPage() {
  const [surat, setSurat] = useState<any[]>([]);

    const loadData = async () => {
 const { data, error } = await supabase
   .from("surat_masuk")
     .select("*")
       .order("id", { ascending: false });

       console.log("DATA:", data);
       console.log("ERROR:", error);

       setSurat(data || []);
                      };

         useEffect(() => {
                  loadData();
             }, []);

        return (
  <div style={{ padding: "20px" }}>
    <h1>Surat Masuk</h1>

   <button onClick={loadData}>
       Refresh
         </button>

        <table border={1} cellPadding={10}>
          <thead>
    <tr>
   <th>No Agenda</th>
   <th>Nomor Surat</th>
  <th>Asal Surat</th>
   <th>Perihal</th>
    <th>Aksi</th>
        </tr>
     </thead>

    <tbody>
     {surat.map((item) => (
     <tr key={item.id}>
      <td>{item.no_agenda}</td>   
         <td>{item.no_agenda}</td>
      <td>{item.nomor_surat}</td>
     <td>{item.asal_surat}</td>
     <td>{item.perihal}</td>

    <td>
        
      <button
     onClick={async () => {
    const tujuan = prompt("Tujuan disposisi:");

    if (!tujuan) return;

    await supabase.from("disposisi").insert([
       {
      nomor_surat: item.nomor_surat,
      asal_surat: item.asal_surat,
      perihal: item.perihal,
      tujuan: tujuan,
      isi_disposisi: "Mohon ditindaklanjuti",
     status: "Menunggu",
       },
       ]);

       alert("Disposisi berhasil disimpan");
          }}
           >
          Disposisi
        </button>
        </td>

     </tr>
     ))}
     </tbody>
      </table>
      </div>
      );
      }