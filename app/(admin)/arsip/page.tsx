"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function ArsipPage() {
  const [file, setFile] = useState<File | null>(null);
  const [kategori, setKategori] = useState("");
  const [arsip, setArsip] = useState<any[]>([]);
  const [cari, setCari] = useState("");

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
 await supabase
  .from("arsip_digital")
  .delete()
   .eq("id", item.id);

   loadArsip();
    };

  return (
   <div style={{ padding: "20px" }}>
  <h2>Arsip Digital</h2>
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
    accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,*/*"
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
              <th>File</th>
              <th>Aksi</th>
            </tr>
          </thead>

          <tbody>
            
            {arsip
  .filter(
    (item) =>
      item.nama_dokumen
        ?.toLowerCase()
        .includes(cari.toLowerCase()) ||
      item.kategori
        ?.toLowerCase()
        .includes(cari.toLowerCase())
  )
  .map((item) => (
              <tr key={item.id}>
                <td>{item.nama_dokumen}</td>
                <td>{item.kategori}</td>

                <td>
                  <a
                    href={item.file_url}
                    target="_blank"
                  >
                    Lihat
                  </a>
                </td>

                <td>
                  <button
                    onClick={() => hapusFile(item)}
                  >
                    Hapus
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
                                                                                                                                                                                
                                                                                                                                                                            
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          