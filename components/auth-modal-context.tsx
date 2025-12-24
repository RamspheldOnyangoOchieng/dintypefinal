"use client"

import type React from "react"
import { createContext, useContext, useState } from "react"

interface AuthModalContextType {
    isLoginModalOpen: boolean
    isSignupModalOpen: boolean
    isLogoutModalOpen: boolean
    openLoginModal: () => void
    closeLoginModal: () => void
    openSignupModal: () => void
    closeSignupModal: () => void
    openLogoutModal: () => void
    closeLogoutModal: () => void
    switchToSignup: () => void
    switchToLogin: () => void
}

const AuthModalContext = createContext<AuthModalContextType | undefined>(undefined)

export function AuthModalProvider({ children }: { children: React.ReactNode }) {
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
    const [isSignupModalOpen, setIsSignupModalOpen] = useState(false)
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false)

    const openLoginModal = () => setIsLoginModalOpen(true)
    const closeLoginModal = () => setIsLoginModalOpen(false)

    const openSignupModal = () => setIsSignupModalOpen(true)
    const closeSignupModal = () => setIsSignupModalOpen(false)

    const openLogoutModal = () => setIsLogoutModalOpen(true)
    const closeLogoutModal = () => setIsLogoutModalOpen(false)

    const switchToSignup = () => {
        closeLoginModal()
        openSignupModal()
    }

    const switchToLogin = () => {
        closeSignupModal()
        openLoginModal()
    }

    return (
        <AuthModalContext.Provider
            value={{
                isLoginModalOpen,
                isSignupModalOpen,
                isLogoutModalOpen,
                openLoginModal,
                closeLoginModal,
                openSignupModal,
                closeSignupModal,
                openLogoutModal,
                closeLogoutModal,
                switchToSignup,
                switchToLogin,
            }}
        >
            {children}
        </AuthModalContext.Provider>
    )
}

export function useAuthModal() {
    const context = useContext(AuthModalContext)
    if (context === undefined) {
        throw new Error("useAuthModal must be used within an AuthModalProvider")
    }
    return context
}