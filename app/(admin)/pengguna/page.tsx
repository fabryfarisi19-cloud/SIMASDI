"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function PenggunaPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [nama, setNama] = useState("");
  const [username, setUsername] = useState("");
  const [role, setRole] = useState("Staf");

  const loadUsers = async () => {
    const { data, error } = await supabase
      .from("pengguna")
      .select("*")
      .order("id", { ascending: false });

    if (error) {
      console.log(error.message);
      return;
    }

    setUsers(data || []);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const simpanPengguna = async () => {
    if (!nama || !username || !role) {
      alert("Lengkapi data pengguna terlebih dahulu");
      return;
    }

    const { error } = await supabase.from("pengguna").insert([
      {
        nama,
        username,
        role,
      },
    ]);

    if (error) {
      alert(error.message);
      return;
    }

    alert("Pengguna berhasil ditambahkan");

    setNama("");
    setUsername("");
    setRole("Staf");

    await loadUsers();
  };

  const hapusPengguna = async (id: number) => {
    const yakin = confirm("Yakin ingin menghapus pengguna ini?");
    if (!yakin) return;

    const { error } = await supabase
      .from("pengguna")
      .delete()
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    alert("Pengguna berhasil dihapus");
    await loadUsers();
  };

  return (
    <div
      style={{
        padding: "32px",
        background: "#f5f7fb",
        minHeight: "100vh",
      }}
    >
      <h1
        style={{
          margin: "0 0 24px",
          fontSize: "24px",
          color: "#0f172a",
        }}
      >
        Manajemen Pengguna
      </h1>

      <div
        style={{
          background: "white",
          padding: "24px",
          borderRadius: "14px",
          boxShadow: "0 4px 18px rgba(15, 23, 42, 0.08)",
          border: "1px solid #e2e8f0",
          marginBottom: "28px",
        }}
      >
        <h2
          style={{
            margin: "0 0 20px",
            fontSize: "18px",
            color: "#1e3a8a",
          }}
        >
          Tambah Pengguna
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: "18px",
          }}
        >
          <div>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontWeight: "600",
                color: "#334155",
              }}
            >
              Nama Lengkap
            </label>

            <input
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              placeholder="Masukkan nama pengguna"
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontWeight: "600",
                color: "#334155",
              }}
            >
              Username
            </label>

            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Masukkan username"
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontWeight: "600",
                color: "#334155",
              }}
            >
              Role / Akses
            </label>

            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                boxSizing: "border-box",
                background: "white",
              }}
            >
              <option value="Admin">Admin</option>
              <option value="Pimpinan">Pimpinan</option>
              <option value="Staf">Staf</option>
            </select>
          </div>
        </div>

        <button
          onClick={simpanPengguna}
          style={{
            marginTop: "22px",
            background: "#2563eb",
            color: "white",
            border: "none",
            padding: "12px 18px",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "600",
          }}
        >
          Simpan Pengguna
        </button>
      </div>

      <h2
        style={{
          margin: "0 0 16px",
          fontSize: "21px",
          fontWeight: "500",
          color: "#1e3a8a",
        }}
      >
        Daftar Pengguna
      </h2>

      <div
        style={{
          background: "white",
          borderRadius: "14px",
          border: "1px solid #e2e8f0",
          overflowX: "auto",
        }}
      >
        <table
          style={{
            width: "100%",
            minWidth: "700px",
            borderCollapse: "collapse",
          }}
        >
          <thead>
            <tr style={{ background: "#f8fafc" }}>
              <th style={{ padding: "16px", borderBottom: "1px solid #e2e8f0" }}>
                Nama
              </th>
              <th style={{ padding: "16px", borderBottom: "1px solid #e2e8f0" }}>
                Username
              </th>
              <th style={{ padding: "16px", borderBottom: "1px solid #e2e8f0" }}>
                Role
              </th>
              <th style={{ padding: "16px", borderBottom: "1px solid #e2e8f0" }}>
                Aksi
              </th>
            </tr>
          </thead>

          <tbody>
            {users.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  style={{
                    padding: "28px",
                    textAlign: "center",
                    color: "#64748b",
                  }}
                >
                  Belum ada data pengguna.
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id}>
                  <td style={{ padding: "14px", borderBottom: "1px solid #e2e8f0" }}>
                    {user.nama}
                  </td>

                  <td style={{ padding: "14px", borderBottom: "1px solid #e2e8f0" }}>
                    {user.username}
                  </td>

                  <td style={{ padding: "14px", borderBottom: "1px solid #e2e8f0" }}>
                    <span
                      style={{
                        background:
                          user.role === "Admin"
                            ? "#dbeafe"
                            : user.role === "Pimpinan"
                            ? "#fef3c7"
                            : "#dcfce7",
                        color:
                          user.role === "Admin"
                            ? "#1d4ed8"
                            : user.role === "Pimpinan"
                            ? "#92400e"
                            : "#166534",
                        padding: "6px 10px",
                        borderRadius: "999px",
                        fontSize: "12px",
                        fontWeight: "700",
                      }}
                    >
                      {user.role}
                    </span>
                  </td>

                  <td
                    style={{
                      padding: "14px",
                      borderBottom: "1px solid #e2e8f0",
                      textAlign: "center",
                    }}
                  >
                    <button
                      onClick={() => hapusPengguna(user.id)}
                      style={{
                        background: "#dc2626",
                        color: "white",
                        border: "none",
                        padding: "8px 12px",
                        borderRadius: "7px",
                        cursor: "pointer",
                      }}
                    >
                      🗑 Hapus
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}