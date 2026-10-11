import type { Metadata } from "next";

import { FullPageLink } from "@/components/full-page-link";
import { PublicSectionShell } from "@/components/public-section-shell";
import { getCurrentPublicResume } from "@/lib/documents/access";
import { getPublicSiteCopy } from "@/lib/homepage/site-copy";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Resume | Keval Patel",
  description: "Keval Patel's current public résumé preview and download.",
  alternates: { canonical: "/resume" },
};

export default async function ResumePage() {
  const [resumeResult, copy] = await Promise.all([getCurrentPublicResume(), getPublicSiteCopy()]);
  const [resume] = resumeResult;
  return (
    <PublicSectionShell
      eyebrow="Public document"
      title="Resume"
      description={resume ? copy["resume.available"] : copy["resume.unavailable"]}
    >
      {resume ? (
        <div className="project-detail-actions">
          <FullPageLink
            className="button button-primary"
            href="/api/resume/current"
            target="_blank"
          >
            Open PDF preview
          </FullPageLink>
          <FullPageLink className="button button-secondary" href="/api/resume/current?download=1">
            Download résumé
          </FullPageLink>
        </div>
      ) : (
        <p className="empty-pill">No public résumé selected</p>
      )}
    </PublicSectionShell>
  );
}
