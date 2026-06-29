import "./globals.css";
import Providers from "./providers";

export const metadata = {
  title: "SIMASDI",
  description: "Sistem Informasi Manajemen Surat dan Disposisi",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}