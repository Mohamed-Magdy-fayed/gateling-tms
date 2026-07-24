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
      max256: "Must be at most 256 characters.",
      max2000: "Must be at most 2000 characters.",
    },
  },
  systemPages: {
    auditInfoTitle: "Audit info",
    auditInfoDescription: "Tracking metadata for this record.",
  },
  dataTable: {
    clear: "Clear",
    clearFilter: "Clear {title} filter",
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
  courses: {
    title: "Courses",
    lead: "Organize your curriculum into courses, then add levels and lectures inside each one.",
    name: "Name",
    description: "Description",
    add: "Add course",
    edit: "Edit course",
    addDescription: "Create a new course.",
    editDescription: "Update this course's details.",
    created: "Course created.",
    updated: "Course updated.",
    saveFailed: "Could not save course.",
    deleteTitle: "Delete course?",
    deleteDescription:
      "Remove {name}. This can't be undone once levels and lectures are added inside it.",
    deleted: "Course deleted.",
    deleteFailed: "Could not delete course.",
    searchHint: "Search courses…",
    manageLevels: "Manage levels",
    notFoundTitle: "Course not found",
    notFoundDescription:
      "This course doesn't exist, was deleted, or isn't accessible to your organization.",
  },
  levels: {
    title: "Levels",
    name: "Name",
    add: "Add level",
    edit: "Edit level",
    addDescription: "Create a new level in this course.",
    editDescription: "Update this level's name.",
    created: "Level created.",
    updated: "Level updated.",
    saveFailed: "Could not save level.",
    deleteTitle: "Delete level?",
    deleteDescription:
      "Remove {name}. This can't be undone once lectures are added inside it.",
    deleted: "Level deleted.",
    deleteFailed: "Could not delete level.",
    emptyTitle: "No levels yet",
    emptyDescription:
      "Add your first level to start organizing this course's lectures.",
    moveUp: "Move up",
    moveDown: "Move down",
  },
  lectures: {
    title: "Lectures",
    name: "Name",
    description: "Description",
    content: "Content",
    add: "Add lecture",
    edit: "Edit lecture",
    addDescription: "Create a new lecture in this level.",
    editDescription: "Update this lecture's details.",
    created: "Lecture created.",
    updated: "Lecture updated.",
    saveFailed: "Could not save lecture.",
    deleteTitle: "Delete lecture?",
    deleteDescription: "Remove {name}. This can't be undone.",
    deleted: "Lecture deleted.",
    deleteFailed: "Could not delete lecture.",
    emptyTitle: "No lectures yet",
    emptyDescription: "Add your first lecture to this level.",
    moveUp: "Move up",
    moveDown: "Move down",
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
      features: "Features",
      pricing: "Pricing",
      signIn: "Sign in",
      getStarted: "Get Started Free",
      dashboard: "Dashboard",
    },
    footer: {
      tagline:
        "Gateling-TMS is your gateway to manage your online teaching business — course management, live classes, and student tracking in one place.",
      linksHeading: "Quick links",
      legalHeading: "Legal",
      copyright: "© {year} Gateling. All rights reserved.",
      links: {
        about: "About",
        contact: "Contact",
        privacy: "Privacy Policy",
        terms: "Terms of Service",
        cookies: "Cookies Policy",
        refund: "Refund Policy",
      },
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
      demo: {
        courseTitle: "Intro to Algebra",
        courseCategory: "Mathematics",
        courseLevel: "Beginner",
        lessonsLabel: "24 lessons",
        durationLabel: "6h",
        priceLabel: "Free",
      },
      socialProof: {
        count: "1,000+ academies",
        suffix: "already teach on Gateling",
      },
    },
    logos: {
      eyebrow: "Trusted by academies everywhere",
    },
    testimonial: {
      eyebrow: "What academies say",
      quote:
        "“We moved our whole academy onto Gateling in a weekend. Enrollment is up and I finally stopped juggling spreadsheets.”",
      initials: "PN",
      name: "Priya N.",
      role: "Founder, BrightPath Academy",
    },
    valueProposition: {
      header: {
        eyebrow: "Why Gateling",
        title: "Built for how you actually teach",
        description:
          "No fluff, no lock-in — just the tools your academy needs from day one.",
      },
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
      eyebrow: "Everything in one place",
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
          description:
            "Discussion forums, student groups, and peer-to-peer learning.",
        },
        support: {
          title: "Support System",
          description:
            "Ticketing, live chat, and a knowledge base for your students.",
        },
      },
    },
    process: {
      eyebrow: "How it works",
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
  features: {
    hero: {
      title: "Everything your academy needs",
      description:
        "See what's free today — and what's coming soon as Gateling-TMS grows.",
      primaryCta: "Get Started Free",
      secondaryCta: "See pricing",
    },
    free: {
      title: "Free features",
      description: "Everything below is live today, free, with no time limit.",
      badge: "Free",
    },
    premium: {
      title: "Premium features",
      description:
        "More modules are on the way to help you scale beyond the essentials.",
      badge: "Coming soon",
    },
    modules: {
      contentLibrary: {
        title: "Content Library",
        description:
          "Centralized digital resource management for all your educational content and lectures.",
        bullets: {
          digitalResources: "Digital Resource Storage",
          mediaManagement: "Media File Management",
          contentOrganization: "Content Organization",
          searchFiltering: "Advanced Search & Filtering",
        },
      },
      learningFlow: {
        title: "Learning Flow",
        description:
          "Structured learning pathways that guide students through their educational journey step by step.",
        bullets: {
          courseStructure: "Course Structure Design",
          progressTracking: "Progress Tracking",
          assessments: "Built-in Assessments",
          certificates: "Certificate Generation",
        },
      },
      liveClasses: {
        title: "Live Classes",
        description:
          "Host interactive live classes with HD video streaming and real-time collaboration — powered by Zoom.",
        bullets: {
          hdVideoStreaming: "HD Video Streaming",
          interactiveWhiteboard: "Interactive Whiteboard",
          recordingCapabilities: "Class Recording",
          screenSharing: "Screen Sharing",
        },
      },
      hr: {
        title: "HR Management",
        description:
          "Comprehensive human resources management for staff administration and performance tracking.",
        bullets: {
          staffManagement: "Staff Management",
          payrollIntegration: "Payroll Integration",
          performanceTracking: "Performance Tracking",
          attendanceMonitoring: "Attendance Monitoring",
        },
      },
      courseStore: {
        title: "Course Store",
        description:
          "Built-in marketplace to sell your courses online with integrated payments and analytics.",
        bullets: {
          onlineMarketplace: "Online Course Marketplace",
          paymentProcessing: "Payment Processing",
          coursePackaging: "Course Packaging & Pricing",
          salesAnalytics: "Sales Analytics",
        },
      },
      crm: {
        title: "CRM System",
        description:
          "Track leads, manage student relationships, and boost enrollment.",
        bullets: {
          leadManagement: "Lead Management",
          studentProfiles: "Detailed Student Profiles",
          communicationHistory: "Communication History",
          enrollmentTracking: "Enrollment Tracking",
        },
      },
      smartForms: {
        title: "Smart Forms",
        description:
          "Intelligent form builder with automated workflows for admissions, surveys, and data collection.",
        bullets: {
          customForms: "Custom Form Builder",
          dataCollection: "Automated Data Collection",
          automatedWorkflows: "Workflow Automation",
          integrationCapabilities: "System Integration",
        },
      },
      community: {
        title: "Community Platform",
        description:
          "Social learning platform that connects students, teachers, and parents.",
        bullets: {
          discussionForums: "Discussion Forums",
          studentGroups: "Student Groups",
          socialLearning: "Social Learning Features",
          peerInteraction: "Peer-to-Peer Interaction",
        },
      },
      support: {
        title: "Support System",
        description:
          "Comprehensive support with ticketing, live chat, and a knowledge base.",
        bullets: {
          ticketingSystem: "Ticketing System",
          liveChat: "Live Chat Support",
          knowledgeBase: "Knowledge Base",
          prioritySupport: "Priority Support",
        },
      },
    },
    cta: {
      title: "Ready to get started?",
      description: "Sign up free today — no credit card, no time limit.",
      cta: "Get Started Free",
    },
  },
  pricing: {
    hero: {
      badge: "Flexible pricing",
      title: "Choose the plan for your academy",
      description:
        "Start free — no credit card, no time limit. Paid plans are on the way for when you outgrow the essentials.",
    },
    plans: {
      free: {
        name: "Free",
        description: "Perfect for getting started",
      },
      basic: {
        name: "Basic",
        description: "Great for small academies",
      },
      professional: {
        name: "Professional",
        description: "For growing academies",
      },
      enterprise: {
        name: "Enterprise",
        description: "For large institutions",
      },
    },
    featureLabels: {
      contentLibrary: "Content Library",
      learningFlow: "Learning Flow",
      liveClasses: "Live Classes",
      hr: "HR Management",
      courseStore: "Course Store",
      crm: "CRM System",
      smartForms: "Smart Forms",
      community: "Community Platform",
      support: "Support System",
    },
    mostPopular: "Most popular",
    free: "Free",
    currency: "EGP",
    perMonth: "/month",
    signupCta: "Get Started Free",
    comingSoon: "Coming soon",
    limits: {
      students: "Active students",
      courses: "Courses",
      storage: "Storage",
      unlimited: "Unlimited",
    },
    faq: {
      title: "Frequently asked questions",
      description: "Answers to common questions about our plans.",
      questions: {
        q1: {
          question: "Can I switch plans later?",
          answer:
            "Basic, Professional, and Enterprise are coming soon. You'll be able to upgrade from the Free plan once they launch.",
        },
        q2: {
          question: "Is there a time limit on the Free plan?",
          answer:
            "No. The Free plan has no time limit and needs no credit card — it isn't just a trial.",
        },
        q3: {
          question: "What happens if I reach my plan's limits?",
          answer:
            "We'll let you know before you hit a hard wall and point you at the next plan up — you'll never lose data or get cut off mid-action.",
        },
      },
    },
  },
  legal: {
    lastUpdated: "Last updated: July 2026",
  },
  about: {
    hero: {
      title: "Built for how academies actually run",
      description:
        "Gateling-TMS is a straightforward training management system for online academies and teaching businesses — no sales calls, no setup projects, just sign up and start managing classes.",
    },
    beliefs: {
      title: "What we believe",
      description:
        "These aren't marketing lines — they're the calls we make when building the product.",
      items: {
        instantOnboarding: {
          title: "Instant onboarding",
          description:
            "Sign up and start managing classes in one sitting. No mandatory setup, no sales call.",
        },
        excelFirst: {
          title: "Excel-first",
          description:
            "Every major list supports import and export, so switching from spreadsheets feels natural.",
        },
        freeForever: {
          title: "Free means free",
          description:
            "The Free plan has no time limit and needs no credit card — it's generous enough to run a small academy.",
        },
        bilingual: {
          title: "Bilingual by design",
          description:
            "English and Arabic are equals, with full right-to-left support built in from day one.",
        },
        truthful: {
          title: "Truthful marketing",
          description:
            'We only claim what\'s actually built. Anything not ready yet is labeled "coming soon" — never implied.',
        },
      },
    },
    cta: {
      title: "Ready to see it for yourself?",
      description:
        "Create your academy for free — no credit card, no time limit.",
      cta: "Get Started Free",
    },
  },
  contact: {
    hero: {
      title: "Get in touch",
      description:
        "Questions, feedback, or something not working? Send us a message and we'll get back to you.",
    },
    form: {
      title: "Send a message",
      nameLabel: "Your name",
      emailLabel: "Email address",
      subjectLabel: "Subject",
      messageLabel: "Message",
      submit: "Send message",
      submitting: "Sending…",
      success: "Message sent — we'll get back to you soon.",
      error: {
        rateLimited: "Too many messages sent. Please try again later.",
        submitFailed: "Couldn't send your message. Please try again.",
      },
    },
    emails: {
      notification: {
        subject: "New contact form message: {subject}",
        greeting: "New message from the contact form",
        intro: '{name} ({email}) sent a message: "{subject}"',
      },
    },
  },
} as const satisfies LanguageMessages;
