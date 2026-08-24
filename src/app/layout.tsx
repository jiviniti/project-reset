import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Project RESET · Learning Lab",
  description: "Share how burnout shows up and what helps you reset.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
