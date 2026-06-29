export default function Footer() {
  return (
    <footer
      style={{
        marginTop: "40px",
        background: "#0B2E78",
        color: "#fff",
        padding: "24px",
        textAlign: "center",
        borderTop: "4px solid #2563eb",
      }}
    >
      <h2
        style={{
          margin: 0,
          fontSize: "22px",
          fontWeight: 800,
          letterSpacing: "1px",
        }}
      >
        SIMASDI
      </h2>

      <p
        style={{
          marginTop: "8px",
          color: "#dbeafe",
          fontSize: "15px",
        }}
      >
        Sistem Informasi Manajemen Arsip Digital
      </p>

      <hr
        style={{
          width: "70%",
          margin: "18px auto",
          border: 0,
          borderTop: "1px solid rgba(255,255,255,.2)",
        }}
      />

      <p
        style={{
          margin: 0,
          fontSize: "14px",
        }}
      >
        © 2026 Balai Pemasyarakatan Kelas I Jakarta Barat
      </p>

      <p
        style={{
          marginTop: "15px",
          color: "#94a3b8",
          fontSize: "12px",
        }}
      >
        SIMASDI Version 1.0.0
      </p>
    </footer>
  );
}