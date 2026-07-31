# Gemini integration (short-answer grading)

How Gateling-TMS grades short-answer questions, what a model adds to that, and
what to configure. Written while building the short-answer grading change on
top of Phase 8.

Gemini is **optional**, and deliberately so. With no key configured, nothing
breaks and nothing silently changes meaning: a short answer that matches an
accepted wording is still marked correct, and one that doesn't is left for a
human. The model only ever decides the cases in between.

This is **not** the `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` OAuth pair used
for sign-in and the Google Forms import (`integrations-google.md`). It is an
API key from Google AI Studio, unrelated to any user's Google account, and it
belongs to the deployment rather than to an organization.

## 1. Setup

1. Get a key from [Google AI Studio](https://aistudio.google.com/apikey).
2. Set it locally in `.env`:

   ```
   GEMINI_API_KEY="…"
   # Optional. Defaults to gemini-2.5-flash.
   GEMINI_MODEL=""
   ```

3. Add `GEMINI_API_KEY` to the Vercel **Preview** and **Production** scopes
   when you want it live there. Different environments may use different keys;
   quota is per key.

Both vars are optional in `src/data/env/server.ts`, so a deployment without
them boots normally.

## 2. How a short answer is graded

Three passes, in order, in `responses/server/`:

1. **Normalise** (`scoring.ts` → `normalizeAnswerText`). Case, surrounding and
   repeated whitespace, punctuation, Latin accents, and the Arabic spelling
   variants people type interchangeably (hamza forms of alef, ya/alef maqsura,
   ta marbuta/ha) are folded away. If the result equals a normalised accepted
   answer, the question is settled — **no model call, no cost**. A blank answer
   is settled here too, as incorrect.
2. **Ask the model** (`grading.ts` → `integrations/gemini/`), but only for the
   questions step 1 couldn't settle, and only when a key is configured. Every
   remaining question in the response goes in **one** request.
3. **Score** (`scoring.ts` → `scoreFormResponse`). Pure and synchronous, so it
   can run inside a transaction — the placement-test flow scores an attempt
   while holding the test's row lock, which is why the model call is a separate
   step that runs *before* the transaction opens.

### What "no verdict" means

A question the model never ruled on — no key, a timeout, a quota error, a
malformed reply, a skipped item — is **not** marked wrong. The whole response
is left ungraded (`score = null`, shown as *Needs grading*) and a grader scores
it by hand from the Responses tab. A partial score would read as a real one.

## 3. Behaviour worth knowing before turning it on

- **It runs inline on submit.** A 15-second timeout caps how long a student can
  wait; past that the response falls back to manual grading rather than hanging.
- **One request per response**, not per question, so a long quiz costs one round
  trip.
- **Structured output.** The model must answer a JSON schema of
  `{ id, isCorrect }` verdicts; ids it wasn't asked about are discarded, so a
  hallucinated id can't mark an unrelated question correct.
- **Student text is untrusted input.** It is fenced in `<student_answer>` tags
  that the system instruction names as data-never-instructions, and a student
  can't write those tags themselves to escape the fence
  (`integrations/gemini/prompt.ts`, covered by `tests/short-answer-prompt.test.ts`).
- **Accepted answers never reach the student's browser.** They are read
  server-side for grading, and the grading sheet that displays them
  (`responses.gradingSheet`) is behind `orgContentManagerProcedure`.
- **Answers may be in either language.** The instruction tells the model to
  translate and judge meaning, so an Arabic answer to an English accepted
  wording is graded on what it says.

## 4. Where the code is

| Path | What it does |
|---|---|
| `src/integrations/gemini/prompt.ts` | System instruction + prompt builder. Pure, no SDK, unit-tested. |
| `src/integrations/gemini/short-answer-matching.ts` | The one network call. Never throws — every failure degrades to "no verdict". |
| `src/features/system/assessments/responses/server/scoring.ts` | Normalisation, the deterministic decision, the scorer. |
| `src/features/system/assessments/responses/server/grading.ts` | Orchestration: what to ask, and when. |

## 5. Cost and quota

Billing and rate limits belong to the AI Studio key, not to any tenant. One
request per submitted response, and only when a response contains a short
answer the deterministic pass couldn't settle — a form of exact matches costs
nothing at all. If the quota is exhausted, grading degrades to manual; it never
fails a submission.
