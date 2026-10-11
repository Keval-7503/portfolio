"use client";

import { useState, type FormEvent } from "react";

import { FullPageLink } from "@/components/full-page-link";

export function ProjectCreateForm() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const data = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/admin/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: data.get("title"),
          category: data.get("category") || null,
          summaryMarkdown: data.get("summaryMarkdown") || null,
          bodyMarkdown: data.get("bodyMarkdown") || null,
        }),
      });
      if (!response.ok) throw new Error("create_failed");
      const created = (await response.json()) as { id: string };
      window.location.assign(`/admin/projects/${created.id}`);
    } catch {
      setError("The draft could not be created.");
      setPending(false);
    }
  }

  return (
    <form className="admin-edit-form" onSubmit={submit}>
      <label>
        Project title
        <input maxLength={120} name="title" required />
      </label>
      <label>
        Category
        <input maxLength={80} name="category" />
      </label>
      <label>
        Short summary
        <textarea maxLength={2000} name="summaryMarkdown" rows={4} />
      </label>
      <label>
        Project notes (safe Markdown)
        <textarea maxLength={100000} name="bodyMarkdown" rows={14} />
      </label>
      <p>The project starts as a private draft. Publishing requires a separate save.</p>
      {error ? (
        <p className="auth-error" role="alert">
          {error}
        </p>
      ) : null}
      <div className="admin-edit-actions">
        <button className="button button-primary" disabled={pending} type="submit">
          {pending ? "Creating…" : "Create private draft"}
        </button>
        <FullPageLink className="button button-secondary" href="/admin">
          Cancel
        </FullPageLink>
      </div>
    </form>
  );
}
