import { describe, expect, test } from "vitest";
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
});
