"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface ConfirmEmailModalProps {
  email: string;
  onBack?: () => void;
  onResend?: () => Promise<void>;
  onSignIn?: () => void;
  open: boolean;
  onClose: () => void;
}

import { X } from "lucide-react";

export default function ConfirmEmailModal({
  email,
  onBack,
  onResend,
  onSignIn,
  open,
  onClose,
}: ConfirmEmailModalProps) {
  const [timer, setTimer] = useState(15);
  const [resending, setResending] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    setTimer(15);
    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [open]);

  const handleResend = async () => {
    if (onResend) {
      setResending(true);
      try {
        await onResend();
        toast.success("Bekräftelselänk skickad!");
        setTimer(15);
      } catch (error) {
        toast.error("Kunde inte skicka länk");
      } finally {
        setResending(false);
      }
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-70 cursor-pointer"
      onClick={onClose}
    >
      <div
        className="bg-[#232323] rounded-xl shadow-lg w-full max-w-md flex flex-col overflow-hidden relative cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="flex flex-col items-center justify-center p-8">
          <div className="w-full flex justify-center mb-6">
            <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-[#333]">
              <Image
                src="/signup-placeholder.jpeg"
                alt="DINTYP.SE"
                fill
                className="object-cover"
              />
            </div>
          </div>
          <h2 className="text-2xl font-bold mb-2 text-white">Bekräfta din e-mail</h2>
          <p className="text-gray-300 text-center mb-2">
            Vi har skickat en bekräftelselänk till <span className="font-semibold text-blue-400">{email}</span>.<br />
            Om du inte ser den, kontrollera din skräppost.
          </p>
          <div className="text-sm text-gray-400 mb-4">00:{timer.toString().padStart(2, "0")}</div>
          <Button
            className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white w-full mb-2"
            onClick={handleResend}
            disabled={timer > 0 || resending}
          >
            {resending ? "Skickar..." : "Skicka länken igen"}
          </Button>
          <div className="border-t border-[#333] pt-4 mt-4 text-center w-full">
            <span className="text-gray-400">Har du redan ett konto?</span>
            <button
              className="text-blue-400 underline ml-1"
              onClick={onSignIn || (() => router.push("/login"))}
            >
              Logga in
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
