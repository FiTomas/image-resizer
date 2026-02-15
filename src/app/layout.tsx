import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Image Resizer - Mac OS 8.1",
  description: "Hromadná úprava obrázků • Mac OS 8.1 Edition",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="cs">
      <body>
        {children}
      </body>
    </html>
  );
}
