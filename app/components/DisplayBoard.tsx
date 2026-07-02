type Props = {
  nomor: string;
  loket: string;
};

export default function DisplayBoard({
  nomor,
  loket,
}: Props) {
  return (
    <div className="bg-blue-900 rounded-3xl p-8 text-center text-white shadow-xl">

      <h1 className="text-3xl font-bold">
        NOMOR ANTRIAN
      </h1>

      <div className="text-[120px] font-extrabold text-yellow-400 mt-8 animate-pulse">
        {nomor}
      </div>

      <div className="text-4xl mt-6">
        Menuju
      </div>

      <div className="text-6xl font-bold mt-2">
        {loket}
      </div>

    </div>
  );
}