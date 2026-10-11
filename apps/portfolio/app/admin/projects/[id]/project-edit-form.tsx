"use client";

import { useState, type FormEvent } from "react";

import { FullPageLink } from "@/components/full-page-link";

type EditableProject = {
  id: string;
  githubRepositoryId: string | null;
  customTitle: string | null;
  summaryMarkdown: string | null;
  bodyMarkdown: string | null;
  category: string | null;
  isFeatured: boolean;
  sortOrder: number;
  publicationState: "draft" | "published" | "archived";
  visibilityOverride: "inherit" | "force_hidden" | "force_visible";
};

export function ProjectEditForm({ project }: { project: EditableProject }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const data = new FormData(event.currentTarget);
    const response = await fetch(`/api/admin/projects/${project.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customTitle: data.get("customTitle") || null,
        summaryMarkdown: data.get("summaryMarkdown") || null,
        bodyMarkdown: data.get("bodyMarkdown") || null,
        category: data.get("category") || null,
        isFeatured: data.get("isFeatured") === "on",
        sortOrder: Number(data.get("sortOrder")),
        publicationState: data.get("publicationState"),
        visibilityOverride: data.get("visibilityOverride"),
      }),
    });
    if (!response.ok) {
      setError(
        response.status === 401
          ? "Your session expired. Sign in again."
          : "The project could not be saved.",
      );
      setPending(false);
      return;
    }
    window.location.assign("/admin");
  }

  return (
    <form className="admin-edit-form" onSubmit={submit}>
      <label>
        Custom title
        <input defaultValue={project.customTitle ?? ""} maxLength={120} name="customTitle" />
      </label>
      <label>
        Category
        <input defaultValue={project.category ?? ""} maxLength={80} name="category" />
      </label>
      <label>
        Short summary
        <textarea
          defaultValue={project.summaryMarkdown ?? ""}
          maxLength={2000}
          name="summaryMarkdown"
          rows={4}
        />
      </label>
      <label>
        Project notes (safe Markdown)
        <textarea
          defaultValue={project.bodyMarkdown ?? ""}
          maxLength={100000}
          name="bodyMarkdown"
          rows={14}
        />
      </label>
      <div className="admin-edit-grid">
        <label>
          Publication
          <select defaultValue={project.publicationState} name="publicationState">
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </label>
        <label>
          Visibility
          <select defaultValue={project.visibilityOverride} name="visibilityOverride">
            <option value="inherit">Inherit source</option>
            <option value="force_hidden">Force hidden</option>
            <option value="force_visible">Force visible</option>
          </select>
        </label>
        <label>
          Sort order
          <input
            defaultValue={project.sortOrder}
            max={10000}
            min={-10000}
            name="sortOrder"
            type="number"
          />
        </label>
      </div>
      <label className="admin-checkbox">
        <input defaultChecked={project.isFeatured} name="isFeatured" type="checkbox" /> Featured
        project
      </label>
      {error ? (
        <p className="auth-error" role="alert">
          {error}
        </p>
      ) : null}
      <div className="admin-edit-actions">
        <button className="button button-primary" disabled={pending} type="submit">
          {pending ? "Saving…" : "Save project"}
        </button>
        <FullPageLink
          className="button button-secondary"
          href={`/admin/projects/${project.id}/preview`}
        >
          Preview
        </FullPageLink>
        <FullPageLink className="button button-secondary" href="/admin">
          Cancel
        </FullPageLink>
        {!project.githubRepositoryId ? (
          <button
            className="button button-secondary"
            disabled={pending}
            onClick={async () => {
              if (!window.confirm("Permanently delete this manual project and its revisions?"))
                return;
              setPending(true);
              const response = await fetch(`/api/admin/projects/${project.id}`, {
                method: "DELETE",
              });
              if (response.status === 401) {
                sessionStorage.setItem("adminReturnTo", `/admin/projects/${project.id}`);
                window.location.assign(
                  `/admin/reauthenticate?returnTo=${encodeURIComponent(`/admin/projects/${project.id}`)}`,
                );
                return;
              }
              if (!response.ok) {
                setError("The manual project could not be deleted.");
                setPending(false);
                return;
              }
              window.location.assign("/admin");
            }}
            type="button"
          >
            Delete manual project
          </button>
        ) : null}
      </div>
    </form>
  );
}
