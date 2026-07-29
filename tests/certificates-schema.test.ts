import { describe, expect, test } from "vitest";
import {
  certificateDeleteSchema,
  certificateMutationSchema,
  listCertificatesInput,
} from "@/features/system/learning-flow/certificates/server/schemas";
import { issueKeyAt } from "./test-utils";

const traineeId = "3f1c0a3e-2b7d-4a55-9c1e-0d2f4b6a8c10";
const courseId = "7a2d5f18-9c34-4b6e-8f21-5d0c3a7b9e42";
const groupId = "b4e6c2a0-15d7-4f39-8a62-c9e1d3b5f708";

const validCertificate = {
  traineeId,
  title: "Certificate of Completion — English B1",
  courseId: "",
  groupId: "",
};

describe("certificateMutationSchema", () => {
  test("accepts a well-formed certificate with no course or class", () => {
    expect(certificateMutationSchema.safeParse(validCertificate).success).toBe(
      true,
    );
  });

  test("accepts a certificate naming both a course and a class", () => {
    expect(
      certificateMutationSchema.safeParse({
        ...validCertificate,
        courseId,
        groupId,
      }).success,
    ).toBe(true);
  });

  test("accepts explicit nulls for the optional references", () => {
    expect(
      certificateMutationSchema.safeParse({
        ...validCertificate,
        courseId: null,
        groupId: null,
      }).success,
    ).toBe(true);
  });

  test("rejects an empty title", () => {
    const result = certificateMutationSchema.safeParse({
      ...validCertificate,
      title: "   ",
    });

    expect(result.success).toBe(false);
    expect(issueKeyAt(result, "title")).toBe("forms.validation.required");
  });

  test("rejects a title over 256 characters with the matching message key", () => {
    const result = certificateMutationSchema.safeParse({
      ...validCertificate,
      title: "a".repeat(257),
    });

    expect(result.success).toBe(false);
    expect(issueKeyAt(result, "title")).toBe("forms.validation.max256");
  });

  test("rejects a non-uuid trainee", () => {
    expect(
      certificateMutationSchema.safeParse({
        ...validCertificate,
        traineeId: "not-a-uuid",
      }).success,
    ).toBe(false);
  });

  test("rejects a course reference that is neither a uuid nor empty", () => {
    expect(
      certificateMutationSchema.safeParse({
        ...validCertificate,
        courseId: "not-a-uuid",
      }).success,
    ).toBe(false);
  });

  /**
   * Guards STATE.md D82: a `.default()` or `.transform()` here would make the
   * schema's input type diverge from its output type, which silently breaks
   * TanStack Form's validator contract. Parsing an already-complete object
   * must return it unchanged.
   */
  test("does not transform or default any field", () => {
    const result = certificateMutationSchema.safeParse({
      ...validCertificate,
      courseId,
      groupId,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({
        traineeId,
        title: validCertificate.title,
        courseId,
        groupId,
      });
    }
  });
});

describe("listCertificatesInput", () => {
  test("defaults paging when nothing is supplied", () => {
    const result = listCertificatesInput.safeParse({});

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.perPage).toBe(20);
      expect(result.data.sorting).toEqual([]);
    }
  });

  test("rejects a page size above the cap", () => {
    expect(listCertificatesInput.safeParse({ perPage: 101 }).success).toBe(
      false,
    );
  });

  test("accepts a trainee filter", () => {
    expect(listCertificatesInput.safeParse({ traineeId }).success).toBe(true);
  });
});

describe("certificateDeleteSchema", () => {
  test("requires a uuid", () => {
    expect(certificateDeleteSchema.safeParse({ id: traineeId }).success).toBe(
      true,
    );
    expect(certificateDeleteSchema.safeParse({ id: "nope" }).success).toBe(
      false,
    );
  });
});
