import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Stringsmith",
  description: "Deliberate guitar practice for hard song excerpts."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
