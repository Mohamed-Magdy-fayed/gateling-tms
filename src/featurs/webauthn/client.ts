// WebAuthn client-side utilities
export interface WebAuthnCredential {
    id: string;
    rawId: ArrayBuffer;
    response: {
        clientDataJSON: ArrayBuffer;
        attestationObject?: ArrayBuffer;
        authenticatorData?: ArrayBuffer;
        signature?: ArrayBuffer;
        userHandle?: ArrayBuffer;
    };
    type: "public-key";
}

export interface RegistrationOptions {
    challenge: string;
    rp: {
        name: string;
        id: string;
    };
    user: {
        id: string;
        name: string;
        displayName: string;
    };
    pubKeyCredParams: Array<{
        type: "public-key";
        alg: number;
    }>;
    authenticatorSelection?: {
        authenticatorAttachment?: "platform" | "cross-platform";
        userVerification?: "required" | "preferred" | "discouraged";
        requireResidentKey?: boolean;
    };
    timeout?: number;
    attestation?: "none" | "indirect" | "direct";
}

export interface AuthenticationOptions {
    challenge: string;
    timeout?: number;
    rpId?: string;
    allowCredentials?: Array<{
        type: "public-key";
        id: string;
    }>;
    userVerification?: "required" | "preferred" | "discouraged";
}

// Helper function to convert base64url to ArrayBuffer
function base64urlToArrayBuffer(base64url: string): ArrayBuffer {
    const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, '=');
    const binary = atob(padded);
    const buffer = new ArrayBuffer(binary.length);
    const view = new Uint8Array(buffer);
    for (let i = 0; i < binary.length; i++) {
        view[i] = binary.charCodeAt(i);
    }
    return buffer;
}

// Helper function to convert ArrayBuffer to base64url
function arrayBufferToBase64url(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]!);
    }
    return btoa(binary)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
}

export class WebAuthnClient {
    private static instance: WebAuthnClient;

    static getInstance(): WebAuthnClient {
        if (!WebAuthnClient.instance) {
            WebAuthnClient.instance = new WebAuthnClient();
        }
        return WebAuthnClient.instance;
    }

    // Check if WebAuthn is supported
    isSupported(): boolean {
        return (
            typeof window !== 'undefined' &&
            'navigator' in window &&
            'credentials' in navigator &&
            'create' in navigator.credentials &&
            'get' in navigator.credentials
        );
    }

    // Check if platform authenticator (biometrics) is available
    async isPlatformAuthenticatorAvailable(): Promise<boolean> {
        if (!this.isSupported()) return false;

        try {
            return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        } catch {
            return false;
        }
    }

    // Register a new credential
    async register(options: RegistrationOptions): Promise<WebAuthnCredential> {
        if (!this.isSupported()) {
            throw new Error('WebAuthn is not supported in this browser');
        }

        try {
            // Convert base64url strings to ArrayBuffers
            const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
                challenge: base64urlToArrayBuffer(options.challenge),
                rp: options.rp,
                user: {
                    ...options.user,
                    id: base64urlToArrayBuffer(options.user.id),
                },
                pubKeyCredParams: options.pubKeyCredParams,
                authenticatorSelection: options.authenticatorSelection,
                timeout: options.timeout || 60000,
                attestation: options.attestation || 'none',
            };

            const credential = await navigator.credentials.create({
                publicKey: publicKeyCredentialCreationOptions,
            }) as PublicKeyCredential;

            if (!credential) {
                throw new Error('Failed to create credential');
            }

            const response = credential.response as AuthenticatorAttestationResponse;

            return {
                id: credential.id,
                rawId: credential.rawId,
                response: {
                    clientDataJSON: response.clientDataJSON,
                    attestationObject: response.attestationObject,
                },
                type: credential.type as "public-key",
            };
        } catch (error) {
            console.error('WebAuthn registration failed:', error);
            if (error instanceof Error) {
                if (error.name === 'NotAllowedError') {
                    throw new Error('User cancelled the registration or the operation timed out');
                } else if (error.name === 'InvalidStateError') {
                    throw new Error('This authenticator is already registered');
                } else if (error.name === 'NotSupportedError') {
                    throw new Error('This authenticator is not supported');
                }
            }
            throw new Error('Registration failed. Please try again.');
        }
    }

    // Authenticate with an existing credential
    async authenticate(options: AuthenticationOptions): Promise<WebAuthnCredential> {
        if (!this.isSupported()) {
            throw new Error('WebAuthn is not supported in this browser');
        }

        try {
            const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
                challenge: base64urlToArrayBuffer(options.challenge),
                timeout: options.timeout || 60000,
                rpId: options.rpId,
                allowCredentials: options.allowCredentials?.map(cred => ({
                    ...cred,
                    id: base64urlToArrayBuffer(cred.id),
                })),
                userVerification: options.userVerification || 'preferred',
            };

            const credential = await navigator.credentials.get({
                publicKey: publicKeyCredentialRequestOptions,
            }) as PublicKeyCredential;

            if (!credential) {
                throw new Error('Failed to get credential');
            }

            const response = credential.response as AuthenticatorAssertionResponse;

            return {
                id: credential.id,
                rawId: credential.rawId,
                response: {
                    clientDataJSON: response.clientDataJSON,
                    authenticatorData: response.authenticatorData,
                    signature: response.signature,
                    userHandle: response.userHandle ?? undefined,
                },
                type: credential.type as "public-key",
            };
        } catch (error) {
            console.error('WebAuthn authentication failed:', error);
            if (error instanceof Error) {
                if (error.name === 'NotAllowedError') {
                    throw new Error('User cancelled the authentication or the operation timed out');
                } else if (error.name === 'InvalidStateError') {
                    throw new Error('No matching credentials found');
                }
            }
            throw new Error('Authentication failed. Please try again.');
        }
    }

    // Convert credential to a format suitable for sending to server
    credentialToJSON(credential: WebAuthnCredential): any {
        return {
            id: credential.id,
            rawId: arrayBufferToBase64url(credential.rawId),
            response: {
                clientDataJSON: arrayBufferToBase64url(credential.response.clientDataJSON),
                attestationObject: credential.response.attestationObject
                    ? arrayBufferToBase64url(credential.response.attestationObject)
                    : undefined,
                authenticatorData: credential.response.authenticatorData
                    ? arrayBufferToBase64url(credential.response.authenticatorData)
                    : undefined,
                signature: credential.response.signature
                    ? arrayBufferToBase64url(credential.response.signature)
                    : undefined,
                userHandle: credential.response.userHandle
                    ? arrayBufferToBase64url(credential.response.userHandle)
                    : undefined,
            },
            type: credential.type,
        };
    }

    // Get user-friendly authenticator info
    async getAuthenticatorInfo(): Promise<{
        isPlatformAvailable: boolean;
        supportedAuthenticators: string[];
    }> {
        const isPlatformAvailable = await this.isPlatformAuthenticatorAvailable();
        const supportedAuthenticators: string[] = [];

        if (isPlatformAvailable) {
            // Detect platform type
            const userAgent = navigator.userAgent.toLowerCase();
            if (userAgent.includes('windows')) {
                supportedAuthenticators.push('Windows Hello');
            } else if (userAgent.includes('mac')) {
                supportedAuthenticators.push('Touch ID / Face ID');
            } else if (userAgent.includes('android')) {
                supportedAuthenticators.push('Fingerprint / Face Unlock');
            } else if (userAgent.includes('iphone') || userAgent.includes('ipad')) {
                supportedAuthenticators.push('Touch ID / Face ID');
            } else {
                supportedAuthenticators.push('Biometric Authentication');
            }
        }

        // External authenticators are generally supported if WebAuthn is supported
        if (this.isSupported()) {
            supportedAuthenticators.push('Security Keys (USB/NFC)');
        }

        return {
            isPlatformAvailable,
            supportedAuthenticators,
        };
    }
}

export const webAuthnClient = WebAuthnClient.getInstance();
