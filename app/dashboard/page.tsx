import Sidebar from "../components/Sidebar";

export default function DashboardPage() {
  return (
    <div className="flex">

      <Sidebar />

      <main className="flex-1 p-6">
        <div className="bg-white shadow rounded-lg p-6 mb-6">
  <h2 className="text-3xl font-bold">
    Selamat Datang Admin
  </h2>

  <p className="text-gray-500">
    Anda login sebagai Super Admin
  </p>
</div>

<div className="grid grid-cols-1 md:grid-cols-3 gap-4">

  <div className="bg-cyan-500 text-white p-6 rounded-lg">
    <h3>Jumlah Surat Masuk</h3>
    <p className="text-4xl font-bold">0</p>
  </div>

  <div className="bg-lime-500 text-white p-6 rounded-lg">
    <h3>Jumlah Surat Keluar</h3>
    <p className="text-4xl font-bold">0</p>
  </div>

  <div className="bg-orange-500 text-white p-6 rounded-lg">
    <h3>Jumlah Disposisi</h3>
    <p className="text-4xl font-bold">0</p>
  </div>

  <div className="bg-red-500 text-white p-6 rounded-lg">
    <h3>Jumlah Arsip</h3>
    <p className="text-4xl font-bold">0</p>
  </div>

  <div className="bg-blue-500 text-white p-6 rounded-lg">
    <h3>Jumlah Pengguna</h3>
    <p className="text-4xl font-bold">1</p>
  </div>

</div>
        <h1 className="text-3xl font-bold">
          Dashboard SIMASDI
        </h1>
      </main>

    </div>
  );
}