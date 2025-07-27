import { dt, type LanguageMessages } from "@/i18n/lib";

export default {
    features: {
        hero: {
            title: 'ميزات نظام إدارة التعليم الكاملة',
            description: 'اكتشف مجموعتنا الشاملة من الميزات المصممة لتحويل عمليات أكاديميتك، من الأساسيات المجانية إلى الأدوات المتقدمة المدفوعة.',
            primaryButton: 'ابدأ النسخة التجريبية المجانية',
            secondaryButton: 'جدولة عرض توضيحي'
        },
        freeFeatures: {
            title: 'الميزات المجانية',
            description: 'ابدأ بميزاتنا الأساسية دون أي تكلفة. مثالية للأكاديميات الصغيرة والتي تبدأ رحلة التحول الرقمي.'
        },
        premiumFeatures: {
            title: 'الميزات المدفوعة',
            description: 'اكتشف القدرات المتقدمة لتوسيع عمليات أكاديميتك وتعزيز ميزتك التنافسية في سوق التعليم.'
        },
        badges: {
            free: 'مجاني',
            premium: 'مدفوع'
        },
        services: {
            contentLibrary: {
                title: 'مكتبة المحتوى',
                description: 'نظام إدارة الموارد الرقمية المركزي لجميع محتوياتك ومواد التعليمية.',
                features: {
                    digitalResources: 'تخزين الموارد الرقمية',
                    mediaManagement: 'إدارة ملفات الوسائط',
                    contentOrganization: 'تنظيم المحتوى',
                    searchFiltering: 'البحث والتصفية المتقدمة'
                }
            },
            learningFlow: {
                title: 'مسار التعلم',
                description: 'مسارات تعلم منظمة توجه الطلاب خلال رحلتهم التعليمية خطوة بخطوة.',
                features: {
                    courseStructure: 'تصميم هيكل الدورة',
                    progressTracking: 'تتبع التقدم',
                    assessments: 'التقييمات المدمجة',
                    certificates: 'إنشاء الشهادات'
                }
            },
            liveClasses: {
                title: 'الفصول المباشرة',
                description: 'إجراء فصول مباشرة تفاعلية مع بث فيديو عالي الدقة وأدوات التعاون في الوقت الفعلي.',
                features: {
                    hdVideoStreaming: 'بث فيديو عالي الدقة',
                    interactiveWhiteboard: 'السبورة التفاعلية',
                    recordingCapabilities: 'تسجيل الفصول',
                    screenSharing: 'مشاركة الشاشة'
                }
            },
            hr: {
                title: 'إدارة الموارد البشرية',
                description: 'نظام شامل لإدارة الموارد البشرية لإدارة الموظفين وتتبع الأداء.',
                features: {
                    staffManagement: 'إدارة الموظفين',
                    payrollIntegration: 'تكامل كشوف المرتبات',
                    performanceTracking: 'تتبع الأداء',
                    attendanceMonitoring: 'مراقبة الحضور'
                }
            },
            courseStore: {
                title: 'متجر الدورات',
                description: 'سوق مدمج لبيع دوراتك عبر الإنترنت مع معالجة المدفوعات المتكاملة والتحليلات.',
                features: {
                    onlineMarketplace: 'سوق الدورات الإلكترونية',
                    paymentProcessing: 'معالجة المدفوعات',
                    coursePackaging: 'تغليف وتسعير الدورات',
                    salesAnalytics: 'تحليلات المبيعات'
                }
            },
            crm: {
                title: 'نظام إدارة العلاقات',
                description: 'نظام إدارة علاقات العملاء لتتبع العملاء المحتملين وإدارة علاقات الطلاب وزيادة التسجيل.',
                features: {
                    leadManagement: 'إدارة العملاء المحتملين',
                    studentProfiles: 'ملفات تعريف الطلاب التفصيلية',
                    communicationHistory: 'تاريخ التواصل',
                    enrollmentTracking: 'تتبع التسجيل'
                }
            },
            smartForms: {
                title: 'النماذج الذكية',
                description: 'منشئ نماذج ذكي مع سير عمل آلي للقبول والاستطلاعات وجمع البيانات.',
                features: {
                    customForms: 'منشئ النماذج المخصصة',
                    dataCollection: 'جمع البيانات الآلي',
                    automatedWorkflows: 'أتمتة سير العمل',
                    integrationCapabilities: 'تكامل الأنظمة'
                }
            },
            community: {
                title: 'منصة المجتمع',
                description: 'منصة تعلم اجتماعي تربط الطلاب والمعلمين وأولياء الأمور في بيئة مجتمعية جذابة.',
                features: {
                    discussionForums: 'منتديات النقاش',
                    studentGroups: 'مجموعات الطلاب',
                    socialLearning: 'ميزات التعلم الاجتماعي',
                    peerInteraction: 'التفاعل بين الأقران'
                }
            },
            support: {
                title: 'نظام الدعم',
                description: 'نظام دعم شامل مع التذاكر والدردشة المباشرة وقاعدة المعرفة للمساعدة السلسة للمستخدمين.',
                features: {
                    ticketingSystem: 'نظام التذاكر',
                    liveChat: 'دعم الدردشة المباشرة',
                    knowledgeBase: 'قاعدة المعرفة',
                    prioritySupport: 'الدعم ذو الأولوية'
                }
            }
        },
        process: {
            title: 'عملية التنفيذ الخاصة بنا',
            description: 'نتبع عملية مثبتة لضمان التنفيذ السلس والاعتماد الناجح لمنصة نظام إدارة التعليم الخاصة بنا.',
            setup: {
                title: 'الإعداد والتكوين الأولي',
                description: 'نقوم بتكوين منصة نظام إدارة التعليم الخاصة بك وفقًا لمتطلبات وهيكل أكاديميتك المحددة.'
            },
            configuration: {
                title: 'التخصيص والتكامل',
                description: 'تخصيص المنصة لتتناسب مع علامتك التجارية والتكامل مع أنظمتك الحالية.'
            },
            training: {
                title: 'التدريب والإعداد',
                description: 'تدريب شامل لموظفيك وطلابك لضمان الاعتماد السلس للمنصة.'
            },
            support: {
                title: 'الدعم والصيانة المستمرة',
                description: 'دعم مستمر وتحديثات وصيانة للحفاظ على تشغيل منصتك بسلاسة.'
            }
        },
        cta: {
            title: 'هل أنت مستعد لتحويل أكاديميتك؟',
            description: 'ابدأ بميزاتنا المجانية اليوم وقم بالترقية إلى النسخة المدفوعة عندما تكون مستعدًا لتوسيع عملياتك.',
            primaryButton: 'ابدأ مجانًا',
            secondaryButton: 'شاهد العرض التوضيحي'
        }
    }
} as const satisfies LanguageMessages;