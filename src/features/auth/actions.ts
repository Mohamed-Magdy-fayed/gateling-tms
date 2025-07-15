import { signIn, signOut } from "next-auth/react";

export async function signInAction() {
    await signIn("passkey")
}

export async function signOutAction() {
    await signOut()
}
