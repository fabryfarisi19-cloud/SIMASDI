
"use client";

import { useEffect, useRef, useState } from "react";

type VideoInformasi = {
  id: number;
  judul: string;
  nama_file: string;
  storage_path: string;
  url: string;
  aktif: boolean;
  created_at: string;
};

export default function VideoInformasiPage() {
  const [videos, setVideos] = useState<VideoInformasi[]>([]);
  const [judul, setJudul] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [pesan, setPesan] = useState("");
  const [error, setError] = useState("");
  const [videoPreview, setVideoPreview] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function loadVideos() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/video-informasi", {
        cache: "no-store",
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Gagal memuat daftar video");
      }

      setVideos(result.data || []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Terjadi kesalahan"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadVideos();
  }, []);

  function pilihFile(selected: File | null) {
    setFile(selected);
    setPesan("");
    setError("");

    if (videoPreview) {
      URL.revokeObjectURL(videoPreview);
    }

    if (selected && selected.type === "video/mp4") {
      setVideoPreview(URL.createObjectURL(selected));
    } else {
      setVideoPreview("");
    }
  }

  useEffect(() => {
    return () => {
      if (videoPreview) {
        URL.revokeObjectURL(videoPreview);
      }
    };
  }, [videoPreview]);

  async function uploadVideo(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPesan("");
    setError("");

    if (!judul.trim()) {
      setError("Judul video wajib diisi.");
      return;
    }

    if (!file) {
      setError("Pilih file video terlebih dahulu.");
      return;
    }

    if (file.type !== "video/mp4") {
      setError("Format video harus MP4.");
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      setError("Ukuran video maksimal 50 MB.");
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("judul", judul.trim());
      formData.append("file", file);

      const response = await fetch("/api/video-informasi", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Upload video gagal.");
      }

      setPesan("Video berhasil diunggah. Aktifkan video jika ingin menampilkannya di Display TV.");
      setJudul("");
      setFile(null);
      setVideoPreview("");

      if (fileRef.current) {
        fileRef.current.value = "";
      }

      await loadVideos();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload gagal.");
    } finally {
      setUploading(false);
    }
  }

  async function aktifkanVideo(video: VideoInformasi) {
    if (video.aktif) return;

    const yakin = window.confirm(
      `Aktifkan video "${video.judul}" untuk Display TV?`
    );

    if (!yakin) return;

    setPesan("");
    setError("");

    try {
      const response = await fetch("/api/video-informasi", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: video.id }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Gagal mengaktifkan video.");
      }

      setPesan("Video berhasil diaktifkan.");
      await loadVideos();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
    }
  }

  async function hapusVideo(video: VideoInformasi) {
    if (video.aktif) {
      setError("Video yang aktif tidak dapat dihapus. Aktifkan video lain terlebih dahulu.");
      return;
    }

    const yakin = window.confirm(
      `Hapus video "${video.judul}" secara permanen?`
    );

    if (!yakin) return;

    setPesan("");
    setError("");

    try {
      const response = await fetch("/api/video-informasi", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: video.id }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Gagal menghapus video.");
      }

      setPesan("Video berhasil dihapus.");
      await loadVideos();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
    }
  }

  return (
    <main className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          Video Informasi
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Kelola video yang ditampilkan pada Display TV SIANTAR.
        </p>
      </div>

      {pesan && (
        <div role="status" className="rounded-lg border border-green-200 bg-green-50 p-3 text-green-800">
          {pesan}
        </div>
      )}

      {error && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-red-700">
          {error}
        </div>
      )}

      <section className="rounded-xl border bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-slate-800">
          Upload Video Baru
        </h2>

        <form onSubmit={uploadVideo} className="space-y-4">
          <div>
            <label htmlFor="judul-video" className="mb-1 block text-sm font-medium text-slate-700">
              Judul video
            </label>
            <input
              id="judul-video"
              type="text"
              value={judul}
              onChange={(e) => setJudul(e.target.value)}
              maxLength={150}
              required
              placeholder="Contoh: Informasi Layanan Bapas"
              className="w-full rounded-lg border px-3 py-2 text-slate-800"
            />
          </div>

          <div>
            <label htmlFor="file-video" className="mb-1 block text-sm font-medium text-slate-700">
              File video (MP4, maksimal 50 MB)
            </label>
            <input
              ref={fileRef}
              id="file-video"
              type="file"
              accept="video/mp4,.mp4"
              required
              onChange={(e) => pilihFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-slate-700"
            />
          </div>

          {videoPreview && (
            <div>
              <p className="mb-2 text-sm font-medium text-slate-700">
                Pratinjau video
              </p>
              <video
                src={videoPreview}
                controls
                playsInline
                className="max-h-80 w-full rounded-lg bg-black"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={uploading}
            className="rounded-lg bg-blue-700 px-5 py-2.5 font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {uploading ? "Mengunggah..." : "Upload Video"}
          </button>
        </form>
      </section>

      <section className="rounded-xl border bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-slate-800">
            Daftar Video
          </h2>
          <button
            type="button"
            onClick={() => void loadVideos()}
            disabled={loading}
            className="rounded-lg border px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Muat Ulang
          </button>
        </div>

        {loading ? (
          <p className="py-6 text-center text-slate-500">
            Memuat daftar video...
          </p>
        ) : videos.length === 0 ? (
          <p className="py-6 text-center text-slate-500">
            Belum ada video. Silakan upload video pertama.
          </p>
        ) : (
          <div className="space-y-4">
            {videos.map((video) => (
              <article
                key={video.id}
                className="rounded-lg border p-4"
              >
                <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
                  <div className="min-w-0">
                    <h3 className="break-words font-semibold text-slate-800">
                      {video.judul}
                    </h3>
                    <p className="mt-1 break-all text-sm text-slate-500">
                      {video.nama_file}
                    </p>
                    <p className="mt-2 text-sm">
                      Status:{" "}
                      <span className={video.aktif ? "font-bold text-green-700" : "text-slate-500"}>
                        {video.aktif ? "Aktif di Display TV" : "Tidak Aktif"}
                      </span>
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-2">
                    {!video.aktif && (
                      <button
                        type="button"
                        onClick={() => void aktifkanVideo(video)}
                        className="rounded-lg bg-green-700 px-3 py-2 text-sm font-semibold text-white hover:bg-green-800"
                      >
                        Aktifkan
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => void hapusVideo(video)}
                      disabled={video.aktif}
                      title={video.aktif ? "Aktifkan video lain terlebih dahulu" : "Hapus video"}
                      className="rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
