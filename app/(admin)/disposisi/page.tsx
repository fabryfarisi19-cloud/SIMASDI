"use client";
import { useEffect, useState } from "react"; import { supabase } from "@/lib/supabase";
export default function DisposisiPage() { 
  const [suratList, setSuratList] = useState<any[]>([]); 
  const [disposisiList, setDisposisiList] = useState<any[]>([]);
  const [suratDipilih, setSuratDipilih] = useState(""); 
  const [isiDisposisi, setIsiDisposisi] = useState(""); 
  const [tujuan, setTujuan] = useState("");
const loadSurat = async () => { 
  const { data } = await supabase .from("surat_masuk") .select("*") .order("tanggal", { ascending: false });
setSuratList(data || []);
};
const loadDisposisi = async () => {
  const { data } = await supabase
    .from("disposisi")
    .select("*")
    .order("tanggal", { ascending: false });

  setDisposisiList(data || []);
};
useEffect(() => {
  loadSurat();
  loadDisposisi();
}, []);
const simpanDisposisi = async () => {
  const surat = suratList.find(
    (s) => s.no_agenda === suratDipilih
  );

  if (!surat) {
    alert("Pilih surat terlebih dahulu");
    return;
  }

  const { error } = await supabase
    .from("disposisi")
    .insert([
      {
        nomor_surat: surat.nomor_surat,
        asal_surat: surat.asal_surat,
        perihal: surat.perihal,
        tujuan: tujuan,
        isi_disposisi: isiDisposisi,
        status: "Menunggu",
      },
    ]);

  if (error) {
    alert(error.message);
    return;
  }

  alert("✅ Disposisi berhasil disimpan");
};
const kirimWA = () => { if (!isiDisposisi) { alert("Pilih surat terlebih dahulu"); return; }
const pesan = encodeURIComponent(isiDisposisi);

window.open(
  `https://wa.me/628179888792?text=${pesan}`,
  "_blank"
);
};
return ( <div style={{ padding: "20px" }}> Disposisi Surat
<div
    style={{
      background: "white",
      padding: "15px",
      borderRadius: "10px",
      marginTop: "15px",
      boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
    }}
  >
    <select
      value={suratDipilih}
      onChange={(e) => {
        const noAgenda = e.target.value;

     setSuratDipilih(noAgenda);

   const surat = suratList.find(
     (s) => s.no_agenda === noAgenda
    );

   if (surat) {
   setIsiDisposisi(
    `Kepada Yth.
${tujuan || ".............."}
Mohon ditindaklanjuti.
Nomor Surat: ${surat.nomor_surat} Asal Surat: ${surat.asal_surat} Perihal: ${surat.perihal}` ); } }} style={{ width: "100%", padding: "10px", marginBottom: "10px", }} > Pilih Surat Masuk
{suratList.map((surat) => (
        <option
          key={surat.no_agenda}
          value={surat.no_agenda}
        >
          {surat.nomor_surat} - {surat.perihal}
        </option>
      ))}
    </select>

    <select
      value={tujuan}
      onChange={(e) => setTujuan(e.target.value)}
      style={{
        width: "100%",
        padding: "10px",
        marginBottom: "10px",
      }}
    >
      <option value="">Pilih Tujuan Disposisi</option>
      <option>Kasubbag Tata Usaha</option>
      <option>Kasi BKD</option>
      <option>Kasi BKA</option>
      <option>Kaur Umum</option>
      <option>Bendahara</option>
      <option>Pengelola BMN</option>
      <option>PK Bapas</option>
      <option>Arsiparis</option>
    </select>

    <textarea
      value={isiDisposisi}
      onChange={(e) =>
        setIsiDisposisi(e.target.value)
      }
      rows={6}
      style={{
        width: "100%",
        padding: "10px",
        marginBottom: "10px",
      }}
    />

    <div
      style={{
        display: "flex",
        gap: "10px",
        marginTop: "15px"
      }}
    >
      <button
    
  onClick={kirimWA}
  style={{
    background: "green",
    color: "white",
    padding: "8px 15px",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    height: "60px",
  }}
>
  Kirim Disposisi WA
</button>
<button
  onClick={simpanDisposisi}
  style={{
    background: "#2563eb",
    color: "white",
    padding: "8px 15px",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    height: "60px",
  }}
>
  Simpan Disposisi
</button>

      <h2
  style={{
    display: "flex",
    gap: "10px",
  }}
>
  
  Riwayat Disposisi
</h2>

<table
  style={{
    width: "100%",
    borderCollapse: "collapse",
    background: "white",
  }}
>
  <thead>
    <tr>
      <th style={{border:"1px solid #ddd",padding:"8px"}}>Nomor Surat</th>
      <th style={{border:"1px solid #ddd",padding:"8px"}}>Tujuan</th>
      <th style={{border:"1px solid #ddd",padding:"8px"}}>Status</th>
    <th style={{border:"1px solid #ddd",padding:"8px"}}>
        Aksi
        </th>
    </tr>
  </thead>

  <tbody>
    {disposisiList.map((item) => (
      <tr key={item.id}>
        <td style={{border:"1px solid #ddd",padding:"8px"}}>
          {item.nomor_surat}
        </td>

        <td style={{border:"1px solid #ddd",padding:"8px"}}>
          {item.tujuan}
        </td>

    <td style={{border:"1px solid #ddd",padding:"8px"}}>
     {item.status}
   </td>
   <td style={{border:"1px solid #ddd",padding:"8px"}}>
   <button
   onClick={async () => {
   await supabase
 .from("disposisi")
 .update({ status: "Selesai" })
  .eq("id", item.id);

  loadDisposisi();
   }}
  >
  Selesai
  </button>
   </td>
    
      </tr>
    ))}
  </tbody>
</table>
    </div>
  </div>
</div>
); }