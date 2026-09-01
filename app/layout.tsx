
import "./globals.css";
import Providers from "./providers";
import GlobalAudioEngine from "./components/GlobalAudioEngine";

export const metadata = {
  title: "SIMASDI",
  description: "Sistem Informasi Manajemen Arsip Digital",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body>
        <Providers>
          <GlobalAudioEngine />
          {children}
        </Providers>
      </body>
    </html>
  );
}


