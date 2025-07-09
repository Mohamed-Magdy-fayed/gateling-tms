import type { LanguageMessages } from "@/i18n/lib";

export default {
    hero: {
        trustIndicators: {
            activeAcademies: '50+ اكاديمية بتعتمد علينا',
            clientSatisfaction: '98% رضا العملاء',
            support: 'دعم 24/7',
        },
        mainHeadline: {
            part1: 'بوابتك لإدارة',
            part2: 'نشاطك التعليمي أونلاين',
        },
        leadText: 'البيانات لازم تكون أساس كل قرار بتاخده في شغلك. عملنا Gateling TMS علشان فريقك، وكل تفصيلة فيه معمولة لراحة فريقك.',
        benefits: {
            benefit1: 'نظام احترافي ينظم شغلك ويوفر وقتك',
            benefit2: 'تعديلات تناسب أهداف شغلك',
            benefit3: 'يشتغل على الموبايل وسريع جدًا لأقصى كفاءة',
            benefit4: 'دعم وتحديثات مستمرة',
        },
        cta: {
            getstarted: 'ابدأ مجانًا',
            priceing: 'الأسعار',
        },
        socialProof: 'موثوق من شركات في مجالات مختلفة',
        liveIndicator: 'مباشر',
    },
} as const satisfies LanguageMessages