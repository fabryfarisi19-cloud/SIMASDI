"use client";

export default function TableBMN() {
  const data = [
    {
      kode: "3010101001",
      nama: "Laptop Lenovo ThinkPad",
      ruangan: "Subbag TU",
      kondisi: "Baik",
      nilai: "Rp 18.500.000",
    },
    {
      kode: "3010101002",
      nama: "Printer Epson L5290",
      ruangan: "Ruang PK",
      kondisi: "Baik",
      nilai: "Rp 5.200.000",
    },
    {
      kode: "3010101003",
      nama: "Lemari Arsip Besi",
      ruangan: "Gudang",
      kondisi: "Rusak Ringan",
      nilai: "Rp 3.700.000",
    },
    {
      kode: "3010101004",
      nama: "Meja Kerja",
      ruangan: "Lobi",
      kondisi: "Baik",
      nilai: "Rp 2.000.000",
    },
  ];

  return (
    <div className="bg-white rounded-3xl shadow-lg p-6">

      <h2 className="text-2xl font-bold text-blue-900 mb-6">
        Data BMN Terbaru
      </h2>

      <div className="overflow-x-auto">

     <table className="min-w-[900px] w-full">

          <thead className="bg-slate-100">

            <tr>

              <th className="text-left p-4">Kode</th>

              <th className="text-left p-4">Nama Barang</th>

              <th className="text-left p-4">Ruangan</th>

              <th className="text-left p-4">Kondisi</th>

              <th className="text-right p-4">
                Nilai
              </th>

            </tr>

          </thead>

          <tbody>

            {data.map((item, index) => (
              <tr
                key={index}
                className="border-b hover:bg-slate-50"
              >
                <td className="p-4">
                  {item.kode}
                </td>

                <td className="p-4 font-semibold">
                  {item.nama}
                </td>

                <td className="p-4">
                  {item.ruangan}
                </td>

                <td className="p-4">
                  <span
                    className={`px-3 py-1 rounded-full text-white text-sm ${
                      item.kondisi === "Baik"
                        ? "bg-green-600"
                        : "bg-yellow-500"
                    }`}
                  >
                    {item.kondisi}
                  </span>
                </td>

                <td className="p-4 text-right font-bold">
                  {item.nilai}
                </td>

              </tr>
            ))}

          </tbody>

        </table>

      </div>

    </div>
  );
}