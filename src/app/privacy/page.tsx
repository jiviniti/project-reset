import type { Metadata } from "next";
import Link from "next/link";
import { BrandedReset, ProjectResetFooter, ResetBrand } from "@/components/brand/reset-brand";

export const metadata: Metadata = {
  title: "Privacy update · Project RESET",
  description: "An interim privacy update for the Project RESET beta.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default function PrivacyUpdatePage() {
  return (
    <main className="experience">
      <div className="phone-shell privacy-page">
        <header className="privacy-page__header">
          <ResetBrand light />
          <p className="eyebrow eyebrow--orange">Privacy update</p>
          <h1>Privacy at Project <BrandedReset /></h1>
        </header>
        <section className="privacy-page__content">
          <h2>Project RESET is currently in beta.</h2>
          <p>Our privacy policy is being finalized.</p>
          <h2>What appears publicly</h2>
          <p>Public Learning Lab results are aggregated and de-identified.</p>
          <p>Names, email addresses, demographics, free-text responses, custom tags, and record identifiers are not displayed publicly.</p>
          <Link className="button button--coral" href="/">Return to Project <BrandedReset /> <span aria-hidden="true">→</span></Link>
        </section>
        <ProjectResetFooter showDataNote={false} />
      </div>
    </main>
  );
}
