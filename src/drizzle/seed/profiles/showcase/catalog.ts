import type { PaymentMethod } from "@/drizzle/schema";

/**
 * Hand-authored literal content for the showcase academy. English only, and
 * no data-generation library (same reasoning as `demo/data.ts`): names are
 * combined from the lists below by the seeded PRNG.
 */

export type ShowcaseCourse = {
  key: string;
  name: string;
  description: string;
  /** Fee in the academy's currency (EGP) for the whole course. */
  price: number;
  /**
   * Each level is `sessionsPerLevel` sessions, one lecture per session (the
   * first lectures of the level's list). Courses run 4–8 sessions in all.
   */
  sessionsPerLevel: number;
  durationMinutes: number;
  /** How often a new cohort of this course opens, relative to the others. */
  weight: number;
  levels: { name: string; lectures: string[] }[];
};

export const SHOWCASE_COURSES: ShowcaseCourse[] = [
  {
    key: "general",
    name: "General English",
    description:
      "Our core programme from first words to confident independent use, aligned to the CEFR.",
    price: 4800,
    sessionsPerLevel: 2,
    durationMinutes: 90,
    weight: 45,
    levels: [
      {
        name: "A1 Beginner",
        lectures: [
          "Greetings and introductions",
          "Numbers, days and dates",
          "Family and friends",
          "Daily routines",
          "Food and shopping",
          "Review and speaking check",
        ],
      },
      {
        name: "A2 Elementary",
        lectures: [
          "Past simple stories",
          "Travel and directions",
          "Comparing things",
          "Making plans",
          "Health and the body",
          "Review and speaking check",
        ],
      },
      {
        name: "B1 Intermediate",
        lectures: [
          "Present perfect experiences",
          "Work and careers",
          "Giving opinions",
          "Conditionals in real life",
          "Media and news",
          "Review and speaking check",
        ],
      },
      {
        name: "B2 Upper-Intermediate",
        lectures: [
          "Narrative tenses",
          "Persuasive language",
          "Passive voice in context",
          "Reported speech",
          "Debating current issues",
          "Review and speaking check",
        ],
      },
    ],
  },
  {
    key: "kids",
    name: "Kids English Adventures",
    description:
      "Playful, story-led English for ages 7–12, with songs, games and short projects.",
    price: 3600,
    sessionsPerLevel: 2,
    durationMinutes: 60,
    weight: 15,
    levels: [
      {
        name: "Explorers",
        lectures: [
          "Hello, world!",
          "Colours and shapes",
          "Animals at the zoo",
          "My school bag",
          "Let's count",
          "Show and tell",
        ],
      },
      {
        name: "Adventurers",
        lectures: [
          "My busy week",
          "At the park",
          "Weather words",
          "Story time: the lost kite",
          "Clothes and seasons",
          "Class project day",
        ],
      },
      {
        name: "Champions",
        lectures: [
          "Yesterday's adventure",
          "Superheroes and powers",
          "Around my town",
          "Healthy habits",
          "Writing a postcard",
          "Champions' showcase",
        ],
      },
    ],
  },
  {
    key: "ielts",
    name: "IELTS Preparation",
    description:
      "Exam-focused preparation for all four IELTS papers, with timed mock tests and feedback.",
    price: 5500,
    sessionsPerLevel: 4,
    durationMinutes: 120,
    weight: 15,
    levels: [
      {
        name: "Foundation (Band 5–6)",
        lectures: [
          "Inside the IELTS exam",
          "Listening: form completion",
          "Reading: skimming and scanning",
          "Writing Task 1: describing charts",
          "Speaking Part 1",
          "Vocabulary for common topics",
          "Writing Task 2: essay structure",
          "Mock test and review",
        ],
      },
      {
        name: "Advanced (Band 6.5+)",
        lectures: [
          "Listening: maps and diagrams",
          "Reading: True / False / Not Given",
          "Writing Task 1: processes",
          "Speaking Parts 2 and 3",
          "Cohesion and lexical range",
          "Writing Task 2: argument essays",
          "Timed full mock",
          "Feedback and exam strategy",
        ],
      },
    ],
  },
  {
    key: "business",
    name: "Business English",
    description:
      "Practical English for the workplace: meetings, emails, presentations and negotiation.",
    price: 4200,
    sessionsPerLevel: 3,
    durationMinutes: 90,
    weight: 10,
    levels: [
      {
        name: "Workplace Essentials",
        lectures: [
          "Introducing yourself professionally",
          "Writing clear emails",
          "Telephone and video calls",
          "Small talk with clients",
          "Describing your company",
          "Role-play: first meeting",
        ],
      },
      {
        name: "Professional Communication",
        lectures: [
          "Running a meeting",
          "Presenting with confidence",
          "Negotiation language",
          "Handling complaints",
          "Writing reports",
          "Final presentation day",
        ],
      },
    ],
  },
  {
    key: "conversation",
    name: "Conversation Club",
    description:
      "Small-group speaking practice on everyday and current topics to build fluency.",
    price: 1800,
    sessionsPerLevel: 4,
    durationMinutes: 60,
    weight: 10,
    levels: [
      {
        name: "Fluency Circle",
        lectures: [
          "Hobbies and free time",
          "Travel stories",
          "Food culture",
          "Technology in our lives",
          "Films and series",
          "Dream jobs",
          "Social media debate",
          "Open mic",
        ],
      },
    ],
  },
  {
    key: "grammar",
    name: "Grammar Intensive",
    description:
      "A focused grammar bootcamp that fixes the most common accuracy problems fast.",
    price: 2200,
    sessionsPerLevel: 5,
    durationMinutes: 90,
    weight: 5,
    levels: [
      {
        name: "Accuracy Bootcamp",
        lectures: [
          "Tense review",
          "Articles and determiners",
          "Prepositions that matter",
          "Modal verbs",
          "Conditionals",
          "Relative clauses",
          "Gerunds and infinitives",
          "Final accuracy check",
        ],
      },
    ],
  },
];

export type ShowcaseQuestion = {
  text: string;
  answers: [string, string, string, string];
  /** Index into `answers`. */
  correct: number;
};

/** Rotated across every form so each one gets five distinct questions. */
export const QUESTION_BANK: ShowcaseQuestion[] = [
  {
    text: "She ___ to work every day.",
    answers: ["go", "goes", "going", "gone"],
    correct: 1,
  },
  {
    text: "I have lived here ___ 2019.",
    answers: ["for", "since", "from", "at"],
    correct: 1,
  },
  {
    text: "Choose the correct plural: one child, two ___.",
    answers: ["childs", "childes", "children", "childrens"],
    correct: 2,
  },
  {
    text: "If it rains, we ___ at home.",
    answers: ["stay", "will stay", "stayed", "would stayed"],
    correct: 1,
  },
  {
    text: "Which word is an adjective?",
    answers: ["quickly", "beautiful", "run", "under"],
    correct: 1,
  },
  {
    text: "They ___ watching TV when I arrived.",
    answers: ["was", "were", "are", "be"],
    correct: 1,
  },
  {
    text: "Choose the opposite of 'expensive'.",
    answers: ["cheap", "costly", "rich", "high"],
    correct: 0,
  },
  {
    text: "He is ___ than his brother.",
    answers: ["tall", "more tall", "taller", "tallest"],
    correct: 2,
  },
  {
    text: "Where ___ you born?",
    answers: ["was", "were", "are", "did"],
    correct: 1,
  },
  {
    text: "I'm looking forward ___ you.",
    answers: ["to see", "seeing", "to seeing", "see"],
    correct: 2,
  },
  {
    text: "The report ___ by the manager yesterday.",
    answers: ["wrote", "was written", "has written", "is writing"],
    correct: 1,
  },
  {
    text: "Choose the correct article: ___ university.",
    answers: ["an", "a", "the a", "no article"],
    correct: 1,
  },
  {
    text: "She said she ___ tired.",
    answers: ["is", "was", "be", "has"],
    correct: 1,
  },
  {
    text: "You ___ wear a seatbelt. It's the law.",
    answers: ["might", "could", "must", "would"],
    correct: 2,
  },
  {
    text: "Which sentence is correct?",
    answers: [
      "He don't like tea.",
      "He doesn't like tea.",
      "He not like tea.",
      "He doesn't likes tea.",
    ],
    correct: 1,
  },
  {
    text: "I wish I ___ more time.",
    answers: ["have", "had", "will have", "having"],
    correct: 1,
  },
  {
    text: "The meeting has been ___ until Monday.",
    answers: ["put off", "put on", "put up", "put in"],
    correct: 0,
  },
  {
    text: "Choose the synonym of 'begin'.",
    answers: ["finish", "start", "stop", "end"],
    correct: 1,
  },
  {
    text: "By next year, I ___ my degree.",
    answers: ["finish", "will have finished", "finished", "have finished"],
    correct: 1,
  },
  {
    text: "There isn't ___ milk left.",
    answers: ["some", "any", "many", "a"],
    correct: 1,
  },
  {
    text: "Which is the best opening for a formal email?",
    answers: ["Hey there!", "Dear Ms Adel,", "Yo,", "What's up,"],
    correct: 1,
  },
  {
    text: "The film was so ___ that I fell asleep.",
    answers: ["bored", "boring", "bore", "boredom"],
    correct: 1,
  },
  {
    text: "Neither the teacher ___ the students were late.",
    answers: ["or", "nor", "and", "but"],
    correct: 1,
  },
  {
    text: "Choose the correct question tag: You're coming, ___?",
    answers: ["isn't it", "aren't you", "don't you", "won't you"],
    correct: 1,
  },
  {
    text: "In IELTS Writing Task 1 you should write at least ___ words.",
    answers: ["100", "150", "250", "300"],
    correct: 1,
  },
  {
    text: "Which word means 'to make something better'?",
    answers: ["improve", "reduce", "remove", "ignore"],
    correct: 0,
  },
  {
    text: "He's used to ___ early.",
    answers: ["get up", "getting up", "got up", "gets up"],
    correct: 1,
  },
  {
    text: "This is the house ___ I grew up.",
    answers: ["which", "where", "who", "what"],
    correct: 1,
  },
  {
    text: "Choose the correct spelling.",
    answers: ["accomodation", "accommodation", "acommodation", "accommadation"],
    correct: 1,
  },
  {
    text: "It's time we ___ home.",
    answers: ["go", "went", "going", "will go"],
    correct: 1,
  },
];

/** The academy's branches (docs/designs/academy-branches.md). */
export const SHOWCASE_BRANCHES = [
  {
    key: "nasr",
    name: "Nasr City",
    address: "14 Abbas El Akkad St, Nasr City, Cairo",
    phone: "+20222700100",
  },
  {
    key: "maadi",
    name: "Maadi",
    address: "Road 9, Maadi, Cairo",
    phone: "+20223580200",
  },
  { key: "online", name: "Online", address: null, phone: null },
] as const;
export type ShowcaseBranch = (typeof SHOWCASE_BRANCHES)[number];

/** Class start times a teacher can be given, "HH:mm". */
export const TEACHING_TIMES = ["09:30", "12:00", "14:30", "17:00", "19:30"];

/**
 * Pairs of weekdays (0 = Sunday … 6 = Saturday) covering the working week,
 * Saturday to Thursday. A group meets on one pair.
 */
export const DAY_PAIRS: [number, number][] = [
  [6, 1],
  [0, 3],
  [2, 4],
];

export const FIRST_NAMES = [
  "Ahmed",
  "Mohamed",
  "Mahmoud",
  "Omar",
  "Youssef",
  "Ali",
  "Hassan",
  "Karim",
  "Mostafa",
  "Amr",
  "Tarek",
  "Khaled",
  "Ibrahim",
  "Hossam",
  "Sherif",
  "Ziad",
  "Adham",
  "Marwan",
  "Seif",
  "Hamza",
  "Nour",
  "Salma",
  "Mariam",
  "Farida",
  "Hana",
  "Malak",
  "Jana",
  "Laila",
  "Yasmin",
  "Habiba",
  "Aya",
  "Rana",
  "Dina",
  "Mona",
  "Reem",
  "Nada",
  "Sara",
  "Heba",
  "Menna",
  "Rawan",
  "Adam",
  "Yassin",
  "Fares",
  "Ismail",
  "Mazen",
  "Nadine",
  "Lina",
  "Judy",
  "Carla",
  "Mira",
  "Peter",
  "Mark",
  "John",
  "Mina",
  "George",
  "Maria",
  "Christine",
  "Sandra",
  "Rita",
  "Nancy",
];

export const LAST_NAMES = [
  "Hassan",
  "Ibrahim",
  "Mahmoud",
  "Abdelrahman",
  "Saleh",
  "Farouk",
  "Mansour",
  "Adel",
  "Fathy",
  "Nabil",
  "Samir",
  "Gamal",
  "Shawky",
  "Ezzat",
  "Ramadan",
  "Hamdy",
  "Lotfy",
  "Kamal",
  "Zaki",
  "Fouad",
  "Helmy",
  "Sabry",
  "Rashad",
  "Yehia",
  "Soliman",
  "Naguib",
  "Aziz",
  "Hegazy",
  "Badawy",
  "Sherif",
  "Wahba",
  "Tawfik",
  "Morsy",
  "Khalil",
  "Osman",
  "Atef",
  "Barakat",
  "Hafez",
  "Amin",
  "Galal",
  "Girgis",
  "Hanna",
  "Boutros",
  "Ayoub",
  "Makram",
  "Fahmy",
  "Wassef",
  "Shenouda",
  "Rizk",
  "Saad",
];

export const PAYMENT_METHOD_WEIGHTS: {
  value: PaymentMethod;
  weight: number;
}[] = [
  { value: "cash", weight: 35 },
  { value: "instapay", weight: 25 },
  { value: "bankTransfer", weight: 15 },
  { value: "wallet", weight: 15 },
  { value: "card", weight: 10 },
];

export const NOTE_BODIES = [
  "Prefers evening classes; asked to be told early about the next intake.",
  "Parent called to ask about progress. Shared the latest attendance report.",
  "Strong speaker, needs more work on written accuracy.",
  "Missed two classes for exams. Sent the lecture notes over WhatsApp.",
  "Interested in IELTS after finishing this course.",
  "Asked to split the remaining fee into two installments. Approved.",
  "Very engaged in class; good candidate for the conversation club.",
  "Struggles with listening at native speed. Recommended podcast practice.",
  "Joined late due to travel. Placement confirmed the same level.",
  "Requested a certificate copy for an employer.",
];

export const PLACEMENT_FEEDBACK = [
  "Solid foundation; placed at the start of the programme.",
  "Good comprehension, limited vocabulary. Starting from level one.",
  "Confident speaker with grammar gaps. Level one with extra practice.",
  "Clear pass on the written part; speaking needs warming up.",
];

/**
 * The open question on every final exam. It has no accepted wordings, so the
 * automatic pass can't score it and the response waits for a teacher.
 */
export const SHORT_ANSWER_PROMPT =
  "In three or four sentences, describe how you will keep using English after this course.";

export const SHORT_ANSWER_REPLIES = [
  "I will watch series without subtitles and keep a notebook of new words. I also want to join the conversation club next term.",
  "My job needs emails in English every day, so I will practise writing them carefully and ask my manager for feedback.",
  "I plan to read one short book every month and talk with my cousin who lives in Canada on video calls.",
  "I will take the IELTS exam next year, so I will keep doing practice tests and listening to podcasts on the way to work.",
  "I want to help my children with their homework, so I will study with them and use English at home sometimes.",
  "I will use English when I travel and try to speak more in meetings instead of staying quiet.",
];
