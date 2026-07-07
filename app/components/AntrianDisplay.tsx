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
  <div className="bg-white rounded-[40px] shadow-2xl h-full flex flex-col justify-center items-center px-8 py-12">

    <p className="text-4xl font-bold tracking-[8px] uppercase text-slate-500">
      Nomor Antrean
    </p>

    <h1 className="text-[180px] font-black text-blue-700 leading-none mt-10">
      {nomor}
    </h1>

    <div className="mt-12 bg-gradient-to-r from-blue-700 to-blue-500 rounded-3xl px-12 py-8 shadow-xl">

      <p className="text-3xl text-center text-white">
        Silakan menuju
      </p>

      <h2 className="text-7xl font-black text-center text-white mt-3">
        Loket {loket}
      </h2>

    </div>

  </div>
);
}