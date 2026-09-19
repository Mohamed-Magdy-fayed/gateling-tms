import { relations } from "drizzle-orm";
import {
  date,
  foreignKey,
  index,
  numeric,
  pgEnum,
  pgTable,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { OrganizationsTable } from "@/drizzle/schemas/auth";
import {
  createdAt,
  createdBy,
  id,
  updatedAt,
  updatedBy,
} from "@/drizzle/schemas/helpers";
import { EnrollmentsTable } from "./enrollments-table";
import { TraineesTable } from "./trainees-table";

// How the money arrived. Cash, bank transfer, InstaPay and mobile wallets
// cover how an Egyptian academy is actually paid today; `card` and `other`
// keep the list from being a dead end for anyone else.
export const paymentMethodValues = [
  "cash",
  "bankTransfer",
  "instapay",
  "wallet",
  "card",
  "other",
] as const;
export type PaymentMethod = (typeof paymentMethodValues)[number];
export const paymentMethodEnum = pgEnum("payment_method", paymentMethodValues);

// A record of an amount a student paid the academy — bookkeeping, not
// billing. There is no invoice, no balance and no gateway behind it: staff
// type in what was received so the student's profile shows what they have
// paid so far. Amounts are in the organization's currency
// (`organizations.currency`); a per-row currency would make the profile's
// total meaningless.
//
// `enrollmentId` is the course the payment was for, when there is one. It is
// a plain single-column FK with ON DELETE SET NULL rather than the composite
// (organizationId, enrollmentId) pattern for the same reason certificates'
// courseId is (STATE.md D79): a composite SET NULL would try to null the
// NOT NULL organizationId and throw. The mutation checks the enrollment
// belongs to the organization *and* to the same trainee before writing it.
export const PaymentsTable = pgTable(
  "payments",
  {
    id,
    organizationId: uuid()
      .notNull()
      .references(() => OrganizationsTable.id, { onDelete: "cascade" }),
    traineeId: uuid().notNull(),
    enrollmentId: uuid().references(() => EnrollmentsTable.id, {
      onDelete: "set null",
    }),
    amount: numeric({ precision: 12, scale: 2, mode: "number" }).notNull(),
    paidAt: date().notNull(),
    method: paymentMethodEnum().notNull().default("cash"),
    // A receipt number, transfer reference or wallet transaction id.
    reference: varchar({ length: 128 }),
    note: varchar({ length: 1024 }),
    createdAt,
    createdBy,
    updatedAt,
    updatedBy,
  },
  (table) => [
    index("payments_organization_id_idx").on(table.organizationId),
    index("payments_trainee_id_idx").on(table.traineeId),
    index("payments_enrollment_id_idx").on(table.enrollmentId),
    unique("payments_organization_id_id_unique").on(
      table.organizationId,
      table.id,
    ),
    foreignKey({
      name: "payments_organization_trainee_fk",
      columns: [table.organizationId, table.traineeId],
      foreignColumns: [TraineesTable.organizationId, TraineesTable.id],
    }).onDelete("cascade"),
  ],
);

export const paymentsRelations = relations(PaymentsTable, ({ one }) => ({
  organization: one(OrganizationsTable, {
    fields: [PaymentsTable.organizationId],
    references: [OrganizationsTable.id],
  }),
  trainee: one(TraineesTable, {
    fields: [PaymentsTable.traineeId],
    references: [TraineesTable.id],
  }),
  enrollment: one(EnrollmentsTable, {
    fields: [PaymentsTable.enrollmentId],
    references: [EnrollmentsTable.id],
  }),
}));

export type Payment = typeof PaymentsTable.$inferSelect;
export type NewPayment = typeof PaymentsTable.$inferInsert;
