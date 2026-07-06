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
    <div className="bg-white rounded-3xl shadow-2xl p-10 h-full flex flex-col justify-center items-center">

      <p className="text-2xl font-semibold text-slate-500 uppercase tracking-widest">
        Nomor Antrean
      </p>

      <h1 className="text-[130px] font-extrabold text-blue-700 leading-none mt-6">
        {nomor}
      </h1>

      <div className="mt-8 bg-blue-700 text-white rounded-2xl px-10 py-5">
        <p className="text-xl">Silakan menuju</p>

        <h2 className="text-5xl font-bold">
          Loket {loket}
        </h2>
      </div>

    </div>
  );
}