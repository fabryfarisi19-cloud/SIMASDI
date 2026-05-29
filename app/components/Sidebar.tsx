import Link from "next/link";

export default function Sidebar() {
  return (
    <aside className="w-64 min-h-screen bg-slate-800 text-white p-4">
      <h1 className="text-2xl font-bold mb-6">
        SIMASDI
      </h1>

      <ul className="space-y-2">

        <li>
          <Link href="/dashboard">
            Dashboard
          </Link>
        </li>

        <li>
          <Link href="/surat-masuk">
            Surat Masuk
          </Link>
        </li>

        <li>
          <Link href="/surat-keluar">
            Surat Keluar
          </Link>
        </li>

        <li>
          <Link href="/disposisi">
            Disposisi
          </Link>
        </li>

        <li>
          <Link href="/arsip">
            Arsip Digital
          </Link>
        </li>

        <li>
          <Link href="/laporan">
            Laporan
          </Link>
        </li>

        <li>
          <Link href="/pengguna">
            Pengguna
          </Link>
        </li>

      </ul>
    </aside>
  );
}