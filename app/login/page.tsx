"use client";

import Image from "next/image";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center">

      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl p-8">

        <div className="text-center">

          <Image
            src="/logo.png"
            alt="SIMASDI"
            width={120}
            height={120}
            className="mx-auto"
          />

          <h1 className="text-3xl font-bold text-blue-900 mt-4">
            SIMASDI
          </h1>

          <p className="text-gray-500">
            Sistem Manajemen Surat dan Disposisi
          </p>

        </div>

        <form className="mt-8">

          <div className="mb-4">
            <label className="block mb-2">
              Username
            </label>

            <input
              type="text"
              className="w-full border rounded-lg p-3"
              placeholder="Masukkan Username"
            />
          </div>

          <div className="mb-6">
            <label className="block mb-2">
              Password
            </label>

            <input
              type="password"
              className="w-full border rounded-lg p-3"
              placeholder="Masukkan Password"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-900 text-white py-3 rounded-lg"
          >
            Login
          </button>

        </form>

      </div>

    </div>
  );
}