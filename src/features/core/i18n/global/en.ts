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
    groups: "Groups",
    enrollments: "Enrollments",
    certificates: "Certificates",
    liveClasses: "Live Classes",
    zoomConnections: "Zoom connections",
    settings: "Settings",
    assessments: "Assessments",
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
      max32: "Must be at most 32 characters.",
      max128: "Must be at most 128 characters.",
      max256: "Must be at most 256 characters.",
      max500: "Must be at most 500 characters.",
      max2000: "Must be at most 2000 characters.",
    },
    imageUpload: {
      success: "Image uploaded.",
      error: "Could not upload image.",
      uploading: "Uploading…",
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
      invalidTimeZone: "Choose a valid time zone.",
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
      timeZoneLabel: "Time zone",
      timeZoneHint:
        "Class schedules and session times are shown on this clock.",
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
    usage: {
      title: "Plan and usage",
      description: "What this organization is using on its current plan.",
      students: "Students",
      courses: "Courses",
      storage: "Storage",
      countOf: dt("{used:number} of {limit:number}", {}),
      countUnlimited: dt("{used:number} used · no limit", {}),
      storageOf: "{used} of {limit}",
      megabytes: dt("{amount:number} MB", {}),
      gigabytes: dt("{amount:number} GB", {}),
      comingSoon: "Paid plans with higher limits are coming soon.",
      seePlans: "See plans",
      studentsReached: dt(
        "You've reached this plan's limit of {limit:number} students.",
        {},
      ),
      studentsApproaching: dt(
        "You're using {used:number} of {limit:number} students.",
        {},
      ),
      coursesReached: dt(
        "You've reached this plan's limit of {limit:number} courses.",
        {},
      ),
      coursesApproaching: dt(
        "You're using {used:number} of {limit:number} courses.",
        {},
      ),
      reachedHint: "Remove one to free up room on this plan.",
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
    thumbnail: "Thumbnail",
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
  trainees: {
    title: "Trainees",
    lead: "Your student roster — add trainees directly, no invitation or account required.",
    name: "Name",
    phone: "Phone",
    email: "Email",
    add: "Add trainee",
    edit: "Edit trainee",
    addDescription: "Add a new trainee to this organization.",
    editDescription: "Update this trainee's details.",
    created: "Trainee added.",
    updated: "Trainee updated.",
    saveFailed: "Could not save trainee.",
    deleteTitle: "Delete trainee?",
    deleteDescription:
      "Remove {name}. This can't be undone once they have enrollments or certificates.",
    deleted: "Trainee deleted.",
    deleteFailed: "Could not delete trainee.",
    searchHint: "Search trainees…",
    notFoundTitle: "Trainee not found",
    notFoundDescription:
      "This trainee may have been deleted, or belongs to another organization.",
    groupsLead: "The classes this trainee attends.",
    groupsEmptyTitle: "Not in any group yet",
    groupsEmptyDescription:
      "Add this trainee to a group from the group's own roster.",
  },
  import: {
    action: "Import",
    title: "Import from a spreadsheet",
    description:
      "Download the template, fill it in, then upload it. Nothing is saved until you confirm the review.",
    downloadXlsx: "Download Excel template",
    downloadCsv: "Download CSV template",
    chooseFile: "Choose a file",
    fileHint: "Excel (.xlsx) or CSV, up to {maxMb:number} MB.",
    reviewTitle: "Review before importing",
    reviewValid: dt("{count:plural} ready", {
      plural: { count: { one: "{?} row ready", other: "{?} rows ready" } },
    }),
    reviewInvalid: dt("{count:plural} skipped", {
      plural: {
        count: { one: "{?} row skipped", other: "{?} rows skipped" },
      },
    }),
    reviewCreates: dt("{count:number} new", {}),
    reviewUpdates: dt("{count:number} updated", {}),
    rowNumber: "Row",
    problems: "Problems",
    actionColumn: "Result",
    actionCreate: "New",
    actionUpdate: "Update",
    unknownHeaders: dt(
      "Columns we didn't recognize and ignored: {columns:list}",
      {},
    ),
    limitWarning: dt(
      "Your plan has room for {importable:number} of these rows. Import the first {importable:number} now, or upgrade for the rest.",
      {},
    ),
    nothingImportable: "None of these rows can be imported.",
    confirm: dt("Import {count:number} row(s)", {}),
    imported: dt(
      "Imported {created:number} new and updated {updated:number}.",
      {},
    ),
    importFailed: "Could not import this file.",
    previewFailed: "Could not read this file.",
    exportTitle: "Export for re-import",
    exportXlsx: "Export as Excel",
    exportCsv: "Export as CSV",
    template: {
      referenceSheet: "Reference",
      columnHeading: "Column",
      requiredHeading: "Required",
      notesHeading: "Notes",
      requiredYes: "Yes",
      requiredNo: "No",
    },
    errors: {
      fileTooLarge: dt("This file is larger than {maxMb:number} MB.", {}),
      unsupportedFormat: "Only .xlsx and .csv files can be imported.",
      emptyFile: "This file has no data rows.",
      tooManyRows: dt(
        "This file has more than {maxRows:number} rows. Split it and import each part.",
        {},
      ),
      missingColumns: dt(
        "These required columns are missing: {columns:list}.",
        {},
      ),
      invalidRows: "Some rows are no longer valid. Upload the file again.",
    },
    validation: {
      invalidId: "This id isn't a valid identifier.",
      unknownId: "No trainee in this organization has this id.",
      duplicateId: "This id appears in an earlier row.",
      duplicateEmail: "This email appears in an earlier row.",
      duplicateTrainee: "An earlier row already updates this trainee.",
      duplicateName: "This name appears in an earlier row.",
      unknownCourseId: "No course in this organization has this id.",
      duplicateCourse: "An earlier row already updates this course.",
      unknownCourse: "No course in this organization has this name.",
      unknownLevelId: "No level in this organization has this id.",
      levelCourseMismatch:
        "This level belongs to a different course. Leave the id blank to add a level to this course instead.",
      duplicateLevel: "An earlier row already updates this level.",
      duplicateLevelName:
        "This level name appears in an earlier row for the same course.",
      invalidOrder: "The position must be a whole number.",
      traineeRequired: "Give the trainee's email or name.",
      unknownTrainee: "No trainee in this organization matches this.",
      ambiguousTrainee:
        "More than one trainee has this name. Use their email instead.",
      unknownEnrollmentId: "No enrollment in this organization has this id.",
      enrollmentMismatch:
        "This id belongs to a different trainee or course. Leave it blank to enrol them in this course.",
      duplicateEnrollment:
        "An earlier row already enrols this trainee in this course.",
      invalidStatus: "This isn't one of the allowed statuses.",
      invalidTransition:
        "This enrollment can't move straight to that status. See the Reference sheet for the allowed steps.",
      duplicateMembership:
        "An earlier row already adds this trainee to this group.",
    },
    courses: {
      action: "Import courses",
      title: "Courses",
      columns: {
        id: "Id",
        name: "Name",
        description: "Description",
      },
      hints: {
        id: "Leave blank for a new course. Keep the value when re-importing an export to update that course instead of adding another.",
        name: "Required. Also used to match an existing course when no id is given.",
        description: "Optional. Up to 2000 characters.",
      },
    },
    levels: {
      action: "Import levels",
      title: "Levels",
      columns: {
        id: "Id",
        courseName: "Course",
        name: "Name",
        order: "Position",
      },
      hints: {
        id: "Leave blank for a new level. Keep the value when re-importing an export to update that level instead of adding another.",
        courseName:
          "Required. The course this level belongs to. The course must already exist.",
        name: "Required. Also used to match an existing level within the same course.",
        order:
          "Optional. A whole number — lower comes first. Leave blank to add the level at the end of the course.",
      },
    },
    enrollments: {
      action: "Import enrollments",
      title: "Enrollments",
      columns: {
        id: "Id",
        traineeEmail: "Trainee email",
        traineeName: "Trainee name",
        courseName: "Course",
        status: "Status",
      },
      hints: {
        id: "Leave blank for a new enrollment. Keep the value when re-importing an export to update that enrollment instead of adding another.",
        traineeEmail:
          "The trainee's email. Used first when both columns are filled — it's the only one that identifies a person unambiguously.",
        traineeName:
          "Used only when no email is given. Refused if two trainees share the name.",
        courseName: "Required. The course must already exist.",
        status:
          "Optional. One of: placementTest, waiting, ongoing, completed, cancelled, postponed. Blank means waiting for a new enrollment, and leaves an existing one unchanged. Changing an existing enrollment can only follow these steps: placementTest → waiting or cancelled; waiting → ongoing, postponed or cancelled; ongoing → completed, postponed or cancelled; postponed → ongoing or cancelled. Completed and cancelled are final.",
      },
    },
    groupStudents: {
      action: "Import group assignments",
      title: "Group assignments",
      columns: {
        groupName: "Group",
        traineeEmail: "Trainee email",
        traineeName: "Trainee name",
      },
      hints: {
        groupName:
          "Required. A group with this name is created if it doesn't exist yet — with no schedule, so no sessions are generated.",
        traineeEmail:
          "The trainee's email. Used first when both columns are filled.",
        traineeName:
          "Used only when no email is given. Refused if two trainees share the name.",
      },
    },
    trainees: {
      title: "Trainees",
      columns: {
        id: "Id",
        name: "Name",
        phone: "Phone",
        email: "Email",
        groupName: "Group",
      },
      hints: {
        id: "Leave blank for a new trainee. Keep the value when re-importing an export to update that trainee instead of adding another.",
        name: "Required. The trainee's full name.",
        phone: "Optional. Any format, up to 32 characters.",
        email:
          "Optional. Used to match an existing trainee when no id is given.",
        groupName:
          "Optional. The trainee is added to this group; a group with this name is created if it doesn't exist yet.",
      },
    },
  },
  groups: {
    title: "Groups",
    lead: "Your classes — set a weekly schedule and add students on the spot. No course required.",
    name: "Name",
    course: "Course",
    noCourse: "No course",
    teacher: "Teacher",
    noTeacher: "Unassigned",
    startDate: "Start date",
    sessionCount: "Number of sessions",
    schedule: "Weekly schedule",
    status: "Status",
    statusOptions: {
      active: "Active",
      paused: "Paused",
      completed: "Completed",
      cancelled: "Cancelled",
    },
    add: "Add group",
    edit: "Edit group",
    addDescription:
      "Create a class. A course is optional — you can add one later.",
    editDescription: "Update this group's details and schedule.",
    created: "Group created.",
    updated: "Group updated.",
    saveFailed: "Could not save group.",
    deleteTitle: "Delete group?",
    deleteDescription:
      "Remove {name} along with its roster and scheduled sessions. This can't be undone.",
    deleted: "Group deleted.",
    deleteFailed: "Could not delete group.",
    searchHint: "Search groups…",
    notFoundTitle: "Group not found",
    notFoundDescription:
      "This group may have been deleted, or belongs to another organization.",
    courseNotFound: "That course doesn't exist in this organization.",
    teacherNotFound: "That teacher isn't a member of this organization.",
    sessionsQueueFailed:
      "Group saved, but sessions couldn't be scheduled. Edit the group to try again.",
    slots: {
      title: "Weekly slots",
      addSlot: "Add a slot",
      removeSlot: "Remove slot",
      day: "Day",
      startTime: "Start",
      endTime: "End",
      empty: "No slots yet — add one to generate sessions.",
    },
    days: {
      sunday: "Sunday",
      monday: "Monday",
      tuesday: "Tuesday",
      wednesday: "Wednesday",
      thursday: "Thursday",
      friday: "Friday",
      saturday: "Saturday",
    },
    students: {
      title: "Students",
      lead: "{count:number} on the roster",
      add: "Add students",
      addDescription:
        "Pick existing trainees, or create a new one without leaving this screen.",
      createNew: "Create a new trainee",
      selected: "{count:number} selected",
      added: "Students added.",
      addFailed: "Could not add students.",
      remove: "Remove from group",
      removeTitle: "Remove from group?",
      removeDescription:
        "Remove {name} from this group. Their trainee record and other groups are unaffected.",
      removed: "Student removed from group.",
      removeFailed: "Could not remove student.",
      emptyTitle: "No students yet",
      emptyDescription: "Add students to this group to get started.",
      searchHint: "Search trainees…",
      noneAvailable: "Every trainee is already in this group.",
    },
    sessions: {
      title: "Sessions",
      lead: "Generated from the weekly schedule.",
      when: "When",
      duration: "Duration",
      durationValue: "{minutes:number} min",
      status: "Status",
      emptyTitle: "No sessions yet",
      emptyDescription:
        "Add at least one weekly slot and sessions will appear here shortly.",
      pending: "Sessions are being generated…",
    },
    validation: {
      time: "Use a 24-hour time like 18:00.",
      date: "Use a date like 2026-08-03.",
      slotEndBeforeStart: "End time must be after the start time.",
      sessionCountMin: "At least one session is required.",
      sessionCountMax: "That's more sessions than a single group can hold.",
      tooManySlots: "That's too many weekly slots.",
      tooManyStudents: "Too many students selected at once.",
    },
    noTraineesToAdd: "None of those trainees are available to add.",
  },
  enrollments: {
    title: "Enrollments",
    lead: "Who is studying what — enroll a trainee in a course and track their progress through its levels.",
    trainee: "Trainee",
    course: "Course",
    status: "Status",
    enrolledAt: "Enrolled",
    statusOptions: {
      placementTest: "Placement test",
      waiting: "Waiting",
      ongoing: "Ongoing",
      completed: "Completed",
      cancelled: "Cancelled",
      postponed: "Postponed",
    },
    add: "Enroll a trainee",
    addDescription:
      "Enroll a trainee in a course. Group membership doesn't require this — an enrollment adds curriculum tracking on top.",
    created: "Trainee enrolled.",
    saveFailed: "Could not save enrollment.",
    changeStatus: "Change status",
    changeStatusDescription: "Move {name} to a new status.",
    statusUpdated: "Status updated.",
    statusUpdateFailed: "Could not update status.",
    noTransitions: "This enrollment has reached a final status.",
    deleteTitle: "Delete enrollment?",
    deleteDescription:
      "Remove {name}'s enrollment along with its level progress. This can't be undone.",
    deleted: "Enrollment deleted.",
    deleteFailed: "Could not delete enrollment.",
    searchHint: "Search by trainee or course…",
    emptyTitle: "No enrollments yet",
    emptyDescription:
      "Enroll a trainee in a course to start tracking their progress.",
    traineeNotFound: "That trainee doesn't exist in this organization.",
    courseNotFound: "That course doesn't exist in this organization.",
    levelNotFound: "That level isn't part of this enrollment's course.",
    alreadyEnrolled:
      "This trainee already has an active enrollment in that course.",
    invalidTransition:
      "That status change isn't allowed from the current status.",
    levels: {
      title: "Level progress",
      lead: "Progress through the course's levels.",
      statusOptions: {
        notStarted: "Not started",
        inProgress: "In progress",
        completed: "Completed",
      },
      completedOn: "Completed {date}",
      updated: "Level progress updated.",
      updateFailed: "Could not update level progress.",
      emptyTitle: "This course has no levels",
      emptyDescription:
        "Add levels to the course and they'll show up here to track.",
    },
  },
  placementTests: {
    title: "Placement tests",
    lead: "Assess a trainee before they start, then assign the level they belong in.",
    form: "Placement form",
    level: "Assigned level",
    noLevel: "Not assigned yet",
    score: "Score",
    notScored: "Needs manual grading",
    scheduledAt: "Scheduled for",
    completedAt: "Completed",
    feedback: "Feedback",
    status: "Status",
    statusOptions: {
      pending: "Pending",
      inProgress: "In progress",
      completed: "Completed",
      cancelled: "Cancelled",
    },
    assign: "Assign a placement test",
    assignDescription:
      "Pick a published placement form for this trainee to take.",
    assigned: "Placement test assigned.",
    assignFailed: "Could not assign placement test.",
    run: "Record answers",
    runDescription:
      "Record {name}'s answers. The score is calculated automatically.",
    recorded: "Answers recorded.",
    recordFailed: "Could not record answers.",
    review: "Assign a level",
    reviewDescription:
      "Pick the level {name} should start at, based on their result.",
    reviewed: "Level assigned.",
    reviewFailed: "Could not assign the level.",
    cancelTest: "Cancel test",
    cancelTitle: "Cancel placement test?",
    cancelDescription:
      "Cancel this placement test. It stays on record but can't be taken.",
    testCancelled: "Placement test cancelled.",
    cancelFailed: "Could not cancel the placement test.",
    deleteTitle: "Delete placement test?",
    deleteDescription:
      "Remove this placement test. The recorded answers stay in the form's responses.",
    deleted: "Placement test deleted.",
    deleteFailed: "Could not delete placement test.",
    emptyTitle: "No placement tests yet",
    emptyDescription:
      "Assign a placement form to find out which level this trainee belongs in.",
    noPlacementForms:
      "No published placement forms yet — build one under Assessments first.",
    formNotFound: "That form doesn't exist in this organization.",
    formNotPlacement: "That form isn't a placement test.",
    formNotPublished: "Publish that form before assigning it.",
    noFormAssigned:
      "This placement test has no form — the one it used was deleted.",
    levelNotFound: "That level doesn't exist in this organization.",
    alreadyRecorded: "Answers have already been recorded for this test.",
    notRecorded: "Record the trainee's answers before assigning a level.",
    unanswered: "Answer at least one question.",
  },
  progress: {
    title: "Progress",
    traineeLead: "Where this trainee stands across their courses and classes.",
    groupLead: "How far this class has got, and each trainee within it.",
    levels: "Levels completed",
    levelsDetail: dt("{completed:number} of {total:number}", {}),
    sessions: "Sessions held",
    sessionsDetail: dt("{completed:number} of {total:number}", {}),
    nextSession: "Next session {when}",
    notEnrolled: "Not enrolled",
    // Session counts and attendance are two different measurements, and the
    // copy keeps saying so: these figures are the schedule, the register is
    // per class.
    attendanceNote:
      "Session figures come from the class schedule. Open a class to see and correct its register.",
    attendance: "Attendance",
    attendanceDetail: dt("{attended:number} of {recorded:number} attended", {}),
    attendanceNone:
      "No attendance recorded yet — it fills in as classes run on Zoom, or when a teacher marks the register.",
    emptyTitle: "Nothing to measure yet",
    traineeEmptyDescription:
      "Enroll this trainee in a course or add them to a class, and their progress shows up here.",
    groupEmptyDescription:
      "Add trainees to this class to track how they're getting on.",
  },
  certificates: {
    title: "Certificates",
    lead: "Issue and keep a record of what each trainee has completed.",
    searchHint: "Search by certificate or trainee",
    certificateTitle: "Certificate title",
    titleDescription:
      'What the certificate says, e.g. "Certificate of Completion — English B1".',
    course: "Course",
    courseDescription: "Only courses this trainee has completed can be chosen.",
    noCourse: "No course",
    group: "Class",
    noGroup: "No class",
    issuedAt: "Issued",
    issue: "Issue certificate",
    issueDescription:
      "Issue a certificate for this trainee. It stays on record and can be printed any time.",
    issued: "Certificate issued.",
    issueFailed: "Could not issue the certificate.",
    view: "View",
    print: "Print",
    presentedTo: "This certificate is presented to",
    forCompleting: "for successfully completing {subject}",
    issuedOn: "Issued on {date}",
    revoke: "Revoke",
    revokeTitle: "Revoke certificate?",
    revokeDescription:
      'Revoke "{name}". The record is removed for good — the trainee\'s enrollment history is untouched.',
    revoked: "Certificate revoked.",
    revokeFailed: "Could not revoke the certificate.",
    emptyTitle: "No certificates yet",
    emptyDescription:
      "Once a trainee completes a course or a class, issue their certificate here.",
    loadFailedTitle: "Couldn't load certificates",
    notFoundTitle: "Certificate not found",
    notFoundDescription: "This certificate doesn't exist, or it was revoked.",
    groupNotFound: "That class doesn't exist in this organization.",
    notEnrolled: "This trainee isn't enrolled in that course.",
    courseNotCompleted:
      "Mark the enrollment completed before issuing a certificate for it.",
  },
  sessions: {
    title: "Live classes",
    lead: "Every scheduled class in one place. Connect a Zoom account and each class gets its meeting link here — the class itself runs in Zoom.",
    scopeOptions: {
      upcoming: "Upcoming",
      past: "Past",
    },
    statusOptions: {
      scheduled: "Scheduled",
      ongoing: "Ongoing",
      completed: "Completed",
      cancelled: "Cancelled",
    },
    start: "Start class",
    join: "Join",
    // Two different reasons a row has no link, and they mean very different
    // things to whoever is looking at it.
    offline: "No Zoom link",
    preparing: "Link on the way",
    noZoomAccount:
      "No Zoom account is connected, so classes are scheduled without meeting links.",
    connectZoom: "Connect Zoom",
    emptyTitle: "Nothing scheduled",
    emptyUpcoming:
      "Give a class a weekly schedule and its sessions appear here.",
    emptyPast: "Past classes will be listed here once some have run.",
    previous: "Previous",
    next: "Next",
    pageOf: "Page {page:number} of {total:number}",
    register: "Register",
    recording: "Recording",
  },
  attendance: {
    title: "Attendance",
    // Says exactly where the figures come from and who can change them —
    // Zoom reports who joined the meeting, a teacher has the final word.
    lead: "Taken from who joined the Zoom meeting. Correct anything it got wrong — a student on the phone or in the room is still present.",
    statusOptions: {
      present: "Present",
      absent: "Absent",
      unmarked: "Not marked",
    },
    markedManually: "Set by a teacher",
    leftTheClass: "No longer in this class",
    marked: "Attendance updated.",
    markFailed: "Couldn't update attendance. Please try again.",
    joinedAt: "Joined at {time:string}",
    noZoomRecord: "Nothing reported by Zoom",
    watchRecording: "Watch the recording",
    recordingPasscode: "Passcode: {passcode:string}",
    emptyTitle: "No one on the roster",
    emptyDescription:
      "Add trainees to this class and they'll appear here to be marked.",
    openGroup: "Open the class",
    notFoundTitle: "Class not found",
    notFoundDescription: "This class doesn't exist, or it was removed.",
  },
  zoomClients: {
    title: "Zoom connections",
    subtitle:
      "Connect the Zoom account your classes run on. Scheduling works without it — sessions simply stay offline until an account is connected.",
    connect: "Connect Zoom",
    connectDescription:
      "Name this connection, then approve it on Zoom. You'll come straight back here.",
    continueToZoom: "Continue to Zoom",
    name: "Connection name",
    nameDescription: 'For your team, e.g. "Main licence" or "Evening classes".',
    notLinkedYet: "Not linked to a Zoom account yet",
    finishConnecting: "Finish connecting",
    reconnect: "Reconnect",
    disconnect: "Disconnect",
    disconnectTitle: "Disconnect this Zoom account?",
    disconnectDescription:
      'Disconnect "{name}". Scheduled classes stay, but new sessions won\'t get Zoom meeting links from this account.',
    disconnected: "Zoom account disconnected.",
    disconnectFailed: "Could not disconnect the Zoom account.",
    connectFailed: "Could not start the Zoom connection.",
    loadFailed: "Couldn't load Zoom connections.",
    emptyTitle: "No Zoom account connected",
    emptyDescription:
      "Connect an account and your scheduled classes get Zoom meeting links automatically.",
    status: {
      pending: "Awaiting approval",
      active: "Connected",
      error: "Needs attention",
    },
    result: {
      connected: "Zoom account connected.",
      denied: "The Zoom connection was cancelled.",
      invalid_state:
        "That connection link expired. Start the connection again.",
      connect_failed: "Zoom couldn't complete the connection. Try again.",
      not_configured: "Zoom isn't configured on this deployment yet.",
      forbidden: "Only an organization admin can connect Zoom.",
    },
    errors: {
      notConfigured:
        "Zoom isn't configured on this deployment yet. Ask your operator to add the Zoom credentials.",
    },
  },
  googleImport: {
    title: "Google Forms import",
    subtitle:
      "Connect a Google account and turn its forms into assignments, quizzes, final exams, or placement tests.",
    connectTitle: "Google account",
    connectDescription:
      "Gateling reads the structure of the forms you choose — questions and answer options only. It never reads responses, and never sees anything else in your Google Drive.",
    connect: "Connect Google",
    reconnect: "Reconnect",
    disconnect: "Disconnect",
    connectedAs: "Connected as {email}",
    connectedOn: "Connected {date}",
    notConnectedTitle: "No Google account connected",
    notConnectedDescription:
      "Connect the Google account that owns your forms to import them here.",
    disconnectTitle: "Disconnect this Google account?",
    disconnectDescription:
      "Assessments you already imported stay exactly as they are. You'll need to reconnect before importing any more.",
    disconnected: "Google account disconnected.",
    disconnectFailed: "Could not disconnect the Google account.",
    loadFailed: "Couldn't load the Google connection.",
    adminOnly: "Only an organization admin can connect or disconnect Google.",
    status: {
      active: "Connected",
      error: "Needs attention",
    },
    result: {
      connected: "Google account connected.",
      denied: "The Google connection was cancelled.",
      invalid_state:
        "That connection link expired. Start the connection again.",
      connect_failed: "Google couldn't complete the connection. Try again.",
      not_configured: "Google isn't configured on this deployment yet.",
      forbidden: "Only an organization admin can connect Google.",
      no_refresh_token:
        "Google didn't issue a lasting permission. Remove Gateling from your Google account's third-party access, then connect again.",
      missing_scope:
        "The connection was approved without access to your forms. Connect again and leave the Google Forms permission ticked.",
    },
    importTitle: "Import a form",
    importDescription:
      "Paste the link to a Google Form owned by the connected account. Nothing is created until you confirm.",
    formLink: "Google Form link",
    formLinkPlaceholder: "https://docs.google.com/forms/d/…/edit",
    preview: "Preview",
    previewAgain: "Preview another form",
    import: "Import as draft",
    importing: "Importing…",
    imported: "Assessment imported as a draft.",
    importFailed: "Could not import this form.",
    previewFailed: "Could not read this form.",
    previewTitle: "What will be imported",
    sectionsCount: dt("{count:plural}", {
      plural: { count: { one: "{?} section", other: "{?} sections" } },
    }),
    questionsCount: dt("{count:plural}", {
      plural: { count: { one: "{?} question", other: "{?} questions" } },
    }),
    quizDetected:
      "This is a Google quiz — point values and correct answers come across too.",
    notImportedTitle: "Not imported as-is",
    notImportedDescription:
      "Everything else on the form comes across. These items either changed shape or were left out — you can add them by hand in the builder.",
    nothingToImport:
      "This form has no questions Gateling can import. Nothing was created.",
    targetTitle: "Where it goes",
    targetDescription:
      "Imported assessments are always drafts. Publish from the builder once you've checked them.",
    titleOverride: "Title (optional)",
    titleOverrideDescription: "Leave empty to keep the form's own title.",
    note: {
      convertedDropdown:
        "Dropdown — imported as a single-choice question: {title}",
      convertedScale: "Linear scale — imported as one choice per step: {title}",
      convertedParagraph: "Long answer — imported as a short answer: {title}",
      skippedUnsupported: "This question type can't be imported: {title}",
      skippedGrid: "Grid questions can't be imported: {title}",
      skippedContent:
        "Text, images and videos aren't questions, so they're left out: {title}",
      skippedEmptyChoice: "No answer options to import: {title}",
      droppedOtherOption: 'The "Other" free-text option is left out: {title}',
      unmatchedCorrectAnswer:
        "A correct answer matches none of the options, so it isn't marked: {title}",
      truncatedTitle: "Title shortened to fit: {title}",
    },
    errors: {
      notConfigured:
        "Google isn't configured on this deployment yet. Ask your operator to add the Google credentials.",
      notConnected: "Connect a Google account before importing a form.",
      reconnect:
        "The Google connection stopped working. Reconnect the account and try again.",
      invalidLink:
        "That doesn't look like a Google Form link. Open the form in Google, then copy the address from your browser.",
      responseLink:
        "That's the link people use to fill the form in. Open the form for editing in Google and copy that address instead.",
      formNotFound:
        "The connected Google account can't find that form. Check the link, or connect the account that owns it.",
      formForbidden:
        "The connected Google account isn't allowed to read that form. Connect the account that owns it, or ask its owner to share it.",
      fetchFailed: "Google couldn't be reached. Try again in a moment.",
      rateLimited:
        "Too many Google Forms read in a short time. Wait a few minutes and try again.",
      nothingToImport:
        "This form has no questions Gateling can import. Nothing was created.",
    },
  },
  assessments: {
    title: "Assessments",
    lead: "Build assignments, quizzes, final exams, and placement tests, then track responses.",
    importFromGoogle: "Import from Google Forms",
    formTitle: "Title",
    description: "Description",
    type: "Type",
    typeOptions: {
      assignment: "Assignment",
      quiz: "Quiz",
      final: "Final exam",
      placement: "Placement test",
    },
    status: "Status",
    statusOptions: {
      draft: "Draft",
      published: "Published",
      archived: "Archived",
    },
    attachToCourse: "Course (optional)",
    attachToLevel: "Level (optional)",
    attachToLecture: "Lecture (optional)",
    notAttached: "Not attached",
    add: "New assessment",
    edit: "Edit assessment",
    addDescription:
      "Create a new assignment, quiz, final exam, or placement test.",
    editDescription: "Update this assessment's details.",
    created: "Assessment created.",
    updated: "Assessment updated.",
    saveFailed: "Could not save assessment.",
    deleteTitle: "Delete assessment?",
    deleteDescription:
      "Remove {name}. This deletes all its sections, questions, and responses. This can't be undone.",
    deleted: "Assessment deleted.",
    deleteFailed: "Could not delete assessment.",
    searchHint: "Search assessments…",
    notFoundTitle: "Assessment not found",
    notFoundDescription:
      "This assessment doesn't exist, was deleted, or isn't accessible to your organization.",
    backToList: "Assessments",
    tabs: {
      builder: "Builder",
      preview: "Preview & test",
      responses: "Responses",
    },
  },
  sections: {
    title: "Sections",
    name: "Title",
    add: "Add section",
    edit: "Edit section",
    addDescription: "Create a new section in this assessment.",
    editDescription: "Update this section's title.",
    created: "Section created.",
    updated: "Section updated.",
    saveFailed: "Could not save section.",
    deleteTitle: "Delete section?",
    deleteDescription:
      "Remove {name}. This can't be undone once questions are added inside it.",
    deleted: "Section deleted.",
    deleteFailed: "Could not delete section.",
    emptyTitle: "No sections yet",
    emptyDescription:
      "Add your first section to start building this assessment.",
    moveUp: "Move up",
    moveDown: "Move down",
  },
  questions: {
    title: "Questions",
    text: "Question",
    type: "Type",
    typeOptions: {
      single_choice: "Single choice",
      multiple_choice: "Multiple choice",
      short_answer: "Short answer",
    },
    points: "Points",
    add: "Add question",
    edit: "Edit question",
    addDescription: "Create a new question in this section.",
    editDescription: "Update this question's details.",
    created: "Question created.",
    updated: "Question updated.",
    saveFailed: "Could not save question.",
    deleteTitle: "Delete question?",
    deleteDescription: "Remove this question. This can't be undone.",
    deleted: "Question deleted.",
    deleteFailed: "Could not delete question.",
    emptyTitle: "No questions yet",
    emptyDescription: "Add your first question to this section.",
    moveUp: "Move up",
    moveDown: "Move down",
    manageAnswers: "Manage answer choices",
  },
  answers: {
    title: "Answer choices",
    text: "Answer",
    isCorrect: "Correct answer",
    add: "Add answer",
    edit: "Edit answer",
    addDescription: "Add an answer choice to this question.",
    editDescription: "Update this answer choice.",
    created: "Answer added.",
    updated: "Answer updated.",
    saveFailed: "Could not save answer.",
    deleteTitle: "Delete answer?",
    deleteDescription: "Remove this answer choice. This can't be undone.",
    deleted: "Answer deleted.",
    deleteFailed: "Could not delete answer.",
    emptyTitle: "No answer choices yet",
    emptyDescription: "Add at least two answer choices for this question.",
    moveUp: "Move up",
    moveDown: "Move down",
    // Short-answer questions reuse the same answer rows, but each one is a
    // phrasing the grader should *accept* rather than a choice to pick from —
    // so the wording changes even though the data model doesn't.
    shortAnswer: {
      title: "Accepted answers",
      isCorrect: "Accept this answer",
      add: "Add accepted answer",
      edit: "Edit accepted answer",
      addDescription:
        "Add wording that should be marked correct for this question.",
      editDescription: "Update this accepted answer.",
      deleteTitle: "Delete accepted answer?",
      deleteDescription: "Remove this accepted answer. This can't be undone.",
      emptyTitle: "No accepted answers yet",
      emptyDescription:
        "Add at least one accepted answer so this question can be graded automatically.",
    },
  },
  responses: {
    title: "Responses",
    emptyTitle: "No responses yet",
    emptyDescription:
      "Responses will appear here once someone submits this assessment.",
    respondent: "Respondent",
    score: "Score",
    scorePending: "Needs grading",
    submittedAt: "Submitted",
    submit: "Submit test response",
    submitSuccess: "Response submitted.",
    submitFailed: "Could not submit response.",
    notPublished: "This assessment isn't published yet.",
    previewOnly: "Publish this assessment to let others submit responses.",
    previewEmptyTitle: "Nothing to preview yet",
    previewEmptyDescription:
      "Add at least one section with a question to preview this assessment.",
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
      groups: "Classes",
      plan: "Plan",
      ofLimit: dt("of {limit:number} allowed", {}),
    },
    today: {
      title: "Today's sessions",
      description: "Every class scheduled for today, on your academy's clock.",
      duration: dt("{minutes:number} min", {}),
      emptyTitle: "Nothing scheduled today",
      emptyDescription:
        "Classes you schedule show up here on the day they run.",
      errorTitle: "Couldn't load today's sessions",
      groupsCta: "Go to classes",
    },
    recent: {
      enrollments: "Recent enrollments",
      certificates: "Recently issued certificates",
      emptyTitle: "Nothing yet",
      enrollmentsEmpty: "Enroll a trainee in a course to see it here.",
      certificatesEmpty: "Certificates you issue show up here.",
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
          "Import students and content from the spreadsheets you already use, with templates for every major list — and bring your quizzes over from Google Forms.",
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
          assessments: "Built-in Assessments (or imported from Google Forms)",
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
