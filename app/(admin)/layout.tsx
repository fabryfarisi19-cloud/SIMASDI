import Sidebar from "@/app/components/Sidebar";
import Footer from "@/app/components/footer";
import AuthGuard from "@/app/components/AuthGuard";
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
   <AuthGuard>
  <Sidebar />

  <main className="isi-admin">
    <div style={{ flex: 1 }}>
      {children}
    </div>

    <Footer />
  </main>
      <style>{`
      .isi-admin {
  margin-left: 258px;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

        @media (max-width: 768px) {
          .isi-admin {
            margin-left: 0;
          }
        }
      `}</style>
  </AuthGuard>
  );
}
