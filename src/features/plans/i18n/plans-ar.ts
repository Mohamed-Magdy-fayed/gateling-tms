import { dt, type LanguageMessages } from "@/i18n/lib";

export default {
    subscriptionEmails: {
        confirmation: {
            subject: "مرحباً بك في جيتلينج TMS! تم تأكيد اشتراكك",
            welcome: "مرحباً بك في جيتلينج TMS!",
            dearuser: "عزيزي {userName}،",
            thankyoumessage: "شكراً لك على الاشتراك في جيتلينج TMS! تم معالجة دفعتك بنجاح، وحسابك الآن نشط مع إمكانية الوصول الكامل لجميع الميزات.",
            subscriptiondetails: "تفاصيل الاشتراك",
            plan: "الخطة",
            billingcycle: "دورة الفوترة",
            amount: "المبلغ",
            transactionid: "رقم المعاملة",
            subscriptionid: "رقم الاشتراك",
            whatsnext: "ما التالي؟",
            step1: "ادخل إلى لوحة التحكم لبدء إعداد أكاديميتك",
            step2: "ارفع محتوى دورتك الأولى وادع الطلاب",
            step3: "استكشف الميزات المتقدمة لتحقيق أقصى إمكانات التدريس",
            accessdashboard: "ادخل إلى لوحة التحكم",
            featuresunlocked: "الميزات المتاحة الآن",
            supportmessage: "إذا كان لديك أي أسئلة أو تحتاج مساعدة في البدء، فريق الدعم لدينا هنا للمساعدة.",
            billingquestions: "لأسئلة الفوترة أو إدارة الحساب، قم بزيارة لوحة التحكم أو اتصل بفريق الدعم."
        },
        paymentFailed: {
            subject: "فشل الدفع - مطلوب إجراء لاشتراك جيتلينج TMS",
            alerttitle: "فشل الدفع",
            alertmessage: "لم نتمكن من معالجة دفعتك",
            dearuser: "عزيزي {userName}،",
            paymentissuemessage: "واجهنا مشكلة أثناء معالجة دفعتك لاشتراك جيتلينج TMS. لا تقلق - حسابك لا يزال نشطاً في الوقت الحالي، ونحن هنا للمساعدة في حل هذا الأمر بسرعة.",
            attemptedpayment: "تفاصيل الدفع المحاولة",
            plan: "الخطة",
            billingcycle: "دورة الفوترة",
            amount: "المبلغ",
            reason: "سبب الفشل",
            whattodo: "ما يجب فعله",
            step1title: "حدث طريقة الدفع",
            step1description: "تحقق من انتهاء صلاحية البطاقة أو عدم كفاية الأموال",
            step2title: "أعد المحاولة",
            step2description: "استخدم الزر أدناه لمحاولة الدفع مرة أخرى",
            step3title: "اتصل بالدعم إذا لزم الأمر",
            step3description: "فريقنا جاهز للمساعدة إذا استمرت المشاكل",
            retrypayment: "أعد المحاولة الآن",
            contactsupport: "اتصل بالدعم",
            commonissues: "مشاكل الدفع الشائعة",
            issue1: "معلومات بطاقة ائتمان منتهية الصلاحية أو غير صحيحة",
            issue2: "أموال غير كافية في حسابك",
            issue3: "قيود أمنية من البنك على المدفوعات الإلكترونية",
            issue4: "معلومات عنوان الفوترة غير صحيحة",
            urgencytitle: "إشعار مهم",
            urgencymessage: "للحفاظ على الوصول المستمر لميزات جيتلينج TMS، يرجى حل مشكلة الدفع خلال 7 أيام.",
            supportmessage: "نتفهم أن مشاكل الدفع قد تكون محبطة. فريق الدعم لدينا متاح 24/7 لمساعدتك.",
            teamsignature: "أطيب التحيات،\nفريق جيتلينج TMS"
        },
        planUpgraded: {
            subject: "تهانينا! تم ترقية خطة جيتلينج TMS الخاصة بك",
            celebrationtitle: "تم ترقية الخطة بنجاح!",
            celebrationmessage: "لديك الآن إمكانية الوصول لميزات أكثر قوة",
            dearuser: "عزيزي {userName}،",
            upgrademessage: "تهانينا! لقد نجحت في الترقية من {previousPlan} إلى {newPlan}. ميزاتك المحسنة متاحة الآن.",
            upgradedetails: "تفاصيل الترقية",
            previousplan: "الخطة السابقة",
            newplan: "الخطة الجديدة",
            billingcycle: "دورة الفوترة",
            newprice: "السعر الجديد",
            effectivedate: "تاريخ السريان",
            immediateaccess: "وصول فوري ✨",
            newfeatures: "الميزات الجديدة المفتوحة",
            gettingstarted: "البدء مع ميزاتك الجديدة",
            step1: "استكشف مجموعة الميزات الموسعة في لوحة التحكم",
            step2: "استفد من الحدود المتزايدة والقدرات الجديدة",
            step3: "اطلع على أدلة الميزات للحصول على نصائح وأفضل الممارسات",
            accessdashboard: "ادخل إلى لوحة التحكم",
            explorefeatures: "استكشف الميزات الجديدة",
            increasedlimits: "حدودك الجديدة",
            studentslimit: "الطلاب",
            courseslimit: "الدورات",
            storagelimit: "التخزين",
            was: "كان",
            supportmessage: "تحتاج مساعدة في البدء مع ميزاتك الجديدة؟ فريق الدعم لدينا هنا لإرشادك.",
            teamsignature: "تهانينا مرة أخرى على ترقيتك!\nفريق جيتلينج TMS"
        },
        planDowngraded: {
            subject: "تم تغيير خطة جيتلينج TMS الخاصة بك",
            noticetitle: "تأكيد تغيير الخطة",
            noticemessage: "تم تحديث اشتراكك",
            dearuser: "عزيزي {userName}،",
            downgrademessage: "تم تغيير خطتك من {previousPlan} إلى {newPlan}. سيدخل هذا التغيير حيز التنفيذ في نهاية فترة الفوترة الحالية.",
            downgradedetails: "تفاصيل تغيير الخطة",
            currentplan: "الخطة الحالية (حتى نهاية الفترة)",
            newplan: "الخطة الجديدة (تبدأ الفترة القادمة)",
            billingcycle: "دورة الفوترة",
            effectivedate: "تاريخ السريان",
            whatchanges: "ما الذي يتغير",
            featureslosing: "الميزات التي ستفقد الوصول إليها:",
            featureskeeping: "الميزات التي ستستمر في الحصول عليها:",
            newlimits: "حدودك الجديدة",
            studentslimit: "الطلاب",
            courseslimit: "الدورات",
            storagelimit: "التخزين",
            was: "كان",
            importantnotice: "إشعار مهم",
            dataretentionmessage: "سيتم الحفاظ على بياناتك الموجودة، لكن بعض الميزات قد تصبح للقراءة فقط.",
            backupreminder: "فكر في نسخ احتياطي لأي بيانات تريد الاحتفاظ بإمكانية الوصول إليها",
            accesstimeline: "لديك حتى تاريخ السريان لاستخدام الميزات المميزة",
            upgradeagain: "ترقية خطتك",
            manageaccount: "إدارة الحساب",
            whyupgrade: "لماذا تفكر في الترقية مرة أخرى؟",
            benefit1: "افتح ميزات متقدمة لتنمية أكاديميتك بشكل أسرع",
            benefit2: "احصل على حدود أعلى لاستيعاب المزيد من الطلاب",
            benefit3: "الوصول إلى الدعم المميز والمساعدة ذات الأولوية",
            supportmessage: "إذا كان لديك أسئلة حول تغيير خطتك أو تحتاج مساعدة، نحن هنا للمساعدة.",
            teamsignature: "أطيب التحيات،\nفريق جيتلينج TMS"
        },
        cancelled: {
            subject: "تم إلغاء اشتراك جيتلينج TMS الخاص بك",
            noticetitle: "تم إلغاء الاشتراك",
            immediatenotice: "تم إلغاء اشتراكك فوراً",
            endperiodnotice: "سينتهي اشتراكك في فترة الفوترة الحالية",
            dearuser: "عزيزي {userName}،",
            cancellationmessage: "نأسف لرؤيتك تغادر! تم إلغاء اشتراك {plan} الخاص بك كما طلبت.",
            cancellationdetails: "تفاصيل الإلغاء",
            cancelledplan: "الخطة الملغاة",
            billingcycle: "دورة الفوترة",
            cancellationdate: "تاريخ الإلغاء",
            accessuntil: "الوصول حتى",
            immediate: "فوري",
            whathappensnext: "ما يحدث بعد ذلك",
            step1immediate: "تم تعليق وصولك فوراً",
            step1periodend: "ستستمر في الحصول على الوصول حتى انتهاء فترة الفوترة",
            step1immediatedesc: "جميع الميزات المميزة لم تعد متاحة",
            step1periodenddesc: "الوصول الكامل يستمر حتى {date}",
            step2title: "بياناتك آمنة",
            step2desc: "سيتم الحفاظ على جميع محتوياتك وبيانات الطلاب لمدة 90 يوماً",
            step3title: "إعادة التفعيل سهلة",
            step3desc: "يمكنك إعادة تفعيل اشتراكك في أي وقت لاستعادة الوصول الكامل",
            backupremindertitle: "لا تنس النسخ الاحتياطي",
            backupremindermessage: "قبل انتهاء وصولك، فكر في تحميل:",
            backupitem1: "مواد الدورة وتقارير تقدم الطلاب",
            backupitem2: "معلومات الاتصال بالطلاب وبيانات التسجيل",
            backupitem3: "أي محتوى مخصص أو تقييمات قمت بإنشائها",
            comebacktitle: "نحب أن نراك تعود",
            comebackmessage: "إذا غيرت رأيك، إعادة تفعيل اشتراكك سريعة وسهلة:",
            benefit1: "سيتم استعادة جميع بياناتك تماماً كما تركتها",
            benefit2: "لا حاجة للإعداد - تابع من حيث توقفت",
            benefit3: "نفس الميزات الرائعة مع أي تحسينات قمنا بها",
            reactivatesubscription: "إعادة تفعيل الاشتراك",
            subscribeagain: "اشترك مرة أخرى",
            browseplans: "تصفح الخطط",
            sharefeedback: "شارك ملاحظاتك",
            feedbacktitle: "ساعدنا في التحسين",
            feedbackmessage: "نحب أن نسمع عن تجربتك وكيف يمكننا تحسين جيتلينج TMS.",
            feedbackquestions: "ما الذي كان بإمكاننا فعله بشكل أفضل؟ ما الميزات التي كانت مفقودة؟",
            finalmessage: "شكراً لك لكونك جزءاً من مجتمع جيتلينج TMS. نأمل أن نخدمك مرة أخرى في المستقبل.",
            teamsignature: "أطيب الأمنيات،\nفريق جيتلينج TMS"
        },
        trialEnding: {
            subject: "تنتهي تجربة جيتلينج TMS في {days:number} أيام",
            urgencytitle: "التجربة تنتهي في {days:number} أيام",
            urgentmessage: "لا تفقد الوصول إلى أكاديميتك!",
            remindermessage: "حان الوقت لتأمين اشتراكك",
            dearuser: "عزيزي {userName}،",
            trialendingmessage: "ستنتهي تجربة {plan} في {days:number} أيام. لمواصلة استخدام جيتلينج TMS دون انقطاع، يرجى اختيار خطة اشتراك.",
            trialdetails: "معلومات التجربة",
            currentplan: "الخطة الحالية",
            trial: "تجربة",
            daysremaining: "الأيام المتبقية",
            trialends: "تنتهي التجربة في",
            yourprogress: "انظر ما أنجزته!",
            progressmessage: "خلال تجربتك، أحرزت تقدماً رائعاً في بناء أكاديميتك الإلكترونية:",
            studentscreated: "15+",
            students: "طلاب مضافين",
            coursescreated: "3",
            courses: "دورات منشأة",
            hourssaved: "20+",
            timesaved: "ساعات موفرة",
            aftertrial: "ما يحدث بعد انتهاء تجربتك",
            loseaccesstitle: "ستفقد الوصول للميزات المميزة",
            loseaccessdesc: "إدارة الدورات المتقدمة والتحليلات وأدوات التواصل مع الطلاب",
            limitedaccesstitle: "وصول مجاني محدود",
            limitedaccessdesc: "سيتم نقلك إلى خطتنا المجانية الأساسية مع ميزات مقيدة",
            datasafetitle: "بياناتك تبقى آمنة",
            datasafedesc: "سيتم الحفاظ على جميع دوراتك ومعلومات الطلاب",
            continuejourney: "تابع رحلتك",
            monthlyplan: "الخطة الشهرية",
            yearlyplan: "الخطة السنوية",
            permonth: "شهرياً",
            bestvalue: "أفضل قيمة",
            saveannually: "وفر 17% سنوياً",
            continuesubscription: "تابع مع الاشتراك",
            viewdashboard: "عرض لوحة التحكم",
            testimonialtext: "جيتلينج TMS غيّر طريقة إدارتي لدوراتي الإلكترونية. الوقت الذي أوفره في الإدارة يتيح لي التركيز على ما أحبه - التدريس!",
            testimonialauthor: "سارة أحمد",
            testimonialtitle: "منشئة دورات إلكترونية",
            supportmessage: "لديك أسئلة حول اختيار الخطة المناسبة؟ فريقنا هنا لمساعدتك في اتخاذ أفضل قرار لأكاديميتك.",
            teamsignature: "نشجع نجاحك،\nفريق جيتلينج TMS"
        },
        pastDue: {
            subject: "عاجل: مطلوب دفع لحساب جيتلينج TMS الخاص بك",
            urgenttitle: "دفع متأخر",
            urgentmessage: "مطلوب إجراء فوري للحفاظ على الوصول",
            overduemessage: "دفعتك متأخرة - يرجى التحديث الآن",
            dearuser: "عزيزي {userName}،",
            paymentoverduemessage: "دفعتك لـ {plan} متأخرة الآن {days:number} أيام. للحفاظ على الوصول لميزات جيتلينج TMS، يرجى تحديث معلومات الدفع فوراً.",
            overduepayment: "تفاصيل الدفع المتأخر",
            subscriptionplan: "خطة الاشتراك",
            billingcycle: "دورة الفوترة",
            amountdue: "المبلغ المستحق",
            originalduedate: "تاريخ الاستحقاق الأصلي",
            daysoverdue: "أيام التأخير",
            days: "أيام",
            immediateaction: "إجراء فوري مطلوب",
            step1title: "تحديث طريقة الدفع",
            step1description: "أضف بطاقة جديدة أو حدث معلومات الدفع الموجودة",
            step2title: "معالجة الدفع",
            step2description: "أكمل الدفع المتأخر لاستعادة الوصول الكامل",
            step3title: "تحقق من حالة الحساب",
            step3description: "تأكد من أن اشتراكك نشط وجميع الميزات مستعادة",
            consequencestitle: "ما يحدث إذا لم يتم الدفع",
            consequencesintro: "لتجنب انقطاع الخدمة، يرجى حل مشكلة الدفع بسرعة:",
            consequence1: "وصول محدود للميزات المميزة بعد 7 أيام",
            consequence2: "تعليق كامل للخدمة بعد 14 يوماً",
            consequence3: "الاحتفاظ ببيانات الحساب لمدة 30 يوماً قبل الحذف",
            urgentconsequence: "تعليق الحساب وشيك - مطلوب إجراء فوري",
            updatepaymentmethod: "تحديث طريقة الدفع",
            contactsupport: "اتصل بالدعم",
            commonissues: "مشاكل الدفع الشائعة والحلول",
            issuesintro: "إليك الأسباب الأكثر شيوعاً لفشل المدفوعات وكيفية إصلاحها:",
            issue1title: "بطاقة منتهية الصلاحية",
            issue1desc: "حدث تاريخ انتهاء صلاحية بطاقتك أو أضف طريقة دفع جديدة",
            issue2title: "أموال غير كافية",
            issue2desc: "تأكد من أن حسابك يحتوي على رصيد كافٍ أو استخدم بطاقة مختلفة",
            issue3title: "تغيير البريد الإلكتروني/العنوان",
            issue3desc: "حدث معلومات الفوترة لتتطابق مع سجلات البنك",
            issue4title: "حظر أمني من البنك",
            issue4desc: "اتصل ببنكك للسماح بالمدفوعات لجيتلينج TMS",
            currentstatus: "حالة الحساب الحالية",
            accountaccess: "وصول الحساب",
            suspended: "معلق",
            limited: "محدود",
            datasafety: "أمان البيانات",
            datasecure: "آمن ومنسوخ احتياطياً",
            helptitle: "نحن هنا للمساعدة",
            helpmessage: "تواجه مشكلة مع دفعتك؟ فريق الدعم لدينا متاح لمساعدتك:",
            contactphone: "دعم هاتفي متاح من 9 صباحاً - 6 مساءً بتوقيت القاهرة",
            contactchat: "دردشة مباشرة متاحة 24/7 في لوحة التحكم",
            contactemail: "دعم بريد إلكتروني مع رد خلال ساعتين",
            supportmessage: "نتفهم أن مشاكل الدفع تحدث. أولويتنا هي مساعدتك في حل هذا بسرعة حتى تتمكن من العودة للتدريس.",
            teamsignature: "هنا للمساعدة،\nفريق جيتلينج TMS"
        }
    },
    plans: {
        free: {
            name: "الخطة المجانية",
            limits: {
                students: "50 طالب",
                courses: "5 دورات",
                storage: "1 جيجابايت"
            },
            features: {
                feature1: "إدارة دورات أساسية",
                feature2: "تسجيل الطلاب",
                feature3: "تحليلات أساسية",
                feature4: "إشعارات بريد إلكتروني"
            }
        },
        basic: {
            name: "الخطة الأساسية",
            pricing: {
                monthly: "299",
                yearly: "2988"
            },
            limits: {
                students: "200 طالب",
                courses: "25 دورة",
                storage: "10 جيجابايت"
            },
            features: {
                feature1: {
                    title: "إدارة دورات متقدمة",
                    description: "إنشاء دروس غير محدودة مع محتوى وسائط غني"
                },
                feature2: {
                    title: "تتبع تقدم الطلاب",
                    description: "مراقبة أداء ومشاركة الطلاب الفردية"
                },
                feature3: {
                    title: "لوحة تحليلات أساسية",
                    description: "عرض معدلات إكمال الدورة ونشاط الطلاب"
                },
                feature4: {
                    title: "إشعارات بريد إلكتروني ورسائل نصية",
                    description: "تواصل تلقائي مع الطلاب وأولياء الأمور"
                }
            },
            exclusivefeatures: {
                feature1: "نظام إدارة الموارد البشرية",
                feature2: "متجر الدورات والسوق",
                feature3: "تقارير متقدمة"
            }
        },
        professional: {
            name: "الخطة المهنية",
            pricing: {
                monthly: "799",
                yearly: "7990"
            },
            limits: {
                students: "1000 طالب",
                courses: "100 دورة",
                storage: "50 جيجابايت"
            },
            features: {
                feature1: {
                    title: "إدارة تعلم كاملة",
                    description: "نظام إدارة تعلم كامل الميزات مع أدوات إنشاء دورات متقدمة"
                },
                feature2: {
                    title: "تحليلات وتقارير متقدمة",
                    description: "رؤى شاملة حول أداء ومشاركة الطلاب"
                },
                feature3: {
                    title: "تكامل إدارة علاقات العملاء",
                    description: "إدارة العملاء المحتملين والتسجيلات وعلاقات الطلاب"
                },
                feature4: {
                    title: "نماذج ذكية وأتمتة",
                    description: "سير عمل تلقائي للتسجيل والتواصل"
                }
            },
            exclusivefeatures: {
                feature1: "منصة مجتمع",
                feature2: "نظام دعم أولوية",
                feature3: "خيارات العلامة البيضاء"
            }
        },
        enterprise: {
            name: "خطة المؤسسات",
            pricing: {
                monthly: "1999",
                yearly: "19990"
            },
            limits: {
                students: "غير محدود",
                courses: "غير محدود",
                storage: "500 جيجابايت"
            },
            features: {
                feature1: {
                    title: "منصة مستوى المؤسسات",
                    description: "بنية تحتية قابلة للتوسع للمؤسسات التعليمية الكبيرة"
                },
                feature2: {
                    title: "ميزات مجتمع متقدمة",
                    description: "منتديات طلابية وتعلم تشاركي وأدوات تعاون"
                },
                feature3: {
                    title: "فريق دعم مخصص",
                    description: "دعم أولوية 24/7 مع مدير حساب مخصص"
                },
                feature4: {
                    title: "تكاملات مخصصة",
                    description: "وصول API وتكاملات مخصصة مع الأنظمة الموجودة"
                }
            }
        }
    },
    billing: {
        monthly: "شهري",
        yearly: "سنوي",
        annually: "سنوياً"
    },
    pricing: {
        currency: "جنيه"
    }
} as const satisfies LanguageMessages;
