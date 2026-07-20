import type { LanguageMessages } from "../lib";

export default {
  locale: "en",
  opposite: "عربي",
  appName: "Gateling-TMS",
  logoName: "Gateling",
  nav: {
    dashboard: "Dashboard",
    contentLibrary: "Content Library",
    learningFlow: "Learning Flow",
    liveClasses: "Live Classes",
    settings: "Settings",
  },
  actions: {
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    edit: "Edit",
    create: "Create",
    search: "Search",
  },
  common: {
    loading: "Loading...",
    empty: "No data available.",
    required: "Required",
    yes: "Yes",
    no: "No",
    confirm: "Confirm",
    areYouSure: "Are you sure?",
    back: "Back",
    next: "Next",
    close: "Close",
    noOptionsFound: "No options found.",
  },
  errors: {
    generic: "Something went wrong. Please try again.",
    notFound: "The requested item was not found.",
    unauthorized: "You are not authorized to perform this action.",
    validationFailed: "Please check the highlighted fields and try again.",
  },
  languageToggle: "Switch language",
  themeToggle: "Toggle theme",
} as const satisfies LanguageMessages;
