import type { LanguageMessages } from "@/i18n/lib";

export default {
    subscriptionEmails: {
        confirmation: {
            subject: "Welcome to Gateling TMS! Your subscription is confirmed",
            welcome: "Welcome to Gateling TMS!",
            dearuser: "Dear {userName},",
            thankyoumessage: "Thank you for subscribing to Gateling TMS! Your payment has been processed successfully, and your account is now active with full access to all features.",
            subscriptiondetails: "Subscription Details",
            plan: "Plan",
            billingcycle: "Billing Cycle",
            amount: "Amount",
            transactionid: "Transaction ID",
            subscriptionid: "Subscription ID",
            whatsnext: "What's Next?",
            step1: "Access your dashboard to start setting up your academy",
            step2: "Upload your first course content and invite students",
            step3: "Explore advanced features to maximize your teaching potential",
            accessdashboard: "Access Your Dashboard",
            featuresunlocked: "Features Now Available",
            supportmessage: "If you have any questions or need assistance getting started, our support team is here to help.",
            billingquestions: "For billing questions or account management, visit your dashboard or contact our support team."
        },
        paymentFailed: {
            subject: "Payment Failed - Action Required for Your Gateling TMS Subscription",
            alerttitle: "Payment Failed",
            alertmessage: "We were unable to process your payment",
            dearuser: "Dear {userName},",
            paymentissuemessage: "We encountered an issue while processing your payment for your Gateling TMS subscription. Don't worry - your account is still active for now, and we're here to help resolve this quickly.",
            attemptedpayment: "Attempted Payment Details",
            plan: "Plan",
            billingcycle: "Billing Cycle",
            amount: "Amount",
            reason: "Failure Reason",
            whattodo: "What to Do Next",
            step1title: "Update Your Payment Method",
            step1description: "Check if your card has expired or if there are insufficient funds",
            step2title: "Retry the Payment",
            step2description: "Use the button below to attempt the payment again",
            step3title: "Contact Support if Needed",
            step3description: "Our team is ready to help if you continue experiencing issues",
            retrypayment: "Retry Payment Now",
            contactsupport: "Contact Support",
            commonissues: "Common Payment Issues",
            issue1: "Expired or invalid credit card information",
            issue2: "Insufficient funds in your account",
            issue3: "Bank security restrictions on online payments",
            issue4: "Incorrect billing address information",
            urgencytitle: "Important Notice",
            urgencymessage: "To maintain uninterrupted access to your Gateling TMS features, please resolve this payment issue within 7 days.",
            supportmessage: "We understand payment issues can be frustrating. Our support team is available 24/7 to assist you.",
            teamsignature: "Best regards,\nThe Gateling TMS Team"
        },
        planUpgraded: {
            subject: "Congratulations! Your Gateling TMS plan has been upgraded",
            celebrationtitle: "Plan Successfully Upgraded!",
            celebrationmessage: "You now have access to more powerful features",
            dearuser: "Dear {userName},",
            upgrademessage: "Congratulations! You've successfully upgraded from {previousPlan} to {newPlan}. Your enhanced features are now available.",
            upgradedetails: "Upgrade Details",
            previousplan: "Previous Plan",
            newplan: "New Plan",
            billingcycle: "Billing Cycle",
            newprice: "New Price",
            effectivedate: "Effective Date",
            immediateaccess: "Immediate Access ✨",
            newfeatures: "New Features Unlocked",
            gettingstarted: "Getting Started with Your New Features",
            step1: "Explore your expanded feature set in the dashboard",
            step2: "Take advantage of increased limits and capabilities",
            step3: "Check out our feature guides for tips and best practices",
            accessdashboard: "Access Your Dashboard",
            explorefeatures: "Explore New Features",
            increasedlimits: "Your New Limits",
            studentslimit: "Students",
            courseslimit: "Courses",
            storagelimit: "Storage",
            was: "was",
            supportmessage: "Need help getting started with your new features? Our support team is here to guide you.",
            teamsignature: "Congratulations again on your upgrade!\nThe Gateling TMS Team"
        },
        planDowngraded: {
            subject: "Your Gateling TMS plan has been changed",
            noticetitle: "Plan Change Confirmation",
            noticemessage: "Your subscription has been updated",
            dearuser: "Dear {userName},",
            downgrademessage: "Your plan has been changed from {previousPlan} to {newPlan}. This change will take effect at the end of your current billing period.",
            downgradedetails: "Plan Change Details",
            currentplan: "Current Plan (until end of period)",
            newplan: "New Plan (starting next period)",
            billingcycle: "Billing Cycle",
            effectivedate: "Effective Date",
            whatchanges: "What's Changing",
            featureslosing: "Features You'll Lose Access To:",
            featureskeeping: "Features You'll Continue to Have:",
            newlimits: "Your New Limits",
            studentslimit: "Students",
            courseslimit: "Courses",
            storagelimit: "Storage",
            was: "was",
            importantnotice: "Important Notice",
            dataretentionmessage: "Your existing data will be preserved, but some features may become read-only.",
            backupreminder: "Consider backing up any data you want to keep accessible",
            accesstimeline: "You have until the effective date to use premium features",
            upgradeagain: "Upgrade Your Plan",
            manageaccount: "Manage Account",
            whyupgrade: "Why Consider Upgrading Again?",
            benefit1: "Unlock advanced features to grow your academy faster",
            benefit2: "Get higher limits to accommodate more students",
            benefit3: "Access premium support and priority assistance",
            supportmessage: "If you have questions about your plan change or need assistance, we're here to help.",
            teamsignature: "Best regards,\nThe Gateling TMS Team"
        },
        cancelled: {
            subject: "Your Gateling TMS subscription has been cancelled",
            noticetitle: "Subscription Cancelled",
            immediatenotice: "Your subscription has been cancelled immediately",
            endperiodnotice: "Your subscription will end at the current billing period",
            dearuser: "Dear {userName},",
            cancellationmessage: "We're sorry to see you go! Your {plan} subscription has been cancelled as requested.",
            cancellationdetails: "Cancellation Details",
            cancelledplan: "Cancelled Plan",
            billingcycle: "Billing Cycle",
            cancellationdate: "Cancellation Date",
            accessuntil: "Access Until",
            immediate: "Immediate",
            whathappensnext: "What Happens Next",
            step1immediate: "Your access has been suspended immediately",
            step1periodend: "You'll continue to have access until your billing period ends",
            step1immediatedesc: "All premium features are no longer available",
            step1periodenddesc: "Full access continues until {date}",
            step2title: "Your Data is Safe",
            step2desc: "All your content and student data will be preserved for 90 days",
            step3title: "Reactivation is Easy",
            step3desc: "You can reactivate your subscription anytime to restore full access",
            backupremindertitle: "Don't Forget to Backup",
            backupremindermessage: "Before your access ends, consider downloading:",
            backupitem1: "Course materials and student progress reports",
            backupitem2: "Student contact information and enrollment data",
            backupitem3: "Any custom content or assessments you've created",
            comebacktitle: "We'd Love to Have You Back",
            comebackmessage: "If you change your mind, reactivating your subscription is quick and easy:",
            benefit1: "All your data will be restored exactly as you left it",
            benefit2: "No setup required - pick up right where you left off",
            benefit3: "Same great features with any improvements we've made",
            reactivatesubscription: "Reactivate Subscription",
            subscribeagain: "Subscribe Again",
            browseplans: "Browse Plans",
            sharefeedback: "Share Feedback",
            feedbacktitle: "Help Us Improve",
            feedbackmessage: "We'd love to hear about your experience and how we can improve Gateling TMS.",
            feedbackquestions: "What could we have done better? What features were you missing?",
            finalmessage: "Thank you for being part of the Gateling TMS community. We hope to serve you again in the future.",
            teamsignature: "Best wishes,\nThe Gateling TMS Team"
        },
        trialEnding: {
            subject: "Your Gateling TMS trial ends in {days:number} days",
            urgencytitle: "Trial Ending in {days:number} Days",
            urgentmessage: "Don't lose access to your academy!",
            remindermessage: "Time to secure your subscription",
            dearuser: "Dear {userName},",
            trialendingmessage: "Your {plan} trial will end in {days:number} days. To continue using Gateling TMS without interruption, please choose a subscription plan.",
            trialdetails: "Trial Information",
            currentplan: "Current Plan",
            trial: "Trial",
            daysremaining: "Days Remaining",
            trialends: "Trial Ends On",
            yourprogress: "Look What You've Accomplished!",
            progressmessage: "During your trial, you've made great progress building your online academy:",
            studentscreated: "15+",
            students: "Students Added",
            coursescreated: "3",
            courses: "Courses Created",
            hourssaved: "20+",
            timesaved: "Hours Saved",
            aftertrial: "What Happens After Your Trial Ends",
            loseaccesstitle: "You'll Lose Access to Premium Features",
            loseaccessdesc: "Advanced course management, analytics, and student communication tools",
            limitedaccesstitle: "Limited Free Access",
            limitedaccessdesc: "You'll be moved to our basic free plan with restricted features",
            datasafetitle: "Your Data Stays Safe",
            datasafedesc: "All your courses and student information will be preserved",
            continuejourney: "Continue Your Journey",
            monthlyplan: "Monthly Plan",
            yearlyplan: "Annual Plan",
            permonth: "per month",
            bestvalue: "Best Value",
            saveannually: "Save 17% annually",
            continuesubscription: "Continue with Subscription",
            viewdashboard: "View Dashboard",
            testimonialtext: "Gateling TMS transformed how I manage my online courses. The time I save on administration lets me focus on what I love - teaching!",
            testimonialauthor: "Sarah Ahmed",
            testimonialtitle: "Online Course Creator",
            supportmessage: "Have questions about choosing the right plan? Our team is here to help you make the best decision for your academy.",
            teamsignature: "Rooting for your success,\nThe Gateling TMS Team"
        },
        pastDue: {
            subject: "Urgent: Payment Required for Your Gateling TMS Account",
            urgenttitle: "Payment Past Due",
            urgentmessage: "Immediate action required to maintain access",
            overduemessage: "Your payment is overdue - please update now",
            dearuser: "Dear {userName},",
            paymentoverduemessage: "Your payment for {plan} is now {days:number} days overdue. To maintain access to your Gateling TMS features, please update your payment information immediately.",
            overduepayment: "Overdue Payment Details",
            subscriptionplan: "Subscription Plan",
            billingcycle: "Billing Cycle",
            amountdue: "Amount Due",
            originalduedate: "Original Due Date",
            daysoverdue: "Days Overdue",
            days: "days",
            immediateaction: "Immediate Action Required",
            step1title: "Update Payment Method",
            step1description: "Add a new card or update your existing payment information",
            step2title: "Process Payment",
            step2description: "Complete the overdue payment to restore full access",
            step3title: "Verify Account Status",
            step3description: "Confirm your subscription is active and all features are restored",
            consequencestitle: "What Happens If Payment Isn't Made",
            consequencesintro: "To avoid service interruption, please resolve this payment issue promptly:",
            consequence1: "Limited access to premium features after 7 days",
            consequence2: "Complete service suspension after 14 days",
            consequence3: "Account data retention for 30 days before deletion",
            urgentconsequence: "Account suspension is imminent - immediate action required",
            updatepaymentmethod: "Update Payment Method",
            contactsupport: "Contact Support",
            commonissues: "Common Payment Issues & Solutions",
            issuesintro: "Here are the most common reasons payments fail and how to fix them:",
            issue1title: "Expired Card",
            issue1desc: "Update your card expiration date or add a new payment method",
            issue2title: "Insufficient Funds",
            issue2desc: "Ensure your account has sufficient balance or use a different card",
            issue3title: "Changed Email/Address",
            issue3desc: "Update your billing information to match your bank records",
            issue4title: "Bank Security Block",
            issue4desc: "Contact your bank to authorize payments to Gateling TMS",
            currentstatus: "Current Account Status",
            accountaccess: "Account Access",
            suspended: "Suspended",
            limited: "Limited",
            datasafety: "Data Safety",
            datasecure: "Secure & Backed Up",
            helptitle: "We're Here to Help",
            helpmessage: "Having trouble with your payment? Our support team is available to assist you:",
            contactphone: "Phone support available 9 AM - 6 PM EET",
            contactchat: "Live chat available 24/7 in your dashboard",
            contactemail: "Email support with response within 2 hours",
            supportmessage: "We understand payment issues happen. Our priority is helping you resolve this quickly so you can get back to teaching.",
            teamsignature: "Here to help,\nThe Gateling TMS Team"
        }
    },
    plans: {
        free: {
            name: "Free Plan",
            limits: {
                students: "50 students",
                courses: "5 courses",
                storage: "1 GB"
            },
            features: {
                feature1: {
                    title: "Content Library",
                    description: "Access and manage a library of educational content."
                },
                feature2: {
                    title: "Learning Flow",
                    description: "Personalized learning paths for students."
                },
                feature3: {
                    title: "Live Classes",
                    description: "Host and manage live online classes."
                }
            }
        },
        basic: {
            name: "Basic Plan",
            pricing: {
                monthly: "299",
                yearly: "2988"
            },
            limits: {
                students: "200 students",
                courses: "25 courses",
                storage: "10 GB"
            },
            features: {
                feature1: {
                    title: "Advanced Course Management",
                    description: "Create unlimited lessons with rich media content"
                },
                feature2: {
                    title: "Student Progress Tracking",
                    description: "Monitor individual student performance and engagement"
                },
                feature3: {
                    title: "Live Classes",
                    description: "Host and manage live online classes."
                },
                feature4: {
                    title: "Email & SMS Notifications",
                    description: "Automated communication with students and parents"
                }
            },
            exclusivefeatures: {
                feature1: "HR Management System",
                feature2: "Course Store & Marketplace",
                feature3: "Advanced Reporting"
            }
        },
        professional: {
            name: "Professional Plan",
            pricing: {
                monthly: "799",
                yearly: "7990"
            },
            limits: {
                students: "1000 students",
                courses: "100 courses",
                storage: "50 GB"
            },
            features: {
                feature1: {
                    title: "Complete Learning Management",
                    description: "Full-featured LMS with advanced course creation tools"
                },
                feature2: {
                    title: "Advanced Analytics & Reporting",
                    description: "Comprehensive insights into student performance and engagement"
                },
                feature3: {
                    title: "CRM Integration",
                    description: "Manage leads, enrollments, and student relationships"
                },
                feature4: {
                    title: "Smart Forms & Automation",
                    description: "Automated workflows for enrollment and communication"
                }
            },
            exclusivefeatures: {
                feature1: "Community Platform",
                feature2: "Priority Support System",
                feature3: "White-label Options"
            }
        },
        enterprise: {
            name: "Enterprise Plan",
            pricing: {
                monthly: "1999",
                yearly: "19990"
            },
            limits: {
                students: "Unlimited",
                courses: "Unlimited",
                storage: "500 GB"
            },
            features: {
                feature1: {
                    title: "Enterprise-Grade Platform",
                    description: "Scalable infrastructure for large educational institutions"
                },
                feature2: {
                    title: "Advanced Community Features",
                    description: "Student forums, peer learning, and collaboration tools"
                },
                feature3: {
                    title: "Live Classes",
                    description: "Host and manage live online classes."
                },
                feature4: {
                    title: "Custom Integrations",
                    description: "API access and custom integrations with existing systems"
                }
            }
        }
    },
    billing: {
        monthly: "Monthly",
        yearly: "Annual",
        annually: "Annually"
    },
    pricing: {
        currency: "EGP"
    }
} as const satisfies LanguageMessages;
