import crypto from "node:crypto";
import { env } from "@/data/env/server";
import { sessionSchema } from "@/features/core/auth/schemas";

import type { Cookies, PartialUser } from "@/features/core/auth/types";
import { redisClient } from "@/integrations/redis";

const SESSION_EXPIRATION_SECONDS = 60 * 60 * 24 * 7; // seven days
const COOKIE_SESSION_KEY = "session-id";

function getSessionExpirationSeconds() {
  return Math.floor(Date.now() / 1000) + SESSION_EXPIRATION_SECONDS;
}

export async function getUserSession(cookies: Pick<Cookies, "get">) {
  const sessionId = cookies.get(COOKIE_SESSION_KEY)?.value;
  if (sessionId == null) return null;

  const session = await getUserSessionById(sessionId);
  if (session == null) return null;
  if (session.exp * 1000 <= Date.now()) return null;

  return session;
}

export async function createUserSession(
  options: {
    user: PartialUser;
    hasPassword?: boolean;
    activeOrganizationId?: string | null;
  },
  cookies: Pick<Cookies, "set">,
) {
  const sessionId = crypto.randomBytes(512).toString("hex").normalize();

  await writeSession(sessionId, {
    sessionId,
    exp: getSessionExpirationSeconds(),
    hasPassword: options.hasPassword ?? false,
    activeOrganizationId: options.activeOrganizationId ?? null,
    user: options.user,
  });

  setCookie(sessionId, cookies);
}

export async function updateUserSessionData(
  user: PartialUser,
  cookies: Pick<Cookies, "get">,
) {
  const sessionId = cookies.get(COOKIE_SESSION_KEY)?.value;
  if (sessionId == null) return null;

  const session = await getUserSessionById(sessionId);
  if (session == null) return null;

  await writeSession(sessionId, { ...session, user });
}

export async function setActiveOrganization(
  organizationId: string | null,
  cookies: Pick<Cookies, "get">,
) {
  const sessionId = cookies.get(COOKIE_SESSION_KEY)?.value;
  if (sessionId == null) return null;

  const session = await getUserSessionById(sessionId);
  if (session == null) return null;

  await writeSession(sessionId, {
    ...session,
    activeOrganizationId: organizationId,
  });
}

export async function updateUserSessionExpiration(
  cookies: Pick<Cookies, "get" | "set">,
) {
  const sessionId = cookies.get(COOKIE_SESSION_KEY)?.value;
  if (sessionId == null) return;

  const session = await getUserSessionById(sessionId);
  if (session == null) return;
  if (session.exp * 1000 <= Date.now()) return;

  await writeSession(sessionId, {
    ...session,
    exp: getSessionExpirationSeconds(),
  });
  setCookie(sessionId, cookies);
}

export async function removeUserFromSession(
  cookies: Pick<Cookies, "get" | "delete">,
) {
  const sessionId = cookies.get(COOKIE_SESSION_KEY)?.value;
  if (sessionId == null) return null;

  await redisClient.del(`session:${sessionId}`);
  cookies.delete(COOKIE_SESSION_KEY);
}

async function writeSession(
  sessionId: string,
  payload: Parameters<typeof sessionSchema.parse>[0],
) {
  await redisClient.set(`session:${sessionId}`, sessionSchema.parse(payload), {
    ex: SESSION_EXPIRATION_SECONDS,
  });
}

function setCookie(sessionId: string, cookies: Pick<Cookies, "set">) {
  cookies.set(COOKIE_SESSION_KEY, sessionId, {
    secure: env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
    expires: new Date(Date.now() + SESSION_EXPIRATION_SECONDS * 1000),
    path: "/",
  });
}

async function getUserSessionById(sessionId: string) {
  const rawSession = await redisClient.get(`session:${sessionId}`);

  const { success, data: session } = sessionSchema.safeParse(rawSession);

  return success ? session : null;
}
