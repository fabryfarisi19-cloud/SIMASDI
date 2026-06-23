"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Pengguna = {
  id: number;
  nama_lengkap: string | null;
  username: string | null;
  password: string | null;
  role: string | null;
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

    try {
      setMenyimpan(true);

      const { data: penggunaSama, error: cekError } = await supabase
        .from("pengguna")
        .select("id")
        .eq("username", username.trim())
        .maybeSingle();

      if (cekError) {
        alert("Gagal memeriksa username: " + cekError.message);
        return;
      }

      if (penggunaSama) {
        alert("Username sudah digunakan. Silakan gunakan username lain.");
        return;
      }

      const { error } = await supabase.from("pengguna").insert([
        {
          nama_lengkap: namaLengkap.trim(),
          username: username.trim(),
          password: password,
          role,
        },
      ]);

      if (error) {
        alert("Gagal menyimpan pengguna: " + error.message);
        return;
      }

      alert("Pengguna berhasil ditambahkan.");

      setNamaLengkap("");
      setUsername("");
      setPassword("");
      setRole("Staf");

      await loadPengguna();
    } catch (error) {
      console.error(error);
      alert("Terjadi kesalahan saat menyimpan pengguna.");
    } finally {
      setMenyimpan(false);
    }
  };

  const hapusPengguna = async (item: Pengguna) => {
    if (item.username === "admin") {
      alert("Akun administrator utama tidak dapat dihapus.");
      return;
    }

    const yakin = confirm(
      `Yakin ingin menghapus pengguna ${item.nama_lengkap || item.username}?`
    );

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

  return (
    <main className="halaman-pengguna">
      <div className="judul-halaman">
        <h1>Manajemen Pengguna</h1>
        <p>Tambahkan akun admin atau staf untuk mengakses SIMASDI.</p>
      </div>

      <section className="kartu">
        <h2>Tambah Pengguna</h2>

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
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={menyimpan}
            className="tombol-simpan"
          >
            {menyimpan ? "Menyimpan..." : "♧ Simpan Pengguna"}
          </button>
        </form>
      </section>

      <section className="kartu daftar-kartu">
        <div className="header-daftar">
          <h2>Daftar Pengguna</h2>
          <span className="jumlah-pengguna">♧ {pengguna.length} Pengguna</span>
        </div>

        <div className="tabel-wrapper">
          <table>
            <thead>
              <tr>
                <th>Nama</th>
                <th>Username</th>
                <th>Role</th>
                <th>Aksi</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="kosong">
                    Memuat data pengguna...
                  </td>
                </tr>
              ) : pengguna.length === 0 ? (
                <tr>
                  <td colSpan={4} className="kosong">
                    Belum ada pengguna.
                  </td>
                </tr>
              ) : (
                pengguna.map((item) => (
                  <tr key={item.id}>
                    <td>{item.nama_lengkap || "-"}</td>
                    <td>{item.username || "-"}</td>
                    <td>
                      <span
                        className={
                          item.role === "Admin"
                            ? "badge-role admin"
                            : "badge-role staf"
                        }
                      >
                        {item.role || "Staf"}
                      </span>
                    </td>
                    <td>
                      {item.username === "admin" ? (
                        <span className="admin-utama">Admin Utama</span>
                      ) : (
                        <button
                          onClick={() => hapusPengguna(item)}
                          className="tombol-hapus"
                        >
                          🗑 Hapus
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <style jsx>{`
        .halaman-pengguna {
          min-height: 100vh;
          padding: 32px;
          background: #f5f7fb;
        }

        .judul-halaman {
          margin-bottom: 24px;
        }

        .judul-halaman h1 {
          margin: 0;
          color: #0f172a;
          font-size: 29px;
          font-weight: 800;
        }

        .judul-halaman p {
          margin: 8px 0 0;
          color: #64748b;
          font-size: 16px;
        }

        .kartu {
          background: #ffffff;
          border-radius: 18px;
          padding: 28px;
          margin-bottom: 26px;
          box-shadow: 0 8px 20px rgba(15, 23, 42, 0.07);
          border: 1px solid #e2e8f0;
        }

        .kartu h2 {
          margin: 0 0 22px;
          color: #1e3a8a;
          font-size: 24px;
          font-weight: 800;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 16px;
          margin-bottom: 22px;
        }

        .form-group {
          min-width: 0;
        }

        label {
          display: block;
          margin-bottom: 8px;
          color: #334155;
          font-size: 14px;
          font-weight: 800;
        }

        input,
        select {
          width: 100%;
          box-sizing: border-box;
          padding: 12px 13px;
          border: 1px solid #cbd5e1;
          border-radius: 10px;
          background: white;
          color: #0f172a;
          font-size: 14px;
          outline: none;
        }

        input:focus,
        select:focus {
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
        }

        .tombol-simpan {
          border: none;
          border-radius: 10px;
          padding: 13px 18px;
          background: #2563eb;
          color: white;
          font-size: 15px;
          font-weight: 800;
          cursor: pointer;
        }

        .tombol-simpan:disabled {
          background: #93c5fd;
          cursor: not-allowed;
        }

        .header-daftar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          margin-bottom: 18px;
        }

        .header-daftar h2 {
          margin: 0;
        }

        .jumlah-pengguna {
          color: #64748b;
          font-size: 17px;
          font-weight: 800;
          white-space: nowrap;
        }

        .tabel-wrapper {
          overflow-x: auto;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
        }

        table {
          width: 100%;
          min-width: 650px;
          border-collapse: collapse;
        }

        th {
          padding: 15px;
          background: #f8fafc;
          color: #334155;
          text-align: left;
          font-size: 14px;
          font-weight: 800;
          white-space: nowrap;
        }

        td {
          padding: 16px 15px;
          border-top: 1px solid #e2e8f0;
          color: #334155;
          font-size: 15px;
          vertical-align: middle;
        }

        .badge-role {
          display: inline-block;
          padding: 7px 12px;
          border-radius: 999px;
          font-size: 13px;
          font-weight: 800;
          white-space: nowrap;
        }

        .badge-role.admin {
          background: #dbeafe;
          color: #1d4ed8;
        }

        .badge-role.staf {
          background: #dcfce7;
          color: #15803d;
        }

        .tombol-hapus {
          border: none;
          border-radius: 8px;
          padding: 9px 12px;
          background: #dc2626;
          color: white;
          font-size: 13px;
          font-weight: 800;
          cursor: pointer;
          white-space: nowrap;
        }

        .admin-utama {
          color: #64748b;
          font-size: 13px;
          font-weight: 700;
          white-space: nowrap;
        }

        .kosong {
          padding: 30px;
          text-align: center;
          color: #64748b;
        }

        @media (max-width: 900px) {
          .form-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 768px) {
          .halaman-pengguna {
            padding: 28px 18px;
          }

          .judul-halaman h1 {
            font-size: 27px;
          }

          .judul-halaman p {
            font-size: 15px;
            line-height: 1.4;
          }

          .kartu {
            padding: 24px 18px;
          }

          .kartu h2 {
            font-size: 22px;
          }

          .form-grid {
            grid-template-columns: 1fr;
            gap: 15px;
          }

          .tombol-simpan {
            width: 100%;
          }

          .header-daftar {
            align-items: flex-start;
            flex-direction: column;
          }

          .jumlah-pengguna {
            font-size: 15px;
          }

          table {
            min-width: 620px;
          }
        }
      `}</style>
    </main>
  );
}
