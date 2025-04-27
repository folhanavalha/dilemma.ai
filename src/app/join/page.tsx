"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Toast } from "@/components/ui/Toast";
import { getDilemmaById } from "@/firebase/firestore";
import { motion } from "framer-motion";
import { BeamsBackground } from "@/components/ui/beams-background";
import Link from "next/link";

export default function JoinDilemmaPage() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; message: string; type: "success" | "error" }>({ show: false, message: "", type: "success" });
  const router = useRouter();

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      setToast({ show: true, message: "Digite o código do dilema.", type: "error" });
      return;
    }
    setLoading(true);
    try {
      const dilemma = await getDilemmaById(code.trim());
      if (dilemma) {
        setToast({ show: true, message: "Entrando no dilema...", type: "success" });
        setTimeout(() => router.push(`/dilemma/${code.trim()}?user=user2`), 700);
      } else {
        setToast({ show: true, message: "Código não encontrado.", type: "error" });
      }
    } catch (err) {
      setToast({ show: true, message: "Erro ao buscar dilema.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <BeamsBackground>
      <div className="min-h-screen flex flex-col items-center justify-center">
        <Link href="/" className="mb-8 z-20">
          <img
            src="https://adapta-one-generated-images-prod.s3.sa-east-1.amazonaws.com/juan%40adapta.org%2Fe42c6a3b-cfe4-4c80-b0ef-d776bc3d4053%2F1745725344650.png"
            alt="Logo dilemma.ai"
            className="w-20 h-20 object-contain rounded-full shadow-lg border-4 border-white bg-white"
          />
        </Link>
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="w-full max-w-lg bg-white/90 rounded-3xl shadow-2xl p-8 flex flex-col items-center relative"
        >
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-2xl font-extrabold text-gray-800 mb-6 mt-4 text-center"
          >
            Entrar em um dilema
          </motion.h1>
          <form className="w-full flex flex-col gap-4" onSubmit={handleJoin} autoComplete="off">
            <div>
              <label htmlFor="code" className="block text-sm font-bold text-gray-700 mb-1">Código do dilema</label>
              <input
                id="code"
                type="text"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-pink-400 focus:outline-none text-gray-800 bg-white shadow-sm transition text-center tracking-widest text-lg font-mono"
                placeholder="Ex: 8f3k2j1..."
                value={code}
                onChange={e => setCode(e.target.value)}
                maxLength={24}
                required
              />
            </div>
            <Button type="submit" loading={loading} className="mt-2 w-full text-lg font-bold shadow-lg" variant="primary">
              Entrar
            </Button>
          </form>
          <Toast
            show={toast.show}
            message={toast.message}
            type={toast.type}
            onClose={() => setToast({ ...toast, show: false })}
          />
        </motion.div>
      </div>
    </BeamsBackground>
  );
} 