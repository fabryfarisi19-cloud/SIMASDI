"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Search,
  Pencil,
  Power,
  X,
  Save,
  RefreshCw,
} from "lucide-react";

type MasterKode = {
  id: string;
  kode_unit: string;
  klasifikasi: string;
  kode_angka_1: string;
  kode_angka_2: string;
  aktif: boolean;
  keterangan: string | null;
  kode_lengkap?: string;
};

type UserData = {
  role?: string;
  nama?: string;
};

const ROLE_ADMIN = ["admin", "kaur umum"];

export default function MasterKodeSuratPage() {
  const [user, setUser] = useState<UserData | null>(null);
  const [data, setData] = useState<MasterKode[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("SEMUA");

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    kode_unit: "WP.10.PAS.8-",
    klasifikasi: "",
    kode_angka_1: "",
    kode_angka_2: "",
    keterangan: "",
    aktif: true,
  });

  const roleNormal = String(user?.role || "")
    .trim()
    .toLowerCase();

  const bolehAkses = ROLE_ADMIN.includes(roleNormal);

  const kodeLengkapPreview =
    `${form.kode_unit}${form.klasifikasi}${form.kode_angka_1}${form.kode_angka_2}`;

  useEffect(() => {
    loadSession();
  }, []);

  async function loadSession() {
    try {
      const response = await fetch("/api/auth/session", {
        cache: "no-store",
      });

      const session = await response.json();

      const sessionUser = session?.user || session;

      const userData: UserData = {
        role: sessionUser?.role,
        nama: sessionUser?.nama,
      };

      setUser(userData);

      const role = String(sessionUser?.role || "")
        .trim()
        .toLowerCase();

      if (ROLE_ADMIN.includes(role)) {
        await loadData();
      } else {
        setLoading(false);
      }
    } catch (err) {
      console.error(err);

      setError("Gagal memuat sesi pengguna.");
      setLoading(false);
    }
  }

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/master-kode-surat", {
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Gagal mengambil Master Kode Surat."
        );
      }

      setData(result.data || []);
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Gagal mengambil Master Kode Surat."
      );
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setEditingId(null);

    setForm({
      kode_unit: "WP.10.PAS.8-",
      klasifikasi: "",
      kode_angka_1: "",
      kode_angka_2: "",
      keterangan: "",
      aktif: true,
    });

    setError("");
  }

  function bukaTambah() {
    resetForm();
    setShowForm(true);
  }

  function bukaEdit(item: MasterKode) {
    setEditingId(item.id);

    setForm({
      kode_unit: item.kode_unit || "",
      klasifikasi: item.klasifikasi || "",
      kode_angka_1: item.kode_angka_1 || "",
      kode_angka_2: item.kode_angka_2 || "",
      keterangan: item.keterangan || "",
      aktif: item.aktif,
    });

    setError("");
    setShowForm(true);
  }

  async function simpan() {
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      if (
        !form.kode_unit.trim() ||
        !form.klasifikasi.trim() ||
        !form.kode_angka_1.trim() ||
        !form.kode_angka_2.trim()
      ) {
        setError("Semua bagian kode wajib diisi.");
        return;
      }

      const payload = {
        ...form,
        kode_unit: form.kode_unit.trim(),
        klasifikasi: form.klasifikasi.trim(),
        kode_angka_1: form.kode_angka_1.trim(),
        kode_angka_2: form.kode_angka_2.trim(),
        keterangan: form.keterangan.trim(),
      };

      const response = await fetch("/api/master-kode-surat", {
        method: editingId ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(
          editingId
            ? {
                id: editingId,
                ...payload,
              }
            : payload
        ),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Gagal menyimpan master kode."
        );
      }

      setSuccess(result.message || "Berhasil disimpan.");

      setShowForm(false);
      resetForm();

      await loadData();
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Gagal menyimpan master kode."
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggleAktif(item: MasterKode) {
    const statusBaru = !item.aktif;

    const konfirmasi = window.confirm(
      statusBaru
        ? `Aktifkan kode ${formatKode(item)}?`
        : `Nonaktifkan kode ${formatKode(item)}?`
    );

    if (!konfirmasi) return;

    try {
      setError("");
      setSuccess("");

      const response = await fetch("/api/master-kode-surat", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: item.id,
          aktif: statusBaru,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Gagal mengubah status kode."
        );
      }

      setSuccess(result.message || "Status berhasil diubah.");

      await loadData();
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Gagal mengubah status kode."
      );
    }
  }

  function formatKode(item: MasterKode) {
    return `${item.kode_unit}${item.klasifikasi}${item.kode_angka_1}${item.kode_angka_2}`;
  }

  const filteredData = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return data.filter((item) => {
      const kode = formatKode(item).toLowerCase();

      const cocokSearch =
        !keyword ||
        kode.includes(keyword) ||
        String(item.keterangan || "")
          .toLowerCase()
          .includes(keyword);

      const cocokStatus =
        filterStatus === "SEMUA" ||
        (filterStatus === "AKTIF" && item.aktif) ||
        (filterStatus === "NONAKTIF" && !item.aktif);

      return cocokSearch && cocokStatus;
    });
  }, [data, search, filterStatus]);

  const jumlahAktif = data.filter((item) => item.aktif).length;
  const jumlahNonaktif = data.filter((item) => !item.aktif).length;

  if (loading) {
    return (
      <div className="page">
        <div className="loading">
          Memuat Master Kode Surat...
        </div>

        <style jsx>{`
          .page {
            padding: 24px;
          }

          .loading {
            padding: 40px;
            text-align: center;
            color: #64748b;
          }
        `}</style>
      </div>
    );
  }

  if (!bolehAkses) {
    return (
      <div className="page">
        <div className="forbidden">
          <h2>Akses Ditolak</h2>
          <p>
            Halaman Master Kode Surat hanya dapat diakses
            oleh Admin dan Kaur Umum.
          </p>
        </div>

        <style jsx>{`
          .page {
            padding: 24px;
          }

          .forbidden {
            max-width: 600px;
            margin: 60px auto;
            padding: 30px;
            text-align: center;
            background: #fff;
            border-radius: 16px;
            border: 1px solid #e2e8f0;
          }

          h2 {
            margin: 0 0 8px;
          }

          p {
            color: #64748b;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="header">
        <div>
          <h1>Master Kode Surat</h1>
          <p>
            Pengelolaan kode klasifikasi Nomor Surat Keluar
          </p>
        </div>

        <button
          className="btn primary"
          onClick={bukaTambah}
        >
          <Plus size={18} />
          Tambah Kode
        </button>
      </div>

      {success && (
        <div className="alert success">
          {success}
        </div>
      )}

      {error && (
        <div className="alert error">
          {error}
        </div>
      )}

      <div className="summary">
        <div className="summary-card">
          <span>Total Kode</span>
          <strong>{data.length}</strong>
        </div>

        <div className="summary-card active">
          <span>Kode Aktif</span>
          <strong>{jumlahAktif}</strong>
        </div>

        <div className="summary-card inactive">
          <span>Kode Nonaktif</span>
          <strong>{jumlahNonaktif}</strong>
        </div>
      </div>

      <div className="toolbar">
        <div className="search-box">
          <Search size={18} />

          <input
            type="text"
            placeholder="Cari kode atau keterangan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="SEMUA">Semua Status</option>
          <option value="AKTIF">Aktif</option>
          <option value="NONAKTIF">Nonaktif</option>
        </select>

        <button
          className="btn secondary"
          onClick={loadData}
          title="Refresh"
        >
          <RefreshCw size={17} />
          Refresh
        </button>
      </div>

      <div className="table-card">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>No</th>
                <th>Kode Surat</th>
                <th>Keterangan</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>

            <tbody>
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={5} className="empty">
                    Tidak ada data Master Kode Surat.
                  </td>
                </tr>
              ) : (
                filteredData.map((item, index) => (
                  <tr key={item.id}>
                    <td>{index + 1}</td>

                    <td>
                      <strong className="kode">
                        {formatKode(item)}
                      </strong>
                    </td>

                    <td>
                      {item.keterangan || "-"}
                    </td>

                    <td>
                      <span
                        className={
                          item.aktif
                            ? "badge aktif"
                            : "badge nonaktif"
                        }
                      >
                        {item.aktif
                          ? "AKTIF"
                          : "NONAKTIF"}
                      </span>
                    </td>

                    <td>
                      <div className="actions">
                        <button
                          className="btn edit"
                          onClick={() =>
                            bukaEdit(item)
                          }
                        >
                          <Pencil size={15} />
                          Edit
                        </button>

                        <button
                          className={
                            item.aktif
                              ? "btn danger"
                              : "btn activate"
                          }
                          onClick={() =>
                            toggleAktif(item)
                          }
                        >
                          <Power size={15} />

                          {item.aktif
                            ? "Nonaktifkan"
                            : "Aktifkan"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-header">
              <div>
                <h2>
                  {editingId
                    ? "Edit Master Kode"
                    : "Tambah Master Kode"}
                </h2>

                <p>
                  Masukkan kode klasifikasi surat.
                </p>
              </div>

              <button
                className="close"
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
              >
                <X size={21} />
              </button>
            </div>

            <div className="form">
              <label>
                Kode Unit
                <input
                  value={form.kode_unit}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      kode_unit: e.target.value,
                    }))
                  }
                  placeholder="Contoh: WP.10.PAS.8-"
                />
              </label>

              <label>
                Klasifikasi
                <input
                  value={form.klasifikasi}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      klasifikasi: e.target.value,
                    }))
                  }
                  placeholder="Contoh: PK."
                />
              </label>

              <div className="two-column">
                <label>
                  Kode Angka 1
                  <input
                    value={form.kode_angka_1}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        kode_angka_1: e.target.value,
                      }))
                    }
                    placeholder="Contoh: 07."
                  />
                </label>

                <label>
                  Kode Angka 2
                  <input
                    value={form.kode_angka_2}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        kode_angka_2: e.target.value,
                      }))
                    }
                    placeholder="Contoh: 03."
                  />
                </label>
              </div>

              <div className="preview">
                <span>Preview kode:</span>

                <strong>
                  {kodeLengkapPreview || "-"}
                </strong>
              </div>

              <label>
                Keterangan
                <textarea
                  value={form.keterangan}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      keterangan: e.target.value,
                    }))
                  }
                  placeholder="Keterangan penggunaan kode..."
                  rows={3}
                />
              </label>

              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={form.aktif}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      aktif: e.target.checked,
                    }))
                  }
                />

                <span>
                  Kode langsung aktif
                </span>
              </label>
            </div>

            <div className="modal-footer">
              <button
                className="btn secondary"
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                disabled={saving}
              >
                Batal
              </button>

              <button
                className="btn primary"
                onClick={simpan}
                disabled={saving}
              >
                <Save size={17} />

                {saving
                  ? "Menyimpan..."
                  : "Simpan"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .page {
          padding: 24px;
          background: #f8fafc;
          min-height: 100vh;
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
          margin-bottom: 22px;
        }

        h1 {
          margin: 0;
          font-size: 26px;
        }

        .header p {
          margin: 6px 0 0;
          color: #64748b;
        }

        .btn {
          border: none;
          border-radius: 9px;
          padding: 9px 13px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          cursor: pointer;
          font-weight: 600;
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .primary {
          background: #2563eb;
          color: white;
        }

        .secondary {
          background: white;
          color: #334155;
          border: 1px solid #cbd5e1;
        }

        .edit {
          background: #eff6ff;
          color: #1d4ed8;
        }

        .danger {
          background: #fef2f2;
          color: #dc2626;
        }

        .activate {
          background: #f0fdf4;
          color: #15803d;
        }

        .alert {
          padding: 12px 15px;
          border-radius: 10px;
          margin-bottom: 15px;
        }

        .success {
          background: #f0fdf4;
          color: #166534;
          border: 1px solid #bbf7d0;
        }

        .error {
          background: #fef2f2;
          color: #991b1b;
          border: 1px solid #fecaca;
        }

        .summary {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 15px;
          margin-bottom: 18px;
        }

        .summary-card {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 13px;
          padding: 17px;
        }

        .summary-card span {
          display: block;
          color: #64748b;
          font-size: 13px;
          margin-bottom: 6px;
        }

        .summary-card strong {
          font-size: 25px;
        }

        .summary-card.active strong {
          color: #15803d;
        }

        .summary-card.inactive strong {
          color: #dc2626;
        }

        .toolbar {
          display: flex;
          gap: 10px;
          margin-bottom: 15px;
        }

        .search-box {
          flex: 1;
          max-width: 500px;
          display: flex;
          align-items: center;
          gap: 8px;
          background: white;
          border: 1px solid #cbd5e1;
          border-radius: 9px;
          padding: 0 12px;
        }

        .search-box input {
          border: none;
          outline: none;
          width: 100%;
          padding: 11px 0;
          background: transparent;
        }

        select {
          border: 1px solid #cbd5e1;
          border-radius: 9px;
          padding: 0 12px;
          background: white;
        }

        .table-card {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 13px;
          overflow: hidden;
        }

        .table-wrapper {
          overflow-x: auto;
        }

        table {
          width: 100%;
          border-collapse: collapse;
        }

        th,
        td {
          padding: 13px 14px;
          border-bottom: 1px solid #e2e8f0;
          text-align: left;
          vertical-align: middle;
        }

        th {
          background: #f8fafc;
          color: #475569;
          font-size: 13px;
        }

        td {
          font-size: 14px;
        }

        .kode {
          font-family: monospace;
          font-size: 14px;
          color: #0f172a;
        }

        .badge {
          display: inline-block;
          padding: 5px 9px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 700;
        }

        .badge.aktif {
          background: #dcfce7;
          color: #166534;
        }

        .badge.nonaktif {
          background: #fee2e2;
          color: #991b1b;
        }

        .actions {
          display: flex;
          gap: 7px;
          flex-wrap: wrap;
        }

        .empty {
          text-align: center;
          padding: 40px;
          color: #64748b;
        }

        .modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.45);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          z-index: 1000;
        }

        .modal {
          width: 100%;
          max-width: 600px;
          max-height: 90vh;
          overflow-y: auto;
          background: white;
          border-radius: 16px;
          box-shadow: 0 25px 70px rgba(0, 0, 0, 0.2);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          gap: 20px;
          padding: 20px;
          border-bottom: 1px solid #e2e8f0;
        }

        .modal-header h2 {
          margin: 0;
        }

        .modal-header p {
          margin: 5px 0 0;
          color: #64748b;
          font-size: 13px;
        }

        .close {
          border: none;
          background: transparent;
          cursor: pointer;
          color: #64748b;
        }

        .form {
          padding: 20px;
          display: grid;
          gap: 15px;
        }

        label {
          display: grid;
          gap: 7px;
          font-size: 13px;
          font-weight: 600;
          color: #334155;
        }

        input,
        textarea {
          width: 100%;
          box-sizing: border-box;
          border: 1px solid #cbd5e1;
          border-radius: 9px;
          padding: 10px 11px;
          font: inherit;
          outline: none;
        }

        input:focus,
        textarea:focus {
          border-color: #2563eb;
        }

        .two-column {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .preview {
          background: #f8fafc;
          border: 1px dashed #cbd5e1;
          border-radius: 10px;
          padding: 13px;
        }

        .preview span {
          display: block;
          font-size: 12px;
          color: #64748b;
          margin-bottom: 5px;
        }

        .preview strong {
          font-family: monospace;
          font-size: 17px;
        }

        .checkbox {
          display: flex;
          align-items: center;
          gap: 9px;
        }

        .checkbox input {
          width: auto;
        }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          padding: 15px 20px;
          border-top: 1px solid #e2e8f0;
        }

        @media (max-width: 700px) {
          .page {
            padding: 15px;
          }

          .header {
            align-items: flex-start;
            flex-direction: column;
          }

          .summary {
            grid-template-columns: 1fr;
          }

          .toolbar {
            flex-direction: column;
          }

          .search-box {
            max-width: none;
          }

          select {
            min-height: 42px;
          }

          .two-column {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}