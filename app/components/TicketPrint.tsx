type Props = {
  nomor: string;
  layanan: string;
};

export default function TicketPrint({
  nomor,
  layanan,
}: Props) {
  return (
    <div
      id="ticket"
      className="w-72 bg-white p-6 text-center"
    >
      <h2 className="font-bold text-xl">
        BALAI PEMASYARAKATAN
      </h2>

      <p>Kelas I Jakarta Barat</p>

      <hr className="my-4"/>

      <div className="text-6xl font-bold">
        {nomor}
      </div>

      <p className="mt-4">
        {layanan}
      </p>

      <p className="mt-6">
        {new Date().toLocaleString("id-ID")}
      </p>

      <hr className="my-4"/>

      <p>Terima Kasih</p>
    </div>
  );
}