/**
 * The most rows a client-mode table loads in one go.
 *
 * Definition/reference lists (courses, assessment forms, members, academies)
 * render as client-mode tables: the page loads the whole list once and sorts
 * and filters it in the browser, while transactional lists (trainees, groups,
 * enrollments, certificates) page on the server. A single academy's definition
 * lists stay far below this; the cap only keeps a runaway list from turning
 * one request into an unbounded read.
 */
export const CLIENT_TABLE_ROW_LIMIT = 1000;
