"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { addUserAnswer } from "@/firebase/firestore";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Toast } from "@/components/ui/Toast";

interface QuestionFlowProps {
  dilemmaId: string;
  user: "user1" | "user2";
}

const mockQuestions = [
  "Qual é o maior desafio desse dilema para você?",
  "O que você espera alcançar ao resolvê-lo?",
  "Quais sentimentos esse dilema desperta?",
  "O que te impede de tomar uma decisão?",
  "Como esse dilema afeta outras pessoas?",
];

export const QuestionFlow: React.FC<QuestionFlowProps> = ({ dilemmaId, user }) => {
  const [step, setStep] = useState(0);
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; message: string; type: "success" | "error" }>({ show: false, message: "", type: "success" });
  const [finished, setFinished] = useState(false);

  const questions = mockQuestions; // depois integrar com n8n

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!answer.trim()) {
      setToast({ show: true, message: "Responda antes de avançar.", type: "error" });
      return;
    }
    setLoading(true);
    try {
      await addUserAnswer(dilemmaId, user, {
        question: questions[step],
        answer,
        step,
      });
      setAnswer("");
      if (step < questions.length - 1) {
        setStep((s) => s + 1);
      } else {
        setFinished(true);
      }
    } catch (err) {
      setToast({ show: true, message: "Erro ao salvar resposta.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  if (finished) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-8">
        <h3 className="text-xl font-bold text-blue-700">Parabéns!</h3>
        <p className="text-gray-700 text-center">Você concluiu todas as perguntas. Aguarde o outro participante ou avance para o próximo passo.</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg mx-auto">
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col gap-6"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">Pergunta {step + 1} de {questions.length}</span>
            <span className="text-xs text-gray-400">{user === "user1" ? "Você (Criador)" : "Você (Convidado)"}</span>
          </div>
          <h3 className="text-lg font-bold text-gray-800 mb-2">{questions[step]}</h3>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <textarea
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:outline-none text-gray-800 bg-white shadow-sm transition min-h-[80px] resize-none"
              placeholder="Digite sua resposta..."
              value={answer}
              onChange={e => setAnswer(e.target.value)}
              maxLength={400}
              required
              disabled={loading}
            />
            <Button type="submit" loading={loading} className="w-full font-bold" variant="primary">
              {step < questions.length - 1 ? "Próxima" : "Finalizar"}
            </Button>
          </form>
        </motion.div>
      </AnimatePresence>
      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, show: false })}
      />
    </div>
  );
}; 