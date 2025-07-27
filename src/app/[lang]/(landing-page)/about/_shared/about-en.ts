import { dt, type LanguageMessages } from "@/i18n/lib";

export default {
    about: {
        hero: {
            title: 'Empowering Online Academies with Comprehensive Teaching Management Solutions',
            description: 'Founded in 2019, Gateling TMS is dedicated to transforming education by providing cutting-edge tools that streamline operations for online and offline academies, helping them reduce costs and solidify their operational cycles.'
        },
        stats: {
            institutions: {
                label: 'Institutions',
                value: '12+'
            },
            activeStudents: {
                label: 'Active Students',
                value: '4000+'
            },
            coursesManaged: {
                label: 'Courses Managed',
                value: '80+'
            },
            countriesServed: {
                label: 'Countries Served',
                value: '2+'
            },
            yearsInBusiness: {
                label: 'Years in Business',
                value: '5+'
            }
        },
        story: {
            title: 'Our Story',
            description: 'Gateling TMS was born from a deep understanding of the challenges faced by online academies. We started this project with the goal of easing the administrative burden on educators, helping them reduce employment costs, and solidifying their operational cycles, allowing them to focus on delivering quality education.'
        },
        mission: {
            title: 'Our Mission',
            description: 'To empower online and offline academies with intuitive, comprehensive teaching management solutions that simplify operations, reduce costs, and enhance the learning experience for students worldwide.'
        },
        vision: {
            title: 'Our Vision',
            description: 'To be the leading global platform for teaching management, fostering a connected and efficient educational ecosystem where academies can thrive and students can achieve their full potential.'
        },
        whyChooseUs: {
            title: 'Why Choose Gateling TMS?',
            exceptionalSupport: 'Exceptional Support: Dedicated assistance to ensure your success',
            scalableSolutions: 'Scalable Solutions: Grow with your academy, from small setups to large institutions',
            userCentricInterface: 'User-Centric Interface: Intuitive design for seamless adoption and efficient use',
            comprehensiveToolset: 'Comprehensive Toolset: A wide range of tools to help you operate better',
            costReduction: 'Cost Reduction: Streamline operations to significantly reduce employment costs'
        },
        values: {
            title: 'Our Values',
            description: 'These core values guide everything we do and shape how we work with our clients.',
            innovation: {
                title: 'Innovation',
                description: 'Continuously evolving our platform with the latest technology to provide cutting-edge solutions that meet the dynamic needs of modern education.'
            },
            studentSuccess: {
                title: 'Student Success',
                description: 'Committed to creating tools that directly contribute to a more engaging and effective learning environment, ultimately fostering student achievement.'
            },
            operationalExcellence: {
                title: 'Operational Excellence',
                description: 'Dedicated to providing robust and reliable systems that optimize academy workflows, ensuring efficiency, cost-effectiveness, and seamless management.'
            },
            partnership: {
                title: 'Partnership',
                description: 'Building strong, collaborative relationships with academies, understanding their unique challenges, and growing together through mutual support and shared goals.'
            },
            integrity: {
                title: 'Integrity',
                description: 'Operating with transparency, honesty, and ethical practices in all our interactions, building trust with our users and partners.'
            }
        },
        founder: {
            title: 'Meet the Founder',
            description: 'Learn about the vision and expertise behind Gateling TMS.',
            name: 'Mohamed Magdy',
            role: 'CEO & Founder',
            bio: 'As the visionary behind Gateling TMS, Mohamed Magdy founded the company with a passion for transforming online education. His deep understanding of the challenges faced by educational institutions drives the innovation and user-centric approach that defines our platform.',
            journey: {
                title: 'The Journey',
                description: 'Starting from recognizing the operational challenges in educational institutions, Mohamed has dedicated years to developing solutions that truly make a difference. His commitment to excellence and continuous improvement ensures that Gateling TMS remains at the forefront of educational technology.'
            }
        },
        cta: {
            title: 'Ready to Revolutionize Your Academy?',
            description: 'Discover how Gateling TMS can streamline your operations, reduce costs, and elevate the learning experience for your students. Join the growing number of academies thriving with our comprehensive solution.',
            primaryButton: 'Request a Demo',
            secondaryButton: 'Get Started Free'
        }
    }
} as const satisfies LanguageMessages;
