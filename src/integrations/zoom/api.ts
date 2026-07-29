import { z } from "zod";

const ZOOM_OAUTH_AUTHORIZE_URL = "https://zoom.us/oauth/authorize";
const ZOOM_OAUTH_TOKEN_URL = "https://zoom.us/oauth/token";
const ZOOM_OAUTH_REVOKE_URL = "https://zoom.us/oauth/revoke";
const ZOOM_API_BASE_URL = "https://api.zoom.us/v2";
const ZOOM_FETCH_TIMEOUT_MS = 10_000;

export class ZoomApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

const tokenResponseSchema = z.object({
  access_token: z.string().min(1),
  // Zoom rotates the refresh token on every refresh and invalidates the old
  // one, so callers must persist whatever comes back here, not just the
  // access token.
  refresh_token: z.string().min(1),
  expires_in: z.number().int().positive(),
  scope: z.string().optional(),
});

const zoomUserSchema = z.object({
  id: z.string().min(1),
  account_id: z.string().min(1),
  email: z.email(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
});

export type ZoomTokens = {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
};

export type ZoomAccount = {
  userId: string;
  accountId: string;
  email: string;
  displayName: string;
};

export type ZoomCredentials = {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
};

export function buildAuthorizeUrl(
  credentials: ZoomCredentials,
  state: string,
): string {
  const url = new URL(ZOOM_OAUTH_AUTHORIZE_URL);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", credentials.clientId);
  url.searchParams.set("redirect_uri", credentials.redirectUri);
  url.searchParams.set("state", state);
  return url.toString();
}

export function exchangeAuthorizationCode(
  credentials: ZoomCredentials,
  code: string,
): Promise<ZoomTokens> {
  return requestTokens(credentials, {
    grant_type: "authorization_code",
    code,
    redirect_uri: credentials.redirectUri,
  });
}

export function refreshAccessToken(
  credentials: ZoomCredentials,
  refreshToken: string,
): Promise<ZoomTokens> {
  return requestTokens(credentials, {
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });
}

/** Best-effort: disconnecting locally must succeed even if Zoom rejects this. */
export async function revokeAccessToken(
  credentials: ZoomCredentials,
  accessToken: string,
): Promise<void> {
  const url = new URL(ZOOM_OAUTH_REVOKE_URL);
  url.searchParams.set("token", accessToken);

  await fetchWithTimeout(url.toString(), {
    method: "POST",
    headers: { Authorization: basicAuthHeader(credentials) },
  });
}

export async function fetchZoomAccount(
  accessToken: string,
): Promise<ZoomAccount> {
  const response = await fetchWithTimeout(`${ZOOM_API_BASE_URL}/users/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const payload = await readJson(response);
  if (!response.ok) {
    throw new ZoomApiError(zoomErrorMessage(payload), response.status);
  }

  const user = zoomUserSchema.safeParse(payload);
  if (!user.success) {
    throw new ZoomApiError("Unexpected Zoom user payload.", response.status);
  }

  const displayName = [user.data.first_name, user.data.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();

  return {
    userId: user.data.id,
    accountId: user.data.account_id,
    email: user.data.email,
    displayName: displayName || user.data.email,
  };
}

async function requestTokens(
  credentials: ZoomCredentials,
  body: Record<string, string>,
): Promise<ZoomTokens> {
  const response = await fetchWithTimeout(ZOOM_OAUTH_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: basicAuthHeader(credentials),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(body),
  });

  const payload = await readJson(response);
  if (!response.ok) {
    throw new ZoomApiError(zoomErrorMessage(payload), response.status);
  }

  const tokens = tokenResponseSchema.safeParse(payload);
  if (!tokens.success) {
    throw new ZoomApiError("Unexpected Zoom token payload.", response.status);
  }

  return {
    accessToken: tokens.data.access_token,
    refreshToken: tokens.data.refresh_token,
    expiresAt: new Date(Date.now() + tokens.data.expires_in * 1000),
  };
}

function basicAuthHeader(credentials: ZoomCredentials): string {
  const encoded = Buffer.from(
    `${credentials.clientId}:${credentials.clientSecret}`,
  ).toString("base64");
  return `Basic ${encoded}`;
}

/** Zoom answers with `reason`, `message`, or `error_description` by endpoint. */
function zoomErrorMessage(payload: unknown): string {
  const shape = z
    .object({
      reason: z.string().optional(),
      message: z.string().optional(),
      error_description: z.string().optional(),
    })
    .safeParse(payload);

  if (!shape.success) return "Zoom request failed.";

  return (
    shape.data.reason ??
    shape.data.message ??
    shape.data.error_description ??
    "Zoom request failed."
  );
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    // Zoom's revoke/error paths occasionally answer with an empty body.
    return null;
  }
}

// An unresponsive Zoom would otherwise hang the calling request (or Inngest
// step) indefinitely — same bound as the auth OAuth client uses.
function fetchWithTimeout(url: string, init?: RequestInit) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ZOOM_FETCH_TIMEOUT_MS);

  return fetch(url, { ...init, signal: controller.signal }).finally(() =>
    clearTimeout(timeout),
  );
}
