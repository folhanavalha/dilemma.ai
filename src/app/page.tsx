"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { motion } from "framer-motion";
import { Avatar } from "@/components/ui/Avatar";
import { BeamsBackground } from "@/components/ui/beams-background";
import Link from "next/link";

export default function HomePage() {
  const router = useRouter();

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
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="w-full max-w-md bg-white/90 rounded-3xl shadow-2xl p-8 flex flex-col items-center relative"
        >
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-3xl font-extrabold text-gray-800 mb-2 text-center drop-shadow font-serif"
          >
            Bem-vindo ao <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500">dilemma.ai</span>
          </motion.h1>
          <p className="text-gray-700 text-center mb-8 font-medium">Resolva grandes dilemas de forma colaborativa, profunda e divertida.</p>
          <div className="flex flex-col gap-4 w-full">
            <Button
              className="w-full text-lg font-bold shadow-lg bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 hover:from-pink-500 hover:to-blue-600 transition-colors"
              onClick={() => router.push("/create")}
            >
              Criar novo dilema
            </Button>
            <Button
              className="w-full text-lg font-bold shadow-lg bg-white text-blue-600 border-2 border-blue-600 hover:bg-blue-50 transition-colors"
              variant="secondary"
              onClick={() => router.push("/join")}
            >
              Entrar em um dilema
            </Button>
          </div>
          <div className="mt-8 text-xs text-gray-400 text-center">
            <span>Profundo, emocional, sério — mas com cara de jornada!</span>
          </div>
        </motion.div>
      </div>
    </BeamsBackground>
  );
}
