import Sidebar from "@/app/components/Sidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex" }}>
      <Sidebar />

      <main
        style={{
          flex: 1,
          padding: "20px",
          background: "#f5f5f5",
          minHeight: "100vh",
        }}
      >
        {children}
      </main>
    </div>
  );
}