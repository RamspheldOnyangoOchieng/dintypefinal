"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/components/auth-context"
import { AlertCircle, X, Eye, EyeOff } from "lucide-react"
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import Link from "next/link"
import { useAuthModal } from "./auth-modal-context"
import Image from "next/image"
import { useTranslations } from "@/lib/use-translations"
import { createClient } from "@/utils/supabase/client"

const supabase = createClient()
import { toast } from "sonner"

export function LoginModal() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [isOAuthLoading, setIsOAuthLoading] = useState(false)
    const { login } = useAuth()
    const { t } = useTranslations()
    const { isLoginModalOpen, closeLoginModal, switchToSignup } = useAuthModal()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        setIsLoading(true)

        try {
            const success = await login(email, password)
            if (success) {
                toast.success(t("general.success"))
                closeLoginModal()
            } else {
                const errorMessage = t("login.invalidCredentials")
                setError(errorMessage)
                toast.error(errorMessage)
            }
        } catch (err) {
            const errorMessage = t("login.loginError")
            setError(errorMessage)
            toast.error(errorMessage)
            console.error(err)
        } finally {
            setIsLoading(false)
        }
    }

    const handleGoogleLogin = async () => {
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
                const errorMessage = t("login.oauthError") || "Failed to login with Google"
                setError(errorMessage)
                toast.error(errorMessage)
                setIsOAuthLoading(false)
            }
            // User will be redirected to Google
        } catch (err) {
            const errorMessage = t("login.oauthError") || "An error occurred"
            setError(errorMessage)
            toast.error(errorMessage)
            setIsOAuthLoading(false)
            console.error(err)
        }
    }

    const handleDiscordLogin = async () => {
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
                const errorMessage = t("login.oauthError") || "Failed to login with Discord"
                setError(errorMessage)
                toast.error(errorMessage)
                setIsOAuthLoading(false)
            }
        } catch (err) {
            const errorMessage = t("login.oauthError") || "An error occurred"
            setError(errorMessage)
            toast.error(errorMessage)
            setIsOAuthLoading(false)
            console.error(err)
        }
    }

    const handleTwitterLogin = async () => {
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
                const errorMessage = t("login.oauthError") || "Failed to login with Twitter/X"
                setError(errorMessage)
                toast.error(errorMessage)
                setIsOAuthLoading(false)
            }
        } catch (err) {
            const errorMessage = t("login.oauthError") || "An error occurred"
            setError(errorMessage)
            toast.error(errorMessage)
            setIsOAuthLoading(false)
            console.error(err)
        }
    }

    return (
        <Dialog open={isLoginModalOpen} onOpenChange={closeLoginModal}>
            <DialogContent className="max-w-3xl p-0 bg-[#1E1E1E] border-[#252525] rounded-lg grid grid-cols-1 md:grid-cols-2 max-h-[90vh] overflow-y-auto">
                <div className="relative h-64 md:h-full w-full hidden md:block">
                    <Image
                        src="/login-placeholder.jpeg"
                        alt="Inloggningsbild"
                        layout="fill"
                        objectFit="cover"
                        className="rounded-l-lg"
                    />
                </div>
                <div className="relative p-4 sm:p-6 md:p-8">
                    <DialogTitle className="sr-only">{t("auth.login")}</DialogTitle>
                    <DialogDescription className="sr-only">Vänligen logga in på ditt konto för att fortsätta.</DialogDescription>

                    <div className="text-center mb-6 sm:mb-8">
                        <h1 className="text-xl sm:text-2xl font-bold text-white mb-2">{t("auth.login")}</h1>
                    </div>

                    {error && (
                        <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-lg mb-6 flex items-center">
                            <AlertCircle className="h-5 w-5 mr-2" />
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label
                                htmlFor="email-login"
                                className="block text-sm font-medium text-gray-300"
                            >
                                {t("login.emailLabel")}
                            </label>
                            <Input
                                id="email-login"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="bg-[#2a2a2a] border-[#404040] text-white placeholder:text-gray-500 focus:ring-primary focus:border-primary focus:bg-[#333]"
                                placeholder={t("login.emailPlaceholder")}
                            />
                        </div>

                        <div className="space-y-2">
                            <label
                                htmlFor="password-login"
                                className="block text-sm font-medium text-gray-300"
                            >
                                {t("login.passwordLabel")}
                            </label>
                            <div className="relative">
                                <Input
                                    id="password-login"
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="bg-[#2a2a2a] border-[#404040] text-white placeholder:text-gray-500 focus:ring-primary focus:border-primary pr-10 focus:bg-[#333]"
                                    placeholder={t("login.passwordPlaceholder")}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white"
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-5 w-5" />
                                    ) : (
                                        <Eye className="h-5 w-5" />
                                    )}
                                </button>
                            </div>
                            <div className="text-right">
                                <Link
                                    href={{ pathname: "/reset-password", query: email ? { email } : {} }}
                                    className="text-sm text-primary hover:underline"
                                    onClick={closeLoginModal}
                                >
                                    {t("login.forgotPassword")}
                                </Link>
                            </div>
                        </div>

                        <div>
                            <Button
                                type="submit"
                                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-5"
                                disabled={isLoading}
                            >
                                {isLoading ? t("login.submitting") : t("auth.login")}
                            </Button>
                        </div>
                    </form>

                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-gray-600" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-[#1E1E1E] px-2 text-muted-foreground">{t("login.orLoginWith")}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        <Button
                            variant="outline"
                            className="w-full bg-white text-black hover:bg-gray-200"
                            onClick={handleGoogleLogin}
                            disabled={isOAuthLoading}
                            type="button"
                        >
                            Google
                        </Button>
                        <Button
                            variant="outline"
                            className="w-full bg-[#5865F2] text-white hover:bg-[#4752C4]"
                            onClick={handleDiscordLogin}
                            disabled={isOAuthLoading}
                            type="button"
                        >
                            Discord
                        </Button>
                        <Button
                            variant="outline"
                            className="w-full bg-black text-white border-gray-600 hover:bg-gray-900"
                            onClick={handleTwitterLogin}
                            disabled={isOAuthLoading}
                            type="button"
                        >
                            X
                        </Button>
                    </div>

                    <div className="mt-6 text-center text-sm">
                        <p className="text-muted-foreground">
                            {t("login.noAccount")} {" "}
                            <button onClick={switchToSignup} className="text-primary hover:underline">
                                {t("auth.createAccount")}
                            </button>
                        </p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}