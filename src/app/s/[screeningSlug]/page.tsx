import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ResetExperience } from "@/components/reset/reset-experience";
import { getScreeningConfig } from "@/services/submissions/screenings";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function ScreeningPage({
  params,
}: {
  params: Promise<{ screeningSlug: string }>;
}) {
  const { screeningSlug } = await params;
  const screening = await getScreeningConfig(screeningSlug);
  if (!screening) notFound();
  return <ResetExperience screening={screening} />;
}
