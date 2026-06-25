"use client";

import Image from "next/image";
import { useState } from "react";

export default function LoginPage() {
  const [nip, setNip] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    if (!nip || !password) {
      alert("NIP dan password wajib diisi.");
      return;
    }

    alert("Login diproses");
  };

  return (
    <main className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl grid md:grid-cols-2">
        
        {/* BAGIAN KIRI */}
        <section className="bg-gradient-to-br from-blue-950 via-blue-800 to-sky-600 text-white p-8 md:p-12 flex flex-col justify-between min-h-[330px]">
          <div>
            <div className="flex items-center gap-3 mb-8">
              <span className="text-3xl">🔐</span>
              <h1 className="text-3xl font-extrabold tracking-wide">
                SIMASDI
              </h1>
            </div>

            <h2 className="text-xl md:text-2xl font-bold leading-snug">
              Sistem Informasi Manajemen Arsip Digital
            </h2>

            <p className="mt-2 text-blue-100 text-base">
              Bapas Kelas I Jakarta Barat
            </p>

            <div className="mt-8 flex justify-center">
              <Image
                src="/maskot-elbar.png"
                alt="Maskot Elbar Baru 2026"
                width={220}
                height={220}
                className="w-40 md:w-52 h-auto object-contain"
                priority
              />
            </div>
          </div>

          <p className="mt-6 text-sm text-blue-100 leading-relaxed">
            Administrasi surat lebih cepat, tertib, aman, dan terdokumentasi secara digital.
          </p>
        </section>

        {/* BAGIAN KANAN */}
        <section className="p-7 md:p-12 flex items-center">
          <div className="w-full">
            <div className="mb-8">
              <h2 className="text-3xl font-extrabold text-slate-800">
                Selamat Datang
              </h2>
              <p className="mt-2 text-slate-500">
                Masuk menggunakan NIP dan password SIMASDI.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block mb-2 text-sm font-semibold text-slate-700">
                  NIP
                </label>
                <input
                  type="text"
                  value={nip}
                  onChange={(e) => setNip(e.target.value)}
                  placeholder="Masukkan NIP"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-800 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="block mb-2 text-sm font-semibold text-slate-700">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-800 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-blue-800 px-4 py-3 font-bold text-white shadow-lg transition hover:bg-blue-900 active:scale-[0.98]"
              >
                Masuk ke SIMASDI
              </button>
            </form>

            <p className="mt-8 text-center text-sm text-slate-500">
              © 2026 SIMASDI • Bapas Kelas I Jakarta Barat
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
