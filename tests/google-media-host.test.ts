import { describe, expect, test } from "vitest";
import { isFetchableGoogleMediaUrl } from "../src/integrations/google/media";

/**
 * The import copies images by asking *our server* to fetch a URL that came out
 * of an external API. That is an SSRF shape, and this allowlist is what keeps
 * it from becoming a request to an internal address.
 */
describe("isFetchableGoogleMediaUrl", () => {
  test.each([
    "https://lh3.googleusercontent.com/abc",
    "https://lh7-us.googleusercontent.com/docsz/xyz",
    "https://drive.google.com/file/d/1/view",
    "https://www.gstatic.com/images/x.png",
  ])("allows %s", (url) => {
    expect(isFetchableGoogleMediaUrl(url)).toBe(true);
  });

  test.each([
    // The obvious targets of an SSRF.
    ["http://169.254.169.254/latest/meta-data/", "cloud metadata"],
    ["http://localhost:8288/", "a local service"],
    ["http://127.0.0.1/", "loopback"],
    ["https://10.0.0.5/internal", "a private address"],
    // Hosts that merely *contain* an allowed name.
    ["https://googleusercontent.com.attacker.net/x", "a suffix impostor"],
    ["https://evil-google.com/x", "a lookalike"],
    ["https://notgoogleusercontent.com/x", "a prefix impostor"],
    // The bare allowed suffix with nothing in front of it.
    ["https://googleusercontent.com", "the bare suffix"],
  ])("refuses %s (%s)", (url) => {
    expect(isFetchableGoogleMediaUrl(url)).toBe(false);
  });

  test("refuses plain http even on an allowed host", () => {
    // A network-level attacker could otherwise swap the bytes for something
    // that is then served from our own trusted storage origin.
    expect(
      isFetchableGoogleMediaUrl("http://lh3.googleusercontent.com/abc"),
    ).toBe(false);
  });

  test("refuses credentials in the URL", () => {
    // Never something Google sends, and a known way to make a host look like
    // one thing while resolving to another.
    expect(
      isFetchableGoogleMediaUrl(
        "https://lh3.googleusercontent.com@attacker.net/x",
      ),
    ).toBe(false);
  });

  test.each(["", "not a url", "javascript:alert(1)", "//lh3.googleusercontent.com/x"])(
    "refuses the unparseable or non-http %s",
    (url) => {
      expect(isFetchableGoogleMediaUrl(url)).toBe(false);
    },
  );
});
