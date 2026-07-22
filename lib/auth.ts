import { betterAuth } from "better-auth"
import { pool } from "@/lib/db"

export const auth = betterAuth({
  database: pool,
  baseURL:
    process.env.BETTER_AUTH_URL ??
    (process.env.NODE_ENV === "production"
      ? "https://cil.incumb.fun"
      : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : process.env.V0_RUNTIME_URL),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
  },
  trustedOrigins: [
    // C.I.L production domains
    "https://cil.incumb.fun",
    "https://incumb.fun",
    "https://www.incumb.fun",
    // Legacy IHH subdomain — kept as a trusted origin during DNS migration period
    "https://ihh.incumb.fun",
    // v0 preview — V0_RUNTIME_URL is injected per-session
    ...(process.env.V0_RUNTIME_URL ? [process.env.V0_RUNTIME_URL] : []),
    // Vercel deployment URLs (injected automatically at deploy time)
    ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : []),
    ...(process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? [`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`]
      : []),
  ],
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },
  advanced: {
    // In dev/preview the origin is a dynamic vusercontent.net subdomain.
    // Disable the CSRF origin check so v0 preview always works.
    // Production keeps it on via the trustedOrigins list above.
    disableCSRFCheck: process.env.NODE_ENV !== "production",
    defaultCookieAttributes: {
      sameSite: process.env.NODE_ENV === "production" ? ("lax" as const) : ("none" as const),
      secure: true,
    },
  },
})
