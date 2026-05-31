"use client";

import { useState } from "react";

export default function PenggunaPage() {
  const [users, setUsers] = useState([
    {
      nama: "Administrator",
      username: "admin",
      role: "Admin",
    },
  ]);

  return (
    <div style={{ padding: 20 }}>
      <h1>Manajemen Pengguna</h1>

      <button
        style={{
          background: "#2563eb",
          color: "white",
          border: "none",
          padding: "10px 15px",
          borderRadius: "8px",
          marginBottom: "15px",
        }}
      >
        + Tambah Pengguna
      </button>

      <table width="100%" border={1} cellPadding={10}>
        <thead>
          <tr>
            <th>Nama</th>
            <th>Username</th>
            <th>Role</th>
            <th>Aksi</th>
          </tr>
        </thead>

        <tbody>
          {users.map((user, index) => (
            <tr key={index}>
              <td>{user.nama}</td>
              <td>{user.username}</td>
              <td>{user.role}</td>
              <td>
                <button>Edit</button>
                {" "}
                <button>Hapus</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}