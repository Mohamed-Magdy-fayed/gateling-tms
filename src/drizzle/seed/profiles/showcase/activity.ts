import type {
  CertificatesTable,
  FormResponseAnswer,
  FormResponsesTable,
  PaymentsTable,
  SessionStudentsTable,
  TraineeNotesTable,
} from "@/drizzle/schema";
import { NOTE_BODIES, PAYMENT_METHOD_WEIGHTS } from "./catalog";
import type { Cohort, PlannedSession, Seat } from "./cohorts";
import type { ScoredForm } from "./content";
import {
  addDays,
  addMinutes,
  rngFor,
  stableId,
  toCalendarDate,
} from "./determinism";
import { enrollmentLevelAt, enrollmentStatusAt, expectedAt } from "./lifecycle";
import type { TraineeProfile } from "./records";

/** Classes after this were held on Gateling Meetings, so joins were recorded automatically. */
const MEETINGS_SINCE = new Date("2025-06-01T00:00:00Z");
const FRONT_DESK = "frontdesk@horizon-academy.example";
const CERTIFICATE_DELAY_DAYS = 2;

export type ActivityRows = {
  attendance: (typeof SessionStudentsTable.$inferInsert)[];
  payments: (typeof PaymentsTable.$inferInsert)[];
  certificates: (typeof CertificatesTable.$inferInsert)[];
  responses: (typeof FormResponsesTable.$inferInsert)[];
  notes: (typeof TraineeNotesTable.$inferInsert)[];
};

const happened = (at: Date, now: Date) => at.getTime() <= now.getTime();

function attendanceRow(
  organizationId: string,
  cohort: Cohort,
  session: PlannedSession,
  seat: Seat,
): typeof SessionStudentsTable.$inferInsert {
  const traineeId = stableId(`trainee:${seat.traineeNumber}`);
  const rng = rngFor(`attendance:${session.id}:${seat.traineeNumber}`);
  const present = rng.chance(seat.attendanceRate);
  const viaMeetings = session.scheduledAt.getTime() >= MEETINGS_SINCE.getTime();
  const base = {
    id: stableId(`attendance:${session.id}:${seat.traineeNumber}`),
    organizationId,
    sessionId: session.id,
    traineeId,
    createdAt: session.endsAt,
    updatedAt: session.endsAt,
  };

  if (!present) {
    return {
      ...base,
      status: "absent",
      source: "manual",
      markedBy: cohort.teacher.id,
      attendedMinutes: 0,
      lateMinutes: 0,
    };
  }

  const lateMinutes = rng.chance(0.18) ? rng.int(3, 25) : 0;
  const joinedAt = addMinutes(
    session.scheduledAt,
    lateMinutes || -rng.int(0, 5),
  );
  const leftAt = addMinutes(session.endsAt, -rng.int(0, 8));
  return {
    ...base,
    status: "present",
    source: viaMeetings ? "meetings" : "manual",
    markedBy: viaMeetings ? null : cohort.teacher.id,
    joinedAt: viaMeetings ? joinedAt : null,
    leftAt: viaMeetings ? leftAt : null,
    attendedMinutes: Math.round(
      (leftAt.getTime() - joinedAt.getTime()) / 60_000,
    ),
    lateMinutes,
  };
}

function paymentRows(
  organizationId: string,
  cohort: Cohort,
  seat: Seat,
  now: Date,
): (typeof PaymentsTable.$inferInsert)[] {
  const price = cohort.course.course.price;
  const share = Math.round(price / seat.installments / 50) * 50;
  const stopAt = seat.drop
    ? cohort.sessions[seat.drop.atSession].scheduledAt
    : null;
  const rows: (typeof PaymentsTable.$inferInsert)[] = [];

  for (let i = 0; i < seat.installments; i += 1) {
    const paidOn = addDays(seat.enrolledAt, i * 30);
    if (!happened(paidOn, now)) break;
    if (stopAt && paidOn.getTime() >= stopAt.getTime()) break;
    const rng = rngFor(`payment:${seat.enrollmentId}:${i}`);
    const method = rng.weighted(PAYMENT_METHOD_WEIGHTS);
    const isLast = i === seat.installments - 1;
    rows.push({
      id: stableId(`payment:${seat.enrollmentId}:${i}`),
      organizationId,
      traineeId: stableId(`trainee:${seat.traineeNumber}`),
      enrollmentId: seat.enrollmentId,
      amount: isLast ? price - share * (seat.installments - 1) : share,
      paidAt: toCalendarDate(paidOn),
      method,
      reference:
        method === "cash" ? null : `TX-${String(rng.int(100_000, 999_999))}`,
      note:
        seat.installments > 1
          ? `Installment ${i + 1} of ${seat.installments}`
          : null,
      createdAt: paidOn,
      updatedAt: paidOn,
      createdBy: FRONT_DESK,
    });
  }
  return rows;
}

function responseRow(input: {
  organizationId: string;
  form: ScoredForm;
  userId: string;
  skill: number;
  key: string;
  submittedAt: Date;
}): typeof FormResponsesTable.$inferInsert {
  const rng = rngFor(`response:${input.key}`);
  let score = 0;
  const answers: FormResponseAnswer[] = input.form.questions.map((question) => {
    const correct = rng.chance(input.skill);
    if (correct) score += 1;
    const wrong = question.answerIds.filter(
      (id) => id !== question.correctAnswerId,
    );
    return {
      questionId: question.id,
      selectedAnswerIds: [correct ? question.correctAnswerId : rng.pick(wrong)],
    };
  });
  return {
    id: stableId(`response:${input.key}`),
    organizationId: input.organizationId,
    formId: input.form.id,
    respondentUserId: input.userId,
    answers,
    score,
    submittedAt: input.submittedAt,
    createdAt: input.submittedAt,
  };
}

function planSeatActivity(
  organizationId: string,
  cohort: Cohort,
  seat: Seat,
  profile: TraineeProfile,
  now: Date,
  rows: ActivityRows,
) {
  rows.payments.push(...paymentRows(organizationId, cohort, seat, now));

  const status = enrollmentStatusAt(cohort, seat, now);
  const issuedAt = addDays(cohort.endsAt, CERTIFICATE_DELAY_DAYS);
  if (status === "completed" && happened(issuedAt, now)) {
    rows.certificates.push({
      id: stableId(`certificate:${seat.enrollmentId}`),
      organizationId,
      traineeId: profile.id,
      courseId: cohort.course.id,
      groupId: cohort.id,
      title: `${profile.name} — ${cohort.course.course.name} Certificate of Completion`,
      issuedAt,
      createdAt: issuedAt,
    });
  }

  if (profile.userId) {
    for (const [levelIndex, level] of cohort.course.levels.entries()) {
      const progress = enrollmentLevelAt(cohort, seat, levelIndex, now);
      const submittedAt = addDays(cohort.levels[levelIndex].lastEnd, 1);
      if (progress.status !== "completed" || !happened(submittedAt, now))
        continue;
      rows.responses.push(
        responseRow({
          organizationId,
          form: level.quiz,
          userId: profile.userId,
          skill: seat.skill,
          key: `quiz:${seat.enrollmentId}:${levelIndex}`,
          submittedAt,
        }),
      );
    }
    const finalAt = addDays(cohort.endsAt, 1);
    if (status === "completed" && happened(finalAt, now)) {
      rows.responses.push(
        responseRow({
          organizationId,
          form: cohort.course.finalExam,
          userId: profile.userId,
          skill: seat.skill,
          key: `final:${seat.enrollmentId}`,
          submittedAt: finalAt,
        }),
      );
    }
  }

  const noteRng = rngFor(`notes:${seat.enrollmentId}`);
  const noteCount = noteRng.chance(0.12) ? (noteRng.chance(0.3) ? 2 : 1) : 0;
  for (let n = 0; n < noteCount; n += 1) {
    const at = addMinutes(
      addDays(seat.enrolledAt, noteRng.int(2, 60)),
      noteRng.int(0, 600),
    );
    if (!happened(at, now)) continue;
    rows.notes.push({
      id: stableId(`note:${seat.enrollmentId}:${n}`),
      organizationId,
      traineeId: profile.id,
      body: noteRng.pick(NOTE_BODIES),
      createdAt: at,
      updatedAt: at,
      createdBy: cohort.teacher.email,
    });
  }
}

export function planActivity(input: {
  organizationId: string;
  now: Date;
  cohorts: Cohort[];
  profiles: Map<number, TraineeProfile>;
}): ActivityRows {
  const rows: ActivityRows = {
    attendance: [],
    payments: [],
    certificates: [],
    responses: [],
    notes: [],
  };
  const { organizationId, now } = input;

  for (const cohort of input.cohorts) {
    const seats = cohort.seats.filter((seat) => happened(seat.enrolledAt, now));
    for (const session of cohort.sessions) {
      if (session.cancelled || !happened(session.endsAt, now)) continue;
      for (const seat of seats) {
        if (expectedAt(seat, session)) {
          rows.attendance.push(
            attendanceRow(organizationId, cohort, session, seat),
          );
        }
      }
    }
    for (const seat of seats) {
      const profile = input.profiles.get(seat.traineeNumber);
      if (!profile) continue;
      planSeatActivity(organizationId, cohort, seat, profile, now, rows);
    }
  }
  return rows;
}
