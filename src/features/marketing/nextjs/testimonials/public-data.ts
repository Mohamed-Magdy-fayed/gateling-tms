import type {
  PublicTestimonial,
  ShowcaseSummary,
} from "@/features/marketing/testimonials/server";
import { api } from "@/integrations/trpc/server";

/**
 * The public site's reads of testimonial data, with failure treated as "there
 * is nothing to show".
 *
 * Every consumer already renders gracefully when the result is empty — the hero
 * band and the home testimonial section hide themselves, `/testimonials` shows
 * an empty state. Without these guards a thrown error (a transient database
 * blip, a rate limit) would instead propagate to the nearest error boundary and
 * replace the *whole page*, so a hiccup in a decorative band would take out the
 * landing page. Degrading to the empty rendering these components already
 * handle is strictly better, and the failure is still logged server-side rather
 * than swallowed.
 */

const EMPTY_SHOWCASE: ShowcaseSummary = { academies: [], academyCount: 0 };

export async function getPublicShowcase(): Promise<ShowcaseSummary> {
  try {
    return await (await api()).testimonials.showcase();
  } catch (error) {
    console.error("Failed to load the public showcase band", error);
    return EMPTY_SHOWCASE;
  }
}

export async function getPublicTestimonials(
  limit?: number,
): Promise<PublicTestimonial[]> {
  try {
    return await (await api()).testimonials.listPublic(
      limit === undefined ? {} : { limit },
    );
  } catch (error) {
    console.error("Failed to load published testimonials", error);
    return [];
  }
}
