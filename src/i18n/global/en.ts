import landingEn from "@/featurs/landing-page/landing-en"
import { dt, type LanguageMessages } from "../lib"
import getStartedEn from "@/featurs/get-started/get-started-en"
import { emailsEn } from "@/services/resend/data/emails-en"

export default {
  locale: "en",
  greetings: "Hello {name}! Your last login was {lastLoginDate:date}.",
  inboxMessages: dt("Hello {name}, you have {messages:plural}.", {
    plural: { messages: { one: "1 message", other: "{?} messages" } },
  }),
  hobby: dt("You chose {hobby:enum} as your hobby.", {
    enum: { hobby: { runner: "runner", developer: "developer" } },
  }),
  nested: {
    greetings: "Hello",
  },
  missingES: "This is a missing translation in es-ES",
  languageToggle: 'Switch language',
  themeToggle: 'Toggle theme',
  getStarted: 'Get Started for Free',
  premium: 'Premium',
  error: dt('An error occurred {error}. Please try again later.', {}),
  errors: {
    emailExists: 'Email already exists!',
  },
  header: {
    navigation: {
      home: 'Home',
      services: 'Services',
      portfolio: 'Portfolio',
      templates: 'Templates',
      about: 'About',
      contact: 'Contact',
    },
    themeToggle: 'Toggle theme',
    languageToggle: 'Switch language',
    ctaButton: 'Get Started',
    mobileMenuToggle: 'Toggle menu',
  },
  footer: {
    companyInfo: {
      description: 'Professional website development services that help businesses grow online. From concept to launch, we create websites that convert visitors into customers.',
      location: 'Remote Team • Serving Clients Worldwide',
    },
    navigation: {
      services: {
        title: 'Services',
        websiteDevelopment: 'Development',
        websiteDesign: 'Website Design',
        ecommerceSolutions: 'E-commerce Solutions',
        seoOptimization: 'SEO Optimization',
        websiteMaintenance: 'Website Maintenance',
      },
      company: {
        title: 'Company',
        aboutUs: 'About Us',
        ourProcess: 'Our Process',
        portfolio: 'Portfolio',
        testimonials: 'Testimonials',
        blog: 'Blog',
      },
      resources: {
        title: 'Resources',
        templates: 'Templates',
        pricing: 'Pricing',
        faq: 'FAQ',
        support: 'Support',
        contact: 'Contact',
      },
      legal: {
        title: 'Legal',
        privacyPolicy: 'Privacy Policy',
        termsOfService: 'Terms of Service',
        cookiePolicy: 'Cookie Policy',
        refundPolicy: 'Refund Policy',
      },
    },
    newsletter: {
      title: 'Stay Updated',
      description: 'Get tips and insights delivered to your inbox',
      placeholder: 'Enter email',
      subscribeButton: 'Subscribe',
    },
    copyright: dt('© {year:date} {appName}. All rights reserved.', { date: { year: { year: "numeric" } } }),
  },
  ...landingEn,
  ...getStartedEn,
  ...emailsEn,
} as const satisfies LanguageMessages
