import type {
  AnswersTable,
  CoursesTable,
  FormSectionsTable,
  FormsTable,
  LecturesTable,
  LevelsTable,
  QuestionsTable,
} from "@/drizzle/schema";
import { SEED_SYSTEM_ACTOR } from "../../constants";
import {
  QUESTION_BANK,
  SHOWCASE_COURSES,
  type ShowcaseCourse,
} from "./catalog";
import { stableId } from "./determinism";

const QUESTIONS_PER_FORM = 5;

/** The catalogue "existed" well before the first cohort opened. */
export const CONTENT_CREATED_AT = new Date("2024-09-01T09:00:00Z");

/** A form's questions with the id of the correct answer, for scoring responses. */
export type ScoredForm = {
  id: string;
  questions: { id: string; correctAnswerId: string; answerIds: string[] }[];
};

export type PlannedCourse = {
  course: ShowcaseCourse;
  id: string;
  levels: {
    id: string;
    lectureIds: string[];
    quiz: ScoredForm;
  }[];
  finalExam: ScoredForm;
  placementForm: ScoredForm;
};

export type ContentRows = {
  courses: (typeof CoursesTable.$inferInsert)[];
  levels: (typeof LevelsTable.$inferInsert)[];
  lectures: (typeof LecturesTable.$inferInsert)[];
  forms: (typeof FormsTable.$inferInsert)[];
  sections: (typeof FormSectionsTable.$inferInsert)[];
  questions: (typeof QuestionsTable.$inferInsert)[];
  answers: (typeof AnswersTable.$inferInsert)[];
};

/**
 * Courses → levels → lectures, plus a published quiz per level and a final
 * exam and placement test per course. Nothing here depends on the clock, so it
 * is identical on every run.
 */
export function planContent(organizationId: string): {
  rows: ContentRows;
  courses: PlannedCourse[];
} {
  const rows: ContentRows = {
    courses: [],
    levels: [],
    lectures: [],
    forms: [],
    sections: [],
    questions: [],
    answers: [],
  };
  const stamp = {
    createdAt: CONTENT_CREATED_AT,
    updatedAt: CONTENT_CREATED_AT,
  };
  let questionCursor = 0;

  const addForm = (input: {
    key: string;
    title: string;
    type: "quiz" | "final" | "placement";
    courseId: string;
    levelId?: string;
  }): ScoredForm => {
    const formId = stableId(`form:${input.key}`);
    const sectionId = stableId(`form-section:${input.key}`);
    rows.forms.push({
      id: formId,
      organizationId,
      courseId: input.courseId,
      levelId: input.levelId ?? null,
      type: input.type,
      status: "published",
      title: input.title,
      ...stamp,
    });
    rows.sections.push({
      id: sectionId,
      organizationId,
      formId,
      title: "Questions",
      order: 0,
      ...stamp,
    });

    const questions: ScoredForm["questions"] = [];
    for (let q = 0; q < QUESTIONS_PER_FORM; q += 1) {
      const bankItem = QUESTION_BANK[questionCursor % QUESTION_BANK.length];
      questionCursor += 1;
      const questionId = stableId(`question:${input.key}:${q}`);
      rows.questions.push({
        id: questionId,
        organizationId,
        sectionId,
        text: bankItem.text,
        type: "single_choice",
        points: 1,
        isRequired: true,
        order: q,
        ...stamp,
      });
      const answerIds = bankItem.answers.map((text, a) => {
        const answerId = stableId(`answer:${input.key}:${q}:${a}`);
        rows.answers.push({
          id: answerId,
          organizationId,
          questionId,
          text,
          isCorrect: a === bankItem.correct,
          order: a,
          ...stamp,
        });
        return answerId;
      });
      questions.push({
        id: questionId,
        correctAnswerId: answerIds[bankItem.correct],
        answerIds,
      });
    }
    return { id: formId, questions };
  };

  const courses = SHOWCASE_COURSES.map((course): PlannedCourse => {
    const courseId = stableId(`course:${course.key}`);
    rows.courses.push({
      id: courseId,
      organizationId,
      name: course.name,
      description: course.description,
      createdBy: SEED_SYSTEM_ACTOR,
      ...stamp,
    });

    const levels = course.levels.map((level, levelIndex) => {
      const levelKey = `${course.key}:${levelIndex}`;
      const levelId = stableId(`level:${levelKey}`);
      rows.levels.push({
        id: levelId,
        organizationId,
        courseId,
        name: level.name,
        order: levelIndex,
        ...stamp,
      });
      const lectureIds = level.lectures.map((name, lectureIndex) => {
        const lectureId = stableId(`lecture:${levelKey}:${lectureIndex}`);
        rows.lectures.push({
          id: lectureId,
          organizationId,
          levelId,
          name,
          description: `${course.name} · ${level.name}, session ${lectureIndex + 1}.`,
          order: lectureIndex,
          ...stamp,
        });
        return lectureId;
      });
      const quiz = addForm({
        key: `quiz:${levelKey}`,
        title: `${level.name} Quiz`,
        type: "quiz",
        courseId,
        levelId,
      });
      return { id: levelId, lectureIds, quiz };
    });

    const finalExam = addForm({
      key: `final:${course.key}`,
      title: `${course.name} Final Exam`,
      type: "final",
      courseId,
    });
    const placementForm = addForm({
      key: `placement:${course.key}`,
      title: `${course.name} Placement Test`,
      type: "placement",
      courseId,
    });

    return { course, id: courseId, levels, finalExam, placementForm };
  });

  return { rows, courses };
}
