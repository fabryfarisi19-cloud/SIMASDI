"use client";

export default function DisposisiPage() {
  const kirimWA = () => {
    const pesan = encodeURIComponent(
      "DISPOSISI SURAT MASUK\n\nNomor Surat : 001/BPS/2026\nAsal Surat : Pengadilan Negeri\nPerihal : Permintaan Litmas\n\nMohon ditindaklanjuti."
    );

    window.open(
      `https://wa.me/6282113349937?text=${pesan}`,
      "_blank"
    );
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Disposisi Surat</h1>

      <button
        onClick={kirimWA}
        style={{
          background: "green",
          color: "white",
          padding: "10px 20px",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
        }}
      >
        Kirim Disposisi WA
      </button>
    </div>
  );
}