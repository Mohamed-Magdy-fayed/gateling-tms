import { dt, type LanguageMessages } from "../lib"

export default {
  locale: "ar",
  greetings: "مرحبًا {name}! آخر تسجيل دخول لك كان في {lastLoginDate:date}.",
  inboxMessages: dt("مرحبًا {name}، لديك {messages:plural}.", {
    plural: { messages: { one: "رسالة واحدة", other: "{?} رسائل" } },
  }),
  hobby: dt("اخترت {hobby:enum} كهوايتك.", {
    enum: { hobby: { runner: "عداء", developer: "مطور" } },
  }),
  nested: {
    greetings: "مرحبًا"
  },
  languageToggle: 'تبديل اللغة',
  themeToggle: 'تبديل الالوان',
} as const satisfies LanguageMessages
