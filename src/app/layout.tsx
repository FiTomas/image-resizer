import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Image Resizer",
  description: "Hromadná úprava a komprese obrázků",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="cs">
      <body>{children}</body>
    </html>
  );
}
