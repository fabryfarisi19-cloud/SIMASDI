"use client";

type Props = {
  nomor: string;
  loket: number | string;
};

export default function AntrianDisplay({
  nomor,
  loket,
}: Props) {
  return (
    <div className="flex-1 bg-white rounded-[40px] shadow-2xl flex flex-col justify-center items-center px-10 py-12">

      <p className="text-5xl font-bold tracking-[10px] uppercase text-slate-500">
        NOMOR ANTREAN
      </p>

      <h1 className="mt-10 text-[200px] leading-none font-black text-blue-700">
        {nomor}
      </h1>

      <div className="mt-10 bg-gradient-to-r from-blue-700 to-blue-500 rounded-3xl shadow-xl px-14 py-8">

        <p className="text-3xl text-center text-white">
          Silakan menuju
        </p>

        <h2 className="mt-3 text-7xl font-black text-center text-white">
          Loket {loket}
        </h2>

      </div>

    </div>
  );
}