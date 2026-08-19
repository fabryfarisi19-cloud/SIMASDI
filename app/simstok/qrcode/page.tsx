"use client";

import { useEffect, useState } from "react";
import { QrCode, Search, Package, MapPin, Hash } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Html5Qrcode } from "html5-qrcode";

export default function QRCodeBMN() {
  const [qr, setQr] = useState("");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
async function scanQR() {
  const scanner = new Html5Qrcode("qr-reader");

  try {
    await scanner.start(
      { facingMode: "environment" },
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
      },
   async (decodedText) => {
  console.log("HASIL SCAN QR =", JSON.stringify(decodedText));
  console.log("PANJANG HASIL SCAN =", decodedText.length);

  setQr(decodedText);

        await scanner.stop();
        scanner.clear();

        // Cari BMN berdasarkan hasil scan
        const { data: hasil, error: supabaseError } = await supabase
          .from("barang")
          .select("*")
          .eq("qr_sakti", decodedText.trim())
          .maybeSingle();

        if (supabaseError) {
          console.error(
            "ERROR SCAN QR BMN:",
            supabaseError.message
          );

          setError(
            "Terjadi kesalahan saat mencari data BMN."
          );

          return;
        }

        if (!hasil) {
          setError(
            "QR SAKTI/SIMAN belum terdaftar pada SIMSTOK."
          );

          return;
        }

        setError("");
        setData(hasil);
      },
      () => {
        // Abaikan error pembacaan sementara
      }
    );
  } catch (error) {
    console.error("ERROR KAMERA:", error);

    setError(
      "Kamera tidak dapat dibuka. Pastikan izin kamera diberikan."
    );
  }
}
  async function cariBMN() {
    if (!qr.trim()) {
      setError("Masukkan ID QR SAKTI/SIMAN.");
      setData(null);
      return;
    }

    setLoading(true);
    setError("");
    setData(null);

const qrValue = qr.trim();

const { data: hasil, error: supabaseError } = await supabase
  .from("barang")
  .select("*")
  .eq("qr_sakti", qrValue)
  .maybeSingle();

console.log("QR INPUT =", JSON.stringify(qrValue));
console.log("HASIL QR BMN =", hasil);
console.log("PANJANG QR INPUT =", qrValue.length);
    if (supabaseError) {
      console.error("ERROR CARI QR BMN:", supabaseError.message);
      setError("Terjadi kesalahan saat mencari data BMN.");
      setLoading(false);
      return;
    }

    if (!hasil) {
      setError("QR SAKTI/SIMAN belum terdaftar pada SIMSTOK.");
      setLoading(false);
      return;
    }

    setData(hasil);
    setLoading(false);
  }

  function formatRupiah(nilai: number) {
    return `Rp ${Number(nilai || 0).toLocaleString("id-ID")}`;
  }

  return (
    <main>
      {/* JUDUL */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-blue-900">
          QR Code BMN
        </h1>

        <p className="text-slate-600 mt-2">
          Pencarian Barang Milik Negara berdasarkan QR SAKTI/SIMAN
        </p>
      </div>

      {/* PENCARIAN */}
      <div className="bg-white rounded-3xl shadow-lg p-6">

        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center">
            <QrCode size={26} />
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-800">
              Scan / Masukkan QR SAKTI/SIMAN
            </h2>

            <p className="text-sm text-slate-500">
              Masukkan ID QR yang tercetak pada label BMN.
            </p>
          </div>
        </div>
<div
  id="qr-reader"
  className="w-full max-w-md mx-auto mb-5 rounded-2xl overflow-hidden border border-slate-300"
/>

<button
  onClick={scanQR}
  className="w-full md:w-auto mx-auto mb-5 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl flex items-center justify-center gap-2 font-semibold"
>
  <QrCode size={20} />
  Scan QR dengan Kamera
</button>
        <div className="flex flex-col md:flex-row gap-3">

          <input
            value={qr}
            onChange={(e) => setQr(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                cariBMN();
              }
            }}
            placeholder="#E2AAEF300F301495E0531161F20A5EA6"
            className="flex-1 border border-slate-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
          />

          <button
            onClick={cariBMN}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white px-6 py-3 rounded-xl flex items-center justify-center gap-2 font-semibold"
          >
            <Search size={20} />

            {loading ? "Mencari..." : "Cari BMN"}
          </button>

        </div>

        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 text-red-700 rounded-xl p-4">
            {error}
          </div>
        )}

      </div>

      {/* HASIL */}
      {data && (
        <div className="bg-white rounded-3xl shadow-lg p-6 mt-6">

          <div className="flex items-center gap-3 mb-6">

            <div className="w-12 h-12 rounded-2xl bg-green-600 text-white flex items-center justify-center">
              <Package size={25} />
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-800">
                Data BMN Ditemukan
              </h2>

              <p className="text-sm text-green-600">
                QR SAKTI/SIMAN terdaftar
              </p>
            </div>

          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            <Info
              label="Kode Barang"
              value={data.kode_barang}
              icon={<Hash size={18} />}
            />

            <Info
              label="NUP"
              value={data.nup}
              icon={<Hash size={18} />}
            />

            <Info
              label="Nama Barang"
              value={data.nama_barang}
              icon={<Package size={18} />}
            />

            <Info
              label="Ruangan"
              value={data.ruangan}
              icon={<MapPin size={18} />}
            />

            <Info
              label="Kondisi"
              value={data.kondisi}
            />

            <Info
              label="Jumlah"
              value={data.jumlah}
            />

            <Info
              label="Nilai Perolehan"
              value={formatRupiah(data.nilai_perolehan)}
            />

            <Info
              label="Tahun Perolehan"
              value={data.tahun_perolehan}
            />

          </div>

          <div className="mt-6 bg-slate-50 rounded-xl p-4">

            <p className="text-sm text-slate-500">
              ID QR SAKTI/SIMAN
            </p>

            <p className="font-mono font-semibold mt-1 break-all">
              {data.qr_sakti}
            </p>

          </div>

        </div>
      )}

    </main>
  );
}

function Info({
  label,
  value,
  icon,
}: {
  label: string;
  value: any;
  icon?: React.ReactNode;
}) {
  return (
    <div className="border border-slate-200 rounded-xl p-4">

      <div className="flex items-center gap-2 text-slate-500 text-sm">
        {icon}
        {label}
      </div>

      <p className="font-bold text-slate-800 mt-2">
        {value || "-"}
      </p>

    </div>
  );
}