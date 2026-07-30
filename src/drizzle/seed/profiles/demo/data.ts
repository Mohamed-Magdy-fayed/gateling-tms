/**
 * Hand-authored, deterministic demo content — no data-generation library is
 * approved (docs/rebuild/02-dependencies.md has no faker-style package), so
 * this is plain literal data instead. Kept in its own file so the orchestration
 * logic in the sibling files reads as "what gets seeded", not "what the data is".
 */

export type DemoLectureSeed = { name: string; content: string };
export type DemoLevelSeed = { name: string; lectures: DemoLectureSeed[] };
export type DemoCourseSeed = {
  name: string;
  description: string;
  levels: DemoLevelSeed[];
  quiz: { title: string; questions: DemoQuestionSeed[] };
};

export type DemoQuestionSeed = {
  text: string;
  answers: { text: string; isCorrect: boolean }[];
};

export const DEMO_COURSES: DemoCourseSeed[] = [
  {
    name: "English Foundations",
    description:
      "A beginner-to-elementary spoken and written English track for adult learners.",
    levels: [
      {
        name: "Level 1 — Beginner",
        lectures: [
          {
            name: "Lesson 1: Greetings & Introductions",
            content:
              "Everyday greetings, introducing yourself, and basic small talk.",
          },
          {
            name: "Lesson 2: Numbers & Time",
            content:
              "Counting, telling the time, and talking about daily routines.",
          },
        ],
      },
      {
        name: "Level 2 — Elementary",
        lectures: [
          {
            name: "Lesson 1: Past Simple",
            content:
              "Talking about yesterday: regular and irregular past-tense verbs.",
          },
          {
            name: "Lesson 2: Making Plans",
            content:
              "Future intentions, invitations, and simple negotiation phrases.",
          },
        ],
      },
    ],
    quiz: {
      title: "English Foundations Progress Quiz",
      questions: [
        {
          text: "Which greeting is most appropriate in a formal meeting?",
          answers: [
            {
              text: "Good morning, it's a pleasure to meet you.",
              isCorrect: true,
            },
            { text: "Yo, what's up?", isCorrect: false },
            { text: "Hey.", isCorrect: false },
          ],
        },
        {
          text: 'Choose the correct past-simple form: "Yesterday I ___ to the market."',
          answers: [
            { text: "go", isCorrect: false },
            { text: "went", isCorrect: true },
            { text: "goed", isCorrect: false },
          ],
        },
        {
          text: '"I ___ meet you tomorrow at 5pm." — pick the correct word.',
          answers: [
            { text: "will", isCorrect: true },
            { text: "was", isCorrect: false },
            { text: "did", isCorrect: false },
          ],
        },
      ],
    },
  },
  {
    name: "Business English Essentials",
    description:
      "Workplace communication for intermediate learners: emails, meetings, and presentations.",
    levels: [
      {
        name: "Level 1 — Professional Basics",
        lectures: [
          {
            name: "Lesson 1: Writing Professional Emails",
            content: "Structure, tone, and common phrases for workplace email.",
          },
          {
            name: "Lesson 2: Meeting Etiquette",
            content:
              "Joining, contributing to, and closing a business meeting politely.",
          },
        ],
      },
      {
        name: "Level 2 — Advanced Communication",
        lectures: [
          {
            name: "Lesson 1: Giving Presentations",
            content: "Structuring a short presentation and handling questions.",
          },
          {
            name: "Lesson 2: Negotiation Language",
            content:
              "Proposing, countering, and reaching agreement diplomatically.",
          },
        ],
      },
    ],
    quiz: {
      title: "Business English Essentials Progress Quiz",
      questions: [
        {
          text: "Which subject line is most appropriate for a status-update email?",
          answers: [
            { text: "hey", isCorrect: false },
            { text: "Project Alpha — Weekly Status Update", isCorrect: true },
            { text: "!!!", isCorrect: false },
          ],
        },
        {
          text: "What's a polite way to disagree in a meeting?",
          answers: [
            { text: "You're wrong.", isCorrect: false },
            {
              text: "I see it a little differently — could we look at...",
              isCorrect: true,
            },
            { text: "No.", isCorrect: false },
          ],
        },
        {
          text: "Which phrase best opens a negotiation counter-offer?",
          answers: [
            { text: "Take it or leave it.", isCorrect: false },
            { text: "Whatever.", isCorrect: false },
            { text: "What if we met in the middle at...", isCorrect: true },
          ],
        },
      ],
    },
  },
];

export type DemoTraineeSeed = { name: string; email: string; phone: string };

// 25 trainees, real-reading names, deterministic emails/phones — index-based,
// not random, so a re-run always looks up the same natural key (email).
const DEMO_TRAINEE_NAMES: [string, string][] = [
  ["Layla", "Hassan"],
  ["Omar", "Farouk"],
  ["Mona", "Zaki"],
  ["Youssef", "Ibrahim"],
  ["Nour", "Mostafa"],
  ["Karim", "Adel"],
  ["Salma", "Nabil"],
  ["Tarek", "Fathy"],
  ["Dina", "Mahmoud"],
  ["Amr", "Shawky"],
  ["Heba", "Kamal"],
  ["Sherif", "Rashad"],
  ["Rania", "Samir"],
  ["Hassan", "Younis"],
  ["Yasmin", "Ashour"],
  ["Mahmoud", "Ezzat"],
  ["Farida", "Gaber"],
  ["Ahmed", "Sabry"],
  ["Nadia", "Hosny"],
  ["Khaled", "Ramzy"],
  ["Aya", "Fouad"],
  ["Mostafa", "Salah"],
  ["Reem", "Abbas"],
  ["Hany", "Zidan"],
  ["Marwa", "Talaat"],
];

export const DEMO_TRAINEES: DemoTraineeSeed[] = DEMO_TRAINEE_NAMES.map(
  ([first, last], index) => ({
    name: `${first} ${last}`,
    email: `${first.toLowerCase()}.${last.toLowerCase()}@example.com`,
    phone: `+201${String(100000000 + index).padStart(9, "0")}`,
  }),
);
