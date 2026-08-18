"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  Volume2,
  VolumeX,
  CalendarDays,
  Clock,
  MapPin,
  Users,
  Megaphone,
} from "lucide-react";

type Petugas = {
  id: string;
  tanggal: string;
  nama_petugas: string;
  jabatan: string | null;
  tugas: string;
  jam_apel: string;
  lokasi: string | null;
};

export default function PengumumanApelPage() {
  const [petugas, setPetugas] = useState<Petugas[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const [tanggal, setTanggal] = useState("");
  const [jam, setJam] = useState("");

  useEffect(() => {
    loadPetugasHariIni();

    // Periksa kembali setiap 1 menit
    const interval = setInterval(() => {
      loadPetugasHariIni();
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  async function loadPetugasHariIni() {
    setLoading(true);

    // WIB / Asia Jakarta
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Jakarta",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });

    const today = formatter.format(new Date());

    setTanggal(today);

    const { data, error } = await supabase
      .from("jadwal_apel")
      .select("*")
      .eq("tanggal", today)
      .eq("aktif", true)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Gagal mengambil jadwal apel:", error);
      setPetugas([]);
    } else {
      setPetugas(data || []);

      if (data && data.length > 0) {
        setJam(data[0].jam_apel?.slice(0, 5) || "");
      }
    }

    setLoading(false);
  }

  function formatTanggal(tgl: string) {
    if (!tgl) return "";

    return new Date(`${tgl}T00:00:00`).toLocaleDateString(
      "id-ID",
      {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }
    );
  }

  function getPetugas(tugas: string) {
    return petugas.find(
      (item) =>
        item.tugas.toLowerCase() === tugas.toLowerCase()
    );
  }

  function bicara(teks: string) {
    if (typeof window === "undefined") return;

    if (!("speechSynthesis" in window)) {
      alert("Browser tidak mendukung suara otomatis.");
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(teks);

    utterance.lang = "id-ID";
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;

    utterance.onstart = () => {
      setIsSpeaking(true);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
    };

    window.speechSynthesis.speak(utterance);
  }

  function pengumuman() {
    const pembina = getPetugas("Pembina Apel");

    if (!pembina) return;

    const teks = `
      Perhatian.

      Diberitahukan kepada seluruh pegawai
      Balai Pemasyarakatan Kelas Satu Jakarta Barat.

      Petugas apel hari ini adalah
      ${pembina.nama_petugas},
      ${pembina.jabatan || ""},

      sebagai Pembina Apel.

      Apel akan dilaksanakan pada pukul
      ${jam.replace(":", " lewat ")} WIB.

      Kepada seluruh petugas apel
      agar mempersiapkan diri dan melaksanakan
      tugas sesuai dengan tanggung jawab masing-masing.

      Apel dilaksanakan di
      Halaman Ghriya Abhipraya
      Balai Pemasyarakatan Kelas Satu Jakarta Barat.

      Terima kasih.
    `;

    bicara(teks);
  }

  function hentikanSuara() {
    if (typeof window === "undefined") return;

    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }

  const pembina = getPetugas("Pembina Apel");

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">

      {/* HEADER */}
      <div className="mx-auto max-w-6xl">

        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-2xl bg-blue-600 p-3 text-white">
            <Megaphone size={26} />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Pengumuman Petugas Apel
            </h1>

            <p className="text-sm text-gray-500">
              Sistem pengumuman otomatis SIMASDI
            </p>
          </div>
        </div>

        {/* TANGGAL & WAKTU */}
        <div className="mb-6 grid gap-4 md:grid-cols-3">

          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <CalendarDays className="text-blue-600" />

              <div>
                <p className="text-sm text-gray-500">
                  Hari / Tanggal
                </p>

                <p className="font-semibold">
                  {formatTanggal(tanggal)}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <Clock className="text-green-600" />

              <div>
                <p className="text-sm text-gray-500">
                  Waktu Apel
                </p>

                <p className="font-semibold">
                  {jam ? `${jam} WIB` : "-"}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <MapPin className="text-orange-600" />

              <div>
                <p className="text-sm text-gray-500">
                  Lokasi
                </p>

                <p className="font-semibold">
                  Ghriya Abhipraya
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* PENGUMUMAN UTAMA */}
        {loading ? (
          <div className="rounded-3xl bg-white p-12 text-center">
            Memuat jadwal apel...
          </div>
        ) : !pembina ? (
          <div className="rounded-3xl border bg-white p-12 text-center shadow-sm">

            <CalendarDays
              className="mx-auto text-gray-400"
              size={48}
            />

            <h2 className="mt-4 text-xl font-bold">
              Tidak Ada Jadwal Apel
            </h2>

            <p className="mt-2 text-gray-500">
              Belum terdapat jadwal petugas apel
              untuk hari ini.
            </p>

          </div>
        ) : (
          <>
            {/* PEMBINA */}
            <div className="overflow-hidden rounded-3xl bg-white shadow-lg">

              <div className="bg-blue-600 p-8 text-center text-white">

                <p className="text-sm font-medium uppercase tracking-widest">
                  Pengumuman
                </p>

                <h2 className="mt-2 text-3xl font-bold md:text-4xl">
                  PETUGAS APEL HARI INI
                </h2>

                <p className="mt-2 opacity-90">
                  {formatTanggal(tanggal)}
                </p>

              </div>

              <div className="p-6 md:p-10">

                <div className="rounded-3xl border bg-gray-50 p-6 text-center">

                  <p className="text-sm font-medium text-gray-500">
                    PEMBINA APEL
                  </p>

                  <h3 className="mt-2 text-3xl font-bold text-gray-900">
                    {pembina.nama_petugas}
                  </h3>

                  <p className="mt-1 text-gray-600">
                    {pembina.jabatan}
                  </p>

                </div>

                {/* TOMBOL SUARA */}
                <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">

                  <button
                    onClick={pengumuman}
                    disabled={isSpeaking}
                    className="flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 py-4 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    <Volume2 size={20} />

                    {isSpeaking
                      ? "Sedang Membacakan..."
                      : "Putar Pengumuman"}
                  </button>

                  {isSpeaking && (
                    <button
                      onClick={hentikanSuara}
                      className="flex items-center justify-center gap-2 rounded-2xl border px-6 py-4 font-semibold hover:bg-gray-100"
                    >
                      <VolumeX size={20} />
                      Hentikan
                    </button>
                  )}

                </div>

              </div>
            </div>

            {/* SUSUNAN PETUGAS */}
            <div className="mt-6 rounded-3xl bg-white p-6 shadow-sm">

              <div className="mb-5 flex items-center gap-3">
                <Users className="text-blue-600" />

                <div>
                  <h2 className="text-xl font-bold">
                    Susunan Petugas Apel
                  </h2>

                  <p className="text-sm text-gray-500">
                    {petugas.length} petugas
                  </p>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">

                {petugas.map((item) => (
                  <div
                    key={item.id}
                    className={`rounded-2xl border p-4 ${
                      item.tugas === "Pembina Apel"
                        ? "border-blue-200 bg-blue-50"
                        : "bg-white"
                    }`}
                  >

                    <p className="text-sm font-medium text-blue-600">
                      {item.tugas}
                    </p>

                    <p className="mt-1 font-bold">
                      {item.nama_petugas}
                    </p>

                    <p className="text-sm text-gray-500">
                      {item.jabatan}
                    </p>

                  </div>
                ))}

              </div>

            </div>
          </>
        )}

      </div>
    </div>
  );
}