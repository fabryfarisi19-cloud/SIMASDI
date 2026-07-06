"use client";

type Props = {
  children: React.ReactNode;
};

export default function RiwayatTable({
  children,
}: Props) {
  return (
    <div className="mt-8 bg-white rounded-2xl shadow p-6">
      {children}
    </div>
  );
}