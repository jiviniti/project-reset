import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const poppins = localFont({
  src: [
    { path: "./fonts/poppins-300.woff2", weight: "300" },
    { path: "./fonts/poppins-400.woff2", weight: "400" },
    { path: "./fonts/poppins-500.woff2", weight: "500" },
    { path: "./fonts/poppins-600.woff2", weight: "600" },
    { path: "./fonts/poppins-700.woff2", weight: "700" },
  ],
  variable: "--font-poppins",
  display: "swap",
});

const ebGaramond = localFont({
  src: [
    { path: "./fonts/eb-garamond-400.woff2", weight: "400", style: "normal" },
    { path: "./fonts/eb-garamond-italic-400.woff2", weight: "400", style: "italic" },
  ],
  variable: "--font-eb-garamond",
  display: "swap",
});

const script = localFont({
  src: "./fonts/petit-formal-script-400.woff2",
  variable: "--font-reset-script",
  display: "swap",
});

const campaignUrl = process.env.NEXT_PUBLIC_PROJECT_RESET_SIGNUP_URL?.trim() || "https://projectreset.example/signup";
const campaignOrigin = new URL(campaignUrl).origin;

export const metadata: Metadata = {
  metadataBase: new URL(campaignOrigin),
  title: "Project RESET · Learning Lab",
  description: "Inspired by Third Degree Burnout, Project RESET gathers how burnout shows up and what helps us come back to ourselves.",
  alternates: { canonical: campaignUrl },
  openGraph: {
    type: "website",
    url: campaignUrl,
    title: "Project RESET · How do you reset?",
    description: "Add your voice to a growing community picture inspired by Third Degree Burnout.",
    siteName: "Project RESET",
  },
  twitter: {
    card: "summary_large_image",
    title: "Project RESET · How do you reset?",
    description: "Add your voice to a growing community picture inspired by Third Degree Burnout.",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-US" className={`${poppins.variable} ${ebGaramond.variable} ${script.variable}`}>
      <body>{children}</body>
    </html>
  );
}
