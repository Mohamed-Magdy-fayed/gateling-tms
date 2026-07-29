import { describe, expect, it } from "vitest";
import { likeContains } from "@/drizzle/lib/search";

describe("likeContains", () => {
  it("wraps an ordinary term in contains wildcards", () => {
    expect(likeContains("ahmed")).toBe("%ahmed%");
  });

  it("escapes a percent sign so it matches literally", () => {
    // Without the escape this reads as "50" followed by anything, so a search
    // for a "50%" discount certificate would return every "50" row.
    expect(likeContains("50%")).toBe("%50\\%%");
  });

  it("escapes an underscore so it isn't a single-character wildcard", () => {
    expect(likeContains("a_b")).toBe("%a\\_b%");
  });

  it("escapes the escape character itself", () => {
    expect(likeContains("a\\b")).toBe("%a\\\\b%");
  });

  it("escapes every wildcard in a term, not just the first", () => {
    expect(likeContains("%_%")).toBe("%\\%\\_\\%%");
  });

  it("leaves a term with no wildcards untouched apart from the wrapping", () => {
    expect(likeContains("O'Brien - B1")).toBe("%O'Brien - B1%");
  });
});
