import { dt, type LanguageMessages } from "@/i18n/lib";

export default {
    auth: {
        signin: {
            title: "Sign in",
            subtitle: "Sign in to continue",
            button: "Sign in with Passkey",
            loading: "Signing in...",
            noAccount: "Don't have an account?",
            signup: "Sign up"
        },
        email: "Email",
        placeholder: "you@example.com",
        backToHome: 'Back to home',
        emailPlaceholder: 'name@example.com',
        orContinueWith: 'Or continue with',
        signIn: {
            title: 'Sign In',
            description: 'Enter your email below to sign in to your account',
            withEmail: 'Sign In with Email',
            withGitHub: 'Sign In with GitHub',
            noAccount: 'Don\'t have an account? Sign Up',
        },
        error: {
            title: 'Authentication Error',
            description: 'An error occurred during authentication. Please try again.',
            tryAgain: 'Please try again.',
            signInAgain: 'Sign In Again',
        },
    },
    site: {
        termsPrefix: "By clicking continue, you agree to our",
        terms: "Terms of Service",
        and: "and",
        privacy: "Privacy Policy"
    }
} as const satisfies LanguageMessages