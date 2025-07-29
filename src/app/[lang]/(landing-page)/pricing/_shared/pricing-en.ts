import { dt, type LanguageMessages } from "@/i18n/lib";

export default {
    pricing: {
        hero: {
            badge: 'Flexible Pricing',
            title: 'Choose the Perfect Plan for Your Academy',
            description: 'Start free and scale as you grow. Our transparent pricing is designed to support academies of all sizes with no hidden fees.',
        },
        plans: {
            free: {
                name: 'Free Plan',
                description: 'Perfect for getting started',
            },
            basic: {
                name: 'Basic Plan',
                description: 'Great for small academies',
            },
            professional: {
                name: 'Professional Plan',
                description: 'Most popular for growing academies',
            },
            enterprise: {
                name: 'Enterprise Plan',
                description: 'For large institutions',
            },
        },
        features: {
            contentlibrary: 'Content Library',
            learningflow: 'Learning Flow',
            liveclasses: 'Live Classes',
            hr: 'HR Management',
            coursestore: 'Course Store',
            crm: 'CRM System',
            smartforms: 'Smart Forms',
            community: 'Community Platform',
            support: 'Support System',
        },
        billing: {
            monthly: 'Monthly',
            yearly: 'Yearly',
            savePercent: 'Save {percent:number}%',
            save: 'Save {amount:number} {currency}',
            title: 'Billing Information',
            description: 'Please provide your billing details to complete the subscription.',
            firstName: 'First Name',
            lastName: 'Last Name',
            email: 'Email Address',
            phone: 'Phone Number',
            address: 'Address',
            street: 'Street Address',
            city: 'City',
            state: 'State/Province',
            postalCode: 'Postal Code',
            cancel: 'Cancel',
            proceedToPayment: 'Proceed to Payment',
        },
        payment: {
            title: 'Complete Your Payment',
            description: 'You will be redirected to our secure payment processor to complete your subscription.',
            secureNotice: 'Your payment is processed securely through Paymob. We do not store your payment information.',
        },
        mostPopular: 'Most Popular',
        free: 'Free',
        currency: 'EGP',
        month: 'month',
        year: 'year',
        unlimited: 'Unlimited',
        status: {
            current: 'Current Plan',
        },
        buttons: {
            getStarted: 'Get Started Free',
            subscribe: 'Subscribe Now',
            changePlan: 'Change Plan',
            current: 'Current Plan',
        },
        enterprise: {
            contact: 'Contact us for custom pricing',
        },
        limits: {
            students: 'Active Students',
            courses: 'Courses',
            storage: 'Storage',
        },
        usage: {
            title: 'Your Current Usage',
            description: 'Monitor your current usage against your plan limits.',
            students: 'Active Students',
            courses: 'Total Courses',
            storage: 'Storage Used',
        },
        success: {
            freeSubscription: 'Welcome to Gateling TMS! Your free account is ready.',
            subscriptionCreated: 'Subscription created successfully!',
            paymentCompleted: 'Payment completed! Welcome to your new plan.',
            planDowngraded: 'Your plan will be downgraded at the end of the current billing period.',
        },
        errors: {
            subscriptionFailed: 'Failed to create subscription. Please try again.',
            paymentIntentFailed: 'Failed to initiate payment. Please try again.',
            paymentConfirmationFailed: 'Payment confirmation failed. Please contact support.',
            planChangeFailed: 'Failed to change plan. Please try again.',
        },
        faq: {
            title: 'Frequently Asked Questions',
            description: 'Find answers to common questions about our pricing and plans.',
            questions: {
                q1: {
                    question: 'Can I change my plan at any time?',
                    answer: 'Yes, you can upgrade or downgrade your plan at any time. Upgrades take effect immediately, while downgrades take effect at the end of your current billing period.',
                },
                q2: {
                    question: 'What payment methods do you accept?',
                    answer: 'We accept all major credit and debit cards, as well as local Egyptian payment methods including Fawry, Vodafone Cash, and bank transfers through our secure payment processor Paymob.',
                },
                q3: {
                    question: 'Is there a free trial for paid plans?',
                    answer: 'Our Free plan serves as an extended trial, allowing you to explore core features with no time limit. You can upgrade to a paid plan whenever you need additional features or capacity.',
                },
                q4: {
                    question: 'What happens if I exceed my plan limits?',
                    answer: 'If you approach your plan limits, we will notify you and suggest upgrading to a higher tier. We provide grace periods to ensure your service is not interrupted.',
                },
                q5: {
                    question: 'Do you offer refunds?',
                    answer: 'We offer a 30-day money-back guarantee for all paid plans. If you are not satisfied with our service, contact us within 30 days for a full refund.',
                },
            },
        },
    },
} as const satisfies LanguageMessages;
