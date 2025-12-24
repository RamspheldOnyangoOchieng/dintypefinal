"use client"

import { LoginModal } from "./login-modal"
import { SignupModal } from "./signup-modal"
import { LogoutModal } from "./logout-modal"

export function AuthModals() {
    return (
        <>
            <LoginModal />
            <SignupModal />
            <LogoutModal />
        </>
    )
}