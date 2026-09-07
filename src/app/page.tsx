import { notFound } from "next/navigation";
import { ResetExperience } from "@/components/reset/reset-experience";
import { PREVIEW_SCREENING_SLUG } from "@/features/check-in/preview-config";
import { getScreeningConfig } from "@/services/submissions/screenings";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const screening = await getScreeningConfig(PREVIEW_SCREENING_SLUG);
  if (!screening) notFound();
  return <ResetExperience screening={screening} />;
}
