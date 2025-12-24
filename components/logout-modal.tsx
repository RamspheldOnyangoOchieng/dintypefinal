"use client"

import { useAuth } from "@/components/auth-context"
import { useAuthModal } from "./auth-modal-context"
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter, DialogHeader } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useTranslations } from "@/lib/use-translations"

export function LogoutModal() {
    const { logout } = useAuth()
    const { isLogoutModalOpen, closeLogoutModal } = useAuthModal()
    const { t } = useTranslations()

    const handleLogout = async () => {
        await logout()
        closeLogoutModal()
    }

    return (
        <Dialog open={isLogoutModalOpen} onOpenChange={closeLogoutModal}>
            <DialogContent className="sm:max-w-md bg-[#1E1E1E] border-[#252525]">
                <DialogHeader>
                    <DialogTitle>{t("auth.logout")}</DialogTitle>
                    <DialogDescription>
                        {t("auth.logoutConfirmation")}
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="sm:justify-end gap-2">
                    <Button variant="outline" onClick={closeLogoutModal} className="border-[#252525] hover:bg-[#252525]">
                        {t("general.cancel")}
                    </Button>
                    <Button variant="destructive" onClick={handleLogout}>
                        {t("auth.logout")}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
