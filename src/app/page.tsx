import { redirect } from "next/navigation";

/**
 * Temporary entry point for the share-card review branch.
 *
 * Do not merge this redirect into the production branch: production should
 * continue to use the participant landing page from `main`.
 */
export default function HomePage() {
  redirect("/share-card-concepts");
}
