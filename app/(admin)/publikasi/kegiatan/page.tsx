"use client";

import { useEffect, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  MapPin,
  ClipboardList,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Agenda = {
  id: number;
  judul: string;
  tanggal: string;
  jam: string | null;
  lokasi: string | null;
  penanggung_jawab: string | null;
  status: string | null;
};

export default function KegiatanPage() {
  const router = useRouter();

  const [kegiatan, setKegiatan] = useState<Agenda[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadKegiatan();
  }, []);

  const loadKegiatan = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("agenda")
        .select("*")
        .order("tanggal", { ascending: false })
        .order("jam", { ascending: true });

      if (error) {
        console.error("Gagal memuat kegiatan:", error);
        return;
      }

      setKegiatan((data || []) as Agenda[]);
    } catch (error) {
      console.error("Terjadi kesalahan:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatTanggal = (tanggal: string) => {
    if (!tanggal) return "-";

    const date = new Date(`${tanggal}T00:00:00`);

    return date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const statusStyle = (status: string | null) => {
    if (status === "Selesai") {
      return "bg-green-100 text-green-700";
    }

    if (status === "Berlangsung") {
      return "bg-blue-100 text-blue-700";
    }

    return "bg-amber-100 text-amber-700";
  };

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
            <CalendarDays size={22} />
          </div>

          <div>
            <h1 className="text-lg font-bold text-slate-900">
              Kegiatan
            </h1>

            <p className="text-xs text-slate-500">
              Dokumentasi dan informasi kegiatan Bapas Kelas I Jakarta Barat
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
              <CalendarDays size={30} />
            </div>

            <div>
              <h2 className="text-2xl font-bold">
                Kegiatan Bapas
              </h2>

              <p className="mt-1 text-sm text-blue-100">
                Informasi kegiatan Bapas Kelas I Jakarta Barat
              </p>
            </div>

          </div>
        </div>

        {/* LOADING */}
        {loading ? (
          <div className="flex min-h-[300px] items-center justify-center rounded-3xl bg-white shadow-sm">
            <div className="text-center">
              <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-blue-100 border-t-blue-700" />

              <p className="text-sm text-slate-500">
                Memuat kegiatan...
              </p>
            </div>
          </div>
        ) : kegiatan.length === 0 ? (

          /* KOSONG */
          <div className="flex min-h-[350px] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">

            <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-blue-100 text-blue-800">
              <ClipboardList size={38} />
            </div>

            <h3 className="text-xl font-bold text-slate-900">
              Belum Ada Kegiatan
            </h3>

            <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
              Belum terdapat kegiatan yang tercatat pada sistem.
            </p>

          </div>

        ) : (

          /* DAFTAR KEGIATAN */
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">

            {kegiatan.map((item) => (

              <article
                key={item.id}
                className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
              >

                {/* HEADER CARD */}
                <div className="bg-gradient-to-r from-blue-950 to-blue-700 p-5 text-white">

                  <div className="flex items-start justify-between gap-3">

                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-white/10">
                      <CalendarDays size={24} />
                    </div>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${statusStyle(
                        item.status
                      )}`}
                    >
                      {item.status || "Belum Dilaksanakan"}
                    </span>

                  </div>

                  <h3 className="mt-5 line-clamp-2 text-lg font-bold">
                    {item.judul}
                  </h3>

                </div>

                {/* DETAIL */}
                <div className="space-y-4 p-5">

                  <div className="flex items-start gap-3">
                    <CalendarDays
                      size={18}
                      className="mt-0.5 flex-shrink-0 text-blue-700"
                    />

                    <div>
                      <p className="text-xs font-semibold text-slate-400">
                        TANGGAL
                      </p>

                      <p className="mt-1 text-sm font-semibold text-slate-700">
                        {formatTanggal(item.tanggal)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Clock
                      size={18}
                      className="mt-0.5 flex-shrink-0 text-blue-700"
                    />

                    <div>
                      <p className="text-xs font-semibold text-slate-400">
                        WAKTU
                      </p>

                      <p className="mt-1 text-sm font-semibold text-slate-700">
                        {item.jam ? `${item.jam} WIB` : "-"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <MapPin
                      size={18}
                      className="mt-0.5 flex-shrink-0 text-blue-700"
                    />

                    <div>
                      <p className="text-xs font-semibold text-slate-400">
                        LOKASI
                      </p>

                      <p className="mt-1 text-sm font-semibold text-slate-700">
                        {item.lokasi || "-"}
                      </p>
                    </div>
                  </div>

                  {item.penanggung_jawab && (
                    <div className="border-t border-slate-100 pt-4">
                      <p className="text-xs font-semibold text-slate-400">
                        PENANGGUNG JAWAB
                      </p>

                      <p className="mt-1 text-sm font-semibold text-slate-700">
                        {item.penanggung_jawab}
                      </p>
                    </div>
                  )}

                </div>

              </article>

            ))}

          </div>

        )}

      </main>
    </div>
  );
}