/**
 * Zoom's view of the shared token encryption helper — the implementation
 * moved to integrations/oauth/token-crypto.ts once Google's org-level grant
 * needed exactly the same treatment (Phase 7 segment ③). Kept as a re-export
 * so Zoom's call sites keep naming Zoom's own errors.
 *
 * Each provider still resolves its own key (`ZOOM_TOKEN_ENCRYPTION_KEY`,
 * `GOOGLE_TOKEN_ENCRYPTION_KEY`) in its own `config.ts`.
 */
export {
  decryptToken,
  encryptToken,
  TokenCipherError as ZoomTokenCipherError,
  TokenKeyError as ZoomTokenKeyError,
} from "@/integrations/oauth/token-crypto";
