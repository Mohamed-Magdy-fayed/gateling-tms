import type { LanguageMessages } from "@/i18n/lib";

export default {
    hero: {
        trustIndicators: {
            activeAcademies: '50+ Active Academies',
            clientSatisfaction: '98% Client Satisfaction',
            support: '24/7 Support',
        },
        mainHeadline: {
            part1: 'Your gateway to manage your online',
            part2: 'teaching business',
        },
        leadText: 'Data should underlie every business decision you take. we built Gateling TMS with your team in mind, every detail is geared towards your team’s comfort.',
        benefits: {
            benefit1: 'Professional system that streamlines your operations',
            benefit2: 'Customizations tailored to your business goals',
            benefit3: 'Mobile-responsive and lightning fast for maximum efficiency',
            benefit4: 'Ongoing support and updates included',
        },
        cta: {
            getstarted: 'Get Started for Free',
            priceing: 'Pricing',
        },
        socialProof: 'Trusted by businesses across industries',
        liveIndicator: 'Live',
    },
} as const satisfies LanguageMessages