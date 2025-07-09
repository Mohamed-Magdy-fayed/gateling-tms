import { dt, type LanguageMessages } from "@/i18n/lib";

export default {
    verifyEmail: {
        title: "Verify Your Email",
        subtitle: "Complete your account setup",
        description: "We're verifying your email address to secure your account",
        loading: "Verifying your email...",
        loadingDescription: "Please wait while we confirm your email address",
        success: {
            title: "Email Verified Successfully!",
            cta: "Continue to Dashboard",
            securityNote: {
                title: "Your account is now secure",
                description: "Your email has been verified and your account is ready to use"
            }
        },
        error: {
            title: "Verification Failed",
            generic: "Something went wrong during verification",
            noToken: "No verification token found",
            retry: "Try Again",
            backToSignup: "Back to Sign Up",
            troubleshoot: {
                title: "Troubleshooting tips:",
                checkLink: "Make sure you clicked the correct link from your email",
                expiredLink: "The verification link may have expired",
                contactSupport: "Contact support if the problem persists"
            }
        },
        passwordless: {
            title: "Set Up Secure Login",
            description: "Use your fingerprint, face, or security key for faster and more secure access",
            availableMethod: "Available",
            setupButton: "Set Up Biometric Login",
            skipButton: "Continue with Email Only",
            settingUp: "Setting up...",
            setupSuccess: "Biometric login set up successfully!",
            setupError: "Failed to set up biometric login",
            benefits: {
                title: "Why use biometric login?",
                security: "More secure than passwords",
                convenience: "Faster login experience",
                noPasswords: "No passwords to remember"
            },
            unsupported: {
                title: "Biometric login not available",
                description: "Your browser or device doesn't support biometric authentication"
            }
        },
        footer: {
            security: "This link is secure and will expire in 24 hours",
            help: "Need Help?",
            contact: "Contact Support"
        }
    },
    getStartedForm: {
        hero: {
            title: 'Get Started With Our Free Features',
            description: 'Tell us about your business and start working immediately. No obligation, completely free.',
        },
        progress: {
            stepOfTotal: dt('Step {currentStep:number} of {totalSteps:number}', {}),
        },
        cardTitle: dt('Step {currentStep:number}: {stepTitle}', {}),
        stepTitles: {
            businessInfo: 'Business Information',
            features: 'Features & Requirements',
            reviewSubmit: 'Review & Submit',
        },
        step1: {
            contactNameLabel: 'Contact Name',
            contactNamePlaceholder: 'Enter your name',
            businessNameLabel: 'Business Name',
            businessNamePlaceholder: 'Enter your business name',
            emailLabel: 'Email',
            emailPlaceholder: 'Enter your email address',
            phoneLabel: 'Phone',
            phonePlaceholder: 'Enter your phone number',
            currentWebsiteLabel: 'Current Website (optional)',
            currentWebsitePlaceholder: 'https://yourwebsite.com',
            additionalNotesLabel: 'Additional Notes',
            additionalNotesPlaceholder: 'Tell us anything else we should know...',
        },
        step2: {
            featuresQuestion: 'Which features are you interested in?',
        },
        step3: {
            reviewTitle: 'Review Your Information',
            contactInfo: 'Contact Info',
            businessInfo: 'Business Info',
            featuresInfo: 'Selected Features',
            whatHappensNextTitle: 'What Happens Next?',
            nextStep1: 'Start adding your content.',
            nextStep2: 'Add your team members.',
            nextStep3: 'That\'s it! Your system is ready to go.',
        },
        navigation: {
            previous: 'Previous',
            next: 'Next',
            letsGo: 'Let\'s Go',
            preparingYourSystem: 'Preparing Your System...',
        },
        success: {
            thankYouTitle: dt('Thank you {name} for choosing us!', {}),
            confirmationMessage: 'Your system is now ready. You can start using it immediately by verifing your email.',
            whatHappensNextTitle: 'What Happens Next?',
            step1: 'Start adding your content.',
            step2: 'Add your team members.',
            step3: 'That\'s it! Your system is ready to go.',
            step4: 'You can always reach out for support.',
            returnToHomepage: 'Return to Homepage',
            goToDashboard: 'Go to Dashboard',
        },
        premuim: {
            some: "You've selected some premium features.",
            description: "To unlock these features, please check our pricing plans.",
            prices: "See Pricing",
        },
        featureLabels: {
            content_library: "Content Library",
            learning_flow: "Learning Flow",
            live_classes: "Live Classes",
            hr: "HR",
            course_store: "Course Store",
            crm: "CRM",
            smart_forms: "Smart Forms",
            support: "Support",
            community: "Community",
        },
    }
} as const satisfies LanguageMessages