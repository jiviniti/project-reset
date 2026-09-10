import type { Metadata } from "next";
import { ShareCardConceptGallery } from "@/features/share-card/share-card-concept-gallery";

export const metadata: Metadata = {
  title: "Project RESET · Share-card directions",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default function ShareCardConceptsPage() {
  return <ShareCardConceptGallery />;
}
