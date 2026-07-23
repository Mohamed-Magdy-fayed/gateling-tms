import type { LanguageMessages } from "../lib";
import { dt } from "../lib";

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
    actions: "Actions",
    createdAt: "Created At",
    createdBy: "Created By",
    updatedAt: "Last Updated At",
    updatedBy: "Last Updated By",
    deletedAt: "Deleted At",
    deletedBy: "Deleted By",
  },
  errors: {
    generic: "Something went wrong. Please try again.",
    notFound: "The requested item was not found.",
    unauthorized: "You are not authorized to perform this action.",
    validationFailed: "Please check the highlighted fields and try again.",
    noActiveOrganization: "You don't have access to this organization.",
  },
  forms: {
    validation: {
      required: "This field is required.",
      max128: "Must be at most 128 characters.",
    },
  },
  systemPages: {
    auditInfoTitle: "Audit info",
    auditInfoDescription: "Tracking metadata for this record.",
    demoItemsTitle: "Demo items",
    demoItemsLead:
      "Phase 1 acceptance test for the data table, forms, and tRPC working together.",
    demoItemName: "Name",
    demoItemActive: "Active",
    addDemoItem: "Add demo item",
    editDemoItem: "Edit demo item",
    addDemoItemDescription: "Create a new demo item.",
    editDemoItemDescription: "Update this demo item's details.",
    demoItemCreated: "Demo item created.",
    demoItemUpdated: "Demo item updated.",
    demoItemSaveFailed: "Could not save demo item.",
    deleteDemoItemTitle: "Delete demo item?",
    deleteDemoItemDescription:
      "Permanently remove {name}. This action cannot be undone.",
    demoItemDeleted: "Demo item deleted.",
    demoItemDeleteFailed: "Could not delete demo item.",
  },
  dataTable: {
    clear: "Clear",
    clearFilter: "Clear {title} filter",
    searchDemoItemsHint: "Search demo items…",
    export: {
      export: "Export",
    },
    noResults: "No results.",
    selected: "{count:number} selected",
    clearSelection: "Clear selection",
    rowsPerPage: "Rows per page",
    pageOf: dt("Page {page:number} of {total:number}", {}),
    totalRows: dt("{count:plural} total", {
      plural: { count: { one: "{?} row", other: "{?} rows" } },
    }),
    asc: "Asc",
    desc: "Desc",
    reset: "Reset",
    hide: "Hide",
    toggleColumns: "Toggle columns",
    goToFirstPage: "Go to first page",
    goToPreviousPage: "Go to previous page",
    goToNextPage: "Go to next page",
    goToLastPage: "Go to last page",
    filters: "Filters",
    searchRows: "Search table…",
    pinLeft: "Pin left",
    pinRight: "Pin right",
    unpin: "Unpin",
    presetToday: "Today",
    presetYesterday: "Yesterday",
    presetLast7Days: "Last 7 days",
    presetLast30Days: "Last 30 days",
    presetThisMonth: "This month",
    numberMin: "Min",
    numberMax: "Max",
    id: "ID",
    exportSuccess: dt("Exported {count:number} row(s).", {}),
    exportFailed: "Export failed.",
  },
  languageToggle: "Switch language",
  themeToggle: "Toggle theme",
  auth: {
    emails: {
      common: {
        fromName: "Gateling-TMS",
        defaultRecipientName: "there",
        greeting: "Hi {name},",
        signature: "— The Gateling-TMS Team",
        minuteSingular: "minute",
        minutePlural: "minutes",
      },
      emailVerification: {
        subject: "Verify your email address",
        text: "Hi {name}, please verify your email within {expiryHours} hours: {verificationUrl}",
        intro:
          "Please confirm your email address. This link expires in {expiryHours} hours.",
        ctaLabel: "Verify email",
        ignore: "If you didn't create this account, you can ignore this email.",
      },
      passwordReset: {
        subject: "Your password reset code",
        text: "Hi {name}, your password reset code is {code}. It expires in {expiresIn} {minutesLabel}.",
        intro:
          "Use the code below to reset your password. It expires in {expiresIn} {minutesLabel}.",
        ignore:
          "If you didn't request a password reset, you can ignore this email.",
      },
    },
    backToHome: "Back to home",
    signOut: "Sign out",
    emailPlaceholder: "you@example.com",
    error: {
      badRequest: "Invalid request. Please try again.",
      credentials: "Incorrect email or password.",
      rateLimited: "Too many attempts. Please try again later.",
    },
    validation: {
      required: "This field is required.",
      invalidEmail: "Enter a valid email address.",
      invalidPhone: "Enter a valid phone number.",
      passwordRequired: "Password is required.",
      passwordMinLength: "Password must be at least 8 characters.",
      passwordLowercase: "Password must include a lowercase letter.",
      passwordUppercase: "Password must include an uppercase letter.",
      passwordNumber: "Password must include a number.",
      otpSixDigits: "Enter the 6-digit code.",
    },
    signIn: {
      title: "Welcome back",
      description: "Sign in to your Gateling-TMS account.",
      continueWith: "Or continue with email",
      emailLabel: "Email",
      continue: "Continue",
      passwordLabel: "Password",
      forgotPassword: "Forgot password?",
      back: "Back",
      submitting: "Signing in…",
      submit: "Sign in",
      noAccount: "Don't have an account?",
      toSignUp: "Sign up",
      hasAccount: "Already have an account?",
    },
    signUp: {
      title: "Create your account",
      description: "Start managing your training center for free.",
      nameLabel: "Full name",
      emailLabel: "Email",
      phoneLabel: "Phone number",
      passwordLabel: "Password",
      submitting: "Creating account…",
      submit: "Create account",
      toSignIn: "Sign in",
      error: {
        duplicate: "An account with this email already exists.",
        generic: "Could not create your account. Please try again.",
        sessionFailed:
          "Your account was created, but we couldn't sign you in automatically. Please sign in.",
      },
    },
    oauth: {
      error: {
        failed: "Failed to connect. Please try again.",
      },
    },
    passwordReset: {
      submitting: "Sending code…",
      submit: "Send reset code",
      otpLabel: "6-digit code",
      newPasswordLabel: "New password",
      request: {
        emailError: "Could not send the reset code. Please try again.",
      },
      reset: {
        submit: "Reset password",
        success: "Your password has been reset.",
        invalidCode: "That code is invalid or expired.",
        error: "Could not reset your password. Please try again.",
      },
    },
    emailVerification: {
      heading: "Verify your email",
      backHome: "Back to home",
      alreadyVerifiedNote: "Your email is already verified.",
      sent: "Verification email sent.",
      success: { verified: "Your email has been verified." },
      passkeyPrompt: {
        setUp: "Set up a passkey",
        skip: "Skip, go to dashboard",
      },
      notice: {
        missingEmail: "No email on file to verify.",
        signInRequired: "Sign in to verify your email.",
        sending: "Sending…",
        sendButton: "Resend verification email",
      },
      error: {
        missingEmail: "No email on file to verify.",
        sendFailed: "Could not send the verification email.",
        invalidToken: "This verification link is invalid.",
        expired: "This verification link has expired.",
      },
    },
    passkeys: {
      pageTitle: "Passkeys",
      pageDescription:
        "Manage the passkeys you can use to sign in without a password.",
      add: "Add a passkey",
      registering: "Registering…",
      deleting: "Removing…",
      delete: {
        label: "Remove",
        confirm:
          "Remove this passkey? You may not be able to sign in with it again.",
        notFound: "Passkey not found.",
        success: "Passkey removed.",
        error: "Could not remove passkey.",
      },
      list: {
        empty: "No passkeys yet.",
        defaultLabel: "Passkey",
        created: "Added",
        lastUsed: "Last used",
      },
      register: {
        unsupported: "Passkeys aren't supported on this device.",
        success: "Passkey registered.",
        cancelled: "Passkey registration was cancelled.",
        error: "Could not register passkey.",
        invalidChallenge:
          "This registration attempt expired. Please try again.",
      },
      auth: {
        button: "Sign in with a passkey",
        pending: "Signing in…",
        error: {
          emailRequired: "Enter your email first.",
          unsupported: "Passkeys aren't supported on this device.",
          cancelled: "Passkey sign-in was cancelled.",
          generic: "Could not sign in with that passkey.",
          userNotFound: "No account found for that email.",
          noCredentials: "This account has no passkeys yet.",
          invalidChallenge: "This sign-in attempt expired. Please try again.",
          credentialMismatch: "That passkey isn't registered to this account.",
        },
      },
      error: {
        missingRpId: "Passkeys aren't available in this environment.",
      },
    },
  },
  organizations: {
    pageTitle: "Organization settings",
    pageLead: "Manage your organization's profile, plan, and members.",
    validation: {
      invalidWebsite: "Enter a valid website URL.",
    },
    plan: {
      free: "Free",
      basic: "Basic",
      professional: "Professional",
      enterprise: "Enterprise",
    },
    profile: {
      editTitle: "Edit organization",
      editDescription: "Update your organization's profile details.",
      nameLabel: "Organization name",
      businessNameLabel: "Business name",
      phoneLabel: "Phone",
      websiteLabel: "Website",
      saveSuccess: "Organization updated.",
      saveFailed: "Could not update the organization.",
    },
    switcher: {
      label: "Select organization",
      switched: "Switched organization.",
      switchFailed: "Could not switch organization.",
    },
    members: {
      title: "Members",
      searchHint: "Search members…",
      columnName: "Name",
      columnEmail: "Email",
      columnRole: "Role",
      columnJoinedAt: "Joined",
      role: {
        admin: "Admin",
        teacher: "Teacher",
        student: "Student",
      },
      changeRole: "Change role",
      inviteButton: "Invite member",
      inviteTitle: "Invite a member",
      inviteDescription: "Send an email invitation to join this organization.",
      inviteEmailLabel: "Email",
      inviteRoleLabel: "Role",
      inviteSent: "Invitation sent.",
      inviteFailed: "Could not send the invitation.",
      alreadyMember: "This person is already a member of this organization.",
      roleUpdated: "Role updated.",
      roleUpdateFailed: "Could not update the role.",
      removed: "Member removed.",
      removeFailed: "Could not remove this member.",
      removeConfirmTitle: "Remove member?",
      removeConfirmDescription:
        "Remove {name} from this organization. They will lose access immediately.",
      lastAdmin: "An organization must have at least one admin.",
    },
    invite: {
      invalid: "This invitation link is invalid or has expired.",
      invalidTitle: "Invitation not available",
      emailMismatch: "This invitation was sent to a different email address.",
    },
    limits: {
      studentLimitReached: dt(
        "Your plan allows up to {limit:number} students.",
        {},
      ),
      courseLimitReached: dt(
        "Your plan allows up to {limit:number} courses.",
        {},
      ),
      storageLimitReached: dt(
        "Your plan allows up to {limitGb:number} GB of storage.",
        {},
      ),
    },
    emails: {
      invite: {
        subject: "You've been invited to join {organizationName}",
        text: "{inviterName} invited you to join {organizationName} on Gateling-TMS: {acceptUrl}",
        intro:
          "{inviterName} invited you to join {organizationName} on Gateling-TMS.",
        ctaLabel: "Accept invitation",
        ignore:
          "If you weren't expecting this invitation, you can ignore this email.",
      },
    },
  },
  dashboard: {
    nav: {
      generalGroup: "General",
    },
    welcome: {
      title: "Welcome back, {orgName}",
      titleFallback: "Welcome back",
      subtitle: "Here's a quick look at your academy.",
    },
    stats: {
      students: "Students",
      courses: "Courses",
      plan: "Plan",
    },
    upcoming: {
      title: "More is on the way",
      description:
        "Content Library, Learning Flow, and Live Classes land in upcoming phases — you'll manage courses, classes, and live sessions right from here.",
      settingsCta: "Manage organization",
    },
  },
  getStarted: {
    hero: {
      title: "Set up your training center",
      description: "Free to start. Takes about a minute.",
    },
    step1: {
      title: "Tell us about your business",
      contactNameLabel: "Your name",
      businessNameLabel: "Business name",
      emailLabel: "Email",
      phoneLabel: "Phone number",
      passwordLabel: "Password",
    },
    step2: {
      title: "Review and submit",
      submitting: "Setting up your account…",
      submit: "Let's go",
    },
    orgOnly: {
      title: "Name your training center",
    },
    validation: {
      businessNameRequired: "Business name is required.",
    },
  },
  landing: {
    header: {
      signIn: "Sign in",
      getStarted: "Get Started Free",
      dashboard: "Dashboard",
    },
    footer: {
      tagline:
        "Gateling-TMS is your gateway to manage your online teaching business — course management, live classes, and student tracking in one place.",
      copyright: "© {year} Gateling. All rights reserved.",
    },
    hero: {
      title: "Your gateway to manage your online teaching business",
      subtitle:
        "Sign up free, create your academy, and start managing classes and students in minutes — no sales call, no setup project.",
      primaryCta: "Get Started Free",
      secondaryCta: "Sign in",
      highlights: {
        free: "Free plan, no time limit",
        noCard: "No credit card required",
        bilingual: "Bilingual — English & Arabic",
      },
    },
    valueProposition: {
      instantOnboarding: {
        title: "Instant onboarding",
        description:
          "Sign up and start managing classes in one sitting — no mandatory setup, no sales call.",
      },
      excelFirst: {
        title: "Excel-first",
        description:
          "Import students and content from the spreadsheets you already use, with templates for every major list.",
      },
      freeForever: {
        title: "Free means free",
        description:
          "No time limit, no credit card. Limits are generous enough to run a small academy — upgrade only when you outgrow them.",
      },
      bilingual: {
        title: "Bilingual by design",
        description:
          "English and Arabic are equals, with full right-to-left support built in.",
      },
    },
    featuresPreview: {
      title: "Everything your academy needs",
      subtitle:
        "The free tier covers content, classes, and live sessions today. More is on the way.",
      free: "Free",
      comingSoon: "Coming soon",
      modules: {
        contentLibrary: {
          title: "Content Library",
          description:
            "Store lecture content, organize it by course, and find anything with search and filters.",
        },
        learningFlow: {
          title: "Learning Flow",
          description:
            "Structure courses into levels, track student progress, and run assessments.",
        },
        liveClasses: {
          title: "Live Classes",
          description:
            "Host HD video sessions, share your screen, and record classes — powered by Zoom.",
        },
        hr: {
          title: "HR Management",
          description:
            "Manage staff, payroll, performance, and attendance in one place.",
        },
        courseStore: {
          title: "Course Store",
          description:
            "Sell courses online with built-in payments and sales analytics.",
        },
        crm: {
          title: "CRM System",
          description: "Track leads, student profiles, and enrollment history.",
        },
        smartForms: {
          title: "Smart Forms",
          description:
            "Build custom forms with workflow automation across your organization.",
        },
        community: {
          title: "Community Platform",
          description: "Discussion forums, student groups, and peer-to-peer learning.",
        },
        support: {
          title: "Support System",
          description:
            "Ticketing, live chat, and a knowledge base for your students.",
        },
      },
    },
    process: {
      title: "From sign-up to your first class",
      subtitle: "No master data, no setup project — just four steps.",
      steps: {
        signUp: {
          title: "Sign up",
          description: "Create your account — free, no credit card.",
        },
        setUp: {
          title: "Set up your academy",
          description: "Name your organization and verify your email.",
        },
        addClasses: {
          title: "Add classes & students",
          description:
            "Create a class and add students — type them in or import from Excel.",
        },
        teach: {
          title: "Teach",
          description:
            "Schedule sessions, share content, and track progress from your dashboard.",
        },
      },
    },
    finalCta: {
      title: "Ready to run your academy online?",
      subtitle: "Join for free — no credit card, no time limit.",
      cta: "Get Started Free",
    },
  },
} as const satisfies LanguageMessages;
