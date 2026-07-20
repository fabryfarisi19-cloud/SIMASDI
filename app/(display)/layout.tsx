import AuthGuard from "@/app/components/AuthGuard";

export default function DisplayLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthGuard>{children}</AuthGuard>;
}