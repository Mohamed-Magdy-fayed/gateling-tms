// Stands in for the real `server-only` package under vitest — see
// vitest.config.ts. The real module throws on import by design, which is
// exactly the behaviour a Node test runner must not inherit.
export {};
