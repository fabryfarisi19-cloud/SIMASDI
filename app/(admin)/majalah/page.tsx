"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight, Maximize2, Download } from "lucide-react";
import { useRouter } from "next/navigation";
import HTMLFlipBook from "react-pageflip";
import * as pdfjsLib from "pdfjs-dist";

type PageProps = {
  pageNumber: number;
  image: string;
};

const PDF_URL = "/majalah/majalah-simasdi.pdf";

export default function MajalahPage() {
  const router = useRouter();
  const flipBookRef = useRef<any>(null);

  const [pages, setPages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const suaraFlip = useRef<HTMLAudioElement | null>(null);
 useEffect(() => {
  suaraFlip.current = new Audio("/sound/paperslidesound.mp3");
  suaraFlip.current.volume = 0.5;
}, []);
  const [isMobile, setIsMobile] = useState(false);
const [showThumbnails, setShowThumbnails] = useState(false);
  useEffect(() => {
    let mounted = true;
const cekMobile = () => {
  setIsMobile(window.innerWidth <= 768);
};

cekMobile();

window.addEventListener("resize", cekMobile);
    const loadPDF = async () => {
      try {
        setLoading(true);

        pdfjsLib.GlobalWorkerOptions.workerSrc =
          `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

        const pdf = await pdfjsLib.getDocument({ url: PDF_URL }).promise;

        const hasil: string[] = [];

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);

          const viewport = page.getViewport({
            scale: 1.5,
          });

          const canvas = document.createElement("canvas");
          const context = canvas.getContext("2d");

          if (!context) continue;

          canvas.width = viewport.width;
          canvas.height = viewport.height;

          await page.render({
            canvasContext: context,
            viewport,
            canvas,
          }).promise;

          hasil.push(canvas.toDataURL("image/jpeg", 0.9));
        }

        if (mounted) {
          setPages(hasil);
          setLoading(false);
        }
      } catch (error) {
        console.error("Gagal membaca PDF:", error);

        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadPDF();

  return () => {
  mounted = false;
  window.removeEventListener("resize", cekMobile);
};
  }, []);

const halamanSebelumnya = () => {
  const audio = new Audio("/sound/paperslidesound.mp3");
  audio.volume = 0.5;
  audio.play().catch(() => {});

  flipBookRef.current?.pageFlip().flipPrev();
};
const halamanBerikutnya = () => {
  const audio = new Audio("/sound/paperslidesound.mp3");
audio.volume = 0.5;
audio.play().catch(() => {});
  flipBookRef.current?.pageFlip().flipNext();
};

  const fullscreen = () => {
    const element = document.getElementById("flipbook-container");

    if (element?.requestFullscreen) {
      element.requestFullscreen();
    }
  };

  return (
 <div
  id="flipbook-container"
  className="min-h-screen bg-[radial-gradient(circle_at_center,_#1e3a8a_0%,_#0f172a_45%,_#020617_100%)] text-white"
>
      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="rounded-xl bg-white/10 p-2 hover:bg-white/20"
            >
              <ArrowLeft size={21} />
            </button>

            <div>
              <h1 className="text-lg font-bold">
                Majalah SIMASDI
              </h1>

              <p className="text-xs text-blue-200">
                Sistem Informasi Manajemen Arsip Digital
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
  onClick={() => setShowThumbnails(!showThumbnails)}
  className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold transition hover:bg-white/20"
>
  📑
  <span className="hidden md:inline">
    Thumbnail
  </span>
</button>
            <button
              onClick={fullscreen}
              
        className="flex items-center gap-2 rounded-xl px-5 py-3 font-semibold transition hover:bg-white/10 active:scale-95"
            >
              <Maximize2 size={17} />
              <span className="hidden md:inline">
                Fullscreen
              </span>
            </button>
            <a
  href={PDF_URL}
  download="Majalah-SIMASDI.pdf"
  className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
>
  <Download size={17} />
  <span className="hidden md:inline">
    Download
  </span>
</a>
          </div>
        </div>
      </header>
{showThumbnails && pages.length > 0 && (
  <div className="fixed bottom-20 left-1/2 z-[9999] flex max-w-[94vw] -translate-x-1/2 gap-1.5 overflow-x-auto rounded-2xl border border-white/10 bg-slate-950/95 p-2 shadow-2xl backdrop-blur-md sm:gap-2 sm:p-3">
    {pages.map((image, index) => (
      <button
        key={index}
        onClick={() => {
          flipBookRef.current?.pageFlip().flip(index);
          setCurrentPage(index + 1);
        }}
        className={`flex-shrink-0 overflow-hidden rounded-lg border-2 transition ${
        currentPage === index + 1 || currentPage === index
            ? "border-yellow-400 shadow-lg shadow-yellow-400/20"
            : "border-white/10 hover:border-blue-400"
        }`}
        title={`Halaman ${index + 1}`}
      >
        <img
          src={image}
          alt={`Thumbnail halaman ${index + 1}`}
      className="h-16 w-11 object-cover sm:h-20 sm:w-14 md:h-24 md:w-16"
          draggable={false}
        />

        <div className="bg-black/70 py-1 text-center text-[10px] text-white">
          {index + 1}
        </div>
      </button>
    ))}
  </div>
)}
      {/* FLIPBOOK */}
   <main className="flex min-h-[calc(100vh-73px)] flex-col items-center justify-center px-2 py-6 md:px-4 md:py-8">
        {loading ? (
          <div className="flex flex-col items-center gap-4">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-white/20 border-t-yellow-400" />

            <p className="text-sm text-blue-100">
              Menyiapkan Majalah SIMASDI...
            </p>
          </div>
        ) : pages.length === 0 ? (
          <div className="rounded-2xl bg-red-500/10 p-6 text-center">
            <p className="font-semibold">
              Majalah tidak dapat dibuka.
            </p>

            <p className="mt-2 text-sm text-red-200">
              Pastikan file PDF tersedia di:
            </p>

            <code className="mt-2 block text-xs">
              public/majalah/majalah-simasdi.pdf
            </code>
          </div>
        ) : (
          <>
            <div className="mb-5 text-center">
              <h2 className="text-2xl font-bold">
                📖 Majalah SIMASDI
              </h2>

              <p className="mt-1 text-sm text-blue-200">
                Baca majalah dengan membalik halaman
              </p>
            </div>

      <div className="w-full max-w-[1100px] overflow-hidden rounded-2xl border border-white/10 bg-black/30 p-2 shadow-[0_25px_80px_rgba(0,0,0,0.55)] backdrop-blur-sm md:p-4">
            <HTMLFlipBook
  ref={flipBookRef}
  width={isMobile ? 340 : 850}
  height={isMobile ? 480 : 1100}
  size="stretch"
               minWidth={280}
maxWidth={1000}
minHeight={390}
maxHeight={750}
                maxShadowOpacity={0.6}
                showCover={true}
                mobileScrollSupport={true}
                className="mx-auto"
                style={{}}
                startPage={0}
                drawShadow={true}
                flippingTime={900}
               usePortrait={isMobile}
                startZIndex={0}
                autoSize={true}
                clickEventForward={true}
                useMouseEvents={true}
                swipeDistance={30}
                showPageCorners={true}
               disableFlipByClick={false}
onFlip={(e: any) => {
  setCurrentPage(e.data + 1);
}}
              >
                {pages.map((image, index) => (
                  <div
                    key={index}
                    className="flex h-full w-full items-center justify-center bg-white"
                  >
                    <img
                      src={image}
                      alt={`Halaman ${index + 1} Majalah SIMASDI`}
                      className="h-full w-full object-contain"
                      draggable={false}
                    />
                  </div>
                ))}
              </HTMLFlipBook>
            </div>

            {/* NAVIGASI */}
         <div className="mt-6 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-2 shadow-lg backdrop-blur-md">
              <button
                onClick={halamanSebelumnya}
                className="flex items-center gap-2 rounded-xl bg-white/10 px-5 py-3 font-semibold transition hover:bg-white/20"
              >
                <ChevronLeft size={20} />
                Sebelumnya
              </button>

             <div className="rounded-xl bg-white/10 px-5 py-3 text-sm font-semibold">
  Halaman {currentPage}–{Math.min(currentPage + 1, pages.length)} /{" "}
  {pages.length}
</div>

              <button
                onClick={halamanBerikutnya}
              className="flex items-center gap-2 rounded-xl px-5 py-3 font-semibold transition hover:bg-white/10 active:scale-95"
              >
                Berikutnya
                <ChevronRight size={20} />
              </button>
            </div>

            <p className="mt-4 text-center text-xs text-blue-300">
              💡 Klik sudut halaman atau gunakan tombol navigasi
            </p>
          </>
        )}
      </main>
    </div>
  );
}