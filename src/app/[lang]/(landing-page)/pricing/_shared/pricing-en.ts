import { dt, type LanguageMessages } from "@/i18n/lib";

export default {
    pricing: {
        hero: {
            title: 'Choose the Perfect Plan for Your Academy',
            description: 'Start with our free tier and scale up as your academy grows. All plans include our core features with additional premium capabilities.',
            monthlyBilling: 'Monthly Billing',
            monthly: 'Monthly',
            yearly: 'Yearly',
            save20: 'Save 20%'
        },
        badges: {
            popular: 'Most Popular',
            enterprise: 'Enterprise'
        },
        tiers: {
            free: {
                name: 'Free',
                description: 'Perfect for individuals or small academies just starting their online teaching journey.',
                price: '$0',
                period: '/month',
                cta: 'Get Started Free'
            },
            basic: {
                name: 'Basic',
                description: 'Ideal for growing academies needing robust management tools and premium features.',
                price: '$29',
                period: '/month',
                cta: 'Start Basic Plan'
            },
            professional: {
                name: 'Professional',
                description: 'Perfect for established academies looking to optimize operations and student engagement.',
                price: '$79',
                period: '/month',
                cta: 'Start Professional'
            },
            enterprise: {
                name: 'Enterprise',
                description: 'The ultimate solution for large institutions requiring advanced features and dedicated support.',
                price: '$199',
                period: '/month',
                cta: 'Contact Sales'
            }
        },
        features: {
            contentLibrary: {
                name: 'Content Library',
                description: 'Centralized digital resource management for all your educational materials'
            },
            learningFlow: {
                name: 'Learning Flow',
                description: 'Structured learning pathways that guide students through their journey'
            },
            liveClasses: {
                name: 'Live Classes',
                description: 'Interactive live sessions with HD video streaming and collaboration tools'
            },
            hr: {
                name: 'HR Management',
                description: 'Comprehensive staff administration, payroll integration, and performance tracking'
            },
            courseStore: {
                name: 'Course Store',
                description: 'Built-in marketplace to sell courses online with payment processing'
            },
            crm: {
                name: 'CRM System',
                description: 'Customer relationship management to track leads and boost enrollment'
            },
            smartForms: {
                name: 'Smart Forms',
                description: 'Intelligent form builder with automated workflows and data collection'
            },
            community: {
                name: 'Community Platform',
                description: 'Social learning environment connecting students, teachers, and parents'
            },
            support: {
                name: 'Support System',
                description: 'Comprehensive help desk with ticketing, live chat, and priority support'
            }
        },
        faq: {
            title: 'Frequently Asked Questions',
            description: 'Everything you need to know about our pricing and features.',
            questions: {
                q1: {
                    question: 'Can I upgrade or downgrade my plan at any time?',
                    answer: 'Yes, you can upgrade or downgrade your plan at any time. Changes will be reflected in your next billing cycle, and we\'ll prorate any differences.'
                },
                q2: {
                    question: 'Is there a free trial for paid plans?',
                    answer: 'Yes, all paid plans come with a 14-day free trial. You can explore all features without any commitment. No credit card required for the trial.'
                },
                q3: {
                    question: 'What payment methods do you accept?',
                    answer: 'We accept all major credit cards (Visa, MasterCard, American Express), PayPal, and bank transfers for Enterprise plans. All payments are processed securely.'
                },
                q4: {
                    question: 'Do you offer discounts for educational institutions?',
                    answer: 'Yes, we offer special pricing for educational institutions, non-profits, and bulk purchases. Contact our sales team to discuss custom pricing options.'
                },
                q5: {
                    question: 'What happens to my data if I cancel my subscription?',
                    answer: 'Your data remains accessible for 30 days after cancellation. You can export all your data during this period. After 30 days, data is permanently deleted for security.'
                }
            }
        },
        cta: {
            title: 'Ready to Transform Your Academy?',
            description: 'Join thousands of academies worldwide that have already transformed their operations with our comprehensive TMS platform.',
            primaryButton: 'Start Free Today',
            secondaryButton: 'Talk to Sales'
        }
    }
} as const satisfies LanguageMessages;
