import landingEn from "@/features/landing-page/landing-en"
import { dt, type LanguageMessages } from "../lib"
import getStartedEn from "@/features/get-started/get-started-en"
import emailsEn from "@/services/resend/data/emails-en"
import authEn from "@/features/auth/i18n/auth-en"
import sidebarEn from "@/features/system-layout/i18n/sidebar-en"
import contentEn from "@/features/content/i18n/content-en"
import { markdownEn } from "@/components/markdown/MarkdownTranslatoin"
import aboutEn from "@/app/[lang]/(landing-page)/about/_shared/about-en"
import featuresEn from "@/app/[lang]/(landing-page)/features/_shared/features-en"
import pricingEn from "@/app/[lang]/(landing-page)/pricing/_shared/pricing-en"
import contactEn from "@/app/[lang]/(landing-page)/contact/_shared/contact-en"
import plansEn from "@/features/plans/i18n/plans-en"

export default {
  common: {
    readMore: "Read More",
    selectAll: "Select all",
    selectRow: "Select row",
    openMenu: "Open menu",
    edit: "Edit",
    delete: "Delete",
    back: "Back",
    actions: "Actions",
    clear: "Clear",
  },
  locale: "en",
  greetings: "Hello {name}! Your last login was {lastLoginDate:date}.",
  inboxMessages: dt("Hello {name}, you have {messages:plural}.", {
    plural: { messages: { one: "1 message", other: "{?} messages" } },
  }),
  hobby: dt("You chose {hobby:enum} as your hobby.", {
    enum: { hobby: { runner: "runner", developer: "developer" } },
  }),
  nested: {
    greetings: "Hello",
  },
  missingES: "This is a missing translation in es-ES",
  languageToggle: 'Switch language',
  themeToggle: 'Toggle theme',
  getStarted: 'Get Started',
  premium: 'Premium',
  error: dt('An error occurred {error}. Please try again later.', {}),
  errors: {
    emailExists: 'Email already exists!',
    invalidEmail: "Incorrect Email, please try again.",
  },
  system: {
    mainNavigation: 'Main Navigation',
    generalNavigation: 'General',
    userMenu: {
      profile: 'Profile',
      settings: 'Settings',
      logout: 'Logout',
      login: 'Login',
      register: 'Register',
    },
    notifications: {
      title: 'Notifications',
      markAllAsRead: 'Mark all as read',
      noNotifications: 'No notifications yet.',
    },
    sidebar: {
      toggle: 'Toggle sidebar',
    }
  },
  loading: "Loading...",
  ...landingEn,
  ...aboutEn,
  ...featuresEn,
  ...pricingEn,
  ...contactEn,
  ...getStartedEn,
  ...emailsEn,
  ...authEn,
  ...sidebarEn,
  ...plansEn,
  ...pricingEn,
  dataTable: {
    from: "From",
    to: "To",
    slider: "{title} slider",
    clear: "Clear",
    clearFilter: "Clear {title} filter",
    export: {
      export: "Export",
      clear: "Clear",
      searchPlaceholder: "Search columns...",
    },
    noColumns: "No columns found.",
    noResults: "No results.",
    selected: "{count:number} selected",
    rowsSelected: dt("{selected:number} of {rows:plural} selected", {
      plural: { rows: { one: "{?} row", other: "{?} rows" } }
    }),
    clearSelection: "Clear selection",
    rowsPerPage: "Rows per page",
    sort: "Sort",
    sortBy: "Sort By",
    noSorting: "No sorting applied!",
    modifySorting: "Modify sorting to organize your rows.",
    addSorting: "Add sorting to organize your rows.",
    addSort: "Add sort",
    resetSorting: "Reset sorting",
    searchFields: "Search fields...",
    noFieldsFound: "No fields found.",
    pageOf: dt("Page {page:number} of {total:number}", {}),
    asc: "Asc",
    desc: "Desc",
    reset: "Reset",
    hide: "Hide",
    view: "View",
  },
  ...contentEn,
  ...markdownEn,
} as const satisfies LanguageMessages
