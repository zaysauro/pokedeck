"use client";

import { createAuthClient } from "@neon/auth/next";

/** Neon Managed Better Auth client (talks to /api/auth/* on this site). */
export const authClient = createAuthClient();
