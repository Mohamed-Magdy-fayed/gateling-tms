// React hook for WebAuthn functionality
import { useState, useEffect, useCallback } from 'react';
import { webAuthnClient } from '@/featurs/webauthn/client';
import { api } from '@/trpc/react';
import { toast } from 'sonner';

export interface WebAuthnInfo {
    isSupported: boolean;
    isPlatformAvailable: boolean;
    supportedAuthenticators: string[];
}

export interface UseWebAuthnOptions {
    userId?: string;
    userName?: string;
    userDisplayName?: string;
}

export function useWebAuthn(options: UseWebAuthnOptions = {}) {
    const [webAuthnInfo, setWebAuthnInfo] = useState<WebAuthnInfo>({
        isSupported: false,
        isPlatformAvailable: false,
        supportedAuthenticators: [],
    });
    const [isRegistering, setIsRegistering] = useState(false);
    const [isAuthenticating, setIsAuthenticating] = useState(false);

    // tRPC mutations
    const getRegistrationOptions = api.webAuthnRouter.getRegistrationOptions.useMutation();
    const verifyRegistration = api.webAuthnRouter.verifyRegistration.useMutation();
    const getAuthenticationOptions = api.webAuthnRouter.getAuthenticationOptions.useMutation();
    const verifyAuthentication = api.webAuthnRouter.verifyAuthentication.useMutation();

    // Check WebAuthn support on mount
    useEffect(() => {
        const checkSupport = async () => {
            const info = await webAuthnClient.getAuthenticatorInfo();
            setWebAuthnInfo({
                isSupported: webAuthnClient.isSupported(),
                ...info,
            });
        };

        checkSupport();
    }, []);

    // Register a new WebAuthn credential
    const register = useCallback(async (): Promise<boolean> => {
        if (!options.userId || !options.userName || !options.userDisplayName) {
            toast.error('User information is required for registration');
            return false;
        }

        if (!webAuthnInfo.isSupported) {
            toast.error('WebAuthn is not supported in this browser');
            return false;
        }

        setIsRegistering(true);

        try {
            // Get registration options from server
            const optionsResult = await getRegistrationOptions.mutateAsync({
                userId: options.userId,
                userName: options.userName,
                userDisplayName: options.userDisplayName,
            });

            if (!optionsResult.success) {
                throw new Error('Failed to get registration options');
            }

            // Create credential using WebAuthn
            const credential = await webAuthnClient.register(optionsResult.options);

            // Convert credential to JSON format for server
            const credentialJSON = webAuthnClient.credentialToJSON(credential);

            // Verify registration on server
            const verificationResult = await verifyRegistration.mutateAsync({
                credential: credentialJSON,
                challenge: optionsResult.options.challenge,
                userId: options.userId,
            });

            if (verificationResult.success) {
                toast.success('Biometric authentication set up successfully!');
                return true;
            } else {
                throw new Error('Registration verification failed');
            }
        } catch (error) {
            console.error('WebAuthn registration failed:', error);

            if (error instanceof Error) {
                toast.error(error.message);
            } else {
                toast.error('Failed to set up biometric authentication');
            }

            return false;
        } finally {
            setIsRegistering(false);
        }
    }, [
        options.userId,
        options.userName,
        options.userDisplayName,
        webAuthnInfo.isSupported,
        getRegistrationOptions,
        verifyRegistration,
    ]);

    // Authenticate with WebAuthn
    const authenticate = useCallback(async (userId?: string): Promise<{ success: boolean; user?: any }> => {
        if (!webAuthnInfo.isSupported) {
            toast.error('WebAuthn is not supported in this browser');
            return { success: false };
        }

        setIsAuthenticating(true);

        try {
            // Get authentication options from server
            const optionsResult = await getAuthenticationOptions.mutateAsync({
                userId,
            });

            if (!optionsResult.success) {
                throw new Error('Failed to get authentication options');
            }

            // Get credential using WebAuthn
            const credential = await webAuthnClient.authenticate(optionsResult.options);

            // Convert credential to JSON format for server
            const credentialJSON = webAuthnClient.credentialToJSON(credential);

            // Verify authentication on server
            const verificationResult = await verifyAuthentication.mutateAsync({
                credential: credentialJSON,
                challenge: optionsResult.options.challenge,
            });

            if (verificationResult.success) {
                toast.success('Authentication successful!');
                return {
                    success: true,
                    user: verificationResult.user,
                };
            } else {
                throw new Error('Authentication verification failed');
            }
        } catch (error) {
            console.error('WebAuthn authentication failed:', error);

            if (error instanceof Error) {
                toast.error(error.message);
            } else {
                toast.error('Authentication failed');
            }

            return { success: false };
        } finally {
            setIsAuthenticating(false);
        }
    }, [
        webAuthnInfo.isSupported,
        getAuthenticationOptions,
        verifyAuthentication,
    ]);

    // Get user-friendly authenticator description
    const getAuthenticatorDescription = useCallback((): string => {
        if (!webAuthnInfo.isSupported) {
            return 'Not supported';
        }

        if (webAuthnInfo.supportedAuthenticators.length === 0) {
            return 'No authenticators available';
        }

        const primary = webAuthnInfo.supportedAuthenticators[0]!;
        const hasMultiple = webAuthnInfo.supportedAuthenticators.length > 1;

        if (hasMultiple) {
            return `${primary} and ${webAuthnInfo.supportedAuthenticators.length - 1} other method${webAuthnInfo.supportedAuthenticators.length > 2 ? 's' : ''}`;
        }

        return primary;
    }, [webAuthnInfo]);

    return {
        // State
        webAuthnInfo,
        isRegistering,
        isAuthenticating,

        // Actions
        register,
        authenticate,

        // Utilities
        getAuthenticatorDescription,

        // Loading states from tRPC
        isLoadingOptions: getRegistrationOptions.isPending || getAuthenticationOptions.isPending,
        isVerifying: verifyRegistration.isPending || verifyAuthentication.isPending,
    };
}
