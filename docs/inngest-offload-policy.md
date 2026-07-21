# Inngest Offload Policy

## Rule

**Any server operation that does not require an immediate response to the client MUST be offloaded to an Inngest background job.**

Never do any of the following inline inside a tRPC mutation or server action:
- Send email (Nodemailer / SMTP)
- Make HTTP requests to external services (Zoom API calls, Google Forms API calls, webhooks)
- Resize or post-process uploaded media (course/lecture images, certificates)
- Generate recurring group sessions from a weekly schedule
- Cascade-delete a course/level/lecture and everything under it
- Recalculate an organization's plan-usage counters (students/courses/storage)

Instead: fire an Inngest event, return success to the client immediately, and let the Inngest function handle retries, logging, and failures.

## Why

1. **User experience** — The user gets a fast response. Email delivery (500ms–3s) or a cascade delete becomes invisible.
2. **Reliability** — Inngest retries failed jobs automatically. A transient SMTP or Zoom API error does not break the mutation.
3. **Observability** — Every job is visible in the Inngest dashboard with logs and retry history.
4. **Decoupling** — Mutations stay simple. Side-effects evolve independently.

## Event catalog

Empty for now — Phase 1 only wires the plumbing (`client.ts`, `functions/index.ts`, the `/api/inngest` route) and one domain-agnostic `example.ts` function to prove `inngest-cli dev` discovery works. Real events land with the phase that needs them, per `docs/rebuild/05-roadmap.md`'s phase breakdown — expected additions:

| Phase | Event(s) |
|---|---|
| 2 | `user/registered` (verification + welcome email), org invite tokens |
| 4 | media processing on course/lecture image upload, cascade delete on course/level/lecture removal |
| 5 | group→session generation from a weekly schedule, plan-usage counter reconciliation |
| 6 | Zoom client authorization, session/attendance sync from Zoom webhooks |
| 7 | Google Forms import processing |

Add rows here as each phase wires its first real event — keep this table in sync with `src/integrations/inngest/functions/`.

## Pattern in a mutation

```ts
// in mutations.ts
export async function createSomething(ctx: TRPCContext, input: CreateSomethingInput) {
  const [row] = await ctx.db.insert(someTable).values(input).returning();

  // Fire and forget — Inngest handles delivery + retries
  await inngest.send({ name: "something/created", data: { id: row.id } });

  return row;
}
```

Do NOT `await` email sending, external API calls, or cascade deletes inline. Do NOT catch their errors inline — let the Inngest function's own retry/error handling own that.
