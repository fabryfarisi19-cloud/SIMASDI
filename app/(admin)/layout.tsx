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
        <div className="isi-content">{children}</div>

        <Footer />
      </main>

      <style>{`
        .isi-admin{
          margin-left:230px;
          min-height:100vh;
          display:flex;
          flex-direction:column;
          background:#f1f5f9;
        }

        .isi-content{
          flex:1;
          padding:22px;
        }

        @media (max-width:768px){

          .isi-admin{
            margin-left:0;
          }

          .isi-content{
            padding:
              84px
              18px
              18px;
          }

        }

      `}</style>
    </AuthGuard>
  );
}