"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import type {
  HomepageSection,
  HomepageSectionConfiguration,
  HomepageResearchEntry,
  HomepageTimelineEntry,
} from "@/lib/homepage/sections";

const labels: Record<HomepageSection["key"], string> = {
  about: "About",
  projects: "Projects",
  research: "Research",
  resume: "Resume",
  experience: "Experience",
  education: "Education",
  contact: "Contact",
};

const emptyTimelineEntry: HomepageTimelineEntry = {
  title: "",
  organization: "",
  period: "",
  location: "",
  summary: "",
};

const emptyResearchEntry: HomepageResearchEntry = {
  title: "",
  category: "",
  period: "",
  summary: "",
  url: "",
  isPublished: false,
};

type CopyField = {
  key: string;
  group: string;
  label: string;
  defaultValue: string;
  multiline?: boolean;
};

export function HomepageSectionForm({
  copyFields,
  initialSections,
}: {
  copyFields: CopyField[];
  initialSections: HomepageSection[];
}) {
  const router = useRouter();
  const [sections, setSections] = useState(initialSections);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  function move(index: number, offset: -1 | 1) {
    const destination = index + offset;
    if (destination < 0 || destination >= sections.length) return;
    const next = [...sections];
    [next[index], next[destination]] = [next[destination], next[index]];
    setSections(next);
  }

  function updateConfiguration(key: HomepageSection["key"], patch: HomepageSectionConfiguration) {
    setSections((current) =>
      current.map((section) =>
        section.key === key
          ? { ...section, configuration: { ...section.configuration, ...patch } }
          : section,
      ),
    );
  }

  function updateEntry(
    key: HomepageSection["key"],
    entryIndex: number,
    patch: Partial<HomepageTimelineEntry>,
  ) {
    const current = sections.find((section) => section.key === key);
    const entries = [...(current?.configuration.entries ?? [])];
    entries[entryIndex] = { ...entries[entryIndex], ...patch };
    updateConfiguration(key, { entries });
  }

  function removeEntry(key: HomepageSection["key"], entryIndex: number) {
    const current = sections.find((section) => section.key === key);
    updateConfiguration(key, {
      entries: (current?.configuration.entries ?? []).filter((_, index) => index !== entryIndex),
    });
  }

  function updateResearchEntry(entryIndex: number, patch: Partial<HomepageResearchEntry>) {
    const current = sections.find((section) => section.key === "research");
    const researchEntries = [...(current?.configuration.researchEntries ?? [])];
    researchEntries[entryIndex] = { ...researchEntries[entryIndex], ...patch };
    updateConfiguration("research", { researchEntries });
  }

  function removeResearchEntry(entryIndex: number) {
    const current = sections.find((section) => section.key === "research");
    updateConfiguration("research", {
      researchEntries: (current?.configuration.researchEntries ?? []).filter(
        (_, index) => index !== entryIndex,
      ),
    });
  }

  async function save() {
    const researchEntries =
      sections.find((section) => section.key === "research")?.configuration.researchEntries ?? [];
    for (const [index, entry] of researchEntries.entries()) {
      if (!entry.title.trim() || !entry.summary.trim()) {
        setMessage(`Research item ${index + 1} needs both a title and summary.`);
        return;
      }
      if (entry.url) {
        try {
          const parsedUrl = new URL(entry.url);
          if (parsedUrl.protocol !== "https:") throw new Error("not_https");
        } catch {
          setMessage(`Research item ${index + 1} needs a complete HTTPS source URL or no URL.`);
          return;
        }
      }
    }
    setPending(true);
    setMessage(null);
    const response = await fetch("/api/admin/homepage-sections", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sections.map((section, sortOrder) => ({ ...section, sortOrder }))),
    });
    if (!response.ok) {
      const result = (await response.json().catch(() => null)) as {
        error?: string;
        message?: string;
      } | null;
      setMessage(
        response.status === 401
          ? "Sign in again before saving."
          : (result?.message ?? "Sections could not be saved. Check every required field."),
      );
    } else {
      setSections((current) => current.map((section, sortOrder) => ({ ...section, sortOrder })));
      setMessage("Homepage order and visibility saved.");
      router.refresh();
    }
    setPending(false);
  }

  return (
    <div>
      <div className="revision-list" aria-label="Homepage sections">
        {sections.map((section, index) => (
          <div className="homepage-section-admin" key={section.key}>
            <label className="admin-checkbox">
              <input
                checked={section.enabled}
                onChange={(event) =>
                  setSections((current) =>
                    current.map((item) =>
                      item.key === section.key ? { ...item, enabled: event.target.checked } : item,
                    ),
                  )
                }
                type="checkbox"
              />
              <span>
                <strong>
                  {index + 1}. {labels[section.key]}
                </strong>
                <small>{section.enabled ? "Visible" : "Hidden"}</small>
              </span>
            </label>
            <div className="admin-edit-actions">
              <button
                aria-label={`Move ${labels[section.key]} up`}
                className="button button-secondary"
                disabled={index === 0 || pending}
                onClick={() => move(index, -1)}
                type="button"
              >
                ↑
              </button>
              <button
                aria-label={`Move ${labels[section.key]} down`}
                className="button button-secondary"
                disabled={index === sections.length - 1 || pending}
                onClick={() => move(index, 1)}
                type="button"
              >
                ↓
              </button>
            </div>
            {section.key === "about" ? (
              <div className="timeline-admin-editor site-settings-editor">
                <h3>Identity and SEO settings</h3>
                <div className="timeline-admin-grid">
                  <label>
                    Display name
                    <input
                      maxLength={100}
                      onChange={(event) =>
                        updateConfiguration(section.key, { displayName: event.target.value })
                      }
                      required
                      value={section.configuration.displayName ?? ""}
                    />
                  </label>
                  <label>
                    Professional headline
                    <input
                      maxLength={160}
                      onChange={(event) =>
                        updateConfiguration(section.key, { headline: event.target.value })
                      }
                      required
                      value={section.configuration.headline ?? ""}
                    />
                  </label>
                </div>
                <label>
                  Browser and search title
                  <input
                    maxLength={120}
                    onChange={(event) =>
                      updateConfiguration(section.key, { metaTitle: event.target.value })
                    }
                    required
                    value={section.configuration.metaTitle ?? ""}
                  />
                </label>
                <label>
                  Search description
                  <textarea
                    maxLength={300}
                    onChange={(event) =>
                      updateConfiguration(section.key, { metaDescription: event.target.value })
                    }
                    required
                    rows={3}
                    value={section.configuration.metaDescription ?? ""}
                  />
                </label>
                <div className="timeline-admin-grid">
                  <label>
                    GitHub URL
                    <input
                      onChange={(event) =>
                        updateConfiguration(section.key, { githubUrl: event.target.value })
                      }
                      required
                      type="url"
                      value={section.configuration.githubUrl ?? ""}
                    />
                  </label>
                  <label>
                    LinkedIn URL
                    <input
                      onChange={(event) =>
                        updateConfiguration(section.key, { linkedinUrl: event.target.value })
                      }
                      required
                      type="url"
                      value={section.configuration.linkedinUrl ?? ""}
                    />
                  </label>
                  <label>
                    Instagram URL
                    <input
                      onChange={(event) =>
                        updateConfiguration(section.key, { instagramUrl: event.target.value })
                      }
                      required
                      type="url"
                      value={section.configuration.instagramUrl ?? ""}
                    />
                  </label>
                </div>
                <h3>Public copy editor</h3>
                <p>
                  Edit public sentences here. Keep placeholders such as {"{count}"}, {"{login}"},
                  and {"{source}"} where they appear.
                </p>
                {Array.from(new Set(copyFields.map((field) => field.group))).map((group) => (
                  <fieldset key={group}>
                    <legend>{group}</legend>
                    {copyFields
                      .filter((field) => field.group === group)
                      .map((field) => (
                        <label key={field.key}>
                          {field.label}
                          {"multiline" in field && field.multiline ? (
                            <textarea
                              maxLength={1000}
                              onChange={(event) =>
                                updateConfiguration(section.key, {
                                  copy: {
                                    ...section.configuration.copy,
                                    [field.key]: event.target.value,
                                  },
                                })
                              }
                              required
                              rows={3}
                              value={section.configuration.copy?.[field.key] ?? field.defaultValue}
                            />
                          ) : (
                            <input
                              maxLength={1000}
                              onChange={(event) =>
                                updateConfiguration(section.key, {
                                  copy: {
                                    ...section.configuration.copy,
                                    [field.key]: event.target.value,
                                  },
                                })
                              }
                              required
                              value={section.configuration.copy?.[field.key] ?? field.defaultValue}
                            />
                          )}
                        </label>
                      ))}
                  </fieldset>
                ))}
              </div>
            ) : null}
            {section.key === "research" ? (
              <div className="timeline-admin-editor">
                <h3>Research content manager</h3>
                <p>
                  Draft items remain private. Enable Published only when an item is ready for the
                  public homepage and Research page.
                </p>
                {(section.configuration.researchEntries ?? []).map((entry, entryIndex) => (
                  <fieldset key={`research-${entryIndex}`}>
                    <legend>Research item {entryIndex + 1}</legend>
                    <div className="timeline-admin-grid">
                      <label>
                        Title
                        <input
                          maxLength={180}
                          onChange={(event) =>
                            updateResearchEntry(entryIndex, { title: event.target.value })
                          }
                          required
                          value={entry.title}
                        />
                      </label>
                      <label>
                        Category
                        <input
                          maxLength={100}
                          onChange={(event) =>
                            updateResearchEntry(entryIndex, { category: event.target.value })
                          }
                          placeholder="Research project"
                          value={entry.category}
                        />
                      </label>
                      <label>
                        Period
                        <input
                          maxLength={80}
                          onChange={(event) =>
                            updateResearchEntry(entryIndex, { period: event.target.value })
                          }
                          placeholder="2026"
                          value={entry.period}
                        />
                      </label>
                      <label>
                        HTTPS source URL (optional)
                        <input
                          onChange={(event) =>
                            updateResearchEntry(entryIndex, { url: event.target.value })
                          }
                          type="url"
                          value={entry.url}
                        />
                      </label>
                    </div>
                    <label>
                      Summary
                      <textarea
                        maxLength={1200}
                        onChange={(event) =>
                          updateResearchEntry(entryIndex, { summary: event.target.value })
                        }
                        required
                        rows={4}
                        value={entry.summary}
                      />
                    </label>
                    <label className="admin-checkbox">
                      <input
                        checked={entry.isPublished}
                        onChange={(event) =>
                          updateResearchEntry(entryIndex, { isPublished: event.target.checked })
                        }
                        type="checkbox"
                      />
                      <span>
                        <strong>Published</strong>
                        <small>{entry.isPublished ? "Visible publicly" : "Private draft"}</small>
                      </span>
                    </label>
                    <button
                      className="button button-secondary"
                      disabled={pending}
                      onClick={() => removeResearchEntry(entryIndex)}
                      type="button"
                    >
                      Remove research item
                    </button>
                  </fieldset>
                ))}
                <button
                  className="button button-secondary"
                  disabled={pending || (section.configuration.researchEntries?.length ?? 0) >= 12}
                  onClick={() =>
                    updateConfiguration("research", {
                      researchEntries: [
                        ...(section.configuration.researchEntries ?? []),
                        { ...emptyResearchEntry },
                      ],
                    })
                  }
                  type="button"
                >
                  Add research item
                </button>
              </div>
            ) : null}
            {section.key === "experience" || section.key === "education" ? (
              <div className="timeline-admin-editor">
                <label>
                  Section heading
                  <input
                    maxLength={160}
                    onChange={(event) =>
                      updateConfiguration(section.key, { heading: event.target.value })
                    }
                    value={section.configuration.heading ?? ""}
                  />
                </label>
                <label>
                  Section introduction
                  <textarea
                    maxLength={600}
                    onChange={(event) =>
                      updateConfiguration(section.key, { intro: event.target.value })
                    }
                    rows={3}
                    value={section.configuration.intro ?? ""}
                  />
                </label>
                {(section.configuration.entries ?? []).map((entry, entryIndex) => (
                  <fieldset key={`${section.key}-${entryIndex}`}>
                    <legend>
                      {labels[section.key]} item {entryIndex + 1}
                    </legend>
                    <div className="timeline-admin-grid">
                      <label>
                        Title
                        <input
                          maxLength={160}
                          onChange={(event) =>
                            updateEntry(section.key, entryIndex, { title: event.target.value })
                          }
                          required
                          value={entry.title}
                        />
                      </label>
                      <label>
                        Organization
                        <input
                          maxLength={160}
                          onChange={(event) =>
                            updateEntry(section.key, entryIndex, {
                              organization: event.target.value,
                            })
                          }
                          required
                          value={entry.organization}
                        />
                      </label>
                      <label>
                        Period
                        <input
                          maxLength={80}
                          onChange={(event) =>
                            updateEntry(section.key, entryIndex, { period: event.target.value })
                          }
                          required
                          value={entry.period}
                        />
                      </label>
                      <label>
                        Location
                        <input
                          maxLength={120}
                          onChange={(event) =>
                            updateEntry(section.key, entryIndex, { location: event.target.value })
                          }
                          value={entry.location}
                        />
                      </label>
                    </div>
                    <label>
                      Summary
                      <textarea
                        maxLength={800}
                        onChange={(event) =>
                          updateEntry(section.key, entryIndex, { summary: event.target.value })
                        }
                        required
                        rows={3}
                        value={entry.summary}
                      />
                    </label>
                    <button
                      className="button button-secondary"
                      disabled={pending}
                      onClick={() => removeEntry(section.key, entryIndex)}
                      type="button"
                    >
                      Remove item
                    </button>
                  </fieldset>
                ))}
                <button
                  className="button button-secondary"
                  disabled={pending || (section.configuration.entries?.length ?? 0) >= 8}
                  onClick={() =>
                    updateConfiguration(section.key, {
                      entries: [
                        ...(section.configuration.entries ?? []),
                        { ...emptyTimelineEntry },
                      ],
                    })
                  }
                  type="button"
                >
                  Add {section.key} item
                </button>
              </div>
            ) : null}
          </div>
        ))}
      </div>
      <div className="admin-edit-actions">
        <button className="button button-primary" disabled={pending} onClick={save} type="button">
          {pending ? "Saving…" : "Save homepage layout"}
        </button>
      </div>
      {message ? <p aria-live="polite">{message}</p> : null}
    </div>
  );
}
