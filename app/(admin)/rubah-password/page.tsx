"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LockKeyhole, ArrowLeft } from "lucide-react";
import { signOut } from "next-auth/react";

type TipePassword = "lama" | "baru" | "konfirmasi";

export default function RubahPasswordPage() {
  const router = useRouter();

  const [passwordLama, setPasswordLama] = useState("");
  const [passwordBaru, setPasswordBaru] = useState("");
  const [konfirmasiPassword, setKonfirmasiPassword] = useState("");

  const [lihatPassword, setLihatPassword] = useState({
    lama: false,
    baru: false,
    konfirmasi: false,
  });

  const [loading, setLoading] = useState(false);
  const [pesan, setPesan] = useState("");
  const [error, setError] = useState("");

  const togglePassword = (tipe: TipePassword) => {
    setLihatPassword((prev) => ({
      ...prev,
      [tipe]: !prev[tipe],
    }));
  };

  const rubahPassword = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setPesan("");
    setError("");

    if (!passwordLama || !passwordBaru || !konfirmasiPassword) {
      setError("Semua kolom password wajib diisi.");
      return;
    }

    if (passwordBaru.length < 8) {
      setError("Password baru minimal 8 karakter.");
      return;
    }

    if (passwordBaru !== konfirmasiPassword) {
      setError("Konfirmasi password baru tidak sama.");
      return;
    }

    if (passwordLama === passwordBaru) {
      setError("Password baru harus berbeda dengan password lama.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          passwordLama,
          passwordBaru,
          konfirmasiPassword,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setError(
          result.message ||
            "Password gagal diubah. Silakan coba lagi."
        );
        return;
      }

      setPesan(
        result.message ||
          "Password berhasil diubah."
      );

      /**
       * Bersihkan form.
       */
      setPasswordLama("");
      setPasswordBaru("");
      setKonfirmasiPassword("");

      /**
       * Logout setelah password berhasil diubah.
       *
       * Pengguna harus login kembali menggunakan
       * password baru.
       */
      setTimeout(async () => {
        localStorage.removeItem("login");
        localStorage.removeItem("user");
        localStorage.removeItem("nama");
        localStorage.removeItem("role");
        localStorage.removeItem("username");

        await signOut({
          redirect: false,
        });

        router.replace("/login");
      }, 2500);
    } catch (err) {
      console.error(
        "Gagal menghubungi API rubah password:",
        err
      );

      setError(
        "Tidak dapat terhubung ke server. Silakan coba lagi."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="halaman-password">
      <div className="kartu-password">

        {/* HEADER */}
        <div className="header-password">
          <div className="icon-password">
            <LockKeyhole size={28} />
          </div>

          <div>
            <h1>Rubah Password</h1>
            <p>
              Ubah password akun SIMASDI Anda
            </p>
          </div>
        </div>

        {/* PESAN BERHASIL */}
        {pesan && (
          <div className="pesan berhasil">
            ✓ {pesan}
            <br />
            <small>
              Anda akan diarahkan ke halaman login...
            </small>
          </div>
        )}

        {/* PESAN ERROR */}
        {error && (
          <div className="pesan gagal">
            ⚠ {error}
          </div>
        )}

        <form onSubmit={rubahPassword}>

          {/* PASSWORD LAMA */}
          <div className="form-group">
            <label>Password Lama</label>

            <div className="input-password">
              <input
                type={
                  lihatPassword.lama
                    ? "text"
                    : "password"
                }
                value={passwordLama}
                onChange={(e) =>
                  setPasswordLama(e.target.value)
                }
                placeholder="Masukkan password lama"
                autoComplete="current-password"
                disabled={loading}
              />

              <button
                type="button"
                onClick={() =>
                  togglePassword("lama")
                }
                className="tombol-mata"
                aria-label={
                  lihatPassword.lama
                    ? "Sembunyikan password"
                    : "Lihat password"
                }
              >
                {lihatPassword.lama ? (
                  <EyeOff size={20} />
                ) : (
                  <Eye size={20} />
                )}
              </button>
            </div>
          </div>

          {/* PASSWORD BARU */}
          <div className="form-group">
            <label>Password Baru</label>

            <div className="input-password">
              <input
                type={
                  lihatPassword.baru
                    ? "text"
                    : "password"
                }
                value={passwordBaru}
                onChange={(e) =>
                  setPasswordBaru(e.target.value)
                }
                placeholder="Minimal 8 karakter"
                autoComplete="new-password"
                disabled={loading}
              />

              <button
                type="button"
                onClick={() =>
                  togglePassword("baru")
                }
                className="tombol-mata"
                aria-label={
                  lihatPassword.baru
                    ? "Sembunyikan password"
                    : "Lihat password"
                }
              >
                {lihatPassword.baru ? (
                  <EyeOff size={20} />
                ) : (
                  <Eye size={20} />
                )}
              </button>
            </div>

            <small className="keterangan">
              Minimal 8 karakter
            </small>
          </div>

          {/* KONFIRMASI PASSWORD */}
          <div className="form-group">
            <label>Ulangi Password Baru</label>

            <div className="input-password">
              <input
                type={
                  lihatPassword.konfirmasi
                    ? "text"
                    : "password"
                }
                value={konfirmasiPassword}
                onChange={(e) =>
                  setKonfirmasiPassword(e.target.value)
                }
                placeholder="Ulangi password baru"
                autoComplete="new-password"
                disabled={loading}
              />

              <button
                type="button"
                onClick={() =>
                  togglePassword("konfirmasi")
                }
                className="tombol-mata"
                aria-label={
                  lihatPassword.konfirmasi
                    ? "Sembunyikan password"
                    : "Lihat password"
                }
              >
                {lihatPassword.konfirmasi ? (
                  <EyeOff size={20} />
                ) : (
                  <Eye size={20} />
                )}
              </button>
            </div>
          </div>

          {/* TOMBOL */}
          <button
            type="submit"
            className="tombol-rubah"
            disabled={loading}
          >
            {loading ? (
              "Memproses..."
            ) : (
              <>
                <LockKeyhole size={19} />
                Rubah Password
              </>
            )}
          </button>

        </form>

        {/* KEMBALI */}
        <button
          type="button"
          className="tombol-kembali"
          onClick={() => router.back()}
          disabled={loading}
        >
          <ArrowLeft size={17} />
          Kembali
        </button>

        <div className="peringatan">
          <strong>Catatan keamanan</strong>
          <br />
          Setelah password berhasil diubah, Anda akan
          diminta login kembali menggunakan password baru.
        </div>

      </div>

      <style jsx>{`
        .halaman-password {
          min-height: 100vh;
          padding: 35px;
          margin-left: 230px;
          background:
            linear-gradient(
              135deg,
              #eff6ff 0%,
              #f8fafc 50%,
              #eef2ff 100%
            );

          display: flex;
          align-items: flex-start;
          justify-content: center;
        }

        .kartu-password {
          width: 100%;
          max-width: 620px;
          background: white;
          border-radius: 24px;
          padding: 32px;
          box-shadow:
            0 20px 50px rgba(15, 23, 42, 0.10);
          border: 1px solid #e2e8f0;
        }

        .header-password {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 28px;
        }

        .icon-password {
          width: 58px;
          height: 58px;
          border-radius: 17px;
          background: linear-gradient(
            135deg,
            #2563eb,
            #1d4ed8
          );
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow:
            0 10px 25px rgba(37, 99, 235, 0.25);
        }

        h1 {
          margin: 0;
          font-size: 25px;
          font-weight: 800;
          color: #0f172a;
        }

        .header-password p {
          margin: 5px 0 0;
          color: #64748b;
          font-size: 14px;
        }

        .form-group {
          margin-bottom: 21px;
        }

        label {
          display: block;
          margin-bottom: 8px;
          color: #1e293b;
          font-size: 14px;
          font-weight: 700;
        }

        .input-password {
          position: relative;
        }

        input {
          width: 100%;
          height: 50px;
          box-sizing: border-box;
          border: 1px solid #cbd5e1;
          border-radius: 12px;
          padding: 0 50px 0 15px;
          font-size: 15px;
          color: #0f172a;
          background: #fff;
          outline: none;
          transition: 0.2s;
        }

        input:focus {
          border-color: #2563eb;
          box-shadow:
            0 0 0 3px rgba(37, 99, 235, 0.10);
        }

        input:disabled {
          background: #f1f5f9;
          cursor: not-allowed;
        }

        .tombol-mata {
          position: absolute;
          right: 5px;
          top: 5px;
          width: 40px;
          height: 40px;
          border: none;
          border-radius: 9px;
          background: transparent;
          color: #64748b;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .tombol-mata:hover {
          background: #f1f5f9;
          color: #2563eb;
        }

        .keterangan {
          display: block;
          margin-top: 6px;
          color: #64748b;
          font-size: 12px;
        }

        .pesan {
          padding: 13px 15px;
          border-radius: 12px;
          margin-bottom: 20px;
          font-size: 14px;
          line-height: 1.5;
        }

        .pesan.berhasil {
          background: #ecfdf5;
          border: 1px solid #86efac;
          color: #166534;
        }

        .pesan.gagal {
          background: #fef2f2;
          border: 1px solid #fca5a5;
          color: #b91c1c;
        }

        .tombol-rubah {
          width: 100%;
          height: 50px;
          border: none;
          border-radius: 12px;
          background: linear-gradient(
            90deg,
            #2563eb,
            #1d4ed8
          );
          color: white;
          font-size: 15px;
          font-weight: 800;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          transition: 0.2s;
        }

        .tombol-rubah:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow:
            0 10px 25px rgba(37, 99, 235, 0.25);
        }

        .tombol-rubah:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }

        .tombol-kembali {
          margin-top: 14px;
          width: 100%;
          height: 44px;
          border: 1px solid #cbd5e1;
          border-radius: 11px;
          background: white;
          color: #475569;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
        }

        .tombol-kembali:hover {
          background: #f8fafc;
        }

        .peringatan {
          margin-top: 22px;
          padding: 13px 15px;
          border-radius: 12px;
          background: #eff6ff;
          color: #475569;
          font-size: 12px;
          line-height: 1.6;
        }

        .peringatan strong {
          color: #1d4ed8;
        }

        @media (max-width: 768px) {
          .halaman-password {
            margin-left: 0;
            padding: 85px 16px 30px;
          }

          .kartu-password {
            padding: 24px 20px;
            border-radius: 20px;
          }

          h1 {
            font-size: 22px;
          }
        }
      `}</style>
    </main>
  );
}