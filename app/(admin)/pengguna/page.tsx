"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { UserPlus, Trash2, Users, ShieldCheck } from "lucide-react";

type Pengguna = {
  id: number;
  nama: string;
  username: string;
  password: string;
  role: string;
};

export default function PenggunaPage() {
  const [pengguna, setPengguna] = useState<Pengguna[]>([]);
  const [loading, setLoading] = useState(true);
  const [menyimpan, setMenyimpan] = useState(false);

  const [namaLengkap, setNamaLengkap] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("Staf");

  const loadPengguna = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("pengguna")
        .select("*")
        .order("id", { ascending: true });

      if (error) {
        alert("Gagal memuat pengguna: " + error.message);
        return;
      }

      setPengguna((data || []) as Pengguna[]);
    } catch (error) {
      console.error(error);
      alert("Terjadi kesalahan saat memuat pengguna.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPengguna();
  }, []);

  const simpanPengguna = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!namaLengkap.trim() || !username.trim() || !password.trim()) {
      alert("Nama lengkap, username, dan password wajib diisi.");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.from("pengguna").insert([
        {
          nama,
          username,
          password,
          role,
        },
      ]);

      if (error) {
        if (error.code === "23505") {
          alert("Username sudah digunakan. Gunakan username lain.");
        } else {
          alert(error.message);
        }
        return;
      }

      alert("Pengguna berhasil ditambahkan.");

      setNama("");
      setUsername("");
      setPassword("");
      setRole("Staf");

      ambilData();
    } catch (error) {
      console.error(error);
      alert("Terjadi kesalahan saat menyimpan pengguna.");
    } finally {
      setLoading(false);
    }
  };

  const hapusPengguna = async (item: Pengguna) => {
    if (item.username === "admin") {
      alert("Akun administrator utama tidak dapat dihapus.");
      return;
    }

    const yakin = confirm(`Hapus pengguna ${username}?`);

    if (!yakin) return;

    try {
      const { error } = await supabase
        .from("pengguna")
        .delete()
        .eq("id", item.id);

      if (error) {
        alert("Gagal menghapus pengguna: " + error.message);
        return;
      }

      alert("Pengguna berhasil dihapus.");
      await loadPengguna();
    } catch (error) {
      console.error(error);
      alert("Terjadi kesalahan saat menghapus pengguna.");
    }
  };

  const ubahRole = async (id: number, roleSekarang: string) => {
    const roleBaru = roleSekarang === "Admin" ? "Staf" : "Admin";

    if (!confirm(`Ubah role menjadi ${roleBaru}?`)) return;

    const { error } = await supabase
      .from("pengguna")
      .update({ role: roleBaru })
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    alert("Role pengguna berhasil diubah.");
    ambilData();
  };

  const ubahStatus = async (id: number, statusSekarang?: string) => {
    const statusBaru = statusSekarang === "Aktif" ? "Nonaktif" : "Aktif";

    const { error } = await supabase
      .from("pengguna")
      .update({ status: statusBaru })
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    ambilData();
  };

  const formatTanggal = (tanggal?: string | null) => {
    if (!tanggal) return "Belum pernah login";

    return new Date(tanggal).toLocaleString("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
      <div style={{ marginBottom: "26px" }}>
        <h1
          style={{
            margin: 0,
            color: "#0f172a",
            fontSize: "28px",
            fontWeight: "800",
          }}
        >
          Manajemen Pengguna
        </h1>

        <p style={{ margin: "8px 0 0", color: "#64748b" }}>
          Tambahkan akun admin atau staf untuk mengakses SIMASDI.
        </p>
      </div>

      <section
        style={{
          background: "#ffffff",
          borderRadius: "16px",
          padding: "26px",
          boxShadow: "0 8px 24px rgba(15, 23, 42, 0.08)",
          border: "1px solid #e2e8f0",
          marginBottom: "28px",
        }}
      >
        <h2
          style={{
            margin: "0 0 22px",
            color: "#1e3a8a",
            fontSize: "20px",
            fontWeight: "800",
          }}
        >
          Tambah Pengguna
        </h2>

        <form onSubmit={simpanPengguna}>
          <div className="form-grid">
            <div className="form-group">
              <label>Nama Lengkap</label>
              <input
                type="text"
                placeholder="Masukkan nama lengkap"
                value={namaLengkap}
                onChange={(e) => setNamaLengkap(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Username</label>
              <input
                type="text"
                placeholder="Masukkan username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                placeholder="Buat password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Role / Akses</label>
              <select value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="Staf">Staf</option>
                <option value="Admin">Admin</option>
                <option value="Pimpinan">Pimpinan</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: "22px",
              border: "none",
              borderRadius: "9px",
              background: loading ? "#93c5fd" : "#2563eb",
              color: "white",
              padding: "12px 18px",
              fontWeight: "700",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            <UserPlus size={18} />
            {loading ? "Menyimpan..." : "Simpan Pengguna"}
          </button>
        </form>
      </section>

      <section
        style={{
          background: "#ffffff",
          borderRadius: "16px",
          overflow: "hidden",
          border: "1px solid #e2e8f0",
          boxShadow: "0 8px 24px rgba(15, 23, 42, 0.06)",
        }}
      >
        <div
          style={{
            padding: "22px 26px",
            borderBottom: "1px solid #e2e8f0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h2
            style={{
              margin: 0,
              color: "#1e3a8a",
              fontSize: "20px",
              fontWeight: "800",
            }}
          >
            Daftar Pengguna
          </h2>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "7px",
              color: "#64748b",
              fontSize: "14px",
              fontWeight: "700",
            }}
          >
            <Users size={18} />
            {dataPengguna.length} Pengguna
          </div>
        </div>

        <div className="tabel-wrapper">
          <table>
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                <th style={thStyle}>Nama</th>
                <th style={thStyle}>Username</th>
                <th style={thStyle}>Role</th>
                <th style={{ ...thStyle, textAlign: "center" }}>Aksi</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={4}
                    style={{
                      padding: "34px",
                      textAlign: "center",
                      color: "#64748b",
                    }}
                  >
                    Belum ada pengguna.
                  </td>
                </tr>
              ) : (
                dataPengguna.map((item) => (
                  <tr key={item.id} style={{ borderTop: "1px solid #e2e8f0" }}>
                    <td style={tdStyle}>{item.nama}</td>
                    <td style={tdStyle}>{item.username}</td>
                    <td style={tdStyle}>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          borderRadius: "999px",
                          padding: "6px 10px",
                          fontSize: "12px",
                          fontWeight: "800",
                          color:
                            item.role === "Admin" ? "#1d4ed8" : "#047857",
                          background:
                            item.role === "Admin" ? "#dbeafe" : "#d1fae5",
                        }}
                      >
                        <ShieldCheck size={14} />
                        {item.role}
                      </span>
                    </td>

                    <td style={{ ...tdStyle, textAlign: "center" }}>
                      <button
                        onClick={() => hapusPengguna(item.id, item.username)}
                        disabled={item.username === "admin"}
                        style={{
                          border: "none",
                          borderRadius: "8px",
                          padding: "9px 12px",
                          background:
                            item.username === "admin" ? "#cbd5e1" : "#dc2626",
                          color: "white",
                          fontSize: "13px",
                          fontWeight: "700",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          cursor:
                            item.username === "admin"
                              ? "not-allowed"
                              : "pointer",
                        }}
                      >
                        <Trash2 size={15} />
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
    </div>
  );
}

const labelStyle = {
  display: "block",
  marginBottom: "8px",
  color: "#334155",
  fontSize: "14px",
  fontWeight: "700",
};

const inputStyle = {
  width: "100%",
  boxSizing: "border-box" as const,
  border: "1px solid #cbd5e1",
  borderRadius: "9px",
  padding: "12px 13px",
  fontSize: "14px",
  outline: "none",
  color: "#0f172a",
  background: "#ffffff",
};

const thStyle = {
  padding: "15px 18px",
  textAlign: "left" as const,
  color: "#334155",
  fontSize: "14px",
  fontWeight: "800",
};

const tdStyle = {
  padding: "15px 18px",
  color: "#334155",
  fontSize: "14px",
};