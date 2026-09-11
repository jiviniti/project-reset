import { notFound } from "next/navigation";
import { ResetExperience } from "@/components/reset/reset-experience";
import { getScreeningConfig } from "@/services/submissions/screenings";

export const dynamic = "force-dynamic";

export const PROJECT_RESET_SCREENING_SLUG = "project-reset";

export default async function HomePage() {
  const screening = await getScreeningConfig(PROJECT_RESET_SCREENING_SLUG);
  if (!screening) notFound();
  return <ResetExperience screening={screening} />;
}
