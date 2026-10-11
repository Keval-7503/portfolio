import type { HomepageResearchEntry } from "@/lib/homepage/sections";

export function ResearchList({ entries }: { entries: HomepageResearchEntry[] }) {
  return (
    <div className="research-entry-list">
      {entries.map((entry, index) => (
        <article className="research-entry-card" key={`${entry.title}-${index}`}>
          <div className="research-entry-meta">
            <span>{entry.category || "Research"}</span>
            {entry.period ? <span>{entry.period}</span> : null}
          </div>
          <h3>{entry.title}</h3>
          <p>{entry.summary}</p>
          {entry.url ? (
            <a href={entry.url} rel="noreferrer" target="_blank">
              View research source
            </a>
          ) : null}
        </article>
      ))}
    </div>
  );
}
