"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { FcGoogle } from "react-icons/fc";
import {
  LockKeyhole,
  User,
  Eye,
  EyeOff,
  ArrowRight,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [lihatPassword, setLihatPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pesan, setPesan] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setPesan("");
    setLoading(true);

    setTimeout(() => {
      if (username === "admin" && password === "admin123") {
        localStorage.setItem("login", "true");
        router.push("/dashboard");
      } else {
        setPesan("Username atau password salah.");
        setLoading(false);
      }
    }, 500);
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        background:
          "linear-gradient(135deg, #0f172a 0%, #1e3a8a 55%, #2563eb 100%)",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "980px",
          minHeight: "560px",
          display: "grid",
          gridTemplateColumns: "1.1fr 0.9fr",
          background: "#ffffff",
          borderRadius: "24px",
          overflow: "hidden",
          boxShadow: "0 24px 60px rgba(15, 23, 42, 0.35)",
        }}
      >
        {/* BAGIAN KIRI */}
        <section
          style={{
            padding: "56px",
            color: "white",
            background:
              "linear-gradient(160deg, #0f172a 0%, #1e3a8a 65%, #2563eb 100%)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div
              style={{
                width: "54px",
                height: "54px",
                borderRadius: "14px",
                background: "rgba(255,255,255,0.14)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "28px",
              }}
            >
              <LockKeyhole size={27} />
            </div>

            <h1
              style={{
                fontSize: "36px",
                lineHeight: 1.15,
                margin: "0 0 16px",
                fontWeight: "800",
              }}
            >
              SIMASDI
            </h1>

            <p
              style={{
                margin: 0,
                fontSize: "17px",
                lineHeight: 1.7,
                color: "#dbeafe",
              }}
            >
              Sistem Informasi Manajemen Arsip Digital
              <br />
              Bapas Kelas I Jakarta Barat
            </p>
          </div>

          <div
            style={{
              paddingTop: "28px",
              borderTop: "1px solid rgba(255,255,255,0.18)",
              color: "#bfdbfe",
              fontSize: "13px",
              lineHeight: 1.6,
            }}
          >
            Administrasi surat lebih cepat, tertib, dan terdokumentasi secara
            digital.
          </div>
        </section>

        {/* BAGIAN KANAN */}
        <section
          style={{
            padding: "56px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <div style={{ marginBottom: "32px" }}>
            <h2
              style={{
                margin: "0 0 8px",
                color: "#0f172a",
                fontSize: "28px",
                fontWeight: "800",
              }}
            >
              Selamat Datang
            </h2>

            <p style={{ margin: 0, color: "#64748b", lineHeight: 1.6 }}>
              Masuk untuk mengakses dashboard SIMASDI.
            </p>
          </div>

          <form onSubmit={handleLogin}>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                color: "#334155",
                fontSize: "14px",
                fontWeight: "700",
              }}
            >
              Username
            </label>

            <div style={{ position: "relative", marginBottom: "20px" }}>
              <User
                size={19}
                style={{
                  position: "absolute",
                  left: "15px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#64748b",
                }}
              />

              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan username"
                required
                style={{
                  width: "100%",
                  padding: "13px 14px 13px 45px",
                  border: "1px solid #cbd5e1",
                  borderRadius: "10px",
                  outline: "none",
                  fontSize: "14px",
                }}
              />
            </div>

            <label
              style={{
                display: "block",
                marginBottom: "8px",
                color: "#334155",
                fontSize: "14px",
                fontWeight: "700",
              }}
            >
              Password
            </label>

            <div style={{ position: "relative", marginBottom: "12px" }}>
              <LockKeyhole
                size={19}
                style={{
                  position: "absolute",
                  left: "15px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#64748b",
                }}
              />

              <input
                type={lihatPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password"
                required
                style={{
                  width: "100%",
                  padding: "13px 48px 13px 45px",
                  border: "1px solid #cbd5e1",
                  borderRadius: "10px",
                  outline: "none",
                  fontSize: "14px",
                }}
              />

              <button
                type="button"
                onClick={() => setLihatPassword(!lihatPassword)}
                style={{
                  position: "absolute",
                  right: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "transparent",
                  border: "none",
                  color: "#64748b",
                  padding: "4px",
                  display: "flex",
                  alignItems: "center",
                }}
                aria-label="Lihat password"
              >
                {lihatPassword ? <EyeOff size={19} /> : <Eye size={19} />}
              </button>
            </div>

            {pesan && (
              <div
                style={{
                  marginBottom: "18px",
                  padding: "11px 12px",
                  borderRadius: "9px",
                  background: "#fef2f2",
                  color: "#dc2626",
                  fontSize: "13px",
                  fontWeight: "600",
                }}
              >
                {pesan}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                border: "none",
                borderRadius: "10px",
                padding: "14px",
                marginTop: "12px",
                background: loading ? "#93c5fd" : "#2563eb",
                color: "white",
                fontSize: "15px",
                fontWeight: "700",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
              }}
            >
              {loading ? "Memproses..." : "Masuk ke SIMASDI"}
              {!loading && <ArrowRight size={18} />}
 </button>

<div
  style={{
    display: "flex",
    alignItems: "center",
    gap: "12px",
    margin: "24px 0",
    color: "#94a3b8",
    fontSize: "12px",
  }}
>
  <div style={{ height: "1px", background: "#e2e8f0", flex: 1 }} />
  atau
  <div style={{ height: "1px", background: "#e2e8f0", flex: 1 }} />
</div>

<button
  type="button"
  onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
  style={{
    width: "100%",
    border: "1px solid #cbd5e1",
    borderRadius: "10px",
    padding: "13px",
    background: "white",
    color: "#334155",
    fontSize: "14px",
    fontWeight: "700",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    cursor: "pointer",
  }}
>
  <FcGoogle size={21} />
  Login dengan Google
</button>
</form>           

          <p
            style={{
              margin: "28px 0 0",
              textAlign: "center",
              color: "#94a3b8",
              fontSize: "12px",
            }}
          >
            © 2026 SIMASDI · Bapas Kelas I Jakarta Barat
          </p>
        </section>
      </div>
    </main>
  );
}