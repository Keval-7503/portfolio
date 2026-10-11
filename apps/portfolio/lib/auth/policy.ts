import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { getDb } from "@/db";
import { adminUsers } from "@/db/schema";
import { getAuthEnvironment } from "@/lib/env";
import { auth } from "./server";
import { isSessionFresh } from "./session-security";

export async function getAuthorizedAdmin(
  requestHeaders: Headers,
  options: { requireMfa?: boolean; requireFresh?: boolean } = {},
) {
  const session = await auth.api.getSession({ headers: requestHeaders });
  if (!session) return null;
  const email = session.user.email.toLowerCase();
  const environment = getAuthEnvironment();
  if (!environment.ADMIN_EMAIL_ALLOWLIST.includes(email)) return null;

  const [admin] = await getDb()
    .select({ id: adminUsers.id, mfaRequired: adminUsers.mfaRequired })
    .from(adminUsers)
    .where(
      and(
        eq(adminUsers.authUserId, session.user.id),
        eq(adminUsers.email, email),
        eq(adminUsers.status, "active"),
      ),
    )
    .limit(1);
  if (!admin) return null;

  const requiresMfa = options.requireMfa ?? true;
  if (requiresMfa && admin.mfaRequired && !session.user.twoFactorEnabled) {
    return null;
  }
  if (options.requireFresh && !isSessionFresh(new Date(session.session.createdAt))) {
    return null;
  }

  return { session, admin };
}

export async function requireAdmin(options: { requireMfa?: boolean; requireFresh?: boolean } = {}) {
  const requestHeaders = await headers();
  const authorization = await getAuthorizedAdmin(requestHeaders, options);
  if (!authorization) {
    const session = await auth.api.getSession({ headers: requestHeaders });
    if (!session) redirect("/admin/login");
    if (!session.user.twoFactorEnabled && (options.requireMfa ?? true)) {
      redirect("/admin/mfa-setup");
    }
    if (options.requireFresh) redirect("/admin/reauthenticate");
    redirect("/admin/forbidden");
  }
  return authorization;
}
