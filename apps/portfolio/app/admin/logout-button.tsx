"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/client";

export function LogoutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  return (
    <button
      className="button button-secondary"
      disabled={pending}
      onClick={async () => {
        setPending(true);
        await authClient.signOut();
        router.push("/admin/login");
        router.refresh();
      }}
      type="button"
    >
      {pending ? "Signing out…" : "Sign out"}
    </button>
  );
}
