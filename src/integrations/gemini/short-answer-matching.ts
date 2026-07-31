import "server-only";

import { GoogleGenAI, Type } from "@google/genai";

import { env } from "@/data/env/server";

import {
  buildShortAnswerPrompt,
  type ShortAnswerMatchRequest,
  SYSTEM_INSTRUCTION,
} from "./prompt";

export type { ShortAnswerMatchRequest };

/**
 * `true`/`false` per question id. A question **absent** from the map is not
 * "wrong" — it means no verdict was reached (no key configured, request
 * failed, model skipped it), and the caller must leave it ungraded rather
 * than assume zero. See `scoreFormResponse`.
 */
export type ShortAnswerVerdicts = ReadonlyMap<string, boolean>;

/**
 * A slow model here would stall a student's submit, since grading runs inline.
 * Give up and fall back to manual grading rather than make them wait.
 */
const REQUEST_TIMEOUT_MS = 15_000;

const DEFAULT_MODEL = "gemini-2.5-flash";

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    verdicts: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          isCorrect: { type: Type.BOOLEAN },
        },
        required: ["id", "isCorrect"],
      },
    },
  },
  required: ["verdicts"],
} as const;

type VerdictPayload = {
  verdicts?: { id?: unknown; isCorrect?: unknown }[];
};

let cachedClient: GoogleGenAI | null = null;

function getClient() {
  if (!env.GEMINI_API_KEY) return null;
  cachedClient ??= new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
  return cachedClient;
}

/** True when a key is configured, so callers can log the right reason. */
export function isShortAnswerMatchingConfigured() {
  return Boolean(env.GEMINI_API_KEY);
}

/**
 * Asks the model which submitted answers mean the same as an accepted one.
 *
 * Every question goes in a **single** request — grading runs inline on submit,
 * so one round trip per response is the difference between a snappy submit and
 * a stall on a long form.
 *
 * Never throws. Grading is on the student's submit path, so an unset key, a
 * timeout, a quota error or a malformed reply must degrade to "no verdict"
 * (→ manual grading) rather than fail the submission. The caller distinguishes
 * "no verdict" from "incorrect".
 */
export async function matchShortAnswers(
  items: ShortAnswerMatchRequest[],
): Promise<ShortAnswerVerdicts> {
  const empty: ShortAnswerVerdicts = new Map();
  if (items.length === 0) return empty;

  const client = getClient();
  if (!client) {
    console.warn(
      `[gemini] GEMINI_API_KEY not configured; leaving ${items.length} short answer(s) for manual grading.`,
    );
    return empty;
  }

  const abort = new AbortController();
  const timeout = setTimeout(() => abort.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await client.models.generateContent({
      model: env.GEMINI_MODEL ?? DEFAULT_MODEL,
      contents: buildShortAnswerPrompt(items),
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        // Structured output rather than parsing prose: a grade is only worth
        // recording if we can read it back unambiguously.
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
        abortSignal: abort.signal,
      },
    });

    const raw = response.text;
    if (!raw) {
      console.warn("[gemini] empty grading response; falling back to manual.");
      return empty;
    }

    const parsed = JSON.parse(raw) as VerdictPayload;
    const requestedIds = new Set(items.map((item) => item.questionId));
    const verdicts = new Map<string, boolean>();

    for (const verdict of parsed.verdicts ?? []) {
      // Ignore anything we didn't ask about — a hallucinated id must not be
      // able to mark an unrelated question correct.
      if (typeof verdict.id !== "string" || !requestedIds.has(verdict.id)) {
        continue;
      }
      if (typeof verdict.isCorrect !== "boolean") continue;
      verdicts.set(verdict.id, verdict.isCorrect);
    }

    if (verdicts.size < items.length) {
      console.warn(
        `[gemini] graded ${verdicts.size}/${items.length} short answer(s); the rest need manual grading.`,
      );
    }

    return verdicts;
  } catch (error) {
    // Message only: an SDK error object can carry the request it failed on,
    // and that request's URL is where the API key lives.
    console.error(
      "[gemini] short-answer grading failed:",
      error instanceof Error ? error.message : String(error),
    );
    return empty;
  } finally {
    clearTimeout(timeout);
  }
}
