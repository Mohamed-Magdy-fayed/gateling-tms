import { z } from "zod";
import { type GoogleForm, googleFormSchema } from "./forms";

const GOOGLE_OAUTH_AUTHORIZE_URL =
  "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_OAUTH_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_OAUTH_REVOKE_URL = "https://oauth2.googleapis.com/revoke";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo";
const GOOGLE_FORMS_API_BASE_URL = "https://forms.googleapis.com/v1";
const GOOGLE_FETCH_TIMEOUT_MS = 10_000;

/**
 * Read-only access to the *structure* of the granting account's forms — never
 * their responses, and never anything else in the account's Drive.
 *
 * Listing an account's forms would need `drive.metadata.readonly`, which
 * Google classifies as a **restricted** scope (a security assessment on top of
 * ordinary verification for a published external app). The import takes a
 * pasted form link instead, which needs only this one sensitive scope — see
 * docs/integrations-google.md and STATE.md D123.
 */
export const GOOGLE_FORMS_SCOPE =
  "https://www.googleapis.com/auth/forms.body.readonly";

/** `openid email` names the connected account on the settings page. */
export const GOOGLE_IMPORT_SCOPES = ["openid", "email", GOOGLE_FORMS_SCOPE];

export class GoogleApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export type GoogleCredentials = {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
};

export type GoogleTokens = {
  accessToken: string;
  /**
   * Google returns this only on the first consent for a given user+client, and
   * never on a refresh — so it is nullable here and the caller keeps whatever
   * it already stored. `prompt=consent` on the authorize URL is what makes the
   * *connect* path reliably get one; a connect that still comes back without
   * one is refused rather than stored, since a grant that can't be refreshed
   * would silently die an hour later.
   */
  refreshToken: string | null;
  expiresAt: Date;
  scope: string;
};

export type GoogleAccount = {
  userId: string;
  email: string;
};

const tokenResponseSchema = z.object({
  access_token: z.string().min(1),
  refresh_token: z.string().min(1).optional(),
  expires_in: z.number().int().positive(),
  scope: z.string().optional(),
});

const userInfoSchema = z.object({
  sub: z.string().min(1),
  email: z.email(),
});

export function buildAuthorizeUrl(
  credentials: GoogleCredentials,
  state: string,
): string {
  const url = new URL(GOOGLE_OAUTH_AUTHORIZE_URL);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", credentials.clientId);
  url.searchParams.set("redirect_uri", credentials.redirectUri);
  url.searchParams.set("scope", GOOGLE_IMPORT_SCOPES.join(" "));
  url.searchParams.set("state", state);
  // Together these are what produce a refresh token: `offline` asks for one,
  // and `consent` re-issues one even for an account that already granted this
  // app before (otherwise a reconnect comes back without one).
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent");
  // The org grant must stand on its own scopes; inheriting whatever the same
  // account happened to approve during sign-in would make what this token can
  // reach depend on unrelated history.
  url.searchParams.set("include_granted_scopes", "false");
  return url.toString();
}

export function exchangeAuthorizationCode(
  credentials: GoogleCredentials,
  code: string,
): Promise<GoogleTokens> {
  return requestTokens(credentials, {
    grant_type: "authorization_code",
    code,
    redirect_uri: credentials.redirectUri,
  });
}

export function refreshAccessToken(
  credentials: GoogleCredentials,
  refreshToken: string,
): Promise<GoogleTokens> {
  return requestTokens(credentials, {
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });
}

/**
 * The token goes in the form body, not the query string: a credential in a URL
 * ends up in access logs and proxy history. Throws when Google refuses, so the
 * caller (an Inngest job) retries and the failure stays visible rather than a
 * disconnect reporting success while Google kept the grant alive.
 */
export async function revokeToken(token: string): Promise<void> {
  const response = await fetchWithTimeout(GOOGLE_OAUTH_REVOKE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ token }),
  });

  // Google answers 400 `invalid_token` for a token that is already dead, which
  // is the outcome the caller wanted.
  if (response.ok || response.status === 400) return;

  throw new GoogleApiError(
    googleErrorMessage(await readJson(response)),
    response.status,
  );
}

export async function fetchGoogleAccount(
  accessToken: string,
): Promise<GoogleAccount> {
  const response = await fetchWithTimeout(GOOGLE_USERINFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const payload = await readJson(response);
  if (!response.ok) {
    throw new GoogleApiError(googleErrorMessage(payload), response.status);
  }

  const user = userInfoSchema.safeParse(payload);
  if (!user.success) {
    throw new GoogleApiError("Unexpected Google user payload.", response.status);
  }

  return { userId: user.data.sub, email: user.data.email };
}

/** Reads one form's structure. Responses are never fetched — see the scope. */
export async function fetchGoogleForm(
  accessToken: string,
  formId: string,
): Promise<GoogleForm> {
  const response = await fetchWithTimeout(
    `${GOOGLE_FORMS_API_BASE_URL}/forms/${encodeURIComponent(formId)}`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );

  const payload = await readJson(response);
  if (!response.ok) {
    throw new GoogleApiError(googleErrorMessage(payload), response.status);
  }

  const form = googleFormSchema.safeParse(payload);
  if (!form.success) {
    throw new GoogleApiError("Unexpected Google form payload.", response.status);
  }

  return form.data;
}

async function requestTokens(
  credentials: GoogleCredentials,
  body: Record<string, string>,
): Promise<GoogleTokens> {
  const response = await fetchWithTimeout(GOOGLE_OAUTH_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      ...body,
      client_id: credentials.clientId,
      client_secret: credentials.clientSecret,
    }),
  });

  const payload = await readJson(response);
  if (!response.ok) {
    throw new GoogleApiError(googleErrorMessage(payload), response.status);
  }

  const tokens = tokenResponseSchema.safeParse(payload);
  if (!tokens.success) {
    throw new GoogleApiError(
      "Unexpected Google token payload.",
      response.status,
    );
  }

  return {
    accessToken: tokens.data.access_token,
    refreshToken: tokens.data.refresh_token ?? null,
    expiresAt: new Date(Date.now() + tokens.data.expires_in * 1000),
    scope: tokens.data.scope ?? "",
  };
}

/**
 * Google answers with `{error: {message}}` from the API endpoints and
 * `{error, error_description}` from the OAuth ones.
 */
function googleErrorMessage(payload: unknown): string {
  const shape = z
    .object({
      error: z
        .union([z.string(), z.object({ message: z.string().optional() })])
        .optional(),
      error_description: z.string().optional(),
    })
    .safeParse(payload);

  if (!shape.success) return "Google request failed.";

  const { error, error_description } = shape.data;
  if (typeof error === "object" && error.message) return error.message;
  if (error_description) return error_description;
  if (typeof error === "string") return error;
  return "Google request failed.";
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    // The revoke endpoint answers with an empty body on success.
    return null;
  }
}

// An unresponsive Google would otherwise hang the calling request (or Inngest
// step) indefinitely — same bound as the Zoom and auth OAuth clients use.
function fetchWithTimeout(url: string, init?: RequestInit) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), GOOGLE_FETCH_TIMEOUT_MS);

  return fetch(url, { ...init, signal: controller.signal }).finally(() =>
    clearTimeout(timeout),
  );
}
