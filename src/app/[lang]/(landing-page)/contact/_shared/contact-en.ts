import { dt, type LanguageMessages } from "@/i18n/lib";

export default {
    contact: {
        hero: {
            badge: 'Get in Touch',
            title: 'We’re Here to Help You Succeed',
            description: 'Whether you have a question about features, pricing, need support, or want to explore partnership opportunities, our team is ready to assist you.',
            responseTime: 'Average response time: 24 hours',
            availability: 'Available Monday - Friday, 9 AM - 5 PM (GMT+2)'
        },
        methods: {
            title: 'Choose Your Preferred Contact Method',
            description: 'We offer multiple ways to connect with our team. Select the option that best suits your needs.',
            email: {
                title: 'Email Us',
                description: 'Send us an email with your inquiries and we will get back to you shortly.',
                action: 'Send Email'
            },
            phone: {
                title: 'Call Us',
                description: 'Speak directly with our support team for immediate assistance.',
                action: 'Call Now'
            },
            chat: {
                title: 'Live Chat',
                description: 'Chat with a support agent in real-time for quick answers to your questions.',
                value: 'Available during business hours',
                action: 'Start Chat'
            },
            meeting: {
                title: 'Schedule a Meeting',
                description: 'Book a personalized demo or a consultation with our experts.',
                value: 'Book a time that suits you',
                action: 'Book Now'
            }
        },
        form: {
            title: 'Send Us a Message',
            description: 'Fill out the form below and we will get back to you as soon as possible.',
            fields: {
                name: {
                    label: 'Full Name',
                    placeholder: 'Enter your full name'
                },
                email: {
                    label: 'Email Address',
                    placeholder: 'Enter your email address'
                },
                company: {
                    label: 'Company Name (Optional)',
                    placeholder: 'Your company or academy name'
                },
                phone: {
                    label: 'Phone Number (Optional)',
                    placeholder: 'Your phone number'
                },
                reason: {
                    label: 'Reason for Contact',
                    placeholder: 'Select a reason',
                    options: {
                        demo: 'Request a Demo',
                        pricing: 'Inquire about Pricing',
                        support: 'Technical Support',
                        partnership: 'Partnership Opportunity',
                        other: 'Other'
                    }
                },
                subject: {
                    label: 'Subject',
                    placeholder: 'Enter the subject of your message'
                },
                message: {
                    label: 'Your Message',
                    placeholder: 'Type your message here...'
                }
            },
            submit: 'Send Message'
        },
        info: {
            title: 'Our Contact Information',
            description: 'Find us here or reach out through our official channels.',
            location: {
                title: 'Our Location',
                value: 'Remote Team • Serving Clients Worldwide'
            },
            hours: {
                title: 'Business Hours',
                value: 'Mon - Fri: 9 AM - 5 PM (GMT+2)'
            },
            languages: {
                title: 'Languages',
                value: 'English, Arabic'
            }
        },
        quickActions: {
            title: 'Quick Actions',
            demo: {
                title: 'Request a Demo',
                description: 'See Gateling TMS in action with a personalized walkthrough.',
                badge: 'Free'
            },
            trial: {
                title: 'Start Free Trial',
                description: 'Experience the full power of Gateling TMS with a no-obligation trial.',
                badge: '14 Days'
            },
            support: {
                title: 'Get Support',
                description: 'Find answers to your questions or get technical assistance.',
                badge: 'Help'
            }
        },
        faq: {
            title: 'Frequently Asked Questions',
            description: 'Find quick answers to common questions about contacting us and our services.',
            questions: {
                q1: {
                    question: 'What is the best way to get a quick response?',
                    answer: 'For the fastest response, we recommend using our live chat feature during business hours or calling us directly. Emails are typically answered within 24 hours.'
                },
                q2: {
                    question: 'Can I get a personalized demo of the system?',
                    answer: 'Absolutely! You can schedule a personalized demo through our \'Schedule a Meeting\' option above. Our team will walk you through all the features relevant to your needs.'
                },
                q3: {
                    question: 'Do you offer technical support for existing customers?',
                    answer: 'Yes, we provide comprehensive technical support for all our customers. You can reach our support team via email, phone, or through the dedicated support portal.'
                },
                q4: {
                    question: 'Where can I find more information about your pricing?',
                    answer: 'Detailed pricing information is available on our Pricing page. If you have specific questions or need a custom quote, please select \'Inquire about Pricing\' in the contact form.'
                }
            }
        }
    }
} as const satisfies LanguageMessages;
