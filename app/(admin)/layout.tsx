import Sidebar from "@/app/components/Sidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Sidebar />

      <main className="isi-admin">{children}</main>

      <style>{`
        .isi-admin {
          margin-left: 258px;
          min-height: 100vh;
        }

        @media (max-width: 768px) {
          .isi-admin {
            margin-left: 0;
          }
        }
      `}</style>
    </>
  );
}
