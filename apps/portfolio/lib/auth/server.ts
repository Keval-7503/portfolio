import { getDb } from "@/db";
import { getAuthEnvironment } from "@/lib/env";
import { createPortfolioAuth } from "./factory";

const environment = getAuthEnvironment();

export const auth = createPortfolioAuth({
  db: getDb(),
  baseURL: environment.APP_ORIGIN,
  secret: environment.BETTER_AUTH_SECRET,
  allowedEmails: environment.ADMIN_EMAIL_ALLOWLIST,
});
