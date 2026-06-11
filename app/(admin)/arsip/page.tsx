"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function ArsipPage() {
  const [file, setFile] = useState<File | null>(null);
  const [kategori, setKategori] = useState("");
  const [filterKategori, setFilterKategori] = useState("Semua");
  const [arsip, setArsip] = useState<any[]>([]);
  const [cari, setCari] = useState("");
  const [filterTanggal, setFilterTanggal] = useState("");

   useEffect(() => {
  loadArsip();
   }, []);

  const loadArsip = async () => {
 const { data } = await supabase
  .from("arsip_digital")
  .select("*")
  .order("id", { ascending: false });

  setArsip(data || []);
  };

 const uploadFile = async () => {
 if (!file) return alert("Pilih file");

 const fileName = Date.now() + "-" + file.name;

 const { error: uploadError } = await supabase.storage
 .from("arsip")
 .upload(fileName, file);

 if (uploadError) {
 alert(uploadError.message);
   return;
     }

  const { data } = supabase.storage
  .from("arsip")
 .getPublicUrl(fileName);

await supabase.from("arsip_digital").insert({
  nama_dokumen: file.name,
  kategori,
  file_url: data.publicUrl,
  created_at: new Date().toISOString(),
});

  alert("Upload berhasil");

 setFile(null);
  setKategori("");

loadArsip();
 };
  const exportPDF = () => {
 const doc = new jsPDF();

doc.text("Laporan Arsip Digital SIMASDI", 14, 15);

 autoTable(doc, {
   head: [["Dokumen", "Kategori"]],
  body: arsip.map((item) => [
  item.nama_dokumen,
  item.kategori,
   ]),
   });

doc.save("laporan-arsip.pdf");
 };
                                                                                                                                                                                          
const hapusFile = async (item: any) => {
  const yakin = confirm(
    `Yakin ingin menghapus arsip "${item.nama_dokumen}"?`
  );

  if (!yakin) return;

  await supabase
    .from("arsip_digital")
    .delete()
    .eq("id", item.id);

  loadArsip();
};

const editKategori = async (item: any) => {
  const kategoriBaru = prompt(
    "Masukkan kategori baru:",
    item.kategori
  );

  if (!kategoriBaru) return;

  await supabase
    .from("arsip_digital")
    .update({ kategori: kategoriBaru })
    .eq("id", item.id);

  loadArsip();
};

return (
  <div style={{ padding: "20px" }}>
  <h2>Arsip Digital</h2>
  <br />

<div
  style={{
    display: "flex",
    gap: "15px",
    marginBottom: "20px",
  }}
>
  <div
    style={{
      background: "#2563eb",
      color: "white",
      padding: "15px",
      borderRadius: "10px",
      minWidth: "180px",
      textAlign: "center",
    }}
  >
    <h3>{arsip.length}</h3>
    <p>Total Arsip</p>
  </div>

  <div
    style={{
      background: "#16a34a",
      color: "white",
      padding: "15px",
      borderRadius: "10px",
      minWidth: "180px",
      textAlign: "center",
    }}
  >
    <h3>
      {
        arsip.filter(
          (item) =>
            item.kategori &&
            item.kategori.toLowerCase() === "surat masuk"
        ).length
      }
    </h3>
    <p>Surat Masuk</p>
  </div>

  <div
    style={{
      background: "#ea580c",
      color: "white",
      padding: "15px",
      borderRadius: "10px",
      minWidth: "180px",
      textAlign: "center",
    }}
  >
    <h3>
      {
        arsip.filter(
          (item) =>
            item.kategori &&
            item.kategori.toLowerCase() === "surat keluar"
        ).length
      }
    </h3>
    <p>Surat Keluar</p>
  </div>
</div>
  <br />

<input
  type="text"
  placeholder="Cari berdasarkan nama atau kategori..."
  value={cari}
  onChange={(e) => setCari(e.target.value)}
  style={{
    width: "100%",
    padding: "8px",
    marginBottom: "15px",
  }}
  />
<br />

<input
  type="date"
  value={filterTanggal}
  onChange={(e) => setFilterTanggal(e.target.value)}
  style={{
    padding: "8px",
    marginBottom: "15px",
  }}
/>
    
  <div  
  style={{
   background: "white",
 padding: "20px",
   borderRadius: "10px",
  marginBottom: "20px",
    }}
    >

  <input
   type="file"
    accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
   onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)} /><input
   placeholder="Kategori Arsip"
  value={kategori}
   onChange={(e) => setKategori(e.target.value)} /><br /><br /><button onClick={uploadFile}>
          Upload Arsip
        </button><button
          onClick={exportPDF}
          style={{
            marginLeft: "10px",
            padding: "8px 12px",
          }}
        >
          📄 Cetak Laporan PDF
        </button><table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            background: "white",
          }}
        >
          <thead>
<tr>
  <th>Dokumen</th>
  <th>Kategori</th>
  <th>Tanggal</th>
  <th>File</th>
  <th>Download</th>
  <th>Aksi</th>
</tr>
          </thead>

          <tbody>
            
            {arsip
  .filter((item) => {
    const cocokCari =
      item.nama_dokumen
        ?.toLowerCase()
        .includes(cari.toLowerCase()) ||
      item.kategori
        ?.toLowerCase()
        .includes(cari.toLowerCase());

    const cocokKategori =
      filterKategori === "Semua" ||
      item.kategori === filterKategori;

    return cocokCari && cocokKategori;
  })
  .map((item) => (
              <tr key={item.id}>
  <td>{item.nama_dokumen}</td>
<td>{item.kategori}</td>
<td>
  {item.created_at
    ? new Date(item.created_at).toLocaleDateString("id-ID")
    : "-"}
</td>

<td>
  {item.file_url && item.file_url.match(/\.(jpg|jpeg|png)$/i) ? (
    <img
      src={item.file_url}
      alt={item.nama_dokumen}
      style={{
        width: "80px",
        height: "80px",
        objectFit: "cover",
        borderRadius: "5px",
      }}
    />
  ) : (
    <a
      href={item.file_url}
      target="_blank"
      rel="noreferrer"
    >
      Lihat File
    </a>
  )}
</td>
<td>
  <a
    href={item.file_url}
    download={item.nama_dokumen}
    style={{
      textDecoration: "none",
      padding: "5px 10px",
      background: "#2563eb",
      color: "white",
      borderRadius: "5px",
    }}
  >
    ⬇️ Download
  </a>
</td>
<td>
 <button
  onClick={() => editKategori(item)}
  style={{
    marginRight: "8px",
    padding: "5px 10px",
    background: "#f59e0b",
    color: "white",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
  }}
>
  ✏️ Edit
</button>
<button
  onClick={() => hapusFile(item)}
  style={{
    padding: "5px 10px",
    background: "#dc2626",
    color: "white",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
  }}
>
  🗑️ Hapus
</button>
</td>
    </tr>
            ))}
          </tbody>
       
   </table>
  </div>
  </div>
   );
   }
                                                                                                                                                                                
                                                                                                                                                                            
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          