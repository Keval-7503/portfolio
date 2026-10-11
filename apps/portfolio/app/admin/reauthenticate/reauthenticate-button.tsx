"use client";

import { useState } from "react";

import { authClient } from "@/lib/auth/client";
import { safeAdminReturnPath } from "@/lib/auth/return-path";

export function ReauthenticateButton({ returnTo }: { returnTo: string }) {
  const [pending, setPending] = useState(false);

  return (
    <button
      className="button button-primary"
      disabled={pending}
      onClick={async () => {
        setPending(true);
        const destination = safeAdminReturnPath(returnTo);
        sessionStorage.setItem("adminReturnTo", destination);
        await authClient.signOut();
        window.location.assign(`/admin/login?returnTo=${encodeURIComponent(destination)}`);
      }}
      type="button"
    >
      {pending ? "Preparing sign-in…" : "Sign in again"}
    </button>
  );
}
