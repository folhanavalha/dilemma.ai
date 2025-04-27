"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Toast } from "@/components/ui/Toast";
import { db } from "@/firebase/config";
import { collection, doc, setDoc, serverTimestamp } from "firebase/firestore";
import Link from "next/link";
import { Copy } from "lucide-react";

function generateRoomId() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let id = "";
  for (let i = 0; i < 7; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return id;
}

export default function CreateDilemmaPage() {
  const [dilemmaName, setDilemmaName] = useState("");
  const [userName, setUserName] = useState("");
  const [userIntro, setUserIntro] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; message: string; type: "success" | "error" }>({ show: false, message: "", type: "success" });
  const [roomId, setRoomId] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const router = useRouter();

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1200);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dilemmaName.trim() || !userName.trim() || !userIntro.trim()) {
      setToast({ show: true, message: "Preencha todos os campos.", type: "error" });
      return;
    }
    setLoading(true);
    const newRoomId = generateRoomId();
    try {
      await setDoc(doc(db, "dilemmas", newRoomId), {
        title: dilemmaName,
        createdAt: serverTimestamp(),
        status: "waiting_for_user2",
        ready_for_context_questions: false,
      });
      await setDoc(doc(db, `dilemmas/${newRoomId}/users/user1`), {
        name: userName,
        intro: userIntro,
        joinedAt: serverTimestamp(),
      });
      setRoomId(newRoomId);
    } catch (err) {
      setToast({ show: true, message: "Erro ao criar sala. Tente novamente.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  if (roomId) {
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    const linkUser1 = `${baseUrl}/dilemma/${roomId}?user=user1`;
    const linkUser2 = `${baseUrl}/dilemma/${roomId}?user=user2`;
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <Link href="/" className="mb-8 z-20">
          <img
            src="https://adapta-one-generated-images-prod.s3.sa-east-1.amazonaws.com/juan%40adapta.org%2Fe42c6a3b-cfe4-4c80-b0ef-d776bc3d4053%2F1745725344650.png"
            alt="Logo dilemma.ai"
            className="w-20 h-20 object-contain rounded-full shadow-lg border-4 border-white bg-white"
          />
        </Link>
        <div className="w-full max-w-2xl bg-white/90 rounded-3xl shadow-2xl p-8 flex flex-col items-center relative">
          <h2 className="text-2xl font-bold text-blue-700 text-center mb-2">Sala criada!</h2>
          <p className="text-gray-700 text-center mb-6">Compartilhe o código ou o link abaixo com seu parceiro:</p>
          <div className="flex flex-col items-center gap-2 mb-6">
            <span className="text-3xl font-mono font-bold tracking-widest bg-gray-100 px-6 py-3 rounded-lg border border-gray-300 shadow text-black">{roomId}</span>
            <span className="text-xs text-gray-500">Código da sala</span>
          </div>
          <div className="flex flex-col gap-4 w-full max-w-lg mb-4">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-semibold text-gray-700">Link para você (user1):</span>
              <div className="flex items-center gap-2">
                <input className="w-full px-2 py-2 rounded border text-xs bg-gray-100 shadow text-black" value={linkUser1} readOnly onFocus={e => e.target.select()} />
                <button type="button" onClick={() => handleCopy(linkUser1, "user1")} className="p-2 rounded hover:bg-blue-100 transition">
                  {copied === "user1" ? <span className="text-green-600 text-xs font-bold">Copiado!</span> : <Copy size={16} color="black" />}
                </button>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-sm font-semibold text-gray-700">Link para convidado (user2):</span>
              <div className="flex items-center gap-2">
                <input className="w-full px-2 py-2 rounded border text-xs bg-gray-100 shadow text-black" value={linkUser2} readOnly onFocus={e => e.target.select()} />
                <button type="button" onClick={() => handleCopy(linkUser2, "user2")} className="p-2 rounded hover:bg-blue-100 transition">
                  {copied === "user2" ? <span className="text-green-600 text-xs font-bold">Copiado!</span> : <Copy size={16} color="black" />}
                </button>
              </div>
            </div>
          </div>
          <Button className="mt-2 w-full text-lg font-bold shadow-lg" onClick={() => router.push(`/dilemma/${roomId}?user=user1`)}>Entrar na sala</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <Link href="/" className="mb-8 z-20">
        <img
          src="https://adapta-one-generated-images-prod.s3.sa-east-1.amazonaws.com/juan%40adapta.org%2Fe42c6a3b-cfe4-4c80-b0ef-d776bc3d4053%2F1745725344650.png"
          alt="Logo dilemma.ai"
          className="w-20 h-20 object-contain rounded-full shadow-lg border-4 border-white bg-white"
        />
      </Link>
      <div className="w-full max-w-2xl bg-white/90 rounded-3xl shadow-2xl p-8 flex flex-col items-center relative">
        <h2 className="text-2xl font-extrabold text-gray-800 mb-6 text-center">Criar novo dilema</h2>
        <form className="w-full flex flex-col gap-4" onSubmit={handleCreate} autoComplete="off">
          <div>
            <label htmlFor="dilemmaName" className="block text-sm font-bold text-gray-700 mb-1">Nome do dilema</label>
            <input
              id="dilemmaName"
              type="text"
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:outline-none text-gray-800 bg-white shadow-sm transition"
              placeholder="Ex: Mudar de carreira ou não?"
              value={dilemmaName}
              onChange={e => setDilemmaName(e.target.value)}
              maxLength={64}
              required
            />
          </div>
          <div>
            <label htmlFor="userName" className="block text-sm font-bold text-gray-700 mb-1">Seu nome</label>
            <input
              id="userName"
              type="text"
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:outline-none text-gray-800 bg-white shadow-sm transition"
              placeholder="Digite seu nome"
              value={userName}
              onChange={e => setUserName(e.target.value)}
              maxLength={32}
              required
            />
          </div>
          <div>
            <label htmlFor="userIntro" className="block text-sm font-bold text-gray-700 mb-1">O que eu preciso saber sobre você ou seus pensamentos para te ajudar neste dilema?</label>
            <textarea
              id="userIntro"
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:outline-none text-gray-800 bg-white shadow-sm transition min-h-[60px] resize-none"
              placeholder="Conte um pouco sobre você ou sua visão inicial..."
              value={userIntro}
              onChange={e => setUserIntro(e.target.value)}
              maxLength={300}
              required
            />
          </div>
          <Button type="submit" loading={loading} className="mt-2 w-full text-lg font-bold shadow-lg" variant="primary">
            Criar sala
          </Button>
        </form>
        <Toast
          show={toast.show}
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ ...toast, show: false })}
        />
      </div>
    </div>
  );
}
