/**
 * Builds an `ILIKE`/`LIKE` "contains" pattern from a user-typed search term.
 *
 * `%` and `_` are wildcards inside a LIKE pattern, so a term containing either
 * would match far more than the user asked for — searching for `50%` would
 * otherwise return every row containing `50`, and `a_b` would match `axb`.
 * The backslash is escaped too, since it is the escape character itself.
 *
 * Returning the whole `%…%` pattern rather than just the escaped term keeps
 * the wrapping wildcards and the escaping in one place, so a call site can't
 * apply one without the other.
 */
export function likeContains(term: string): string {
  return `%${term.replace(/[\\%_]/g, (char) => `\\${char}`)}%`;
}
