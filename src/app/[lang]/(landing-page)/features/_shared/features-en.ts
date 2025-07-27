import { dt, type LanguageMessages } from "@/i18n/lib";

export default {
    features: {
        hero: {
            title: 'Complete Teaching Management System Features',
            description: 'Discover our comprehensive suite of features designed to transform your academy operations, from free essentials to premium advanced tools.',
            primaryButton: 'Start Free Trial',
            secondaryButton: 'Schedule Demo'
        },
        freeFeatures: {
            title: 'Free Features',
            description: 'Get started with our essential features at no cost. Perfect for small academies and those just beginning their digital transformation.'
        },
        premiumFeatures: {
            title: 'Premium Features',
            description: 'Unlock advanced capabilities to scale your academy operations and enhance your competitive advantage in the education market.'
        },
        badges: {
            free: 'Free',
            premium: 'Premium'
        },
        services: {
            contentLibrary: {
                title: 'Content Library',
                description: 'Centralized digital resource management system for all your educational content and materials.',
                features: {
                    digitalResources: 'Digital Resource Storage',
                    mediaManagement: 'Media File Management',
                    contentOrganization: 'Content Organization',
                    searchFiltering: 'Advanced Search & Filtering'
                }
            },
            learningFlow: {
                title: 'Learning Flow',
                description: 'Structured learning pathways that guide students through their educational journey step by step.',
                features: {
                    courseStructure: 'Course Structure Design',
                    progressTracking: 'Progress Tracking',
                    assessments: 'Built-in Assessments',
                    certificates: 'Certificate Generation'
                }
            },
            liveClasses: {
                title: 'Live Classes',
                description: 'Conduct interactive live classes with HD video streaming and real-time collaboration tools.',
                features: {
                    hdVideoStreaming: 'HD Video Streaming',
                    interactiveWhiteboard: 'Interactive Whiteboard',
                    recordingCapabilities: 'Class Recording',
                    screenSharing: 'Screen Sharing'
                }
            },
            hr: {
                title: 'HR Management',
                description: 'Comprehensive human resources management system for staff administration and performance tracking.',
                features: {
                    staffManagement: 'Staff Management',
                    payrollIntegration: 'Payroll Integration',
                    performanceTracking: 'Performance Tracking',
                    attendanceMonitoring: 'Attendance Monitoring'
                }
            },
            courseStore: {
                title: 'Course Store',
                description: 'Built-in marketplace to sell your courses online with integrated payment processing and analytics.',
                features: {
                    onlineMarketplace: 'Online Course Marketplace',
                    paymentProcessing: 'Payment Processing',
                    coursePackaging: 'Course Packaging & Pricing',
                    salesAnalytics: 'Sales Analytics'
                }
            },
            crm: {
                title: 'CRM System',
                description: 'Customer relationship management system to track leads, manage student relationships, and boost enrollment.',
                features: {
                    leadManagement: 'Lead Management',
                    studentProfiles: 'Detailed Student Profiles',
                    communicationHistory: 'Communication History',
                    enrollmentTracking: 'Enrollment Tracking'
                }
            },
            smartForms: {
                title: 'Smart Forms',
                description: 'Intelligent form builder with automated workflows for admissions, surveys, and data collection.',
                features: {
                    customForms: 'Custom Form Builder',
                    dataCollection: 'Automated Data Collection',
                    automatedWorkflows: 'Workflow Automation',
                    integrationCapabilities: 'System Integration'
                }
            },
            community: {
                title: 'Community Platform',
                description: 'Social learning platform that connects students, teachers, and parents in an engaging community environment.',
                features: {
                    discussionForums: 'Discussion Forums',
                    studentGroups: 'Student Groups',
                    socialLearning: 'Social Learning Features',
                    peerInteraction: 'Peer-to-Peer Interaction'
                }
            },
            support: {
                title: 'Support System',
                description: 'Comprehensive support system with ticketing, live chat, and knowledge base for seamless user assistance.',
                features: {
                    ticketingSystem: 'Ticketing System',
                    liveChat: 'Live Chat Support',
                    knowledgeBase: 'Knowledge Base',
                    prioritySupport: 'Priority Support'
                }
            }
        },
        process: {
            title: 'Our Implementation Process',
            description: 'We follow a proven process to ensure smooth implementation and successful adoption of our TMS platform.',
            setup: {
                title: 'Initial Setup & Configuration',
                description: 'We configure your TMS platform according to your academy\'s specific requirements and structure.'
            },
            configuration: {
                title: 'Customization & Integration',
                description: 'Customize the platform to match your branding and integrate with your existing systems.'
            },
            training: {
                title: 'Training & Onboarding',
                description: 'Comprehensive training for your staff and students to ensure smooth adoption of the platform.'
            },
            support: {
                title: 'Ongoing Support & Maintenance',
                description: 'Continuous support, updates, and maintenance to keep your platform running smoothly.'
            }
        },
        cta: {
            title: 'Ready to Transform Your Academy?',
            description: 'Start with our free features today and upgrade to premium when you\'re ready to scale your operations.',
            primaryButton: 'Get Started Free',
            secondaryButton: 'Watch Demo'
        }
    }
} as const satisfies LanguageMessages;
