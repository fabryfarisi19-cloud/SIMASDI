"use client";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/TextLayer.css";
import "react-pdf/dist/Page/AnnotationLayer.css";
pdfjs.GlobalWorkerOptions.workerSrc =
  `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
export default function PreviewSurat() {

  const { id } = useParams();  
 const router = useRouter();
  const [surat, setSurat] = useState<any>(null);
  const [zoom, setZoom] = useState(1.2);
  const [numPages, setNumPages] = useState(0);
const [pageNumber, setPageNumber] = useState(1);
  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setPageNumber(1);
  };

  const loadSurat = async () => {
    const { data, error } = await supabase
      .from("surat_masuk")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error(error);
      return;
    }

    setSurat(data);
  };
  useEffect(() => {
    loadSurat();
  }, [id]);

  return (
    <div className="min-h-screen bg-slate-100 p-6">

     <div className="bg-white rounded-3xl shadow-xl">

        <div className="border-b p-5 flex items-center justify-between">
<div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
<div className="lg:col-span-3">

<h1 className="text-xl font-bold text-blue-700 break-all">

  {surat?.nomor_surat &&
   surat.nomor_surat !== "-"
      ? surat.nomor_surat
      : surat?.no_agenda}

</h1>
  <p className="text-sm text-slate-500 mt-1">
    Preview Surat Masuk
  </p>

</div>
<div className="lg:col-span-5">

  <div className="grid grid-cols-2 gap-4">

  <div className="bg-white rounded-xl p-4 shadow-sm border">
  <p className="text-xs uppercase tracking-wide text-slate-500">
    Pengirim
  </p>
  <p className="mt-1 font-semibold text-slate-800">
    {surat?.asal_surat}
  </p>
</div>
  <div className="bg-white rounded-xl p-4 shadow-sm border">
  <p className="text-xs uppercase tracking-wide text-slate-500">
    Tanggal Surat
  </p>
  <p className="mt-1 font-semibold text-slate-800">
    {new Date(surat?.tanggal).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    })}
  </p>
</div>

<div className="col-span-2 bg-white rounded-xl p-4 shadow-sm border">
  <p className="text-xs uppercase tracking-wide text-slate-500">
    Perihal
  </p>
  <p className="mt-1 font-semibold text-slate-800 leading-7">
    {surat?.perihal}
  </p>
</div>

</div>   {/* penutup grid grid-cols-2 */}

</div>   {/* penutup col-span-6 */}

<div className="lg:col-span-4 flex flex-wrap items-start justify-start lg:justify-end gap-3">
  {/* Zoom */}
  <button
    onClick={() => setZoom((z) => Math.max(0.5, z - 0.2))}
    className="px-3 py-2 rounded-xl bg-slate-200 hover:bg-slate-300"
  >
    ➖
  </button>

  <button
    onClick={() => setZoom((z) => Math.min(3, z + 0.2))}
    className="px-3 py-2 rounded-xl bg-slate-200 hover:bg-slate-300"
  >
    ➕
  </button>

  {/* Navigasi Halaman */}
  <div className="flex items-center gap-2">

    <button
      disabled={pageNumber <= 1}
      onClick={() => setPageNumber((p) => p - 1)}
      className="px-3 py-2 rounded-xl bg-slate-200 disabled:opacity-50"
    >
      ◀
    </button>

    <span className="font-medium text-sm min-w-[55px] text-center">
      {pageNumber} / {numPages}
    </span>

    <button
      disabled={pageNumber >= numPages}
      onClick={() => setPageNumber((p) => p + 1)}
      className="px-3 py-2 rounded-xl bg-slate-200 disabled:opacity-50"
    >
      ▶
    </button>

  </div>

  {/* Download */}
  <a
    href={surat?.file_url}
    target="_blank"
    rel="noopener noreferrer"
    className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700"
  >
    📥 Download
  </a>

  {/* Cetak */}
  <button
    onClick={() => window.print()}
    className="px-4 py-2 rounded-xl bg-green-600 text-white hover:bg-green-700"
  >
    🖨 Cetak
  </button>

  {/* Kembali */}
  <button
    onClick={() => history.back()}
    className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300"
  >
    ← Kembali
  </button>

</div>

</div>


      </div>
<div className="overflow-auto p-6 bg-slate-100 rounded-b-3xl">

 {surat?.file_url ? (

  <div className="flex justify-center items-start">

    <Document
      file={surat.file_url}
      onLoadSuccess={onDocumentLoadSuccess}
      loading={
        <div className="flex items-center justify-center h-full">
          Memuat PDF...
        </div>
      }
      error={
        <div className="flex items-center justify-center h-full text-red-600">
          Gagal membuka PDF
        </div>
      }
    >

<Page
  pageNumber={pageNumber}
  width={1050 * zoom}
  renderTextLayer={false}
  renderAnnotationLayer={false}
/>
    </Document>

  </div>

) : (

  <div className="flex items-center justify-center h-full">

    <p className="text-slate-500">
      File PDF tidak tersedia
    </p>

  </div>

)}

</div>
    </div>
   </div> 
  );
}