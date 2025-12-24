"use client"

import { useState } from "react"
import Image from "next/image"
import { AlertCircle, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { useTranslations } from "@/lib/use-translations"
import { useAuth } from "@/components/auth-context"
import ConfirmEmailModal from "@/components/confirm-email-modal"
import { useAuthModal } from "./auth-modal-context"
import supabase from "@/lib/supabase"

export function SignupModal() {
    const [username, setUsername] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [isOAuthLoading, setIsOAuthLoading] = useState(false)
    const [showConfirmEmail, setShowConfirmEmail] = useState(false)

    const { t } = useTranslations()
    const { signup } = useAuth()
    const { isSignupModalOpen, closeSignupModal, switchToLogin } = useAuthModal()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")

        if (password.length < 6) {
            setError(t("signup.passwordMinLength"))
            return
        }

        setIsLoading(true)
        try {
            const success = await signup(username, email, password)
            if (success) {
                setShowConfirmEmail(true)
            } else {
                setError(t("signup.emailInUse"))
            }
        } catch (err) {
            console.error(err)
            setError(t("signup.errorOccurred"))
        } finally {
            setIsLoading(false)
        }
    }

    const handleGoogleSignup = async () => {
        setIsOAuthLoading(true)
        setError("")
        try {
            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: "google",
                options: {
                    redirectTo: `${window.location.origin}/auth/callback`,
                    queryParams: {
                        access_type: "offline",
                        prompt: "consent",
                    },
                },
            })

            if (error) {
                setError(t("signup.oauthError") || "Failed to signup with Google")
                setIsOAuthLoading(false)
            }
        } catch (err) {
            setError(t("signup.oauthError") || "An error occurred")
            setIsOAuthLoading(false)
            console.error(err)
        }
    }

    const handleDiscordSignup = async () => {
        setIsOAuthLoading(true)
        setError("")
        try {
            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: "discord",
                options: {
                    redirectTo: `${window.location.origin}/auth/callback`,
                },
            })

            if (error) {
                setError(t("signup.oauthError") || "Failed to signup with Discord")
                setIsOAuthLoading(false)
            }
        } catch (err) {
            setError(t("signup.oauthError") || "An error occurred")
            setIsOAuthLoading(false)
            console.error(err)
        }
    }

    const handleTwitterSignup = async () => {
        setIsOAuthLoading(true)
        setError("")
        try {
            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: "twitter",
                options: {
                    redirectTo: `${window.location.origin}/auth/callback`,
                },
            })

            if (error) {
                setError(t("signup.oauthError") || "Failed to signup with Twitter/X")
                setIsOAuthLoading(false)
            }
        } catch (err) {
            setError(t("signup.oauthError") || "An error occurred")
            setIsOAuthLoading(false)
            console.error(err)
        }
    }

    return (
        <>
            <Dialog open={isSignupModalOpen} onOpenChange={closeSignupModal}>
                <DialogContent className="max-w-3xl p-0 bg-[#1E1E1E] border-[#252525] rounded-lg grid grid-cols-1 md:grid-cols-2 max-h-[90vh] overflow-y-auto">
                    <div className="relative h-64 md:h-full w-full hidden md:block">
                        <Image
                            src="/signup-placeholder.jpeg"
                            alt="Registreringsbild"
                            fill
                            className="object-cover rounded-l-lg"
                        />
                    </div>
                    <div className="relative p-4 sm:p-6 md:p-8">
                        <DialogTitle className="sr-only">{t("auth.createAccount")}</DialogTitle>

                        <div className="text-center mb-6 sm:mb-8">
                            <h1 className="text-xl sm:text-2xl font-bold text-white mb-2">{t("auth.createAccount")}</h1>
                        </div>

                        {error && (
                            <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-lg mb-6 flex items-center">
                                <AlertCircle className="h-5 w-5 mr-2" />
                                <span>{error}</span>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label htmlFor="username-signup" className="block text-sm font-medium text-gray-300">
                                    {t("signup.username")}
                                </label>
                                <Input
                                    id="username-signup"
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                    className="bg-card border-border text-foreground focus:ring-primary focus:border-primary"
                                    placeholder={t("signup.username")}
                                />
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="email-signup" className="block text-sm font-medium text-gray-300">
                                    {t("login.emailLabel")}
                                </label>
                                <Input
                                    id="email-signup"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="bg-card border-border text-foreground focus:ring-primary focus:border-primary"
                                    placeholder={t("login.emailPlaceholder")}
                                />
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="password-signup" className="block text-sm font-medium text-gray-300">
                                    {t("login.passwordLabel")}
                                </label>
                                <Input
                                    id="password-signup"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="bg-card border-border text-foreground focus:ring-primary focus:border-primary"
                                    placeholder={t("login.passwordPlaceholder")}
                                />
                                <p className="text-xs text-muted-foreground">{t("signup.passwordHint")}</p>
                            </div>

                            <div>
                                <Button
                                    type="submit"
                                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-5"
                                    disabled={isLoading}
                                >
                                    {isLoading ? t("signup.submitting") : t("auth.createAccount")}
                                </Button>
                            </div>
                        </form>

                        <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-gray-600" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-[#1E1E1E] px-2 text-muted-foreground">{t("signup.orContinueWith")}</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                            <Button
                                variant="outline"
                                className="w-full bg-white text-black hover:bg-gray-200"
                                onClick={handleGoogleSignup}
                                disabled={isOAuthLoading}
                                type="button"
                            >
                                Google
                            </Button>
                            <Button
                                variant="outline"
                                className="w-full bg-[#5865F2] text-white hover:bg-[#4752C4]"
                                onClick={handleDiscordSignup}
                                disabled={isOAuthLoading}
                                type="button"
                            >
                                Discord
                            </Button>
                            <Button
                                variant="outline"
                                className="w-full bg-black text-white border-gray-600 hover:bg-gray-900"
                                onClick={handleTwitterSignup}
                                disabled={isOAuthLoading}
                                type="button"
                            >
                                X
                            </Button>
                        </div>

                        <div className="mt-6 text-center text-sm">
                            <p className="text-muted-foreground">
                                {t("signup.haveAccount")} {" "}
                                <button onClick={switchToLogin} className="text-primary hover:underline">
                                    {t("auth.login")}
                                </button>
                            </p>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
            <ConfirmEmailModal
                email={email}
                open={showConfirmEmail}
                onClose={() => setShowConfirmEmail(false)}
                onResend={async () => {
                    await signup(username, email, password)
                }}
                onSignIn={switchToLogin}
            />
        </>
    )
}