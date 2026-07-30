import { and, eq } from "drizzle-orm";
import { db } from "@/drizzle";
import {
  AnswersTable,
  type Course,
  CoursesTable,
  FormSectionsTable,
  FormsTable,
  LecturesTable,
  LevelsTable,
  QuestionsTable,
} from "@/drizzle/schema";
import { seedIfMissing } from "../../base";
import { SEED_SYSTEM_ACTOR } from "../../constants";
import type { DemoCourseSeed } from "./data";

async function seedCourse(organizationId: string, seed: DemoCourseSeed) {
  return seedIfMissing({
    label: `course "${seed.name}"`,
    find: async () => {
      const [row] = await db
        .select()
        .from(CoursesTable)
        .where(
          and(
            eq(CoursesTable.organizationId, organizationId),
            eq(CoursesTable.name, seed.name),
          ),
        )
        .limit(1);
      return row;
    },
    insert: async () => {
      const [row] = await db
        .insert(CoursesTable)
        .values({
          organizationId,
          name: seed.name,
          description: seed.description,
          createdBy: SEED_SYSTEM_ACTOR,
        })
        .returning();
      return row;
    },
  });
}

async function seedLevel(
  organizationId: string,
  courseId: string,
  name: string,
  order: number,
) {
  return seedIfMissing({
    label: `level "${name}" of course ${courseId}`,
    find: async () => {
      const [row] = await db
        .select()
        .from(LevelsTable)
        .where(
          and(
            eq(LevelsTable.organizationId, organizationId),
            eq(LevelsTable.courseId, courseId),
            eq(LevelsTable.name, name),
          ),
        )
        .limit(1);
      return row;
    },
    insert: async () => {
      const [row] = await db
        .insert(LevelsTable)
        .values({ organizationId, courseId, name, order })
        .returning();
      return row;
    },
  });
}

async function seedLecture(
  organizationId: string,
  levelId: string,
  name: string,
  content: string,
  order: number,
) {
  return seedIfMissing({
    label: `lecture "${name}" of level ${levelId}`,
    find: async () => {
      const [row] = await db
        .select()
        .from(LecturesTable)
        .where(
          and(
            eq(LecturesTable.organizationId, organizationId),
            eq(LecturesTable.levelId, levelId),
            eq(LecturesTable.name, name),
          ),
        )
        .limit(1);
      return row;
    },
    insert: async () => {
      const [row] = await db
        .insert(LecturesTable)
        .values({ organizationId, levelId, name, content, order })
        .returning();
      return row;
    },
  });
}

async function seedQuiz(
  organizationId: string,
  courseId: string,
  quiz: DemoCourseSeed["quiz"],
) {
  const form = await seedIfMissing({
    label: `quiz form "${quiz.title}"`,
    find: async () => {
      const [row] = await db
        .select()
        .from(FormsTable)
        .where(
          and(
            eq(FormsTable.organizationId, organizationId),
            eq(FormsTable.courseId, courseId),
            eq(FormsTable.type, "quiz"),
          ),
        )
        .limit(1);
      return row;
    },
    insert: async () => {
      const [row] = await db
        .insert(FormsTable)
        .values({
          organizationId,
          courseId,
          type: "quiz",
          status: "published",
          title: quiz.title,
        })
        .returning();
      return row;
    },
  });

  const section = await seedIfMissing({
    label: `default section of form "${quiz.title}"`,
    find: async () => {
      const [row] = await db
        .select()
        .from(FormSectionsTable)
        .where(
          and(
            eq(FormSectionsTable.organizationId, organizationId),
            eq(FormSectionsTable.formId, form.id),
          ),
        )
        .limit(1);
      return row;
    },
    insert: async () => {
      const [row] = await db
        .insert(FormSectionsTable)
        .values({
          organizationId,
          formId: form.id,
          title: "Questions",
          order: 0,
        })
        .returning();
      return row;
    },
  });

  for (const [questionIndex, questionSeed] of quiz.questions.entries()) {
    const question = await seedIfMissing({
      label: `question "${questionSeed.text}"`,
      find: async () => {
        const [row] = await db
          .select()
          .from(QuestionsTable)
          .where(
            and(
              eq(QuestionsTable.organizationId, organizationId),
              eq(QuestionsTable.sectionId, section.id),
              eq(QuestionsTable.text, questionSeed.text),
            ),
          )
          .limit(1);
        return row;
      },
      insert: async () => {
        const [row] = await db
          .insert(QuestionsTable)
          .values({
            organizationId,
            sectionId: section.id,
            text: questionSeed.text,
            type: "single_choice",
            order: questionIndex,
          })
          .returning();
        return row;
      },
    });

    for (const [answerIndex, answerSeed] of questionSeed.answers.entries()) {
      await seedIfMissing({
        label: `answer "${answerSeed.text}" for question ${question.id}`,
        find: async () => {
          const [row] = await db
            .select()
            .from(AnswersTable)
            .where(
              and(
                eq(AnswersTable.organizationId, organizationId),
                eq(AnswersTable.questionId, question.id),
                eq(AnswersTable.text, answerSeed.text),
              ),
            )
            .limit(1);
          return row;
        },
        insert: async () => {
          const [row] = await db
            .insert(AnswersTable)
            .values({
              organizationId,
              questionId: question.id,
              text: answerSeed.text,
              isCorrect: answerSeed.isCorrect,
              order: answerIndex,
            })
            .returning();
          return row;
        },
      });
    }
  }

  return form;
}

/** Seeds one course with its levels, lectures, and a published quiz form. */
export async function seedDemoCourse(
  organizationId: string,
  seed: DemoCourseSeed,
): Promise<{ course: Course; levelIds: string[] }> {
  const course = await seedCourse(organizationId, seed);

  const levelIds: string[] = [];
  for (const [levelIndex, levelSeed] of seed.levels.entries()) {
    const level = await seedLevel(
      organizationId,
      course.id,
      levelSeed.name,
      levelIndex,
    );
    levelIds.push(level.id);

    for (const [lectureIndex, lectureSeed] of levelSeed.lectures.entries()) {
      await seedLecture(
        organizationId,
        level.id,
        lectureSeed.name,
        lectureSeed.content,
        lectureIndex,
      );
    }
  }

  await seedQuiz(organizationId, course.id, seed.quiz);

  return { course, levelIds };
}
