import crypto from "node:crypto";
import { describe, expect, test, vi } from "vitest";
import {
  comparePasswords,
  generateSalt,
  hashPassword,
} from "../src/features/core/auth/core/passwordHasher";

describe("password hashing round trip", () => {
  test("comparePasswords succeeds for the same password and salt", async () => {
    const salt = generateSalt();
    const hashedPassword = await hashPassword(
      "correct horse battery staple",
      salt,
    );

    const isMatch = await comparePasswords({
      password: "correct horse battery staple",
      salt,
      hashedPassword,
    });

    expect(isMatch).toBe(true);
  });

  test("comparePasswords fails for a wrong password", async () => {
    const salt = generateSalt();
    const hashedPassword = await hashPassword(
      "correct horse battery staple",
      salt,
    );

    const isMatch = await comparePasswords({
      password: "wrong password",
      salt,
      hashedPassword,
    });

    expect(isMatch).toBe(false);
  });

  test("comparePasswords returns false (not throws) for a malformed stored hash", async () => {
    const salt = generateSalt();

    const isMatch = await comparePasswords({
      password: "correct horse battery staple",
      salt,
      hashedPassword: "not-a-real-hash",
    });

    expect(isMatch).toBe(false);
  });

  test("two salts produce different hashes for the same password", async () => {
    const hashA = await hashPassword("same password", generateSalt());
    const hashB = await hashPassword("same password", generateSalt());

    expect(hashA).not.toBe(hashB);
  });

  test("hashPassword rejects (not throws uncaught) when scrypt errors", async () => {
    // Real crypto.scrypt always invokes its callback asynchronously (off the
    // libuv thread pool) — schedule via setImmediate so this mock reproduces
    // that timing. Without the early `return` after `reject(error)`, the
    // subsequent `hash.toString(...)` call throws a TypeError in that later
    // tick, outside the Promise executor's call stack, which is exactly the
    // unhandled-rejection scenario this test guards against.
    const scryptSpy = vi.spyOn(crypto, "scrypt").mockImplementation(((
      ..._args: unknown[]
    ) => {
      const callback = _args[_args.length - 1] as (
        error: Error | null,
        hash: Buffer | null,
      ) => void;
      setImmediate(() => callback(new Error("scrypt failed"), null));
    }) as typeof crypto.scrypt);

    await expect(hashPassword("x", "y")).rejects.toThrow("scrypt failed");

    scryptSpy.mockRestore();
  });
});
