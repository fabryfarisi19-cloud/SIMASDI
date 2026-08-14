"use client";

import {
  ArrowLeft,
  PlayCircle,
  Video,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

const videoDummy = [
  {
    id: 1,
    judul: "Video Aksi Perubahan SIMASDI",
    tanggal: "Dokumentasi SIMASDI",
    video: "/publikasi/video/videosimasdi.mp4",
  },
  {
    id: 2,
    judul: "Kegiatan Bapas Kelas I Jakarta Barat",
    tanggal: "Dokumentasi Kegiatan",
    video: "/publikasi/video/video2.mp4",
  },
  {
    id: 3,
    judul: "Pelayanan Bapas",
    tanggal: "Dokumentasi Pelayanan",
    video: "/publikasi/video/video3.mp4",
  },
  {
    id: 4,
    judul: "Publikasi Bapas Jakarta Barat",
    tanggal: "Dokumentasi Publikasi",
    video: "/publikasi/video/video4.mp4",
  },
];

export default function VideoPage() {
  const router = useRouter();

  const [videoTerpilih, setVideoTerpilih] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-slate-100">

      {/* HEADER */}
      <header className="sticky top-0 z-40 border-b bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-4">

          <button
            onClick={() => router.back()}
            className="rounded-xl p-2 transition hover:bg-slate-100"
          >
            <ArrowLeft size={22} />
          </button>

          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-900 text-white">
            <Video size={22} />
          </div>

          <div>
            <h1 className="text-lg font-bold text-slate-900">
              Video
            </h1>

            <p className="text-xs text-slate-500">
              Publikasi video Bapas Kelas I Jakarta Barat
            </p>
          </div>

        </div>
      </header>

      {/* CONTENT */}
      <main className="mx-auto max-w-7xl px-4 py-8">

        {/* BANNER */}
        <div className="mb-8 overflow-hidden rounded-3xl bg-gradient-to-r from-blue-950 via-blue-900 to-blue-700 p-7 text-white shadow-xl">

          <div className="flex items-center gap-4">

            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10">
              <PlayCircle size={30} />
            </div>

            <div>
              <h2 className="text-2xl font-bold">
                Video Publikasi
              </h2>

              <p className="mt-1 text-sm text-blue-100">
                Dokumentasi video dan publikasi Bapas Kelas I Jakarta Barat
              </p>
            </div>

          </div>
        </div>

        {/* VIDEO GRID */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">

          {videoDummy.map((item) => (

            <button
              key={item.id}
              onClick={() => setVideoTerpilih(item.video)}
              className="group overflow-hidden rounded-3xl bg-white text-left shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
            >

              {/* VIDEO PREVIEW */}
              <div className="relative aspect-video overflow-hidden bg-slate-900">

                <video
                  src={item.video}
                  className="h-full w-full object-cover"
                  muted
                  preload="metadata"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />

                {/* PLACEHOLDER */}
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-blue-950 to-slate-900 text-white">

                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm">
                    <PlayCircle size={38} />
                  </div>

                  <span className="mt-3 text-xs font-semibold text-blue-200">
                    Video belum tersedia
                  </span>

                </div>

                {/* PLAY BUTTON */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition group-hover:bg-black/30">

                  <div className="scale-75 rounded-full bg-white p-3 opacity-0 shadow-xl transition group-hover:scale-100 group-hover:opacity-100">

                    <PlayCircle
                      size={26}
                      className="text-blue-800"
                    />

                  </div>

                </div>

              </div>

              {/* INFO */}
              <div className="p-4">

                <h3 className="line-clamp-2 text-sm font-bold text-slate-800">
                  {item.judul}
                </h3>

                <p className="mt-1 text-xs text-slate-400">
                  {item.tanggal}
                </p>

              </div>

            </button>

          ))}

        </div>

      </main>

      {/* VIDEO PLAYER */}
      {videoTerpilih && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
          onClick={() => setVideoTerpilih(null)}
        >

          <button
            onClick={() => setVideoTerpilih(null)}
            className="absolute right-5 top-5 z-10 rounded-full bg-white/10 p-3 text-white transition hover:bg-white/20"
          >
            <X size={24} />
          </button>

          <video
            src={videoTerpilih}
            controls
            autoPlay
            className="max-h-[85vh] max-w-[95vw] rounded-2xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />

        </div>
      )}

    </div>
  );
}