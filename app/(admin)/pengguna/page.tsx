"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Pengguna = {
  id: number;
  nama: string | null;
  username: string | null;
  password?: string | null;
  role: string | null;
  status: string | null;
  terakhir_login: string | null;
};

export default function PenggunaPage() {
  const [pengguna, setPengguna] = useState<Pengguna[]>([]);
  const [nama, setNama] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("Staf");
  const [status, setStatus] = useState("Aktif");
  const [loading, setLoading] = useState(true);
  const [menyimpan, setMenyimpan] = useState(false);
  const [cari, setCari] = useState("");

  const [isMobile, setIsMobile] = useState(false);

useEffect(() => {
  const check = () => setIsMobile(window.innerWidth < 768);

  check();

  window.addEventListener("resize", check);

  return () => window.removeEventListener("resize", check);
}, []);

  const loadPengguna = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("pengguna")
      .select("*")
      .order("id", { ascending: false });

    if (error) {
      alert("Gagal memuat pengguna: " + error.message);
      setLoading(false);
      return;
    }

    setPengguna((data || []) as Pengguna[]);
    setLoading(false);
  };

  useEffect(() => {
    loadPengguna();
  }, []);

  const resetForm = () => {
    setNama("");
    setUsername("");
    setPassword("");
    setRole("Staf");
    setStatus("Aktif");
  };

  const simpanPengguna = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nama.trim() || !username.trim() || !password.trim()) {
      alert("Nama, NIP/username, dan password wajib diisi.");
      return;
    }

    setMenyimpan(true);

    const { error } = await supabase.from("pengguna").insert([
      {
        nama: nama.trim(),
        username: username.trim(),
        password: password.trim(),
        role,
        status,
      },
    ]);

    setMenyimpan(false);

    if (error) {
      alert("Gagal menyimpan pengguna: " + error.message);
      return;
    }

    alert("Pengguna berhasil ditambahkan.");
    resetForm();
    loadPengguna();
  };

  const hapusPengguna = async (id: number, namaPengguna: string | null) => {
    const yakin = confirm(
      `Yakin ingin menghapus pengguna ${namaPengguna || "ini"}?`
    );

    if (!yakin) return;

    const { error } = await supabase
      .from("pengguna")
      .delete()
      .eq("id", id);

    if (error) {
      alert("Gagal menghapus pengguna: " + error.message);
      return;
    }

    alert("Pengguna berhasil dihapus.");
    loadPengguna();
  };

  const formatLogin = (tanggal: string | null) => {
    if (!tanggal) return "Belum pernah login";

    return new Date(tanggal).toLocaleString("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const daftarTampil = pengguna.filter((item) => {
    const teks = `${item.nama || ""} ${item.username || ""} ${
      item.role || ""
    } ${item.status || ""}`.toLowerCase();

    return teks.includes(cari.toLowerCase());
  });

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "32px",
        background: "#f5f7fb",
      }}
    >
      <div style={{ marginBottom: "24px" }}>
        <h1
          style={{
            margin: 0,
            color: "#0f172a",
            fontSize: "29px",
            fontWeight: "800",
          }}
        >
          Manajemen Pengguna
        </h1>

        <p style={{ margin: "7px 0 0", color: "#64748b" }}>
          Kelola akun, role, status akses, dan aktivitas login pengguna SIMASDI.
        </p>
      </div>

      <section
        style={{
          background: "white",
          borderRadius: "16px",
          padding: "26px",
          boxShadow: "0 8px 20px rgba(15, 23, 42, 0.06)",
          marginBottom: "26px",
        }}
      >
        <h2
          style={{
            margin: "0 0 20px",
            color: "#1e3a8a",
            fontSize: "21px",
            fontWeight: "800",
          }}
        >
          Tambah Pengguna
        </h2>

        <form onSubmit={simpanPengguna}>
          <div
            style={{
              display: "grid",
gridTemplateColumns: isMobile
  ? "1fr"
  : "repeat(4, minmax(0,1fr))",
              gap: "16px",
            }}
          >
            <div>
              <label style={labelStyle}>Nama Lengkap</label>
              <input
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                placeholder="Masukkan nama lengkap"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>NIP / Username</label>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan NIP"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Buat password"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Role / Akses</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                style={inputStyle}
              >
                <option value="Staf">Staf</option>
                <option value="Admin">Admin</option>
                <option value="Pimpinan">Pimpinan</option>
              </select>
            </div>
          </div>

          <div
            style={{
  display: "flex",
flexDirection: isMobile ? "column" : "row",
alignItems: isMobile ? "stretch" : "end",
              gap: "16px",
              marginTop: "16px",
              flexWrap: "wrap",
            }}
          >
            <div style={{ width: isMobile ? "100%" : "210px", maxWidth: "100%" }}>
              <label style={labelStyle}>Status Akun</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                style={inputStyle}
              >
                <option value="Aktif">Aktif</option>
                <option value="Nonaktif">Nonaktif</option>
              </select>
            </div>

<button
  type="submit"
  disabled={menyimpan}
  style={{
    ...buttonBiru,
    width: isMobile ? "100%" : "auto",
  }}
>
              {menyimpan ? "Menyimpan..." : "👤 Simpan Pengguna"}
            </button>
          </div>
        </form>
      </section>

      <section
        style={{
          background: "white",
          borderRadius: "16px",
          overflow: "hidden",
          boxShadow: "0 8px 20px rgba(15, 23, 42, 0.06)",
        }}
      >
        <div
          style={{
            padding: "20px",
            borderBottom: "1px solid #e2e8f0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "14px",
            flexWrap: "wrap",
          }}
        >
          <h2
            style={{
              margin: 0,
              color: "#1e3a8a",
              fontSize: "21px",
              fontWeight: "800",
            }}
          >
            Daftar Pengguna
          </h2>

          <input
            value={cari}
            onChange={(e) => setCari(e.target.value)}
            placeholder="Cari nama, NIP, role, atau status..."
           style={{
  ...inputStyle,
  width: isMobile ? "100%" : "330px",
}}
          />
        </div>

        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              minWidth: "900px",
              borderCollapse: "collapse",
            }}
          >
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                <th style={thStyle}>No</th>
                <th style={thStyle}>Nama</th>
                <th style={thStyle}>NIP / Username</th>
                <th style={thStyle}>Role</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Terakhir Login</th>
                <th style={thStyle}>Aksi</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={emptyStyle}>
                    Memuat pengguna...
                  </td>
                </tr>
              ) : daftarTampil.length === 0 ? (
                <tr>
                  <td colSpan={7} style={emptyStyle}>
                    Belum ada data pengguna.
                  </td>
                </tr>
              ) : (
                daftarTampil.map((item, index) => (
                  <tr
                    key={item.id}
                    style={{ borderTop: "1px solid #e2e8f0" }}
                  >
                    <td style={tdStyle}>{index + 1}</td>
                    <td style={{ ...tdStyle, fontWeight: "700" }}>
                      {item.nama || "-"}
                    </td>
                    <td style={tdStyle}>{item.username || "-"}</td>
                    <td style={tdStyle}>
                      <span style={badgeBiru}>{item.role || "Staf"}</span>
                    </td>
                    <td style={tdStyle}>
                      <span
                        style={
                          item.status === "Nonaktif"
                            ? badgeMerah
                            : badgeHijau
                        }
                      >
                        {item.status || "Aktif"}
                      </span>
                    </td>
                    <td style={tdStyle}>{formatLogin(item.terakhir_login)}</td>
                    <td style={tdStyle}>
                      <button
                        onClick={() => hapusPengguna(item.id, item.nama)}
                        style={buttonHapus}
                      >
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

const inputStyle = {
  width: "100%",
  padding: "13px 14px",
  border: "1px solid #cbd5e1",
  borderRadius: "10px",
  outline: "none",
  fontSize: "14px",
  boxSizing: "border-box" as const,
};

const labelStyle = {
  display: "block",
  marginBottom: "8px",
  color: "#0f172a",
  fontSize: "14px",
  fontWeight: "800",
};

const buttonBiru = {
  border: "none",
  borderRadius: "9px",
  padding: "12px 18px",
  background: "#2563eb",
  color: "white",
  fontWeight: "800",
  cursor: "pointer",
};

const buttonHapus = {
  border: "none",
  borderRadius: "7px",
  padding: "8px 11px",
  background: "#dc2626",
  color: "white",
  fontWeight: "700",
  cursor: "pointer",
};

const badgeBiru = {
  display: "inline-block",
  padding: "6px 10px",
  borderRadius: "999px",
  background: "#dbeafe",
  color: "#1d4ed8",
  fontSize: "12px",
  fontWeight: "800",
};

const badgeHijau = {
  display: "inline-block",
  padding: "6px 10px",
  borderRadius: "999px",
  background: "#dcfce7",
  color: "#15803d",
  fontSize: "12px",
  fontWeight: "800",
};

const badgeMerah = {
  display: "inline-block",
  padding: "6px 10px",
  borderRadius: "999px",
  background: "#fee2e2",
  color: "#b91c1c",
  fontSize: "12px",
  fontWeight: "800",
};

const thStyle = {
  padding: "14px 16px",
  textAlign: "left" as const,
  color: "#0f172a",
  fontSize: "13px",
  fontWeight: "800",
  whiteSpace: "nowrap" as const,
};

const tdStyle = {
  padding: "14px 16px",
  color: "#334155",
  fontSize: "14px",
  verticalAlign: "top" as const,
};

const emptyStyle = {
  padding: "32px",
  textAlign: "center" as const,
  color: "#64748b",
};