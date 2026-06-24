"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();

  const [nip, setNip] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    if (!nip.trim() || !password) {
      alert("NIP dan password wajib diisi.");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("pengguna")
        .select("*")
        .eq("username", nip.trim())
        .eq("password", password)
        .single();

      if (error || !data) {
        alert("NIP atau password salah.");
        return;
      }

      if (data.status === "Nonaktif") {
        alert("Akun Anda sedang dinonaktifkan. Hubungi Admin SIMASDI.");
        return;
      }

      await supabase
        .from("pengguna")
        .update({
          terakhir_login: new Date().toISOString(),
        })
        .eq("id", data.id);

      router.push("/dashboard");
    } catch (error) {
      console.error(error);
      alert("Terjadi kesalahan saat masuk ke SIMASDI.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#061a48] flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-6xl min-h-[650px] overflow-hidden rounded-[28px] bg-white shadow-2xl grid grid-cols-1 md:grid-cols-2">
        {/* PANEL KIRI */}
        <section className="bg-gradient-to-br from-[#07183f] via-[#0b2e78] to-[#2465e8] p-8 md:p-12 text-white flex flex-col justify-between">
          <div>
            <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 text-3xl">
              🔒
            </div>

            <h1 className="text-4xl md:text-5xl font-extrabold tracking-wide">
              SIMASDI
            </h1>

            <p className="mt-5 text-lg md:text-xl leading-relaxed text-blue-100">
              Sistem Informasi Manajemen Arsip Digital
              <br />
              Bapas Kelas I Jakarta Barat
            </p>
          </div>

          <div className="flex flex-1 items-center justify-center py-8">
            <Image
              src="/Maskot Elbar Baru 2026.png"
              alt="Maskot Elbar Baru 2026"
              width={280}
              height={280}
              className="w-[210px] md:w-[250px] h-auto"
              priority
            />
          </div>

          <p className="border-t border-white/20 pt-6 text-xs md:text-sm text-blue-100">
            Administrasi surat lebih cepat, tertib, dan terdokumentasi secara digital.
          </p>
        </section>

        {/* PANEL KANAN */}
        <section className="bg-white p-8 md:p-14 flex items-center">
          <div className="w-full max-w-md mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
              Selamat Datang
            </h2>

            <p className="mt-3 text-slate-500 text-base md:text-lg">
              Masuk menggunakan NIP dan password SIMASDI.
            </p>

            <form onSubmit={handleLogin} className="mt-9">
              <label className="block mb-2 font-semibold text-slate-800">
                NIP
              </label>

              <input
                type="text"
                inputMode="numeric"
                placeholder="Masukkan NIP"
                value={nip}
                onChange={(e) => setNip(e.target.value.replace(/\D/g, ""))}
                className="w-full rounded-xl border border-slate-300 px-4 py-4 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                required
              />

              <label className="block mt-5 mb-2 font-semibold text-slate-800">
                Password
              </label>

              <input
                type="password"
                placeholder="Masukkan password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-4 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                required
              />

              <button
                type="submit"
                disabled={loading}
                className="mt-7 w-full rounded-xl bg-blue-600 py-4 font-bold text-white shadow-lg transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? "Memeriksa akun..." : "Masuk ke SIMASDI →"}
              </button>
            </form>

            <p className="mt-9 text-center text-sm text-slate-400">
              © 2026 SIMASDI • Bapas Kelas I Jakarta Barat
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
