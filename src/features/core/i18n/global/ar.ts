import type { LanguageMessages } from "../lib";
import { dt } from "../lib";

export default {
  locale: "ar",
  opposite: "English",
  appName: "Gateling-TMS",
  logoName: "Gateling",
  nav: {
    dashboard: "لوحة التحكم",
    contentLibrary: "مكتبة المحتوى",
    learningFlow: "مسار التعلم",
    liveClasses: "الحصص المباشرة",
    settings: "الإعدادات",
  },
  actions: {
    save: "حفظ",
    cancel: "إلغاء",
    delete: "حذف",
    edit: "تعديل",
    create: "إنشاء",
    search: "بحث",
  },
  common: {
    loading: "جاري التحميل...",
    empty: "لا توجد بيانات متاحة.",
    required: "مطلوب",
    yes: "نعم",
    no: "لا",
    confirm: "تأكيد",
    areYouSure: "هل أنت متأكد؟",
    back: "رجوع",
    next: "التالي",
    close: "إغلاق",
    noOptionsFound: "لا توجد خيارات.",
    actions: "الإجراءات",
    createdAt: "تاريخ الإنشاء",
    createdBy: "أُنشئ بواسطة",
    updatedAt: "تاريخ آخر تحديث",
    updatedBy: "حُدِّث بواسطة",
    deletedAt: "تاريخ الحذف",
    deletedBy: "حُذف بواسطة",
  },
  errors: {
    generic: "حدث خطأ ما. يرجى المحاولة مرة أخرى.",
    notFound: "العنصر المطلوب غير موجود.",
    unauthorized: "غير مصرح لك بتنفيذ هذا الإجراء.",
    validationFailed: "يرجى مراجعة الحقول المظللة والمحاولة مرة أخرى.",
    noActiveOrganization: "ليس لديك صلاحية الوصول لهذه المؤسسة.",
  },
  forms: {
    validation: {
      required: "هذا الحقل مطلوب.",
      max128: "يجب ألا يتجاوز 128 حرفًا.",
      max2000: "يجب ألا يتجاوز 2000 حرف.",
    },
  },
  systemPages: {
    auditInfoTitle: "معلومات التدقيق",
    auditInfoDescription: "بيانات التتبع لهذا السجل.",
    demoItemsTitle: "عناصر تجريبية",
    demoItemsLead:
      "اختبار قبول المرحلة الأولى لعمل الجدول والنماذج و tRPC معًا.",
    demoItemName: "الاسم",
    demoItemActive: "نشط",
    addDemoItem: "إضافة عنصر تجريبي",
    editDemoItem: "تعديل عنصر تجريبي",
    addDemoItemDescription: "إنشاء عنصر تجريبي جديد.",
    editDemoItemDescription: "تحديث تفاصيل هذا العنصر التجريبي.",
    demoItemCreated: "تم إنشاء العنصر التجريبي.",
    demoItemUpdated: "تم تحديث العنصر التجريبي.",
    demoItemSaveFailed: "تعذر حفظ العنصر التجريبي.",
    deleteDemoItemTitle: "حذف العنصر التجريبي؟",
    deleteDemoItemDescription:
      "إزالة {name} نهائيًا. لا يمكن التراجع عن هذا الإجراء.",
    demoItemDeleted: "تم حذف العنصر التجريبي.",
    demoItemDeleteFailed: "تعذر حذف العنصر التجريبي.",
  },
  dataTable: {
    clear: "مسح",
    clearFilter: "مسح فلتر {title}",
    searchDemoItemsHint: "بحث في العناصر التجريبية…",
    export: {
      export: "تصدير",
    },
    noResults: "لا توجد نتائج.",
    selected: "تم تحديد {count:number}",
    clearSelection: "مسح التحديد",
    rowsPerPage: "صفوف لكل صفحة",
    pageOf: dt("صفحة {page:number} من {total:number}", {}),
    totalRows: dt("{count:plural} إجمالًا", {
      plural: { count: { one: "{?} صف", other: "{?} صفوف" } },
    }),
    asc: "تصاعدي",
    desc: "تنازلي",
    reset: "إعادة تعيين",
    hide: "إخفاء",
    toggleColumns: "تبديل الأعمدة",
    goToFirstPage: "الذهاب للصفحة الأولى",
    goToPreviousPage: "الذهاب للصفحة السابقة",
    goToNextPage: "الذهاب للصفحة التالية",
    goToLastPage: "الذهاب للصفحة الأخيرة",
    filters: "الفلاتر",
    searchRows: "بحث في الجدول…",
    pinLeft: "تثبيت يسارًا",
    pinRight: "تثبيت يمينًا",
    unpin: "إلغاء التثبيت",
    presetToday: "اليوم",
    presetYesterday: "أمس",
    presetLast7Days: "آخر 7 أيام",
    presetLast30Days: "آخر 30 يومًا",
    presetThisMonth: "هذا الشهر",
    numberMin: "الحد الأدنى",
    numberMax: "الحد الأقصى",
    id: "المعرف",
    exportSuccess: dt("تم تصدير {count:number} صف.", {}),
    exportFailed: "فشل التصدير.",
  },
  languageToggle: "تغيير اللغة",
  themeToggle: "تغيير المظهر",
  auth: {
    emails: {
      common: {
        fromName: "Gateling-TMS",
        defaultRecipientName: "عزيزي المستخدم",
        greeting: "مرحبًا {name}،",
        signature: "— فريق Gateling-TMS",
        minuteSingular: "دقيقة",
        minutePlural: "دقائق",
      },
      emailVerification: {
        subject: "تأكيد عنوان بريدك الإلكتروني",
        text: "مرحبًا {name}، يرجى تأكيد بريدك الإلكتروني خلال {expiryHours} ساعة: {verificationUrl}",
        intro:
          "يرجى تأكيد عنوان بريدك الإلكتروني. تنتهي صلاحية هذا الرابط خلال {expiryHours} ساعة.",
        ctaLabel: "تأكيد البريد الإلكتروني",
        ignore: "إذا لم تقم بإنشاء هذا الحساب، يمكنك تجاهل هذه الرسالة.",
      },
      passwordReset: {
        subject: "رمز إعادة تعيين كلمة المرور",
        text: "مرحبًا {name}، رمز إعادة تعيين كلمة المرور هو {code}. تنتهي صلاحيته خلال {expiresIn} {minutesLabel}.",
        intro:
          "استخدم الرمز أدناه لإعادة تعيين كلمة المرور. تنتهي صلاحيته خلال {expiresIn} {minutesLabel}.",
        ignore: "إذا لم تطلب إعادة تعيين كلمة المرور، يمكنك تجاهل هذه الرسالة.",
      },
    },
    backToHome: "العودة للرئيسية",
    signOut: "تسجيل الخروج",
    emailPlaceholder: "you@example.com",
    error: {
      badRequest: "طلب غير صالح. يرجى المحاولة مرة أخرى.",
      credentials: "البريد الإلكتروني أو كلمة المرور غير صحيحة.",
      rateLimited: "محاولات كثيرة جدًا. يرجى المحاولة لاحقًا.",
    },
    validation: {
      required: "هذا الحقل مطلوب.",
      invalidEmail: "أدخل بريدًا إلكترونيًا صالحًا.",
      invalidPhone: "أدخل رقم هاتف صالحًا.",
      passwordRequired: "كلمة المرور مطلوبة.",
      passwordMinLength: "يجب ألا تقل كلمة المرور عن 8 أحرف.",
      passwordLowercase: "يجب أن تحتوي كلمة المرور على حرف صغير.",
      passwordUppercase: "يجب أن تحتوي كلمة المرور على حرف كبير.",
      passwordNumber: "يجب أن تحتوي كلمة المرور على رقم.",
      otpSixDigits: "أدخل الرمز المكوّن من 6 أرقام.",
    },
    signIn: {
      title: "مرحبًا بعودتك",
      description: "سجّل الدخول إلى حساب Gateling-TMS الخاص بك.",
      continueWith: "أو تابع بالبريد الإلكتروني",
      emailLabel: "البريد الإلكتروني",
      continue: "متابعة",
      passwordLabel: "كلمة المرور",
      forgotPassword: "نسيت كلمة المرور؟",
      back: "رجوع",
      submitting: "جاري تسجيل الدخول…",
      submit: "تسجيل الدخول",
      noAccount: "ليس لديك حساب؟",
      toSignUp: "إنشاء حساب",
      hasAccount: "لديك حساب بالفعل؟",
    },
    signUp: {
      title: "أنشئ حسابك",
      description: "ابدأ إدارة مركزك التدريبي مجانًا.",
      nameLabel: "الاسم الكامل",
      emailLabel: "البريد الإلكتروني",
      phoneLabel: "رقم الهاتف",
      passwordLabel: "كلمة المرور",
      submitting: "جاري إنشاء الحساب…",
      submit: "إنشاء حساب",
      toSignIn: "تسجيل الدخول",
      error: {
        duplicate: "يوجد حساب بالفعل بهذا البريد الإلكتروني.",
        generic: "تعذر إنشاء حسابك. يرجى المحاولة مرة أخرى.",
        sessionFailed:
          "تم إنشاء حسابك، لكن تعذر تسجيل دخولك تلقائيًا. يرجى تسجيل الدخول.",
      },
    },
    oauth: {
      error: {
        failed: "تعذر الاتصال. يرجى المحاولة مرة أخرى.",
      },
    },
    passwordReset: {
      submitting: "جاري إرسال الرمز…",
      submit: "إرسال رمز إعادة التعيين",
      otpLabel: "الرمز المكوّن من 6 أرقام",
      newPasswordLabel: "كلمة المرور الجديدة",
      request: {
        emailError: "تعذر إرسال رمز إعادة التعيين. يرجى المحاولة مرة أخرى.",
      },
      reset: {
        submit: "إعادة تعيين كلمة المرور",
        success: "تمت إعادة تعيين كلمة المرور بنجاح.",
        invalidCode: "هذا الرمز غير صالح أو منتهي الصلاحية.",
        error: "تعذر إعادة تعيين كلمة المرور. يرجى المحاولة مرة أخرى.",
      },
    },
    emailVerification: {
      heading: "تأكيد بريدك الإلكتروني",
      backHome: "العودة للرئيسية",
      alreadyVerifiedNote: "بريدك الإلكتروني مؤكد بالفعل.",
      sent: "تم إرسال رسالة التأكيد.",
      success: { verified: "تم تأكيد بريدك الإلكتروني." },
      passkeyPrompt: {
        setUp: "إعداد مفتاح مرور",
        skip: "تخطي، الانتقال إلى لوحة التحكم",
      },
      notice: {
        missingEmail: "لا يوجد بريد إلكتروني مسجّل لتأكيده.",
        signInRequired: "سجّل الدخول لتأكيد بريدك الإلكتروني.",
        sending: "جاري الإرسال…",
        sendButton: "إعادة إرسال رسالة التأكيد",
      },
      error: {
        missingEmail: "لا يوجد بريد إلكتروني مسجّل لتأكيده.",
        sendFailed: "تعذر إرسال رسالة التأكيد.",
        invalidToken: "رابط التأكيد هذا غير صالح.",
        expired: "انتهت صلاحية رابط التأكيد هذا.",
      },
    },
    passkeys: {
      pageTitle: "مفاتيح المرور",
      pageDescription:
        "إدارة مفاتيح المرور التي يمكنك استخدامها لتسجيل الدخول بدون كلمة مرور.",
      add: "إضافة مفتاح مرور",
      registering: "جاري التسجيل…",
      deleting: "جاري الإزالة…",
      delete: {
        label: "إزالة",
        confirm:
          "إزالة مفتاح المرور هذا؟ قد لا تتمكن من تسجيل الدخول به مرة أخرى.",
        notFound: "مفتاح المرور غير موجود.",
        success: "تمت إزالة مفتاح المرور.",
        error: "تعذر إزالة مفتاح المرور.",
      },
      list: {
        empty: "لا توجد مفاتيح مرور بعد.",
        defaultLabel: "مفتاح مرور",
        created: "أُضيف",
        lastUsed: "آخر استخدام",
      },
      register: {
        unsupported: "مفاتيح المرور غير مدعومة على هذا الجهاز.",
        success: "تم تسجيل مفتاح المرور.",
        cancelled: "تم إلغاء تسجيل مفتاح المرور.",
        error: "تعذر تسجيل مفتاح المرور.",
        invalidChallenge:
          "انتهت صلاحية محاولة التسجيل. يرجى المحاولة مرة أخرى.",
      },
      auth: {
        button: "تسجيل الدخول بمفتاح مرور",
        pending: "جاري تسجيل الدخول…",
        error: {
          emailRequired: "أدخل بريدك الإلكتروني أولاً.",
          unsupported: "مفاتيح المرور غير مدعومة على هذا الجهاز.",
          cancelled: "تم إلغاء تسجيل الدخول بمفتاح المرور.",
          generic: "تعذر تسجيل الدخول بهذا المفتاح.",
          userNotFound: "لا يوجد حساب بهذا البريد الإلكتروني.",
          noCredentials: "لا توجد مفاتيح مرور لهذا الحساب بعد.",
          invalidChallenge:
            "انتهت صلاحية محاولة تسجيل الدخول. يرجى المحاولة مرة أخرى.",
          credentialMismatch: "مفتاح المرور هذا غير مسجّل لهذا الحساب.",
        },
      },
      error: {
        missingRpId: "مفاتيح المرور غير متاحة في هذه البيئة.",
      },
    },
  },
  organizations: {
    pageTitle: "إعدادات المؤسسة",
    pageLead: "إدارة الملف الشخصي للمؤسسة والخطة والأعضاء.",
    validation: {
      invalidWebsite: "أدخل رابط موقع إلكتروني صالحًا.",
    },
    plan: {
      free: "مجاني",
      basic: "أساسي",
      professional: "احترافي",
      enterprise: "مؤسسي",
    },
    profile: {
      editTitle: "تعديل المؤسسة",
      editDescription: "تحديث بيانات الملف الشخصي لمؤسستك.",
      nameLabel: "اسم المؤسسة",
      businessNameLabel: "الاسم التجاري",
      phoneLabel: "الهاتف",
      websiteLabel: "الموقع الإلكتروني",
      saveSuccess: "تم تحديث المؤسسة.",
      saveFailed: "تعذر تحديث المؤسسة.",
    },
    switcher: {
      label: "اختر مؤسسة",
      switched: "تم تبديل المؤسسة.",
      switchFailed: "تعذر تبديل المؤسسة.",
    },
    members: {
      title: "الأعضاء",
      searchHint: "بحث في الأعضاء…",
      columnName: "الاسم",
      columnEmail: "البريد الإلكتروني",
      columnRole: "الدور",
      columnJoinedAt: "تاريخ الانضمام",
      role: {
        admin: "مدير",
        teacher: "معلم",
        student: "طالب",
      },
      changeRole: "تغيير الدور",
      inviteButton: "دعوة عضو",
      inviteTitle: "دعوة عضو جديد",
      inviteDescription:
        "أرسل دعوة عبر البريد الإلكتروني للانضمام إلى هذه المؤسسة.",
      inviteEmailLabel: "البريد الإلكتروني",
      inviteRoleLabel: "الدور",
      inviteSent: "تم إرسال الدعوة.",
      inviteFailed: "تعذر إرسال الدعوة.",
      alreadyMember: "هذا الشخص عضو بالفعل في هذه المؤسسة.",
      roleUpdated: "تم تحديث الدور.",
      roleUpdateFailed: "تعذر تحديث الدور.",
      removed: "تمت إزالة العضو.",
      removeFailed: "تعذر إزالة هذا العضو.",
      removeConfirmTitle: "إزالة العضو؟",
      removeConfirmDescription:
        "إزالة {name} من هذه المؤسسة. سيفقد وصوله فورًا.",
      lastAdmin: "يجب أن يكون للمؤسسة مدير واحد على الأقل.",
    },
    invite: {
      invalid: "رابط هذه الدعوة غير صالح أو منتهي الصلاحية.",
      invalidTitle: "الدعوة غير متاحة",
      emailMismatch: "تم إرسال هذه الدعوة إلى بريد إلكتروني مختلف.",
    },
    limits: {
      studentLimitReached: dt("تسمح خطتك بحد أقصى {limit:number} طالب.", {}),
      courseLimitReached: dt("تسمح خطتك بحد أقصى {limit:number} دورة.", {}),
      storageLimitReached: dt(
        "تسمح خطتك بحد أقصى {limitGb:number} جيجابايت من التخزين.",
        {},
      ),
    },
    emails: {
      invite: {
        subject: "تمت دعوتك للانضمام إلى {organizationName}",
        text: "دعاك {inviterName} للانضمام إلى {organizationName} على Gateling-TMS: {acceptUrl}",
        intro:
          "دعاك {inviterName} للانضمام إلى {organizationName} على Gateling-TMS.",
        ctaLabel: "قبول الدعوة",
        ignore: "إذا لم تكن تتوقع هذه الدعوة، يمكنك تجاهل هذه الرسالة.",
      },
    },
  },
  dashboard: {
    nav: {
      generalGroup: "عام",
    },
    welcome: {
      title: "مرحبًا بعودتك، {orgName}",
      titleFallback: "مرحبًا بعودتك",
      subtitle: "إليك نظرة سريعة على أكاديميتك.",
    },
    stats: {
      students: "الطلاب",
      courses: "الدورات",
      plan: "الباقة",
    },
    upcoming: {
      title: "المزيد قادم قريبًا",
      description:
        "مكتبة المحتوى ومسار التعلم والحصص المباشرة ستتوفر في المراحل القادمة — ستتمكن من إدارة الدورات والحصص والجلسات المباشرة من هنا.",
      settingsCta: "إدارة المؤسسة",
    },
  },
  getStarted: {
    hero: {
      title: "أنشئ مركزك التدريبي",
      description: "مجاني للبدء. يستغرق حوالي دقيقة واحدة.",
    },
    step1: {
      title: "أخبرنا عن نشاطك التجاري",
      contactNameLabel: "اسمك",
      businessNameLabel: "اسم النشاط التجاري",
      emailLabel: "البريد الإلكتروني",
      phoneLabel: "رقم الهاتف",
      passwordLabel: "كلمة المرور",
    },
    step2: {
      title: "مراجعة وإرسال",
      submitting: "جاري إعداد حسابك…",
      submit: "لنبدأ",
    },
    orgOnly: {
      title: "سمِّ مركزك التدريبي",
    },
    validation: {
      businessNameRequired: "اسم النشاط التجاري مطلوب.",
    },
  },
  landing: {
    header: {
      features: "الميزات",
      pricing: "الأسعار",
      signIn: "تسجيل الدخول",
      getStarted: "ابدأ مجانًا",
      dashboard: "لوحة التحكم",
    },
    footer: {
      tagline:
        "منصة جيتلينج هي بوابتك لإدارة عملك التعليمي عبر الإنترنت — إدارة الدورات والحصص المباشرة ومتابعة الطلاب في مكان واحد.",
      linksHeading: "روابط سريعة",
      legalHeading: "قانوني",
      copyright: "© {year} جيتلينج. جميع الحقوق محفوظة.",
      links: {
        about: "من نحن",
        contact: "تواصل معنا",
        privacy: "سياسة الخصوصية",
        terms: "شروط الخدمة",
        cookies: "سياسة ملفات تعريف الارتباط",
        refund: "سياسة الاسترداد",
      },
    },
    hero: {
      title: "بوابتك لإدارة عملك التعليمي عبر الإنترنت",
      subtitle:
        "سجّل مجانًا، أنشئ أكاديميتك، وابدأ في إدارة الحصص والطلاب خلال دقائق — بدون مكالمة مبيعات وبدون مشروع إعداد.",
      primaryCta: "ابدأ مجانًا",
      secondaryCta: "تسجيل الدخول",
      highlights: {
        free: "خطة مجانية بلا حد زمني",
        noCard: "بدون بطاقة ائتمان",
        bilingual: "ثنائي اللغة — إنجليزي وعربي",
      },
      demo: {
        courseTitle: "مقدمة في الجبر",
        courseCategory: "الرياضيات",
        courseLevel: "مبتدئ",
        lessonsLabel: "24 درسًا",
        durationLabel: "6 ساعات",
        priceLabel: "مجاني",
      },
      socialProof: {
        count: "أكثر من 1,000 أكاديمية",
        suffix: "تُدرّس بالفعل على جيتلينج",
      },
    },
    logos: {
      eyebrow: "موثوق به من أكاديميات في كل مكان",
    },
    testimonial: {
      eyebrow: "ماذا تقول الأكاديميات",
      quote:
        "«نقلنا أكاديميتنا بالكامل إلى جيتلينج خلال عطلة نهاية أسبوع واحدة. ارتفعت معدلات التسجيل، وأخيرًا توقفت عن التعامل مع جداول البيانات المعقدة.»",
      initials: "بن",
      name: "بريا ن.",
      role: "مؤسِّسة أكاديمية برايت-باث",
    },
    valueProposition: {
      header: {
        eyebrow: "لماذا جيتلينج",
        title: "مصمم ليناسب طريقتك في التدريس",
        description:
          "بدون حشو وبدون قيود — فقط الأدوات التي تحتاجها أكاديميتك من اليوم الأول.",
      },
      instantOnboarding: {
        title: "بدء فوري",
        description:
          "سجّل وابدأ إدارة الحصص من أول جلسة — بدون إعداد إلزامي وبدون مكالمة مبيعات.",
      },
      excelFirst: {
        title: "يبدأ بملفات إكسل",
        description:
          "استورد الطلاب والمحتوى من ملفات إكسل التي تستخدمها بالفعل، مع قوالب جاهزة لكل قائمة رئيسية.",
      },
      freeForever: {
        title: "مجاني يعني مجاني فعلاً",
        description:
          "بدون حد زمني وبدون بطاقة ائتمان. الحدود سخية بما يكفي لإدارة أكاديمية صغيرة — الترقية فقط عند الحاجة إليها.",
      },
      bilingual: {
        title: "ثنائي اللغة بالتصميم",
        description:
          "الإنجليزية والعربية متساويتان تمامًا، مع دعم كامل للكتابة من اليمين لليسار.",
      },
    },
    featuresPreview: {
      eyebrow: "كل شيء في مكان واحد",
      title: "كل ما تحتاجه أكاديميتك",
      subtitle:
        "الخطة المجانية تغطي المحتوى والحصص والجلسات المباشرة اليوم. والمزيد قادم قريبًا.",
      free: "مجاني",
      comingSoon: "قريبًا",
      modules: {
        contentLibrary: {
          title: "مكتبة المحتوى",
          description:
            "خزّن محتوى المحاضرات، نظّمه حسب الدورة، وابحث عن أي شيء بالفلاتر والبحث.",
        },
        learningFlow: {
          title: "مسار التعلم",
          description:
            "نظّم الدورات إلى مستويات، تابع تقدم الطلاب، وأجرِ التقييمات.",
        },
        liveClasses: {
          title: "الحصص المباشرة",
          description:
            "قدّم جلسات فيديو عالية الجودة، شارك الشاشة، وسجّل الحصص — بواسطة Zoom.",
        },
        hr: {
          title: "إدارة الموارد البشرية",
          description: "أدر الموظفين والرواتب والأداء والحضور في مكان واحد.",
        },
        courseStore: {
          title: "متجر الدورات",
          description:
            "بِع الدورات عبر الإنترنت مع مدفوعات مدمجة وتحليلات مبيعات.",
        },
        crm: {
          title: "نظام إدارة العملاء",
          description: "تابع العملاء المحتملين وملفات الطلاب وسجل التسجيل.",
        },
        smartForms: {
          title: "النماذج الذكية",
          description:
            "أنشئ نماذج مخصصة مع أتمتة سير العمل عبر مؤسستك بالكامل.",
        },
        community: {
          title: "منصة المجتمع",
          description: "منتديات نقاش، مجموعات طلابية، وتعلم بين الأقران.",
        },
        support: {
          title: "نظام الدعم",
          description: "تذاكر الدعم، الدردشة المباشرة، وقاعدة معرفية لطلابك.",
        },
      },
    },
    process: {
      eyebrow: "كيف تعمل المنصة",
      title: "من التسجيل إلى أول حصة",
      subtitle: "بدون بيانات أساسية، بدون مشروع إعداد — أربع خطوات فقط.",
      steps: {
        signUp: {
          title: "سجّل",
          description: "أنشئ حسابك — مجانًا وبدون بطاقة ائتمان.",
        },
        setUp: {
          title: "أنشئ أكاديميتك",
          description: "سمِّ مؤسستك وفعّل بريدك الإلكتروني.",
        },
        addClasses: {
          title: "أضف الحصص والطلاب",
          description:
            "أنشئ حصة وأضف الطلاب — أدخلهم يدويًا أو استوردهم من إكسل.",
        },
        teach: {
          title: "ابدأ التدريس",
          description:
            "جدول الجلسات، شارك المحتوى، وتابع التقدم من لوحة التحكم.",
        },
      },
    },
    finalCta: {
      title: "هل أنت مستعد لإدارة أكاديميتك عبر الإنترنت؟",
      subtitle: "انضم مجانًا — بدون بطاقة ائتمان وبدون حد زمني.",
      cta: "ابدأ مجانًا",
    },
  },
  features: {
    hero: {
      title: "كل ما تحتاجه أكاديميتك",
      description:
        "اطّلع على ما هو متاح مجانًا اليوم — وما سيأتي قريبًا مع نمو Gateling-TMS.",
      primaryCta: "ابدأ مجانًا",
      secondaryCta: "اطّلع على الأسعار",
    },
    free: {
      title: "الميزات المجانية",
      description: "كل ما يلي متاح الآن، مجانًا، وبدون حد زمني.",
      badge: "مجاني",
    },
    premium: {
      title: "الميزات المتقدمة",
      description:
        "المزيد من الوحدات قادم قريبًا لمساعدتك على التوسع بعد الأساسيات.",
      badge: "قريبًا",
    },
    modules: {
      contentLibrary: {
        title: "مكتبة المحتوى",
        description:
          "نظام مركزي لإدارة الموارد الرقمية لجميع محتوياتك ومحاضراتك التعليمية.",
        bullets: {
          digitalResources: "تخزين الموارد الرقمية",
          mediaManagement: "إدارة ملفات الوسائط",
          contentOrganization: "تنظيم المحتوى",
          searchFiltering: "بحث وتصفية متقدمان",
        },
      },
      learningFlow: {
        title: "مسار التعلّم",
        description:
          "مسارات تعلّم منظمة توجّه الطلاب خلال رحلتهم التعليمية خطوة بخطوة.",
        bullets: {
          courseStructure: "تصميم هيكل الدورة",
          progressTracking: "تتبع التقدم",
          assessments: "تقييمات مدمجة",
          certificates: "إصدار الشهادات",
        },
      },
      liveClasses: {
        title: "الفصول المباشرة",
        description:
          "بث فصول مباشرة تفاعلية بجودة عالية مع أدوات تعاون فوري — بواسطة Zoom.",
        bullets: {
          hdVideoStreaming: "بث فيديو عالي الجودة",
          interactiveWhiteboard: "سبورة تفاعلية",
          recordingCapabilities: "تسجيل الفصول",
          screenSharing: "مشاركة الشاشة",
        },
      },
      hr: {
        title: "إدارة الموارد البشرية",
        description:
          "نظام شامل لإدارة الموارد البشرية لشؤون الموظفين وتتبع الأداء.",
        bullets: {
          staffManagement: "إدارة الموظفين",
          payrollIntegration: "تكامل الرواتب",
          performanceTracking: "تتبع الأداء",
          attendanceMonitoring: "متابعة الحضور",
        },
      },
      courseStore: {
        title: "متجر الدورات",
        description:
          "سوق مدمج لبيع دوراتك عبر الإنترنت مع مدفوعات وتحليلات متكاملة.",
        bullets: {
          onlineMarketplace: "سوق دورات إلكتروني",
          paymentProcessing: "معالجة المدفوعات",
          coursePackaging: "تجهيز الدورات وتسعيرها",
          salesAnalytics: "تحليلات المبيعات",
        },
      },
      crm: {
        title: "نظام إدارة العلاقات",
        description:
          "تتبع العملاء المحتملين، وإدارة علاقات الطلاب، وزيادة معدل التسجيل.",
        bullets: {
          leadManagement: "إدارة العملاء المحتملين",
          studentProfiles: "ملفات تفصيلية للطلاب",
          communicationHistory: "سجل التواصل",
          enrollmentTracking: "تتبع التسجيل",
        },
      },
      smartForms: {
        title: "النماذج الذكية",
        description:
          "منشئ نماذج ذكي مع سير عمل آلي للقبول والاستطلاعات وجمع البيانات.",
        bullets: {
          customForms: "منشئ نماذج مخصص",
          dataCollection: "جمع بيانات آلي",
          automatedWorkflows: "أتمتة سير العمل",
          integrationCapabilities: "تكامل الأنظمة",
        },
      },
      community: {
        title: "منصة المجتمع",
        description: "منصة تعلّم اجتماعي تربط الطلاب والمعلمين وأولياء الأمور.",
        bullets: {
          discussionForums: "منتديات نقاش",
          studentGroups: "مجموعات طلابية",
          socialLearning: "ميزات تعلّم اجتماعي",
          peerInteraction: "تفاعل بين الأقران",
        },
      },
      support: {
        title: "نظام الدعم",
        description: "دعم شامل يشمل التذاكر والدردشة المباشرة وقاعدة معرفية.",
        bullets: {
          ticketingSystem: "نظام تذاكر",
          liveChat: "دردشة مباشرة",
          knowledgeBase: "قاعدة معرفية",
          prioritySupport: "دعم ذو أولوية",
        },
      },
    },
    cta: {
      title: "هل أنت مستعد للبدء؟",
      description: "سجّل مجانًا اليوم — بدون بطاقة ائتمان وبدون حد زمني.",
      cta: "ابدأ مجانًا",
    },
  },
  pricing: {
    hero: {
      badge: "أسعار مرنة",
      title: "اختر الخطة المناسبة لأكاديميتك",
      description:
        "ابدأ مجانًا — بدون بطاقة ائتمان وبدون حد زمني. الخطط المدفوعة قادمة قريبًا لما بعد تجاوز الأساسيات.",
    },
    plans: {
      free: {
        name: "مجاني",
        description: "مثالية للبداية",
      },
      basic: {
        name: "أساسي",
        description: "رائعة للأكاديميات الصغيرة",
      },
      professional: {
        name: "احترافي",
        description: "للأكاديميات النامية",
      },
      enterprise: {
        name: "المؤسسات",
        description: "للمؤسسات الكبيرة",
      },
    },
    featureLabels: {
      contentLibrary: "مكتبة المحتوى",
      learningFlow: "مسار التعلّم",
      liveClasses: "الفصول المباشرة",
      hr: "إدارة الموارد البشرية",
      courseStore: "متجر الدورات",
      crm: "نظام إدارة العلاقات",
      smartForms: "النماذج الذكية",
      community: "منصة المجتمع",
      support: "نظام الدعم",
    },
    mostPopular: "الأكثر شيوعًا",
    free: "مجاني",
    currency: "ج.م",
    perMonth: "/شهريًا",
    signupCta: "ابدأ مجانًا",
    comingSoon: "قريبًا",
    limits: {
      students: "الطلاب النشطون",
      courses: "الدورات",
      storage: "التخزين",
      unlimited: "غير محدود",
    },
    faq: {
      title: "الأسئلة الشائعة",
      description: "إجابات عن الأسئلة الشائعة حول خططنا.",
      questions: {
        q1: {
          question: "هل يمكنني تغيير خطتي لاحقًا؟",
          answer:
            "الخطط الأساسية والاحترافية وخطة المؤسسات قادمة قريبًا. ستتمكن من الترقية من الخطة المجانية بمجرد إطلاقها.",
        },
        q2: {
          question: "هل يوجد حد زمني للخطة المجانية؟",
          answer:
            "لا. الخطة المجانية بلا حد زمني ولا تتطلب بطاقة ائتمان — فهي ليست مجرد نسخة تجريبية.",
        },
        q3: {
          question: "ماذا يحدث إذا وصلت إلى حدود خطتي؟",
          answer:
            "سنُعلمك قبل أن تصل إلى حد صارم، ونوجّهك إلى الخطة الأعلى — لن تفقد بياناتك أبدًا ولن يتوقف عملك في المنتصف.",
        },
      },
    },
  },
  legal: {
    lastUpdated: "آخر تحديث: يوليو 2026",
  },
  about: {
    hero: {
      title: "مصمم ليناسب طريقة عمل الأكاديميات فعليًا",
      description:
        "Gateling-TMS نظام مباشر لإدارة التدريب مخصص للأكاديميات وأصحاب أعمال التعليم عبر الإنترنت — بدون مكالمات مبيعات وبدون مشاريع إعداد، فقط سجّل وابدأ في إدارة الحصص.",
    },
    beliefs: {
      title: "ما نؤمن به",
      description:
        "هذه ليست جملًا تسويقية — إنها القرارات التي نتخذها عند بناء المنتج.",
      items: {
        instantOnboarding: {
          title: "بداية فورية",
          description:
            "سجّل وابدأ إدارة الحصص في جلسة واحدة. بدون إعداد إلزامي وبدون مكالمة مبيعات.",
        },
        excelFirst: {
          title: "إكسل أولًا",
          description:
            "كل قائمة رئيسية تدعم الاستيراد والتصدير، فالانتقال من جداول البيانات يبدو طبيعيًا.",
        },
        freeForever: {
          title: "مجاني يعني مجاني",
          description:
            "الخطة المجانية بلا حد زمني ولا تتطلب بطاقة ائتمان — وهي كافية لإدارة أكاديمية صغيرة.",
        },
        bilingual: {
          title: "ثنائية اللغة بالتصميم",
          description:
            "الإنجليزية والعربية متساويتان، مع دعم كامل للاتجاه من اليمين لليسار منذ اليوم الأول.",
        },
        truthful: {
          title: "تسويق صادق",
          description:
            "نذكر فقط ما هو مبني بالفعل. أي شيء غير جاهز بعد يُوسم بـ«قريبًا» — لا يُلمَّح إليه فقط.",
        },
      },
    },
    cta: {
      title: "هل أنت مستعد لتجربتها بنفسك؟",
      description: "أنشئ أكاديميتك مجانًا — بدون بطاقة ائتمان وبدون حد زمني.",
      cta: "ابدأ مجانًا",
    },
  },
  contact: {
    hero: {
      title: "تواصل معنا",
      description:
        "أسئلة أو ملاحظات أو شيء لا يعمل؟ أرسل لنا رسالة وسنعاود التواصل معك.",
    },
    form: {
      title: "أرسل رسالة",
      nameLabel: "اسمك",
      emailLabel: "البريد الإلكتروني",
      subjectLabel: "الموضوع",
      messageLabel: "الرسالة",
      submit: "إرسال الرسالة",
      submitting: "جارٍ الإرسال…",
      success: "تم إرسال الرسالة — سنعاود التواصل معك قريبًا.",
      error: {
        rateLimited: "تم إرسال رسائل كثيرة جدًا. يرجى المحاولة لاحقًا.",
        submitFailed: "تعذر إرسال رسالتك. يرجى المحاولة مرة أخرى.",
      },
    },
    emails: {
      notification: {
        subject: "رسالة جديدة من نموذج التواصل: {subject}",
        greeting: "رسالة جديدة من نموذج التواصل",
        intro: 'أرسل {name} ({email}) رسالة: "{subject}"',
      },
    },
  },
} as const satisfies LanguageMessages;
